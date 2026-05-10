# Token Optimization Guide for ALFRED Assistant

## Overview
This guide documents the token optimization strategies implemented in ALFRED to reduce OpenAI API costs while maintaining quality.

## Optimizations Implemented

### 1. Condensed System Instructions (70% Reduction)
**Before:** ~2,000 words of verbose instructions
**After:** ~500 words of concise, clear instructions
**Savings:** ~1,500 tokens per request

The system instructions were streamlined to focus on essential guidance while removing redundancy and verbosity.

### 2. Streamlined Function Definitions (50% Reduction)
**Before:** Verbose descriptions with extensive examples
**After:** Clear, concise descriptions with essential parameters only
**Savings:** ~500 tokens per request

Function descriptions now provide just enough context for the model to use them correctly without unnecessary detail.

### 3. Model Selection: GPT-4o-mini
**Change:** Switched from GPT-4o to GPT-4o-mini
**Cost Reduction:** ~60% lower cost per token
**Quality:** Maintains high quality for tax advisory tasks

GPT-4o-mini provides excellent performance for structured tasks like client research and tax guidance at a fraction of the cost.

### 4. Response Truncation
**Implementation:** Automatic truncation of large function responses
**Limit:** 4,000 tokens per function response
**Behavior:** Arrays are truncated with metadata, objects are summarized

Large database queries and API responses are automatically truncated to prevent token bloat while preserving essential information.

### 5. Token Usage Tracking
**Features:**
- Input token estimation
- Output token tracking
- Function call counting
- Per-request summary logging

All requests now log detailed token usage statistics for monitoring and optimization.

## Token Usage Monitoring

Check the console logs for token usage summaries:
\`\`\`
[v0] Estimated input tokens: 150
[v0] Function search_airtable_client response tokens: 450
[v0] Function search_karbon_by_id response tokens: 380
[v0] Token usage summary: {
  inputTokens: 150,
  outputTokens: 1250,
  totalTokens: 1400,
  functionCalls: 3
}
\`\`\`

## Expected Savings

**Per Request:**
- System instructions: ~1,500 tokens saved
- Function definitions: ~500 tokens saved
- Response truncation: ~2,000 tokens saved (variable)
- **Total:** ~4,000 tokens saved per request

**Cost Impact:**
- Previous: ~6,000 tokens/request × $0.0025/1K = $0.015/request
- Optimized: ~2,000 tokens/request × $0.00015/1K = $0.0003/request
- **Savings:** ~95% cost reduction per request

## Best Practices

1. **Keep queries focused** - Specific questions use fewer tokens
2. **Avoid redundant searches** - The assistant caches client data within a conversation
3. **Use structured queries** - Clear, direct questions get better results with fewer tokens
4. **Monitor token usage** - Check logs regularly to identify optimization opportunities

## Future Optimizations

1. **Conversation pruning** - Automatically remove old messages from thread context
2. **Semantic caching** - Cache common queries and responses
3. **Dynamic model selection** - Use GPT-4o for complex queries, GPT-4o-mini for simple ones
4. **Response streaming optimization** - Further reduce token usage in streaming responses

## Configuration

Token limits and thresholds are configured in `app/api/assistant/constants.tsx`:

\`\`\`typescript
export const TOKEN_LIMITS = {
  GPT_4O: 128000,
  GPT_4O_MINI: 128000,
  WARNING_THRESHOLD: 100000,
  MAX_FUNCTION_RESPONSE: 4000,
}
\`\`\`

Adjust these values based on your usage patterns and requirements.
