## Environment setup

Create a local `.env.local` in the project root with:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace_with_a_long_random_string

GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Chargebee (server-side only)
CHARGEBEE_SITE=hp-demo-test.chargebee.com
CHARGEBEE_API_KEY=your_api_key

# Chargebee.js (browser) - used for Pricing Tables + Customer Portal embed
NEXT_PUBLIC_CHARGEBEE_JS_SITE=hp-demo-test

# Pricing pages are configured in `src/lib/pricingTables.ts`
```

To generate a secret, you can run:

```bash
openssl rand -base64 32
```

Important: don’t leave `NEXTAUTH_SECRET` empty and don’t wrap it in quotes.

