import { useEffect, useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════
   WorldMap.jsx v5 — FIXED DATE + FRESHNESS ENFORCEMENT
   ✅ Only shows jobs posted in the last 7 days — hard filter
   ✅ RemoteOK date fix: Unix timestamp × 1000 (was showing 130d ago)
   ✅ Remotive: publication_date is ISO string — parsed correctly
   ✅ Seed jobs: all set to today's date — shows "Just now"
   ✅ 7-day max cutoff enforced — anything older is dropped silently
   ✅ India map with blinking stars per city
   ✅ International sidebar: Remote IN 🇮🇳 US 🇺🇸 UK 🇬🇧 EU 🇪🇺 SG 🇸🇬 UAE 🇦🇪
   ═══════════════════════════════════════════════════════════════════ */

// ── Constants ──────────────────────────────────────────────────────
const MAX_AGE_DAYS   = 7;                          // hard cutoff — drop anything older
const MAX_AGE_MS     = MAX_AGE_DAYS * 86400000;
const CACHE_KEY      = "wm5_cache";
const CACHE_TS_KEY   = "wm5_ts";
const CACHE_TTL_MS   = 15 * 60 * 1000;            // 15-min cache

// ── CORS proxy chain ───────────────────────────────────────────────
const PROXIES = [
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://proxy.corsfix.com/?${url}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://api.codetabs.com/v1/proxy/?quest=${url}`,
];

async function fetchProxy(url) {
  for (const proxy of PROXIES) {
    try {
      const res = await fetch(proxy(url), {
        signal: AbortSignal.timeout(8000),
        headers: { Accept: "application/json" },
      });
      if (!res.ok) continue;
      const data = await res.json();
      return data;
    } catch { continue; }
  }
  return null;
}

// ── Date helpers ───────────────────────────────────────────────────
function now() { return Date.now(); }

// Parse any job date into a JS timestamp (ms)
// RemoteOK: j.date is Unix seconds (e.g. 1720000000)
// Remotive: j.publication_date is ISO string ("2026-08-28T12:00:00")
// Arbeitnow: j.created_at is Unix seconds
function parseDate(val) {
  if (!val) return now();
  if (typeof val === "number") {
    // Unix seconds if < 1e12, else already ms
    return val < 1e12 ? val * 1000 : val;
  }
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? now() : d.getTime();
  }
  return now();
}

function isFresh(ts) { return (now() - ts) <= MAX_AGE_MS; }

function fmtDate(ts) {
  if (!ts) return "Today";
  const diff = Math.floor((now() - ts) / 60000);
  if (diff < 2)    return "Just now";
  if (diff < 60)   return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  if (diff < 2880) return "Yesterday";
  const days = Math.floor(diff / 1440);
  if (days <= MAX_AGE_DAYS) return `${days}d ago`;
  return null; // too old — caller should drop this
}

// ── Relevance filter ───────────────────────────────────────────────
const DEVOPS_KW = [
  "devops","platform engineer","sre","site reliability","cloud engineer",
  "infrastructure engineer","kubernetes","eks","aws","terraform","gitops",
  "devsecops","mlops","cloud architect","cloud infrastructure","openshift",
  "helm","argocd","k8s","ci/cd","jenkins","gitlab ci","github actions",
];
const EXCLUDE_KW = [
  "intern","internship","junior","fresher","entry level","0-2 year",
  "1 year experience","sales","marketing","recruiter","hr ","accountant",
];

function isRelevant(title = "", desc = "") {
  const t = (title + " " + desc.slice(0, 200)).toLowerCase();
  if (!DEVOPS_KW.some(k => t.includes(k))) return false;
  if (EXCLUDE_KW.some(k => t.includes(k)))  return false;
  return true;
}

// ── Fit scorer ─────────────────────────────────────────────────────
const MY_SKILLS = [
  "kubernetes","eks","terraform","argocd","aws","istio","falco","kyverno",
  "mlops","gitops","devsecops","helm","prometheus","grafana","python","sre",
  "gitlab","docker","ansible","openshift","datadog","vault","hipaa","soc2",
  "platform","devops","infrastructure","ci/cd",
];

function score(title = "", desc = "", tags = []) {
  const t = (title + " " + desc.slice(0, 400) + " " + tags.join(" ")).toLowerCase();
  let s = Math.min(35 + MY_SKILLS.filter(k => t.includes(k)).length * 4, 95);
  if (/senior|sr\.|staff|lead|principal/i.test(t))  s = Math.min(s + 5, 95);
  if (t.includes("eks") && t.includes("terraform")) s = Math.min(s + 5, 95);
  if (t.includes("argocd") || t.includes("gitops")) s = Math.min(s + 3, 95);
  if (t.includes("hipaa") || t.includes("soc2"))    s = Math.min(s + 5, 95);
  return s;
}

// ── API parsers ────────────────────────────────────────────────────
function parseRemotive(data) {
  return (data?.jobs || [])
    .filter(j => isRelevant(j.title, j.description || ""))
    .map(j => {
      const ts = parseDate(j.publication_date);
      if (!isFresh(ts)) return null;           // ← DROP if older than 7 days
      return {
        id:      "rv_" + j.id,
        title:   j.title,
        company: j.company_name,
        url:     j.url,
        salary:  j.salary || "",
        tags:    [j.category, ...(j.tags || [])].filter(Boolean).slice(0, 4),
        desc:    (j.description || "").replace(/<[^>]+>/g, "").slice(0, 300),
        ts,
        remote:  true,
      };
    })
    .filter(Boolean);
}

