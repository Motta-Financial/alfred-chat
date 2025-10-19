# Web Search Optimization Guide

## Overview
ALFRED's web search capabilities have been optimized to ensure accurate, current tax information from authoritative sources.

## Key Improvements

### 1. Enhanced Function Descriptions
- **web_search**: Now explicitly states it's REQUIRED for current tax info
- **web_scrape**: Clarified as a follow-up tool to extract full content from specific URLs
- Both functions now include detailed examples in their descriptions

### 2. Improved Tax Query Detection
The system now detects tax-related queries more accurately by checking for:
- Tax terminology (IRC, IRS, deduction, credit, exemption, etc.)
- Year references (2024, 2023, etc.)
- Form numbers (Form 1040, Schedule C, etc.)
- Publication references

### 3. Expanded Authoritative Sources
Site filtering now includes:
- irs.gov (primary source)
- taxnotes.com (professional tax news)
- ustaxcourt.gov (court rulings)
- treasury.gov (Treasury regulations)
- congress.gov (legislation)

### 4. Better Content Extraction
The web scraper now:
- Removes navigation, headers, footers, and sidebars
- Preserves more content (15,000 characters vs 10,000)
- Provides metadata about source and truncation
- Cleans HTML more effectively

### 5. Mandatory Web Search Policy
The assistant instructions now REQUIRE web_search for:
- Current tax rates and limits
- Recent IRS guidance
- New legislation
- Current-year calculations
- Form and publication updates

## Usage Examples

### Good: Using Web Search
\`\`\`
User: "What's the 2024 standard deduction?"
Assistant: [Calls web_search] "According to IRS.gov, the 2024 standard deduction is..."
\`\`\`

### Bad: Not Using Web Search
\`\`\`
User: "What's the 2024 standard deduction?"
Assistant: "The standard deduction is..." [NO WEB SEARCH - OUTDATED INFO]
\`\`\`

## Testing Web Search

Visit `/test-web-search` (if created) or use these test queries:
- "2024 standard deduction amounts"
- "IRC Section 199A qualified business income"
- "IRS Notice 2024-7 clean vehicle credit"
- "Big Beautiful Bill tax changes"

## Monitoring

Check debug logs for:
- `[v0] Web search request received`
- `[v0] Is tax query: true`
- `[v0] Enhanced query: [query with site filters]`
- `[v0] Brave Search results count: X`

## Cost Optimization

- Brave Search API: 2,000 free queries/month
- Rate limited to 1 request/second
- Results cached in conversation context
- Scraping limited to 15,000 characters per page

## Troubleshooting

**Assistant not using web_search:**
- Check function description clarity
- Verify BRAVE_SEARCH_API_KEY is set
- Review assistant instructions emphasis on mandatory usage

**Poor search results:**
- Verify tax query detection is working
- Check site filter is being applied
- Try more specific search terms

**Scraping failures:**
- Some sites block automated access
- Use alternative URLs from search results
- Check URL is publicly accessible
