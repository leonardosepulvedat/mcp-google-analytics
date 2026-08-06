#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GADataClient } from './ga-data-client.js';
import { MeasurementProtocolClient } from './measurement-protocol-client.js';
import { EcommerceItemSchema } from './types.js';

const packageJson = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8')
);

// Initialize clients from environment variables
let gaDataClient: GADataClient | null = null;
let mpClient: MeasurementProtocolClient | null = null;

function initializeClients() {
  const serviceAccountJson = process.env.GA_SERVICE_ACCOUNT_JSON;
  const propertyId = process.env.GA_PROPERTY_ID;
  const measurementId = process.env.GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA_API_SECRET;

  if (serviceAccountJson && propertyId) {
    try {
      gaDataClient = new GADataClient(serviceAccountJson, propertyId);
      console.error('✓ Google Analytics Data API client initialized');
    } catch (error) {
      console.error('✗ Failed to initialize GA Data API client:', error);
    }
  } else {
    console.error('⚠ GA Data API not configured (missing GA_SERVICE_ACCOUNT_JSON or GA_PROPERTY_ID)');
  }

  if (measurementId && apiSecret) {
    try {
      mpClient = new MeasurementProtocolClient(measurementId, apiSecret);
      console.error('✓ Measurement Protocol client initialized');
    } catch (error) {
      console.error('✗ Failed to initialize Measurement Protocol client:', error);
    }
  } else {
    console.error('⚠ Measurement Protocol not configured (missing GA_MEASUREMENT_ID or GA_API_SECRET)');
  }
}

function requireDataClient(): GADataClient {
  if (!gaDataClient) {
    throw new Error('GA Data API not configured. Set GA_SERVICE_ACCOUNT_JSON and GA_PROPERTY_ID.');
  }
  return gaDataClient;
}

function requireMpClient(): MeasurementProtocolClient {
  if (!mpClient) {
    throw new Error('Measurement Protocol not configured. Set GA_MEASUREMENT_ID and GA_API_SECRET.');
  }
  return mpClient;
}

