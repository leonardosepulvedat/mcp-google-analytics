import axios, { AxiosInstance } from 'axios';
import { GoogleAuth } from 'google-auth-library';
import { readFileSync } from 'fs';
import {
  RunReportRequest,
  RunPivotReportRequest,
  RunFunnelReportRequest,
} from './types.js';

/** Default row limit applied when the caller does not specify one (token efficiency). */
export const DEFAULT_ROW_LIMIT = 10;

export class GADataClient {
  private auth: GoogleAuth;
  private defaultPropertyId?: string;
  private dataClient: AxiosInstance;
  private adminClient: AxiosInstance;

  constructor(serviceAccountJson: string, defaultPropertyId?: string) {
    this.defaultPropertyId = defaultPropertyId;

    // Accept either the raw JSON string or a path to the key file
    let credentials;
    try {
      if (serviceAccountJson.trim().startsWith('{')) {
        credentials = JSON.parse(serviceAccountJson);
      } else {
        credentials = JSON.parse(readFileSync(serviceAccountJson, 'utf8'));
      }
    } catch (error) {
      throw new Error(`Failed to parse service account JSON: ${error}`);
    }

    this.auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    this.dataClient = this.createAuthorizedClient('https://analyticsdata.googleapis.com');
    this.adminClient = this.createAuthorizedClient('https://analyticsadmin.googleapis.com/v1beta');
  }

  private createAuthorizedClient(baseURL: string): AxiosInstance {
    const client = axios.create({ baseURL });
    client.interceptors.request.use(async (config) => {
      const accessToken = await this.getAccessToken();
      config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    });
    return client;
  }

  private async getAccessToken(): Promise<string> {
    const client = await this.auth.getClient();
    const tokenResponse = await client.getAccessToken();
    if (!tokenResponse.token) {
      throw new Error('Failed to get access token');
    }
    return tokenResponse.token;
  }

