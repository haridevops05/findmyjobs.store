import { useEffect, useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════
   WorldMap.jsx v7 — ONLY REAL WORKING LINKS
   ✅ Live jobs from RemoteOK/Remotive/Arbeitnow — real direct URLs
   ✅ India city panel shows LinkedIn/Naukri pre-filtered search links
     (guaranteed to work, always show fresh results)
   ✅ NO fake company career page links that 404
   ✅ 7-day freshness enforced
   ✅ RemoteOK Unix ts × 1000 fixed
   ═══════════════════════════════════════════════════════════════════ */

const MAX_AGE_MS = 7 * 86400000;
const CACHE_KEY  = "wm7_cache";
const CACHE_TS   = "wm7_ts";
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
      const res = await fetch(p(url), { signal: AbortSignal.timeout(9000), headers: { Accept: "application/json" } });
      if (!res.ok) continue;
      return await res.json();
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
function fresh(ts) { return N() - ts <= MAX_AGE_MS; }
function fmtDate(ts) {
  if (!ts) return "Today";
  const d = Math.floor((N() - ts) / 60000);
  if (d < 2)    return "Just now";
  if (d < 60)   return `${d}m ago`;
  if (d < 1440) return `${Math.floor(d / 60)}h ago`;
  if (d < 2880) return "Yesterday";
  const days = Math.floor(d / 1440);
  return days <= 7 ? `${days}d ago` : null;
}

const DKW = ["devops","platform engineer","sre","site reliability","cloud engineer","infrastructure","kubernetes","eks","aws","terraform","gitops","devsecops","mlops","cloud architect","openshift","helm","argocd","k8s","ci/cd","github actions"];
const EKW = ["intern","junior","fresher","entry level","0-2 year","1 year exp","sales","marketing","recruiter","hr "];
function rel(t="",d="") { const s=(t+" "+d.slice(0,150)).toLowerCase(); return DKW.some(k=>s.includes(k))&&!EKW.some(k=>s.includes(k)); }

const SK = ["kubernetes","eks","terraform","argocd","aws","istio","falco","kyverno","mlops","gitops","devsecops","helm","prometheus","grafana","python","sre","gitlab","docker","ansible","openshift","datadog","vault","hipaa","soc2","platform","devops","infrastructure","ci/cd"];
function scoreJ(t="",d="",tags=[]) {
  const s=(t+" "+d.slice(0,400)+" "+tags.join(" ")).toLowerCase();
  let sc=Math.min(35+SK.filter(k=>s.includes(k)).length*4,95);
  if(/senior|sr\.|staff|lead|principal/i.test(s)) sc=Math.min(sc+5,95);
  if(s.includes("eks")&&s.includes("terraform")) sc=Math.min(sc+5,95);
  if(s.includes("argocd")||s.includes("gitops")) sc=Math.min(sc+3,95);
  if(s.includes("hipaa")||s.includes("soc2"))    sc=Math.min(sc+5,95);
  return sc;
}

function parseRemotive(d) {
  return (d?.jobs||[]).filter(j=>rel(j.title,j.description||"")).map(j=>{
    const ts=parseTs(j.publication_date); if(!fresh(ts)) return null;
    return {id:"rv_"+j.id,title:j.title,co:j.company_name,url:j.url,sal:j.salary||"",tags:[j.category,...(j.tags||[])].filter(Boolean).slice(0,4),desc:(j.description||"").replace(/<[^>]+>/g,"").slice(0,200),ts,remote:true,src:"Remotive"};
  }).filter(Boolean);
}
function parseROK(d) {
  return (Array.isArray(d)?d:[]).filter(j=>j.position&&rel(j.position,j.description||"")).map(j=>{
    const ts=j.date?j.date*1000:N(); if(!fresh(ts)) return null; // ← Unix sec × 1000
    return {id:"ro_"+j.id,title:j.position,co:j.company||"Company",url:j.url||"https://remoteok.com",sal:j.salary_min?`$${Math.round(j.salary_min/1000)}k–$${Math.round(j.salary_max/1000)}k`:"",tags:(j.tags||[]).slice(0,4),desc:(j.description||"").replace(/<[^>]+>/g,"").slice(0,200),ts,remote:true,src:"RemoteOK"};
  }).filter(Boolean);
}
function parseABN(d) {
  return (d?.data||[]).filter(j=>rel(j.title,j.description||"")).map(j=>{
    const ts=j.created_at?j.created_at*1000:N(); if(!fresh(ts)) return null;
    return {id:"ab_"+j.slug,title:j.title,co:j.company_name,url:j.url,sal:"",tags:(j.tags||[]).slice(0,4),desc:(j.description||"").replace(/<[^>]+>/g,"").slice(0,200),ts,remote:j.remote||true,src:"Arbeitnow"};
  }).filter(Boolean);
}

const SOURCES = [
  {url:"https://remotive.com/api/remote-jobs?category=devops-sysadmin&limit=50",parse:parseRemotive},
  {url:"https://remoteok.com/api?tag=devops",      parse:parseROK},
  {url:"https://remoteok.com/api?tag=kubernetes",  parse:parseROK},
  {url:"https://remoteok.com/api?tag=aws",         parse:parseROK},
  {url:"https://remoteok.com/api?tag=terraform",   parse:parseROK},
  {url:"https://remoteok.com/api?tag=cloud",       parse:parseROK},
  {url:"https://www.arbeitnow.com/api/job-board-api?search=devops+kubernetes",  parse:parseABN},
  {url:"https://www.arbeitnow.com/api/job-board-api?search=platform+engineer+aws",parse:parseABN},
];

// ── City-specific LinkedIn + Naukri search URLs ────────────────────
// These are guaranteed to work in any browser — pre-filtered, date sorted
const CITY_PORTALS = {
  hyd:[
    {name:"LinkedIn — Hyderabad",  url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer%20OR%20Platform%20Engineer%20OR%20SRE&location=Hyderabad%2C%20Telangana%2C%20India&f_TPR=r604800&sortBy=DD", color:"#0077B5"},
    {name:"Naukri — Hyderabad",    url:"https://www.naukri.com/devops-jobs-in-hyderabad?k=senior+devops+engineer+kubernetes+aws&l=hyderabad&jobAge=7&sort=1", color:"#FF7555"},
    {name:"Indeed — Hyderabad",    url:"https://in.indeed.com/jobs?q=senior+devops+engineer+kubernetes+aws&l=Hyderabad&fromage=7&sort=date", color:"#003A9B"},
  ],
  blr:[
    {name:"LinkedIn — Bengaluru",  url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer%20OR%20Platform%20Engineer%20OR%20SRE&location=Bengaluru%2C%20Karnataka%2C%20India&f_TPR=r604800&sortBy=DD", color:"#0077B5"},
    {name:"Naukri — Bengaluru",    url:"https://www.naukri.com/devops-jobs-in-bangalore?k=senior+devops+engineer+kubernetes+aws&l=bangalore&jobAge=7&sort=1", color:"#FF7555"},
    {name:"Indeed — Bengaluru",    url:"https://in.indeed.com/jobs?q=senior+devops+engineer+kubernetes+aws&l=Bengaluru&fromage=7&sort=date", color:"#003A9B"},
    {name:"Wellfound — India",     url:"https://wellfound.com/role/l/devops-engineer/india", color:"#6366f1"},
  ],
  mum:[
    {name:"LinkedIn — Mumbai",     url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer%20OR%20Platform%20Engineer&location=Mumbai%2C%20Maharashtra%2C%20India&f_TPR=r604800&sortBy=DD", color:"#0077B5"},
    {name:"Naukri — Mumbai",       url:"https://www.naukri.com/devops-jobs-in-mumbai?k=senior+devops+engineer+kubernetes&l=mumbai&jobAge=7&sort=1", color:"#FF7555"},
  ],
  del:[
    {name:"LinkedIn — Delhi NCR",  url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer%20OR%20Platform%20Engineer&location=Delhi%2C%20India&f_TPR=r604800&sortBy=DD", color:"#0077B5"},
    {name:"Naukri — Delhi",        url:"https://www.naukri.com/devops-jobs-in-delhi-ncr?k=senior+devops+engineer+kubernetes&l=delhi&jobAge=7&sort=1", color:"#FF7555"},
  ],
  pun:[
    {name:"LinkedIn — Pune",       url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Pune%2C%20Maharashtra%2C%20India&f_TPR=r604800&sortBy=DD", color:"#0077B5"},
    {name:"Naukri — Pune",         url:"https://www.naukri.com/devops-jobs-in-pune?k=senior+devops+engineer+kubernetes&l=pune&jobAge=7&sort=1", color:"#FF7555"},
  ],
  che:[
    {name:"LinkedIn — Chennai",    url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Chennai%2C%20Tamil%20Nadu%2C%20India&f_TPR=r604800&sortBy=DD", color:"#0077B5"},
    {name:"Naukri — Chennai",      url:"https://www.naukri.com/devops-jobs-in-chennai?k=senior+devops+engineer&l=chennai&jobAge=7&sort=1", color:"#FF7555"},
  ],
  kol:[
    {name:"LinkedIn — Kolkata",    url:"https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer&location=Kolkata%2C%20West%20Bengal%2C%20India&f_TPR=r604800&sortBy=DD", color:"#0077B5"},
    {name:"Naukri — Kolkata",      url:"https://www.naukri.com/devops-jobs-in-kolkata?k=devops+engineer&l=kolkata&jobAge=7&sort=1", color:"#FF7555"},
  ],
  ahm:[
    {name:"LinkedIn — Ahmedabad",  url:"https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer&location=Ahmedabad%2C%20Gujarat%2C%20India&f_TPR=r604800&sortBy=DD", color:"#0077B5"},
    {name:"Naukri — Ahmedabad",    url:"https://www.naukri.com/devops-jobs-in-ahmedabad?k=devops+engineer&l=ahmedabad&jobAge=7&sort=1", color:"#FF7555"},
  ],
};

// Remote India portals
const REMOTE_PORTALS = [
  {name:"LinkedIn — Remote India", url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer%20OR%20Platform%20Engineer%20OR%20SRE&location=India&f_WT=2&f_TPR=r604800&sortBy=DD", color:"#0077B5"},
  {name:"Naukri — Remote DevOps",  url:"https://www.naukri.com/remote-devops-jobs?k=senior+devops+engineer+kubernetes+aws&jobAge=7&sort=1", color:"#FF7555"},
  {name:"Wellfound — Remote India", url:"https://wellfound.com/role/l/devops-engineer/india", color:"#6366f1"},
  {name:"Instahyre — DevOps",      url:"https://www.instahyre.com/jobs/?q=Senior+DevOps+Engineer", color:"#10b981"},
  {name:"RemoteOK — Live feed",    url:"https://remoteok.com/remote-devops-jobs", color:"#14b8a6"},
  {name:"Glassdoor — Remote India",url:"https://www.glassdoor.co.in/Job/india-senior-devops-engineer-jobs-SRCH_IL.0,5_IN115_KO6,28.htm?fromAge=7&sortBy=date_desc", color:"#0caa41"},
];

// Intl portals per region
const INTL_PORTALS = {
  us:[
    {name:"LinkedIn — US Remote",  url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=United%20States&f_WT=2&f_TPR=r604800&sortBy=DD", color:"#0077B5"},
    {name:"RemoteOK — Live",       url:"https://remoteok.com/remote-devops-jobs", color:"#14b8a6"},
    {name:"Remotive — Live",       url:"https://remotive.com/remote-jobs/devops-sysadmin", color:"#6366f1"},
  ],
  uk:[
    {name:"LinkedIn — UK",         url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=United%20Kingdom&f_TPR=r604800&sortBy=DD", color:"#0077B5"},
    {name:"Totaljobs — UK",        url:"https://www.totaljobs.com/jobs/devops-engineer?posted=7&sort=2", color:"#e11d48"},
  ],
  eu:[
    {name:"LinkedIn — Europe",     url:"https://www.linkedin.com/jobs/search/?keywords=Senior%20DevOps%20Engineer&location=Europe&f_TPR=r604800&sortBy=DD", color:"#0077B5"},
    {name:"Arbeitnow — EU",        url:"https://www.arbeitnow.com/jobs?search=senior+devops+engineer", color:"#6366f1"},
  ],
  sg:[
    {name:"LinkedIn — Singapore",  url:"https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer&location=Singapore&f_TPR=r604800&sortBy=DD", color:"#0077B5"},
  ],
  uae:[
    {name:"LinkedIn — UAE",        url:"https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer&location=United%20Arab%20Emirates&f_TPR=r604800&sortBy=DD", color:"#0077B5"},
    {name:"Bayt — UAE",            url:"https://www.bayt.com/en/uae/jobs/senior-devops-engineer-jobs/", color:"#e11d48"},
  ],
  ca:[
    {name:"LinkedIn — Canada",     url:"https://www.linkedin.com/jobs/search/?keywords=Senior+DevOps+Engineer&location=Canada&f_WT=2&f_TPR=r604800&sortBy=DD", color:"#0077B5"},
  ],
  au:[
    {name:"LinkedIn — Australia",  url:"https://www.linkedin.com/jobs/search/?keywords=Senior+DevOps+Engineer&location=Australia&f_TPR=r604800&sortBy=DD", color:"#0077B5"},
    {name:"Seek — Australia",      url:"https://www.seek.com.au/senior-devops-engineer-jobs?daterange=7&sortmode=ListedDate", color:"#e67e22"},
  ],
};

// ── India SVG ──────────────────────────────────────────────────────
const INDIA_PATH = `M195,55 L208,50 L224,49 L242,53 L258,60 L272,70 L284,75 L296,74 L308,80 L318,90 L325,102 L328,116 L326,130 L320,144 L315,158 L318,172 L324,184 L322,198 L316,210 L308,222 L300,234 L292,246 L285,260 L280,274 L275,288 L270,300 L262,312 L254,326 L245,338 L235,352 L226,366 L220,380 L217,394 L220,408 L228,420 L236,432 L242,444 L246,458 L242,470 L236,482 L228,492 L218,500 L210,492 L204,480 L198,468 L193,456 L188,442 L183,428 L178,414 L173,400 L168,386 L163,372 L157,358 L150,346 L142,334 L133,322 L123,310 L113,298 L103,286 L95,272 L88,258 L83,244 L80,230 L78,216 L76,202 L75,188 L74,174 L73,160 L73,146 L74,132 L77,118 L83,106 L92,96 L103,88 L115,82 L128,76 L142,70 L156,64 L170,59 L183,56 L195,55 Z M326,130 L338,126 L350,122 L362,126 L370,136 L370,150 L362,160 L350,164 L338,162 L328,154 L322,142 L326,130 Z M73,160 L64,164 L57,174 L57,186 L63,194 L73,197 L82,192 L86,182 L84,170 L76,163 L73,160 Z M258,60 L272,54 L286,52 L298,57 L304,68 L300,80 L288,84 L275,80 L264,72 L258,62 L258,60 Z M246,458 L236,464 L228,475 L228,488 L234,498 L244,502 L254,497 L260,486 L258,474 L250,463 L246,458 Z`;

const CITIES = [
  {id:"hyd",name:"Hyderabad",cx:225,cy:340,state:"Telangana"},
  {id:"blr",name:"Bengaluru",cx:205,cy:385,state:"Karnataka"},
  {id:"mum",name:"Mumbai",   cx:148,cy:315,state:"Maharashtra"},
  {id:"del",name:"Delhi NCR",cx:200,cy:170,state:"Delhi"},
  {id:"pun",name:"Pune",     cx:158,cy:328,state:"Maharashtra"},
  {id:"che",name:"Chennai",  cx:232,cy:395,state:"Tamil Nadu"},
  {id:"kol",name:"Kolkata",  cx:318,cy:248,state:"West Bengal"},
  {id:"ahm",name:"Ahmedabad",cx:132,cy:238,state:"Gujarat"},
];

const INTL = [
  {id:"remote-in",flag:"🇮🇳",label:"Remote India"},
  {id:"us",       flag:"🇺🇸",label:"United States"},
  {id:"uk",       flag:"🇬🇧",label:"United Kingdom"},
  {id:"eu",       flag:"🇪🇺",label:"Europe"},
  {id:"sg",       flag:"🇸🇬",label:"Singapore"},
  {id:"uae",      flag:"🇦🇪",label:"UAE / Dubai"},
  {id:"ca",       flag:"🇨🇦",label:"Canada"},
  {id:"au",       flag:"🇦🇺",label:"Australia"},
];

function starPts(cx,cy,R){return[0,1,2,3,4,5,6,7,8,9].map(i=>{const a=(Math.PI/5)*i-Math.PI/2,r=i%2===0?R:R*.4;return`${cx+Math.cos(a)*r},${cy+Math.sin(a)*r}`;}).join(" ");}
function sCol(s){return s>=80?"#1D9E75":s>=65?"#EF9F27":"#D85A30";}
function sCls(s){return s>=80?"sc-h":s>=65?"sc-m":"sc-s";}

export default function WorldMap({darkMode}){
  const[liveJobs,   setLiveJobs]   = useState([]);
  const[selCity,    setSelCity]    = useState(null);
  const[selIntl,    setSelIntl]    = useState(null);
  const[status,     setStatus]     = useState({text:"Fetching live jobs…",ok:false,err:false});
  const[loading,    setLoading]    = useState(true);
  const[lastUp,     setLastUp]     = useState("");
  const[blink,      setBlink]      = useState(true);
  const[liveCount,  setLiveCount]  = useState(0);

  const T={
    fg:darkMode?"#e2e8f0":"#1a202c", muted:darkMode?"#6b7280":"#64748b",
    card:darkMode?"rgba(255,255,255,.04)":"rgba(255,255,255,.9)",
    border:darkMode?"rgba(255,255,255,.08)":"#e2e8f0",
    input:darkMode?"rgba(255,255,255,.05)":"#f7fafc",
    panel:darkMode?"rgba(8,14,28,.98)":"rgba(255,255,255,.98)",
    b2:darkMode?"rgba(255,255,255,.12)":"rgba(0,0,0,.12)",
    ocean:darkMode?"#060e1f":"#0d2044", land:darkMode?"#1c3a5e":"#2a5e8f",
  };

  useEffect(()=>{const t=setInterval(()=>setBlink(b=>!b),800);return()=>clearInterval(t);},[]);

  const fetchLive=useCallback(async()=>{
    setLoading(true);setStatus({text:"Fetching live jobs…",ok:false,err:false});
    try{
      const cached=localStorage.getItem(CACHE_KEY);
      const ts=parseInt(localStorage.getItem(CACHE_TS)||"0");
      if(cached&&N()-ts<CACHE_TTL){
        const{jobs,count}=JSON.parse(cached);
        setLiveJobs(jobs||[]);setLiveCount(count||0);
        setLastUp(new Date(ts).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}));
        setStatus({text:`Live · ${count||0} fresh roles (≤7d) · cached`,ok:true,err:false});
        setLoading(false);return;
      }
    }catch{}

    let all=[];let hits=0;
    for(const src of SOURCES){
      try{
        const d=await fetchProxy(src.url);
        const jobs=src.parse(d);
        all.push(...jobs);if(jobs.length>0)hits++;
      }catch{}
      await new Promise(r=>setTimeout(r,200));
    }

    // Deduplicate + final freshness gate + score
    const seen=new Set();
    all=all.filter(j=>{if(seen.has(j.url))return false;seen.add(j.url);return true;})
            .filter(j=>fresh(j.ts))
            .map(j=>({...j,score:scoreJ(j.title,j.desc||"",j.tags||[])}))
            .sort((a,b)=>b.ts-a.ts); // newest first

    setLiveJobs(all);setLiveCount(all.length);
    const ts=N();
    setLastUp(new Date(ts).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}));
    setStatus({text:hits>0?`Live · ${all.length} fresh roles (≤7 days)`:"Network unavailable · check portals below",ok:hits>0,err:hits===0});
    try{localStorage.setItem(CACHE_KEY,JSON.stringify({jobs:all,count:all.length}));localStorage.setItem(CACHE_TS,String(ts));}catch{}
    setLoading(false);
  },[]);

  useEffect(()=>{fetchLive();},[]);
  useEffect(()=>{
    let last=N();
    const check=()=>{if(N()-last>CACHE_TTL){last=N();fetchLive();}};
    window.addEventListener("focus",check);
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")check();});
    return()=>window.removeEventListener("focus",check);
  },[fetchLive]);

  // Count how many live jobs match each city by keyword
  function cityJobCount(cityId){
    const keywords={hyd:["hyderabad","telangana"],blr:["bangalore","bengaluru","karnataka"],mum:["mumbai","maharashtra"],del:["delhi","noida","gurgaon","ncr"],pun:["pune"],che:["chennai","tamil"],kol:["kolkata"],ahm:["ahmedabad","gujarat"]};
    const kw=keywords[cityId]||[];
    // All cities share remote jobs too
    return liveJobs.filter(j=>kw.some(k=>(j.desc+j.title+j.url).toLowerCase().includes(k))||j.remote).length;
  }

  // Get live jobs relevant to a city
  function cityLiveJobs(cityId){
    const keywords={hyd:["hyderabad","telangana"],blr:["bangalore","bengaluru"],mum:["mumbai"],del:["delhi","noida","gurgaon"],pun:["pune"],che:["chennai"],kol:["kolkata"],ahm:["ahmedabad"]};
    const kw=keywords[cityId]||[];
    const city_specific=liveJobs.filter(j=>kw.some(k=>(j.desc+j.title+j.url).toLowerCase().includes(k)));
    const remote_global=liveJobs.filter(j=>j.remote&&!city_specific.find(c=>c.id===j.id));
    return [...city_specific,...remote_global.slice(0,5)].sort((a,b)=>b.score-a.score);
  }

  // Get intl jobs for a region
  function intlLiveJobs(regionId){
    if(regionId==="remote-in") return liveJobs.filter(j=>j.remote).sort((a,b)=>b.score-a.score);
    const map={us:["united states","usa","us ","america"],uk:["uk","united kingdom","london"],eu:["europe","germany","amsterdam","berlin","france"],sg:["singapore","apac"],uae:["uae","dubai","middle east"],ca:["canada","toronto"],au:["australia","sydney"]};
    const kw=map[regionId]||[];
    return liveJobs.filter(j=>kw.some(k=>(j.desc||"").toLowerCase().includes(k))).sort((a,b)=>b.score-a.score);
  }

  const totalJobs=liveJobs.length;
  const highFit=liveJobs.filter(j=>j.score>=80).length;
  const todayCount=liveJobs.filter(j=>N()-j.ts<86400000).length;
  const selCityJobs=selCity?cityLiveJobs(selCity.id):[];
  const selIntlJobs=selIntl?intlLiveJobs(selIntl.id):[];
  const selCityPortals=selCity?(CITY_PORTALS[selCity.id]||[]):[];
  const selIntlPortals=selIntl?(INTL_PORTALS[selIntl.id]||[]):[];

  const css=`
    @keyframes sb{0%,100%{filter:drop-shadow(0 0 8px #1D9E75);opacity:1}50%{filter:drop-shadow(0 0 2px #1D9E75);opacity:.4}}
    @keyframes wm-spin{to{transform:rotate(360deg)}}
    @keyframes wm-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slide-in{from{transform:translateX(100%)}to{transform:translateX(0)}}
    .sb{animation:sb 1.6s ease-in-out infinite;cursor:pointer;}
    .ir:hover{background:rgba(99,102,241,.08)!important;}
    .jr:hover{border-color:rgba(29,158,117,.3)!important;background:rgba(29,158,117,.03)!important;}
    .sc-h{background:rgba(29,158,117,.15);color:#1D9E75;border:.5px solid rgba(29,158,117,.3);}
    .sc-m{background:rgba(239,159,39,.15);color:#EF9F27;border:.5px solid rgba(239,159,39,.3);}
    .sc-s{background:rgba(216,90,48,.15);color:#D85A30;border:.5px solid rgba(216,90,48,.3);}
    .pb:hover{transform:translateY(-2px)!important;box-shadow:0 4px 16px rgba(0,0,0,.25)!important;}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(99,102,241,.25);border-radius:2px}
  `;

  return(
    <div style={{fontFamily:"'Instrument Sans',system-ui,sans-serif",animation:"wm-in .3s"}}>
      <style>{css}</style>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:12}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:0}}>🌍 Live Global Job Map</h2>
          <p style={{fontSize:12,color:T.muted,margin:"4px 0 0"}}>Only jobs ≤7 days old · Click city star → live jobs + direct LinkedIn/Naukri links for that city</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 12px",borderRadius:20,background:status.err?"rgba(216,90,48,.1)":status.ok?"rgba(29,158,117,.1)":"rgba(99,102,241,.08)",border:`0.5px solid ${status.err?"rgba(216,90,48,.3)":status.ok?"rgba(29,158,117,.3)":"rgba(99,102,241,.2)"}`,fontSize:11,color:status.err?"#D85A30":status.ok?"#1D9E75":"#a5b4fc"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:status.err?"#D85A30":status.ok?"#1D9E75":"#6366f1",animation:loading?"wm-spin 1s linear infinite":"none"}}/>
            {status.text}
          </div>
          <button onClick={()=>{try{localStorage.removeItem(CACHE_KEY)}catch{}fetchLive();}} style={{padding:"5px 12px",borderRadius:8,border:`0.5px solid ${T.b2}`,background:T.input,color:T.muted,fontSize:11,cursor:"pointer"}}>🔄 Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
        {[{l:"Live roles (≤7d)",v:totalJobs,c:"#6366f1"},{l:"High fit 80+",v:highFit,c:"#1D9E75"},{l:"Posted today",v:todayCount,c:"#EF9F27"},{l:"From APIs",v:liveCount,c:"#a78bfa"}].map(s=>(
          <div key={s.l} style={{padding:"10px 12px",borderRadius:10,background:T.card,border:`0.5px solid ${T.border}`,textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontSize:10,color:T.muted,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Map + Sidebar */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 288px",gap:12,alignItems:"start"}}>

        {/* India Map */}
        <div style={{borderRadius:14,overflow:"hidden",border:`0.5px solid ${T.border}`,background:`linear-gradient(135deg,${T.ocean},${darkMode?"#0a1628":"#122040"})`,boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}>
          <div style={{padding:"10px 14px",borderBottom:"0.5px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#e0e7ff"}}>🇮🇳 India — Click any ⭐ star → live jobs + apply links</div>
            <div style={{fontSize:11,color:T.muted}}>{liveJobs.length} live roles loaded</div>
          </div>

          <div style={{position:"relative"}}>
            <svg viewBox="0 0 420 560" style={{width:"100%",display:"block"}}>
              <defs>
                <radialGradient id="og7" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor={darkMode?"#0d1e3a":"#1a3f6e"}/><stop offset="100%" stopColor={darkMode?"#050d1a":"#0e2544"}/>
                </radialGradient>
                <filter id="glow7"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              <rect width="420" height="560" fill="url(#og7)"/>
              {[70,140,210,280,350].map(x=><line key={x} x1={x} y1={0} x2={x} y2={560} stroke="rgba(255,255,255,.02)" strokeWidth={0.5}/>)}
              {[80,160,240,320,400,480].map(y=><line key={y} x1={0} y1={y} x2={420} y2={y} stroke="rgba(255,255,255,.02)" strokeWidth={0.5}/>)}
              <text x={58}  y={480} fontSize={9} fill="rgba(255,255,255,.12)" fontFamily="system-ui" fontStyle="italic">Arabian Sea</text>
              <text x={295} y={500} fontSize={9} fill="rgba(255,255,255,.12)" fontFamily="system-ui" fontStyle="italic">Bay of Bengal</text>
              <text x={148} y={545} fontSize={9} fill="rgba(255,255,255,.12)" fontFamily="system-ui" fontStyle="italic">Indian Ocean</text>
              <path d={INDIA_PATH} fill={T.land} stroke="rgba(255,255,255,.2)" strokeWidth={1.2}/>

              {CITIES.map(city=>{
                const isSel=selCity?.id===city.id;
                const col=isSel?"#1D9E75":"#6366f1";
                const R=10;
                return(
                  <g key={city.id} style={{cursor:"pointer"}} onClick={()=>setSelCity(isSel?null:city)}>
                    <circle cx={city.cx} cy={city.cy} r={R+2} fill="none" stroke={col} strokeWidth={1.5}>
                      <animate attributeName="r" values={`${R};${R+20};${R}`} dur="2.2s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values=".8;0;.8" dur="2.2s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx={city.cx} cy={city.cy} r={R+2} fill="none" stroke={col} strokeWidth={1} opacity={0.4}>
                      <animate attributeName="r" values={`${R};${R+32};${R}`} dur="3.6s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values=".4;0;.4" dur="3.6s" repeatCount="indefinite"/>
                    </circle>
                    <circle cx={city.cx} cy={city.cy} r={R+8} fill={col} opacity={isSel?.25:.07}/>
                    <polygon className="sb" filter="url(#glow7)" fill={col} opacity={blink?1:.42} points={starPts(city.cx,city.cy,R)}/>
                    <polygon fill="rgba(255,255,255,.4)" points={starPts(city.cx,city.cy,R*.48)} style={{pointerEvents:"none"}}/>
                    <text x={city.cx} y={city.cy+R+22} textAnchor="middle" fontSize={7.5} fontFamily="system-ui" fill={isSel?"#e0e7ff":"rgba(255,255,255,.65)"} fontWeight={isSel?700:400}>{city.name}</text>
                    {isSel&&<circle cx={city.cx} cy={city.cy} r={R+13} fill="none" stroke="#e0e7ff" strokeWidth={1.5} strokeDasharray="4,3"/>}
                  </g>
                );
              })}
              {loading&&<><rect width="420" height="560" fill="rgba(5,13,26,.65)"/><text x="210" y="275" textAnchor="middle" fontSize={13} fill="rgba(255,255,255,.6)" fontFamily="system-ui">Fetching live jobs…</text></>}
            </svg>

            {/* City panel */}
            {selCity&&(
              <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:T.panel,animation:"slide-in .22s ease-out",overflowY:"auto",zIndex:20}}>
                <div style={{padding:"12px 14px",borderBottom:`0.5px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:T.panel,zIndex:1}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:darkMode?"#e0e7ff":T.fg}}>📍 {selCity.name} — {selCity.state}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:2}}>{selCityJobs.length} live roles + direct search links below</div>
                  </div>
                  <button onClick={()=>setSelCity(null)} style={{background:"rgba(255,255,255,.06)",border:`0.5px solid ${T.b2}`,borderRadius:6,width:28,height:28,cursor:"pointer",color:T.muted,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                </div>
                <div style={{padding:"10px 12px"}}>

                  {/* Direct search links — always working */}
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#a5b4fc",marginBottom:6}}>⚡ Search now — pre-filtered, newest first, ≤7 days</div>
                    {selCityPortals.map(p=>(
                      <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="pb"
                        style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",borderRadius:8,marginBottom:5,background:darkMode?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)",border:`0.5px solid ${T.border}`,textDecoration:"none",transition:"all .15s",borderLeft:`3px solid ${p.color}`}}>
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:p.color}}>{p.name}</div>
                          <div style={{fontSize:10,color:T.muted}}>Opens pre-filtered results · Senior DevOps / Platform / SRE</div>
                        </div>
                        <span style={{fontSize:11,fontWeight:700,color:"#1D9E75",flexShrink:0}}>Open ↗</span>
                      </a>
                    ))}
                  </div>

                  {/* Live API jobs */}
                  {selCityJobs.length>0&&<>
                    <div style={{fontSize:11,fontWeight:700,color:"#1D9E75",marginBottom:6}}>🔴 Live API Jobs — direct apply links</div>
                    {selCityJobs.slice(0,8).map(j=>{
                      const dl=fmtDate(j.ts);
                      return(
                        <div key={j.id} className="jr" style={{background:darkMode?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)",border:`0.5px solid ${darkMode?"rgba(255,255,255,.07)":"rgba(0,0,0,.07)"}`,borderRadius:10,padding:"10px 12px",marginBottom:6,transition:"all .15s"}}>
                          <div style={{display:"flex",justifyContent:"space-between",gap:6,marginBottom:4}}>
                            <div style={{fontSize:12,fontWeight:600,color:darkMode?"#e0e7ff":T.fg,lineHeight:1.3}}>{j.title}</div>
                            <span className={sCls(j.score)} style={{fontSize:10,padding:"2px 7px",borderRadius:20,fontWeight:700,flexShrink:0}}>{j.score}</span>
                          </div>
                          <div style={{fontSize:11,color:T.muted,marginBottom:4}}>{j.co} · <span style={{color:"#a78bfa"}}>{j.src}</span></div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:6}}>
                            {(j.tags||[]).slice(0,4).map(t=><span key={t} style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:"rgba(99,102,241,.1)",color:"#a5b4fc",border:"0.5px solid rgba(99,102,241,.2)"}}>{t}</span>)}
                          </div>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <div>
                              {j.sal&&<div style={{fontSize:10,color:"#1D9E75",fontWeight:600}}>{j.sal}</div>}
                              <div style={{fontSize:10,color:T.muted}}>🌐 Remote · <strong style={{color:dl==="Just now"||(dl?.includes("m ago")||dl?.includes("h ago"))?"#1D9E75":T.muted}}>{dl||"This week"}</strong></div>
                            </div>
                            <a href={j.url} target="_blank" rel="noopener noreferrer"
                              style={{fontSize:11,fontWeight:700,padding:"5px 14px",borderRadius:6,background:"#1D9E75",color:"#fff",textDecoration:"none",flexShrink:0}}>
                              Apply ↗
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </>}
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{padding:"8px 14px",borderTop:"0.5px solid rgba(255,255,255,.06)",display:"flex",gap:14,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:10,color:T.muted}}>⭐ Stars = active cities · Click → live jobs + search links</span>
            <div style={{marginLeft:"auto",fontSize:10,color:T.muted}}>{lastUp?`Updated ${lastUp}`:"Loading…"}</div>
          </div>
        </div>

        {/* International Sidebar */}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{fontSize:13,fontWeight:600,color:darkMode?"#e0e7ff":T.fg,padding:"0 2px 8px",borderBottom:`0.5px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            🌐 International
            <span style={{fontSize:10,color:T.muted}}>{liveJobs.filter(j=>j.remote).length} remote roles</span>
          </div>

          {INTL.map(region=>{
            const isOpen=selIntl?.id===region.id;
            const jobs=intlLiveJobs(region.id);
            const portals=INTL_PORTALS[region.id]||[];
            const top=jobs.length>0?Math.max(...jobs.map(j=>j.score)):0;
            return(
              <div key={region.id}>
                <div className="ir" onClick={()=>setSelIntl(isOpen?null:region)}
                  style={{padding:"10px 12px",borderRadius:10,background:T.card,border:`0.5px solid ${isOpen?"rgba(99,102,241,.3)":T.border}`,cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:18}}>{region.flag}</span>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:darkMode?"#e0e7ff":T.fg}}>{region.label}</div>
                      <div style={{fontSize:10,color:T.muted}}>{jobs.length} live · {portals.length} search links</div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {jobs.length>0&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:20,fontWeight:700,background:"rgba(29,158,117,.12)",color:"#1D9E75"}}>{top}</span>}
                    <div style={{width:6,height:6,borderRadius:"50%",background:jobs.length>0?"#1D9E75":T.muted,opacity:blink?1:.2,transition:"opacity .4s"}}/>
                    <span style={{fontSize:10,color:T.muted,transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s"}}>▼</span>
                  </div>
                </div>

                {isOpen&&(
                  <div style={{marginTop:4,padding:"8px",borderRadius:10,background:darkMode?"rgba(0,0,0,.2)":"rgba(0,0,0,.03)",border:`0.5px solid ${T.border}`,maxHeight:320,overflowY:"auto"}}>
                    {/* Portal search links */}
                    {portals.length>0&&<>
                      <div style={{fontSize:10,fontWeight:700,color:"#a5b4fc",marginBottom:6}}>⚡ Search links — pre-filtered</div>
                      {portals.map(p=>(
                        <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="pb"
                          style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 8px",borderRadius:7,marginBottom:4,background:darkMode?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)",border:`0.5px solid ${T.border}`,textDecoration:"none",transition:"all .15s",borderLeft:`2px solid ${p.color}`}}>
                          <div style={{fontSize:10,fontWeight:600,color:p.color}}>{p.name}</div>
                          <span style={{fontSize:9,color:"#1D9E75",fontWeight:700}}>Open ↗</span>
                        </a>
                      ))}
                    </>}
                    {/* Live API jobs */}
                    {jobs.length>0&&<>
                      <div style={{fontSize:10,fontWeight:700,color:"#1D9E75",margin:"8px 0 5px"}}>🔴 Live jobs — direct apply</div>
                      {jobs.slice(0,5).map(j=>{
                        const dl=fmtDate(j.ts);
                        return(
                          <div key={j.id} className="jr" style={{padding:"7px 8px",borderRadius:7,marginBottom:4,background:darkMode?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)",border:`0.5px solid ${darkMode?"rgba(255,255,255,.05)":"rgba(0,0,0,.06)"}`,transition:"all .15s"}}>
                            <div style={{display:"flex",justifyContent:"space-between",gap:4,marginBottom:2}}>
                              <div style={{fontSize:11,fontWeight:600,color:darkMode?"#e0e7ff":T.fg,lineHeight:1.3,flex:1}}>{j.title}</div>
                              <span className={sCls(j.score)} style={{fontSize:9,padding:"1px 5px",borderRadius:20,fontWeight:700,flexShrink:0}}>{j.score}</span>
                            </div>
                            <div style={{fontSize:10,color:T.muted,marginBottom:3}}>{j.co} · {j.src}</div>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                              <div style={{fontSize:9,color:T.muted}}>{j.sal?<><span style={{color:"#1D9E75"}}>{j.sal}</span> · </>:""}<strong style={{color:dl==="Just now"?"#1D9E75":T.muted}}>{dl||"This week"}</strong></div>
                              <a href={j.url} target="_blank" rel="noopener noreferrer" style={{fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:4,background:"#1D9E75",color:"#fff",textDecoration:"none"}}>Apply ↗</a>
                            </div>
                          </div>
                        );
                      })}
                    </>}
                    {jobs.length===0&&portals.length===0&&<div style={{fontSize:11,color:T.muted,textAlign:"center",padding:12}}>No live roles found for this region</div>}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{padding:"10px 12px",borderRadius:10,background:"rgba(99,102,241,.06)",border:"0.5px solid rgba(99,102,241,.15)",fontSize:11,color:T.muted,lineHeight:1.7}}>
            ⭐ Stars blink on every city<br/>
            ✅ Live jobs = direct apply URL<br/>
            🔗 Search links = pre-filtered results<br/>
            🔥 7-day cutoff enforced always
          </div>
        </div>
      </div>
    </div>
  );
}
