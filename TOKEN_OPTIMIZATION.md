# Token Optimization Guide

Google Analytics reports can return large amounts of data. Since AI models like Claude have token limits and costs, it's important to optimize your queries to avoid excessive token consumption.

## 🎯 Key Strategies

### 1. **Always Use Limits**

Every data reading tool supports a `limit` parameter. Use it!

**Bad**:
```json
{
  "dateRanges": [{"startDate": "30daysAgo", "endDate": "today"}],
  "dimensions": [{"name": "pagePath"}],
  "metrics": [{"name": "screenPageViews"}]
}
```
☝️ Could return thousands of rows

**Good**:
```json
{
  "dateRanges": [{"startDate": "30daysAgo", "endDate": "today"}],
  "dimensions": [{"name": "pagePath"}],
  "metrics": [{"name": "screenPageViews"}],
  "limit": 20,
  "orderBys": [{"metric": {"metricName": "screenPageViews"}, "desc": true}]
}
```
✅ Returns only top 20 pages

### 2. **Use Specific Date Ranges**

Don't query more data than you need.

**Bad**: `{"startDate": "365daysAgo", "endDate": "today"}` (full year)

**Good**:
- `{"startDate": "7daysAgo", "endDate": "today"}` (last week)
- `{"startDate": "yesterday", "endDate": "yesterday"}` (single day)
- `{"startDate": "2024-01-01", "endDate": "2024-01-31"}` (specific month)

### 3. **Select Only Needed Dimensions**

More dimensions = exponentially more rows.

**Bad** (4 dimensions):
```json
{
  "dimensions": [
    {"name": "country"},
    {"name": "city"},
    {"name": "deviceCategory"},
    {"name": "browser"}
  ]
}
```
☝️ Could create 10,000+ unique combinations

**Good** (1-2 dimensions):
```json
{
  "dimensions": [
    {"name": "country"}
  ]
}
```
✅ Much fewer rows

### 4. **Request Only Essential Metrics**

Each metric adds to response size.

**Bad**:
```json
{
  "metrics": [
    {"name": "activeUsers"},
    {"name": "sessions"},
    {"name": "screenPageViews"},
    {"name": "bounceRate"},
    {"name": "averageSessionDuration"},
    {"name": "conversions"},
    {"name": "totalRevenue"}
  ]
}
```

**Good**:
```json
{
  "metrics": [
    {"name": "activeUsers"},
    {"name": "conversions"}
  ]
}
```

### 5. **Use Filters to Reduce Data**

Filter data server-side before it reaches Claude.

**Example - Only include specific countries**:
```json
{
  "dimensionFilter": {
    "filter": {
      "fieldName": "country",
      "stringFilter": {
        "matchType": "IN_LIST",
        "value": ["United States", "Canada", "United Kingdom"]
      }
    }
  }
}
```

**Example - Only pages with significant traffic**:
```json
{
  "metricFilter": {
    "filter": {
      "fieldName": "screenPageViews",
      "numericFilter": {
        "operation": "GREATER_THAN",
        "value": {"int64Value": "100"}
      }
    }
  }
}
```

### 6. **Aggregate When Possible**

Use summary metrics instead of granular data.

**Bad** - Daily breakdown for a month (30 rows):
```json
{
  "dateRanges": [{"startDate": "30daysAgo", "endDate": "today"}],
  "dimensions": [{"name": "date"}],
  "metrics": [{"name": "activeUsers"}]
}
```

**Good** - Total for the month (1 row):
```json
{
  "dateRanges": [{"startDate": "30daysAgo", "endDate": "today"}],
  "metrics": [{"name": "activeUsers"}]
}
```

### 7. **Avoid Pivot Reports Unless Necessary**

Pivot reports create matrix-style data that can be very large.

**When to use**: Complex analysis requiring cross-tabulation
**When to avoid**: Simple summaries or lists

### 8. **Batch Reports Carefully**

`ga_batch_run_reports` can return A LOT of data.

**Guidelines**:
- Limit to 2-5 reports per batch
- Each report should have its own `limit`
- Only batch related data that should be viewed together

### 9. **Real-time Reports Are Small - Use Them**

`ga_run_realtime_report` only covers the last 30 minutes, so data is naturally limited.

