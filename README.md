# Allermains — UI for redeeming cards

This branch adds a simple, responsive static frontend that connects to Supabase to:

- Sign up / sign in users (email + password)
- Submit a 7-digit code to redeem a physical card (calls your Supabase Edge Function)
- Display the user's Allergies-deck (cards claimed_by the user)

Files added:
- index.html
- styles.css
- app.js

Configuration
1. Open `app.js` and set the three constants at the top:
   - SUPABASE_URL: your Supabase URL (eg. https://your-project.supabase.co)
   - SUPABASE_ANON_KEY: your public anon key (never commit service_role key)
   - REDEEM_FUNCTION_URL: URL of your Supabase Edge Function that handles redeeming (eg. https://.../functions/v1/redeem-card)

2. Deploy the branch to static hosting (GitHub Pages, Netlify, Vercel) or serve the files from your server.

Security reminder
- Do not put your Supabase service_role key in frontend files. Rotate it immediately if it was ever exposed.

