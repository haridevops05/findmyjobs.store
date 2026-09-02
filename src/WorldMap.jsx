import { useEffect, useRef, useState, useCallback } from "react";

const PROXIES = [
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://proxy.corsfix.com/?${url}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://api.codetabs.com/v1/proxy/?quest=${url}`,
];

async function fetchWithProxy(url, timeout = 8000) {
  for (const proxy of PROXIES) {
    try {
      const res = await fetch(proxy(url), { signal: AbortSignal.timeout(timeout), headers: { "Accept": "application/json" } });
      if (!res.ok) continue;
      return await res.json();
    } catch { continue; }
  }
  return null;
}

const SOURCES = [
  { url: "https://remotive.com/api/remote-jobs?category=devops-sysadmin&limit=30", parser: "remotive" },
  { url: "https://remoteok.com/api?tag=devops", parser: "remoteok" },
  { url: "https://remoteok.com/api?tag=kubernetes", parser: "remoteok" },
  { url: "https://remoteok.com/api?tag=aws", parser: "remoteok" },
  { url: "https://www.arbeitnow.com/api/job-board-api?search=devops+kubernetes", parser: "arbeitnow" },
];

const DEVOPS_KW = ["devops","platform engineer","sre","cloud engineer","kubernetes","eks","aws","terraform","gitops","devsecops","mlops","cloud architect","infrastructure","openshift","site reliability"];
const EXCLUDE = ["intern","junior","fresher","0-2 year","1 year","sales","marketing","recruiter"];

function isRelevant(title = "", desc = "") {
  const t = (title + " " + desc.slice(0, 150)).toLowerCase();
  if (!DEVOPS_KW.some(k => t.includes(k))) return false;
  if (EXCLUDE.some(k => t.includes(k))) return false;
  return true;
}

const MY_SKILLS = ["kubernetes","eks","terraform","argocd","aws","istio","falco","kyverno","mlops","gitops","devsecops","helm","prometheus","grafana","python","sre","gitlab","docker","ansible","openshift","datadog","hipaa","soc2","platform","devops"];

function scoreJob(title = "", desc = "", tags = []) {
  const t = (title + " " + desc.slice(0, 400) + " " + tags.join(" ")).toLowerCase();
  let s = Math.min(35 + MY_SKILLS.filter(k => t.includes(k)).length * 4, 95);
  if (/senior|sr\.|staff|lead|principal/i.test(t)) s = Math.min(s + 5, 95);
  if (t.includes("eks") && t.includes("terraform")) s = Math.min(s + 5, 95);
  if (t.includes("argocd") || t.includes("gitops")) s = Math.min(s + 3, 95);
  if (t.includes("hipaa") || t.includes("soc2")) s = Math.min(s + 5, 95);
  return s;
}

function parseJobs(parser, data) {
  if (!data) return [];
  if (parser === "remotive") return (data.jobs || []).filter(j => isRelevant(j.title, j.description || "")).map(j => ({ id: "rv_" + j.id, title: j.title, company: j.company_name, url: j.url, salary: j.salary || "", tags: [j.category, ...(j.tags || [])].filter(Boolean).slice(0, 4), desc: (j.description || "").replace(/<[^>]+>/g, "").slice(0, 300), posted: j.publication_date || new Date().toISOString(), remote: true }));
  if (parser === "remoteok") return (Array.isArray(data) ? data : []).filter(j => j.position && isRelevant(j.position, j.description || "")).slice(0, 15).map(j => ({ id: "ro_" + j.id, title: j.position, company: j.company || "Company", url: j.url || "https://remoteok.com", salary: j.salary_min ? `$${Math.round(j.salary_min / 1000)}k–$${Math.round(j.salary_max / 1000)}k` : "", tags: (j.tags || []).slice(0, 4), desc: (j.description || "").replace(/<[^>]+>/g, "").slice(0, 300), posted: j.date ? new Date(j.date * 1000).toISOString() : new Date().toISOString(), remote: true }));
  if (parser === "arbeitnow") return (data.data || []).filter(j => isRelevant(j.title, j.description || "")).map(j => ({ id: "ab_" + j.slug, title: j.title, company: j.company_name, url: j.url, salary: "", tags: (j.tags || []).slice(0, 4), desc: (j.description || "").replace(/<[^>]+>/g, "").slice(0, 300), posted: j.created_at ? new Date(j.created_at * 1000).toISOString() : new Date().toISOString(), remote: true }));
  return [];
}

function fmtDate(iso) {
  if (!iso) return "Today";
  try {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 5) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    if (diff < 2880) return "Yesterday";
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch { return "Today"; }
}

