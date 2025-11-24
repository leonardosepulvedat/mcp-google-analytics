# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- **1.0.0** - Initial release with core Data API and Measurement Protocol support

---

For upgrade instructions and breaking changes, see [README.md](README.md).