function jsonResult(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

// Shared schema fragments
const dateRangeSchema = z.object({
  startDate: z.string().describe('Start date (YYYY-MM-DD or "yesterday", "today", "7daysAgo")'),
  endDate: z.string().describe('End date (YYYY-MM-DD or "yesterday", "today", "7daysAgo")'),
  name: z.string().optional().describe('Optional name for the date range'),
});

const namedFieldSchema = z.object({ name: z.string() });

const userPropertiesSchema = z
  .record(z.object({ value: z.union([z.string(), z.number()]) }))
  .optional()
  .describe('User properties (e.g., {subscription_tier: {value: "premium"}})');

const readOnly = { readOnlyHint: true };
const sendsData = { readOnlyHint: false, openWorldHint: true };

const server = new McpServer({
  name: 'mcp-google-analytics',
  version: packageJson.version,
});

// ---------------------------------------------------------------------------
// Google Analytics Data API tools
// ---------------------------------------------------------------------------

server.registerTool(
  'ga_run_report',
  {
    description: `Run a custom Google Analytics report with dimensions and metrics.

⚠️ TOKEN OPTIMIZATION: Use 'limit' to control result size (default: 10).
This tool can consume significant tokens with large datasets.

Common dimensions: date, city, country, deviceCategory, browser, pagePath, eventName
Common metrics: activeUsers, sessions, screenPageViews, conversions, totalRevenue`,
    inputSchema: {
      dateRanges: z.array(dateRangeSchema).describe('Date ranges for the report'),
      dimensions: z.array(namedFieldSchema).optional().describe('Dimensions to group by (e.g., [{name: "date"}])'),
      metrics: z.array(namedFieldSchema).describe('Metrics to measure (e.g., [{name: "activeUsers"}])'),
      limit: z.number().int().positive().optional().describe('Maximum number of rows to return (default: 10)'),
      offset: z.number().int().nonnegative().optional().describe('Number of rows to skip (for pagination)'),
      orderBys: z.array(z.record(z.any())).optional().describe('Sorting specification'),
      dimensionFilter: z.record(z.any()).optional().describe('Dimension filter expression'),
      metricFilter: z.record(z.any()).optional().describe('Metric filter expression'),
    },
    annotations: readOnly,
  },
  async (args) => jsonResult(await requireDataClient().runReport(args as any))
);

server.registerTool(
  'ga_run_realtime_report',
  {
    description: `Get real-time Google Analytics data (last 30 minutes).

⚠️ TOKEN OPTIMIZATION: Use 'limit' to control result size (default: 10).

Common dimensions: city, country, deviceCategory, unifiedScreenName
Common metrics: activeUsers, screenPageViews, conversions`,
    inputSchema: {
      dimensions: z.array(namedFieldSchema).optional().describe('Dimensions to group by'),
      metrics: z.array(namedFieldSchema).describe('Metrics to measure'),
      limit: z.number().int().positive().optional().describe('Maximum number of rows (default: 10)'),
    },
    annotations: readOnly,
  },
  async (args) => jsonResult(await requireDataClient().runRealtimeReport(args as any))
);

server.registerTool(
  'ga_get_metadata',
  {
    description: `Get available dimensions and metrics metadata for your GA4 property.

⚠️ TOKEN OPTIMIZATION: This returns ALL available dimensions and metrics.
Response can be large (~500+ items). Use sparingly and cache results when possible.`,
    inputSchema: {},
    annotations: readOnly,
  },
  async () => jsonResult(await requireDataClient().getMetadata())
);

server.registerTool(
  'ga_list_accounts',
  {
    description: `List all Google Analytics accounts accessible to the service account.

Use this to find account IDs for listing properties.`,
    inputSchema: {},
    annotations: readOnly,
  },
  async () => jsonResult(await requireDataClient().listAccounts())
);

server.registerTool(
  'ga_list_properties',
  {
    description: `List Google Analytics properties.

Optionally filter by account ID. Without an account ID, properties from all
accessible accounts are aggregated.`,
    inputSchema: {
      accountId: z.string().optional().describe('Optional account ID to filter properties (e.g., "123456789")'),
    },
    annotations: readOnly,
  },
  async ({ accountId }) => jsonResult(await requireDataClient().listProperties(accountId))
);

server.registerTool(
  'ga_get_property',
  {
    description: 'Get details about the configured GA4 property.',
    inputSchema: {},
    annotations: readOnly,
  },
  async () => jsonResult(await requireDataClient().getProperty())
);

server.registerTool(
  'ga_list_data_streams',
  {
    description: `List data streams for the configured GA4 property.

Use this to find measurement IDs for Measurement Protocol.`,
    inputSchema: {},
    annotations: readOnly,
  },
  async () => jsonResult(await requireDataClient().listDataStreams())
);

server.registerTool(
  'ga_run_pivot_report',
  {
    description: `Run a pivot table report with row and column dimensions.

⚠️ TOKEN OPTIMIZATION: Pivot reports can be VERY large.
Limit dimensions and use small date ranges. Recommended for analysis, not raw data extraction.`,
    inputSchema: {
      dateRanges: z.array(dateRangeSchema),
      dimensions: z.array(namedFieldSchema).optional(),
      metrics: z.array(namedFieldSchema),
      pivots: z
        .array(
          z.object({
            fieldNames: z.array(z.string()),
            limit: z.number().int().positive().optional(),
          })
        )
        .describe('Pivot specifications with fieldNames'),
    },
    annotations: readOnly,
  },
  async (args) => jsonResult(await requireDataClient().runPivotReport(args as any))
);

server.registerTool(
  'ga_run_funnel_report',
  {
    description: `Run a funnel analysis report to track user progression through steps (Data API v1alpha).

Each step matches an event: set 'eventName' per step (defaults to the step name).
For advanced matching, pass a full 'filterExpression' instead.`,
    inputSchema: {
      dateRanges: z.array(dateRangeSchema),
      funnelSteps: z
        .array(
          z.object({
            name: z.string().describe('Display name for the step'),
            eventName: z.string().optional().describe('Event that defines the step (defaults to name)'),
            isDirectlyFollowedBy: z.boolean().optional(),
            withinDurationFromPriorStep: z.string().optional().describe('e.g., "3600s"'),
            filterExpression: z.record(z.any()).optional().describe('Advanced FunnelFilterExpression (overrides eventName)'),
          })
        )
        .describe('Steps in the funnel'),
      funnelBreakdown: namedFieldSchema.optional().describe('Optional dimension to break down funnel'),
      funnelVisualizationType: z.enum(['STANDARD_FUNNEL', 'TRENDED_FUNNEL']).optional(),
    },
    annotations: readOnly,
  },
  async (args) => jsonResult(await requireDataClient().runFunnelReport(args as any))
);

server.registerTool(
  'ga_batch_run_reports',
  {
    description: `Run multiple reports in a single request.

⚠️ TOKEN OPTIMIZATION: Can return LARGE amounts of data.
Limit to 2-5 reports per batch. Each report should have small limits.`,
    inputSchema: {
      requests: z.array(z.record(z.any())).describe('Array of report requests (same format as ga_run_report)'),
    },
    annotations: readOnly,
  },
  async ({ requests }) => jsonResult(await requireDataClient().batchRunReports(requests as any))
);

// ---------------------------------------------------------------------------
// Measurement Protocol tools
// ---------------------------------------------------------------------------

const eventSchema = z.object({
  name: z.string().describe('Event name (e.g., "purchase", "sign_up")'),
  params: z.record(z.any()).optional().describe('Event parameters (key-value pairs)'),
});

server.registerTool(
  'ga_send_event',
  {
    description: `Send a custom event to Google Analytics via Measurement Protocol.

Use this for tracking custom user actions, conversions, or any GA4 event.
Events are processed asynchronously and appear in reports within minutes.

Common events: click, form_submit, video_play, file_download, custom_conversion`,
    inputSchema: {
      client_id: z.string().optional().describe('Client ID (UUID format recommended). Auto-generated if not provided.'),
      user_id: z.string().optional().describe('Optional User ID for cross-device tracking'),
      events: z.array(eventSchema).describe('Events to send (can send multiple in one request)'),
      user_properties: userPropertiesSchema,
    },
    annotations: sendsData,
  },
  async (args) => jsonResult(await requireMpClient().sendEvent(args as any))
);

server.registerTool(
  'ga_validate_event',
  {
    description: `Validate an event before sending it to Google Analytics.

Uses GA4's debug endpoint to check for errors without recording the event.
Returns validation messages and errors if any.`,
    inputSchema: {
      client_id: z.string().optional(),
      user_id: z.string().optional(),
      events: z.array(eventSchema),
      user_properties: userPropertiesSchema,
    },
    annotations: readOnly,
  },
  async (args) => jsonResult(await requireMpClient().validateEvent(args as any))
);

server.registerTool(
  'ga_send_pageview',
  {
    description: `Send a page view event to Google Analytics.

Standard event for tracking page/screen views. Automatically uses 'page_view' event name.`,
    inputSchema: {
      client_id: z.string().optional().describe('Client ID (auto-generated if not provided)'),
      user_id: z.string().optional().describe('Optional User ID'),
      page_location: z.string().describe('Full URL of the page'),
      page_title: z.string().optional().describe('Page title'),
      page_referrer: z.string().optional().describe('Referrer URL'),
      user_properties: userPropertiesSchema,
    },
    annotations: sendsData,
  },
  async (args) =>
    jsonResult(
      await requireMpClient().sendPageView({
        clientId: args.client_id,
        userId: args.user_id,
        pageLocation: args.page_location,
        pageTitle: args.page_title,
        pageReferrer: args.page_referrer,
        userProperties: args.user_properties,
      })
    )
);

server.registerTool(
  'ga_send_purchase',
  {
    description: `Send an ecommerce purchase event to Google Analytics.

Standard event for tracking completed purchases with transaction details and items.`,
    inputSchema: {
      client_id: z.string().optional(),
      user_id: z.string().optional(),
      transaction_id: z.string().describe('Unique transaction ID'),
      value: z.number().describe('Total purchase value'),
      currency: z.string().describe('Currency code (e.g., USD, EUR)'),
      tax: z.number().optional().describe('Tax amount'),
      shipping: z.number().optional().describe('Shipping cost'),
      coupon: z.string().optional().describe('Coupon code used'),
      affiliation: z.string().optional().describe('Store or affiliation'),
      items: z.array(EcommerceItemSchema).describe('Purchased items'),
      user_properties: userPropertiesSchema,
    },
    annotations: sendsData,
  },
  async (args) =>
    jsonResult(
      await requireMpClient().sendPurchase({
        clientId: args.client_id,
        userId: args.user_id,
        transactionId: args.transaction_id,
        value: args.value,
        currency: args.currency,
        tax: args.tax,
        shipping: args.shipping,
        items: args.items,
        coupon: args.coupon,
        affiliation: args.affiliation,
        userProperties: args.user_properties,
      })
    )
);

server.registerTool(
  'ga_send_login',
  {
    description: `Send a login event to Google Analytics.

Standard event for tracking user logins with authentication method.`,
    inputSchema: {
      client_id: z.string().optional(),
      user_id: z.string().optional().describe('User ID (recommended for login events)'),
      method: z.string().describe('Login method (e.g., "Google", "Email", "Facebook")'),
      user_properties: userPropertiesSchema,
    },
    annotations: sendsData,
  },
  async (args) =>
    jsonResult(
      await requireMpClient().sendLogin({
        clientId: args.client_id,
        userId: args.user_id,
        method: args.method,
        userProperties: args.user_properties,
      })
    )
);

server.registerTool(
  'ga_send_signup',
  {
    description: `Send a sign-up event to Google Analytics.

Standard event for tracking new user registrations.`,
    inputSchema: {
      client_id: z.string().optional(),
      user_id: z.string().optional().describe('User ID for the new user'),
      method: z.string().describe('Sign-up method (e.g., "Google", "Email")'),
      user_properties: userPropertiesSchema,
    },
    annotations: sendsData,
  },
  async (args) =>
    jsonResult(
      await requireMpClient().sendSignUp({
        clientId: args.client_id,
        userId: args.user_id,
        method: args.method,
        userProperties: args.user_properties,
      })
    )
);

server.registerTool(
  'ga_send_add_to_cart',
  {
    description: `Send an add to cart event to Google Analytics.

Ecommerce event for tracking when items are added to shopping cart.`,
    inputSchema: {
      client_id: z.string().optional(),
      user_id: z.string().optional(),
      currency: z.string().describe('Currency code'),
      value: z.number().describe('Total value of items added'),
      items: z.array(EcommerceItemSchema).describe('Items added to cart'),
      user_properties: userPropertiesSchema,
    },
    annotations: sendsData,
  },
  async (args) =>
    jsonResult(
      await requireMpClient().sendAddToCart({
        clientId: args.client_id,
        userId: args.user_id,
        currency: args.currency,
        value: args.value,
        items: args.items,
        userProperties: args.user_properties,
      })
    )
);

server.registerTool(
  'ga_send_begin_checkout',
  {
    description: `Send a begin checkout event to Google Analytics.

Ecommerce event for tracking when users start the checkout process.`,
    inputSchema: {
      client_id: z.string().optional(),
      user_id: z.string().optional(),
      currency: z.string().describe('Currency code'),
      value: z.number().describe('Total value of cart'),
      coupon: z.string().optional().describe('Coupon code applied'),
      items: z.array(EcommerceItemSchema).describe('Items in checkout'),
      user_properties: userPropertiesSchema,
    },
    annotations: sendsData,
  },
  async (args) =>
    jsonResult(
      await requireMpClient().sendBeginCheckout({
        clientId: args.client_id,
        userId: args.user_id,
        currency: args.currency,
        value: args.value,
        items: args.items,
        coupon: args.coupon,
        userProperties: args.user_properties,
      })
    )
);

// Start server
async function main() {
  initializeClients();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Google Analytics server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