function isNew(iso) { try { return (Date.now() - new Date(iso).getTime()) < 86400000; } catch { return true; } }
function scoreCol(s) { return s >= 80 ? "#1D9E75" : s >= 65 ? "#EF9F27" : "#D85A30"; }
function scoreClass(s) { return s >= 80 ? "sc-h" : s >= 65 ? "sc-m" : "sc-s"; }

const INDIA_CITIES = [
  { id: "hyd",  name: "Hyderabad",  cx: 225, cy: 340, state: "Telangana"   },
  { id: "blr",  name: "Bengaluru",  cx: 205, cy: 385, state: "Karnataka"   },
  { id: "mum",  name: "Mumbai",     cx: 148, cy: 315, state: "Maharashtra" },
  { id: "del",  name: "Delhi NCR",  cx: 200, cy: 170, state: "Delhi"       },
  { id: "pun",  name: "Pune",       cx: 158, cy: 328, state: "Maharashtra" },
  { id: "che",  name: "Chennai",    cx: 232, cy: 395, state: "Tamil Nadu"  },
  { id: "kol",  name: "Kolkata",    cx: 318, cy: 248, state: "West Bengal" },
  { id: "ahm",  name: "Ahmedabad",  cx: 132, cy: 238, state: "Gujarat"    },
];

