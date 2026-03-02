# Google Workspace MCP Server Setup

This guide sets up a local MCP server for Gmail, Google Calendar, Drive, Docs, and Sheets — replacing the Anthropic-hosted servers that only work with Claude Desktop.

## Step 1: Create Google Cloud OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services > Library**
4. Enable these APIs:
   - **Gmail API**
   - **Google Calendar API**
   - **Google Drive API**
   - **Google Docs API**
   - **Google Sheets API**
5. Navigate to **APIs & Services > Credentials**
6. Click **+ CREATE CREDENTIALS > OAuth client ID**
7. If prompted, configure the OAuth consent screen first:
   - User type: **External** (or Internal if using Google Workspace)
   - App name: "Jarvis AI Agent"
   - Add your email as a test user
8. For the OAuth client:
   - Application type: **Desktop app**
   - Name: "Jarvis MCP"
9. Click **Create** and download the JSON file

## Step 2: Install Credentials

```bash
# Create the config directory
mkdir -p ~/.google-mcp

# Copy your downloaded credentials file
cp ~/Downloads/client_secret_*.json ~/.google-mcp/credentials.json
```

## Step 3: Authenticate Your Google Account

```bash
cd ~/Claude\ Code/jarvis
npx google-workspace-mcp accounts add default
```

This will open a browser window for Google OAuth. Sign in and grant access.

## Step 4: Start the Server

```bash
# Start the Google Workspace MCP server on port 3340
node scripts/google-workspace-mcp.mjs
```

The server will be available at `http://localhost:3340/mcp`.

## Step 5: Test

Visit `http://localhost:3333/tools` and click **Discover Tools** on the Google Workspace card.

## Troubleshooting

- **"Credentials file NOT found"**: Make sure `~/.google-mcp/credentials.json` exists
- **"No accounts configured"**: Run `npx google-workspace-mcp accounts add default`
- **Check status**: Run `npx google-workspace-mcp status`
