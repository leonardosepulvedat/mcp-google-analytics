# Quick Start Guide (5 Minutes)

Get your MCP Google Analytics server running in 5 minutes or less!

## Prerequisites

- Node.js 18 or higher
- A Google Cloud account
- Access to a GA4 property

## Step 1: Create Service Account (2 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Click the hamburger menu → "APIs & Services" → "Enable APIs and Services"
4. Search for "Google Analytics Data API" and enable it
5. Click hamburger menu → "IAM & Admin" → "Service Accounts"
6. Click "Create Service Account"
   - Name: `ga4-mcp-reader`
   - Click "Create and Continue"
   - Skip optional steps
   - Click "Done"
7. Click on the service account you just created
8. Go to "Keys" tab → "Add Key" → "Create new key"
9. Choose "JSON" and click "Create"
10. Save the downloaded JSON file (e.g., `service-account.json`)

## Step 2: Grant Access to GA4 (1 minute)

1. Open the JSON file you downloaded
2. Copy the `client_email` value (looks like `ga4-mcp-reader@project-id.iam.gserviceaccount.com`)
3. Go to [Google Analytics](https://analytics.google.com/)
4. Click "Admin" (gear icon at bottom left)
5. In the "Property" column, click "Property Access Management"
6. Click the "+" button → "Add users"
7. Paste the service account email
8. Select "Viewer" role
9. Click "Add"

## Step 3: Get Your Credentials (1 minute)

### Get Property ID

1. Still in GA4 Admin
2. Click "Property Settings"
3. Copy the "Property ID" (numeric, e.g., `123456789`)

### Send events later (optional)

Skip this if you only want reports. To also record events from the agent:

1. In GA4 Admin, click "Data Streams"
2. Click on your data stream (e.g., "Web")
3. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)
4. Scroll down and click "Measurement Protocol API secrets"
5. Click "Create"
6. Name it (e.g., "MCP Server")
7. Click "Create"
8. Copy the **Secret value**

## Step 4: Install the MCP Server (30 seconds)

**Option A: Global installation**
```bash
npm install -g mcp-google-analytics
```

**Option B: Use with npx (no installation)**
```bash
# No installation needed, just use npx when configuring
```

## Step 5: Configure Claude Desktop (1 minute)

1. Open your Claude Desktop config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

2. Add this configuration (replace with your values):

```json
{
  "mcpServers": {
    "google-analytics": {
      "command": "npx",
      "args": ["-y", "mcp-google-analytics"],
      "env": {
        "GA_SERVICE_ACCOUNT_JSON": "/Users/you/path/to/service-account.json",
        "GA_PROPERTY_ID": "123456789"
      }
    }
  }
}
```

**Important**:
- Use full absolute path for `GA_SERVICE_ACCOUNT_JSON`
- Or paste the entire JSON content as a string (escape quotes with `\"`)

3. Save the file
4. Restart Claude Desktop

## Step 6: Test It! (30 seconds)

Open Claude Desktop and try:

```
Show me the top 5 countries by active users for the last 7 days
```

Claude should use the `ga_run_report` tool and show you results!

Or test sending an event:

```
Send a test page view event to Google Analytics
```

## ✅ Success!

You should now see:
- 🟢 Google Analytics tools available in Claude
- 📊 Ability to query your GA4 data
- 📤 Ability to send events to GA4

## 🐛 Troubleshooting

### "GA Data API not configured"

- Check that `GA_SERVICE_ACCOUNT_JSON` path is correct and absolute
- Verify the service account has access to your GA4 property
- Make sure the Google Analytics Data API is enabled in Cloud Console

### "Permission denied" or "403 Forbidden"

- The service account email needs "Viewer" role in GA4
- Check you added it to the correct property

### "Property not found"

- Verify the `GA_PROPERTY_ID` is correct (numeric only)
- Make sure you're using the Property ID, not the Measurement ID

### Measurement Protocol errors

- Check `GA_MEASUREMENT_ID` format is correct (starts with `G-`)
- Verify `GA_API_SECRET` is copied correctly
- Events may take a few minutes to appear in GA4 real-time reports

### Claude doesn't show the tools

- Restart Claude Desktop completely
- Check the config file syntax is valid JSON
- Look for error messages in Claude Desktop logs

## 📚 Next Steps

- Read [TOKEN_OPTIMIZATION.md](TOKEN_OPTIMIZATION.md) to learn how to optimize queries
- Check [EXAMPLES.md](EXAMPLES.md) for practical usage examples
- Read [README.md](README.md) for full documentation

## 💡 Quick Tips

1. **Start with limits**: Always use `limit: 10` in reports to avoid large responses
2. **Use relative dates**: `"7daysAgo"`, `"yesterday"`, `"today"` work great
3. **Validate first**: Use `ga_validate_event` before sending important events
4. **Check real-time**: Events appear in GA4 real-time reports within seconds

---

**That's it! You're ready to use Google Analytics with Claude! 🎉**