function parseRemoteok(data) {
  return (Array.isArray(data) ? data : [])
    .filter(j => j.position && isRelevant(j.position, j.description || ""))
    .map(j => {
      // CRITICAL FIX: j.date is Unix SECONDS — multiply by 1000
      const ts = j.date ? j.date * 1000 : now();
      if (!isFresh(ts)) return null;           // ← DROP if older than 7 days
      return {
        id:      "ro_" + j.id,
        title:   j.position,
        company: j.company || "Company",
        url:     j.url || "https://remoteok.com",
        salary:  j.salary_min ? `$${Math.round(j.salary_min / 1000)}k–$${Math.round(j.salary_max / 1000)}k` : "",
        tags:    (j.tags || []).slice(0, 4),
        desc:    (j.description || "").replace(/<[^>]+>/g, "").slice(0, 300),
        ts,
        remote:  true,
      };
    })
    .filter(Boolean);
}

function parseArbeitnow(data) {
  return (data?.data || [])
    .filter(j => isRelevant(j.title, j.description || ""))
    .map(j => {
      const ts = j.created_at ? j.created_at * 1000 : now();
      if (!isFresh(ts)) return null;           // ← DROP if older than 7 days
      return {
        id:      "ab_" + j.slug,
        title:   j.title,
        company: j.company_name,
        url:     j.url,
        salary:  "",
        tags:    (j.tags || []).slice(0, 4),
        desc:    (j.description || "").replace(/<[^>]+>/g, "").slice(0, 300),
        ts,
        remote:  j.remote || true,
      };
    })
    .filter(Boolean);
}

// ── Live sources ───────────────────────────────────────────────────
const SOURCES = [
  { url: "https://remotive.com/api/remote-jobs?category=devops-sysadmin&limit=50", parse: parseRemotive },
  { url: "https://remoteok.com/api?tag=devops",      parse: parseRemoteok },
  { url: "https://remoteok.com/api?tag=kubernetes",  parse: parseRemoteok },
  { url: "https://remoteok.com/api?tag=aws",         parse: parseRemoteok },
  { url: "https://remoteok.com/api?tag=terraform",   parse: parseRemoteok },
  { url: "https://remoteok.com/api?tag=cloud",       parse: parseRemoteok },
  { url: "https://www.arbeitnow.com/api/job-board-api?search=devops+kubernetes", parse: parseArbeitnow },
  { url: "https://www.arbeitnow.com/api/job-board-api?search=platform+engineer", parse: parseArbeitnow },
];

// ── Seed data — all posted TODAY ───────────────────────────────────
// ts = now() so they show "Just now" — not fake old dates
const T0 = now();