const INDIA_SEED_JOBS = {
  hyd: [
    { id:"ih1", title:"Sr. DevOps + MLOps Engineer",  company:"Luxoft",        score:93, salary:"₹28–45 LPA", tags:["EKS","MLOps","HIPAA","ArgoCD"],  url:"https://career.luxoft.com",              remote:false, posted:new Date().toISOString() },
    { id:"ih2", title:"Sr. SRE – Healthcare",          company:"Optum/UHG GCC", score:89, salary:"₹22–40 LPA", tags:["AWS","HIPAA","Terraform","SRE"], url:"https://careers.unitedhealthgroup.com",  remote:false, posted:new Date().toISOString() },
    { id:"ih3", title:"Sr. DevOps – AWS Platform",     company:"FIS Global",    score:91, salary:"₹25–45 LPA", tags:["EKS","Terraform","SRE"],         url:"https://careers.fisglobal.com",          remote:false, posted:new Date().toISOString() },
    { id:"ih4", title:"Sr. DevOps – MLOps/AWS",        company:"Sanofi GCC",    score:90, salary:"₹24–42 LPA", tags:["AWS","MLOps","Healthcare"],       url:"https://jobs.sanofi.com",                remote:false, posted:new Date().toISOString() },
    { id:"ih5", title:"Sr. DevOps – Darwinbox",        company:"Darwinbox",     score:81, salary:"₹24–40 LPA", tags:["AWS","EKS","GitOps"],             url:"https://darwinbox.com/careers",          remote:false, posted:new Date().toISOString() },
  ],
  blr: [
    { id:"ib1", title:"Sr. Platform Engineer",          company:"Swiggy",       score:88, salary:"₹28–50 LPA", tags:["EKS","ArgoCD","Helm"],            url:"https://careers.swiggy.com",             remote:false, posted:new Date().toISOString() },
    { id:"ib2", title:"Staff SRE",                      company:"PhonePe",      score:86, salary:"₹30–55 LPA", tags:["K8s","AWS","Datadog"],            url:"https://www.phonepe.com/careers",        remote:false, posted:new Date().toISOString() },
    { id:"ib3", title:"Sr. DevOps Engineer",             company:"CRED",         score:85, salary:"₹28–48 LPA", tags:["EKS","ArgoCD","Python"],          url:"https://www.cred.club/careers",          remote:false, posted:new Date().toISOString() },
    { id:"ib4", title:"Sr. DevOps – Walmart GCC",       company:"Walmart Labs", score:83, salary:"₹30–55 LPA", tags:["AWS","K8s","IAM"],                url:"https://careers.walmart.com",            remote:false, posted:new Date().toISOString() },
    { id:"ib5", title:"Sr. SRE – Razorpay",             company:"Razorpay",     score:79, salary:"₹28–50 LPA", tags:["EKS","ArgoCD","Prometheus"],      url:"https://razorpay.com/jobs",              remote:false, posted:new Date().toISOString() },
    { id:"ib6", title:"Platform Eng – Freshworks",      company:"Freshworks",   score:82, salary:"₹26–44 LPA", tags:["K8s","AWS","Terraform"],          url:"https://www.freshworks.com/careers",     remote:false, posted:new Date().toISOString() },
    { id:"ib7", title:"Sr. DevOps – Groww",             company:"Groww",        score:79, salary:"₹26–45 LPA", tags:["K8s","ArgoCD","SLO"],             url:"https://groww.in/careers",               remote:false, posted:new Date().toISOString() },
    { id:"ib8", title:"Sr. DevOps – Zerodha",           company:"Zerodha",      score:71, salary:"₹24–40 LPA", tags:["K8s","AWS","Linux"],              url:"https://zerodha.com/careers",            remote:false, posted:new Date().toISOString() },
  ],
  mum: [
    { id:"im1", title:"Sr. Cloud DevOps Engineer",     company:"JP Morgan GCC", score:85, salary:"₹28–45 LPA", tags:["AWS","K8s","Terraform"],          url:"https://careers.jpmorgan.com",           remote:false, posted:new Date().toISOString() },
    { id:"im2", title:"DevOps Lead – Reliance",        company:"Reliance Jio",  score:80, salary:"₹25–40 LPA", tags:["K8s","CI/CD","GCP"],              url:"https://www.jio.com/en-in/careers",      remote:false, posted:new Date().toISOString() },
    { id:"im3", title:"Sr. Platform Engineer",         company:"Dream11",       score:82, salary:"₹28–48 LPA", tags:["AWS","EKS","Terraform"],          url:"https://dream11.in/careers",             remote:false, posted:new Date().toISOString() },
  ],
  del: [
    { id:"id1", title:"Sr. DevOps Engineer",            company:"Nagarro",      score:78, salary:"₹20–35 LPA", tags:["AWS","Terraform","DevOps"],       url:"https://www.nagarro.com/en/careers",     remote:false, posted:new Date().toISOString() },
    { id:"id2", title:"Cloud Platform Engineer",        company:"HCL Tech",     score:76, salary:"₹18–32 LPA", tags:["Azure","K8s","DevOps"],           url:"https://www.hcltech.com/careers",        remote:false, posted:new Date().toISOString() },
    { id:"id3", title:"Sr. DevOps – Paytm",            company:"Paytm",        score:81, salary:"₹22–38 LPA", tags:["AWS","K8s","CI/CD"],              url:"https://paytm.com/careers",              remote:false, posted:new Date().toISOString() },
  ],
  pun: [
    { id:"ip1", title:"Sr. DevOps Engineer",            company:"Persistent",   score:77, salary:"₹18–32 LPA", tags:["AWS","Docker","K8s"],             url:"https://www.persistent.com/careers",     remote:false, posted:new Date().toISOString() },
    { id:"ip2", title:"Platform Engineer – Infosys",   company:"Infosys BPM",  score:74, salary:"₹16–28 LPA", tags:["AWS","Terraform","K8s"],          url:"https://www.infosys.com/careers",        remote:false, posted:new Date().toISOString() },
  ],
  che: [
    { id:"ic1", title:"Sr. DevOps / Platform Eng",     company:"Zoho",         score:79, salary:"₹20–36 LPA", tags:["K8s","GCP","DevOps"],             url:"https://careers.zohocorp.com",           remote:false, posted:new Date().toISOString() },
    { id:"ic2", title:"Cloud Infrastructure Eng",      company:"Freshworks",   score:80, salary:"₹22–38 LPA", tags:["AWS","Terraform","SRE"],          url:"https://www.freshworks.com/careers",     remote:false, posted:new Date().toISOString() },
  ],
  kol: [
    { id:"ik1", title:"DevOps Engineer",               company:"TCS GCC",      score:72, salary:"₹14–24 LPA", tags:["AWS","Docker","CI/CD"],           url:"https://careers.tcs.com",                remote:false, posted:new Date().toISOString() },
  ],
  ahm: [
    { id:"ia1", title:"Sr. DevOps Engineer",           company:"Infibeam",     score:71, salary:"₹15–26 LPA", tags:["AWS","K8s","DevOps"],             url:"https://www.infibeam.com/careers",       remote:false, posted:new Date().toISOString() },
  ],
};

