# Deploying your Text Back Coach app (cheapest path)

## What you need
- A free GitHub account (github.com)
- A free Vercel account (vercel.com) — sign up with your GitHub account, one click
- An Anthropic API key (console.anthropic.com) — you'll need a card on file, but at low usage this costs pennies to a few dollars a month

## Step 1: Get an Anthropic API key
1. Go to console.anthropic.com and sign up / log in
2. Go to "API Keys" and create a new key
3. Copy it somewhere safe — you won't be able to see it again after this

## Step 2: Put this project on GitHub
1. Create a new repository on github.com (e.g. "text-back-coach")
2. Upload these two files/folders keeping the same structure:
   - index.html
   - api/chat.js
3. Commit them

## Step 3: Deploy on Vercel
1. Go to vercel.com, log in with GitHub
2. Click "Add New Project", select your repository
3. Before deploying, go to "Environment Variables" and add:
   - Name: ANTHROPIC_API_KEY
   - Value: (paste the key from Step 1)
4. Click Deploy

Vercel will give you a free URL like `text-back-coach.vercel.app` — that's it, your app is live and the API key is safely hidden server-side.

## Step 4 (optional): a real domain name
If you want something like `textbackcoach.com` instead of the vercel.app subdomain:
1. Buy the domain through Namecheap or Google Domains — usually around $10-15/year
2. In your Vercel project settings, go to "Domains" and add your domain
3. Follow Vercel's instructions to point your domain's DNS at Vercel (usually just adding one or two records at your registrar)

## Ongoing costs
- Vercel hosting: free at this scale
- Domain (optional): ~$10-15/year
- Anthropic API usage: pay-as-you-go, billed per request. At low volume (a handful of people testing it) this is typically a few dollars a month at most. You can set a spending limit in the Anthropic console so it never goes above what you're comfortable with.

## If you get stuck
Bring the error message or screenshot back to this chat and I can help debug the exact step.
