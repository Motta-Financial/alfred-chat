# SharePoint Integration Setup Guide

ALFRED can now search your firm's SharePoint for client documents, tax returns, engagement letters, and other files using the Microsoft Graph API.

## Prerequisites

You need to register an application in Azure Active Directory (Azure AD) to get the required credentials.

## Step 1: Register an Azure AD Application

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Enter a name (e.g., "ALFRED SharePoint Integration")
5. Select **Accounts in this organizational directory only**
6. Click **Register**

## Step 2: Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Application permissions** (not Delegated)
5. Add the following permissions:
   - `Sites.Read.All` - Read items in all site collections
   - `Files.Read.All` - Read files in all site collections
6. Click **Grant admin consent** (requires admin privileges)

## Step 3: Create a Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description (e.g., "ALFRED Integration")
4. Select an expiration period (recommended: 24 months)
5. Click **Add**
6. **IMPORTANT:** Copy the secret value immediately - you won't be able to see it again!

## Step 4: Get Your Credentials

You need three values:

1. **Tenant ID**: Found in **Azure Active Directory** > **Overview** > **Tenant ID**
2. **Client ID**: Found in your app registration **Overview** > **Application (client) ID**
3. **Client Secret**: The value you copied in Step 3

## Step 5: Add Environment Variables

Add these three environment variables to your project:

\`\`\`
MICROSOFT_TENANT_ID=your-tenant-id-here
MICROSOFT_CLIENT_ID=your-client-id-here
MICROSOFT_CLIENT_SECRET=your-client-secret-here
\`\`\`

**In v0:** Add these in the **Vars** section of the in-chat sidebar.

## Step 6: Configure SharePoint Region

The SharePoint search requires a region parameter. The default is set to "NAM" (North America).

If your SharePoint is in a different region, update the `region` parameter in `/app/api/sharepoint/search/route.ts`:

- **NAM** - North America
- **EUR** - Europe
- **APC** - Asia Pacific
- **CAN** - Canada
- **GBR** - United Kingdom
- **LAM** - Latin America

## Testing the Integration

Once configured, you can test SharePoint search by asking ALFRED:

- "Find Connor Zumpfe's 2024 tax return in SharePoint"
- "Search SharePoint for engagement letters"
- "Look for K-1 documents in SharePoint"
- "Find financial statements for Acme Corp in SharePoint"

## Troubleshooting

### Authentication Failed (401)
- Verify your credentials are correct
- Ensure admin consent was granted for the API permissions
- Check that the client secret hasn't expired

### No Results Found
- Verify the search query is correct
- Check that the client name is spelled correctly
- Ensure the documents exist in SharePoint
- Verify the region parameter matches your SharePoint location

### Configuration Error
- Ensure all three environment variables are set
- Check for placeholder values (should not contain "your_" or "placeholder")
- Verify the values are from the correct Azure AD app registration

## Security Notes

- The client secret is sensitive - never commit it to version control
- Use environment variables to store credentials
- Rotate client secrets regularly (before expiration)
- Monitor API usage in Azure AD
- Review and audit API permissions periodically

## Additional Resources

- [Microsoft Graph API Documentation](https://learn.microsoft.com/en-us/graph/)
- [Search API Reference](https://learn.microsoft.com/en-us/graph/api/resources/search-api-overview)
- [App-only Authentication](https://learn.microsoft.com/en-us/graph/auth-v2-service)