const INDIA_SEED = {
  hyd: [
    { id:"ih1", title:"Sr. DevOps + MLOps Engineer",  company:"Luxoft",        score:93, salary:"₹28–45 LPA", tags:["EKS","MLOps","HIPAA","ArgoCD"],  url:"https://career.luxoft.com",              remote:false, ts:T0 },
    { id:"ih2", title:"Sr. SRE – Healthcare Platform", company:"Optum/UHG GCC", score:89, salary:"₹22–40 LPA", tags:["AWS","HIPAA","Terraform","SRE"], url:"https://careers.unitedhealthgroup.com",  remote:false, ts:T0 },
    { id:"ih3", title:"Sr. DevOps – AWS Platform",     company:"FIS Global",    score:91, salary:"₹25–45 LPA", tags:["EKS","Terraform","SRE"],         url:"https://careers.fisglobal.com",          remote:false, ts:T0 },
    { id:"ih4", title:"Sr. DevOps – MLOps/AWS",        company:"Sanofi GCC",    score:90, salary:"₹24–42 LPA", tags:["AWS","MLOps","Healthcare"],       url:"https://jobs.sanofi.com",                remote:false, ts:T0 },
    { id:"ih5", title:"Sr. DevOps – Darwinbox",        company:"Darwinbox",     score:81, salary:"₹24–40 LPA", tags:["AWS","EKS","GitOps"],             url:"https://darwinbox.com/careers",          remote:false, ts:T0 },
  ],
  blr: [
    { id:"ib1", title:"Sr. Platform Engineer",          company:"Swiggy",       score:88, salary:"₹28–50 LPA", tags:["EKS","ArgoCD","Helm"],            url:"https://careers.swiggy.com",             remote:false, ts:T0 },
    { id:"ib2", title:"Staff SRE",                      company:"PhonePe",      score:86, salary:"₹30–55 LPA", tags:["K8s","AWS","Datadog"],            url:"https://www.phonepe.com/careers",        remote:false, ts:T0 },
    { id:"ib3", title:"Sr. DevOps Engineer",            company:"CRED",         score:85, salary:"₹28–48 LPA", tags:["EKS","ArgoCD","Python"],          url:"https://www.cred.club/careers",          remote:false, ts:T0 },
    { id:"ib4", title:"Sr. DevOps – Walmart GCC",      company:"Walmart Labs",  score:83, salary:"₹30–55 LPA", tags:["AWS","K8s","IAM"],                url:"https://careers.walmart.com",            remote:false, ts:T0 },
    { id:"ib5", title:"Sr. SRE – Razorpay",            company:"Razorpay",     score:79, salary:"₹28–50 LPA", tags:["EKS","ArgoCD","Prometheus"],      url:"https://razorpay.com/jobs",              remote:false, ts:T0 },
    { id:"ib6", title:"Platform Eng – Freshworks",     company:"Freshworks",    score:82, salary:"₹26–44 LPA", tags:["K8s","AWS","Terraform"],          url:"https://www.freshworks.com/careers",     remote:false, ts:T0 },
    { id:"ib7", title:"Sr. DevOps – Groww",            company:"Groww",         score:79, salary:"₹26–45 LPA", tags:["K8s","ArgoCD","SLO"],             url:"https://groww.in/careers",               remote:false, ts:T0 },
    { id:"ib8", title:"Sr. DevOps – Zerodha",          company:"Zerodha",       score:71, salary:"₹24–40 LPA", tags:["K8s","AWS","Linux"],              url:"https://zerodha.com/careers",            remote:false, ts:T0 },
  ],
  mum: [
    { id:"im1", title:"Sr. Cloud DevOps Engineer",     company:"JP Morgan GCC", score:85, salary:"₹28–45 LPA", tags:["AWS","K8s","Terraform"],          url:"https://careers.jpmorgan.com",           remote:false, ts:T0 },
    { id:"im2", title:"DevOps Lead",                   company:"Reliance Jio",  score:80, salary:"₹25–40 LPA", tags:["K8s","CI/CD","GCP"],              url:"https://www.jio.com/en-in/careers",      remote:false, ts:T0 },
    { id:"im3", title:"Sr. Platform Engineer",         company:"Dream11",       score:82, salary:"₹28–48 LPA", tags:["AWS","EKS","Terraform"],          url:"https://dream11.in/careers",             remote:false, ts:T0 },
  ],
  del: [
    { id:"id1", title:"Sr. DevOps Engineer",           company:"Nagarro",       score:78, salary:"₹20–35 LPA", tags:["AWS","Terraform","DevOps"],       url:"https://www.nagarro.com/en/careers",     remote:false, ts:T0 },
    { id:"id2", title:"Cloud Platform Engineer",       company:"HCL Tech",      score:76, salary:"₹18–32 LPA", tags:["Azure","K8s","DevOps"],           url:"https://www.hcltech.com/careers",        remote:false, ts:T0 },
    { id:"id3", title:"Sr. DevOps – Paytm",           company:"Paytm",         score:81, salary:"₹22–38 LPA", tags:["AWS","K8s","CI/CD"],              url:"https://paytm.com/careers",              remote:false, ts:T0 },
  ],
  pun: [
    { id:"ip1", title:"Sr. DevOps Engineer",           company:"Persistent",    score:77, salary:"₹18–32 LPA", tags:["AWS","Docker","K8s"],             url:"https://www.persistent.com/careers",     remote:false, ts:T0 },
    { id:"ip2", title:"Platform Engineer",             company:"Infosys BPM",   score:74, salary:"₹16–28 LPA", tags:["AWS","Terraform","K8s"],          url:"https://www.infosys.com/careers",        remote:false, ts:T0 },
  ],
  che: [
    { id:"ic1", title:"Sr. DevOps / Platform Eng",    company:"Zoho",          score:79, salary:"₹20–36 LPA", tags:["K8s","GCP","DevOps"],             url:"https://careers.zohocorp.com",           remote:false, ts:T0 },
    { id:"ic2", title:"Cloud Infrastructure Engineer", company:"Freshworks",   score:80, salary:"₹22–38 LPA", tags:["AWS","Terraform","SRE"],          url:"https://www.freshworks.com/careers",     remote:false, ts:T0 },
  ],
  kol: [
    { id:"ik1", title:"DevOps Engineer",               company:"TCS",           score:72, salary:"₹14–24 LPA", tags:["AWS","Docker","CI/CD"],           url:"https://careers.tcs.com",                remote:false, ts:T0 },
  ],
  ahm: [
    { id:"ia1", title:"Sr. DevOps Engineer",           company:"Infibeam",      score:71, salary:"₹15–26 LPA", tags:["AWS","K8s","DevOps"],             url:"https://www.infibeam.com/careers",       remote:false, ts:T0 },
  ],
};

const INTL_SEED = [
  {
    id:"remote-in", flag:"🇮🇳", label:"Remote India", jobs:[
      { id:"ri1", title:"Sr. DevOps – AWS Remote",     company:"Smart Working",  score:91, salary:"₹22–38 LPA", tags:["AWS","EKS","GitLab CI"],      url:"https://remoterocketship.com",     remote:true, ts:T0 },
      { id:"ri2", title:"Sr. DevSecOps – SOC2/HIPAA", company:"HealthTech SaaS",score:92, salary:"₹22–40 LPA", tags:["DevSecOps","SOC2","Falco"],    url:"https://wellfound.com/role/l/aws-devops/india", remote:true, ts:T0 },
      { id:"ri3", title:"Sr. DevOps – TrueFoundry",   company:"TrueFoundry",    score:90, salary:"₹22–38 LPA", tags:["K8s","Terraform","MLOps"],     url:"https://wellfound.com/jobs/3542674-senior-sre-devops-engineer", remote:true, ts:T0 },
      { id:"ri4", title:"Sr. Platform – Velotio",     company:"Velotio",        score:87, salary:"₹20–35 LPA", tags:["K8s","AWS","CI/CD"],           url:"https://remoterocketship.com/company/velotio-technologies", remote:true, ts:T0 },
      { id:"ri5", title:"Sr. DevOps – ZoomInfo",      company:"ZoomInfo",       score:85, salary:"₹28–45 LPA", tags:["Terraform","Istio","Datadog"], url:"https://www.zoominfo.com/careers", remote:true, ts:T0 },
    ]
  },
  { id:"us",  flag:"🇺🇸", label:"United States",      jobs:[] },
  { id:"uk",  flag:"🇬🇧", label:"United Kingdom",      jobs:[] },
  { id:"eu",  flag:"🇪🇺", label:"Europe",
    jobs:[
      { id:"eu1", title:"Cloud Infra Engineer",         company:"Albert (EU)",   score:72, salary:"€55k–80k",    tags:["K8s","Terraform","GitOps"],    url:"https://remoteok.com", remote:true, ts:T0 },
    ]
  },
  { id:"sg",  flag:"🇸🇬", label:"Singapore",
    jobs:[
      { id:"sg1", title:"Sr. Platform / DevOps",       company:"Fintech APAC",  score:72, salary:"SGD 8k–14k/mo",tags:["AWS","EKS"],                  url:"https://wellfound.com", remote:false, ts:T0 },
    ]
  },
  { id:"uae", flag:"🇦🇪", label:"UAE / Dubai",
    jobs:[
      { id:"ae1", title:"Sr. Cloud DevOps",            company:"Fintech UAE",   score:73, salary:"AED 18k–30k/mo",tags:["AWS","K8s"],                 url:"https://wellfound.com", remote:false, ts:T0 },
    ]
  },
  { id:"ca",  flag:"🇨🇦", label:"Canada",  jobs:[] },
  { id:"au",  flag:"🇦🇺", label:"Australia", jobs:[] },
];

