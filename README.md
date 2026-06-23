# 📅 Staff Roster Generator

A constraint-based weekly roster generator for shift-based teams.
Built with React + Vite. Deploy in minutes to Vercel.

---

## Features
- Auto-generates a full weekly roster with one click
- Enforces: No Off on Fri/Sat/Sun, No PM→AM back-to-back, min coverage per position
- Edit any cell manually after generation
- Add / remove staff dynamically
- Export to CSV for printing or sharing
- Configurable rules panel

---

## Project Structure

```
roster-app/
├── index.html
├── vite.config.js
├── package.json
├── vercel.json
└── src/
    ├── main.jsx               ← React entry point
    ├── App.jsx                ← Main app, state management
    ├── index.css              ← Global reset
    ├── data/
    │   └── constants.js       ← Staff, rules, colours, shift config
    ├── utils/
    │   ├── generateRoster.js  ← Scheduling algorithm (edit rules here)
    │   └── exportCSV.js       ← CSV export helper
    └── components/
        ├── RosterTable.jsx    ← Weekly grid
        ├── ShiftBadge.jsx     ← AM / PM / Off badge + dropdown
        ├── StatsBar.jsx       ← Per-staff shift count summary
        ├── RulesPanel.jsx     ← Configurable constraints UI
        └── AddStaffForm.jsx   ← Add new staff member
```

---

## Getting Started Locally

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (opens at http://localhost:5173)
npm run dev

# 3. Build for production
npm run build
```

---

## Deploy to Vercel (Free — ~5 minutes)

### Option A: Via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```
Your app will be live at `https://roster-app-xxxx.vercel.app`

### Option B: Via GitHub (recommended for ongoing use)
1. Push this folder to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial roster app"
   git remote add origin https://github.com/YOUR_USERNAME/roster-app.git
   git push -u origin main
   ```
2. Go to https://vercel.com → "New Project" → Import your GitHub repo
3. Vercel auto-detects Vite — click **Deploy**
4. Every future `git push` auto-redeploys ✅

---

## Customising the Scheduling Rules

Open `src/utils/generateRoster.js` to edit the algorithm.
Open `src/data/constants.js` to change:
- Staff names and positions
- Shift times (labels only — update `SHIFT_STYLES`)
- Default rules (`DEFAULT_RULES`)
- Weekend days (`WEEKEND_DAYS`)

---

## Adding a Database (Optional Next Step)

To persist rosters across sessions, add Supabase (free):

```bash
npm install @supabase/supabase-js
```

Create a `rosters` table in Supabase, then in `App.jsx`:
```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Save
await supabase.from('rosters').insert({ week: weekLabel, data: roster })

// Load
const { data } = await supabase.from('rosters').select('*').eq('week', weekLabel)
```

---

## Tech Stack
- **React 18** — UI
- **Vite 5** — Dev server + build tool
- **Vercel** — Hosting (free tier)
- No backend required
