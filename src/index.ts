#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { GADataClient } from './ga-data-client.js';
import { MeasurementProtocolClient } from './measurement-protocol-client.js';
import { z } from 'zod';

// Initialize clients
let gaDataClient: GADataClient | null = null;
let mpClient: MeasurementProtocolClient | null = null;

// Initialize clients from environment variables
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

// Define tools
const TOOLS: Tool[] = [
  // Google Analytics Data API Tools
  {
    name: 'ga_run_report',
    description: `Run a custom Google Analytics report with dimensions and metrics.

⚠️ TOKEN OPTIMIZATION: Use 'limit' to control result size (default: 10, max: 100).
Returns summarized data by default. This tool can consume significant tokens with large datasets.

Common dimensions: date, city, country, deviceCategory, browser, pagePath, eventName
Common metrics: activeUsers, sessions, screenPageViews, conversions, totalRevenue`,
    inputSchema: {
      type: 'object',
      properties: {
        dateRanges: {
          type: 'array',
          description: 'Date ranges for the report (e.g., [{startDate: "2024-01-01", endDate: "2024-01-31"}])',
          items: {
            type: 'object',
            properties: {
              startDate: { type: 'string', description: 'Start date (YYYY-MM-DD or "yesterday", "today", "7daysAgo")' },
              endDate: { type: 'string', description: 'End date (YYYY-MM-DD or "yesterday", "today", "7daysAgo")' },
              name: { type: 'string', description: 'Optional name for the date range' },
            },
            required: ['startDate', 'endDate'],
          },
        },
        dimensions: {
          type: 'array',
          description: 'Dimensions to group by (e.g., ["date", "city"])',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        },
        metrics: {
          type: 'array',
          description: 'Metrics to measure (e.g., ["activeUsers", "sessions"])',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        },
        limit: {
          type: 'number',
          description: 'Maximum number of rows to return (default: 10, recommended: 10-50 for token efficiency)',
          default: 10,
        },
        offset: {
          type: 'number',
          description: 'Number of rows to skip (for pagination)',
        },
        orderBys: {
          type: 'array',
          description: 'Sorting specification',
          items: {
            type: 'object',
          },
        },
      },
      required: ['dateRanges', 'metrics'],
    },
  },
  {
    name: 'ga_run_realtime_report',
    description: `Get real-time Google Analytics data (last 30 minutes).

⚠️ TOKEN OPTIMIZATION: Use 'limit' to control result size (default: 10).
Real-time data is updated continuously. Limit results to avoid token waste.

Common dimensions: city, country, deviceCategory, unifiedScreenName
Common metrics: activeUsers, screenPageViews, conversions`,
    inputSchema: {
      type: 'object',
      properties: {
        dimensions: {
          type: 'array',
          description: 'Dimensions to group by',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        },
        metrics: {
          type: 'array',
          description: 'Metrics to measure',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        },
        limit: {
          type: 'number',
          description: 'Maximum number of rows (default: 10)',
          default: 10,
        },
      },
      required: ['metrics'],
    },
  },
  {
    name: 'ga_get_metadata',
    description: `Get available dimensions and metrics metadata for your GA4 property.

⚠️ TOKEN OPTIMIZATION: This returns ALL available dimensions and metrics.
Response can be large (~500+ items). Use sparingly and cache results when possible.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'ga_list_accounts',
    description: `List all Google Analytics accounts accessible to the service account.

⚠️ TOKEN OPTIMIZATION: Returns summary information only.
Use this to find account IDs for listing properties.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'ga_list_properties',
    description: `List Google Analytics properties.

⚠️ TOKEN OPTIMIZATION: Returns basic property information.
Optionally filter by account ID to reduce results.`,
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'Optional account ID to filter properties (e.g., "123456789")',
        },
      },
    },
  },
  {
    name: 'ga_get_property',
    description: `Get details about the configured GA4 property.

⚠️ TOKEN OPTIMIZATION: Returns basic property metadata only.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'ga_list_data_streams',
    description: `List data streams for the configured GA4 property.

⚠️ TOKEN OPTIMIZATION: Returns summary information.
Use this to find measurement IDs for Measurement Protocol.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'ga_run_pivot_report',
    description: `Run a pivot table report with row and column dimensions.

⚠️ TOKEN OPTIMIZATION: Pivot reports can be VERY large.
Limit dimensions and use small date ranges. Recommended for analysis, not raw data extraction.`,
    inputSchema: {
      type: 'object',
      properties: {
        dateRanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              startDate: { type: 'string' },
              endDate: { type: 'string' },
            },
            required: ['startDate', 'endDate'],
          },
        },
        dimensions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        },
        pivots: {
          type: 'array',
          description: 'Pivot specifications with fieldNames',
          items: {
            type: 'object',
            properties: {
              fieldNames: { type: 'array', items: { type: 'string' } },
              limit: { type: 'number' },
            },
            required: ['fieldNames'],
          },
        },
      },
      required: ['dateRanges', 'metrics', 'pivots'],
    },
  },
  {
    name: 'ga_run_funnel_report',
    description: `Run a funnel analysis report to track user progression through steps.

⚠️ TOKEN OPTIMIZATION: Funnel reports are moderate in size.
Use specific date ranges and limit breakdown dimensions.`,
    inputSchema: {
      type: 'object',
      properties: {
        dateRanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              startDate: { type: 'string' },
              endDate: { type: 'string' },
            },
            required: ['startDate', 'endDate'],
          },
        },
        funnelSteps: {
          type: 'array',
          description: 'Steps in the funnel',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              isDirectlyFollowedBy: { type: 'boolean' },
            },
            required: ['name'],
          },
        },
        funnelBreakdown: {
          type: 'object',
          description: 'Optional dimension to break down funnel',
          properties: {
            name: { type: 'string' },
          },
        },
      },
      required: ['dateRanges', 'funnelSteps'],
    },
  },
  {
    name: 'ga_batch_run_reports',
    description: `Run multiple reports in a single request.

⚠️ TOKEN OPTIMIZATION: Can return LARGE amounts of data.
Limit to 2-5 reports per batch. Each report should have small limits.
Use only when you need related data that should be fetched together.`,
    inputSchema: {
      type: 'object',
      properties: {
        requests: {
          type: 'array',
          description: 'Array of report requests (same format as ga_run_report)',
          items: {
            type: 'object',
          },
        },
      },
      required: ['requests'],
    },
  },

  // Measurement Protocol Tools
  {
    name: 'ga_send_event',
    description: `Send a custom event to Google Analytics via Measurement Protocol.

Use this for tracking custom user actions, conversions, or any GA4 event.
Events are processed asynchronously and appear in reports within minutes.

Common events: click, form_submit, video_play, file_download, custom_conversion`,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: {
          type: 'string',
          description: 'Client ID (UUID format recommended). Auto-generated if not provided.',
        },
        user_id: {
          type: 'string',
          description: 'Optional User ID for cross-device tracking',
        },
        events: {
          type: 'array',
          description: 'Events to send (can send multiple in one request)',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Event name (e.g., "purchase", "sign_up")' },
              params: {
                type: 'object',
                description: 'Event parameters (key-value pairs)',
                additionalProperties: true,
              },
            },
            required: ['name'],
          },
        },
        user_properties: {
          type: 'object',
          description: 'User properties (e.g., {subscription_tier: {value: "premium"}})',
          additionalProperties: {
            type: 'object',
            properties: {
              value: { type: ['string', 'number'] },
            },
          },
        },
      },
      required: ['events'],
    },
  },
  {
    name: 'ga_validate_event',
    description: `Validate an event before sending it to Google Analytics.

Uses GA4's debug endpoint to check for errors without recording the event.
Returns validation messages and errors if any.`,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        user_id: { type: 'string' },
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              params: { type: 'object', additionalProperties: true },
            },
            required: ['name'],
          },
        },
        user_properties: { type: 'object', additionalProperties: true },
      },
      required: ['events'],
    },
  },
  {
    name: 'ga_send_pageview',
    description: `Send a page view event to Google Analytics.

Standard event for tracking page/screen views. Automatically uses 'page_view' event name.`,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Client ID (auto-generated if not provided)' },
        user_id: { type: 'string', description: 'Optional User ID' },
        page_location: { type: 'string', description: 'Full URL of the page' },
        page_title: { type: 'string', description: 'Page title' },
        page_referrer: { type: 'string', description: 'Referrer URL' },
        user_properties: { type: 'object', additionalProperties: true },
      },
      required: ['page_location'],
    },
  },
  {
    name: 'ga_send_purchase',
    description: `Send an ecommerce purchase event to Google Analytics.

Standard event for tracking completed purchases with transaction details and items.`,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        user_id: { type: 'string' },
        transaction_id: { type: 'string', description: 'Unique transaction ID' },
        value: { type: 'number', description: 'Total purchase value' },
        currency: { type: 'string', description: 'Currency code (e.g., USD, EUR)' },
        tax: { type: 'number', description: 'Tax amount' },
        shipping: { type: 'number', description: 'Shipping cost' },
        coupon: { type: 'string', description: 'Coupon code used' },
        affiliation: { type: 'string', description: 'Store or affiliation' },
        items: {
          type: 'array',
          description: 'Purchased items',
          items: {
            type: 'object',
            properties: {
              item_id: { type: 'string' },
              item_name: { type: 'string' },
              price: { type: 'number' },
              quantity: { type: 'number' },
              item_brand: { type: 'string' },
              item_category: { type: 'string' },
              item_variant: { type: 'string' },
            },
          },
        },
        user_properties: { type: 'object', additionalProperties: true },
      },
      required: ['transaction_id', 'value', 'currency', 'items'],
    },
  },
  {
    name: 'ga_send_login',
    description: `Send a login event to Google Analytics.

Standard event for tracking user logins with authentication method.`,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        user_id: { type: 'string', description: 'User ID (recommended for login events)' },
        method: { type: 'string', description: 'Login method (e.g., "Google", "Email", "Facebook")' },
        user_properties: { type: 'object', additionalProperties: true },
      },
      required: ['method'],
    },
  },
  {
    name: 'ga_send_signup',
    description: `Send a sign-up event to Google Analytics.

Standard event for tracking new user registrations.`,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        user_id: { type: 'string', description: 'User ID for the new user' },
        method: { type: 'string', description: 'Sign-up method (e.g., "Google", "Email")' },
        user_properties: { type: 'object', additionalProperties: true },
      },
      required: ['method'],
    },
  },
  {
    name: 'ga_send_add_to_cart',
    description: `Send an add to cart event to Google Analytics.

Ecommerce event for tracking when items are added to shopping cart.`,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        user_id: { type: 'string' },
        currency: { type: 'string', description: 'Currency code' },
        value: { type: 'number', description: 'Total value of items added' },
        items: {
          type: 'array',
          description: 'Items added to cart',
          items: {
            type: 'object',
            properties: {
              item_id: { type: 'string' },
              item_name: { type: 'string' },
              price: { type: 'number' },
              quantity: { type: 'number' },
            },
          },
        },
        user_properties: { type: 'object', additionalProperties: true },
      },
      required: ['currency', 'value', 'items'],
    },
  },
  {
    name: 'ga_send_begin_checkout',
    description: `Send a begin checkout event to Google Analytics.

Ecommerce event for tracking when users start the checkout process.`,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        user_id: { type: 'string' },
        currency: { type: 'string', description: 'Currency code' },
        value: { type: 'number', description: 'Total value of cart' },
        coupon: { type: 'string', description: 'Coupon code applied' },
        items: {
          type: 'array',
          description: 'Items in checkout',
          items: {
            type: 'object',
            properties: {
              item_id: { type: 'string' },
              item_name: { type: 'string' },
              price: { type: 'number' },
              quantity: { type: 'number' },
            },
          },
        },
        user_properties: { type: 'object', additionalProperties: true },
      },
      required: ['currency', 'value', 'items'],
    },
  },
];