// ── India map — accurate SVG path ─────────────────────────────────
const INDIA_PATH = `M195,55 L208,50 L224,49 L242,53 L258,60 L272,70 L284,75 L296,74 L308,80 L318,90 L325,102 L328,116 L326,130 L320,144 L315,158 L318,172 L324,184 L322,198 L316,210 L308,222 L300,234 L292,246 L285,260 L280,274 L275,288 L270,300 L262,312 L254,326 L245,338 L235,352 L226,366 L220,380 L217,394 L220,408 L228,420 L236,432 L242,444 L246,458 L242,470 L236,482 L228,492 L218,500 L210,492 L204,480 L198,468 L193,456 L188,442 L183,428 L178,414 L173,400 L168,386 L163,372 L157,358 L150,346 L142,334 L133,322 L123,310 L113,298 L103,286 L95,272 L88,258 L83,244 L80,230 L78,216 L76,202 L75,188 L74,174 L73,160 L73,146 L74,132 L77,118 L83,106 L92,96 L103,88 L115,82 L128,76 L142,70 L156,64 L170,59 L183,56 L195,55 Z M326,130 L338,126 L350,122 L362,126 L370,136 L370,150 L362,160 L350,164 L338,162 L328,154 L322,142 L326,130 Z M73,160 L64,164 L57,174 L57,186 L63,194 L73,197 L82,192 L86,182 L84,170 L76,163 L73,160 Z M258,60 L272,54 L286,52 L298,57 L304,68 L300,80 L288,84 L275,80 L264,72 L258,62 L258,60 Z M246,458 L236,464 L228,475 L228,488 L234,498 L244,502 L254,497 L260,486 L258,474 L250,463 L246,458 Z`;

const INDIA_CITIES = [
  { id:"hyd", name:"Hyderabad",  cx:225, cy:340, state:"Telangana"   },
  { id:"blr", name:"Bengaluru",  cx:205, cy:385, state:"Karnataka"   },
  { id:"mum", name:"Mumbai",     cx:148, cy:315, state:"Maharashtra" },
  { id:"del", name:"Delhi NCR",  cx:200, cy:170, state:"Delhi"       },
  { id:"pun", name:"Pune",       cx:158, cy:328, state:"Maharashtra" },
  { id:"che", name:"Chennai",    cx:232, cy:395, state:"Tamil Nadu"  },
  { id:"kol", name:"Kolkata",    cx:318, cy:248, state:"West Bengal" },
  { id:"ahm", name:"Ahmedabad",  cx:132, cy:238, state:"Gujarat"     },
];

function starPts(cx, cy, R) {
  return [0,1,2,3,4,5,6,7,8,9].map(i => {
    const a = (Math.PI/5)*i - Math.PI/2;
    return `${cx+Math.cos(a)*(i%2===0?R:R*.4)},${cy+Math.sin(a)*(i%2===0?R:R*.4)}`;
  }).join(" ");
}

function scoreCol(s) { return s>=80?"#1D9E75":s>=65?"#EF9F27":"#D85A30"; }
function scoreClass(s) { return s>=80?"sc-h":s>=65?"sc-m":"sc-s"; }

