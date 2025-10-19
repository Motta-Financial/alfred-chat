# ALFRED Integration Guide

This guide will help you integrate ALFRED into your existing Next.js application at `v0-image-analysis-git-main-motta.vercel.app`.

## Step 1: Copy Required Files

Copy these files from the ALFRED project to your existing project:

### Core Application Files
\`\`\`
app/alfred/
  ├── page.tsx                    # Main ALFRED chat interface
  └── loading.tsx                 # Loading animation

app/api/assistant/
  ├── constants.tsx               # ALFRED instructions
  ├── route.tsx                   # Assistant initialization
  ├── create/route.ts            # Create assistant
  ├── chat/route.ts              # Chat streaming
  └── thread/route.ts            # Thread management

app/api/airtable/
  ├── search-client/route.ts     # Search contacts
  ├── get-meeting-debriefs/route.ts  # Get meeting history
  └── discover-fields/route.ts   # Field discovery

app/api/karbon/
  └── search-by-id/route.ts      # Karbon client lookup

app/api/adobe/                   # ← Adobe PDF Services integration
  ├── extract/route.ts           # Extract text/tables/images from PDFs
  ├── compress/route.ts          # Compress PDFs
  ├── combine/route.ts           # Merge multiple PDFs
  ├── convert/route.ts           # Convert PDFs to other formats
  └── test-credentials/route.ts  # Test Adobe credentials

app/api/zapier/                  # ← Zapier MCP integration
  ├── mcp/route.ts              # Execute Zapier actions
  ├── test-connection/route.ts  # Test Zapier connection
  └── list-actions/route.ts     # List available actions

public/
  └── alfred-logo-original.png   # ALFRED logo
\`\`\`

### Shared Components (if not already in your project)
\`\`\`
components/ui/
  ├── button.tsx
  ├── card.tsx
  ├── input.tsx
  └── scroll-area.tsx
\`\`\`

## Step 2: Update Your Globals CSS

Add these styles to your `app/globals.css`:

\`\`\`css
/* ALFRED-specific styles */
@keyframes grid-flow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

.animate-grid-flow {
  animation: grid-flow 20s ease-in-out infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
\`\`\`

## Step 3: Set Environment Variables

Add these environment variables in your Vercel project settings:

\`\`\`env
# Core Services
OPENAI_API_KEY=your_openai_key
KARBON_API_KEY=your_karbon_key
KARBON_AUTH_TOKEN=your_karbon_token
AIRTABLE_PERSONAL_ACCESS_TOKEN=your_airtable_token

# Optional: Adobe PDF Services (for PDF processing)
ADOBE_PDF_SERVICES_CLIENT_ID=your_adobe_client_id
ADOBE_PDF_SERVICES_CLIENT_SECRET=your_adobe_client_secret

# Optional: Web Search (for real-time information)
BRAVE_SEARCH_API_KEY=your_brave_api_key

# Optional: Zapier MCP (for cross-platform app integration)
ZAPIER_MCP_API_KEY=your_zapier_mcp_api_key
\`\`\`

### Adobe PDF Services Setup

If you want to enable PDF processing capabilities (extract, compress, combine, convert):

1. Follow the detailed setup guide in `ADOBE_PDF_SERVICES_SETUP_GUIDE.md`
2. Get free credentials at: https://acrobatservices.adobe.com/dc-integration-creation-app-cdn/main.html?api=pdf-services-api
3. Add `ADOBE_PDF_SERVICES_CLIENT_ID` and `ADOBE_PDF_SERVICES_CLIENT_SECRET` to environment variables
4. Free tier includes 1,000 document transactions per month
5. Test the integration at `/test-adobe` after setup

### Zapier MCP Setup

If you want to connect ALFRED to 6000+ apps (Gmail, Slack, Calendar, QuickBooks, etc.):

1. Follow the complete setup guide in `ZAPIER_MCP_SETUP_GUIDE.md`
2. Get your API key at: https://actions.zapier.com/credentials/
3. Add `ZAPIER_MCP_API_KEY` to environment variables
4. Configure your desired actions in the Zapier NLA dashboard
5. Test the integration at `/test-zapier` after setup

## Step 4: Update Your Navigation

Add a link to ALFRED in your existing navigation:

\`\`\`tsx
<Link href="/alfred">ALFRED Ai</Link>
\`\`\`

## Step 5: Deploy

1. Push changes to your GitHub repository
2. Vercel will automatically deploy
3. ALFRED will be accessible at: `your-domain.com/alfred`

## Step 6: Custom Domain Setup

To access ALFRED at `motta.cpa/alfred`:

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add `motta.cpa` as a custom domain
3. Follow Vercel's DNS configuration instructions
4. Once configured, ALFRED will be at `motta.cpa/alfred`

## File Structure After Integration

\`\`\`
your-existing-app/
├── app/
│   ├── alfred/              # ← New ALFRED route
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── api/
│   │   ├── assistant/       # ← New assistant API
│   │   ├── airtable/        # ← New Airtable API
│   │   ├── karbon/          # ← New Karbon API
│   │   ├── adobe/           # ← New Adobe PDF Services API (optional)
│   │   └── zapier/          # ← New Zapier MCP API (optional)
│   ├── your-existing-routes/
│   └── globals.css          # ← Updated with ALFRED styles
├── components/
│   └── ui/                  # ← Ensure these exist
└── public/
    └── alfred-logo-original.png  # ← New logo
\`\`\`

## Available Integrations

### Core Integrations (Required)
- **OpenAI Assistant API** - Powers ALFRED's conversational AI
- **Airtable** - Client database and meeting debriefs
- **Karbon** - CRM integration for client work items

### Optional Integrations

#### Adobe PDF Services
Extract, compress, combine, and convert PDFs directly within ALFRED conversations.

**Capabilities:**
- `extract_pdf_text` - Extract text, tables, and structured data from PDFs
- `compress_pdf` - Reduce PDF file sizes (LOW/MEDIUM/HIGH compression)
- `combine_pdfs` - Merge multiple PDFs into one document
- `convert_pdf` - Convert PDFs to Word, Excel, PowerPoint, or images

**Setup:** See `ADOBE_PDF_SERVICES_SETUP_GUIDE.md`

**Test Page:** `/test-adobe`

#### Brave Search
Real-time web search for current tax law, IRS updates, and industry information.

**Setup:** Get free API key at https://brave.com/search/api/
- Free tier: 2,000 queries/month

#### Zapier MCP
Access 6000+ business apps through one unified interface. Makes ALFRED a true central hub.

**Popular Actions:**
- **Gmail** - Send emails, search messages, read threads
- **Google Calendar** - Create events, find meetings, update schedules
- **Slack** - Send messages, search channels, post updates
- **QuickBooks** - Get customer data, retrieve invoices, search transactions
- **HubSpot** - Get contacts, search deals, update CRM records
- **Google Drive** - Search files, upload documents, share folders

**Setup:** See `ZAPIER_MCP_SETUP_GUIDE.md`

**Test Page:** `/test-zapier`

**Example Usage:**
- "Send an email to Connor about his tax return"
- "Search my Gmail for messages from John Smith"
- "Create a calendar event for client meeting tomorrow at 2pm"
- "Get the QuickBooks customer record for Acme Corp"

## Testing

After deployment, test ALFRED by:
1. Navigate to `/alfred`
2. Wait for initialization
3. Ask: "Who are our clients?"
4. Verify Airtable and Karbon data retrieval

### Testing Adobe PDF Services (if configured)
1. Navigate to `/test-adobe`
2. Test credentials verification
3. Upload a PDF and test extraction
4. Try compression with different levels
5. Verify all operations work correctly

### Testing Zapier MCP (if configured)
1. Navigate to `/test-zapier`
2. Test connection and credentials
3. List available actions
4. Test individual actions with sample data
5. Verify actions execute successfully

## Troubleshooting

**Issue: ALFRED not initializing**
- Check environment variables are set in Vercel
- Verify OpenAI API key is valid

**Issue: Can't find client data**
- Verify Airtable and Karbon credentials
- Check API routes are deployed correctly

**Issue: Styling looks different**
- Ensure globals.css includes ALFRED styles
- Verify Tailwind CSS is configured

**Issue: Adobe PDF Services not working**
- Verify `ADOBE_PDF_SERVICES_CLIENT_ID` and `ADOBE_PDF_SERVICES_CLIENT_SECRET` are set
- Check credentials are valid in Adobe Developer Console
- See `ADOBE_PDF_SERVICES_SETUP_GUIDE.md` for detailed troubleshooting

**Issue: Web search not working**
- Verify `BRAVE_SEARCH_API_KEY` is set
- Check API key is valid at https://brave.com/search/api/
- Free tier has rate limits (1 request per second)

**Issue: Zapier MCP not working**
- Verify `ZAPIER_MCP_API_KEY` is set
- Check credentials are valid in Zapier Developer Console
- See `ZAPIER_MCP_SETUP_GUIDE.md` for detailed troubleshooting

## Support

For issues, check the debug logs in the browser console (look for `[v0]` prefixed messages).

## Additional Documentation

- `ADOBE_PDF_SERVICES_SETUP_GUIDE.md` - Complete Adobe PDF Services integration guide
- `ZAPIER_MCP_SETUP_GUIDE.md` - Complete Zapier MCP integration guide with workflow examples
- `CLERK_SETUP_GUIDE.md` - Authentication setup with Clerk
- `MICROSOFT_SSO_SETUP_GUIDE.md` - Microsoft 365 Single Sign-On setup
