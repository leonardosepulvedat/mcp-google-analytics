---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Describe the Bug
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Configure the server with...
2. Call the tool '...'
3. With these parameters '...'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Error Messages
```
Paste any error messages here
```

## Environment
- **Node.js version**: (run `node --version`)
- **OS**: (e.g., macOS 14.0, Windows 11, Ubuntu 22.04)
- **MCP Client**: (Claude Desktop, Cursor, etc.)
- **Package version**: (e.g., 1.0.0)

## Configuration
Please share your MCP configuration (redact sensitive information):
```json
{
  "mcpServers": {
    "google-analytics": {
      "command": "npx",
      "args": ["-y", "mcp-google-analytics"],
      "env": {
        "GA_SERVICE_ACCOUNT_JSON": "[REDACTED]",
        "GA_PROPERTY_ID": "[REDACTED]"
      }
    }
  }
}
```

## Additional Context
Add any other context about the problem here.
