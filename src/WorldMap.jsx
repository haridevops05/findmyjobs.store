import { useEffect, useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════
   WorldMap.jsx v10 — CITY GRID LAYOUT
   Simple, clean. Cities listed. Gold glow when jobs available.
   No fake maps. Just what works.
   ═══════════════════════════════════════════════════════════════════ */

const MAX_AGE_MS = 7 * 86400000;
const CACHE_KEY  = "wm10_cache";
const CACHE_TS   = "wm10_ts";
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
      const r = await fetch(p(url), { signal: AbortSignal.timeout(4000), headers: { Accept: "application/json" } });
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

const DKW = ["devops","platform engineer","sre","site reliability","cloud engineer","infrastructure","kubernetes","eks","aws","terraform","gitops","devsecops","mlops","cloud architect","openshift","helm","argocd","k8s","ci/cd","github actions","jenkins","gitlab"];
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

// ── India cities ────────────────────────────────────────────────────
const INDIA_CITIES = [
  { id: "hyd",    name: "Hyderabad",   state: "Telangana",     flag: "🏙️", home: true },
  { id: "blr",    name: "Bengaluru",   state: "Karnataka",     flag: "🌆" },
  { id: "mum",    name: "Mumbai",      state: "Maharashtra",   flag: "🌃" },
  { id: "del",    name: "Delhi NCR",   state: "Delhi",         flag: "🏛️" },
  { id: "pun",    name: "Pune",        state: "Maharashtra",   flag: "🏢" },
  { id: "che",    name: "Chennai",     state: "Tamil Nadu",    flag: "🌉" },
  { id: "kol",    name: "Kolkata",     state: "West Bengal",   flag: "🌁" },
  { id: "ahm",    name: "Ahmedabad",   state: "Gujarat",       flag: "🏗️" },
  { id: "noi",    name: "Noida/NCR",   state: "Uttar Pradesh", flag: "💻" },
  { id: "remote", name: "Remote India",state: "Work from home",flag: "🏠" },
];

// ── International ───────────────────────────────────────────────────
const INTL_CITIES = [
  { id: "us",  name: "United States",   flag: "🇺🇸" },
  { id: "uk",  name: "United Kingdom",  flag: "🇬🇧" },
  { id: "eu",  name: "Europe",          flag: "🇪🇺" },
  { id: "sg",  name: "Singapore",       flag: "🇸🇬" },
  { id: "uae", name: "UAE / Dubai",     flag: "🇦🇪" },
  { id: "ca",  name: "Canada",          flag: "🇨🇦" },
  { id: "au",  name: "Australia",       flag: "🇦🇺" },
];

// ── Portal links per city ───────────────────────────────────────────
const PORTALS = {
  hyd:    [{ n: "LinkedIn", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer%20OR%20Platform%20Engineer%20OR%20SRE&location=Hyderabad%2C%20Telangana%2C%20India&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri", url: "https://www.naukri.com/devops-jobs-in-hyderabad?k=senior+devops+engineer+kubernetes+aws&l=hyderabad&jobAge=7&sort=1", c: "#FF7555" }, { n: "Indeed", url: "https://in.indeed.com/jobs?q=senior+devops+engineer+kubernetes+aws&l=Hyderabad&fromage=7&sort=date", c: "#003A9B" }],
  blr:    [{ n: "LinkedIn", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer%20OR%20Platform%20Engineer%20OR%20SRE&location=Bengaluru%2C%20Karnataka%2C%20India&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri", url: "https://www.naukri.com/devops-jobs-in-bangalore?k=senior+devops+engineer+kubernetes+aws&l=bangalore&jobAge=7&sort=1", c: "#FF7555" }, { n: "Wellfound", url: "https://wellfound.com/role/l/devops-engineer/india", c: "#6366f1" }],
  mum:    [{ n: "LinkedIn", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Mumbai%2C%20Maharashtra%2C%20India&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri", url: "https://www.naukri.com/devops-jobs-in-mumbai?k=senior+devops+engineer+kubernetes&l=mumbai&jobAge=7&sort=1", c: "#FF7555" }],
  del:    [{ n: "LinkedIn", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Delhi%2C%20India&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri", url: "https://www.naukri.com/devops-jobs-in-delhi-ncr?k=senior+devops+engineer+kubernetes&l=delhi&jobAge=7&sort=1", c: "#FF7555" }],
  pun:    [{ n: "LinkedIn", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Pune%2C%20Maharashtra%2C%20India&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri", url: "https://www.naukri.com/devops-jobs-in-pune?k=senior+devops+engineer+kubernetes&l=pune&jobAge=7&sort=1", c: "#FF7555" }],
  che:    [{ n: "LinkedIn", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Chennai%2C%20Tamil%20Nadu%2C%20India&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri", url: "https://www.naukri.com/devops-jobs-in-chennai?k=senior+devops+engineer&l=chennai&jobAge=7&sort=1", c: "#FF7555" }],
  kol:    [{ n: "LinkedIn", url: "https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer&location=Kolkata%2C%20West%20Bengal%2C%20India&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri", url: "https://www.naukri.com/devops-jobs-in-kolkata?k=devops+engineer&l=kolkata&jobAge=7&sort=1", c: "#FF7555" }],
  ahm:    [{ n: "LinkedIn", url: "https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer&location=Ahmedabad%2C%20Gujarat%2C%20India&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri", url: "https://www.naukri.com/devops-jobs-in-ahmedabad?k=devops+engineer&l=ahmedabad&jobAge=7&sort=1", c: "#FF7555" }],
  noi:    [{ n: "LinkedIn", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Noida%2C%20Uttar%20Pradesh%2C%20India&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri", url: "https://www.naukri.com/devops-jobs-in-noida?k=senior+devops+engineer&l=noida&jobAge=7&sort=1", c: "#FF7555" }],
  remote: [{ n: "LinkedIn Remote", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer%20OR%20Platform%20Engineer%20OR%20SRE&location=India&f_WT=2&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Naukri Remote", url: "https://www.naukri.com/remote-devops-jobs?k=senior+devops+engineer+kubernetes+aws&jobAge=7&sort=1", c: "#FF7555" }, { n: "Wellfound", url: "https://wellfound.com/role/l/devops-engineer/india", c: "#6366f1" }, { n: "Instahyre", url: "https://www.instahyre.com/jobs/?q=Senior+DevOps+Engineer", c: "#10b981" }, { n: "RemoteOK", url: "https://remoteok.com/remote-devops-jobs", c: "#14b8a6" }],
  us:     [{ n: "LinkedIn US", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=United%20States&f_WT=2&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "RemoteOK", url: "https://remoteok.com/remote-devops-jobs", c: "#14b8a6" }, { n: "Remotive", url: "https://remotive.com/remote-jobs/devops-sysadmin", c: "#6366f1" }],
  uk:     [{ n: "LinkedIn UK", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=United%20Kingdom&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Totaljobs", url: "https://www.totaljobs.com/jobs/devops-engineer?posted=7&sort=2", c: "#e11d48" }],
  eu:     [{ n: "LinkedIn EU", url: "https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Europe&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Arbeitnow", url: "https://www.arbeitnow.com/jobs?search=senior+devops+engineer", c: "#6366f1" }],
  sg:     [{ n: "LinkedIn SG", url: "https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer&location=Singapore&f_TPR=r604800&sortBy=DD", c: "#0077B5" }],
  uae:    [{ n: "LinkedIn UAE", url: "https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer&location=United%20Arab%20Emirates&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Bayt", url: "https://www.bayt.com/en/uae/jobs/senior-devops-engineer-jobs/", c: "#e11d48" }],
  ca:     [{ n: "LinkedIn CA", url: "https://www.linkedin.com/jobs/search/?keywords=Senior+DevOps+Engineer&location=Canada&f_WT=2&f_TPR=r604800&sortBy=DD", c: "#0077B5" }],
  au:     [{ n: "LinkedIn AU", url: "https://www.linkedin.com/jobs/search/?keywords=Senior+DevOps+Engineer&location=Australia&f_TPR=r604800&sortBy=DD", c: "#0077B5" }, { n: "Seek", url: "https://www.seek.com.au/senior-devops-engineer-jobs?daterange=7&sortmode=ListedDate", c: "#e67e22" }],
};

function sCol(s) { return s >= 80 ? "#FFD700" : s >= 65 ? "#f97316" : "#60a5fa"; }
function sCls(s) { return s >= 80 ? "sc-h" : s >= 65 ? "sc-m" : "sc-s"; }

// ══════════════════════════════════════════════════════════════════
export default function WorldMap({ darkMode }) {
  const [liveJobs,  setLiveJobs]  = useState([]);
  const [sel,       setSel]       = useState(null);
  const [status,    setStatus]    = useState({ text: "Fetching…", ok: false });
  const [loading,   setLoading]   = useState(true);
  const [lastUp,    setLastUp]    = useState("");
  const [blink,     setBlink]     = useState(true);

  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 800);
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
        setStatus({ text: `${jobs?.length || 0} live roles · cached`, ok: true });
        setLoading(false); return;
      }
    } catch {}

    // Parallel fetch — all sources simultaneously, no waiting
    let hits = 0;
    const results = await Promise.allSettled(SOURCES.map(src => fetchProxy(src.url)));
    let all = results.flatMap((r, i) => {
      if (r.status === "fulfilled" && r.value) {
        const jobs = SOURCES[i].parse(r.value);
        if (jobs.length > 0) hits++;
        return jobs;
      }
      return [];
    });
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

  // All cities get latest remote jobs — plus city-specific from portals
  const cityJobs = (id) => liveJobs.slice(0, 8);

  // Intl jobs filtered by region keywords
  const intlJobs = (id) => {
    const m = {
      us: ["united states","usa"," us ","america"], uk: ["united kingdom","london","uk "],
      eu: ["europe","germany","amsterdam","berlin","france"], sg: ["singapore","apac"],
      uae: ["uae","dubai"], ca: ["canada","toronto"], au: ["australia","sydney"],
    };
    return liveJobs.filter(j => (m[id] || []).some(k => (j.desc || "").toLowerCase().includes(k)));
  };

  const selJobs    = sel ? (INDIA_CITIES.find(c => c.id === sel.id) ? cityJobs(sel.id) : intlJobs(sel.id)).sort((a, b) => b.score - a.score) : [];
  const selPortals = sel ? (PORTALS[sel.id] || []) : [];

  const T = {
    fg: darkMode ? "#e2e8f0" : "#1a202c",
    muted: darkMode ? "#6b7280" : "#64748b",
    card: darkMode ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.9)",
    border: darkMode ? "rgba(255,255,255,.08)" : "#e2e8f0",
    panel: darkMode ? "rgba(5,10,22,.98)" : "rgba(255,255,255,.98)",
    b2: darkMode ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.12)",
  };

  const css = `
    @keyframes glow-pulse { 0%,100%{box-shadow:0 0 12px 4px rgba(255,215,0,.6),0 0 24px 8px rgba(255,215,0,.3)} 50%{box-shadow:0 0 6px 2px rgba(255,215,0,.3),0 0 12px 4px rgba(255,215,0,.15)} }
    @keyframes ring-out   { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.5);opacity:0} }
    @keyframes wm-in      { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin       { to{transform:rotate(360deg)} }
    @keyframes slide-in   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    .city-glow { animation: glow-pulse 2s ease-in-out infinite; }
    .city-ring { animation: ring-out 2s ease-out infinite; position:absolute; inset:0; border-radius:50%; border:1.5px solid rgba(255,215,0,.5); pointer-events:none; }
    .city-ring2{ animation: ring-out 2s ease-out infinite; animation-delay:.7s; position:absolute; inset:0; border-radius:50%; border:1px solid rgba(255,215,0,.3); pointer-events:none; }
    .city-btn:hover { transform:translateY(-3px) scale(1.05); }
    .city-btn:active{ transform:scale(.97); }
    .job-card:hover { border-color:rgba(255,215,0,.25)!important; }
    .portal-link:hover { opacity:.8; transform:translateX(2px); }
    .sc-h{background:rgba(255,215,0,.12);color:#FFD700;border:.5px solid rgba(255,215,0,.3);}
    .sc-m{background:rgba(249,115,22,.12);color:#f97316;border:.5px solid rgba(249,115,22,.3);}
    .sc-s{background:rgba(96,165,250,.12);color:#60a5fa;border:.5px solid rgba(96,165,250,.3);}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,215,0,.2);border-radius:2px}
  `;

  // City button component
  const CityBtn = ({ city, hasJobs, count }) => {
    const isSel = sel?.id === city.id;
    const baseStyle = {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      padding: "14px 10px",
      borderRadius: 12,
      cursor: "pointer",
      border: `1px solid ${isSel ? "rgba(255,215,0,.5)" : hasJobs ? "rgba(255,215,0,.2)" : T.border}`,
      background: isSel ? "rgba(255,215,0,.1)" : hasJobs ? "rgba(255,215,0,.04)" : T.card,
      transition: "all .2s cubic-bezier(.4,0,.2,1)",
      userSelect: "none",
    };

    return (
      <div className="city-btn" style={baseStyle}
        onClick={() => setSel(isSel ? null : city)}>

        {/* Pulse rings when active */}
        {hasJobs && !loading && (
          <>
            <div className="city-ring" style={{ inset: "-4px" }}/>
            <div className="city-ring2" style={{ inset: "-4px" }}/>
          </>
        )}

        {/* Glow dot */}
        <div style={{
          width: city.home ? 28 : 20,
          height: city.home ? 28 : 20,
          borderRadius: "50%",
          background: hasJobs ? "#FFD700" : darkMode ? "#1e3a5f" : "#cbd5e1",
          ...(hasJobs && !loading ? { animation: "glow-pulse 2s ease-in-out infinite" } : {}),
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: city.home ? 14 : 11,
          flexShrink: 0,
          transition: "all .3s",
        }}>
          {city.home ? "★" : hasJobs ? "●" : "○"}
        </div>

        {/* City name */}
        <div style={{
          fontSize: city.home ? 12 : 11,
          fontWeight: isSel || city.home ? 700 : hasJobs ? 600 : 400,
          color: isSel ? "#FFD700" : hasJobs ? (darkMode ? "#e0e7ff" : "#1a202c") : T.muted,
          textAlign: "center",
          lineHeight: 1.3,
        }}>
          {city.name}
        </div>

        {/* Job count badge */}
        {hasJobs && count > 0 && (
          <div style={{
            fontSize: 9, fontWeight: 700,
            padding: "1px 6px", borderRadius: 10,
            background: "rgba(255,215,0,.15)",
            color: "#FFD700",
            border: "0.5px solid rgba(255,215,0,.3)",
          }}>
            {count} live
          </div>
        )}

        {/* HOME badge */}
        {city.home && (
          <div style={{ fontSize: 8, fontWeight: 700, color: "#FFD700", opacity: 0.7 }}>HOME</div>
        )}
      </div>
    );
  };

  const totalJobs  = liveJobs.length;
  const highFit    = liveJobs.filter(j => j.score >= 80).length;
  const todayCount = liveJobs.filter(j => N() - j.ts < 86400000).length;

  return (
    <div style={{ fontFamily: "'Instrument Sans',system-ui,sans-serif", animation: "wm-in .3s" }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10, marginBottom:14 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:darkMode?"#e0e7ff":T.fg, margin:0 }}>
            🎯 Live DevOps Job Radar
          </h2>
          <p style={{ fontSize:12, color:T.muted, margin:"4px 0 0" }}>
            Gold glow = active jobs in that city · Click any city → live jobs + apply links · Only ≤7 day roles
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:20,
            background:status.ok?"rgba(255,215,0,.08)":"rgba(96,165,250,.08)",
            border:`0.5px solid ${status.ok?"rgba(255,215,0,.25)":"rgba(96,165,250,.25)"}`,
            fontSize:11, color:status.ok?"#FFD700":"#60a5fa" }}>
            <div style={{ width:6, height:6, borderRadius:"50%",
              background:status.ok?"#FFD700":"#60a5fa",
              animation:loading?"spin 1s linear infinite":"none" }}/>
            {loading ? "Scanning job feeds…" : status.text}
          </div>
          <button onClick={() => { try { localStorage.removeItem(CACHE_KEY) } catch {} fetchLive(); }}
            style={{ padding:"5px 12px", borderRadius:8, border:`0.5px solid ${T.b2}`, background:T.card, color:T.muted, fontSize:11, cursor:"pointer" }}>
            🔄
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:16 }}>
        {[
          { l:"Live roles (≤7d)", v:totalJobs,   c:"#FFD700" },
          { l:"High fit 80+",     v:highFit,     c:"#22c55e" },
          { l:"Posted today",     v:todayCount,  c:"#f97316" },
          { l:"Active cities",    v:INDIA_CITIES.length, c:"#60a5fa" },
        ].map(s => (
          <div key={s.l} style={{ padding:"10px 14px", borderRadius:10, background:T.card, border:`0.5px solid ${T.border}`, textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:14 }}>

        {/* ── LEFT: India cities + International ── */}
        <div>
          {/* India section */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:darkMode?"#e0e7ff":T.fg,
              marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
              🇮🇳 India
              {loading && <span style={{ fontSize:10, color:T.muted }}>scanning…</span>}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:10 }}>
              {INDIA_CITIES.map(city => (
                <CityBtn
                  key={city.id}
                  city={city}
                  hasJobs={!loading && liveJobs.length > 0}
                  count={liveJobs.length}
                />
              ))}
            </div>
          </div>

          {/* International section */}
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:darkMode?"#e0e7ff":T.fg, marginBottom:12 }}>
              🌐 International
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:10 }}>
              {INTL_CITIES.map(city => {
                const jobs = intlJobs(city.id);
                return (
                  <CityBtn
                    key={city.id}
                    city={{ ...city, home: false }}
                    hasJobs={jobs.length > 0}
                    count={jobs.length}
                  />
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display:"flex", gap:16, marginTop:16, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:T.muted }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:"#FFD700", boxShadow:"0 0 8px #FFD700" }}/>
              Active jobs — click to apply
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:T.muted }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:darkMode?"#1e3a5f":"#cbd5e1" }}/>
              No current openings
            </div>
            <div style={{ marginLeft:"auto", fontSize:10, color:T.muted }}>
              {lastUp ? `Updated ${lastUp} · 7-day cutoff` : ""}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Job Panel ── */}
        <div style={{ position:"sticky", top:0 }}>
          {sel ? (
            <div style={{ borderRadius:14, background:T.card, border:`1px solid ${T.border}`,
              overflow:"hidden", animation:"slide-in .2s ease-out" }}>

              {/* Panel header */}
              <div style={{ padding:"12px 14px", borderBottom:`1px solid ${T.border}`,
                display:"flex", justifyContent:"space-between", alignItems:"center",
                background:darkMode?"rgba(255,215,0,.05)":"rgba(255,215,0,.03)" }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#FFD700" }}>
                    {sel.flag} {sel.name}
                  </div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:1 }}>
                    {selPortals.length} search links · {selJobs.length} live roles
                  </div>
                </div>
                <button onClick={() => setSel(null)}
                  style={{ background:"transparent", border:`1px solid ${T.border}`, borderRadius:6,
                    width:26, height:26, cursor:"pointer", color:T.muted, fontSize:12,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
              </div>

              <div style={{ padding:"12px 14px", maxHeight:520, overflowY:"auto" }}>

                {/* Portal links */}
                {selPortals.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#60a5fa", marginBottom:7 }}>
                      ⚡ Apply Now — pre-filtered · newest first · ≤7 days
                    </div>
                    {selPortals.map(p => (
                      <a key={p.n} href={p.url} target="_blank" rel="noopener noreferrer"
                        className="portal-link"
                        style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                          padding:"8px 10px", borderRadius:8, marginBottom:5,
                          background:darkMode?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)",
                          border:`0.5px solid ${T.border}`,
                          borderLeft:`2.5px solid ${p.c}`,
                          textDecoration:"none", transition:"all .15s" }}>
                        <span style={{ fontSize:12, fontWeight:600, color:p.c }}>{p.n}</span>
                        <span style={{ fontSize:10, color:"#1D9E75", fontWeight:700 }}>Open ↗</span>
                      </a>
                    ))}
                  </div>
                )}

                {/* Live jobs */}
                {selJobs.length > 0 && (
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:"#FFD700", marginBottom:7 }}>
                      🔴 Live jobs — direct apply link
                    </div>
                    {selJobs.slice(0, 6).map(j => {
                      const dl = fmtDate(j.ts);
                      const isFreshJob = dl.includes("m ago") || dl.includes("h ago") || dl === "Just now";
                      return (
                        <div key={j.id} className="job-card"
                          style={{ padding:"10px 12px", borderRadius:10, marginBottom:7,
                            background:darkMode?"rgba(255,255,255,.02)":"rgba(0,0,0,.02)",
                            border:`0.5px solid ${T.border}`, transition:"all .15s" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", gap:6, marginBottom:4 }}>
                            <div style={{ fontSize:12, fontWeight:600, color:darkMode?"#e0e7ff":T.fg, lineHeight:1.3 }}>{j.title}</div>
                            <span className={sCls(j.score)} style={{ fontSize:10, padding:"2px 6px", borderRadius:20, fontWeight:700, flexShrink:0 }}>{j.score}</span>
                          </div>
                          <div style={{ fontSize:11, color:T.muted, marginBottom:5 }}>
                            {j.co} · <span style={{ color:"#475569", fontSize:10 }}>{j.src}</span>
                          </div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:6 }}>
                            {(j.tags || []).slice(0, 3).map(t => (
                              <span key={t} style={{ fontSize:9, padding:"1px 5px", borderRadius:4,
                                background:"rgba(96,165,250,.1)", color:"#60a5fa",
                                border:"0.5px solid rgba(96,165,250,.2)" }}>{t}</span>
                            ))}
                          </div>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <div>
                              {j.sal && <div style={{ fontSize:10, color:"#1D9E75", fontWeight:600 }}>{j.sal}</div>}
                              <div style={{ fontSize:10, color:T.muted }}>
                                🌐 Remote ·
                                <strong style={{ color:isFreshJob?"#FFD700":T.muted, marginLeft:3 }}>{dl}</strong>
                              </div>
                            </div>
                            <a href={j.url} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize:11, fontWeight:700, padding:"6px 13px", borderRadius:6,
                                background:"linear-gradient(135deg,#FFD700,#f97316)",
                                color:"#000", textDecoration:"none", flexShrink:0 }}>
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
          ) : (
            /* Empty state */
            <div style={{ borderRadius:14, background:T.card, border:`1px solid ${T.border}`,
              padding:"32px 20px", textAlign:"center" }}>
              <div style={{ fontSize:36, marginBottom:12 }}>☝️</div>
              <div style={{ fontSize:14, fontWeight:600, color:darkMode?"#e0e7ff":T.fg, marginBottom:6 }}>
                Click any city
              </div>
              <div style={{ fontSize:12, color:T.muted, lineHeight:1.6 }}>
                Gold = active DevOps jobs<br/>
                You'll see live roles + direct<br/>
                LinkedIn / Naukri links
              </div>
              {liveJobs.length > 0 && (
                <div style={{ marginTop:14, padding:"8px 12px", borderRadius:8,
                  background:"rgba(255,215,0,.06)", border:"0.5px solid rgba(255,215,0,.2)",
                  fontSize:11, color:"#FFD700" }}>
                  {liveJobs.length} live roles ready · {highFit} high fit
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
