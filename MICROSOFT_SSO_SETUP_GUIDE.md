# Microsoft 365 Single Sign-On Setup Guide for ALFRED AI

This guide will help you configure Microsoft 365 (Azure Entra ID) Single Sign-On for Motta Financial employees.

## Benefits of Microsoft SSO

- Seamless sign-in using existing Microsoft 365 credentials
- No need to remember separate passwords
- Enhanced security with Microsoft's enterprise authentication
- Automatic access management through your Microsoft 365 admin console

## Setup Instructions

### Step 1: Enable Microsoft as a Social Connection in Clerk

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your ALFRED AI application
3. Navigate to **User & Authentication** → **Social Connections**
4. Click **Add connection**
5. Select **For all users**
6. Choose **Microsoft** from the provider dropdown
7. Click **Add connection**

### Step 2: Configure for Development (Optional)

For development/testing, Clerk provides shared OAuth credentials:

1. After adding Microsoft connection, toggle **Enable for sign-up and sign-in**
2. Save the configuration
3. You can now test Microsoft SSO in your development environment

### Step 3: Configure for Production (Required)

For production, you must use custom credentials from your Microsoft 365 tenant:

#### 3.1: Create Azure App Registration

1. Go to the [Microsoft Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** (formerly Azure Active Directory)
3. Select **App registrations** from the left menu
4. Click **New registration**
5. Fill in the registration form:
   - **Name**: ALFRED AI - Motta Financial
   - **Supported account types**: Select "Accounts in this organizational directory only (Motta Financial only - Single tenant)"
   - **Redirect URI**: Leave blank for now (we'll add this in step 3.3)
6. Click **Register**

#### 3.2: Get Client ID and Create Client Secret

1. After registration, you'll see the app's **Overview** page
2. Copy the **Application (client) ID** - you'll need this for Clerk
3. In the left menu, click **Certificates & secrets**
4. Under **Client secrets**, click **New client secret**
5. Add a description (e.g., "ALFRED AI Production")
6. Choose an expiration period (recommended: 24 months)
7. Click **Add**
8. **IMPORTANT**: Copy the secret **Value** immediately - it won't be shown again

#### 3.3: Configure Redirect URI

1. In your Azure app registration, go to **Authentication** in the left menu
2. Click **Add a platform**
3. Select **Web**
4. In the Clerk Dashboard, go back to your Microsoft connection settings
5. Copy the **Authorized redirect URI** shown in Clerk (it looks like: `https://your-app.clerk.accounts.dev/v1/oauth_callback`)
6. Paste this URI into the Azure **Redirect URIs** field
7. Under **Implicit grant and hybrid flows**, check **ID tokens**
8. Click **Configure**

#### 3.4: Enable OpenID Permissions

1. In your Azure app registration, go to **API permissions** in the left menu
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Add these permissions:
   - `openid`
   - `profile`
   - `email`
6. Click **Add permissions**
7. Click **Grant admin consent for Motta Financial** (requires admin privileges)

#### 3.5: Configure Clerk with Custom Credentials

1. Return to the Clerk Dashboard
2. Go to your Microsoft connection settings
3. Toggle **Use custom credentials** to ON
4. Enter the **Client ID** from step 3.2
5. Enter the **Client Secret** from step 3.2
6. Click **Save**

### Step 4: Restrict to Motta Financial Domain

The existing domain restriction middleware will automatically work with Microsoft SSO. Users signing in with Microsoft must use their @mottafinancial.com email address.

Additionally, you can restrict in Azure:

1. In your Azure app registration, go to **Authentication**
2. Under **Supported account types**, ensure "Single tenant" is selected
3. This ensures only Motta Financial Microsoft 365 accounts can authenticate

### Step 5: Test the Integration

1. Sign out of ALFRED AI if you're currently signed in
2. Go to the sign-in page
3. You should see a "Continue with Microsoft" button
4. Click it and sign in with your @mottafinancial.com Microsoft 365 credentials
5. You should be redirected back to ALFRED AI and automatically signed in

## Security Considerations

### Secure Against nOAuth Vulnerability

To protect against the nOAuth vulnerability:

1. In your Azure app registration, go to **Authentication**
2. Scroll to **Advanced settings**
3. Under **Allow public client flows**, set to **No**
4. Click **Save**

### Additional Security Best Practices

1. **Regular Secret Rotation**: Rotate your client secret every 12-24 months
2. **Monitor Sign-ins**: Use Azure's sign-in logs to monitor authentication activity
3. **Conditional Access**: Consider implementing Azure Conditional Access policies for additional security
4. **MFA Enforcement**: Ensure MFA is enabled for all Motta Financial Microsoft 365 accounts

## Troubleshooting

### "AADSTS50011: The redirect URI specified in the request does not match"
- Verify the redirect URI in Azure exactly matches the one shown in Clerk Dashboard
- Make sure there are no trailing slashes or extra characters

### "AADSTS700016: Application not found in the directory"
- Ensure you're using the correct Client ID
- Verify the app registration exists in your Microsoft Entra ID tenant

### "Invalid client secret"
- The client secret may have expired - create a new one in Azure
- Ensure you copied the secret Value (not the Secret ID)

### Users from other domains can sign in
- Verify your Azure app is set to "Single tenant" mode
- Check that the domain restriction middleware is properly deployed
- Ensure the middleware.ts file is checking for @mottafinancial.com

### Microsoft button doesn't appear
- Verify the Microsoft connection is enabled in Clerk Dashboard
- Check that "Enable for sign-up and sign-in" is toggled on
- Clear your browser cache and try again

## Support Resources

- [Clerk Microsoft Documentation](https://clerk.com/docs/authentication/social-connections/microsoft)
- [Microsoft Entra ID Documentation](https://learn.microsoft.com/en-us/entra/identity/)
- [Azure App Registration Guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app)

## Maintenance

### Client Secret Expiration

Client secrets expire based on the duration you selected. To renew:

1. Go to Azure Portal → App registrations → Your app
2. Navigate to **Certificates & secrets**
3. Create a new client secret before the old one expires
4. Update the secret in Clerk Dashboard
5. Delete the old secret after verifying the new one works

### Monitoring

Regularly monitor:
- Azure sign-in logs for unusual activity
- Clerk Dashboard user activity
- Failed authentication attempts
- Client secret expiration dates
