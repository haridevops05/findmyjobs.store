# ⚡ FindMyJobs — AI Job Hunt Command Center

> **[findmyjobs.store](https://findmyjobs.store)** — Built by [Hari Krishna S.](https://harikrishna.dev)

An all-in-one job hunt dashboard with live job feeds, 9 AI-powered tools per listing, mock interview simulator, JD analyzer, outreach CRM, salary calculator, negotiation copilot, and 23+ portal tracker with persistent storage.

## ✨ Features

### 📡 Live Job Feed
- Real-time aggregation from **RemoteOK**, **Remotive**, and **Arbeitnow** APIs
- Auto-refresh every 2 minutes with sound alerts for new jobs
- Filter by source, sort by newest

### 🤖 9 AI Tools Per Job (Powered by Claude API)
| Tool | What It Does |
|------|-------------|
| 🎯 Score | Match percentage with gap analysis |
| ✉️ Cover | Tailored cover letter with your metrics |
| 🎤 Interview | 7 predicted questions + answer coaching |
| 📄 Resume | Specific tailoring suggestions |
| 🔍 ATS | Keyword analysis, ATS pass score, optimized summary |
| 🏢 Research | Company intel, tech stack, growth signals |
| 🏆 Edge | Competitive advantage analysis |
| 🤝 Referral | 3 LinkedIn referral message variants |
| 🗣️ Pitch | 30-second elevator pitch |

### 🎙️ Mock Interview Simulator
- AI interviewer asks role-specific technical questions
- Scores each answer (/10) with constructive feedback
- Overall assessment (/100) after 5 questions

### 🔬 JD Analyzer
- Paste any job description
- Get: match score, required vs nice-to-have skills, ATS keywords, salary estimate, culture signals, red flags, tailored summary

### 📇 Outreach CRM
- Track every recruiter interaction
- Status pipeline: Reached Out → Replied → Scheduled → Interviewed → Offer
- Follow-up date reminders
- Persistent storage across sessions

### 💰 Salary Calculator
- Market rates by role, location, and experience
- Breakdown by company tier (FAANG, startup, mid-market)
- Your specific leverage points and target number

### 🤝 Negotiation AI Copilot
- Paste any offer → get counter-offer strategy
- Market comparison, counter email draft, red flags

### 📅 Daily Action Planner
- AI generates personalized daily checklist
- Based on your actual progress (unchecked portals, pending follow-ups, etc.)

### 📊 Analytics Dashboard
- Application funnel visualization (Applied → Screen → Interview → Offer)
- Conversion rates
- AI score leaderboard
- CSV export

### 📋 23+ Portal Tracker
- LinkedIn, Naukri, Indeed, Wellfound, Arc.dev, Turing, Toptal, YC, RemoteOK, Remotive, and more
- Status cycling, starring, notes
- Alert setup checklist with step-by-step instructions
- Pre-filtered search URLs (sorted by newest)

### 💾 Persistent Storage
- All data saves across sessions (portal states, AI scores, CRM contacts, profile)
- No backend needed — uses artifact storage API

### 📱 PWA Ready
- Installable as mobile app
- Offline support via service worker
- Mobile-responsive UI

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/haridevops05/job-hunt-command-center.git
cd job-hunt-command-center

# Install
npm install

# Run
npm run dev
```

Open http://localhost:3000

## 🌐 Deploy to GitHub Pages + Custom Domain

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "FindMyJobs v8 🚀"
git branch -M main
git remote add origin https://github.com/haridevops05/job-hunt-command-center.git
git push -u origin main
```

### Step 2: Enable GitHub Pages
1. Go to repo → **Settings** → **Pages**
2. Source: **GitHub Actions**
3. Wait 2 minutes for first deploy

### Step 3: Connect findmyjobs.store
1. Go to repo → **Settings** → **Pages** → **Custom domain**
2. Enter: `findmyjobs.store`
3. Check "Enforce HTTPS"

### Step 4: DNS Setup (in your domain registrar)
Add these DNS records:

| Type | Name | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | haridevops05.github.io |

Wait 10-30 minutes for DNS propagation → **https://findmyjobs.store** is LIVE! 🎉

## 🏗️ Tech Stack

- **Frontend:** React 18 + Vite
- **AI:** Claude API (Sonnet 4)
- **Styling:** Inline CSS (zero dependencies)
- **Storage:** Browser artifact storage API
- **PWA:** Service Worker + Web App Manifest
- **Fonts:** Instrument Sans + JetBrains Mono

## 📁 Project Structure

```
jhcc/
├── public/
│   ├── manifest.json    # PWA manifest
│   ├── sw.js            # Service worker
│   └── favicon.svg      # App icon
├── src/
│   ├── App.jsx          # Main application (single file)
│   └── main.jsx         # React entry point
├── index.html           # HTML entry
├── package.json
├── vite.config.js
├── vercel.json          # Vercel config
├── netlify.toml         # Netlify config
└── README.md
```

## 🗺️ Roadmap

These advanced systems are documented in the app's architecture tab:

1. 🤖 **Digital Twin Auto-Apply** — Browser extension + Playwright
2. 👻 **Ghost Recruiter Network** — Monitor private Slack/Discord channels
3. 💰 **Salary Arbitrage System** — Reverse auction for your skills
4. 🧬 **Resume Genetic Algorithm** — Evolve resumes via A/B testing
5. 📈 **Predictive Market Terminal** — Bloomberg Terminal for jobs
6. 🔗 **Virtual Referral Network** — Automate referral discovery
7. 🕵️ **Competitive Intelligence** — Track other applicants
8. 🐝 **Job Hunt Drone Swarm** — 100+ monitoring bots
9. 🎙️ **Live Negotiation Copilot** — Real-time call coaching

## 👤 Author

**Hari Krishna S.**
- 🌐 [harikrishna.dev](https://harikrishna.dev)
- 💼 [LinkedIn](https://linkedin.com/in/hari-devops)
- 🐙 [GitHub](https://github.com/haridevops05)

Senior DevOps Engineer | AWS SA Professional | 6+ Years
Specializing in Kubernetes, Terraform, ArgoCD, Istio, DevSecOps

## 📄 License

MIT © Hari Krishna S.
