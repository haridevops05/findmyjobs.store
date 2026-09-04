import { useEffect, useState, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════
   WorldMap.jsx v8 — PREMIUM DARK GLOBE MAP
   Design ref: city lights at night + glowing arcs + dot matrix continents
   ✅ Real world map with dot-matrix continents (SVG paths)
   ✅ India enlarged + centered with city-level glow markers
   ✅ Animated glowing arcs from Hyderabad → job cities worldwide
   ✅ Gold city glow lights up when jobs available
   ✅ Live jobs from RemoteOK/Remotive/Arbeitnow (7-day filter)
   ✅ Click city → slide panel with pre-filtered LinkedIn/Naukri links
   ═══════════════════════════════════════════════════════════════════ */

const MAX_AGE_MS = 7 * 86400000;
const CACHE_KEY  = "wm8_cache";
const CACHE_TS   = "wm8_ts";
const CACHE_TTL  = 15 * 60 * 1000;

const PROXIES = [
  u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  u => `https://proxy.corsfix.com/?${u}`,
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
];

async function fetchProxy(url) {
  for (const p of PROXIES) {
    try {
      const r = await fetch(p(url), { signal: AbortSignal.timeout(9000) });
      if (!r.ok) continue;
      return await r.json();
    } catch { continue; }
  }
  return null;
}

const NOW = () => Date.now();
function parseTs(v) {
  if (!v) return NOW();
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
  const d = new Date(v); return isNaN(d.getTime()) ? NOW() : d.getTime();
}
function isFresh(ts) { return NOW() - ts <= MAX_AGE_MS; }
function fmtDate(ts) {
  const d = Math.floor((NOW() - ts) / 60000);
  if (d < 2)    return "Just now";
  if (d < 60)   return `${d}m ago`;
  if (d < 1440) return `${Math.floor(d/60)}h ago`;
  if (d < 2880) return "Yesterday";
  return `${Math.floor(d/1440)}d ago`;
}

const DKW = ["devops","platform engineer","sre","site reliability","cloud engineer","infrastructure","kubernetes","eks","aws","terraform","gitops","devsecops","mlops","cloud architect","openshift","helm","argocd","k8s","ci/cd"];
const EKW = ["intern","junior","fresher","entry level","0-2 year","sales","marketing","recruiter","hr "];
function rel(t="",d="") { const s=(t+" "+d.slice(0,150)).toLowerCase(); return DKW.some(k=>s.includes(k))&&!EKW.some(k=>s.includes(k)); }

const SK = ["kubernetes","eks","terraform","argocd","aws","istio","falco","kyverno","mlops","gitops","devsecops","helm","prometheus","grafana","python","sre","gitlab","docker","ansible","openshift","datadog","vault","hipaa","soc2","platform","devops","infrastructure","ci/cd"];
function calcScore(t="",d="",tags=[]) {
  const s=(t+" "+d.slice(0,400)+" "+tags.join(" ")).toLowerCase();
  let sc=Math.min(35+SK.filter(k=>s.includes(k)).length*4,95);
  if(/senior|sr\.|staff|lead|principal/i.test(s)) sc=Math.min(sc+5,95);
  if(s.includes("eks")&&s.includes("terraform")) sc=Math.min(sc+5,95);
  return sc;
}

function parseRemotive(d) {
  return (d?.jobs||[]).filter(j=>rel(j.title,j.description||"")).map(j=>{
    const ts=parseTs(j.publication_date); if(!isFresh(ts)) return null;
    return {id:"rv_"+j.id,title:j.title,co:j.company_name,url:j.url,sal:j.salary||"",tags:[j.category,...(j.tags||[])].filter(Boolean).slice(0,4),desc:(j.description||"").replace(/<[^>]+>/g,"").slice(0,200),ts,remote:true,src:"Remotive"};
  }).filter(Boolean);
}
function parseROK(d) {
  return (Array.isArray(d)?d:[]).filter(j=>j.position&&rel(j.position,j.description||"")).map(j=>{
    const ts=j.date?j.date*1000:NOW(); if(!isFresh(ts)) return null;
    return {id:"ro_"+j.id,title:j.position,co:j.company||"Company",url:j.url||"https://remoteok.com",sal:j.salary_min?`$${Math.round(j.salary_min/1000)}k–$${Math.round(j.salary_max/1000)}k`:"",tags:(j.tags||[]).slice(0,4),desc:(j.description||"").replace(/<[^>]+>/g,"").slice(0,200),ts,remote:true,src:"RemoteOK"};
  }).filter(Boolean);
}
function parseABN(d) {
  return (d?.data||[]).filter(j=>rel(j.title,j.description||"")).map(j=>{
    const ts=j.created_at?j.created_at*1000:NOW(); if(!isFresh(ts)) return null;
    return {id:"ab_"+j.slug,title:j.title,co:j.company_name,url:j.url,sal:"",tags:(j.tags||[]).slice(0,4),desc:(j.description||"").replace(/<[^>]+>/g,"").slice(0,200),ts,remote:true,src:"Arbeitnow"};
  }).filter(Boolean);
}

const SOURCES = [
  {url:"https://remotive.com/api/remote-jobs?category=devops-sysadmin&limit=50",parse:parseRemotive},
  {url:"https://remoteok.com/api?tag=devops",    parse:parseROK},
  {url:"https://remoteok.com/api?tag=kubernetes", parse:parseROK},
  {url:"https://remoteok.com/api?tag=aws",        parse:parseROK},
  {url:"https://remoteok.com/api?tag=terraform",  parse:parseROK},
  {url:"https://www.arbeitnow.com/api/job-board-api?search=devops+kubernetes",parse:parseABN},
  {url:"https://www.arbeitnow.com/api/job-board-api?search=platform+engineer",parse:parseABN},
];

// ── City search portals ─────────────────────────────────────────────
const CITY_PORTALS = {
  hyd:[
    {n:"LinkedIn Hyderabad",url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer%20OR%20Platform%20Engineer%20OR%20SRE&location=Hyderabad%2C%20Telangana%2C%20India&f_TPR=r604800&sortBy=DD",c:"#0077B5"},
    {n:"Naukri Hyderabad",  url:"https://www.naukri.com/devops-jobs-in-hyderabad?k=senior+devops+engineer+kubernetes+aws&l=hyderabad&jobAge=7&sort=1",c:"#FF7555"},
    {n:"Indeed Hyderabad",  url:"https://in.indeed.com/jobs?q=senior+devops+engineer+kubernetes+aws&l=Hyderabad&fromage=7&sort=date",c:"#003A9B"},
  ],
  blr:[
    {n:"LinkedIn Bengaluru",url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer%20OR%20Platform%20Engineer%20OR%20SRE&location=Bengaluru%2C%20Karnataka%2C%20India&f_TPR=r604800&sortBy=DD",c:"#0077B5"},
    {n:"Naukri Bengaluru",  url:"https://www.naukri.com/devops-jobs-in-bangalore?k=senior+devops+engineer+kubernetes+aws&l=bangalore&jobAge=7&sort=1",c:"#FF7555"},
    {n:"Wellfound India",   url:"https://wellfound.com/role/l/devops-engineer/india",c:"#6366f1"},
  ],
  mum:[
    {n:"LinkedIn Mumbai",   url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Mumbai%2C%20Maharashtra%2C%20India&f_TPR=r604800&sortBy=DD",c:"#0077B5"},
    {n:"Naukri Mumbai",     url:"https://www.naukri.com/devops-jobs-in-mumbai?k=senior+devops+engineer+kubernetes&l=mumbai&jobAge=7&sort=1",c:"#FF7555"},
  ],
  del:[
    {n:"LinkedIn Delhi NCR",url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Delhi%2C%20India&f_TPR=r604800&sortBy=DD",c:"#0077B5"},
    {n:"Naukri Delhi",      url:"https://www.naukri.com/devops-jobs-in-delhi-ncr?k=senior+devops+engineer+kubernetes&l=delhi&jobAge=7&sort=1",c:"#FF7555"},
  ],
  pun:[{n:"LinkedIn Pune",  url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Pune%2C%20Maharashtra%2C%20India&f_TPR=r604800&sortBy=DD",c:"#0077B5"},{n:"Naukri Pune",url:"https://www.naukri.com/devops-jobs-in-pune?k=senior+devops+engineer+kubernetes&l=pune&jobAge=7&sort=1",c:"#FF7555"}],
  che:[{n:"LinkedIn Chennai",url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Chennai%2C%20Tamil%20Nadu%2C%20India&f_TPR=r604800&sortBy=DD",c:"#0077B5"},{n:"Naukri Chennai",url:"https://www.naukri.com/devops-jobs-in-chennai?k=senior+devops+engineer&l=chennai&jobAge=7&sort=1",c:"#FF7555"}],
  kol:[{n:"LinkedIn Kolkata",url:"https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer&location=Kolkata%2C%20West%20Bengal%2C%20India&f_TPR=r604800&sortBy=DD",c:"#0077B5"},{n:"Naukri Kolkata",url:"https://www.naukri.com/devops-jobs-in-kolkata?k=devops+engineer&l=kolkata&jobAge=7&sort=1",c:"#FF7555"}],
  ahm:[{n:"LinkedIn Ahmedabad",url:"https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer&location=Ahmedabad%2C%20Gujarat%2C%20India&f_TPR=r604800&sortBy=DD",c:"#0077B5"},{n:"Naukri Ahmedabad",url:"https://www.naukri.com/devops-jobs-in-ahmedabad?k=devops+engineer&l=ahmedabad&jobAge=7&sort=1",c:"#FF7555"}],
  remote:[
    {n:"LinkedIn Remote India",url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer%20OR%20Platform%20Engineer%20OR%20SRE&location=India&f_WT=2&f_TPR=r604800&sortBy=DD",c:"#0077B5"},
    {n:"Naukri Remote",        url:"https://www.naukri.com/remote-devops-jobs?k=senior+devops+engineer+kubernetes+aws&jobAge=7&sort=1",c:"#FF7555"},
    {n:"Wellfound Remote",     url:"https://wellfound.com/role/l/devops-engineer/india",c:"#6366f1"},
    {n:"Instahyre DevOps",     url:"https://www.instahyre.com/jobs/?q=Senior+DevOps+Engineer",c:"#10b981"},
    {n:"RemoteOK Live",        url:"https://remoteok.com/remote-devops-jobs",c:"#14b8a6"},
  ],
};
const INTL_PORTALS = {
  us:[{n:"LinkedIn US Remote",url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=United%20States&f_WT=2&f_TPR=r604800&sortBy=DD",c:"#0077B5"},{n:"RemoteOK",url:"https://remoteok.com/remote-devops-jobs",c:"#14b8a6"}],
  uk:[{n:"LinkedIn UK",url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=United%20Kingdom&f_TPR=r604800&sortBy=DD",c:"#0077B5"},{n:"Totaljobs",url:"https://www.totaljobs.com/jobs/devops-engineer?posted=7&sort=2",c:"#e11d48"}],
  eu:[{n:"LinkedIn Europe",url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Europe&f_TPR=r604800&sortBy=DD",c:"#0077B5"},{n:"Arbeitnow EU",url:"https://www.arbeitnow.com/jobs?search=senior+devops+engineer",c:"#6366f1"}],
  sg:[{n:"LinkedIn Singapore",url:"https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer&location=Singapore&f_TPR=r604800&sortBy=DD",c:"#0077B5"}],
  uae:[{n:"LinkedIn UAE",url:"https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer&location=United%20Arab%20Emirates&f_TPR=r604800&sortBy=DD",c:"#0077B5"},{n:"Bayt UAE",url:"https://www.bayt.com/en/uae/jobs/senior-devops-engineer-jobs/",c:"#e11d48"}],
  ca:[{n:"LinkedIn Canada",url:"https://www.linkedin.com/jobs/search/?keywords=Senior+DevOps+Engineer&location=Canada&f_WT=2&f_TPR=r604800&sortBy=DD",c:"#0077B5"}],
  au:[{n:"LinkedIn Australia",url:"https://www.linkedin.com/jobs/search/?keywords=Senior+DevOps+Engineer&location=Australia&f_TPR=r604800&sortBy=DD",c:"#0077B5"},{n:"Seek Australia",url:"https://www.seek.com.au/senior-devops-engineer-jobs?daterange=7&sortmode=ListedDate",c:"#e67e22"}],
};

// ── Map node positions (SVG 1200×600 coordinate space) ─────────────
// World cities with x,y pixel positions on the map
const WORLD_NODES = [
  // India — HOME — gold
  {id:"hyd",  name:"Hyderabad",   x:700, y:300, india:true,  home:true,  color:"#FFD700"},
  {id:"blr",  name:"Bengaluru",   x:692, y:318, india:true,  color:"#FFD700"},
  {id:"mum",  name:"Mumbai",      x:678, y:295, india:true,  color:"#FFD700"},
  {id:"del",  name:"Delhi",       x:692, y:258, india:true,  color:"#FFD700"},
  {id:"pun",  name:"Pune",        x:681, y:302, india:true,  color:"#FFD700"},
  {id:"che",  name:"Chennai",     x:702, y:322, india:true,  color:"#FFD700"},
  {id:"kol",  name:"Kolkata",     x:726, y:280, india:true,  color:"#FFD700"},
  {id:"ahm",  name:"Ahmedabad",   x:676, y:272, india:true,  color:"#FFD700"},
  {id:"remote",name:"Remote IN",  x:700, y:340, india:true,  color:"#60a5fa"},
  // International
  {id:"us",   name:"USA",         x:185, y:230, color:"#60a5fa"},
  {id:"uk",   name:"London",      x:455, y:195, color:"#60a5fa"},
  {id:"eu",   name:"Europe",      x:492, y:200, color:"#60a5fa"},
  {id:"sg",   name:"Singapore",   x:775, y:335, color:"#60a5fa"},
  {id:"uae",  name:"Dubai",       x:645, y:285, color:"#60a5fa"},
  {id:"ca",   name:"Canada",      x:150, y:185, color:"#60a5fa"},
  {id:"au",   name:"Sydney",      x:840, y:420, color:"#60a5fa"},
  {id:"jp",   name:"Tokyo",       x:840, y:235, color:"#60a5fa"},
  {id:"de",   name:"Berlin",      x:505, y:188, color:"#60a5fa"},
];

// India home city
const HOME = WORLD_NODES.find(n=>n.home);

// ── World map dot-matrix using SVG path approximations ──────────────
// Real continental outlines simplified to polygon paths
// Coordinates mapped to 1200×600 SVG space
const CONTINENTS = {
  // North America
  na:`M 130,120 L 220,100 L 270,115 L 290,140 L 280,180 L 260,220 L 230,270 L 200,280 L 175,260 L 150,235 L 125,200 L 115,165 Z`,
  // South America  
  sa:`M 220,300 L 260,295 L 280,320 L 275,370 L 255,420 L 230,450 L 210,430 L 200,390 L 205,350 Z`,
  // Europe
  eu:`M 440,160 L 510,155 L 540,170 L 530,200 L 510,215 L 470,210 L 445,195 Z`,
  // Africa
  af:`M 450,230 L 520,225 L 545,260 L 540,330 L 515,380 L 485,395 L 455,370 L 440,310 L 445,265 Z`,
  // Asia
  as:`M 540,155 L 720,145 L 820,160 L 870,200 L 860,255 L 800,280 L 740,290 L 680,275 L 640,255 L 590,240 L 555,210 L 540,180 Z`,
  // Australia
  au:`M 790,380 L 870,375 L 895,400 L 885,435 L 855,450 L 815,445 L 795,420 Z`,
  // Greenland
  gl:`M 340,95 L 400,85 L 420,100 L 410,125 L 380,130 L 350,120 Z`,
};

// ── Quadratic bezier arc from Hyderabad to target city ──────────────
function arcPath(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.35 - 60;
  return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
}

// Score colour
function sCol(s) { return s >= 80 ? "#FFD700" : s >= 65 ? "#f97316" : "#60a5fa"; }
function sCls(s) { return s >= 80 ? "sc-h" : s >= 65 ? "sc-m" : "sc-s"; }

// ══════════════════════════════════════════════════════════════════
export default function WorldMap({ darkMode }) {
  const canvasRef   = useRef(null);
  const [liveJobs,  setLiveJobs]  = useState([]);
  const [selNode,   setSelNode]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [status,    setStatus]    = useState({ text: "Fetching live jobs…", ok: false });
  const [lastUp,    setLastUp]    = useState("");
  const [arcPhase,  setArcPhase]  = useState(0);   // 0–1, animated
  const [pulsePhase,setPulsePhase]= useState(0);
  const animRef = useRef(null);

  // Animate arcs + pulses
  useEffect(() => {
    let t = 0;
    const tick = () => {
      t += 0.008;
      setArcPhase(t % 1);
      setPulsePhase(p => (p + 1) % 120);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const fetchLive = useCallback(async () => {
    setLoading(true);
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const ts = parseInt(localStorage.getItem(CACHE_TS)||"0");
      if (cached && NOW()-ts < CACHE_TTL) {
        const { jobs } = JSON.parse(cached);
        setLiveJobs(jobs||[]);
        setLastUp(new Date(ts).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}));
        setStatus({ text: `${jobs?.length||0} live roles (≤7d) · cached`, ok: true });
        setLoading(false); return;
      }
    } catch {}

    let all = []; let hits = 0;
    for (const src of SOURCES) {
      try { const d = await fetchProxy(src.url); const j = src.parse(d); all.push(...j); if(j.length>0) hits++; } catch {}
      await new Promise(r => setTimeout(r, 200));
    }
    const seen = new Set();
    all = all.filter(j=>{if(seen.has(j.url))return false;seen.add(j.url);return true;})
             .filter(j=>isFresh(j.ts))
             .map(j=>({...j, score:calcScore(j.title,j.desc||"",j.tags||[])}))
             .sort((a,b)=>b.ts-a.ts);

    setLiveJobs(all);
    const ts = NOW();
    setLastUp(new Date(ts).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}));
    setStatus({ text: hits>0 ? `${all.length} live roles (≤7 days)` : "Network unavailable", ok: hits>0 });
    try { localStorage.setItem(CACHE_KEY,JSON.stringify({jobs:all})); localStorage.setItem(CACHE_TS,String(ts)); } catch {}
    setLoading(false);
  }, []);

  useEffect(()=>{ fetchLive(); },[]);
  useEffect(()=>{
    let last=NOW();
    const check=()=>{if(NOW()-last>CACHE_TTL){last=NOW();fetchLive();}};
    window.addEventListener("focus",check);
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")check();});
    return()=>window.removeEventListener("focus",check);
  },[fetchLive]);

  // Which intl nodes have jobs
  const nodeJobs = (nodeId) => {
    if (nodeId === "us")  return liveJobs.filter(j=>/united states|usa|america|us\b/i.test(j.desc||""));
    if (nodeId === "uk")  return liveJobs.filter(j=>/united kingdom|london|uk\b/i.test(j.desc||""));
    if (nodeId === "eu")  return liveJobs.filter(j=>/europe|germany|amsterdam|france|berlin/i.test(j.desc||""));
    if (nodeId === "sg")  return liveJobs.filter(j=>/singapore|apac/i.test(j.desc||""));
    if (nodeId === "uae") return liveJobs.filter(j=>/uae|dubai|middle east/i.test(j.desc||""));
    if (nodeId === "ca")  return liveJobs.filter(j=>/canada|toronto/i.test(j.desc||""));
    if (nodeId === "au")  return liveJobs.filter(j=>/australia|sydney|melbourne/i.test(j.desc||""));
    if (nodeId === "remote") return liveJobs.filter(j=>j.remote);
    // India cities — all get remote jobs + any city-specific
    return liveJobs.filter(j=>j.remote).slice(0,5);
  };

  const selJobs = selNode ? nodeJobs(selNode.id).sort((a,b)=>b.score-a.score) : [];
  const selPortals = selNode ? (CITY_PORTALS[selNode.id] || INTL_PORTALS[selNode.id] || []) : [];

  // Arc targets — intl nodes that have jobs
  const arcTargets = WORLD_NODES.filter(n => !n.india && nodeJobs(n.id).length > 0);

  // SVG dimensions
  const W = 1200, H = 550;

  const css = `
    @keyframes arc-flow {
      0%   { stroke-dashoffset: 800; opacity: 0; }
      10%  { opacity: 0.8; }
      90%  { opacity: 0.8; }
      100% { stroke-dashoffset: 0;   opacity: 0; }
    }
    @keyframes city-pulse {
      0%,100% { opacity: 1; r: 6px; }
      50%      { opacity: 0.3; r: 8px; }
    }
    @keyframes ring-expand {
      0%   { r: 4px;  opacity: 0.8; }
      100% { r: 22px; opacity: 0; }
    }
    @keyframes home-pulse {
      0%,100% { opacity: 1;   filter: drop-shadow(0 0 12px #FFD700); }
      50%      { opacity: 0.6; filter: drop-shadow(0 0 4px #FFD700); }
    }
    @keyframes wm-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin   { to{transform:rotate(360deg)} }
    @keyframes slide-r { from{transform:translateX(100%)} to{transform:translateX(0)} }
    .arc-line { stroke-dasharray: 800; animation: arc-flow 3s ease-in-out infinite; }
    .city-dot { animation: city-pulse 2s ease-in-out infinite; }
    .city-ring { animation: ring-expand 2s ease-out infinite; }
    .home-star { animation: home-pulse 1.8s ease-in-out infinite; }
    .node-hit  { cursor: pointer; }
    .node-hit:hover circle { filter: brightness(1.5); }
    .sc-h{background:rgba(255,215,0,.15);color:#FFD700;border:.5px solid rgba(255,215,0,.3);}
    .sc-m{background:rgba(249,115,22,.15);color:#f97316;border:.5px solid rgba(249,115,22,.3);}
    .sc-s{background:rgba(96,165,250,.15);color:#60a5fa;border:.5px solid rgba(96,165,250,.3);}
    .portal-link:hover{background:rgba(255,255,255,.06)!important;transform:translateX(2px);}
    .job-card:hover{border-color:rgba(255,215,0,.3)!important;background:rgba(255,215,0,.03)!important;}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,215,0,.2);border-radius:2px}
  `;

  // Glow intensity for a city (more jobs = brighter)
  const glowSize = (n) => {
    const j = nodeJobs(n.id);
    if (j.length === 0) return 0;
    return Math.min(4 + j.length * 2, 20);
  };

  return (
    <div style={{ fontFamily:"'Instrument Sans',system-ui,sans-serif", animation:"wm-in .4s" }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10, marginBottom:14 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:"#e0e7ff", margin:0 }}>
            🌍 Live Global Job Radar
          </h2>
          <p style={{ fontSize:12, color:"#6b7280", margin:"4px 0 0" }}>
            Gold glow = active DevOps jobs · Arcs = live connections from Hyderabad · ≤7 days only
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20,
            background:status.ok?"rgba(255,215,0,.08)":"rgba(96,165,250,.08)",
            border:`0.5px solid ${status.ok?"rgba(255,215,0,.3)":"rgba(96,165,250,.3)"}`,
            fontSize:11, color:status.ok?"#FFD700":"#60a5fa" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:status.ok?"#FFD700":"#60a5fa",
              animation:loading?"spin 1s linear infinite":"none" }}/>
            {status.text}
          </div>
          <button onClick={()=>{ try{localStorage.removeItem(CACHE_KEY)}catch{} fetchLive(); }}
            style={{ padding:"5px 12px", borderRadius:8, border:"0.5px solid rgba(255,255,255,.1)", background:"rgba(255,255,255,.04)", color:"#6b7280", fontSize:11, cursor:"pointer" }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }}>
        {[
          {l:"Live roles (≤7d)",  v:liveJobs.length,                              c:"#FFD700"},
          {l:"High fit 80+",      v:liveJobs.filter(j=>j.score>=80).length,       c:"#22c55e"},
          {l:"Posted today",      v:liveJobs.filter(j=>NOW()-j.ts<86400000).length,c:"#f97316"},
          {l:"Active locations",  v:WORLD_NODES.filter(n=>nodeJobs(n.id).length>0).length, c:"#60a5fa"},
        ].map(s=>(
          <div key={s.l} style={{ padding:"10px 14px", borderRadius:10, background:"rgba(255,255,255,.03)", border:"0.5px solid rgba(255,255,255,.08)", textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:800, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:10, color:"#6b7280", marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* THE MAP */}
      <div style={{ position:"relative", borderRadius:16, overflow:"hidden",
        border:"0.5px solid rgba(255,255,255,.08)",
        background:"linear-gradient(160deg, #020b18 0%, #030d20 40%, #010810 100%)",
        boxShadow:"0 0 80px rgba(0,0,0,.8), inset 0 0 120px rgba(96,165,250,.04)" }}>

        <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", display:"block" }} preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Glow filters */}
            <filter id="glow-gold" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glow-blue" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <radialGradient id="india-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#FFD700" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="bg-grad" cx="60%" cy="55%" r="60%">
              <stop offset="0%"   stopColor="#0a2040" stopOpacity="1"/>
              <stop offset="100%" stopColor="#010810" stopOpacity="1"/>
            </radialGradient>
            {/* Arc gradient */}
            <linearGradient id="arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#FFD700" stopOpacity="0"/>
              <stop offset="50%"  stopColor="#60a5fa" stopOpacity="0.9"/>
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0.8"/>
            </linearGradient>
          </defs>

          {/* Deep space background */}
          <rect width={W} height={H} fill="url(#bg-grad)"/>

          {/* Grid lines (like a radar grid) */}
          {[0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9].map(f=>(
            <line key={`v${f}`} x1={W*f} y1={0} x2={W*f} y2={H} stroke="rgba(96,165,250,.04)" strokeWidth={0.5}/>
          ))}
          {[0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9].map(f=>(
            <line key={`h${f}`} x1={0} y1={H*f} x2={W} y2={H*f} stroke="rgba(96,165,250,.04)" strokeWidth={0.5}/>
          ))}

          {/* CONTINENT DOT MATRIX — filled with tiny circles to look like the reference image */}
          {Object.entries(CONTINENTS).map(([id, path]) => (
            <g key={id}>
              {/* Solid fill with low opacity */}
              <path d={path} fill="rgba(30,60,100,.35)" stroke="rgba(96,165,250,.12)" strokeWidth={0.8}/>
              {/* Dot overlay pattern using clipPath effect */}
              <path d={path} fill="none" stroke="rgba(96,165,250,.08)" strokeWidth={0.4}
                strokeDasharray="2,4"/>
            </g>
          ))}

          {/* Dot matrix overlay for continent texture */}
          {Array.from({length:60}, (_,row) =>
            Array.from({length:120}, (_,col) => {
              const x = col * 10 + 5, y = row * 9 + 5;
              // Only show dots over approximate continent regions
              const overLand = (
                (x>125&&x<295&&y>100&&y<285) || // N America
                (x>200&&x<290&&y>295&&y<460) || // S America
                (x>435&&x<550&&y>155&&y<220) || // Europe
                (x>440&&x<550&&y>220&&y<400) || // Africa
                (x>535&&x<880&&y>145&&y<295) || // Asia
                (x>335&&x<425&&y>90&&y<135)  || // Greenland
                (x>785&&x<900&&y>375&&y<455)    // Australia
              );
              if (!overLand) return null;
              return <circle key={`d${row}-${col}`} cx={x} cy={y} r={0.9} fill="rgba(96,165,250,.25)"/>;
            })
          )}

          {/* India region glow — warm gold halo */}
          <ellipse cx={700} cy={290} rx={90} ry={85}
            fill="url(#india-glow)" opacity={0.8}/>
          <ellipse cx={700} cy={290} rx={50} ry={45}
            fill="rgba(255,215,0,.06)"/>

          {/* Animated ARC LINES from Hyderabad to international job cities */}
          {arcTargets.map((target, i) => {
            const delay = i * 0.4;
            const path  = arcPath(HOME.x, HOME.y, target.x, target.y);
            return (
              <g key={target.id}>
                {/* Glow arc */}
                <path d={path} fill="none" stroke="rgba(96,165,250,.15)" strokeWidth={2.5}/>
                {/* Animated arc */}
                <path d={path} fill="none" stroke="url(#arc-grad)" strokeWidth={1.5}
                  className="arc-line"
                  style={{ animationDelay:`${delay}s`, animationDuration:`${2.5+i*0.3}s` }}/>
                {/* Dot travelling along arc */}
                <path d={path} fill="none" stroke="transparent" strokeWidth={1} id={`arc-${target.id}`}/>
                <circle r={3} fill="#FFD700" opacity={0.9} filter="url(#glow-gold)">
                  <animateMotion dur={`${2.5+i*0.3}s`} repeatCount="indefinite"
                    begin={`${delay}s`}>
                    <mpath href={`#arc-${target.id}`}/>
                  </animateMotion>
                </circle>
              </g>
            );
          })}

          {/* CITY NODES */}
          {WORLD_NODES.map(node => {
            const jobs   = nodeJobs(node.id);
            const hasJobs= jobs.length > 0;
            const isSel  = selNode?.id === node.id;
            const glow   = glowSize(node);
            const col    = node.home ? "#FFD700" : hasJobs ? "#FFD700" : "#1e4a7a";
            const R      = node.home ? 9 : node.india ? 6 : 7;

            return (
              <g key={node.id} className="node-hit"
                onClick={() => setSelNode(isSel ? null : node)}
                transform={`translate(${node.x},${node.y})`}>

                {/* Expanding rings for nodes with jobs */}
                {hasJobs && <>
                  <circle r={R+2} fill="none" stroke={col} strokeWidth={1.2} opacity={0.7}
                    className="city-ring"
                    style={{ animationDelay:"0s", animationDuration:`${1.8+Math.random()*0.5}s` }}/>
                  <circle r={R+2} fill="none" stroke={col} strokeWidth={0.8} opacity={0.4}
                    className="city-ring"
                    style={{ animationDelay:"0.9s", animationDuration:`${2.2+Math.random()*0.5}s` }}/>
                </>}

                {/* Glow halo */}
                {hasJobs && <circle r={R+glow} fill={col} opacity={0.06}/>}

                {/* Main city dot */}
                {node.home ? (
                  // Hyderabad — special gold star
                  <polygon
                    className="home-star"
                    filter="url(#glow-gold)"
                    fill="#FFD700"
                    points={[0,1,2,3,4,5,6,7,8,9].map(i=>{
                      const a=(Math.PI/5)*i-Math.PI/2,r=i%2===0?R:R*.42;
                      return `${Math.cos(a)*r},${Math.sin(a)*r}`;
                    }).join(" ")}
                  />
                ) : (
                  <circle r={R}
                    fill={hasJobs ? col : "#0d2a4a"}
                    stroke={hasJobs ? col : "rgba(96,165,250,.3)"}
                    strokeWidth={0.8}
                    opacity={hasJobs ? 1 : 0.4}
                    filter={hasJobs ? "url(#glow-soft)" : "none"}
                    className={hasJobs ? "city-dot" : ""}
                    style={hasJobs ? { animationDelay:`${Math.random()*1.5}s` } : {}}
                  />
                )}

                {/* Inner bright dot */}
                {hasJobs && <circle r={R*.45} fill="white" opacity={0.7}/>}

                {/* Selection ring */}
                {isSel && <circle r={R+16} fill="none" stroke="#FFD700" strokeWidth={1.5} strokeDasharray="4,3" opacity={0.8}/>}

                {/* City label */}
                <text
                  x={0} y={R+14}
                  textAnchor="middle"
                  fontSize={node.home ? 9 : node.india ? 8 : 8}
                  fontFamily="system-ui,sans-serif"
                  fontWeight={node.home || isSel ? 700 : 400}
                  fill={isSel ? "#FFD700" : hasJobs ? "rgba(255,255,255,.75)" : "rgba(255,255,255,.3)"}
                  style={{ pointerEvents:"none" }}>
                  {node.name}
                </text>

                {/* Job count badge */}
                {hasJobs && !node.home && (
                  <g>
                    <rect x={-11} y={R+16} width={22} height={11} rx={3}
                      fill="rgba(0,0,0,.8)" stroke={col} strokeWidth={0.5}/>
                    <text x={0} y={R+25} textAnchor="middle" fontSize={7}
                      fontFamily="system-ui" fontWeight={700} fill={col}>
                      {jobs.length}
                    </text>
                  </g>
                )}

                {/* HOME badge */}
                {node.home && (
                  <g>
                    <rect x={-16} y={R+16} width={32} height={11} rx={3}
                      fill="rgba(255,215,0,.15)" stroke="#FFD700" strokeWidth={0.5}/>
                    <text x={0} y={R+25} textAnchor="middle" fontSize={7}
                      fontFamily="system-ui" fontWeight={700} fill="#FFD700">
                      HOME ★
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Ocean labels */}
          <text x={80}  y={360} fontSize={11} fill="rgba(96,165,250,.15)" fontFamily="Georgia,serif" fontStyle="italic" transform="rotate(-15,80,360)">Pacific Ocean</text>
          <text x={380} y={470} fontSize={11} fill="rgba(96,165,250,.15)" fontFamily="Georgia,serif" fontStyle="italic">Atlantic Ocean</text>
          <text x={620} y={450} fontSize={11} fill="rgba(96,165,250,.15)" fontFamily="Georgia,serif" fontStyle="italic">Indian Ocean</text>

          {/* Loading overlay */}
          {loading && (
            <g>
              <rect width={W} height={H} fill="rgba(1,8,16,.7)"/>
              <text x={W/2} y={H/2} textAnchor="middle" fontSize={14}
                fill="rgba(255,215,0,.7)" fontFamily="system-ui">
                Scanning live job feeds…
              </text>
            </g>
          )}
        </svg>

        {/* Side panel */}
        {selNode && (
          <div style={{
            position:"absolute", top:0, right:0, width:320, height:"100%",
            background:"rgba(2,11,24,.97)", backdropFilter:"blur(20px)",
            borderLeft:"0.5px solid rgba(255,215,0,.15)",
            animation:"slide-r .22s ease-out", overflowY:"auto", zIndex:20,
          }}>
            <div style={{ padding:"14px 16px", borderBottom:"0.5px solid rgba(255,255,255,.06)",
              position:"sticky", top:0, background:"rgba(2,11,24,.97)", zIndex:1,
              display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"#FFD700" }}>
                  {selNode.india ? "🇮🇳" : "🌐"} {selNode.name}
                </div>
                <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>
                  {selJobs.length} live roles · {selPortals.length} search links
                </div>
              </div>
              <button onClick={()=>setSelNode(null)}
                style={{ background:"rgba(255,255,255,.04)", border:"0.5px solid rgba(255,255,255,.1)",
                  borderRadius:6, width:26, height:26, cursor:"pointer", color:"#6b7280",
                  fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            </div>

            <div style={{ padding:"12px 14px" }}>

              {/* Search portals — always working */}
              {selPortals.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#60a5fa", marginBottom:8 }}>
                    ⚡ Apply Now — pre-filtered, sorted newest first
                  </div>
                  {selPortals.map(p => (
                    <a key={p.n} href={p.url} target="_blank" rel="noopener noreferrer"
                      className="portal-link"
                      style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                        padding:"8px 10px", borderRadius:8, marginBottom:5,
                        background:"rgba(255,255,255,.02)", border:`0.5px solid rgba(255,255,255,.06)`,
                        textDecoration:"none", transition:"all .15s", borderLeft:`2px solid ${p.c}` }}>
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
                    🔴 Live Jobs — direct apply link
                  </div>
                  {selJobs.slice(0,8).map(j => {
                    const dl = fmtDate(j.ts);
                    return (
                      <div key={j.id} className="job-card"
                        style={{ padding:"10px 12px", borderRadius:10, marginBottom:7,
                          background:"rgba(255,255,255,.02)", border:"0.5px solid rgba(255,255,255,.07)",
                          transition:"all .15s" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", gap:6, marginBottom:4 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:"#e0e7ff", lineHeight:1.3 }}>{j.title}</div>
                          <span className={sCls(j.score)} style={{ fontSize:10, padding:"2px 7px", borderRadius:20, fontWeight:700, flexShrink:0 }}>{j.score}</span>
                        </div>
                        <div style={{ fontSize:11, color:"#6b7280", marginBottom:4 }}>
                          {j.co} · <span style={{ color:"#475569" }}>{j.src}</span>
                        </div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:7 }}>
                          {(j.tags||[]).slice(0,4).map(t=>(
                            <span key={t} style={{ fontSize:9, padding:"1px 6px", borderRadius:4,
                              background:"rgba(96,165,250,.1)", color:"#60a5fa",
                              border:"0.5px solid rgba(96,165,250,.2)" }}>{t}</span>
                          ))}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          <div>
                            {j.sal && <div style={{ fontSize:10, color:"#1D9E75", fontWeight:600 }}>{j.sal}</div>}
                            <div style={{ fontSize:10, color:"#6b7280" }}>
                              🌐 Remote ·
                              <strong style={{ color:dl==="Just now"||(dl?.includes("m")||dl?.includes("h"))?"#FFD700":"#6b7280", marginLeft:3 }}>
                                {dl}
                              </strong>
                            </div>
                          </div>
                          <a href={j.url} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize:11, fontWeight:700, padding:"6px 14px", borderRadius:6,
                              background:"linear-gradient(135deg,#FFD700,#f97316)",
                              color:"#000", textDecoration:"none", flexShrink:0,
                              boxShadow:"0 0 12px rgba(255,215,0,.3)" }}>
                            Apply ↗
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selJobs.length === 0 && selPortals.length === 0 && (
                <div style={{ textAlign:"center", padding:"24px 0", color:"#6b7280", fontSize:12 }}>
                  No live roles found for this location.<br/>Try refreshing or check back soon.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:16, marginTop:10, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#6b7280" }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#FFD700", boxShadow:"0 0 6px #FFD700" }}/>
          Active job opening
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#6b7280" }}>
          <div style={{ width:20, height:1.5, background:"linear-gradient(90deg,transparent,#60a5fa,#FFD700)" }}/>
          Job arc — live connection
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#6b7280" }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#1e4a7a" }}/>
          No current openings
        </div>
        <div style={{ marginLeft:"auto", fontSize:10, color:"#6b7280" }}>
          {lastUp ? `Updated ${lastUp} · 7-day cutoff` : "Loading…"}
        </div>
      </div>
    </div>
  );
}
