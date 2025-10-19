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
OPENAI_API_KEY=your_openai_key
KARBON_API_KEY=your_karbon_key
KARBON_AUTH_TOKEN=your_karbon_token
AIRTABLE_PERSONAL_ACCESS_TOKEN=your_airtable_token
\`\`\`

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
│   │   └── karbon/          # ← New Karbon API
│   ├── your-existing-routes/
│   └── globals.css          # ← Updated with ALFRED styles
├── components/
│   └── ui/                  # ← Ensure these exist
└── public/
    └── alfred-logo-original.png  # ← New logo
\`\`\`

## Testing

After deployment, test ALFRED by:
1. Navigate to `/alfred`
2. Wait for initialization
3. Ask: "Who are our clients?"
4. Verify Airtable and Karbon data retrieval

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

## Support

For issues, check the debug logs in the browser console (look for `[v0]` prefixed messages).
