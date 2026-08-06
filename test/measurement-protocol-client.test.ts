import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { MeasurementProtocolClient } from '../src/measurement-protocol-client.js';

vi.mock('axios');

const MEASUREMENT_ID = 'G-TEST123';
const API_SECRET = 'secret-abc';

describe('MeasurementProtocolClient', () => {
  let post: ReturnType<typeof vi.fn>;
  let client: MeasurementProtocolClient;

  beforeEach(() => {
    post = vi.fn().mockResolvedValue({ status: 204, data: { validationMessages: [] } });
    vi.mocked(axios.create).mockReturnValue({ post } as any);
    client = new MeasurementProtocolClient(MEASUREMENT_ID, API_SECRET);
  });

  describe('sendEvent', () => {
    it('posts to the collect endpoint with credentials in the query string', async () => {
      const result = await client.sendEvent({
        client_id: 'abc.123',
        events: [{ name: 'test_event' }],
      });

      const [url] = post.mock.calls[0];
      expect(url).toBe(
        `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`
      );
      expect(result).toEqual({ success: true, statusCode: 204 });
    });
  });

  describe('validateEvent', () => {
    it('uses the debug endpoint and returns validation output', async () => {
      const result = await client.validateEvent({
        client_id: 'abc.123',
        events: [{ name: 'test_event' }],
      });

      const [url] = post.mock.calls[0];
      expect(url).toContain('https://www.google-analytics.com/debug/mp/collect');
      expect(result).toEqual({ validationMessages: [] });
    });
  });

  describe('sendPageView', () => {
    it('builds a page_view event and auto-generates a client id', async () => {
      await client.sendPageView({
        pageLocation: 'https://example.com/home',
        pageTitle: 'Home',
      });

      const [, body] = post.mock.calls[0];
      expect(body.client_id).toMatch(/^\d+\.\d+$/);
      expect(body.events).toEqual([
        {
          name: 'page_view',
          params: { page_location: 'https://example.com/home', page_title: 'Home' },
        },
      ]);
    });
  });

  describe('sendPurchase', () => {
    it('builds a purchase event with transaction details', async () => {
      await client.sendPurchase({
        clientId: 'client.1',
        transactionId: 'T-100',
        value: 99.9,
        currency: 'USD',
        tax: 5,
        items: [{ item_id: 'sku-1', item_name: 'Widget', price: 99.9, quantity: 1 }],
      });

      const [, body] = post.mock.calls[0];
      expect(body.client_id).toBe('client.1');
      expect(body.events[0].name).toBe('purchase');
      expect(body.events[0].params).toMatchObject({
        transaction_id: 'T-100',
        value: 99.9,
        currency: 'USD',
        tax: 5,
      });
      expect(body.events[0].params.items).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('surfaces the API error message', async () => {
      post.mockRejectedValue({
        response: { data: { error: { message: 'Invalid api_secret' } } },
        message: 'Request failed',
      });

      await expect(
        client.sendEvent({ client_id: 'x', events: [{ name: 'e' }] })
      ).rejects.toThrow('Measurement Protocol Error: Invalid api_secret');
    });
  });
});