  /**
   * Multi-property support: a per-call propertyId overrides the configured
   * default. Accepts both "123456789" and "properties/123456789".
   */
  private resolveProperty(propertyId?: string): string {
    const id = propertyId ?? this.defaultPropertyId;
    if (!id) {
      throw new Error(
        'No property ID. Pass "propertyId" in the tool arguments or set GA_PROPERTY_ID. ' +
          'Use ga_get_account_summaries to discover available property IDs.'
      );
    }
    return id.replace(/^properties\//, '');
  }

  private wrapError(error: any, api: 'Data' | 'Admin'): Error {
    return new Error(
      `GA ${api} API Error: ${error.response?.data?.error?.message || error.message}`
    );
  }

  async runReport(request: RunReportRequest, propertyId?: string): Promise<any> {
    try {
      const response = await this.dataClient.post(
        `/v1beta/properties/${this.resolveProperty(propertyId)}:runReport`,
        { ...request, limit: request.limit ?? DEFAULT_ROW_LIMIT }
      );
      return response.data;
    } catch (error: any) {
      throw this.wrapError(error, 'Data');
    }
  }

  async runRealtimeReport(
    request: {
      dimensions?: Array<{ name: string }>;
      metrics: Array<{ name: string }>;
      dimensionFilter?: any;
      metricFilter?: any;
      limit?: number;
      orderBys?: any[];
    },
    propertyId?: string
  ): Promise<any> {
    try {
      const response = await this.dataClient.post(
        `/v1beta/properties/${this.resolveProperty(propertyId)}:runRealtimeReport`,
        { ...request, limit: request.limit ?? DEFAULT_ROW_LIMIT }
      );
      return response.data;
    } catch (error: any) {
      throw this.wrapError(error, 'Data');
    }
  }

  async runPivotReport(request: RunPivotReportRequest, propertyId?: string): Promise<any> {
    try {
      const response = await this.dataClient.post(
        `/v1beta/properties/${this.resolveProperty(propertyId)}:runPivotReport`,
        request
      );
      return response.data;
    } catch (error: any) {
      throw this.wrapError(error, 'Data');
    }
  }

  /**
   * Funnel reports are only available in the v1alpha channel of the Data API,
   * and the API expects steps nested under `funnel.steps` with a filter
   * expression per step. Steps without an explicit filter default to matching
   * an event whose name is the step's `eventName` (or `name`).
   */
  async runFunnelReport(request: RunFunnelReportRequest, propertyId?: string): Promise<any> {
    const body: Record<string, any> = {
      dateRanges: request.dateRanges,
      funnel: {
        steps: request.funnelSteps.map((step) => ({
          name: step.name,
          ...(step.isDirectlyFollowedBy !== undefined && {
            isDirectlyFollowedBy: step.isDirectlyFollowedBy,
          }),
          ...(step.withinDurationFromPriorStep && {
            withinDurationFromPriorStep: step.withinDurationFromPriorStep,
          }),
          filterExpression: step.filterExpression ?? {
            funnelEventFilter: {
              eventName: step.eventName ?? step.name,
            },
          },
        })),
      },
    };
    if (request.funnelBreakdown) {
      body.funnelBreakdown = {
        breakdownDimension: { name: request.funnelBreakdown.name },
      };
    }
    if (request.funnelVisualizationType) {
      body.funnelVisualizationType = request.funnelVisualizationType;
    }

    try {
      const response = await this.dataClient.post(
        `/v1alpha/properties/${this.resolveProperty(propertyId)}:runFunnelReport`,
        body
      );
      return response.data;
    } catch (error: any) {
      throw this.wrapError(error, 'Data');
    }
  }

  async batchRunReports(requests: RunReportRequest[], propertyId?: string): Promise<any> {
    try {
      const response = await this.dataClient.post(
        `/v1beta/properties/${this.resolveProperty(propertyId)}:batchRunReports`,
        {
          requests: requests.map((r) => ({ ...r, limit: r.limit ?? DEFAULT_ROW_LIMIT })),
        }
      );
      return response.data;
    } catch (error: any) {
      throw this.wrapError(error, 'Data');
    }
  }

  async getMetadata(propertyId?: string): Promise<any> {
    try {
      const response = await this.dataClient.get(
        `/v1beta/properties/${this.resolveProperty(propertyId)}/metadata`
      );
      return response.data;
    } catch (error: any) {
      throw this.wrapError(error, 'Data');
    }
  }

  async listAccounts(): Promise<any> {
    try {
      const response = await this.adminClient.get('/accounts');
      return response.data;
    } catch (error: any) {
      throw this.wrapError(error, 'Admin');
    }
  }

  /**
   * The Admin API requires a `filter` for properties.list, so when no account
   * is given we enumerate accessible accounts and aggregate their properties.
   */
  async listProperties(accountId?: string): Promise<any> {
    try {
      if (accountId) {
        const response = await this.adminClient.get('/properties', {
          params: { filter: `parent:accounts/${accountId}` },
        });
        return response.data;
      }

      const accountsResponse = await this.adminClient.get('/accounts');
      const accounts: Array<{ name: string }> = accountsResponse.data.accounts ?? [];
      const properties: any[] = [];
      for (const account of accounts) {
        const response = await this.adminClient.get('/properties', {
          params: { filter: `parent:${account.name}` },
        });
        properties.push(...(response.data.properties ?? []));
      }
      return { properties };
    } catch (error: any) {
      throw this.wrapError(error, 'Admin');
    }
  }

  async getProperty(propertyId?: string): Promise<any> {
    try {
      const response = await this.adminClient.get(
        `/properties/${this.resolveProperty(propertyId)}`
      );
      return response.data;
    } catch (error: any) {
      throw this.wrapError(error, 'Admin');
    }
  }

  async listDataStreams(propertyId?: string): Promise<any> {
    try {
      const response = await this.adminClient.get(
        `/properties/${this.resolveProperty(propertyId)}/dataStreams`
      );
      return response.data;
    } catch (error: any) {
      throw this.wrapError(error, 'Admin');
    }
  }

  /** Compact overview of every accessible account with its properties, in one call. */
  async getAccountSummaries(): Promise<any> {
    try {
      const response = await this.adminClient.get('/accountSummaries');
      return response.data;
    } catch (error: any) {
      throw this.wrapError(error, 'Admin');
    }
  }

  async listCustomDimensions(propertyId?: string): Promise<any> {
    try {
      const response = await this.adminClient.get(
        `/properties/${this.resolveProperty(propertyId)}/customDimensions`
      );
      return response.data;
    } catch (error: any) {
      throw this.wrapError(error, 'Admin');
    }
  }

  async listCustomMetrics(propertyId?: string): Promise<any> {
    try {
      const response = await this.adminClient.get(
        `/properties/${this.resolveProperty(propertyId)}/customMetrics`
      );
      return response.data;
    } catch (error: any) {
      throw this.wrapError(error, 'Admin');
    }
  }

  async listKeyEvents(propertyId?: string): Promise<any> {
    try {
      const response = await this.adminClient.get(
        `/properties/${this.resolveProperty(propertyId)}/keyEvents`
      );
      return response.data;
    } catch (error: any) {
      throw this.wrapError(error, 'Admin');
    }
  }

  async listGoogleAdsLinks(propertyId?: string): Promise<any> {
    try {
      const response = await this.adminClient.get(
        `/properties/${this.resolveProperty(propertyId)}/googleAdsLinks`
      );
      return response.data;
    } catch (error: any) {
      throw this.wrapError(error, 'Admin');
    }
  }

  /**
   * Checks whether a dimension/metric combination is valid for this property
   * before spending a report request on it.
   */
  async checkCompatibility(
    request: {
      dimensions?: Array<{ name: string }>;
      metrics?: Array<{ name: string }>;
      compatibilityFilter?: 'COMPATIBLE' | 'INCOMPATIBLE';
    },
    propertyId?: string
  ): Promise<any> {
    try {
      const response = await this.dataClient.post(
        `/v1beta/properties/${this.resolveProperty(propertyId)}:checkCompatibility`,
        request
      );
      return response.data;
    } catch (error: any) {
      throw this.wrapError(error, 'Data');
    }
  }
}
