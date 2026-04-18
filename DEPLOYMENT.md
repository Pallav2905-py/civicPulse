# Deployment Guide for CivicPulse

This guide will help you deploy your CivicPulse application to **Vercel**, the recommended platform for Next.js apps.

## Prerequisites

1.  **GitHub Account**: Ensure your project is pushed to a GitHub repository.
2.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com) using your GitHub account.
3.  **Supabase Project**: You already have this connected.

## Step 1: Push Code to GitHub

If you haven't already, push your code to a new GitHub repository:

```bash
git init
git add .
git commit -m "Ready for deployment"
# Create a new repo on GitHub, then run the commands shown there, e.g.:
# git remote add origin https://github.com/YOUR_USERNAME/civic-pulse.git
# git push -u origin main
```

## Step 2: Deploy on Vercel

1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your `civic-pulse` repository.
4.  **Framework Preset**: It should auto-detect "Next.js".

## Step 3: Configure Environment Variables

**CRITICAL STEP**: You must add your environment variables before clicking Deploy.

In the "Environment Variables" section, add the following (copy values from your local `.env.local`):

| Variable Name | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon API Key |
| `GEMINI_API_KEY` | Google Gemini API Key for AI features |
| `EMAIL_USER` | Email address for sending notifications |
| `EMAIL_PASS` | App Password for the email account |
| `NEXT_PUBLIC_APP_URL` | Set this to your Vercel URL (e.g. `https://your-app.vercel.app`) after deployment, or use `http://localhost:3000` for now |

## Step 4: Deploy

1.  Click **"Deploy"**.
2.  Wait for the build to complete.
3.  Once finished, you will get a live URL (e.g., `https://civic-pulse-xyz.vercel.app`).

## Step 5: Post-Deployment Setup

1.  **Supabase Auth Redirects**:
    *   Go to **Supabase Dashboard > Authentication > URL Configuration**.
    *   Add your new Vercel URL to **Site URL** and **Redirect URLs**.
    *   Example: `https://civic-pulse-xyz.vercel.app/**`

2.  **Test It**:
    *   Try logging in.
    *   Try submitting a complaint.
    *   Check if AI classification works.

## Troubleshooting

-   **Build Failed?** Check the "Logs" tab in Vercel to see the error.
-   **Login not working?** Double-check your Supabase URL Configuration.
-   **AI not working?** Verify `GEMINI_API_KEY` is set correctly in Vercel.
