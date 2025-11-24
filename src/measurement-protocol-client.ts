import axios, { AxiosInstance } from 'axios';
import { MeasurementProtocolEvent, EcommerceItem } from './types.js';

export class MeasurementProtocolClient {
  private measurementId: string;
  private apiSecret: string;
  private client: AxiosInstance;
  private baseUrl = 'https://www.google-analytics.com/mp/collect';
  private debugUrl = 'https://www.google-analytics.com/debug/mp/collect';

  constructor(measurementId: string, apiSecret: string) {
    this.measurementId = measurementId;
    this.apiSecret = apiSecret;

    this.client = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private getUrl(debug: boolean = false): string {
    const url = debug ? this.debugUrl : this.baseUrl;
    return `${url}?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`;
  }

  async sendEvent(event: MeasurementProtocolEvent, debug: boolean = false): Promise<any> {
    try {
      const url = this.getUrl(debug);
      const response = await this.client.post(url, event);

      if (debug) {
        return response.data;
      }

      return { success: true, statusCode: response.status };
    } catch (error: any) {
      throw new Error(`Measurement Protocol Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async sendBatchEvents(events: MeasurementProtocolEvent[], debug: boolean = false): Promise<any> {
    try {
      const results = await Promise.all(
        events.map((event) => this.sendEvent(event, debug))
      );
      return {
        success: true,
        results,
      };
    } catch (error: any) {
      throw new Error(`Measurement Protocol Batch Error: ${error.message}`);
    }
  }

  async validateEvent(event: MeasurementProtocolEvent): Promise<any> {
    // Use debug mode to validate
    return this.sendEvent(event, true);
  }

  async sendPageView(params: {
    clientId?: string;
    userId?: string;
    pageLocation: string;
    pageTitle?: string;
    pageReferrer?: string;
    userProperties?: Record<string, { value: string | number }>;
  }): Promise<any> {
    const eventParams: Record<string, any> = {
      page_location: params.pageLocation,
    };
    if (params.pageTitle) eventParams.page_title = params.pageTitle;
    if (params.pageReferrer) eventParams.page_referrer = params.pageReferrer;

    const event: MeasurementProtocolEvent = {
      client_id: params.clientId || this.generateClientId(),
      user_id: params.userId,
      user_properties: params.userProperties,
      events: [
        {
          name: 'page_view',
          params: eventParams,
        },
      ],
    };

    return this.sendEvent(event);
  }

  async sendPurchase(params: {
    clientId?: string;
    userId?: string;
    transactionId: string;
    value: number;
    currency: string;
    tax?: number;
    shipping?: number;
    items: EcommerceItem[];
    coupon?: string;
    affiliation?: string;
    userProperties?: Record<string, { value: string | number }>;
  }): Promise<any> {
    const eventParams: Record<string, any> = {
      transaction_id: params.transactionId,
      value: params.value,
      currency: params.currency,
      items: params.items,
    };
    if (params.tax !== undefined) eventParams.tax = params.tax;
    if (params.shipping !== undefined) eventParams.shipping = params.shipping;
    if (params.coupon) eventParams.coupon = params.coupon;
    if (params.affiliation) eventParams.affiliation = params.affiliation;

    const event: MeasurementProtocolEvent = {
      client_id: params.clientId || this.generateClientId(),
      user_id: params.userId,
      user_properties: params.userProperties,
      events: [
        {
          name: 'purchase',
          params: eventParams,
        },
      ],
    };

    return this.sendEvent(event);
  }

  async sendLogin(params: {
    clientId?: string;
    userId?: string;
    method: string;
    userProperties?: Record<string, { value: string | number }>;
  }): Promise<any> {
    const event: MeasurementProtocolEvent = {
      client_id: params.clientId || this.generateClientId(),
      user_id: params.userId,
      user_properties: params.userProperties,
      events: [
        {
          name: 'login',
          params: {
            method: params.method,
          },
        },
      ],
    };

    return this.sendEvent(event);
  }

  async sendSignUp(params: {
    clientId?: string;
    userId?: string;
    method: string;
    userProperties?: Record<string, { value: string | number }>;
  }): Promise<any> {
    const event: MeasurementProtocolEvent = {
      client_id: params.clientId || this.generateClientId(),
      user_id: params.userId,
      user_properties: params.userProperties,
      events: [
        {
          name: 'sign_up',
          params: {
            method: params.method,
          },
        },
      ],
    };

    return this.sendEvent(event);
  }

  async sendAddToCart(params: {
    clientId?: string;
    userId?: string;
    currency: string;
    value: number;
    items: EcommerceItem[];
    userProperties?: Record<string, { value: string | number }>;
  }): Promise<any> {
    const event: MeasurementProtocolEvent = {
      client_id: params.clientId || this.generateClientId(),
      user_id: params.userId,
      user_properties: params.userProperties,
      events: [
        {
          name: 'add_to_cart',
          params: {
            currency: params.currency,
            value: params.value,
            items: params.items,
          } as any,
        },
      ],
    };

    return this.sendEvent(event);
  }

  async sendBeginCheckout(params: {
    clientId?: string;
    userId?: string;
    currency: string;
    value: number;
    items: EcommerceItem[];
    coupon?: string;
    userProperties?: Record<string, { value: string | number }>;
  }): Promise<any> {
    const eventParams: Record<string, any> = {
      currency: params.currency,
      value: params.value,
      items: params.items,
    };
    if (params.coupon) eventParams.coupon = params.coupon;

    const event: MeasurementProtocolEvent = {
      client_id: params.clientId || this.generateClientId(),
      user_id: params.userId,
      user_properties: params.userProperties,
      events: [
        {
          name: 'begin_checkout',
          params: eventParams,
        },
      ],
    };

    return this.sendEvent(event);
  }

  private generateClientId(): string {
    // Generate a random client ID similar to GA's format
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000000);
    return `${timestamp}.${random}`;
  }
}
