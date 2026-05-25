# PulseBudget

PulseBudget is a personal finance tracker for managing monthly income, expenses, category budgets, planned purchases, and monthly spending trends.

Live app:

https://mrhashimjaved.github.io/pulsebudget/

Local repository:

`D:\mhj___\github\PusleBudget\pulsebudget`

## Current Status

- The app is deployed with GitHub Pages.
- The frontend is a React app built with Vite and TailwindCSS.
- Permanent storage is handled by Supabase.
- Authentication is handled by Supabase Auth.
- Confirmation emails are sent through Brevo SMTP.
- The app uses PKR as the display currency.
- Users only see the login/create-account screen until they sign in.
- After login, users can manage income, budgets, expenses, planned expenses, and trends.
- The `Clear account` button resets the signed-in user's finance data to zero and syncs that zero state to Supabase.

## Features

- Email/password signup and login.
- Account-gated dashboard.
- Monthly income tracking.
- Expense entry with amount, category, date, and note.
- Category budgets.
- Planned expense allocation.
- Remaining available budget calculation.
- Recent expense list.
- Six-month spending trend chart.
- Smart suggestions based on spending patterns.
- Cloud sync through Supabase.
- Local storage fallback while the app is loading or if cloud sync is unavailable.

## Tech Stack

- React: `src/`
- Build tool: Vite
- Styling: TailwindCSS
- Legacy static files: `app.js` and `styles.css`
- Runtime config: `app-config.js`
- Database schema: `supabase-schema.sql`
- Hosting: GitHub Pages
- Backend storage/auth: Supabase
- Auth email SMTP: Brevo

## File Overview

- `index.html`: Vite entry point.
- `src/App.jsx`: App shell and auth gate.
- `src/components/DashboardRoot.jsx`: Root dashboard hierarchy.
- `src/components/root/`: `CashFlowForecast`, `QuickSummary`, and `NavigationTabs`.
- `src/components/modules/`: `Budgets`, `Planned`, `Trends`, and `CategoryDetail`.
- `src/components/forms/`: Reusable `ExpenseForm` and `BudgetForm`.
- `src/hooks/usePulseBudget.js`: Supabase auth, persistence, and state actions.
- `src/lib/cashFlowEngine.js`: Single source of truth for balances, summaries, forecasts, trends, and category drill-downs.
- `src/styles.css`: TailwindCSS entry point and shared component classes.
- `public/app-config.js`: Supabase public project URL and anon key used by the React build.
- `app-config.js`: Legacy static app config retained for reference.
- `supabase-schema.sql`: Supabase table and row-level security policies.
- `.github/workflows/pages.yml`: GitHub Pages deployment workflow.

## Interface Architecture

The interface is organized in three layers inspired by Quicken Simplifi Flow.

Root dashboard:

- `CashFlowForecast`: 12-month balance projection.
- `QuickSummary`: income, bills, discretionary funds, planned funds.
- `NavigationTabs`: `Overview`, `Budgets`, `Planned`, `Trends`.

Second-layer modules:

- `Budgets`: committed vs remaining by category.
- `Planned`: future allocations.
- `Trends`: charting and projections for the selected category.

Third-layer drill-down:

- `CategoryDetail`: category-specific transactions and forecast impact.
- The selected category drives contextual trend data.

Data flow:

- `cashFlowEngine(state)` is the single source of truth for calculated balances.
- Components receive precomputed engine output instead of recalculating totals.
- Forms are reusable and emit state updates through `usePulseBudget()` actions.

## Local Development

From the repository folder:

```powershell
cd "D:\mhj___\github\PusleBudget\pulsebudget"
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:4173/
```

The app should show only the login/create-account screen until a user signs in.

## Deployment

The GitHub remote is:

```text
https://github.com/mrhashimjaved/pulsebudget.git
```

The GitHub Pages workflow deploys whenever `main` is pushed.
The workflow installs dependencies, runs `npm run build`, and uploads the generated `dist/` folder.

Normal deploy flow:

```powershell
git status
git add .
git commit -m "Describe the change"
git push origin main
```

GitHub Pages URL:

```text
https://mrhashimjaved.github.io/pulsebudget/
```

If the live site appears stale, hard refresh with `Ctrl + F5` or open the URL with a query string, for example:

```text
https://mrhashimjaved.github.io/pulsebudget/?v=latest
```

## Supabase Configuration

Project URL:

```text
https://nvyggpjwbtymvkxufszi.supabase.co
```

The public anon key is stored in `public/app-config.js`. This is acceptable for browser apps because the anon key is intentionally public. Do not commit or share the Supabase service role key, database password, or any private SMTP secrets.

`public/app-config.js` format:

```js
window.PULSEBUDGET_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_PUBLIC_ANON_KEY"
};
```

## Database Setup

Run `supabase-schema.sql` in:

`Supabase` -> `SQL Editor` -> `New query`

The schema creates:

- `public.finance_profiles`
- One JSONB `state` column per user
- Row-level security
- Policies so each authenticated user can only read, create, and update their own finance profile

Current schema:

```sql
create table if not exists public.finance_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.finance_profiles enable row level security;

drop policy if exists "Users can read their own finance profile" on public.finance_profiles;
create policy "Users can read their own finance profile"
  on public.finance_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own finance profile" on public.finance_profiles;
create policy "Users can create their own finance profile"
  on public.finance_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own finance profile" on public.finance_profiles;
create policy "Users can update their own finance profile"
  on public.finance_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

## Supabase Auth URL Settings

In Supabase, open:

`Authentication` -> `URL Configuration`

Set `Site URL`:

```text
https://mrhashimjaved.github.io/pulsebudget/
```

Add these `Redirect URLs`:

```text
https://mrhashimjaved.github.io/pulsebudget/
http://127.0.0.1:4173/
http://localhost:4173/
```

These URLs allow email confirmation and auth redirects to return to the app correctly.

## Brevo SMTP Setup

Supabase's default email sender has strict rate limits, so this project uses Brevo SMTP for confirmation emails.

In Brevo:

1. Open `Settings`.
2. Open `SMTP & API`.
3. Open the `SMTP` tab.
4. Use the SMTP server and port shown there.
5. Use the SMTP login as the Supabase SMTP username.
6. Generate an SMTP key and use it as the Supabase SMTP password.
7. Make sure the sender email is verified in Brevo.

Current Brevo SMTP values used in Supabase:

```text
SMTP Host: smtp-relay.brevo.com
SMTP Port: 587
SMTP Username: ac7717001@smtp-brevo.com
SMTP Password: Brevo SMTP key
Sender email: verified Brevo sender email
Sender name: PulseBudget
```

In Supabase:

`Authentication` -> `Emails` -> `SMTP`

Save the Brevo SMTP settings there.

If signup fails with:

```text
525 5.7.1 Unauthorized IP address
```

then Brevo is blocking the IP address Supabase used to send mail. In Brevo, check:

`Settings` -> `Security` -> authorized or blocked IP addresses

Authorize the blocked SMTP IP or relax SMTP IP restrictions.

## Resetting Account Data

Preferred in-app reset:

1. Sign in.
2. Click `Clear account` in the dashboard.
3. The app clears income, budgets, expenses, and planned expenses.
4. The cleared zero state syncs to Supabase.

Manual reset through Supabase SQL:

```sql
delete from public.finance_profiles
where user_id = (
  select id
  from auth.users
  where email = 'mrhashimjaved.moj@gmail.com'
);
```

Fully delete a user account:

```sql
delete from auth.users
where email = 'mrhashimjaved.moj@gmail.com';
```

Use full account deletion only when you need to recreate the user and redo email confirmation.

## Troubleshooting

### Online Page Does Not Respond

Check:

- Hard refresh with `Ctrl + F5`.
- Open the app with a cache-busting query string.
- Confirm GitHub Pages has finished deploying the latest commit.
- Open browser developer tools and check console errors.
- Verify the live `app.js` contains the latest commit changes.

### Login Shows "Email Not Confirmed"

Check:

- Supabase `Authentication` -> `URL Configuration`.
- The confirmation link was generated after URL settings were fixed.
- The user exists in `Authentication` -> `Users`.
- Delete and recreate the user if old confirmation links are stuck.

### Error Sending Confirmation Email

Check:

- Supabase SMTP settings.
- Brevo SMTP username is the SMTP login, not the Brevo account email unless Brevo explicitly shows that as the SMTP login.
- Brevo SMTP password is the generated SMTP key, not the Brevo API key.
- Sender email is verified in Brevo.
- Brevo transactional email sending is active.
- Supabase Auth logs for the exact SMTP error.

### Email Rate Limit Exceeded

This happens with Supabase's default email sender. Use Brevo SMTP or temporarily disable email confirmation for testing:

`Supabase` -> `Authentication` -> `Providers` -> `Email` -> `Confirm email`

## Security Notes

- The Supabase anon key is public and safe to use in frontend code when row-level security is correctly configured.
- Never expose the Supabase service role key.
- Never expose database passwords.
- Never commit the Brevo SMTP key.
- Row-level security is required because the app runs in the browser.

## Maintenance Checklist

When making changes:

1. Test locally at `http://127.0.0.1:4173/`.
2. Confirm signed-out users only see the auth screen.
3. Confirm signed-in users can see the dashboard.
4. Confirm PKR formatting still displays correctly.
5. Confirm `Clear account` resets to zero.
6. Commit changes.
7. Push to `main`.
8. Check the live GitHub Pages URL.

## Recent Important Commits

- `3377d6a` Improve hosted auth responsiveness
- `40245a7` Switch app to PKR and zero reset
- `ddd4ed2` Improve Supabase confirmation redirect handling
- `82addf3` Require sign in before showing dashboard
- `aaedcf3` Configure Supabase cloud storage
- `8f80fbd` Add PulseBudget web app