// Create server
const server = new Server(
  {
    name: 'mcp-google-analytics',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Google Analytics Data API Tools
    if (name === 'ga_run_report') {
      if (!gaDataClient) {
        throw new Error('GA Data API not configured. Set GA_SERVICE_ACCOUNT_JSON and GA_PROPERTY_ID.');
      }
      const result = await gaDataClient.runReport(args as any);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === 'ga_run_realtime_report') {
      if (!gaDataClient) {
        throw new Error('GA Data API not configured. Set GA_SERVICE_ACCOUNT_JSON and GA_PROPERTY_ID.');
      }
      const result = await gaDataClient.runRealtimeReport(args as any);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === 'ga_get_metadata') {
      if (!gaDataClient) {
        throw new Error('GA Data API not configured. Set GA_SERVICE_ACCOUNT_JSON and GA_PROPERTY_ID.');
      }
      const result = await gaDataClient.getMetadata();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === 'ga_list_accounts') {
      if (!gaDataClient) {
        throw new Error('GA Data API not configured. Set GA_SERVICE_ACCOUNT_JSON and GA_PROPERTY_ID.');
      }
      const result = await gaDataClient.listAccounts();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === 'ga_list_properties') {
      if (!gaDataClient) {
        throw new Error('GA Data API not configured. Set GA_SERVICE_ACCOUNT_JSON and GA_PROPERTY_ID.');
      }
      const accountId = (args as any)?.accountId;
      const result = await gaDataClient.listProperties(accountId);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === 'ga_get_property') {
      if (!gaDataClient) {
        throw new Error('GA Data API not configured. Set GA_SERVICE_ACCOUNT_JSON and GA_PROPERTY_ID.');
      }
      const result = await gaDataClient.getProperty();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === 'ga_list_data_streams') {
      if (!gaDataClient) {
        throw new Error('GA Data API not configured. Set GA_SERVICE_ACCOUNT_JSON and GA_PROPERTY_ID.');
      }
      const result = await gaDataClient.listDataStreams();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === 'ga_run_pivot_report') {
      if (!gaDataClient) {
        throw new Error('GA Data API not configured. Set GA_SERVICE_ACCOUNT_JSON and GA_PROPERTY_ID.');
      }
      const result = await gaDataClient.runPivotReport(args as any);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === 'ga_run_funnel_report') {
      if (!gaDataClient) {
        throw new Error('GA Data API not configured. Set GA_SERVICE_ACCOUNT_JSON and GA_PROPERTY_ID.');
      }
      const result = await gaDataClient.runFunnelReport(args as any);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === 'ga_batch_run_reports') {
      if (!gaDataClient) {
        throw new Error('GA Data API not configured. Set GA_SERVICE_ACCOUNT_JSON and GA_PROPERTY_ID.');
      }
      const requests = (args as any).requests;
      const result = await gaDataClient.batchRunReports(requests);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    // Measurement Protocol Tools
    if (name === 'ga_send_event') {
      if (!mpClient) {
        throw new Error('Measurement Protocol not configured. Set GA_MEASUREMENT_ID and GA_API_SECRET.');
      }
      const result = await mpClient.sendEvent(args as any);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === 'ga_validate_event') {
      if (!mpClient) {
        throw new Error('Measurement Protocol not configured. Set GA_MEASUREMENT_ID and GA_API_SECRET.');
      }
      const result = await mpClient.validateEvent(args as any);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === 'ga_send_pageview') {
      if (!mpClient) {
        throw new Error('Measurement Protocol not configured. Set GA_MEASUREMENT_ID and GA_API_SECRET.');
      }
      const result = await mpClient.sendPageView({
        clientId: (args as any).client_id,
        userId: (args as any).user_id,
        pageLocation: (args as any).page_location,
        pageTitle: (args as any).page_title,
        pageReferrer: (args as any).page_referrer,
        userProperties: (args as any).user_properties,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === 'ga_send_purchase') {
      if (!mpClient) {
        throw new Error('Measurement Protocol not configured. Set GA_MEASUREMENT_ID and GA_API_SECRET.');
      }
      const result = await mpClient.sendPurchase({
        clientId: (args as any).client_id,
        userId: (args as any).user_id,
        transactionId: (args as any).transaction_id,
        value: (args as any).value,
        currency: (args as any).currency,
        tax: (args as any).tax,
        shipping: (args as any).shipping,
        items: (args as any).items,
        coupon: (args as any).coupon,
        affiliation: (args as any).affiliation,
        userProperties: (args as any).user_properties,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === 'ga_send_login') {
      if (!mpClient) {
        throw new Error('Measurement Protocol not configured. Set GA_MEASUREMENT_ID and GA_API_SECRET.');
      }
      const result = await mpClient.sendLogin({
        clientId: (args as any).client_id,
        userId: (args as any).user_id,
        method: (args as any).method,
        userProperties: (args as any).user_properties,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === 'ga_send_signup') {
      if (!mpClient) {
        throw new Error('Measurement Protocol not configured. Set GA_MEASUREMENT_ID and GA_API_SECRET.');
      }
      const result = await mpClient.sendSignUp({
        clientId: (args as any).client_id,
        userId: (args as any).user_id,
        method: (args as any).method,
        userProperties: (args as any).user_properties,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === 'ga_send_add_to_cart') {
      if (!mpClient) {
        throw new Error('Measurement Protocol not configured. Set GA_MEASUREMENT_ID and GA_API_SECRET.');
      }
      const result = await mpClient.sendAddToCart({
        clientId: (args as any).client_id,
        userId: (args as any).user_id,
        currency: (args as any).currency,
        value: (args as any).value,
        items: (args as any).items,
        userProperties: (args as any).user_properties,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === 'ga_send_begin_checkout') {
      if (!mpClient) {
        throw new Error('Measurement Protocol not configured. Set GA_MEASUREMENT_ID and GA_API_SECRET.');
      }
      const result = await mpClient.sendBeginCheckout({
        clientId: (args as any).client_id,
        userId: (args as any).user_id,
        currency: (args as any).currency,
        value: (args as any).value,
        items: (args as any).items,
        coupon: (args as any).coupon,
        userProperties: (args as any).user_properties,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

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