const INTL_CLUSTERS = [
  {
    id: "remote-in", flag: "🇮🇳", label: "Remote India",
    jobs: [
      { id:"ri1", title:"Sr. DevOps – AWS Remote",    company:"Smart Working", score:91, salary:"₹22–38 LPA", tags:["AWS","EKS","GitLab CI"],      url:"https://remoterocketship.com",     remote:true, posted:new Date().toISOString() },
      { id:"ri2", title:"Sr. DevSecOps – Compliance", company:"AI SaaS",      score:92, salary:"₹22–40 LPA", tags:["DevSecOps","SOC2","Falco"],    url:"https://wellfound.com/role/l/aws-devops/india", remote:true, posted:new Date().toISOString() },
      { id:"ri3", title:"Sr. DevOps – TrueFoundry",   company:"TrueFoundry",  score:90, salary:"₹22–38 LPA", tags:["K8s","Terraform","MLOps"],     url:"https://wellfound.com/jobs/3542674-senior-sre-devops-engineer", remote:true, posted:new Date().toISOString() },
      { id:"ri4", title:"Sr. Platform – Velotio",     company:"Velotio",      score:87, salary:"₹20–35 LPA", tags:["K8s","AWS","CI/CD"],           url:"https://remoterocketship.com/company/velotio-technologies", remote:true, posted:new Date().toISOString() },
      { id:"ri5", title:"Sr. DevOps – ZoomInfo",      company:"ZoomInfo",     score:85, salary:"₹28–45 LPA", tags:["Terraform","Istio","Datadog"], url:"https://www.zoominfo.com/careers", remote:true, posted:new Date().toISOString() },
    ]
  },
  {
    id: "us", flag: "🇺🇸", label: "United States", jobs: []
  },
  {
    id: "uk", flag: "🇬🇧", label: "United Kingdom", jobs: []
  },
  {
    id: "eu", flag: "🇪🇺", label: "Europe",
    jobs: [
      { id:"eu1", title:"Cloud Infra Engineer",       company:"Albert (EU)",    score:72, salary:"€55k–80k/yr", tags:["K8s","Terraform","GitOps"], url:"https://cutshort.io/jobs",   remote:true, posted:new Date().toISOString() },
      { id:"eu2", title:"Sr. DevOps – Berlin",        company:"AI Startup DE",  score:71, salary:"€65k–90k/yr", tags:["AWS","Terraform","K8s"],     url:"https://remoteok.com",       remote:true, posted:new Date().toISOString() },
    ]
  },
  {
    id: "sg", flag: "🇸🇬", label: "Singapore",
    jobs: [
      { id:"sg1", title:"Sr. DevOps / Platform",      company:"Regional Fintech", score:72, salary:"SGD 8k–14k/mo", tags:["AWS","EKS","Terraform"], url:"https://wellfound.com", remote:false, posted:new Date().toISOString() },
    ]
  },
  {
    id: "uae", flag: "🇦🇪", label: "UAE / Dubai",
    jobs: [
      { id:"ae1", title:"Sr. Cloud DevOps",           company:"Fintech UAE",    score:73, salary:"AED 18k–30k/mo", tags:["AWS","K8s","DevSecOps"],  url:"https://wellfound.com", remote:false, posted:new Date().toISOString() },
    ]
  },
  {
    id: "ca", flag: "🇨🇦", label: "Canada", jobs: []
  },
  {
    id: "au", flag: "🇦🇺", label: "Australia", jobs: []
  },
];

// India SVG path - accurate simplified outline
const INDIA_PATH = `M195,55 L208,50 L224,49 L242,53 L258,60 L272,70 L284,75 L296,74 L308,80 L318,90 L325,102 L328,116 L326,130 L320,144 L315,158 L318,172 L324,184 L322,198 L316,210 L308,222 L300,234 L292,246 L285,260 L280,274 L275,288 L270,300 L262,312 L254,326 L245,338 L235,352 L226,366 L220,380 L217,394 L220,408 L228,420 L236,432 L242,444 L246,458 L242,470 L236,482 L228,492 L218,500 L210,492 L204,480 L198,468 L193,456 L188,442 L183,428 L178,414 L173,400 L168,386 L163,372 L157,358 L150,346 L142,334 L133,322 L123,310 L113,298 L103,286 L95,272 L88,258 L83,244 L80,230 L78,216 L76,202 L75,188 L74,174 L73,160 L73,146 L74,132 L77,118 L83,106 L92,96 L103,88 L115,82 L128,76 L142,70 L156,64 L170,59 L183,56 L195,55 Z M326,130 L338,126 L350,122 L362,126 L370,136 L370,150 L362,160 L350,164 L338,162 L328,154 L322,142 L326,130 Z M73,160 L64,164 L57,174 L57,186 L63,194 L73,197 L82,192 L86,182 L84,170 L76,163 L73,160 Z M258,60 L272,54 L286,52 L298,57 L304,68 L300,80 L288,84 L275,80 L264,72 L258,62 L258,60 Z M246,458 L236,464 L228,475 L228,488 L234,498 L244,502 L254,497 L260,486 L258,474 L250,463 L246,458 Z`;

function starPoints(cx, cy, R, r) {
  return [0,1,2,3,4,5,6,7,8,9].map(i => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    return `${cx + Math.cos(a) * rad},${cy + Math.sin(a) * rad}`;
  }).join(" ");
}

