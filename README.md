# MCP Google Analytics Server

A Model Context Protocol (MCP) server for Google Analytics 4, providing comprehensive integration with both the **Google Analytics Data API** (for reading reports) and **Measurement Protocol v2** (for sending events).

**The GA4 MCP that reads AND writes.** Most GA4 MCP servers (including Google's official one) are read-only. This one gives your AI agent the full loop: run reports and funnels, audit your setup (custom dimensions, key events, compatibility checks), send ecommerce and conversion events server-side, and verify them in the realtime report — 26 tools in one `npx` command.

**Built for agencies too**: every read tool accepts an optional `propertyId`, so one conversation can query all your clients' properties — no reconfiguration between clients. See [Multi-Property Mode](#-multi-property-mode-agencies).

[![npm version](https://badge.fury.io/js/mcp-google-analytics.svg)](https://www.npmjs.com/package/mcp-google-analytics)
[![npm downloads](https://img.shields.io/npm/dm/mcp-google-analytics.svg)](https://www.npmjs.com/package/mcp-google-analytics)
[![CI](https://github.com/leonardosepulvedat/mcp-google-analytics/actions/workflows/ci.yml/badge.svg)](https://github.com/leonardosepulvedat/mcp-google-analytics/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![smithery badge](https://smithery.ai/badge/lsepulvedatabares/mcp-google-analytics)](https://smithery.ai/servers/lsepulvedatabares/mcp-google-analytics)

## ⚡ One-Click Install

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](cursor://anysphere.cursor-deeplink/mcp/install?name=google-analytics&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIm1jcC1nb29nbGUtYW5hbHl0aWNzIl0sImVudiI6eyJHQV9TRVJWSUNFX0FDQ09VTlRfSlNPTiI6Ii9wYXRoL3RvL3NlcnZpY2UtYWNjb3VudC5qc29uIiwiR0FfUFJPUEVSVFlfSUQiOiIxMjM0NTY3ODkiLCJHQV9NRUFTVVJFTUVOVF9JRCI6IkctWFhYWFhYWFhYWCIsIkdBX0FQSV9TRUNSRVQiOiJ5b3VyLWFwaS1zZWNyZXQifX0=)

Click **Install in Cursor** above, approve, then replace the placeholder values in `~/.cursor/mcp.json` with your real credentials (see [Configuration](#-configuration) below).

## ⚡ Token Optimization - READ THIS FIRST!

**IMPORTANT**: Google Analytics reports can return large datasets that consume significant tokens. This server is designed with token optimization in mind:

- **All read tools default to 10 results** - Adjust the `limit` parameter as needed
- **Use specific date ranges** - Avoid querying years of data at once
- **Select only needed dimensions/metrics** - Don't request everything
- **Check [TOKEN_OPTIMIZATION.md](TOKEN_OPTIMIZATION.md)** for detailed best practices

See the dedicated [Token Optimization Guide](TOKEN_OPTIMIZATION.md) for strategies to minimize token usage.

## 🚀 Quick Start

See [QUICKSTART.md](QUICKSTART.md) for a 5-minute setup guide, or follow the installation steps below.

## 📦 Installation

### Option 1: Install globally via npm

```bash
npm install -g mcp-google-analytics
```

### Option 2: Use with npx (no installation needed)

```bash
npx mcp-google-analytics
```

## 🔧 Configuration

This server requires different credentials for reading data vs sending events:

### For Reading Data (Google Analytics Data API)

You need a **Service Account** with access to your GA4 property:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the **Google Analytics Data API**
4. Create a Service Account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name (e.g., "GA4 MCP Reader")
   - Grant the "Viewer" role
   - Create a JSON key and download it
5. Add the service account email to your GA4 property:
   - Go to GA4 Admin > Property Access Management
   - Add the service account email with "Viewer" role
6. Get your Property ID:
   - Go to GA4 Admin > Property Settings
   - Copy the Property ID (numeric, e.g., "123456789")

### For Sending Events (Measurement Protocol)

You need a **Measurement ID** and **API Secret**:

1. Go to GA4 Admin > Data Streams
2. Select your data stream (web, iOS, or Android)
3. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)
4. Click "Measurement Protocol API secrets"
5. Click "Create" to generate a new API secret
6. Copy the secret value

### Environment Variables

Set these environment variables:

```bash
# For Data API (reading)
export GA_SERVICE_ACCOUNT_JSON=/path/to/service-account.json
# Or provide JSON directly:
# export GA_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"..."}'

# Optional: default property. If omitted, pass "propertyId" per tool call
# (multi-property mode — see below)
export GA_PROPERTY_ID=123456789

# For Measurement Protocol (writing)
export GA_MEASUREMENT_ID=G-XXXXXXXXXX
export GA_API_SECRET=your-api-secret-here
```

## 🏢 Multi-Property Mode (Agencies)

Every read tool accepts an optional `propertyId` argument that overrides the configured `GA_PROPERTY_ID` — so a single conversation can query any property the service account can access, with no reconfiguration between clients.

1. Grant your service account "Viewer" access on each client's GA4 property (or at account level).
2. Set only `GA_SERVICE_ACCOUNT_JSON` (`GA_PROPERTY_ID` becomes optional — if set, it acts as the default).
3. Discover properties, then query any of them:

```
Show me all my accounts and properties          → ga_get_account_summaries
Compare last week's active users between the    → ga_run_report with propertyId "111111"
Acme property and the Globex property             and again with propertyId "222222"
```

`propertyId` accepts both `123456789` and `properties/123456789`. Event sending (Measurement Protocol) remains tied to the configured `GA_MEASUREMENT_ID`/`GA_API_SECRET`, since each data stream has its own secret.

## 🔌 Integration with Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "google-analytics": {
      "command": "npx",
      "args": ["-y", "mcp-google-analytics"],
      "env": {
        "GA_SERVICE_ACCOUNT_JSON": "/path/to/service-account.json",
        "GA_PROPERTY_ID": "123456789",
        "GA_MEASUREMENT_ID": "G-XXXXXXXXXX",
        "GA_API_SECRET": "your-api-secret"
      }
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "google-analytics": {
      "command": "mcp-google-analytics",
      "env": {
        "GA_SERVICE_ACCOUNT_JSON": "/path/to/service-account.json",
        "GA_PROPERTY_ID": "123456789",
        "GA_MEASUREMENT_ID": "G-XXXXXXXXXX",
        "GA_API_SECRET": "your-api-secret"
      }
    }
  }
}
```

Restart Claude Desktop after updating the configuration.

## 🎯 Integration with Cursor

Add to your Cursor MCP settings file:

**macOS/Linux**: `~/.cursor/mcp.json`
**Windows**: `%USERPROFILE%\.cursor\mcp.json`

```json
{
  "mcpServers": {
    "google-analytics": {
      "command": "npx",
      "args": ["-y", "mcp-google-analytics"],
      "env": {
        "GA_SERVICE_ACCOUNT_JSON": "/path/to/service-account.json",
        "GA_PROPERTY_ID": "123456789",
        "GA_MEASUREMENT_ID": "G-XXXXXXXXXX",
        "GA_API_SECRET": "your-api-secret"
      }
    }
  }
}
```

Restart Cursor after updating the configuration.

## 🛠️ Available Tools

### At a Glance

**Reading data (Google Analytics Data API)** — all read tools default to 10 rows to save tokens:

| Tool | Purpose | Notes |
|---|---|---|
| `ga_run_report` | Custom reports with dimensions and metrics | Adjust `limit` as needed |
| `ga_run_realtime_report` | Real-time data (last 30 minutes) | Great for verifying sent events |
| `ga_get_metadata` | All available dimensions and metrics | Large response (500+ items), use sparingly |
| `ga_list_accounts` | List accessible GA accounts | |
| `ga_list_properties` | List GA4 properties | Aggregates all accounts if no `accountId` |
| `ga_get_property` | Details of the configured property | |
| `ga_list_data_streams` | Data streams of the property | Useful to find measurement IDs |
| `ga_run_pivot_report` | Pivot table reports | Responses can be very large |
| `ga_run_funnel_report` | Funnel analysis across event steps | Uses Data API v1alpha |
| `ga_batch_run_reports` | Multiple reports in one request | 2–5 reports per batch recommended |
| `ga_get_account_summaries` | All accounts and properties in one call | Fastest way to discover IDs |
| `ga_list_custom_dimensions` | Custom dimensions of the property | Discover API names for reports |
| `ga_list_custom_metrics` | Custom metrics of the property | Discover API names for reports |
| `ga_list_key_events` | Key events (conversions) of the property | Know what counts as a conversion |
| `ga_list_google_ads_links` | Google Ads accounts linked to the property | |
| `ga_check_compatibility` | Validate dimension/metric combos before reporting | Avoids wasted requests and error loops |

**Sending events (Measurement Protocol)**:

| Tool | Purpose |
|---|---|
| `ga_send_event` | Any custom GA4 event with parameters |
| `ga_validate_event` | Test an event against the debug endpoint without recording it |
| `ga_send_pageview` | Page/screen views |
| `ga_send_purchase` | Ecommerce purchases with transaction and items |
| `ga_send_login` | User logins |
| `ga_send_signup` | User registrations |
| `ga_send_view_item` | Product/item detail views |
| `ga_send_add_to_cart` | Add-to-cart events |
| `ga_send_begin_checkout` | Checkout initiations |
| `ga_send_refund` | Full or partial refunds |

### Google Analytics Data API (Reading Data)

#### `ga_run_report`
Run custom reports with dimensions and metrics.

**Common Dimensions**: `date`, `city`, `country`, `deviceCategory`, `browser`, `pagePath`, `eventName`, `sessionSource`, `sessionMedium`, `sessionCampaignName`

**Common Metrics**: `activeUsers`, `sessions`, `screenPageViews`, `conversions`, `totalRevenue`, `engagementRate`, `averageSessionDuration`

**Example**:
```typescript
{
  "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
  "dimensions": [{"name": "city"}],
  "metrics": [{"name": "activeUsers"}],
  "limit": 10
}
```

#### `ga_run_realtime_report`
Get real-time data (last 30 minutes).

**Example**:
```typescript
{
  "metrics": [{"name": "activeUsers"}],
  "dimensions": [{"name": "country"}],
  "limit": 10
}
```

#### `ga_get_metadata`
Get all available dimensions and metrics for your property.

**Warning**: Returns 500+ items. Use sparingly.

#### `ga_list_accounts`
List all GA accounts accessible to the service account.

#### `ga_list_properties`
List GA4 properties, optionally filtered by account ID.

#### `ga_get_property`
Get details about the configured property.

#### `ga_list_data_streams`
List data streams for the configured property.

#### `ga_run_pivot_report`
Run pivot table reports with row/column dimensions.

**Example**:
```typescript
{
  "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
  "dimensions": [{"name": "country"}, {"name": "deviceCategory"}],
  "metrics": [{"name": "activeUsers"}],
  "pivots": [{"fieldNames": ["deviceCategory"], "limit": 5}]
}
```

#### `ga_run_funnel_report`
Run funnel analysis to track user progression.

**Note**: Funnel reporting uses the Data API v1alpha channel (the only channel where Google exposes it). Each step matches an event: set `eventName` per step, or omit it to use the step's `name` as the event name. For advanced matching, pass a full `filterExpression`.

**Example**:
```typescript
{
  "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
  "funnelSteps": [
    {"name": "page_view"},
    {"name": "add_to_cart"},
    {"name": "begin_checkout"},
    {"name": "Purchase", "eventName": "purchase"}
  ]
}
```

#### `ga_batch_run_reports`
Run multiple reports in a single request.

**Warning**: Can return large datasets. Limit to 2-5 reports per batch.

#### `ga_get_account_summaries`
Get all accessible accounts with their properties in a single compact call. The fastest way to discover account and property IDs.

#### `ga_list_custom_dimensions` / `ga_list_custom_metrics`
List the custom dimensions and metrics defined for the property, including their API names (e.g., `customEvent:plan_type`) so you can use them in reports.

#### `ga_list_key_events`
List the key events (conversions) configured for the property — useful before building conversion reports or deciding which events to send.

#### `ga_list_google_ads_links`
List Google Ads accounts linked to the property.

#### `ga_check_compatibility`
Check whether a dimension/metric combination is valid **before** running a report, avoiding wasted requests and token-heavy error loops.

**Example**:
```typescript
{
  "dimensions": [{"name": "city"}],
  "metrics": [{"name": "activeUsers"}],
  "compatibilityFilter": "COMPATIBLE"
}
```

### Measurement Protocol (Sending Events)

> **Good to know**:
> - Events take a few minutes to appear in standard reports, but show up almost immediately in the realtime report (`ga_run_realtime_report`).
> - Use `ga_validate_event` to test new events without recording them.
> - If you omit `client_id`, one is auto-generated per call. To have GA group several events (e.g., a cart-to-purchase flow) into the same session and user, pass the **same `client_id`** to every call.

#### `ga_send_event`
Send custom events to GA4.

**Example**:
```typescript
{
  "events": [{
    "name": "button_click",
    "params": {
      "button_id": "cta_signup",
      "page": "/landing"
    }
  }],
  "user_id": "user123"
}
```

#### `ga_validate_event`
Validate events before sending (uses debug endpoint).

#### `ga_send_pageview`
Send page view events.

**Example**:
```typescript
{
  "page_location": "https://example.com/products",
  "page_title": "Products",
  "user_id": "user123"
}
```

#### `ga_send_purchase`
Send ecommerce purchase events.

**Example**:
```typescript
{
  "transaction_id": "T12345",
  "value": 99.99,
  "currency": "USD",
  "items": [{
    "item_id": "SKU123",
    "item_name": "Product Name",
    "price": 99.99,
    "quantity": 1
  }]
}
```

#### `ga_send_login`
Send login events.

#### `ga_send_signup`
Send user registration events.

#### `ga_send_view_item`
Send product/item detail view events. Completes the standard ecommerce funnel: `view_item` → `add_to_cart` → `begin_checkout` → `purchase`.

#### `ga_send_add_to_cart`
Send add-to-cart events.

#### `ga_send_begin_checkout`
Send checkout initiation events.

#### `ga_send_refund`
Send full or partial refund events. Use the same `transaction_id` as the original purchase; omit `items` for a full refund, include them for a partial one.

**Example (partial refund)**:
```typescript
{
  "transaction_id": "T12345",
  "currency": "USD",
  "value": 49.99,
  "items": [{"item_id": "SKU123", "quantity": 1}]
}
```

## 📖 Usage Examples

See [EXAMPLES.md](EXAMPLES.md) for practical usage examples in Spanish.

### Example: Get users by country (last 7 days)

```
Show me active users by country for the last 7 days
```

Claude will use `ga_run_report`:
```json
{
  "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
  "dimensions": [{"name": "country"}],
  "metrics": [{"name": "activeUsers"}],
  "limit": 10,
  "orderBys": [{"metric": {"metricName": "activeUsers"}, "desc": true}]
}
```

### Example: Track a purchase

```
Send a purchase event for order #12345, $99.99 USD
```

Claude will use `ga_send_purchase`:
```json
{
  "transaction_id": "12345",
  "value": 99.99,
  "currency": "USD",
  "items": [{
    "item_id": "product_1",
    "item_name": "Example Product",
    "price": 99.99,
    "quantity": 1
  }]
}
```

### Example: Validate an event before sending it

Recommended before wiring up any new event: the debug endpoint checks the payload without recording anything.

```
Validate this tutorial_complete event before we send it for real
```

Claude will use `ga_validate_event`:
```json
{
  "client_id": "test.123",
  "events": [{
    "name": "tutorial_complete",
    "params": {"tutorial_id": "onboarding", "duration_seconds": 120}
  }]
}
```

The response lists validation messages; an empty list means the event is well-formed.

### Example: Server-side conversion tracking

Track signups or logins that happen in your backend, where no JavaScript tag runs:

```
A user just registered with Google OAuth, record the signup in Analytics
```

Claude will use `ga_send_signup`:
```json
{
  "user_id": "user_789",
  "method": "Google"
}
```

### Example: Full ecommerce funnel from an agent

Send the same `client_id` on each call so GA groups the events into one session:

```
Track this user's journey: they added a $49 course to the cart, started checkout, and completed the purchase
```

Claude will chain `ga_send_add_to_cart` → `ga_send_begin_checkout` → `ga_send_purchase`, reusing the client ID:
```json
{
  "client_id": "555.1717000000",
  "currency": "USD",
  "value": 49,
  "items": [{"item_id": "course_101", "item_name": "Intro Course", "price": 49, "quantity": 1}]
}
```

### Example: Custom events from automations

Measure things GA never sees natively, like AI agent activity or scheduled jobs:

```
Log that the weekly report generator ran successfully
```

Claude will use `ga_send_event`:
```json
{
  "events": [{
    "name": "automation_run",
    "params": {"job": "weekly_report", "status": "success", "duration_ms": 5400}
  }]
}
```

### Example: Send and verify in one conversation

Combine both APIs to confirm your tracking works end to end:

```
Send a test event and confirm Analytics received it
```

Claude will call `ga_send_event`, then check with `ga_run_realtime_report`:
```json
{
  "dimensions": [{"name": "eventName"}],
  "metrics": [{"name": "eventCount"}],
  "limit": 10
}
```

Measurement Protocol events appear in the realtime report within seconds, while standard reports can take a few minutes.

## 🔍 Debugging

Enable debug logging by setting:

```bash
export DEBUG=mcp-google-analytics:*
```

For Measurement Protocol, use `ga_validate_event` to check events before sending them live.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/leonardosepulvedat/mcp-google-analytics)
- [npm Package](https://www.npmjs.com/package/mcp-google-analytics)
- [Smithery](https://smithery.ai/servers/lsepulvedatabares/mcp-google-analytics)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [GA4 Data API Documentation](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Measurement Protocol Documentation](https://developers.google.com/analytics/devguides/collection/protocol/ga4)

## 🆘 Support

For issues and questions:
- [GitHub Issues](https://github.com/leonardosepulvedat/mcp-google-analytics/issues)
- [MCP Community Discord](https://discord.gg/modelcontextprotocol)

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---
