import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { GADataClient, DEFAULT_ROW_LIMIT } from '../src/ga-data-client.js';

vi.mock('axios');
vi.mock('google-auth-library', () => ({
  GoogleAuth: class {
    async getClient() {
      return { getAccessToken: async () => ({ token: 'test-token' }) };
    }
  },
}));

const SERVICE_ACCOUNT = '{"client_email":"test@example.com","private_key":"key"}';
const PROPERTY_ID = '123456';

describe('GADataClient', () => {
  let post: ReturnType<typeof vi.fn>;
  let get: ReturnType<typeof vi.fn>;
  let client: GADataClient;

  beforeEach(() => {
    post = vi.fn().mockResolvedValue({ data: { ok: true } });
    get = vi.fn().mockResolvedValue({ data: { ok: true } });
    vi.mocked(axios.create).mockReturnValue({
      post,
      get,
      interceptors: { request: { use: vi.fn() } },
    } as any);
    client = new GADataClient(SERVICE_ACCOUNT, PROPERTY_ID);
  });

  describe('runReport', () => {
    it('applies the default row limit when none is given', async () => {
      await client.runReport({
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'activeUsers' }],
      });

      const [url, body] = post.mock.calls[0];
      expect(url).toBe(`/v1beta/properties/${PROPERTY_ID}:runReport`);
      expect(body.limit).toBe(DEFAULT_ROW_LIMIT);
    });

    it('respects an explicit limit', async () => {
      await client.runReport({
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'activeUsers' }],
        limit: 50,
      });

      expect(post.mock.calls[0][1].limit).toBe(50);
    });
  });

  describe('runFunnelReport', () => {
    it('targets the v1alpha endpoint with the correct request shape', async () => {
      await client.runFunnelReport({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        funnelSteps: [
          { name: 'Session start', eventName: 'session_start' },
          { name: 'purchase', isDirectlyFollowedBy: true },
        ],
        funnelBreakdown: { name: 'deviceCategory' },
      });

      const [url, body] = post.mock.calls[0];
      expect(url).toBe(`/v1alpha/properties/${PROPERTY_ID}:runFunnelReport`);

      // Steps must be nested under funnel.steps, each with a filter expression
      expect(body.funnel.steps).toHaveLength(2);
      expect(body.funnel.steps[0].filterExpression).toEqual({
        funnelEventFilter: { eventName: 'session_start' },
      });
      // Without eventName, the step name is used as the event name
      expect(body.funnel.steps[1].filterExpression).toEqual({
        funnelEventFilter: { eventName: 'purchase' },
      });
      expect(body.funnel.steps[1].isDirectlyFollowedBy).toBe(true);

      // Breakdown must be wrapped in breakdownDimension
      expect(body.funnelBreakdown).toEqual({
        breakdownDimension: { name: 'deviceCategory' },
      });
      expect(body.funnelSteps).toBeUndefined();
    });

    it('preserves an explicit filterExpression per step', async () => {
      const filterExpression = {
        funnelEventFilter: {
          eventName: 'purchase',
          funnelParameterFilterExpression: {
            funnelParameterFilter: {
              eventParameterName: 'value',
              numericFilter: { operation: 'GREATER_THAN', value: { doubleValue: 100 } },
            },
          },
        },
      };

      await client.runFunnelReport({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        funnelSteps: [{ name: 'Big purchase', filterExpression }],
      });

      expect(post.mock.calls[0][1].funnel.steps[0].filterExpression).toEqual(filterExpression);
    });
  });

  describe('listProperties', () => {
    it('filters by account when an accountId is given', async () => {
      await client.listProperties('999');

      expect(get).toHaveBeenCalledWith('/properties', {
        params: { filter: 'parent:accounts/999' },
      });
    });

    it('aggregates properties across all accounts when no accountId is given', async () => {
      get.mockImplementation(async (url: string, config?: any) => {
        if (url === '/accounts') {
          return { data: { accounts: [{ name: 'accounts/1' }, { name: 'accounts/2' }] } };
        }
        const account = config.params.filter.replace('parent:accounts/', '');
        return { data: { properties: [{ name: `properties/${account}00` }] } };
      });

      const result = await client.listProperties();

      expect(result.properties).toEqual([
        { name: 'properties/100' },
        { name: 'properties/200' },
      ]);
    });
  });

  describe('batchRunReports', () => {
    it('applies the default limit to every request in the batch', async () => {
      await client.batchRunReports([
        { dateRanges: [{ startDate: 'yesterday', endDate: 'today' }], metrics: [{ name: 'sessions' }] },
        { dateRanges: [{ startDate: 'yesterday', endDate: 'today' }], metrics: [{ name: 'activeUsers' }], limit: 25 },
      ]);

      const body = post.mock.calls[0][1];
      expect(body.requests[0].limit).toBe(DEFAULT_ROW_LIMIT);
      expect(body.requests[1].limit).toBe(25);
    });
  });

  describe('error handling', () => {
    it('surfaces the API error message', async () => {
      post.mockRejectedValue({
        response: { data: { error: { message: 'Invalid dimension' } } },
        message: 'Request failed',
      });

      await expect(
        client.runReport({
          dateRanges: [{ startDate: 'yesterday', endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }],
        })
      ).rejects.toThrow('GA Data API Error: Invalid dimension');
    });
  });
});
