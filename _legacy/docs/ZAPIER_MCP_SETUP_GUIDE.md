# Zapier MCP Integration Guide

## Overview

Zapier MCP (Model Context Protocol) enables ALFRED to interact with 6000+ apps through Zapier, making it a true central hub for all your business platforms.

## What Zapier MCP Enables

With Zapier MCP, ALFRED can:
- **Read data** from Gmail, Slack, Google Calendar, HubSpot, QuickBooks, etc.
- **Create records** in CRMs, project management tools, and databases
- **Send notifications** via email, Slack, SMS, and more
- **Automate workflows** across multiple platforms
- **Sync data** between systems in real-time

## Setup Instructions

### Step 1: Get Your Zapier MCP API Key

1. Visit your Zapier MCP dashboard: https://mcp.zapier.com/share/cBheJc7cv5C3XQeXHimoPh
2. Copy your API key from the dashboard
3. Note: This is different from your regular Zapier API key

### Step 2: Add Environment Variable

Add to your Vercel project environment variables:

\`\`\`env
ZAPIER_MCP_API_KEY=your_zapier_mcp_api_key_here
\`\`\`

### Step 3: Configure Zapier Actions

In your Zapier MCP dashboard, configure the actions you want ALFRED to access:

**Recommended Actions for Motta Financial:**

1. **Gmail**
   - `gmail_send_email` - Send emails to clients
   - `gmail_search_emails` - Find client correspondence
   - `gmail_get_thread` - Retrieve email conversations

2. **Google Calendar**
   - `gcal_create_event` - Schedule client meetings
   - `gcal_find_events` - Check availability
   - `gcal_update_event` - Reschedule appointments

3. **Slack**
   - `slack_send_message` - Team notifications
   - `slack_send_dm` - Direct messages
   - `slack_search_messages` - Find discussions

4. **QuickBooks**
   - `qb_get_customer` - Retrieve customer data
   - `qb_create_invoice` - Generate invoices
   - `qb_get_reports` - Pull financial reports

5. **HubSpot** (if used)
   - `hubspot_get_contact` - Retrieve contact info
   - `hubspot_create_deal` - Create opportunities
   - `hubspot_update_contact` - Update CRM records

6. **Google Drive**
   - `gdrive_upload_file` - Store documents
   - `gdrive_search_files` - Find files
   - `gdrive_share_file` - Share with clients

### Step 4: Test the Integration

Once configured, test ALFRED with queries like:

- "Search my Gmail for emails from John Smith"
- "What meetings do I have this week?"
- "Send a Slack message to the tax team about the new client"
- "Get the QuickBooks customer record for Acme Corp"

## How It Works

### Architecture

\`\`\`
User Query → ALFRED → OpenAI Assistant → Zapier MCP Function Call
                                              ↓
                                    /api/zapier/mcp/route.ts
                                              ↓
                                    Zapier MCP API
                                              ↓
                                    Target App (Gmail, Slack, etc.)
                                              ↓
                                    Response → ALFRED → User
\`\`\`

### Function Call Flow

1. User asks: "Find emails from Connor Zumpfe"
2. ALFRED's OpenAI Assistant determines it needs to call `call_zapier_mcp`
3. Function arguments: `{ zapierAction: "gmail_search_emails", zapierParams: { query: "from:connor@example.com" } }`
4. Backend calls Zapier MCP API with these parameters
5. Zapier executes the Gmail search
6. Results return to ALFRED
7. ALFRED presents formatted results to user

## Common Use Cases

### 1. Client Communication Hub

**Query:** "Show me all recent communications with Connor Zumpfe"

ALFRED will:
- Search Gmail for emails
- Check Slack for messages
- Review calendar for meetings
- Compile a comprehensive communication timeline

### 2. Meeting Preparation

**Query:** "Prepare me for my 2pm meeting with Acme Corp"

ALFRED will:
- Get meeting details from Google Calendar
- Pull client data from Airtable and Karbon
- Search Gmail for recent correspondence
- Retrieve relevant documents from Google Drive
- Summarize recent work items

### 3. Task Automation

**Query:** "Send the Q4 tax summary to all clients in the manufacturing industry"

ALFRED will:
- Query Airtable for manufacturing clients
- Generate personalized summaries
- Send emails via Gmail
- Log activities in Karbon
- Create follow-up tasks

### 4. Cross-Platform Search

**Query:** "Find everything related to the Johnson account"

ALFRED will search:
- Airtable (client records)
- Karbon (work items)
- Gmail (correspondence)
- Google Drive (documents)
- Slack (team discussions)
- QuickBooks (financial data)

## Available Zapier Actions

### Email & Communication
- `gmail_send_email` - Send emails
- `gmail_search_emails` - Search inbox
- `outlook_send_email` - Send via Outlook
- `slack_send_message` - Post to Slack
- `slack_send_dm` - Direct message

### Calendar & Scheduling
- `gcal_create_event` - Create Google Calendar event
- `gcal_find_events` - Search calendar
- `outlook_create_event` - Create Outlook event

### CRM & Contacts
- `hubspot_get_contact` - Get HubSpot contact
- `hubspot_create_deal` - Create opportunity
- `salesforce_get_record` - Get Salesforce record

### Accounting & Finance
- `qb_get_customer` - Get QuickBooks customer
- `qb_create_invoice` - Create invoice
- `xero_get_contact` - Get Xero contact

### File Management
- `gdrive_upload_file` - Upload to Google Drive
- `gdrive_search_files` - Search Drive
- `dropbox_upload_file` - Upload to Dropbox

### Project Management
- `asana_create_task` - Create Asana task
- `trello_create_card` - Create Trello card
- `monday_create_item` - Create Monday.com item

## Security & Permissions

### Data Access
- Zapier MCP only accesses apps you explicitly authorize
- Each action requires specific permissions
- ALFRED cannot access data outside configured actions

### Best Practices
1. **Principle of Least Privilege** - Only enable actions ALFRED needs
2. **Regular Audits** - Review Zapier MCP logs monthly
3. **Sensitive Data** - Be cautious with financial/personal information
4. **Team Training** - Educate staff on appropriate ALFRED usage

## Troubleshooting

### Issue: "Zapier MCP API key not configured"
**Solution:** Add `ZAPIER_MCP_API_KEY` to Vercel environment variables

### Issue: "Action not found"
**Solution:** Verify the action is configured in your Zapier MCP dashboard

### Issue: "Permission denied"
**Solution:** Re-authorize the app in Zapier MCP settings

### Issue: "Rate limit exceeded"
**Solution:** Zapier MCP has rate limits. Upgrade your plan or wait for reset

### Issue: "Action timeout"
**Solution:** Some actions take time. ALFRED has a 30-second timeout. For long operations, use async Zaps

## Pricing

### Zapier MCP Pricing Tiers

- **Free**: 100 tasks/month, 5 Zaps
- **Starter**: $19.99/month, 750 tasks/month, 20 Zaps
- **Professional**: $49/month, 2,000 tasks/month, unlimited Zaps
- **Team**: $299/month, 50,000 tasks/month, unlimited Zaps

**Recommendation for Motta Financial:** Professional or Team tier for production use

## Example Workflows

### Workflow 1: New Client Onboarding

**User:** "Onboard new client: Sarah Johnson, sarah@example.com"

**ALFRED Actions:**
1. Create Airtable record
2. Create Karbon contact
3. Send welcome email via Gmail
4. Create Google Calendar event for kickoff meeting
5. Post to Slack #new-clients channel
6. Create QuickBooks customer record
7. Generate onboarding checklist in Asana

### Workflow 2: Tax Season Preparation

**User:** "Prepare tax season checklist for all active clients"

**ALFRED Actions:**
1. Query Airtable for active clients
2. For each client:
   - Check Karbon for outstanding work items
   - Search Gmail for missing documents
   - Create calendar reminders
   - Generate personalized email
   - Create Asana tasks for team
3. Post summary to Slack

### Workflow 3: Client Status Report

**User:** "Generate a status report for the Acme Corp account"

**ALFRED Actions:**
1. Get client data from Airtable
2. Retrieve work items from Karbon
3. Search Gmail for recent correspondence
4. Pull QuickBooks financial data
5. Find related documents in Google Drive
6. Compile comprehensive report
7. Send via email or Slack

## Advanced Configuration

### Custom Actions

You can create custom Zapier actions for proprietary systems:

1. Build a Zapier integration for your internal tools
2. Add custom actions to Zapier MCP
3. ALFRED can now interact with your custom systems

### Webhooks

For real-time updates, configure webhooks:

1. Set up Zapier webhook triggers
2. Configure ALFRED to receive notifications
3. Enable proactive alerts (e.g., "New client inquiry received")

### Multi-Step Workflows

Chain multiple actions together:

\`\`\`
User: "Complete the month-end process"

ALFRED executes:
1. Pull QuickBooks reports
2. Generate summary in Google Docs
3. Email to partners
4. Post to Slack
5. Create follow-up tasks in Asana
6. Update Airtable records
\`\`\`

## Monitoring & Analytics

### Usage Tracking

Monitor ALFRED's Zapier usage:
- View logs in Zapier MCP dashboard
- Track most-used actions
- Identify optimization opportunities

### Performance Metrics

Key metrics to monitor:
- **Response Time** - How fast actions complete
- **Success Rate** - Percentage of successful calls
- **Error Rate** - Failed actions requiring attention
- **Usage Patterns** - Peak times and popular actions

## Support

### Resources
- Zapier MCP Documentation: https://mcp.zapier.com/docs
- Zapier Support: https://zapier.com/help
- ALFRED Integration Issues: Check browser console for `[v0]` logs

### Common Questions

**Q: Can ALFRED trigger multi-step Zaps?**
A: Yes, configure multi-step Zaps in Zapier and call them via MCP

**Q: How do I add a new app?**
A: Authorize the app in Zapier, then configure actions in MCP dashboard

**Q: Is my data secure?**
A: Yes, Zapier uses enterprise-grade encryption and security practices

**Q: Can I limit which employees use certain actions?**
A: Yes, implement role-based access control in your ALFRED deployment

## Next Steps

1. ✅ Add `ZAPIER_MCP_API_KEY` to environment variables
2. ✅ Configure essential actions in Zapier MCP dashboard
3. ✅ Test with simple queries
4. ✅ Train team on ALFRED + Zapier capabilities
5. ✅ Build custom workflows for common tasks
6. ✅ Monitor usage and optimize

---

**Questions?** Check the browser console for `[v0]` debug logs or review Zapier MCP dashboard for action logs.
