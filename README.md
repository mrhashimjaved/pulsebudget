# PulseBudget

A personal finance tracker for expenses, budgets, planned spending, and monthly trend suggestions.

## Permanent Storage

GitHub Pages hosts only static files, so permanent cross-device data lives in Supabase.

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase-schema.sql`.
3. Copy your project URL and anon public key into `app-config.js`.
4. Deploy the repository with GitHub Pages.

After that, create an account inside the app. Your finance data will sync to Supabase and follow you across devices.

## GitHub Pages

The included workflow deploys the site from the repository root whenever `main` is pushed.