Good for:
- Current traffic monitoring
- Testing event tracking
- Live dashboards

### 10. **Check Metadata Once, Cache It**

`ga_get_metadata` returns 500+ dimensions and metrics.

**Don't**: Call it repeatedly
**Do**: Call once, save the output, refer to it later

## 📊 Token Usage Examples

Here's roughly how many tokens different query types consume:

| Query Type | Rows | Approximate Tokens |
|------------|------|-------------------|
| Simple metric (no dimensions) | 1 | ~100 |
| Single dimension, 10 rows | 10 | ~500 |
| Single dimension, 100 rows | 100 | ~3,000 |
| 2 dimensions, 50 rows | 50 | ~2,000 |
| Pivot report (small) | 20-50 | ~2,000-5,000 |
| Pivot report (large) | 100+ | ~10,000+ |
| Metadata (all) | 500+ | ~15,000-20,000 |

## 🎨 Practical Examples

### Example 1: Top Pages Report (Optimized)

```json
{
  "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
  "dimensions": [{"name": "pagePath"}],
  "metrics": [{"name": "screenPageViews"}],
  "limit": 10,
  "orderBys": [{"metric": {"metricName": "screenPageViews"}, "desc": true}]
}
```
✅ Returns only top 10 pages, ~500 tokens

### Example 2: Traffic by Country (Optimized)

```json
{
  "dateRanges": [{"startDate": "30daysAgo", "endDate": "today"}],
  "dimensions": [{"name": "country"}],
  "metrics": [{"name": "activeUsers"}],
  "limit": 20,
  "orderBys": [{"metric": {"metricName": "activeUsers"}, "desc": true}]
}
```
✅ Top 20 countries only, ~1,000 tokens

### Example 3: Conversion Rate by Source (Optimized)

```json
{
  "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
  "dimensions": [{"name": "sessionSource"}],
  "metrics": [
    {"name": "sessions"},
    {"name": "conversions"}
  ],
  "limit": 15,
  "metricFilter": {
    "filter": {
      "fieldName": "sessions",
      "numericFilter": {
        "operation": "GREATER_THAN",
        "value": {"int64Value": "10"}
      }
    }
  },
  "orderBys": [{"metric": {"metricName": "conversions"}, "desc": true}]
}
```
✅ Only sources with 10+ sessions, top 15, ~1,000 tokens

## 🚨 Common Mistakes to Avoid

### ❌ Don't Do This

```json
// Querying everything for a year
{
  "dateRanges": [{"startDate": "365daysAgo", "endDate": "today"}],
  "dimensions": [
    {"name": "date"},
    {"name": "country"},
    {"name": "city"},
    {"name": "pagePath"}
  ],
  "metrics": [
    {"name": "activeUsers"},
    {"name": "sessions"},
    {"name": "screenPageViews"},
    {"name": "conversions"},
    {"name": "totalRevenue"}
  ]
}
```
☝️ This could return 100,000+ rows and consume 50,000+ tokens!

### ✅ Do This Instead

```json
// Specific question: "What were our top converting countries last week?"
{
  "dateRanges": [{"startDate": "7daysAgo", "endDate": "yesterday"}],
  "dimensions": [{"name": "country"}],
  "metrics": [{"name": "conversions"}],
  "limit": 10,
  "orderBys": [{"metric": {"metricName": "conversions"}, "desc": true}]
}
```
✅ Answers the specific question with ~500 tokens

## 💡 Pro Tips

1. **Start Small**: Begin with `limit: 10` and increase if needed
2. **Use orderBys**: Sort by your key metric to get the most important data first
3. **Ask Specific Questions**: "Top 5 countries by revenue this week" vs "Show me all analytics data"
4. **Combine Filters**: Use both dimension and metric filters to drill down
5. **Save Common Queries**: Keep optimized query templates for frequent reports
6. **Monitor Token Usage**: If Claude seems slow or cuts off, your queries might be too large

## 📚 Further Reading

- [GA4 Data API Quotas](https://developers.google.com/analytics/devguides/reporting/data/v1/quotas)
- [GA4 Dimensions & Metrics Reference](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
- [MCP Best Practices](https://modelcontextprotocol.io/docs/best-practices)

---

**Remember**: The goal is to get the data you need efficiently, not all the data that exists!
