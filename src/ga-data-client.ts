import axios, { AxiosInstance } from 'axios';
import { GoogleAuth } from 'google-auth-library';
import { readFileSync } from 'fs';
import {
  RunReportRequest,
  RunPivotReportRequest,
  RunFunnelReportRequest,
} from './types.js';

export class GADataClient {
  private auth: GoogleAuth;
  private propertyId: string;
  private client: AxiosInstance;
  private baseUrl = 'https://analyticsdata.googleapis.com/v1beta';

  constructor(serviceAccountJson: string, propertyId: string) {
    this.propertyId = propertyId;

    // Parse service account JSON
    let credentials;
    try {
      // Check if it's a file path or JSON string
      if (serviceAccountJson.startsWith('{')) {
        credentials = JSON.parse(serviceAccountJson);
      } else {
        // Assume it's a file path
        credentials = JSON.parse(readFileSync(serviceAccountJson, 'utf8'));
      }
    } catch (error) {
      throw new Error(`Failed to parse service account JSON: ${error}`);
    }

    this.auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    this.client = axios.create({
      baseURL: this.baseUrl,
    });

    // Add auth interceptor
    this.client.interceptors.request.use(async (config) => {
      const accessToken = await this.getAccessToken();
      config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    });
  }

  private async getAccessToken(): Promise<string> {
    const client = await this.auth.getClient();
    const tokenResponse = await client.getAccessToken();
    if (!tokenResponse.token) {
      throw new Error('Failed to get access token');
    }
    return tokenResponse.token;
  }

  async runReport(request: RunReportRequest): Promise<any> {
    try {
      const response = await this.client.post(
        `/properties/${this.propertyId}:runReport`,
        request
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`GA Data API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async runRealtimeReport(request: {
    dimensions?: Array<{ name: string }>;
    metrics: Array<{ name: string }>;
    dimensionFilter?: any;
    metricFilter?: any;
    limit?: number;
    orderBys?: any[];
  }): Promise<any> {
    try {
      const response = await this.client.post(
        `/properties/${this.propertyId}:runRealtimeReport`,
        request
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`GA Data API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async runPivotReport(request: RunPivotReportRequest): Promise<any> {
    try {
      const response = await this.client.post(
        `/properties/${this.propertyId}:runPivotReport`,
        request
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`GA Data API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async runFunnelReport(request: RunFunnelReportRequest): Promise<any> {
    try {
      const response = await this.client.post(
        `/properties/${this.propertyId}:runFunnelReport`,
        request
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`GA Data API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async batchRunReports(requests: RunReportRequest[]): Promise<any> {
    try {
      const response = await this.client.post(
        `/properties/${this.propertyId}:batchRunReports`,
        {
          requests,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`GA Data API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getMetadata(): Promise<any> {
    try {
      const response = await this.client.get(
        `/properties/${this.propertyId}/metadata`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`GA Data API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async listAccounts(): Promise<any> {
    try {
      const managementUrl = 'https://analyticsadmin.googleapis.com/v1beta';
      const accessToken = await this.getAccessToken();

      const response = await axios.get(`${managementUrl}/accounts`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`GA Admin API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async listProperties(accountId?: string): Promise<any> {
    try {
      const managementUrl = 'https://analyticsadmin.googleapis.com/v1beta';
      const accessToken = await this.getAccessToken();

      const filter = accountId ? `parent:accounts/${accountId}` : '';
      const response = await axios.get(`${managementUrl}/properties`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          filter,
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`GA Admin API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getProperty(): Promise<any> {
    try {
      const managementUrl = 'https://analyticsadmin.googleapis.com/v1beta';
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${managementUrl}/properties/${this.propertyId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`GA Admin API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async listDataStreams(): Promise<any> {
    try {
      const managementUrl = 'https://analyticsadmin.googleapis.com/v1beta';
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${managementUrl}/properties/${this.propertyId}/dataStreams`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`GA Admin API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}
