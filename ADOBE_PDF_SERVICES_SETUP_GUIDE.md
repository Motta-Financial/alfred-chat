# Adobe PDF Services API Integration Guide

This guide walks you through integrating Adobe PDF Services API with your ALFRED Chat application.

## Overview

Adobe PDF Services API provides powerful PDF manipulation capabilities including:
- **Extract**: Extract text, tables, and images from PDFs
- **Combine**: Merge multiple PDFs into one
- **Compress**: Reduce PDF file sizes
- **Convert**: Convert PDFs to other formats (Word, Excel, PowerPoint, images)
- **OCR**: Extract text from scanned documents
- **Split**: Split PDFs into multiple documents

## Step 1: Get Adobe PDF Services Credentials

### Create Adobe Account & Get API Credentials

1. **Visit Adobe Developer Console**
   - Go to: https://acrobatservices.adobe.com/dc-integration-creation-app-cdn/main.html?api=pdf-services-api

2. **Create New Credentials**
   - Click "Get started" or "Create credentials"
   - Name your project (e.g., "ALFRED Chat PDF Services")
   - Select **Node.js** as your language
   - Agree to the developer terms

3. **Download Credentials**
   - A ZIP file named `PDFServicesSDK-Node.jsSamples.zip` will download automatically
   - Extract the ZIP file
   - Open `pdfservices-api-credentials.json`

4. **Extract Your Credentials**
   \`\`\`json
   {
     "client_credentials": {
       "client_id": "your-client-id-here",
       "client_secret": "your-client-secret-here"
     },
     "service_principal_credentials": {
       "organization_id": "your-org-id-here"
     }
   }
   \`\`\`

## Step 2: Add Environment Variables

### For Local Development

Add these to your `.env.local` file:

\`\`\`bash
ADOBE_PDF_SERVICES_CLIENT_ID=your-client-id-here
ADOBE_PDF_SERVICES_CLIENT_SECRET=your-client-secret-here
\`\`\`

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `ADOBE_PDF_SERVICES_CLIENT_ID` → Your client ID
   - `ADOBE_PDF_SERVICES_CLIENT_SECRET` → Your client secret
4. Click **Save**
5. Redeploy your application

## Step 3: Install Adobe PDF Services SDK

The SDK is already included in your `package.json`. If you need to add it manually:

\`\`\`bash
npm install @adobe/pdfservices-node-sdk
\`\`\`

## Step 4: API Routes Available

Your ALFRED Chat application now includes these Adobe PDF Services endpoints:

### Extract Text from PDF
\`\`\`typescript
POST /api/adobe/extract
Content-Type: multipart/form-data

Body:
- file: PDF file to extract from
- extractType: "text" | "tables" | "images" | "all"

Response:
{
  success: true,
  extractedContent: {
    text: "...",
    tables: [...],
    images: [...]
  }
}
\`\`\`

### Combine PDFs
\`\`\`typescript
POST /api/adobe/combine
Content-Type: multipart/form-data

Body:
- files: Array of PDF files to combine

Response:
{
  success: true,
  combinedPdfUrl: "https://...",
  fileSize: 1234567
}
\`\`\`

### Compress PDF
\`\`\`typescript
POST /api/adobe/compress
Content-Type: multipart/form-data

Body:
- file: PDF file to compress
- compressionLevel: "low" | "medium" | "high"

Response:
{
  success: true,
  compressedPdfUrl: "https://...",
  originalSize: 5000000,
  compressedSize: 1500000,
  compressionRatio: "70%"
}
\`\`\`

### Convert PDF
\`\`\`typescript
POST /api/adobe/convert
Content-Type: multipart/form-data

Body:
- file: PDF file to convert
- targetFormat: "docx" | "xlsx" | "pptx" | "png" | "jpg"

Response:
{
  success: true,
  convertedFileUrl: "https://...",
  format: "docx"
}
\`\`\`

## Step 5: Using Adobe PDF Services in ALFRED Assistant

Once configured, you can add Adobe PDF Services as function tools to your ALFRED assistant:

### Example: Add PDF Extract Function

In `app/api/assistant/create/route.ts`, add this tool:

\`\`\`typescript
{
  type: "function",
  function: {
    name: "extract_pdf_content",
    description: "Extract text, tables, and images from PDF documents. Use for analyzing client documents, tax forms, financial statements.",
    parameters: {
      type: "object",
      properties: {
        fileId: {
          type: "string",
          description: "OpenAI file ID of the uploaded PDF"
        },
        extractType: {
          type: "string",
          description: "What to extract: text, tables, images, or all",
          enum: ["text", "tables", "images", "all"]
        }
      },
      required: ["fileId", "extractType"]
    }
  }
}
\`\`\`

## Step 6: Testing Your Integration

### Test Extract Endpoint

\`\`\`bash
curl -X POST http://localhost:3000/api/adobe/extract \
  -F "file=@/path/to/document.pdf" \
  -F "extractType=text"
\`\`\`

### Test Compress Endpoint

\`\`\`bash
curl -X POST http://localhost:3000/api/adobe/compress \
  -F "file=@/path/to/large-document.pdf" \
  -F "compressionLevel=high"
\`\`\`

## Pricing & Limits

### Free Tier
- **1,000 document transactions per month** (free for 6 months)
- All PDF Services operations included
- No credit card required for trial

### Paid Plans
After free tier:
- **Pay-as-you-go**: $0.05 - $0.10 per document transaction
- **Volume discounts** available for high usage

### Rate Limits
- **Free tier**: ~10 requests per minute
- **Paid tier**: Higher limits based on plan

## Troubleshooting

### "Adobe credentials not configured"
- Verify environment variables are set correctly
- Check variable names match exactly: `ADOBE_PDF_SERVICES_CLIENT_ID` and `ADOBE_PDF_SERVICES_CLIENT_SECRET`
- Redeploy after adding environment variables

### "Invalid credentials"
- Ensure you copied the full client ID and secret from `pdfservices-api-credentials.json`
- Check for extra spaces or line breaks
- Regenerate credentials if needed from Adobe Developer Console

### "File too large"
- Adobe PDF Services has file size limits (typically 100MB per file)
- Consider compressing files before processing
- Split large PDFs into smaller chunks

### "Rate limit exceeded"
- Free tier has ~10 requests per minute
- Implement request queuing (similar to `lib/rate-limiter.ts`)
- Upgrade to paid plan for higher limits

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate credentials** periodically
4. **Monitor usage** in Adobe Developer Console
5. **Implement rate limiting** to prevent abuse

## Additional Resources

- [Adobe PDF Services Documentation](https://developer.adobe.com/document-services/docs/overview/pdf-services-api/)
- [Node.js SDK Reference](https://developer.adobe.com/document-services/docs/overview/pdf-services-api/howtos/)
- [API Reference](https://developer.adobe.com/document-services/apis/pdf-services/)
- [Code Samples](https://github.com/adobe/pdfservices-node-sdk-samples)

## Support

For Adobe PDF Services support:
- [Adobe Developer Forums](https://community.adobe.com/t5/document-services-apis/ct-p/ct-Document-Cloud-SDK)
- [GitHub Issues](https://github.com/adobe/pdfservices-node-sdk/issues)
- Email: pdfservices@adobe.com
