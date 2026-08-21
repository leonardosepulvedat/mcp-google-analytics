# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2026-08-21

### Added
- `mcpName` field in `package.json` and a `server.json` manifest for the Official MCP Registry (registry.modelcontextprotocol.io), so the server can be discovered from Claude, Cursor, Windsurf, PulseMCP, Smithery, Glama, and other directories.
- One-click "Install in Cursor" button, npm downloads badge, and CI badge in the README.

## [1.2.0] - 2026-08-21

### Added
- 6 new read tools (Admin/Data API, all read-only): `ga_get_account_summaries` (all accounts and properties in one call), `ga_list_custom_dimensions`, `ga_list_custom_metrics`, `ga_list_key_events` (conversions), `ga_list_google_ads_links`, and `ga_check_compatibility` (validate dimension/metric combos before running a report).
- 2 new Measurement Protocol tools completing the ecommerce lifecycle: `ga_send_view_item` and `ga_send_refund` (full or partial refunds).
- Unit tests for all new client methods.

### Changed
- npm description and keywords now highlight the differentiator: the GA4 MCP that reads AND writes (26 tools total).

## [1.1.1] - 2026-08-06

### Changed
- Documentation only: added an at-a-glance table of all 18 tools, five new Measurement Protocol usage examples (validation, server-side conversions, ecommerce funnel with shared `client_id`, custom automation events, and send-and-verify), and practical notes on event latency and `client_id` session grouping.

## [1.1.0] - 2026-08-06

### Fixed
- `ga_run_funnel_report` now works: it targets the Data API **v1alpha** channel (the only channel where `runFunnelReport` exists) and sends the correct request shape (`funnel.steps` with a `filterExpression` per step, `funnelBreakdown.breakdownDimension`). Steps accept an optional `eventName` (defaults to the step name) or a full `filterExpression`.
- `ga_list_properties` without an account ID no longer fails: it now aggregates properties across all accessible accounts (the Admin API requires a `filter`).
- The default limit of 10 rows documented for reports is now actually enforced in `ga_run_report`, `ga_run_realtime_report`, and `ga_batch_run_reports` (previously GA returned up to 10,000 rows when `limit` was omitted).
- Repository, bugs, and homepage URLs in `package.json` now point to the correct GitHub account.
- Server version reported over MCP now stays in sync with `package.json`.

### Changed
- Migrated to the modern `McpServer` API with per-tool Zod input validation (arguments are now validated before reaching Google APIs).
- Updated all dependencies; `npm audit` is clean (previously 11 vulnerabilities, 5 high).
- Requires Node.js >= 20 (Node 18 is end-of-life).
- Removed unused `dotenv` dependency.
- Read-only tools are now annotated with `readOnlyHint` for MCP clients.

### Added
- Unit tests (Vitest) covering report limits, funnel request shaping, property listing, and Measurement Protocol payloads.
- Continuous integration with GitHub Actions (build, tests, and dependency audit on Node 20 and 22).

## [1.0.0] - 2024-01-15

### Added

#### Google Analytics Data API (Reading)
- `ga_run_report` - Run custom reports with dimensions and metrics
- `ga_run_realtime_report` - Get real-time data (last 30 minutes)
- `ga_get_metadata` - Get all available dimensions and metrics
- `ga_list_accounts` - List accessible GA accounts
- `ga_list_properties` - List GA4 properties
- `ga_get_property` - Get property details
- `ga_list_data_streams` - List data streams
- `ga_run_pivot_report` - Run pivot table reports
- `ga_run_funnel_report` - Run funnel analysis
- `ga_batch_run_reports` - Run multiple reports in one request

#### Measurement Protocol (Writing)
- `ga_send_event` - Send custom events
- `ga_validate_event` - Validate events before sending
- `ga_send_pageview` - Send page view events
- `ga_send_purchase` - Send ecommerce purchase events
- `ga_send_login` - Send login events
- `ga_send_signup` - Send sign-up events
- `ga_send_add_to_cart` - Send add-to-cart events
- `ga_send_begin_checkout` - Send checkout initiation events

#### Authentication
- OAuth 2.0 support via service account JSON
- Measurement Protocol authentication with API Secret
- Environment variable configuration

#### Documentation
- Comprehensive README with setup instructions
- TOKEN_OPTIMIZATION.md guide for efficient queries
- QUICKSTART.md for 5-minute setup
- EXAMPLES.md with practical examples in Spanish
- Detailed tool descriptions with token warnings

#### Features
- TypeScript with strict mode
- Zod schema validation
- Axios for HTTP requests
- Google Auth Library for OAuth
- Error handling and validation
- Auto-generated client IDs for Measurement Protocol
- Debug mode support for event validation

### Security
- Service account JSON can be provided as file path or inline
- API secrets stored in environment variables
- No credentials logged or exposed

### Performance
- Default limit of 10 results for all read operations
- Token optimization warnings in all tool descriptions
- Smart filtering and pagination support

---

## [Unreleased]

### Planned Features
- Support for GA4 Admin API operations
- Custom event templates
- Batch event sending for Measurement Protocol
- Enhanced error messages with suggestions
- Rate limiting and quota management
- Response caching for metadata
- Support for more GA4 report types

---

## Version History

- **1.2.0** - 8 new tools: account summaries, custom dimensions/metrics, key events, Ads links, compatibility check, view_item and refund
- **1.1.1** - Documentation: tools summary table and Measurement Protocol usage examples
- **1.1.0** - Funnel and property listing fixes, enforced row limits, dependency updates, tests and CI
- **1.0.0** - Initial release with core Data API and Measurement Protocol support

---

For upgrade instructions and breaking changes, see [README.md](README.md).
