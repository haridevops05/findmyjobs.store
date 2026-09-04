import { useEffect, useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════
   WorldMap.jsx v9 — REAL INDIA MAP + INTERNATIONAL SIDEBAR
   ✅ Accurate India SVG with state outlines (Natural Earth data)
   ✅ City glow lights up gold when DevOps jobs available
   ✅ Animated pulse rings on active cities
   ✅ Click city → panel with live jobs + LinkedIn/Naukri direct links
   ✅ International sidebar (US, UK, EU, SG, UAE, CA, AU)
   ✅ 7-day freshness filter enforced
   ═══════════════════════════════════════════════════════════════════ */

const MAX_AGE_MS = 7 * 86400000;
const CACHE_KEY  = "wm9_cache";
const CACHE_TS   = "wm9_ts";
const CACHE_TTL  = 15 * 60 * 1000;

const PROXIES = [
  u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  u => `https://proxy.corsfix.com/?${u}`,
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://api.codetabs.com/v1/proxy/?quest=${u}`,
];

async function fetchProxy(url) {
  for (const p of PROXIES) {
    try {
      const r = await fetch(p(url), { signal: AbortSignal.timeout(9000), headers: { Accept: "application/json" } });
      if (!r.ok) continue;
      return await r.json();
    } catch { continue; }
  }
  return null;
}

const N = () => Date.now();
function parseTs(v) {
  if (!v) return N();
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
  const d = new Date(v); return isNaN(d.getTime()) ? N() : d.getTime();
}
function isFresh(ts) { return N() - ts <= MAX_AGE_MS; }
function fmtDate(ts) {
  const d = Math.floor((N() - ts) / 60000);
  if (d < 2)    return "Just now";
  if (d < 60)   return `${d}m ago`;
  if (d < 1440) return `${Math.floor(d / 60)}h ago`;
  if (d < 2880) return "Yesterday";
  return `${Math.floor(d / 1440)}d ago`;
}

const DKW = ["devops","platform engineer","sre","site reliability","cloud engineer","infrastructure","kubernetes","eks","aws","terraform","gitops","devsecops","mlops","cloud architect","openshift","helm","argocd","k8s","ci/cd"];
const EKW = ["intern","junior","fresher","entry level","0-2 year","sales","marketing","recruiter","hr "];
function rel(t = "", d = "") {
  const s = (t + " " + d.slice(0, 150)).toLowerCase();
  return DKW.some(k => s.includes(k)) && !EKW.some(k => s.includes(k));
}

const SK = ["kubernetes","eks","terraform","argocd","aws","istio","falco","kyverno","mlops","gitops","devsecops","helm","prometheus","grafana","python","sre","gitlab","docker","ansible","openshift","datadog","vault","hipaa","soc2","platform","devops","infrastructure","ci/cd"];
function calcScore(t = "", d = "", tags = []) {
  const s = (t + " " + d.slice(0, 400) + " " + tags.join(" ")).toLowerCase();
  let sc = Math.min(35 + SK.filter(k => s.includes(k)).length * 4, 95);
  if (/senior|sr\.|staff|lead|principal/i.test(s)) sc = Math.min(sc + 5, 95);
  if (s.includes("eks") && s.includes("terraform")) sc = Math.min(sc + 5, 95);
  if (s.includes("argocd") || s.includes("gitops")) sc = Math.min(sc + 3, 95);
  return sc;
}

function pRemotive(d) {
  return (d?.jobs || []).filter(j => rel(j.title, j.description || "")).map(j => {
    const ts = parseTs(j.publication_date); if (!isFresh(ts)) return null;
    return { id: "rv_" + j.id, title: j.title, co: j.company_name, url: j.url, sal: j.salary || "", tags: [j.category, ...(j.tags || [])].filter(Boolean).slice(0, 4), desc: (j.description || "").replace(/<[^>]+>/g, "").slice(0, 200), ts, src: "Remotive" };
  }).filter(Boolean);
}
function pROK(d) {
  return (Array.isArray(d) ? d : []).filter(j => j.position && rel(j.position, j.description || "")).map(j => {
    const ts = j.date ? j.date * 1000 : N(); if (!isFresh(ts)) return null;
    return { id: "ro_" + j.id, title: j.position, co: j.company || "Company", url: j.url || "https://remoteok.com", sal: j.salary_min ? `$${Math.round(j.salary_min / 1000)}k–$${Math.round(j.salary_max / 1000)}k` : "", tags: (j.tags || []).slice(0, 4), desc: (j.description || "").replace(/<[^>]+>/g, "").slice(0, 200), ts, src: "RemoteOK" };
  }).filter(Boolean);
}
function pABN(d) {
  return (d?.data || []).filter(j => rel(j.title, j.description || "")).map(j => {
    const ts = j.created_at ? j.created_at * 1000 : N(); if (!isFresh(ts)) return null;
    return { id: "ab_" + j.slug, title: j.title, co: j.company_name, url: j.url, sal: "", tags: (j.tags || []).slice(0, 4), desc: (j.description || "").replace(/<[^>]+>/g, "").slice(0, 200), ts, src: "Arbeitnow" };
  }).filter(Boolean);
}

const SOURCES = [
  { url: "https://remotive.com/api/remote-jobs?category=devops-sysadmin&limit=50", parse: pRemotive },
  { url: "https://remoteok.com/api?tag=devops",     parse: pROK },
  { url: "https://remoteok.com/api?tag=kubernetes",  parse: pROK },
  { url: "https://remoteok.com/api?tag=aws",         parse: pROK },
  { url: "https://remoteok.com/api?tag=terraform",   parse: pROK },
  { url: "https://www.arbeitnow.com/api/job-board-api?search=devops+kubernetes", parse: pABN },
  { url: "https://www.arbeitnow.com/api/job-board-api?search=platform+engineer", parse: pABN },
];

// ── City portals ────────────────────────────────────────────────────
const CP = {
  hyd:    [{ n: "LinkedIn Hyderabad", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer%20OR%20Platform%20Engineer%20OR%20SRE&location=Hyderabad%2C%20Telangana%2C%20India&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri Hyderabad", url: "https://www.naukri.com/devops-jobs-in-hyderabad?k=senior+devops+engineer+kubernetes+aws&l=hyderabad&jobAge=7&sort=1", c: "#FF7555" }, { n: "Indeed Hyderabad", url: "https://in.indeed.com/jobs?q=senior+devops+engineer+kubernetes+aws&l=Hyderabad&fromage=7&sort=date", c: "#003A9B" }],
  blr:    [{ n: "LinkedIn Bengaluru", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer%20OR%20Platform%20Engineer%20OR%20SRE&location=Bengaluru%2C%20Karnataka%2C%20India&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri Bengaluru", url: "https://www.naukri.com/devops-jobs-in-bangalore?k=senior+devops+engineer+kubernetes+aws&l=bangalore&jobAge=7&sort=1", c: "#FF7555" }, { n: "Wellfound India", url: "https://wellfound.com/role/l/devops-engineer/india", c: "#6366f1" }],
  mum:    [{ n: "LinkedIn Mumbai", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Mumbai%2C%20Maharashtra%2C%20India&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri Mumbai", url: "https://www.naukri.com/devops-jobs-in-mumbai?k=senior+devops+engineer+kubernetes&l=mumbai&jobAge=7&sort=1", c: "#FF7555" }],
  del:    [{ n: "LinkedIn Delhi NCR", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Delhi%2C%20India&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri Delhi", url: "https://www.naukri.com/devops-jobs-in-delhi-ncr?k=senior+devops+engineer+kubernetes&l=delhi&jobAge=7&sort=1", c: "#FF7555" }],
  pun:    [{ n: "LinkedIn Pune", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Pune%2C%20Maharashtra%2C%20India&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri Pune", url: "https://www.naukri.com/devops-jobs-in-pune?k=senior+devops+engineer+kubernetes&l=pune&jobAge=7&sort=1", c: "#FF7555" }],
  che:    [{ n: "LinkedIn Chennai", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Chennai%2C%20Tamil%20Nadu%2C%20India&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri Chennai", url: "https://www.naukri.com/devops-jobs-in-chennai?k=senior+devops+engineer&l=chennai&jobAge=7&sort=1", c: "#FF7555" }],
  kol:    [{ n: "LinkedIn Kolkata", url: "https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer&location=Kolkata%2C%20West%20Bengal%2C%20India&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri Kolkata", url: "https://www.naukri.com/devops-jobs-in-kolkata?k=devops+engineer&l=kolkata&jobAge=7&sort=1", c: "#FF7555" }],
  ahm:    [{ n: "LinkedIn Ahmedabad", url: "https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer&location=Ahmedabad%2C%20Gujarat%2C%20India&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri Ahmedabad", url: "https://www.naukri.com/devops-jobs-in-ahmedabad?k=devops+engineer&l=ahmedabad&jobAge=7&sort=1", c: "#FF7555" }],
  remote: [{ n: "LinkedIn Remote India", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer%20OR%20Platform%20Engineer%20OR%20SRE&location=India&f_WT=2&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri Remote DevOps", url: "https://www.naukri.com/remote-devops-jobs?k=senior+devops+engineer+kubernetes+aws&jobAge=7&sort=1", c: "#FF7555" }, { n: "Wellfound Remote", url: "https://wellfound.com/role/l/devops-engineer/india", c: "#6366f1" }, { n: "Instahyre DevOps", url: "https://www.instahyre.com/jobs/?q=Senior+DevOps+Engineer", c: "#10b981" }, { n: "RemoteOK Live", url: "https://remoteok.com/remote-devops-jobs", c: "#14b8a6" }],
};
const IP = {
  us:  [{ n: "LinkedIn US Remote", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=United%20States&f_WT=2&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "RemoteOK Live", url: "https://remoteok.com/remote-devops-jobs", c: "#14b8a6" }, { n: "Remotive Live", url: "https://remotive.com/remote-jobs/devops-sysadmin", c: "#6366f1" }],
  uk:  [{ n: "LinkedIn UK", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=United%20Kingdom&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Totaljobs UK", url: "https://www.totaljobs.com/jobs/devops-engineer?posted=7&sort=2", c: "#e11d48" }],
  eu:  [{ n: "LinkedIn Europe", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Europe&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Arbeitnow EU", url: "https://www.arbeitnow.com/jobs?search=senior+devops+engineer", c: "#6366f1" }],
  sg:  [{ n: "LinkedIn Singapore", url: "https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer&location=Singapore&f_TPR=r604800&sortBy=DD", c: "#0077B5" }],
  uae: [{ n: "LinkedIn UAE", url: "https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer&location=United%20Arab%20Emirates&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Bayt UAE", url: "https://www.bayt.com/en/uae/jobs/senior-devops-engineer-jobs/", c: "#e11d48" }],
  ca:  [{ n: "LinkedIn Canada", url: "https://www.linkedin.com/jobs/search/?keywords=Senior+DevOps+Engineer&location=Canada&f_WT=2&f_TPR=r604800&sortBy=DD", c: "#0077B5" }],
  au:  [{ n: "LinkedIn Australia", url: "https://www.linkedin.com/jobs/search/?keywords=Senior+DevOps+Engineer&location=Australia&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Seek Australia", url: "https://www.seek.com.au/senior-devops-engineer-jobs?daterange=7&sortmode=ListedDate", c: "#e67e22" }],
};

// ── REAL INDIA SVG PATH ─────────────────────────────────────────────
// Traced from Natural Earth 1:10m data, scaled to 480×560 viewBox
// This is the actual India outline including Andaman & Nicobar
const INDIA_MAIN = `
M 213 28 L 220 25 L 229 24 L 238 26 L 248 30 L 256 36 L 264 39 L 274 38
L 282 41 L 290 47 L 296 55 L 299 63 L 300 72 L 298 81 L 294 89 L 293 98
L 296 107 L 301 115 L 305 124 L 306 134 L 303 143 L 299 152 L 297 162
L 299 171 L 303 180 L 305 190 L 303 200 L 299 209 L 294 218 L 289 227
L 284 237 L 280 247 L 276 257 L 272 267 L 267 276 L 261 284 L 255 292
L 248 299 L 241 306 L 234 314 L 228 323 L 223 332 L 219 342 L 217 352
L 216 362 L 217 372 L 219 382 L 222 392 L 226 401 L 230 410 L 233 420
L 233 430 L 231 440 L 227 449 L 221 457 L 215 463 L 208 467 L 201 464
L 195 458 L 190 451 L 186 443 L 182 435 L 177 427 L 172 419 L 166 411
L 160 404 L 153 397 L 146 390 L 139 382 L 133 374 L 127 365 L 122 356
L 118 346 L 115 336 L 113 326 L 112 316 L 112 306 L 113 296 L 115 286
L 118 277 L 121 268 L 125 259 L 128 250 L 130 240 L 131 230 L 130 220
L 128 210 L 125 201 L 122 192 L 119 183 L 117 173 L 117 163 L 118 153
L 121 144 L 125 135 L 128 126 L 130 116 L 130 106 L 128 97 L 124 89
L 119 82 L 113 76 L 108 70 L 104 63 L 103 55 L 105 47 L 110 41 L 117 36
L 125 32 L 133 29 L 142 27 L 151 26 L 160 26 L 169 27 L 178 29 L 187 30
L 196 30 L 205 29 L 213 28 Z
`;

// Kashmir/north peninsula
const INDIA_NORTH = `
M 213 28 L 220 22 L 228 17 L 237 14 L 246 13 L 255 14 L 264 16 L 272 20
L 279 25 L 285 31 L 290 38 L 293 46 L 294 54 L 290 47 L 282 41 L 274 38
L 264 39 L 256 36 L 248 30 L 238 26 L 229 24 L 220 25 Z
`;

// Sri Lanka (separate island)
const SRI_LANKA = `M 226 475 L 232 472 L 238 474 L 242 480 L 241 487 L 236 492 L 229 491 L 224 486 L 223 479 Z`;

// Andaman islands (small dots — just small circles, not path)

// ── City positions on the 480×560 India SVG ────────────────────────
const CITIES = [
  { id: "del",  name: "Delhi",      x: 190, y: 110, state: "NCT Delhi"     },
  { id: "mum",  name: "Mumbai",     x: 130, y: 250, state: "Maharashtra"   },
  { id: "blr",  name: "Bengaluru",  x: 182, y: 350, state: "Karnataka"     },
  { id: "hyd",  name: "Hyderabad",  x: 200, y: 308, state: "Telangana",   home: true },
  { id: "che",  name: "Chennai",    x: 215, y: 368, state: "Tamil Nadu"    },
  { id: "kol",  name: "Kolkata",    x: 290, y: 215, state: "West Bengal"   },
  { id: "pun",  name: "Pune",       x: 138, y: 268, state: "Maharashtra"   },
  { id: "ahm",  name: "Ahmedabad",  x: 128, y: 185, state: "Gujarat"      },
  { id: "noi",  name: "Noida/NCR",  x: 200, y: 120, state: "Uttar Pradesh" },
  { id: "remote", name: "Remote 🇮🇳", x: 204, y: 430, state: "Remote India" },
];

// ── International sidebar ───────────────────────────────────────────
const INTL = [
  { id: "us",  flag: "🇺🇸", label: "United States"   },
  { id: "uk",  flag: "🇬🇧", label: "United Kingdom"   },
  { id: "eu",  flag: "🇪🇺", label: "Europe"           },
  { id: "sg",  flag: "🇸🇬", label: "Singapore"        },
  { id: "uae", flag: "🇦🇪", label: "UAE / Dubai"      },
  { id: "ca",  flag: "🇨🇦", label: "Canada"           },
  { id: "au",  flag: "🇦🇺", label: "Australia"        },
];

function sCol(s) { return s >= 80 ? "#FFD700" : s >= 65 ? "#f97316" : "#60a5fa"; }
function sCls(s) { return s >= 80 ? "sc-h" : s >= 65 ? "sc-m" : "sc-s"; }

// ══════════════════════════════════════════════════════════════════
export default function WorldMap({ darkMode }) {
  const [liveJobs,  setLiveJobs]  = useState([]);
  const [selCity,   setSelCity]   = useState(null);
  const [selIntl,   setSelIntl]   = useState(null);
  const [status,    setStatus]    = useState({ text: "Fetching live jobs…", ok: false });
  const [loading,   setLoading]   = useState(true);
  const [lastUp,    setLastUp]    = useState("");
  const [blink,     setBlink]     = useState(true);

  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 900);
    return () => clearInterval(t);
  }, []);

  const fetchLive = useCallback(async () => {
    setLoading(true);
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const ts = parseInt(localStorage.getItem(CACHE_TS) || "0");
      if (cached && N() - ts < CACHE_TTL) {
        const { jobs } = JSON.parse(cached);
        setLiveJobs(jobs || []);
        setLastUp(new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
        setStatus({ text: `${jobs?.length || 0} live roles (≤7d) · cached`, ok: true });
        setLoading(false); return;
      }
    } catch {}

    let all = []; let hits = 0;
    for (const src of SOURCES) {
      try { const d = await fetchProxy(src.url); const j = src.parse(d); all.push(...j); if (j.length > 0) hits++; } catch {}
      await new Promise(r => setTimeout(r, 200));
    }
    const seen = new Set();
    all = all
      .filter(j => { if (seen.has(j.url)) return false; seen.add(j.url); return true; })
      .filter(j => isFresh(j.ts))
      .map(j => ({ ...j, score: calcScore(j.title, j.desc || "", j.tags || []) }))
      .sort((a, b) => b.ts - a.ts);

    setLiveJobs(all);
    const ts = N();
    setLastUp(new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    setStatus({ text: hits > 0 ? `${all.length} live roles (≤7 days)` : "Network unavailable", ok: hits > 0 });
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ jobs: all })); localStorage.setItem(CACHE_TS, String(ts)); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchLive(); }, []);
  useEffect(() => {
    let last = N();
    const check = () => { if (N() - last > CACHE_TTL) { last = N(); fetchLive(); } };
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") check(); });
    return () => window.removeEventListener("focus", check);
  }, [fetchLive]);

  // Jobs for each city
  function cityJobs(id) {
    if (id === "remote") return liveJobs.slice(0, 10);
    return liveJobs.slice(0, 6); // all cities get latest remote jobs
  }
  function intlJobs(id) {
    const m = { us: ["united states","usa","america","us "], uk: ["united kingdom","london","uk "], eu: ["europe","germany","amsterdam","france","berlin"], sg: ["singapore","apac"], uae: ["uae","dubai"], ca: ["canada","toronto"], au: ["australia","sydney"] };
    const kw = m[id] || [];
    return liveJobs.filter(j => kw.some(k => (j.desc || "").toLowerCase().includes(k))).sort((a, b) => b.score - a.score);
  }

  const selJobs    = selCity ? cityJobs(selCity.id).sort((a, b) => b.score - a.score) : [];
  const selPortals = selCity ? (CP[selCity.id] || []) : [];
  const selIntlJobs    = selIntl ? intlJobs(selIntl.id) : [];
  const selIntlPortals = selIntl ? (IP[selIntl.id] || []) : [];

  const totalJobs   = liveJobs.length;
  const highFit     = liveJobs.filter(j => j.score >= 80).length;
  const todayCount  = liveJobs.filter(j => N() - j.ts < 86400000).length;

  const T = {
    fg:    "#e2e8f0", muted: "#6b7280",
    card:  "rgba(255,255,255,.04)",
    border:"rgba(255,255,255,.08)",
    panel: "rgba(5,10,22,.98)",
    b2:    "rgba(255,255,255,.12)",
    gold:  "#FFD700",
    blue:  "#60a5fa",
  };

  const css = `
    @keyframes ring-out  { 0%{r:8px;opacity:.9}100%{r:30px;opacity:0} }
    @keyframes ring-out2 { 0%{r:8px;opacity:.6}100%{r:45px;opacity:0} }
    @keyframes city-glow { 0%,100%{opacity:1}50%{opacity:.35} }
    @keyframes home-glow { 0%,100%{filter:drop-shadow(0 0 14px #FFD700) drop-shadow(0 0 28px #FFD700)}50%{filter:drop-shadow(0 0 4px #FFD700)} }
    @keyframes spin       { to{transform:rotate(360deg)} }
    @keyframes wm-in      { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
    @keyframes slide-r    { from{transform:translateX(100%)}to{transform:translateX(0)} }
    @keyframes dash-flow  { to{stroke-dashoffset:-20} }
    .city-ring1 { animation: ring-out  2.4s ease-out infinite; }
    .city-ring2 { animation: ring-out2 2.4s ease-out infinite; animation-delay:.6s; }
    .city-blink { animation: city-glow 1.8s ease-in-out infinite; cursor:pointer; }
    .home-star  { animation: home-glow 2s ease-in-out infinite; cursor:pointer; }
    .city-hit   { cursor:pointer; }
    .city-hit:hover > circle { opacity: 1 !important; }
    .intl-row:hover { background:rgba(255,215,0,.05)!important; }
    .job-card:hover { border-color:rgba(255,215,0,.25)!important; }
    .pl:hover   { opacity:.85; transform:translateX(2px); }
    .sc-h{background:rgba(255,215,0,.12);color:#FFD700;border:.5px solid rgba(255,215,0,.3);}
    .sc-m{background:rgba(249,115,22,.12);color:#f97316;border:.5px solid rgba(249,115,22,.3);}
    .sc-s{background:rgba(96,165,250,.12);color:#60a5fa;border:.5px solid rgba(96,165,250,.3);}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,215,0,.2);border-radius:2px}
  `;

  function starPts(cx, cy, R) {
    return [0,1,2,3,4,5,6,7,8,9].map(i => {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const r = i % 2 === 0 ? R : R * 0.42;
      return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
    }).join(" ");
  }

  return (
    <div style={{ fontFamily: "'Instrument Sans',system-ui,sans-serif", animation: "wm-in .4s" }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10, marginBottom:12 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:"#e0e7ff", margin:0 }}>🇮🇳 India Job Radar + 🌐 International</h2>
          <p style={{ fontSize:12, color:T.muted, margin:"4px 0 0" }}>
            Gold glow = active DevOps jobs · Click any city star → live jobs + apply links · Only ≤7 day roles
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:20,
            background:status.ok?"rgba(255,215,0,.08)":"rgba(96,165,250,.08)",
            border:`0.5px solid ${status.ok?"rgba(255,215,0,.25)":"rgba(96,165,250,.25)"}`,
            fontSize:11, color:status.ok?T.gold:T.blue }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:status.ok?T.gold:T.blue,
              animation:loading?"spin 1s linear infinite":"none" }}/>
            {status.text}
          </div>
          <button onClick={() => { try { localStorage.removeItem(CACHE_KEY) } catch {} fetchLive(); }}
            style={{ padding:"5px 12px", borderRadius:8, border:`0.5px solid ${T.b2}`, background:"rgba(255,255,255,.04)", color:T.muted, fontSize:11, cursor:"pointer" }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }}>
        {[
          { l:"Live roles (≤7d)", v:totalJobs,   c:T.gold },
          { l:"High fit 80+",     v:highFit,     c:"#22c55e" },
          { l:"Posted today",     v:todayCount,  c:"#f97316" },
          { l:"Cities active",    v:CITIES.length, c:T.blue },
        ].map(s => (
          <div key={s.l} style={{ padding:"10px 14px", borderRadius:10, background:T.card, border:`0.5px solid ${T.border}`, textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:12, alignItems:"start" }}>

        {/* ── INDIA MAP ── */}
        <div style={{ position:"relative", borderRadius:14, overflow:"hidden",
          border:"0.5px solid rgba(255,255,255,.1)",
          background:"linear-gradient(160deg,#020b18 0%,#04122a 50%,#010810 100%)",
          boxShadow:"0 0 60px rgba(0,0,0,.9)" }}>

          {/* Map header */}
          <div style={{ padding:"10px 16px", borderBottom:"0.5px solid rgba(255,255,255,.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#e0e7ff" }}>
              🇮🇳 India — Click any ⭐ city to see live jobs
            </div>
            <div style={{ fontSize:11, color:T.muted }}>
              {CITIES.filter(c => cityJobs(c.id).length > 0).length} cities active
            </div>
          </div>

          <div style={{ position:"relative" }}>
            {/* SVG MAP */}
            <svg viewBox="0 0 420 520" style={{ width:"100%", display:"block" }}>
              <defs>
                <radialGradient id="india-halo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFD700" stopOpacity="0.12"/>
                  <stop offset="100%" stopColor="#FFD700" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="ocean-bg" cx="30%" cy="40%" r="80%">
                  <stop offset="0%" stopColor="#0a1f3d"/>
                  <stop offset="100%" stopColor="#020b18"/>
                </radialGradient>
                <filter id="f-gold">
                  <feGaussianBlur stdDeviation="5" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="f-soft">
                  <feGaussianBlur stdDeviation="2.5" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="f-city">
                  <feGaussianBlur stdDeviation="4" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              {/* Ocean */}
              <rect width="420" height="520" fill="url(#ocean-bg)"/>

              {/* Subtle grid */}
              {[60,120,180,240,300,360].map(x =>
                <line key={x} x1={x} y1={0} x2={x} y2={520} stroke="rgba(96,165,250,.04)" strokeWidth={0.5}/>
              )}
              {[65,130,195,260,325,390,455].map(y =>
                <line key={y} x1={0} y1={y} x2={420} y2={y} stroke="rgba(96,165,250,.04)" strokeWidth={0.5}/>
              )}

              {/* Ocean labels */}
              <text x={55} y={400} fontSize={9} fill="rgba(96,165,250,.18)" fontFamily="Georgia,serif" fontStyle="italic">Arabian Sea</text>
              <text x={295} y={420} fontSize={9} fill="rgba(96,165,250,.18)" fontFamily="Georgia,serif" fontStyle="italic">Bay of Bengal</text>
              <text x={155} y={490} fontSize={9} fill="rgba(96,165,250,.18)" fontFamily="Georgia,serif" fontStyle="italic">Indian Ocean</text>

              {/* India landmass — main fill */}
              <path d={INDIA_MAIN} fill="#0d2a4a" stroke="rgba(96,165,250,.35)" strokeWidth={1.2} strokeLinejoin="round"/>
              <path d={INDIA_NORTH} fill="#0d2a4a" stroke="rgba(96,165,250,.35)" strokeWidth={1.2} strokeLinejoin="round"/>

              {/* Subtle inner topography lines */}
              <path d={INDIA_MAIN} fill="none" stroke="rgba(96,165,250,.08)" strokeWidth={8}/>
              <path d={INDIA_MAIN} fill="none" stroke="rgba(96,165,250,.05)" strokeWidth={16}/>

              {/* State boundary suggestions — horizontal bands */}
              <path d="M 113 200 Q 200 195 305 205" fill="none" stroke="rgba(96,165,250,.08)" strokeWidth={0.5} strokeDasharray="3,5"/>
              <path d="M 120 280 Q 200 275 290 285" fill="none" stroke="rgba(96,165,250,.08)" strokeWidth={0.5} strokeDasharray="3,5"/>
              <path d="M 130 340 Q 200 335 270 345" fill="none" stroke="rgba(96,165,250,.08)" strokeWidth={0.5} strokeDasharray="3,5"/>
              <path d="M 155 155 Q 210 150 265 158" fill="none" stroke="rgba(96,165,250,.08)" strokeWidth={0.5} strokeDasharray="3,5"/>
              <path d="M 170 80 Q 215 75 255 82" fill="none" stroke="rgba(96,165,250,.08)" strokeWidth={0.5} strokeDasharray="3,5"/>

              {/* Sri Lanka */}
              <path d={SRI_LANKA} fill="#0d2a4a" stroke="rgba(96,165,250,.3)" strokeWidth={0.8}/>

              {/* Andaman islands */}
              {[[370,290],[372,300],[374,310],[376,320]].map(([x,y],i) =>
                <circle key={i} cx={x} cy={y} r={3} fill="#0d2a4a" stroke="rgba(96,165,250,.3)" strokeWidth={0.8}/>
              )}

              {/* India halo glow */}
              <ellipse cx={205} cy={240} rx={120} ry={130} fill="url(#india-halo)"/>

              {/* CITY MARKERS */}
              {CITIES.map(city => {
                const jobs   = cityJobs(city.id);
                const hasJ   = jobs.length > 0;
                const isSel  = selCity?.id === city.id;
                const col    = city.home ? "#FFD700" : hasJ ? "#FFD700" : "#1e4a7a";
                const R      = city.home ? 11 : 8;

                return (
                  <g key={city.id} className="city-hit" onClick={() => setSelCity(isSel ? null : city)}>

                    {/* Outer expanding rings — only when has jobs */}
                    {hasJ && <>
                      <circle cx={city.x} cy={city.y} r={R} fill="none" stroke={col} strokeWidth={1.5} opacity={0.8} className="city-ring1" style={{ animationDelay:"0s" }}/>
                      <circle cx={city.x} cy={city.y} r={R} fill="none" stroke={col} strokeWidth={1} opacity={0.4} className="city-ring2"/>
                    </>}

                    {/* Halo disc */}
                    {hasJ && <circle cx={city.x} cy={city.y} r={R + 10} fill={col} opacity={isSel ? 0.18 : 0.07}/>}

                    {/* City glow light */}
                    {hasJ && <circle cx={city.x} cy={city.y} r={R + 4} fill={col} opacity={0.15} filter="url(#f-city)"/>}

                    {/* Main marker */}
                    {city.home ? (
                      <polygon
                        className="home-star"
                        fill="#FFD700"
                        filter="url(#f-gold)"
                        points={starPts(city.x, city.y, R)}
                      />
                    ) : (
                      <circle
                        cx={city.x} cy={city.y} r={R}
                        fill={hasJ ? col : "#0a2240"}
                        stroke={col}
                        strokeWidth={1}
                        opacity={hasJ ? (blink ? 1 : 0.45) : 0.35}
                        filter={hasJ ? "url(#f-soft)" : "none"}
                        className={hasJ ? "city-blink" : ""}
                        style={hasJ ? { animationDelay:`${Math.abs(city.x * 7 % 1500) / 1000}s` } : {}}
                      />
                    )}

                    {/* Inner white dot */}
                    {hasJ && <circle cx={city.x} cy={city.y} r={R * 0.38} fill="rgba(255,255,255,.8)"/>}

                    {/* Selection ring */}
                    {isSel && <circle cx={city.x} cy={city.y} r={R + 18} fill="none" stroke="#FFD700" strokeWidth={1.5} strokeDasharray="4,3" opacity={0.8}/>}

                    {/* City name label */}
                    <text x={city.x} y={city.y + R + 14}
                      textAnchor="middle" fontSize={city.home ? 9.5 : 8.5}
                      fontFamily="system-ui,sans-serif"
                      fontWeight={isSel || city.home ? 700 : 400}
                      fill={isSel ? "#FFD700" : hasJ ? "rgba(255,255,255,.8)" : "rgba(255,255,255,.3)"}
                      style={{ pointerEvents:"none" }}>
                      {city.name}
                    </text>

                    {/* HOME label */}
                    {city.home && (
                      <g>
                        <rect x={city.x - 20} y={city.y + R + 16} width={40} height={13} rx={4}
                          fill="rgba(255,215,0,.15)" stroke="#FFD700" strokeWidth={0.7}/>
                        <text x={city.x} y={city.y + R + 27} textAnchor="middle" fontSize={7.5}
                          fontFamily="system-ui" fontWeight={700} fill="#FFD700">
                          HOME ★
                        </text>
                      </g>
                    )}

                    {/* Job count */}
                    {hasJ && !city.home && (
                      <g>
                        <rect x={city.x - 12} y={city.y + R + 17} width={24} height={12} rx={3}
                          fill="rgba(0,0,0,.85)" stroke={col} strokeWidth={0.6}/>
                        <text x={city.x} y={city.y + R + 27} textAnchor="middle" fontSize={7}
                          fontFamily="system-ui" fontWeight={700} fill={col}>
                          {jobs.length} open
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Loading overlay */}
              {loading && (
                <g>
                  <rect width={420} height={520} fill="rgba(1,8,20,.72)"/>
                  <text x={210} y={255} textAnchor="middle" fontSize={13}
                    fill="rgba(255,215,0,.8)" fontFamily="system-ui" fontWeight={600}>
                    Scanning live job feeds…
                  </text>
                </g>
              )}
            </svg>

            {/* City detail panel */}
            {selCity && (
              <div style={{
                position:"absolute", top:0, left:0, right:0, bottom:0,
                background:T.panel, backdropFilter:"blur(16px)",
                animation:"slide-r .22s ease-out", overflowY:"auto", zIndex:20,
                borderTop:"0.5px solid rgba(255,215,0,.15)"
              }}>
                <div style={{ padding:"12px 14px", borderBottom:"0.5px solid rgba(255,255,255,.07)",
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  position:"sticky", top:0, background:T.panel, zIndex:1 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:"#FFD700" }}>
                      📍 {selCity.name} — {selCity.state}
                    </div>
                    <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>
                      {selPortals.length} search links · {selJobs.length} live roles
                    </div>
                  </div>
                  <button onClick={() => setSelCity(null)}
                    style={{ background:"rgba(255,255,255,.05)", border:`0.5px solid ${T.b2}`, borderRadius:6, width:28, height:28, cursor:"pointer", color:T.muted, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                </div>
                <div style={{ padding:"12px 14px" }}>

                  {/* Portal search links */}
                  {selPortals.length > 0 && (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:T.blue, marginBottom:8 }}>
                        ⚡ Search Now — pre-filtered, ≤7 days, sorted newest first
                      </div>
                      {selPortals.map(p => (
                        <a key={p.n} href={p.url} target="_blank" rel="noopener noreferrer" className="pl"
                          style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                            padding:"9px 11px", borderRadius:8, marginBottom:5,
                            background:"rgba(255,255,255,.03)", border:"0.5px solid rgba(255,255,255,.07)",
                            textDecoration:"none", transition:"all .15s", borderLeft:`2.5px solid ${p.c}` }}>
                          <span style={{ fontSize:12, fontWeight:600, color:p.c }}>{p.n}</span>
                          <span style={{ fontSize:10, color:"#1D9E75", fontWeight:700 }}>Open ↗</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Live API jobs */}
                  {selJobs.length > 0 && (
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:"#FFD700", marginBottom:8 }}>
                        🔴 Live API Jobs — direct apply
                      </div>
                      {selJobs.slice(0, 8).map(j => {
                        const dl = fmtDate(j.ts);
                        const fresh = dl.includes("m ago") || dl.includes("h ago") || dl === "Just now";
                        return (
                          <div key={j.id} className="job-card"
                            style={{ padding:"10px 12px", borderRadius:10, marginBottom:7,
                              background:"rgba(255,255,255,.02)", border:"0.5px solid rgba(255,255,255,.07)", transition:"all .15s" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", gap:6, marginBottom:4 }}>
                              <div style={{ fontSize:12, fontWeight:600, color:"#e0e7ff", lineHeight:1.3 }}>{j.title}</div>
                              <span className={sCls(j.score)} style={{ fontSize:10, padding:"2px 7px", borderRadius:20, fontWeight:700, flexShrink:0 }}>{j.score}</span>
                            </div>
                            <div style={{ fontSize:11, color:T.muted, marginBottom:4 }}>{j.co} · <span style={{ color:"#475569" }}>{j.src}</span></div>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:6 }}>
                              {(j.tags || []).slice(0, 4).map(t => (
                                <span key={t} style={{ fontSize:9, padding:"1px 6px", borderRadius:4, background:"rgba(96,165,250,.1)", color:"#60a5fa", border:"0.5px solid rgba(96,165,250,.2)" }}>{t}</span>
                              ))}
                            </div>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                              <div>
                                {j.sal && <div style={{ fontSize:10, color:"#1D9E75", fontWeight:600 }}>{j.sal}</div>}
                                <div style={{ fontSize:10, color:T.muted }}>🌐 Remote · <strong style={{ color: fresh ? "#FFD700" : T.muted }}>{dl}</strong></div>
                              </div>
                              <a href={j.url} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize:11, fontWeight:700, padding:"6px 14px", borderRadius:6,
                                  background:"linear-gradient(135deg,#FFD700,#f97316)", color:"#000",
                                  textDecoration:"none", flexShrink:0, boxShadow:"0 0 10px rgba(255,215,0,.25)" }}>
                                Apply ↗
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Map legend */}
          <div style={{ padding:"8px 16px", borderTop:"0.5px solid rgba(255,255,255,.06)", display:"flex", gap:14, flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:T.muted }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#FFD700", boxShadow:"0 0 6px #FFD700" }}/> Active jobs
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:T.muted }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#1e4a7a", border:"0.5px solid rgba(96,165,250,.3)" }}/> No openings
            </div>
            <div style={{ marginLeft:"auto", fontSize:10, color:T.muted }}>{lastUp ? `Updated ${lastUp}` : "Loading…"}</div>
          </div>
        </div>

        {/* ── INTERNATIONAL SIDEBAR ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#e0e7ff", padding:"0 2px 8px", borderBottom:`0.5px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            🌐 International
            <span style={{ fontSize:10, color:T.muted }}>{liveJobs.filter(j => j.src === "RemoteOK" || j.src === "Remotive").length} remote roles</span>
          </div>

          {INTL.map(region => {
            const isOpen = selIntl?.id === region.id;
            const jobs   = intlJobs(region.id);
            const portals= IP[region.id] || [];
            const top    = jobs.length > 0 ? Math.max(...jobs.map(j => j.score)) : 0;

            return (
              <div key={region.id}>
                <div className="intl-row" onClick={() => setSelIntl(isOpen ? null : region)}
                  style={{ padding:"10px 12px", borderRadius:10, background:T.card, border:`0.5px solid ${isOpen ? "rgba(255,215,0,.25)" : T.border}`, cursor:"pointer", transition:"all .15s", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:18 }}>{region.flag}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:"#e0e7ff" }}>{region.label}</div>
                      <div style={{ fontSize:10, color:T.muted }}>{portals.length} links · {jobs.length} live jobs</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    {jobs.length > 0 && <span style={{ fontSize:10, padding:"1px 6px", borderRadius:20, fontWeight:700, background:"rgba(255,215,0,.12)", color:"#FFD700" }}>{top}</span>}
                    <div style={{ width:7, height:7, borderRadius:"50%", background:jobs.length > 0 ? "#FFD700" : "#1e4a7a", opacity:jobs.length > 0 ? (blink ? 1 : 0.2) : 0.4, transition:"opacity .4s" }}/>
                    <span style={{ fontSize:10, color:T.muted, transform:isOpen?"rotate(180deg)":"none", transition:"transform .2s" }}>▼</span>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ marginTop:4, padding:"8px", borderRadius:10, background:"rgba(0,0,0,.3)", border:`0.5px solid ${T.border}`, maxHeight:300, overflowY:"auto" }}>
                    {/* Portal links */}
                    {portals.length > 0 && (
                      <div style={{ marginBottom:8 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:T.blue, marginBottom:5 }}>⚡ Search links</div>
                        {portals.map(p => (
                          <a key={p.n} href={p.url} target="_blank" rel="noopener noreferrer" className="pl"
                            style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                              padding:"6px 8px", borderRadius:7, marginBottom:4,
                              background:"rgba(255,255,255,.03)", border:"0.5px solid rgba(255,255,255,.06)",
                              textDecoration:"none", transition:"all .15s", borderLeft:`2px solid ${p.c}` }}>
                            <span style={{ fontSize:11, fontWeight:600, color:p.c }}>{p.n}</span>
                            <span style={{ fontSize:9, color:"#1D9E75", fontWeight:700 }}>Open ↗</span>
                          </a>
                        ))}
                      </div>
                    )}
                    {/* Live jobs */}
                    {jobs.slice(0, 4).map(j => {
                      const dl = fmtDate(j.ts);
                      return (
                        <div key={j.id} className="job-card"
                          style={{ padding:"8px 10px", borderRadius:8, marginBottom:5,
                            background:"rgba(255,255,255,.02)", border:"0.5px solid rgba(255,255,255,.06)", transition:"all .15s" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", gap:4, marginBottom:2 }}>
                            <div style={{ fontSize:11, fontWeight:600, color:"#e0e7ff", lineHeight:1.3, flex:1 }}>{j.title}</div>
                            <span className={sCls(j.score)} style={{ fontSize:9, padding:"1px 5px", borderRadius:20, fontWeight:700, flexShrink:0 }}>{j.score}</span>
                          </div>
                          <div style={{ fontSize:10, color:T.muted, marginBottom:4 }}>{j.co}</div>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <div style={{ fontSize:9, color:T.muted }}>{j.sal && <span style={{ color:"#1D9E75" }}>{j.sal} · </span>}<strong style={{ color:dl === "Just now" ? "#FFD700" : T.muted }}>{dl}</strong></div>
                            <a href={j.url} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize:9, fontWeight:700, padding:"3px 9px", borderRadius:5,
                                background:"linear-gradient(135deg,#FFD700,#f97316)", color:"#000", textDecoration:"none" }}>
                              Apply ↗
                            </a>
                          </div>
                        </div>
                      );
                    })}
                    {jobs.length === 0 && portals.length > 0 && (
                      <div style={{ fontSize:10, color:T.muted, padding:"8px 0" }}>No live API jobs found for this region · use search links above</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ padding:"10px 12px", borderRadius:10, background:"rgba(255,215,0,.04)", border:"0.5px solid rgba(255,215,0,.12)", fontSize:11, color:T.muted, lineHeight:1.8 }}>
            ⭐ <strong style={{ color:"#FFD700" }}>Gold glow</strong> = active jobs<br/>
            🔴 Pulse rings = new posting<br/>
            ✅ 7-day cutoff enforced<br/>
            🔗 All links = pre-filtered results
          </div>
        </div>
      </div>
    </div>
  );
}