export default function WorldMap({ darkMode }) {
  const [indiaJobs,     setIndiaJobs]     = useState(() => Object.fromEntries(Object.entries(INDIA_SEED_JOBS).map(([k,v]) => [k,[...v]])));
  const [intlClusters,  setIntlClusters]  = useState(INTL_CLUSTERS);
  const [selectedCity,  setSelectedCity]  = useState(null);
  const [selectedIntl,  setSelectedIntl]  = useState(null);
  const [status,        setStatus]        = useState({ text:"Loading…", ok:false, error:false });
  const [loading,       setLoading]       = useState(true);
  const [lastUpdated,   setLastUpdated]   = useState("");
  const [blink,         setBlink]         = useState(true);

  const T = {
    bg:     darkMode?"#0a0f1e":"#f0f4f8", card:  darkMode?"rgba(255,255,255,.04)":"rgba(255,255,255,.9)",
    border: darkMode?"rgba(255,255,255,.08)":"#e2e8f0", fg: darkMode?"#e2e8f0":"#1a202c",
    muted:  darkMode?"#6b7280":"#64748b", input: darkMode?"rgba(255,255,255,.05)":"#f7fafc",
    panel:  darkMode?"rgba(8,14,28,.98)":"rgba(255,255,255,.98)", border2: darkMode?"rgba(255,255,255,.12)":"rgba(0,0,0,.12)",
    ocean:  darkMode?"#060e1f":"#0d2044", land:  darkMode?"#1c3a5e":"#2a5e8f",
  };

  useEffect(() => { const t = setInterval(() => setBlink(b => !b), 800); return () => clearInterval(t); }, []);

  const fetchLive = useCallback(async () => {
    setLoading(true);
    setStatus({ text:"Fetching live jobs…", ok:false, error:false });
    try {
      const cached = localStorage.getItem("wm4_cache");
      const ts     = parseInt(localStorage.getItem("wm4_ts")||"0");
      if (cached && Date.now()-ts < 20*60*1000) {
        const { intl } = JSON.parse(cached);
        setIntlClusters(intl);
        setStatus({ text:`Cached · ${Math.round((Date.now()-ts)/60000)}m ago`, ok:true, error:false });
        setLastUpdated(new Date(ts).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}));
        setLoading(false);
        return;
      }
    } catch {}

    let allLive = []; let success = 0;
    for (const src of SOURCES) {
      try {
        const data = await fetchWithProxy(src.url);
        const jobs = parseJobs(src.parser, data);
        allLive.push(...jobs);
        if (jobs.length>0) success++;
      } catch {}
      await new Promise(r => setTimeout(r, 300));
    }

    const seen = new Set();
    allLive = allLive.map(j=>({...j, score:scoreJob(j.title,j.desc||"",j.tags||[])}))
                     .filter(j=>{if(seen.has(j.url))return false;seen.add(j.url);return true;});

    const newIntl = INTL_CLUSTERS.map(c=>({...c,jobs:[...c.jobs]}));
    const seenIds = new Set(newIntl.flatMap(c=>c.jobs.map(j=>j.id)));

    allLive.forEach(j => {
      if (seenIds.has(j.id)) return;
      seenIds.add(j.id);
      const loc = (j.desc||"").toLowerCase();
      let target = "us";
      if (/uk|united kingdom|london/i.test(loc)) target="uk";
      else if (/europe|germany|berlin|amsterdam|france|spain/i.test(loc)) target="eu";
      else if (/singapore|apac/i.test(loc)) target="sg";
      else if (/australia|sydney|melbourne/i.test(loc)) target="au";
      else if (/canada|toronto/i.test(loc)) target="ca";
      const cluster = newIntl.find(c=>c.id===target);
      if (cluster) cluster.jobs.push(j);
    });

    // Add remote jobs to remote-in
    const remoteIn = allLive.filter(j=>j.remote).slice(0,8);
    const riCluster = newIntl.find(c=>c.id==="remote-in");
    if (riCluster) {
      const existing = new Set(riCluster.jobs.map(j=>j.id));
      remoteIn.forEach(j=>{ if(!existing.has(j.id)) riCluster.jobs.push(j); });
    }

    setIntlClusters(newIntl);
    const now = new Date();
    setLastUpdated(now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}));
    setStatus({ text:success>0?`Live · ${allLive.length} fresh roles`:"Seed data · network unavailable", ok:success>0, error:success===0 });
    try { localStorage.setItem("wm4_cache",JSON.stringify({intl:newIntl})); localStorage.setItem("wm4_ts",Date.now().toString()); } catch {}
    setLoading(false);
  }, []);

  useEffect(()=>{fetchLive();},[]);
  useEffect(()=>{
    let last=Date.now();
    const check=()=>{if(Date.now()-last>20*60*1000){last=Date.now();fetchLive();}};
    const vis=()=>{if(document.visibilityState==="visible")check();};
    window.addEventListener("focus",check);
    document.addEventListener("visibilitychange",vis);
    return()=>{window.removeEventListener("focus",check);document.removeEventListener("visibilitychange",vis);};
  },[fetchLive]);

  const allIndiaJobs = Object.values(indiaJobs).flat();
  const allIntlJobs  = intlClusters.flatMap(c=>c.jobs);
  const totalJobs    = allIndiaJobs.length + allIntlJobs.length;
  const highFit      = [...allIndiaJobs,...allIntlJobs].filter(j=>j.score>=80).length;
  const todayJobs    = [...allIndiaJobs,...allIntlJobs].filter(j=>isNew(j.posted)).length;
  const selectedCityJobs = selectedCity ? (indiaJobs[selectedCity.id]||[]).sort((a,b)=>b.score-a.score) : [];

  const css = `
    @keyframes star-blink{0%,100%{filter:drop-shadow(0 0 8px #1D9E75);opacity:1}50%{filter:drop-shadow(0 0 2px #1D9E75);opacity:.45}}
    @keyframes ring-pulse{0%{r:8px;opacity:.8}100%{r:24px;opacity:0}}
    @keyframes slide-in{from{transform:translateX(100%)}to{transform:translateX(0)}}
    @keyframes wm-spin{to{transform:rotate(360deg)}}
    @keyframes wm-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .s-blink{animation:star-blink 1.6s ease-in-out infinite;cursor:pointer;}
    .intl-row:hover{background:rgba(99,102,241,.08)!important;}
    .job-row:hover{border-color:rgba(29,158,117,.3)!important;background:rgba(29,158,117,.03)!important;}
    .sc-h{background:rgba(29,158,117,.15);color:#1D9E75;border:.5px solid rgba(29,158,117,.3);}
    .sc-m{background:rgba(239,159,39,.15);color:#EF9F27;border:.5px solid rgba(239,159,39,.3);}
    .sc-s{background:rgba(216,90,48,.15);color:#D85A30;border:.5px solid rgba(216,90,48,.3);}
  `;

  return (
    <div style={{fontFamily:"'Instrument Sans',system-ui,sans-serif",animation:"wm-in .3s"}}>
      <style>{css}</style>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:12}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:0}}>🌍 Live Global Job Map</h2>
          <p style={{fontSize:12,color:T.muted,margin:"4px 0 0"}}>India map with city-level blinking stars · International sidebar · Click any star to apply</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 12px",borderRadius:20,background:status.error?"rgba(216,90,48,.1)":status.ok?"rgba(29,158,117,.1)":"rgba(99,102,241,.08)",border:`0.5px solid ${status.error?"rgba(216,90,48,.3)":status.ok?"rgba(29,158,117,.3)":"rgba(99,102,241,.2)"}`,fontSize:11,color:status.error?"#D85A30":status.ok?"#1D9E75":"#a5b4fc"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:status.error?"#D85A30":status.ok?"#1D9E75":"#6366f1",animation:loading?"wm-spin 1s linear infinite":"none"}}/>
            {status.text}
          </div>
          <button onClick={()=>{try{localStorage.removeItem("wm4_cache")}catch{}fetchLive();}} style={{padding:"5px 12px",borderRadius:8,border:`0.5px solid ${T.border2}`,background:T.input,color:T.muted,fontSize:11,cursor:"pointer"}}>🔄 Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
        {[{l:"Total roles",v:totalJobs,c:"#6366f1"},{l:"High fit 80+",v:highFit,c:"#1D9E75"},{l:"Posted today",v:todayJobs,c:"#EF9F27"},{l:"India cities",v:INDIA_CITIES.filter(c=>indiaJobs[c.id]?.length>0).length,c:"#a78bfa"}].map(s=>(
          <div key={s.l} style={{padding:"10px 12px",borderRadius:10,background:T.card,border:`0.5px solid ${T.border}`,textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontSize:10,color:T.muted,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 285px",gap:12,alignItems:"start"}}>

        {/* India Map */}
        <div style={{borderRadius:14,overflow:"hidden",border:`0.5px solid ${T.border}`,background:`linear-gradient(135deg,${T.ocean} 0%,${darkMode?"#0a1628":"#122040"} 100%)`,boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}>
          <div style={{padding:"10px 14px",borderBottom:"0.5px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#e0e7ff"}}>🇮🇳 India Job Map — Click any ⭐ to apply</div>
            <div style={{fontSize:11,color:T.muted}}>{INDIA_CITIES.filter(c=>indiaJobs[c.id]?.length>0).length} cities · stars blink on openings</div>
          </div>

          <div style={{position:"relative"}}>
            <svg viewBox="0 0 420 560" style={{width:"100%",display:"block"}}>
              <defs>
                <radialGradient id="og" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor={darkMode?"#0d1e3a":"#1a3f6e"}/>
                  <stop offset="100%" stopColor={darkMode?"#050d1a":"#0e2544"}/>
                </radialGradient>
                <filter id="sg2"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <filter id="sg3"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>

              <rect width="420" height="560" fill="url(#og)"/>

              {/* Grid lines */}
              {[70,140,210,280,350].map(x=><line key={x} x1={x} y1={0} x2={x} y2={560} stroke="rgba(255,255,255,.02)" strokeWidth={0.5}/>)}
              {[80,160,240,320,400,480].map(y=><line key={y} x1={0} y1={y} x2={420} y2={y} stroke="rgba(255,255,255,.02)" strokeWidth={0.5}/>)}

              {/* Ocean label */}
              <text x={60} y={480} fontSize={10} fill="rgba(255,255,255,.15)" fontFamily="system-ui" fontStyle="italic">Arabian Sea</text>
              <text x={290} y={500} fontSize={10} fill="rgba(255,255,255,.15)" fontFamily="system-ui" fontStyle="italic">Bay of Bengal</text>
              <text x={150} y={540} fontSize={10} fill="rgba(255,255,255,.15)" fontFamily="system-ui" fontStyle="italic">Indian Ocean</text>

              {/* India shape */}
              <path d={INDIA_PATH} fill={darkMode?"#1c3a5e":"#2a5e8f"} stroke="rgba(255,255,255,.2)" strokeWidth={1.2}/>

              {/* Subtle inner texture */}
              <path d={INDIA_PATH} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={8} strokeDasharray="4,8"/>

              {/* City markers */}
              {INDIA_CITIES.map(city => {
                const jobs = indiaJobs[city.id] || [];
                if (jobs.length === 0) return null;
                const top = Math.max(...jobs.map(j=>j.score));
                const col = scoreCol(top);
                const isSel = selectedCity?.id === city.id;
                const R = jobs.length > 5 ? 12 : jobs.length > 2 ? 10 : 8;

                return (
                  <g key={city.id} style={{cursor:"pointer"}} onClick={()=>setSelectedCity(isSel?null:city)}>
                    {/* Animated pulse ring */}
                    <circle cx={city.cx} cy={city.cy} r={R+2} fill="none" stroke={col} strokeWidth={1.5} opacity={0.7}>
                      <animate attributeName="r" values={`${R};${R+20};${R}`} dur="2.2s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values=".7;0;.7" dur="2.2s" repeatCount="indefinite"/>
                    </circle>
                    {/* Second slower ring */}
                    <circle cx={city.cx} cy={city.cy} r={R+2} fill="none" stroke={col} strokeWidth={1} opacity={0.4}>
                      <animate attributeName="r" values={`${R};${R+30};${R}`} dur="3.5s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values=".4;0;.4" dur="3.5s" repeatCount="indefinite"/>
                    </circle>
                    {/* Halo */}
                    <circle cx={city.cx} cy={city.cy} r={R+8} fill={col} opacity={isSel?0.25:0.08}/>
                    {/* Star */}
                    <polygon
                      className="s-blink"
                      filter="url(#sg2)"
                      fill={col}
                      opacity={blink?1:0.45}
                      points={starPoints(city.cx,city.cy,R,R*0.4)}
                    />
                    {/* Inner highlight */}
                    <polygon fill="rgba(255,255,255,.4)" points={starPoints(city.cx,city.cy,R*0.48,R*0.18)} style={{pointerEvents:"none"}}/>
                    {/* Count */}
                    <rect x={city.cx-12} y={city.cy+R+2} width={24} height={13} rx={4} fill="rgba(5,10,20,.92)" stroke={col} strokeWidth={0.7}/>
                    <text x={city.cx} y={city.cy+R+12} textAnchor="middle" fontSize={8} fontWeight={700} fontFamily="system-ui" fill={col}>{jobs.length}</text>
                    {/* City label */}
                    <text x={city.cx} y={city.cy+R+26} textAnchor="middle" fontSize={7.5} fontFamily="system-ui" fill={isSel?"#e0e7ff":"rgba(255,255,255,.65)"} fontWeight={isSel?700:400}>{city.name}</text>
                    {isSel && <circle cx={city.cx} cy={city.cy} r={R+12} fill="none" stroke="#e0e7ff" strokeWidth={1.5} strokeDasharray="4,3"/>}
                  </g>
                );
              })}

              {loading && <><rect width="420" height="560" fill="rgba(5,13,26,.6)"/><text x="210" y="275" textAnchor="middle" fontSize={13} fill="rgba(255,255,255,.5)" fontFamily="system-ui">Fetching live jobs…</text></>}
            </svg>

            {/* City detail overlay */}
            {selectedCity && (
              <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:T.panel,animation:"slide-in .22s ease-out",overflowY:"auto",zIndex:20}}>
                <div style={{padding:"12px 14px",borderBottom:`0.5px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:T.panel,zIndex:1}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:darkMode?"#e0e7ff":T.fg}}>📍 {selectedCity.name} — {selectedCity.state}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>{selectedCityJobs.length} opening{selectedCityJobs.length!==1?"s":""} · all posted today</div>
                  </div>
                  <button onClick={()=>setSelectedCity(null)} style={{background:"rgba(255,255,255,.06)",border:`0.5px solid ${T.border2}`,borderRadius:6,width:28,height:28,cursor:"pointer",color:T.muted,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                </div>
                <div style={{padding:"10px 12px"}}>
                  {selectedCityJobs.map(j=>(
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
                          <div style={{fontSize:10,color:T.muted}}>{j.remote?"🌐 Remote":"📍 On-site"} · {fmtDate(j.posted)}</div>
                        </div>
                        <a href={j.url} target="_blank" rel="noopener noreferrer" style={{fontSize:11,fontWeight:700,padding:"6px 16px",borderRadius:6,background:"#1D9E75",color:"#fff",textDecoration:"none",flexShrink:0,transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background="#0F6E56"} onMouseLeave={e=>e.currentTarget.style.background="#1D9E75"}>Apply ↗</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{padding:"8px 14px",borderTop:"0.5px solid rgba(255,255,255,.06)",display:"flex",gap:14,flexWrap:"wrap",alignItems:"center"}}>
            {[["#1D9E75","High fit 80+"],["#EF9F27","Medium 65–79"],["#D85A30","Stretch <65"]].map(([c,l])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:T.muted}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:c}}/>
                {l}
              </div>
            ))}
            <div style={{marginLeft:"auto",fontSize:10,color:T.muted}}>{lastUpdated?`Updated ${lastUpdated}`:"Loading…"}</div>
          </div>
        </div>

        {/* International Sidebar */}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{fontSize:13,fontWeight:600,color:darkMode?"#e0e7ff":T.fg,padding:"0 2px 8px",borderBottom:`0.5px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            🌐 International Openings
            <span style={{fontSize:10,color:T.muted}}>{intlClusters.reduce((a,c)=>a+c.jobs.length,0)} roles</span>
          </div>

          {intlClusters.map(cluster=>{
            const isOpen = selectedIntl===cluster.id;
            const top = cluster.jobs.length>0?Math.max(...cluster.jobs.map(j=>j.score)):0;
            const col = scoreCol(top);
            return (
              <div key={cluster.id}>
                <div className="intl-row" onClick={()=>setSelectedIntl(isOpen?null:cluster.id)}
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
                    {cluster.jobs.length>0&&<div style={{width:7,height:7,borderRadius:"50%",background:"#1D9E75",opacity:blink?1:0.15,transition:"opacity .4s"}}/>}
                    <span style={{fontSize:10,color:T.muted,transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s"}}>▼</span>
                  </div>
                </div>

                {isOpen&&cluster.jobs.length>0&&(
                  <div style={{marginTop:4,padding:"6px",borderRadius:10,background:darkMode?"rgba(0,0,0,.2)":"rgba(0,0,0,.03)",border:`0.5px solid ${T.border}`,maxHeight:320,overflowY:"auto"}}>
                    {[...cluster.jobs].sort((a,b)=>b.score-a.score).map(j=>(
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
                            <div style={{fontSize:9,color:T.muted}}>{j.remote?"🌐":"📍"} {fmtDate(j.posted)}</div>
                          </div>
                          <a href={j.url} target="_blank" rel="noopener noreferrer" style={{fontSize:10,fontWeight:600,padding:"4px 10px",borderRadius:5,background:"#1D9E75",color:"#fff",textDecoration:"none"}}>Apply ↗</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isOpen&&cluster.jobs.length===0&&(
                  <div style={{padding:"12px",textAlign:"center",fontSize:11,color:T.muted,borderRadius:8,background:darkMode?"rgba(0,0,0,.2)":"rgba(0,0,0,.03)",border:`0.5px solid ${T.border}`,marginTop:4}}>
                    No live openings found for this region yet
                  </div>
                )}
              </div>
            );
          })}

          <div style={{padding:"10px 12px",borderRadius:10,background:"rgba(99,102,241,.06)",border:"0.5px solid rgba(99,102,241,.15)",fontSize:11,color:T.muted,lineHeight:1.6}}>
            💡 <strong style={{color:"#a5b4fc"}}>Stars blink</strong> on cities with open roles. Click any city → see all jobs → Apply direct to company portal.
          </div>
        </div>
      </div>
    </div>
  );
}
