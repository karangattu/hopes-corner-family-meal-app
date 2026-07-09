# Hope's Corner Family Meal Routes

Small Vercel app for splitting delivery stops between two drivers.

## Stack

- Next.js on Vercel Hobby
- Supabase Auth + Postgres free tier
- Leaflet with OpenStreetMap tiles
- Google Maps direction links, no Maps API key

## Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. In Supabase Auth, create the driver/coordinator users.
4. Add delivery names and addresses in the app. No delivery names or addresses are seeded in source control.
5. Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

6. Install and run:

```bash
npm install
npm run dev
```

## Deploy

Set the same environment variables in Vercel, then deploy the repo.

Skipped paid map APIs and geocoding. Add them only if manual map tagging is too slow.
