## This template provides a minimal setup to get Next.js working with MiniKit
test1
## Setup

```bash
cp .env.example .env
pnpm i
pnpm dev

```

To run as a mini app choose a production app in the dev portal and use NGROK to tunnel. Set the `NEXTAUTH_URL` and the redirect url if using sign in with worldcoin to that ngrok url

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

To use the application, you'll need to:

1. **Get World ID Credentials**
   From the [World ID Developer Portal](https://developer.worldcoin.org/):

   - Create a new app to get your `APP_ID`
   - Get `DEV_PORTAL_API_KEY` from the API Keys section
   - Navigate to "Sign in with World ID" page to get:
     - `WLD_CLIENT_ID`
     - `WLD_CLIENT_SECRET`

2. **Configure Action**
   - In the Developer Portal, create an action in the "Incognito Actions" section
   - Use the same action name in `components/Verify/index.tsx`

View docs: [Docs](https://docs.world.org/)

[Developer Portal](https://developer.worldcoin.org/)

## Deploying to Vercel

### Prerequisites

1. A Vercel account: [Sign up here](https://vercel.com/signup) if you don't have one
2. The [Vercel CLI](https://vercel.com/docs/cli) installed (optional for advanced configuration)
3. Your required API keys (Google Maps, Worldcoin)

### Deployment Steps

1. **Push your code to GitHub**
   Make sure your project is in a GitHub repository.

2. **Import your project in Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Configure the project:
     - Framework Preset: Next.js
     - Build Command: `pnpm build` (already configured in vercel.json)
     - Install Command: `pnpm install` (already configured in vercel.json)

3. **Set up Environment Variables**
   In the Vercel project settings, add the following environment variables:
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Your Google Maps API key
   - `NEXT_PUBLIC_WORLDCOIN_APP_ID`: Your Worldcoin App ID
   - `NEXTAUTH_SECRET`: A secure random string for NextAuth session encryption
   - `NEXTAUTH_URL`: The URL of your deployed application (e.g., https://your-app.vercel.app)

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your application

### Subsequent Deployments

Vercel automatically deploys when you push changes to your GitHub repository. For manual deployments, you can:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
cd /Users/chenpinhao/coffeeworld
vercel
```

## Authentication with Worldcoin

This application uses Worldcoin for authentication. For development and testing purposes, there is also a development login option available.

### Setting up Worldcoin

1. **Get World ID Credentials**
   From the [World ID Developer Portal](https://developer.worldcoin.org/):

   - Create a new app to get your `APP_ID`
   - Set up the "Sign in with World ID" feature

2. **Configure Authentication**
   - Use your `APP_ID` as the `NEXT_PUBLIC_WORLDCOIN_APP_ID` environment variable
   - Ensure the callback URL in the Worldcoin Developer Portal matches your application URL
