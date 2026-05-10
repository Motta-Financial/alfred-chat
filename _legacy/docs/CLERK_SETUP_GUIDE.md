# Clerk Authentication Setup Guide for ALFRED AI

This guide will help you configure Clerk authentication to restrict access to Motta Financial team members only.

## Step 1: Configure Environment Variables

Make sure these environment variables are set in your Vercel project (or .env.local for local development):

\`\`\`
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
\`\`\`

## Step 2: Restrict Email Domains in Clerk Dashboard

To ensure only @mottafinancial.com email addresses can sign up:

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **User & Authentication** → **Restrictions**
4. Under **Email address**, click **Add restriction**
5. Select **Allowlist**
6. Add `mottafinancial.com` to the allowed domains
7. Click **Save**

Now only users with @mottafinancial.com email addresses can sign up and access ALFRED AI.

## Step 3: Configure Sign-In/Sign-Up Settings

1. In the Clerk Dashboard, go to **User & Authentication** → **Email, Phone, Username**
2. Make sure **Email address** is enabled and set as required
3. Optionally enable **Password** authentication
4. **Recommended**: Enable **Microsoft** OAuth for seamless sign-in with Microsoft 365 accounts
   - See [MICROSOFT_SSO_SETUP_GUIDE.md](./MICROSOFT_SSO_SETUP_GUIDE.md) for detailed Microsoft SSO setup instructions

## Step 4: Invite Team Members

You can invite team members directly from the Clerk Dashboard:

1. Go to **Users** in the Clerk Dashboard
2. Click **Create user** or **Invite user**
3. Enter their @mottafinancial.com email address
4. They'll receive an invitation email to set up their account

## Step 5: Test Authentication

1. Try accessing the app - you should be redirected to the sign-in page
2. Try signing up with a non-@mottafinancial.com email - it should be rejected
3. Sign up with a @mottafinancial.com email - it should work
4. If Microsoft SSO is configured, test signing in with Microsoft 365 credentials
5. Verify you can access ALFRED AI after signing in

## Troubleshooting

### "Origin header missing" error
- Make sure your Clerk environment variables are correctly set
- Verify the domain in Clerk Dashboard matches your deployment URL
- Check that middleware.ts is properly configured

### Can't sign in/sign up
- Verify email domain restrictions are set correctly in Clerk Dashboard
- Check that CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY are valid
- Make sure you're using the correct Clerk environment (development vs production)

### Users can access without signing in
- Verify middleware.ts is in the root directory
- Check that clerkMiddleware is properly protecting routes
- Make sure the app is deployed with the latest code

## Security Best Practices

1. **Use Production Keys in Production**: Make sure to use production Clerk keys (pk_live_... and sk_live_...) when deploying to production
2. **Enable MFA**: Consider enabling multi-factor authentication for additional security
3. **Monitor User Activity**: Regularly check the Clerk Dashboard for unusual sign-in activity
4. **Rotate Keys**: Periodically rotate your Clerk secret keys
5. **Audit Permissions**: Regularly review who has access to the application
6. **Microsoft SSO**: Use Microsoft 365 SSO for enhanced security and seamless authentication

## Support

If you encounter issues:
- Check the [Clerk Documentation](https://clerk.com/docs)
- Review the browser console for error messages
- For Microsoft SSO issues, see [MICROSOFT_SSO_SETUP_GUIDE.md](./MICROSOFT_SSO_SETUP_GUIDE.md)
- Contact the development team for assistance