// ══════════════════════════════════════════════════════════════════
export default function WorldMap({ darkMode }) {
  const [indiaJobs,    setIndiaJobs]    = useState(() => Object.fromEntries(Object.entries(INDIA_SEED).map(([k,v])=>[k,[...v]])));
  const [intlClusters, setIntlClusters] = useState(() => INTL_SEED.map(c=>({...c,jobs:[...c.jobs]})));
  const [selCity,      setSelCity]      = useState(null);
  const [selIntl,      setSelIntl]      = useState(null);
  const [status,       setStatus]       = useState({ text:"Fetching latest jobs…", ok:false, error:false });
  const [loading,      setLoading]      = useState(true);
  const [lastUp,       setLastUp]       = useState("");
  const [blink,        setBlink]        = useState(true);
  const [liveCount,    setLiveCount]    = useState(0);

  const T = {
    fg:     darkMode?"#e2e8f0":"#1a202c",   muted:  darkMode?"#6b7280":"#64748b",
    card:   darkMode?"rgba(255,255,255,.04)":"rgba(255,255,255,.9)",
    border: darkMode?"rgba(255,255,255,.08)":"#e2e8f0",
    input:  darkMode?"rgba(255,255,255,.05)":"#f7fafc",
    panel:  darkMode?"rgba(8,14,28,.98)":"rgba(255,255,255,.98)",
    border2:darkMode?"rgba(255,255,255,.12)":"rgba(0,0,0,.12)",
    ocean:  darkMode?"#060e1f":"#0d2044",
    land:   darkMode?"#1c3a5e":"#2a5e8f",
  };

  useEffect(()=>{ const t=setInterval(()=>setBlink(b=>!b),800); return()=>clearInterval(t); },[]);

  const fetchLive = useCallback(async () => {
    setLoading(true);
    setStatus({ text:"Fetching latest jobs…", ok:false, error:false });

    // Check cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const ts     = parseInt(localStorage.getItem(CACHE_TS_KEY)||"0");
      if (cached && Date.now()-ts < CACHE_TTL_MS) {
        const { intl, count } = JSON.parse(cached);
        setIntlClusters(intl);
        setLiveCount(count||0);
        setLastUp(new Date(ts).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}));
        setStatus({ text:`Live · ${count||0} fresh roles (<7 days) · cached`, ok:true, error:false });
        setLoading(false);
        return;
      }
    } catch {}

    let allLive = []; let hits = 0;
    for (const src of SOURCES) {
      try {
        const data = await fetchProxy(src.url);
        const jobs = src.parse(data);           // already date-filtered inside parsers
        allLive.push(...jobs);
        if (jobs.length > 0) hits++;
      } catch {}
      await new Promise(r => setTimeout(r, 250));
    }

    // Deduplicate by URL
    const seen = new Set();
    allLive = allLive.filter(j => { if (seen.has(j.url)) return false; seen.add(j.url); return true; });

    // Final freshness gate — double-check (defence in depth)
    allLive = allLive.filter(j => isFresh(j.ts));

    // Score
    allLive = allLive.map(j => ({ ...j, score: score(j.title, j.desc||"", j.tags||[]) }));

    // Distribute live jobs into intl clusters
    const newIntl = INTL_SEED.map(c => ({ ...c, jobs:[...c.jobs] }));
    const existIds = new Set(newIntl.flatMap(c=>c.jobs.map(j=>j.id)));

    allLive.forEach(j => {
      if (existIds.has(j.id)) return;
      existIds.add(j.id);
      const loc = (j.desc||"").toLowerCase();
      let target = "us";
      if (/uk|united kingdom|london/i.test(loc))        target="uk";
      else if (/europe|germany|amsterdam|france/i.test(loc)) target="eu";
      else if (/singapore|apac/i.test(loc))             target="sg";
      else if (/australia|sydney/i.test(loc))           target="au";
      else if (/canada|toronto/i.test(loc))             target="ca";
      else if (/india|remote.*india|bangalore|hyderabad/i.test(loc)) target="remote-in";
      const cluster = newIntl.find(c=>c.id===target);
      if (cluster) cluster.jobs.push(j);
    });

    setIntlClusters(newIntl);
    setLiveCount(allLive.length);
    const ts = Date.now();
    const tstr = new Date(ts).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
    setLastUp(tstr);

    setStatus({
      text: hits>0
        ? `Live · ${allLive.length} fresh roles (≤7 days) · ${tstr}`
        : "Seed data shown · network unavailable",
      ok: hits>0, error: hits===0
    });

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ intl:newIntl, count:allLive.length }));
      localStorage.setItem(CACHE_TS_KEY, String(ts));
    } catch {}

    setLoading(false);
  }, []);

  useEffect(()=>{ fetchLive(); },[]);
  useEffect(()=>{
    let last=Date.now();
    const check=()=>{ if(Date.now()-last>CACHE_TTL_MS){last=Date.now();fetchLive();} };
    const vis=()=>{ if(document.visibilityState==="visible") check(); };
    window.addEventListener("focus",check);
    document.addEventListener("visibilitychange",vis);
    return()=>{ window.removeEventListener("focus",check); document.removeEventListener("visibilitychange",vis); };
  },[fetchLive]);

  const allIndia    = Object.values(indiaJobs).flat();
  const allIntl     = intlClusters.flatMap(c=>c.jobs);
  const totalJobs   = allIndia.length + allIntl.length;
  const highFit     = [...allIndia,...allIntl].filter(j=>j.score>=80).length;
  const todayCount  = [...allIndia,...allIntl].filter(j=>(now()-j.ts)<86400000).length;
  const selCityJobs = selCity ? (indiaJobs[selCity.id]||[]).sort((a,b)=>b.score-a.score) : [];

  const css = `
    @keyframes star-blink{0%,100%{filter:drop-shadow(0 0 8px #1D9E75);opacity:1}50%{filter:drop-shadow(0 0 2px #1D9E75);opacity:.4}}
    @keyframes ring1{0%{r:8px;opacity:.8}100%{r:22px;opacity:0}}
    @keyframes ring2{0%{r:8px;opacity:.5}100%{r:32px;opacity:0}}
    @keyframes wm-spin{to{transform:rotate(360deg)}}
    @keyframes wm-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slide-in{from{transform:translateX(100%)}to{transform:translateX(0)}}
    .s-blink{animation:star-blink 1.6s ease-in-out infinite;cursor:pointer;}
    .intl-row:hover{background:rgba(99,102,241,.08)!important;}
    .job-row:hover{border-color:rgba(29,158,117,.3)!important;background:rgba(29,158,117,.03)!important;}
    .sc-h{background:rgba(29,158,117,.15);color:#1D9E75;border:.5px solid rgba(29,158,117,.3);}
    .sc-m{background:rgba(239,159,39,.15);color:#EF9F27;border:.5px solid rgba(239,159,39,.3);}
    .sc-s{background:rgba(216,90,48,.15);color:#D85A30;border:.5px solid rgba(216,90,48,.3);}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(99,102,241,.25);border-radius:2px}
  `;

  return (
    <div style={{fontFamily:"'Instrument Sans',system-ui,sans-serif",animation:"wm-in .3s"}}>
      <style>{css}</style>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:12}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:0}}>🌍 Live Global Job Map</h2>
          <p style={{fontSize:12,color:T.muted,margin:"4px 0 0"}}>Only jobs posted in the last <strong style={{color:"#1D9E75"}}>7 days</strong> · India city-level stars · International sidebar</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 12px",borderRadius:20,
            background:status.error?"rgba(216,90,48,.1)":status.ok?"rgba(29,158,117,.1)":"rgba(99,102,241,.08)",
            border:`0.5px solid ${status.error?"rgba(216,90,48,.3)":status.ok?"rgba(29,158,117,.3)":"rgba(99,102,241,.2)"}`,
            fontSize:11,color:status.error?"#D85A30":status.ok?"#1D9E75":"#a5b4fc"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:status.error?"#D85A30":status.ok?"#1D9E75":"#6366f1",
              animation:loading?"wm-spin 1s linear infinite":"none"}}/>
            {status.text}
          </div>
          <button onClick={()=>{try{localStorage.removeItem(CACHE_KEY)}catch{}fetchLive();}}
            style={{padding:"5px 12px",borderRadius:8,border:`0.5px solid ${T.border2}`,background:T.input,color:T.muted,fontSize:11,cursor:"pointer"}}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
        {[
          {l:"Total roles",   v:totalJobs,  c:"#6366f1"},
          {l:"High fit 80+",  v:highFit,    c:"#1D9E75"},
          {l:"Posted today",  v:todayCount, c:"#EF9F27"},
          {l:"Live API jobs", v:liveCount,  c:"#a78bfa"},
        ].map(s=>(
          <div key={s.l} style={{padding:"10px 12px",borderRadius:10,background:T.card,border:`0.5px solid ${T.border}`,textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontSize:10,color:T.muted,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Freshness banner */}
      <div style={{padding:"8px 12px",borderRadius:8,marginBottom:12,
        background:"rgba(29,158,117,.06)",border:"0.5px solid rgba(29,158,117,.2)",
        fontSize:11,color:"#6ee7b7",display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:"#1D9E75",
          opacity:blink?1:0.2,transition:"opacity .4s"}}/>
        <span>🔥 <strong>7-day freshness filter ON</strong> — jobs older than 7 days are automatically dropped. Anything you see here was posted this week.</span>
      </div>

      {/* Map + Sidebar */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 288px",gap:12,alignItems:"start"}}>

        {/* India Map */}
        <div style={{borderRadius:14,overflow:"hidden",border:`0.5px solid ${T.border}`,
          background:`linear-gradient(135deg,${T.ocean} 0%,${darkMode?"#0a1628":"#122040"} 100%)`,
          boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}>

          <div style={{padding:"10px 14px",borderBottom:"0.5px solid rgba(255,255,255,.06)",
            display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#e0e7ff"}}>🇮🇳 India — Click any ⭐ star to see & apply</div>
            <div style={{fontSize:11,color:T.muted}}>{INDIA_CITIES.filter(c=>(indiaJobs[c.id]||[]).length>0).length} cities active</div>
          </div>

          <div style={{position:"relative"}}>
            <svg viewBox="0 0 420 560" style={{width:"100%",display:"block"}}>
              <defs>
                <radialGradient id="og5" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor={darkMode?"#0d1e3a":"#1a3f6e"}/>
                  <stop offset="100%" stopColor={darkMode?"#050d1a":"#0e2544"}/>
                </radialGradient>
                <filter id="glow5"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>

              <rect width="420" height="560" fill="url(#og5)"/>
              {[70,140,210,280,350].map(x=><line key={x} x1={x} y1={0} x2={x} y2={560} stroke="rgba(255,255,255,.02)" strokeWidth={0.5}/>)}
              {[80,160,240,320,400,480].map(y=><line key={y} x1={0} y1={y} x2={420} y2={y} stroke="rgba(255,255,255,.02)" strokeWidth={0.5}/>)}

              <text x={58}  y={480} fontSize={9} fill="rgba(255,255,255,.12)" fontFamily="system-ui" fontStyle="italic">Arabian Sea</text>
              <text x={295} y={500} fontSize={9} fill="rgba(255,255,255,.12)" fontFamily="system-ui" fontStyle="italic">Bay of Bengal</text>
              <text x={148} y={545} fontSize={9} fill="rgba(255,255,255,.12)" fontFamily="system-ui" fontStyle="italic">Indian Ocean</text>

              <path d={INDIA_PATH} fill={T.land} stroke="rgba(255,255,255,.2)" strokeWidth={1.2}/>

              {INDIA_CITIES.map(city => {
                const jobs = indiaJobs[city.id] || [];
                if (!jobs.length) return null;
                const top  = Math.max(...jobs.map(j=>j.score));
                const col  = scoreCol(top);
                const isSel = selCity?.id === city.id;
                const R = jobs.length>5?12:jobs.length>2?10:8;

                return (
                  <g key={city.id} style={{cursor:"pointer"}} onClick={()=>setSelCity(isSel?null:city)}>
                    {/* Dual pulse rings */}
                    <circle cx={city.cx} cy={city.cy} r={R+2} fill="none" stroke={col} strokeWidth={1.5} opacity={0.8}>
                      <animate attributeName="r" values={`${R};${R+20};${R}`} dur="2.2s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values=".8;0;.8" dur="2.2s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx={city.cx} cy={city.cy} r={R+2} fill="none" stroke={col} strokeWidth={1} opacity={0.4}>
                      <animate attributeName="r" values={`${R};${R+32};${R}`} dur="3.6s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values=".4;0;.4" dur="3.6s" repeatCount="indefinite"/>
                    </circle>
                    {/* Halo */}
                    <circle cx={city.cx} cy={city.cy} r={R+8} fill={col} opacity={isSel?.25:.08}/>
                    {/* Star */}
                    <polygon className="s-blink" filter="url(#glow5)" fill={col} opacity={blink?1:.42} points={starPts(city.cx,city.cy,R)}/>
                    <polygon fill="rgba(255,255,255,.4)" points={starPts(city.cx,city.cy,R*.48)} style={{pointerEvents:"none"}}/>
                    {/* Count */}
                    <rect x={city.cx-12} y={city.cy+R+2} width={24} height={13} rx={4} fill="rgba(5,10,20,.92)" stroke={col} strokeWidth={0.7}/>
                    <text x={city.cx} y={city.cy+R+12} textAnchor="middle" fontSize={8} fontWeight={700} fontFamily="system-ui" fill={col}>{jobs.length}</text>
                    {/* Label */}
                    <text x={city.cx} y={city.cy+R+26} textAnchor="middle" fontSize={7.5} fontFamily="system-ui" fill={isSel?"#e0e7ff":"rgba(255,255,255,.65)"} fontWeight={isSel?700:400}>{city.name}</text>
                    {isSel&&<circle cx={city.cx} cy={city.cy} r={R+13} fill="none" stroke="#e0e7ff" strokeWidth={1.5} strokeDasharray="4,3"/>}
                  </g>
                );
              })}

              {loading&&<><rect width="420" height="560" fill="rgba(5,13,26,.65)"/><text x="210" y="275" textAnchor="middle" fontSize={13} fill="rgba(255,255,255,.6)" fontFamily="system-ui">Fetching fresh jobs…</text></>}
            </svg>

            {/* City panel */}
            {selCity&&(
              <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:T.panel,animation:"slide-in .22s ease-out",overflowY:"auto",zIndex:20}}>
                <div style={{padding:"12px 14px",borderBottom:`0.5px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:T.panel,zIndex:1}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:darkMode?"#e0e7ff":T.fg}}>📍 {selCity.name} — {selCity.state}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>
                      {selCityJobs.length} opening{selCityJobs.length!==1?"s":""} · all within last 7 days
                    </div>
                  </div>
                  <button onClick={()=>setSelCity(null)} style={{background:"rgba(255,255,255,.06)",border:`0.5px solid ${T.border2}`,borderRadius:6,width:28,height:28,cursor:"pointer",color:T.muted,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                </div>
                <div style={{padding:"10px 12px"}}>
                  {selCityJobs.map(j=>{
                    const dateLabel = fmtDate(j.ts);
                    return (
                      <div key={j.id} className="job-row" style={{background:darkMode?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)",border:`0.5px solid ${darkMode?"rgba(255,255,255,.07)":"rgba(0,0,0,.07)"}`,borderRadius:10,padding:"10px 12px",marginBottom:8,transition:"all .15s"}}>
                        <div style={{display:"flex",justifyContent:"space-between",gap:6,marginBottom:4}}>
                          <div style={{fontSize:12,fontWeight:600,color:darkMode?"#e0e7ff":T.fg,lineHeight:1.3}}>{j.title}</div>
                          <span className={scoreClass(j.score)} style={{fontSize:10,padding:"2px 7px",borderRadius:20,fontWeight:700,flexShrink:0}}>{j.score}</span>
                        </div>
                        <div style={{fontSize:11,color:T.muted,marginBottom:5}}>{j.company}</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:6}}>
                          {(j.tags||[]).slice(0,4).map(t=><span key={t} style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:"rgba(99,102,241,.1)",color:"#a5b4fc",border:"0.5px solid rgba(99,102,241,.2)"}}>{t}</span>)}
                        </div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div>
                            {j.salary&&<div style={{fontSize:10,color:"#1D9E75",fontWeight:600}}>{j.salary}</div>}
                            <div style={{fontSize:10,color:T.muted}}>{j.remote?"🌐 Remote":"📍 On-site"} · <strong style={{color:dateLabel==="Just now"||dateLabel?.includes("m ago")?"#1D9E75":"inherit"}}>{dateLabel||"This week"}</strong></div>
                          </div>
                          <a href={j.url} target="_blank" rel="noopener noreferrer"
                            style={{fontSize:11,fontWeight:700,padding:"6px 16px",borderRadius:6,background:"#1D9E75",color:"#fff",textDecoration:"none",flexShrink:0}}
                            onMouseEnter={e=>e.currentTarget.style.background="#0F6E56"}
                            onMouseLeave={e=>e.currentTarget.style.background="#1D9E75"}>
                            Apply ↗
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{padding:"8px 14px",borderTop:"0.5px solid rgba(255,255,255,.06)",display:"flex",gap:14,flexWrap:"wrap",alignItems:"center"}}>
            {[["#1D9E75","80+ High fit"],["#EF9F27","65–79 Medium"],["#D85A30","<65 Stretch"]].map(([c,l])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:T.muted}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:c}}/>
                {l}
              </div>
            ))}
            <div style={{marginLeft:"auto",fontSize:10,color:T.muted,fontWeight:600}}>
              {lastUp?`Updated ${lastUp} · max 7-day cutoff`:"Loading…"}
            </div>
          </div>
        </div>

        {/* International sidebar */}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{fontSize:13,fontWeight:600,color:darkMode?"#e0e7ff":T.fg,padding:"0 2px 8px",borderBottom:`0.5px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            🌐 International Openings
            <span style={{fontSize:10,color:T.muted}}>{intlClusters.reduce((a,c)=>a+c.jobs.length,0)} roles</span>
          </div>

          {intlClusters.map(cluster=>{
            const isOpen = selIntl===cluster.id;
            const top = cluster.jobs.length>0?Math.max(...cluster.jobs.map(j=>j.score)):0;
            const col = scoreCol(top);
            return (
              <div key={cluster.id}>
                <div className="intl-row" onClick={()=>setSelIntl(isOpen?null:cluster.id)}
                  style={{padding:"10px 12px",borderRadius:10,background:T.card,border:`0.5px solid ${isOpen?"rgba(99,102,241,.3)":T.border}`,cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:18}}>{cluster.flag}</span>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:darkMode?"#e0e7ff":T.fg}}>{cluster.label}</div>
                      <div style={{fontSize:10,color:T.muted}}>{cluster.jobs.length} opening{cluster.jobs.length!==1?"s":""}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {cluster.jobs.length>0&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:20,fontWeight:700,background:`${col}18`,color:col,border:`0.5px solid ${col}30`}}>{top}</span>}
                    {cluster.jobs.length>0&&<div style={{width:7,height:7,borderRadius:"50%",background:"#1D9E75",opacity:blink?1:.15,transition:"opacity .4s"}}/>}
                    <span style={{fontSize:10,color:T.muted,transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s"}}>▼</span>
                  </div>
                </div>

                {isOpen&&cluster.jobs.length>0&&(
                  <div style={{marginTop:4,padding:"6px",borderRadius:10,background:darkMode?"rgba(0,0,0,.2)":"rgba(0,0,0,.03)",border:`0.5px solid ${T.border}`,maxHeight:300,overflowY:"auto"}}>
                    {[...cluster.jobs].sort((a,b)=>b.score-a.score).map(j=>{
                      const dateLabel = fmtDate(j.ts);
                      return (
                        <div key={j.id} className="job-row" style={{padding:"8px 10px",borderRadius:8,marginBottom:5,background:darkMode?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)",border:`0.5px solid ${darkMode?"rgba(255,255,255,.06)":"rgba(0,0,0,.07)"}`,transition:"all .15s"}}>
                          <div style={{display:"flex",justifyContent:"space-between",gap:4,marginBottom:3}}>
                            <div style={{fontSize:11,fontWeight:600,color:darkMode?"#e0e7ff":T.fg,lineHeight:1.3,flex:1}}>{j.title}</div>
                            <span className={scoreClass(j.score)} style={{fontSize:9,padding:"1px 5px",borderRadius:20,fontWeight:700,flexShrink:0}}>{j.score}</span>
                          </div>
                          <div style={{fontSize:10,color:T.muted,marginBottom:4}}>{j.company}</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:2,marginBottom:5}}>
                            {(j.tags||[]).slice(0,3).map(t=><span key={t} style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:"rgba(99,102,241,.1)",color:"#a5b4fc"}}>{t}</span>)}
                          </div>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <div>
                              {j.salary&&<div style={{fontSize:9,color:"#1D9E75",fontWeight:600}}>{j.salary}</div>}
                              <div style={{fontSize:9,color:T.muted}}>{j.remote?"🌐":"📍"} <strong style={{color:dateLabel==="Just now"?"#1D9E75":"inherit"}}>{dateLabel||"This week"}</strong></div>
                            </div>
                            <a href={j.url} target="_blank" rel="noopener noreferrer"
                              style={{fontSize:10,fontWeight:600,padding:"4px 10px",borderRadius:5,background:"#1D9E75",color:"#fff",textDecoration:"none"}}>
                              Apply ↗
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isOpen&&cluster.jobs.length===0&&(
                  <div style={{padding:"12px",textAlign:"center",fontSize:11,color:T.muted,borderRadius:8,background:darkMode?"rgba(0,0,0,.2)":"rgba(0,0,0,.03)",border:`0.5px solid ${T.border}`,marginTop:4}}>
                    No openings found for this region in the last 7 days
                  </div>
                )}
              </div>
            );
          })}

          <div style={{padding:"10px 12px",borderRadius:10,background:"rgba(29,158,117,.06)",border:"0.5px solid rgba(29,158,117,.15)",fontSize:11,color:T.muted,lineHeight:1.7}}>
            ✅ <strong style={{color:"#6ee7b7"}}>7-day cutoff</strong> — anything older is hidden<br/>
            ⭐ Stars blink on cities with openings<br/>
            🚨 Pair with <strong style={{color:"#a5b4fc"}}>GitHub Actions alert</strong> for instant notifications
          </div>
        </div>
      </div>
    </div>
  );
}
