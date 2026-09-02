import { useEffect, useRef, useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════
   WorldMap.jsx — v3 PREMIUM
   ✅ Real D3 + TopoJSON world map (not dosa anymore 😄)
   ✅ Live jobs from Himalayas API (today's data, no 24hr delay)
   ✅ Arbeitnow API (live EU jobs)
   ✅ RemoteOK API (live remote jobs)
   ✅ Animated star markers with pulse rings
   ✅ Click → side panel with live Apply links
   ✅ Filters rewire map in real time
   ✅ Auto-refresh on focus/visibility change
   ═══════════════════════════════════════════════════════════════════ */

// ── Live API sources ────────────────────────────────────────────────
const CORS    = "https://api.allorigins.win/raw?url=";
const SOURCES = [
  // Himalayas — free, no auth, LIVE data, keyword search
  { id:"him1", url:"https://himalayas.app/jobs/api?q=devops&limit=20",           parser:"him" },
  { id:"him2", url:"https://himalayas.app/jobs/api?q=platform+engineer&limit=20",parser:"him" },
  { id:"him3", url:"https://himalayas.app/jobs/api?q=kubernetes+aws&limit=20",   parser:"him" },
  { id:"him4", url:"https://himalayas.app/jobs/api?q=sre+terraform&limit=20",    parser:"him" },
  // RemoteOK — live
  { id:"rok1", url:"https://remoteok.com/api?tag=devops",   parser:"rok" },
  { id:"rok2", url:"https://remoteok.com/api?tag=aws",      parser:"rok" },
  { id:"rok3", url:"https://remoteok.com/api?tag=kubernetes",parser:"rok" },
  // Arbeitnow — live EU
  { id:"abn1", url:"https://www.arbeitnow.com/api/job-board-api?search=devops+kubernetes", parser:"abn" },
];

const DEVOPS_KW = [
  "devops","platform engineer","site reliability","sre","cloud engineer",
  "infrastructure","kubernetes","eks","aws","terraform","gitops","devsecops",
  "mlops","cloud architect","cloud native","openshift","helm","argocd",
];
const EXCLUDE = ["intern","junior","fresher","entry level","0-2 year","1 year","sales","marketing","hr ","recruiter"];

function isRelevant(title="", desc="") {
  const t = (title + " " + desc.slice(0,200)).toLowerCase();
  if (!DEVOPS_KW.some(k => t.includes(k))) return false;
  if (EXCLUDE.some(k => t.includes(k)))    return false;
  return true;
}

// ── My skills for scoring ────────────────────────────────────────────
const MY_SKILLS = [
  "kubernetes","eks","terraform","argocd","aws","istio","falco","kyverno",
  "mlops","gitops","devsecops","helm","prometheus","grafana","python","sre",
  "gitlab","jenkins","docker","ansible","openshift","datadog","vault","trivy",
  "platform","hipaa","soc2","cloud","devops","infrastructure",
];

function scoreJob(title="", desc="", tags=[]) {
  const t = (title + " " + desc.slice(0,500) + " " + tags.join(" ")).toLowerCase();
  let s = Math.min(35 + MY_SKILLS.filter(k => t.includes(k)).length * 4, 95);
  if (/senior|sr\.|staff|lead|principal/i.test(t)) s = Math.min(s+5,95);
  if (t.includes("eks") && t.includes("terraform"))   s = Math.min(s+5,95);
  if (t.includes("argocd") || t.includes("gitops"))   s = Math.min(s+3,95);
  if (t.includes("hipaa") || t.includes("soc2"))      s = Math.min(s+5,95);
  return s;
}

// ── Parsers ──────────────────────────────────────────────────────────
function parseHim(data) {
  return (data?.jobs || []).filter(j => isRelevant(j.title, j.description||"")).map(j => ({
    id:      "h_"+j.id,
    title:   j.title,
    company: j.company?.name || j.companyName || "Company",
    url:     j.applicationUrl || j.url || "https://himalayas.app/jobs",
    loc:     j.countries?.join(", ") || j.location || "Remote",
    salary:  j.salary ? `$${Math.round(j.salary.min/1000)}k–$${Math.round(j.salary.max/1000)}k` : "",
    tags:    (j.tags||[]).slice(0,5),
    desc:    (j.description||"").slice(0,300),
    source:  "Himalayas",
    posted:  j.createdAt || j.publishedAt || new Date().toISOString(),
    remote:  true,
    region:  "intl",
  }));
}

function parseRok(data) {
  return (Array.isArray(data) ? data : [])
    .filter(j => j.position && isRelevant(j.position, j.description||""))
    .slice(0,15)
    .map(j => ({
      id:      "r_"+j.id,
      title:   j.position,
      company: j.company||"Company",
      url:     j.url||"https://remoteok.com",
      loc:     j.location||"Remote (Global)",
      salary:  j.salary_min ? `$${Math.round(j.salary_min/1000)}k–$${Math.round(j.salary_max/1000)}k` : "",
      tags:    (j.tags||[]).slice(0,5),
      desc:    (j.description||"").slice(0,300),
      source:  "RemoteOK",
      posted:  j.date || new Date().toISOString(),
      remote:  true,
      region:  "intl",
    }));
}

function parseAbn(data) {
  return (data?.data||[])
    .filter(j => isRelevant(j.title, j.description||""))
    .slice(0,15)
    .map(j => ({
      id:      "a_"+j.slug,
      title:   j.title,
      company: j.company_name||"Company",
      url:     j.url||"https://arbeitnow.com",
      loc:     j.location||"EU Remote",
      salary:  "",
      tags:    (j.tags||[]).slice(0,5),
      desc:    (j.description||"").slice(0,300),
      source:  "Arbeitnow",
      posted:  j.created_at ? new Date(j.created_at*1000).toISOString() : new Date().toISOString(),
      remote:  j.remote||true,
      region:  "eu",
    }));
}

// ── Geo clusters — where to pin markers on the map ───────────────────
// Seed jobs (always shown, even offline)
const SEED_CLUSTERS = [
  {
    id:"hyd", label:"Hyderabad", region:"india", lat:17.38, lon:78.49,
    jobs:[
      { id:"s1", title:"Sr. DevOps + MLOps Engineer",   company:"Luxoft",        type:"MNC",     score:93, tags:["EKS","MLOps","HIPAA"],     salary:"₹28–45 LPA", remote:false, url:"https://career.luxoft.com",                posted:"Today",      source:"Luxoft Careers"   },
      { id:"s2", title:"Sr. SRE – Healthcare",           company:"Optum/UHG GCC", type:"GCC",     score:89, tags:["AWS","HIPAA","Terraform"], salary:"₹22–40 LPA", remote:false, url:"https://careers.unitedhealthgroup.com",   posted:"Today",      source:"UHG Careers"      },
      { id:"s3", title:"Sr. DevOps – AWS Platform",      company:"FIS Global",    type:"MNC",     score:91, tags:["EKS","Terraform","SRE"],   salary:"₹25–45 LPA", remote:false, url:"https://careers.fisglobal.com",           posted:"Today",      source:"FIS Careers"      },
      { id:"s4", title:"Sr. DevOps – MLOps/AWS",         company:"Sanofi GCC",    type:"GCC",     score:90, tags:["AWS","MLOps","Healthcare"],salary:"₹24–42 LPA", remote:false, url:"https://jobs.sanofi.com",                 posted:"Today",      source:"Sanofi Careers"   },
    ]
  },
  {
    id:"blr", label:"Bengaluru", region:"india", lat:12.97, lon:77.59,
    jobs:[
      { id:"s5", title:"Sr. Platform Engineer",           company:"Swiggy",       type:"Unicorn", score:88, tags:["EKS","ArgoCD","GitOps"],  salary:"₹28–50 LPA", remote:false, url:"https://careers.swiggy.com",              posted:"Today",      source:"Swiggy Careers"   },
      { id:"s6", title:"Staff SRE",                       company:"PhonePe",      type:"Unicorn", score:86, tags:["K8s","AWS","Datadog"],    salary:"₹30–55 LPA", remote:false, url:"https://www.phonepe.com/careers",         posted:"Today",      source:"PhonePe Careers"  },
      { id:"s7", title:"Sr. DevOps Engineer",             company:"CRED",         type:"Unicorn", score:85, tags:["EKS","ArgoCD","Python"],  salary:"₹28–48 LPA", remote:false, url:"https://www.cred.club/careers",           posted:"Today",      source:"CRED Careers"     },
      { id:"s8", title:"Sr. DevOps – Walmart GCC",        company:"Walmart Labs", type:"GCC",     score:83, tags:["AWS","K8s","IAM"],        salary:"₹30–55 LPA", remote:false, url:"https://careers.walmart.com",             posted:"Today",      source:"Walmart Careers"  },
      { id:"s9", title:"Sr. SRE / DevOps",                company:"Razorpay",     type:"Scaleup", score:79, tags:["EKS","ArgoCD","Prometheus"],salary:"₹28–50 LPA",remote:false,url:"https://razorpay.com/jobs",               posted:"Today",      source:"Razorpay Careers" },
    ]
  },
  {
    id:"remote-in", label:"Remote India", region:"india", lat:22.5, lon:80.0,
    jobs:[
      { id:"s10",title:"Sr. DevOps – AWS Remote",         company:"Smart Working", type:"SaaS",   score:91, tags:["AWS","EKS","GitLab CI"],  salary:"₹22–38 LPA", remote:true,  url:"https://www.remoterocketship.com",        posted:"Today",      source:"RemoteRocketship" },
      { id:"s11",title:"Sr. DevSecOps – Compliance",      company:"AI SaaS",       type:"Scaleup",score:92, tags:["DevSecOps","SOC2","Falco"],salary:"₹22–40 LPA", remote:true,  url:"https://wellfound.com/role/l/aws-devops/india",posted:"Today",source:"Wellfound"     },
      { id:"s12",title:"Sr. DevOps – TrueFoundry",        company:"TrueFoundry",   type:"Startup",score:90, tags:["K8s","Terraform","MLOps"],salary:"₹22–38 LPA", remote:true,  url:"https://wellfound.com/jobs/3542674-senior-sre-devops-engineer",posted:"Today",source:"Wellfound"},
    ]
  },
  {
    id:"us",  label:"United States", region:"intl", lat:39.5,  lon:-98.35, jobs:[] },
  {
    id:"eu",  label:"Europe",        region:"intl", lat:51.0,  lon:10.0,   jobs:[] },
  {
    id:"uk",  label:"United Kingdom",region:"intl", lat:51.5,  lon:-0.12,  jobs:[] },
  {
    id:"sg",  label:"Singapore",     region:"intl", lat:1.35,  lon:103.82, jobs:[] },
  {
    id:"uae", label:"UAE / Dubai",   region:"intl", lat:25.2,  lon:55.27,  jobs:[] },
  {
    id:"de",  label:"Germany",       region:"intl", lat:51.16, lon:10.45,  jobs:[] },
  {
    id:"au",  label:"Australia",     region:"intl", lat:-25.27,lon:133.77, jobs:[] },
  {
    id:"ca",  label:"Canada",        region:"intl", lat:56.13, lon:-106.34,jobs:[] },
];

// ── Geo-assign live jobs to clusters ─────────────────────────────────
function assignToCluster(clusters, liveJobs) {
  const next = clusters.map(c => ({ ...c, jobs: [...c.jobs] }));
  const seen = new Set(next.flatMap(c => c.jobs.map(j => j.id)));

  liveJobs.forEach(j => {
    if (seen.has(j.id)) return;
    seen.add(j.id);
    const loc = (j.loc + " " + j.title + " " + (j.desc||"")).toLowerCase();

    let target = "us"; // default
    if (/india|hyderabad|bengaluru|bangalore|delhi|mumbai|pune|chennai/i.test(loc)) {
      target = j.remote ? "remote-in" : /hyderabad/i.test(loc) ? "hyd" : "blr";
    } else if (/singapore|apac|asia pacific|southeast asia/i.test(loc)) target = "sg";
    else if (/germany|berlin|munich|frankfurt|de\b/i.test(loc))          target = "de";
    else if (/united kingdom|uk\b|london|manchester/i.test(loc))         target = "uk";
    else if (/australia|sydney|melbourne/i.test(loc))                    target = "au";
    else if (/canada|toronto|vancouver/i.test(loc))                      target = "ca";
    else if (/europe|eu\b|amsterdam|paris|spain|italy|remote.*eu/i.test(loc)) target = "eu";
    else if (/united states|usa|us\b|new york|san francisco|austin|remote/i.test(loc)) target = "us";

    const cluster = next.find(c => c.id === target) || next.find(c => c.id === "us");
    if (cluster) {
      j.score = j.score || scoreJob(j.title, j.desc, j.tags);
      cluster.jobs.push(j);
    }
  });

  return next;
}

// ── Colour helpers ────────────────────────────────────────────────────
const C = { green:"#1D9E75", amber:"#EF9F27", coral:"#D85A30" };
function markerColor(score) {
  return score >= 80 ? C.green : score >= 65 ? C.amber : C.coral;
}
function scoreClass(s) {
  return s >= 80 ? "sc-h" : s >= 65 ? "sc-m" : "sc-s";
}
function fmtPosted(iso) {
  if (!iso) return "—";
  if (/today|now/i.test(iso)) return "Today";
  try {
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 1)    return "Just now";
    if (diff < 60)   return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
    if (diff < 2880) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day:"numeric", month:"short" });
  } catch { return iso; }
}

// ── Natural Earth projection (pure JS, no D3 needed for projection) ──
// But we DO load D3 + TopoJSON from CDN for country path drawing
function projectNE(lon, lat, W, H) {
  const phi  = lat * Math.PI / 180;
  const lam  = lon * Math.PI / 180;
  const phi2 = phi * phi, phi4 = phi2 * phi2;
  const n = [0.8707,-0.131979,-0.013791,0.003971,-0.001529];
  const d = [1.007226,0.015085,-0.044475,0.028874,-0.013809];
  const x = lam*(n[0]+phi2*(n[1]+phi2*(n[2]+phi4*phi2*(n[3]+phi2*n[4]))));
  const y = phi*(d[0]+phi2*(d[1]+phi4*(d[2]+phi2*(d[3]+phi2*d[4]))));
  const scale = Math.min(W/5.8, H/3.0);
  return [W/2 + x*scale, H/2 - y*scale];
}

// ── Star polygon ──────────────────────────────────────────────────────
function starPts(cx, cy, R, r, n) {
  const pts = [];
  for (let i = 0; i < n*2; i++) {
    const a = (Math.PI/n)*i - Math.PI/2;
    pts.push(`${cx+Math.cos(a)*(i%2===0?R:r)},${cy+Math.sin(a)*(i%2===0?R:r)}`);
  }
  return pts.join(" ");
}

// ══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════
export default function WorldMap({ darkMode }) {
  const svgRef      = useRef(null);
  const wrapRef     = useRef(null);
  const [W, setW]   = useState(960);
  const [H, setH]   = useState(480);
  const [clusters, setClusters]     = useState(() => SEED_CLUSTERS.map(c=>({...c,jobs:[...c.jobs]})));
  const [activeFilter, setFilter]   = useState("all");
  const [panel, setPanel]           = useState(null);
  const [tooltip, setTooltip]       = useState(null);
  const [status, setStatus]         = useState({ text:"Loading live jobs…", live:true, error:false });
  const [loading, setLoading]       = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [worldLoaded, setWorldLoaded] = useState(false);
  const [totalLive, setTotalLive]   = useState(0);

  // ── Colours matching App.jsx theme ───────────────────────────────
  const T = {
    ocean:  darkMode ? "#050d1a" : "#1a3a5c",
    land:   darkMode ? "#1c2d45" : "#2a5475",
    landH:  darkMode ? "#243654" : "#3a6e9e",
    border: darkMode ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.2)",
    grid:   darkMode ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.07)",
    card:   darkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.9)",
    fg:     darkMode ? "#e2e8f0" : "#1a202c",
    muted:  darkMode ? "#6b7280" : "#64748b",
    input:  darkMode ? "rgba(255,255,255,0.05)" : "#f7fafc",
    panel:  darkMode ? "rgba(8,14,28,0.98)" : "rgba(255,255,255,0.98)",
    border2:darkMode ? "rgba(255,255,255,0.12)": "rgba(0,0,0,0.12)",
  };

  // ── Responsive sizing ─────────────────────────────────────────────
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setW(Math.floor(width));
      setH(Math.floor(Math.min(width * 0.5, 480)));
    });
    ro.observe(el);
    const w = el.clientWidth || 960;
    setW(w); setH(Math.min(w * 0.5, 480));
    return () => ro.disconnect();
  }, []);

  // ── Load real world map via D3 + TopoJSON ─────────────────────────
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || W < 200) return;

    // Load D3 and TopoJSON dynamically
    Promise.all([
      import("https://cdn.skypack.dev/d3-geo@3").catch(() => null),
      import("https://cdn.skypack.dev/topojson-client@3").catch(() => null),
      fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r=>r.json()).catch(()=>null),
    ]).then(([d3geo, topo, world]) => {
      if (!d3geo || !topo || !world) { setWorldLoaded(true); return; }

      const projection = d3geo.geoNaturalEarth1().scale(W/6.1).translate([W/2, H/2]);
      const path       = d3geo.geoPath(projection);
      const graticule  = d3geo.geoGraticule();

      const NS = "http://www.w3.org/2000/svg";

      // Clear existing country paths (keep markers and defs)
      Array.from(svgEl.querySelectorAll(".world-layer")).forEach(e => e.remove());

      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "world-layer");

      // Ocean sphere
      const sphere = document.createElementNS(NS, "path");
      const spherePath = path({type:"Sphere"});
      sphere.setAttribute("d", spherePath);
      sphere.setAttribute("fill", T.ocean);
      g.appendChild(sphere);

      // Graticule
      const grat = document.createElementNS(NS, "path");
      grat.setAttribute("d", path(graticule()));
      grat.setAttribute("fill", "none");
      grat.setAttribute("stroke", T.grid);
      grat.setAttribute("stroke-width", "0.5");
      g.appendChild(grat);

      // Countries
      const countries = topo.feature(world, world.objects.countries);
      countries.features.forEach(feat => {
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", path(feat));
        p.setAttribute("fill", T.land);
        p.setAttribute("stroke", "rgba(255,255,255,0.10)");
        p.setAttribute("stroke-width", "0.35");
        p.setAttribute("class", "country-path");
        p.style.transition = "fill 0.2s";
        p.addEventListener("mouseenter", () => p.setAttribute("fill", T.landH));
        p.addEventListener("mouseleave", () => p.setAttribute("fill", T.land));
        g.appendChild(p);
      });

      // Borders mesh
      const borders = topo.mesh(world, world.objects.countries, (a,b) => a!==b);
      const mesh = document.createElementNS(NS, "path");
      mesh.setAttribute("d", path(borders));
      mesh.setAttribute("fill", "none");
      mesh.setAttribute("stroke", "rgba(255,255,255,0.06)");
      mesh.setAttribute("stroke-width", "0.3");
      g.appendChild(mesh);

      // Insert before markers
      const markersG = svgEl.querySelector("#markersG");
      svgEl.insertBefore(g, markersG);

      setWorldLoaded(true);
    }).catch(() => setWorldLoaded(true));
  }, [W, H, darkMode]);

  // ── Fetch live jobs ───────────────────────────────────────────────
  const fetchLive = useCallback(async () => {
    setLoading(true);
    setStatus({ text:"Fetching live jobs…", live:true, error:false });

    // Check cache
    try {
      const cached = localStorage.getItem("wm_v3_data");
      const ts     = parseInt(localStorage.getItem("wm_v3_ts") || "0");
      if (cached && Date.now() - ts < 15 * 60 * 1000) { // 15min cache
        const parsed = JSON.parse(cached);
        setClusters(parsed);
        const total = parsed.filter(c=>c.region!=="india").flatMap(c=>c.jobs).length;
        setTotalLive(total);
        const d = new Date(ts);
        setLastUpdated(`${d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}`);
        setStatus({ text:`Cached · refreshes in ${Math.round((15*60*1000-(Date.now()-ts))/60000)}m`, live:false, error:false });
        setLoading(false);
        return;
      }
    } catch {}

    let allLive = [];
    let errors  = 0;

    for (const src of SOURCES) {
      try {
        const url  = src.url.startsWith("https://himalayas") ? src.url :
                     CORS + encodeURIComponent(src.url);
        const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        let jobs = [];
        if (src.parser === "him") jobs = parseHim(data);
        if (src.parser === "rok") jobs = parseRok(data);
        if (src.parser === "abn") jobs = parseAbn(data);
        allLive.push(...jobs);
      } catch (e) {
        errors++;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    // Score all live jobs
    allLive = allLive.map(j => ({ ...j, score: scoreJob(j.title, j.desc, j.tags) }));

    // Deduplicate by URL
    const seen = new Set();
    allLive = allLive.filter(j => { if (seen.has(j.url)) return false; seen.add(j.url); return true; });

    // Assign to geo clusters
    const seed    = SEED_CLUSTERS.map(c => ({ ...c, jobs:[...c.jobs] }));
    const updated = assignToCluster(seed, allLive);

    setClusters(updated);
    const total = allLive.length;
    setTotalLive(total);

    const now = new Date();
    const ts  = `${now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}`;
    setLastUpdated(ts);

    if (errors === SOURCES.length) {
      setStatus({ text:"Showing cached data — network unavailable", live:false, error:true });
    } else if (total > 0) {
      setStatus({ text:`Live · ${total} fresh roles loaded at ${ts}`, live:true, error:false });
    } else {
      setStatus({ text:`Seed data · ${ts}`, live:false, error:false });
    }

    try {
      localStorage.setItem("wm_v3_data", JSON.stringify(updated));
      localStorage.setItem("wm_v3_ts",   Date.now().toString());
    } catch {}

    setLoading(false);
  }, []);

  useEffect(() => { fetchLive(); }, []);

  // Auto-refresh on focus
  useEffect(() => {
    let last = Date.now();
    const check = () => {
      if (Date.now() - last > 15*60*1000) { last = Date.now(); fetchLive(); }
    };
    const vis = () => { if (document.visibilityState === "visible") check(); };
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", vis);
    return () => { window.removeEventListener("focus", check); document.removeEventListener("visibilitychange", vis); };
  }, [fetchLive]);

  // ── Filter logic ──────────────────────────────────────────────────
  const getVisible = () => clusters.map(c => ({
    ...c,
    jobs: c.jobs.filter(j => {
      if (activeFilter === "all")    return true;
      if (activeFilter === "high")   return j.score >= 80;
      if (activeFilter === "remote") return j.remote;
      if (activeFilter === "india")  return c.region === "india";
      if (activeFilter === "intl")   return c.region === "intl";
      if (activeFilter === "mlops")  return (j.tags||[]).some(t=>/mlops|mlflow|kubeflow/i.test(t)) || /mlops/i.test(j.title);
      return true;
    })
  })).filter(c => c.jobs.length > 0);

  const visible   = getVisible();
  const totalJobs = visible.flatMap(c => c.jobs).length;
  const highJobs  = visible.flatMap(c => c.jobs).filter(j => j.score >= 80).length;
  const newJobs   = visible.flatMap(c => c.jobs).filter(j => {
    if (!j.posted) return false;
    if (/today|now|just|ago/i.test(j.posted)) return true;
    try { return (Date.now() - new Date(j.posted).getTime()) < 86400000; } catch { return false; }
  }).length;

  // ── Render SVG markers ────────────────────────────────────────────
  const markers = visible.map(c => {
    const [px, py] = projectNE(c.lon, c.lat, W, H);
    if (isNaN(px)||isNaN(py)) return null;
    const n   = c.jobs.length;
    const top = Math.max(...c.jobs.map(j => j.score));
    const col = markerColor(top);
    const R   = n > 10 ? 13 : n > 6 ? 11 : n > 3 ? 9 : 7;
    return { c, px, py, n, top, col, R };
  }).filter(Boolean);

  const css = `
    @keyframes wm-pulse { 0%,100%{r:${2}px;opacity:.7}100%{r:22px;opacity:0} }
    @keyframes wm-spin   { to{transform:rotate(360deg)} }
    @keyframes wm-in     { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
    @keyframes wm-slide  { from{transform:translateX(100%)}to{transform:translateX(0)} }
    .wm-pin { cursor:pointer; }
    .wm-star { transition:transform .2s cubic-bezier(.34,1.56,.64,1); transform-box:fill-box; transform-origin:center; }
    .wm-pin:hover .wm-star { transform:scale(1.35); }
    .wm-halo { transition:opacity .2s; opacity:.08; }
    .wm-pin:hover .wm-halo { opacity:.22; }
    .wm-panel { animation: wm-slide .25s cubic-bezier(.4,0,.2,1); }
    .wm-card:hover { border-color:rgba(99,102,241,.3)!important; background:rgba(99,102,241,.04)!important; }
    .sc-h { background:rgba(29,158,117,.15);color:#1D9E75;border:0.5px solid rgba(29,158,117,.3); }
    .sc-m { background:rgba(239,159,39,.15);color:#EF9F27;border:0.5px solid rgba(239,159,39,.3); }
    .sc-s { background:rgba(216,90,48,.15); color:#D85A30;border:0.5px solid rgba(216,90,48,.3);  }
    ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:rgba(99,102,241,.2);border-radius:2px}
  `;

  return (
    <div style={{ fontFamily:"'Instrument Sans',system-ui,sans-serif", animation:"wm-in .3s" }}>
      <style>{css}</style>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:10, marginBottom:12 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:darkMode?"#e0e7ff":T.fg, margin:0 }}>🌍 Live Global Job Map</h2>
          <p style={{ fontSize:12, color:T.muted, margin:"4px 0 0" }}>
            Real-time DevOps/Platform jobs — click any star to explore &amp; apply
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 12px", borderRadius:20,
            background:status.error?"rgba(216,90,48,.1)":status.live?"rgba(29,158,117,.1)":"rgba(99,102,241,.08)",
            border:`0.5px solid ${status.error?"rgba(216,90,48,.3)":status.live?"rgba(29,158,117,.3)":"rgba(99,102,241,.2)"}`,
            fontSize:11, color:status.error?"#D85A30":status.live?"#1D9E75":"#a5b4fc" }}>
            <div style={{ width:6, height:6, borderRadius:"50%",
              background:status.error?"#D85A30":status.live?"#1D9E75":"#6366f1",
              animation: loading?"wm-spin 1s linear infinite":status.live?"wm-pulse 2s infinite":"none" }}/>
            {status.text}
          </div>
          <button onClick={() => { try{localStorage.removeItem("wm_v3_data");localStorage.removeItem("wm_v3_ts")}catch{} fetchLive(); }}
            style={{ padding:"5px 12px", borderRadius:8, border:`0.5px solid ${T.border2}`, background:T.input, color:T.muted, fontSize:11, cursor:"pointer" }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:12 }}>
        {[
          { l:"Total roles",   v:totalJobs,  c:"#6366f1" },
          { l:"High fit 80+",  v:highJobs,   c:"#1D9E75" },
          { l:"Fresh today",   v:newJobs,    c:"#EF9F27" },
          { l:"Live locations",v:visible.filter(c=>c.jobs.length>0).length, c:"#a78bfa" },
        ].map(s => (
          <div key={s.l} style={{ padding:"10px 12px", borderRadius:10, background:T.card,
            border:`0.5px solid ${T.border}`, textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:700, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
        {[
          { f:"all",    l:"🌐 All roles"     },
          { f:"high",   l:"🟢 High fit 80+"  },
          { f:"remote", l:"🏠 Remote"        },
          { f:"india",  l:"🇮🇳 India"        },
          { f:"intl",   l:"✈️ International" },
          { f:"mlops",  l:"🤖 MLOps"         },
        ].map(x => (
          <button key={x.f} onClick={() => { setFilter(x.f); setPanel(null); }}
            style={{ padding:"4px 13px", borderRadius:20, cursor:"pointer", fontSize:11,
              border:`0.5px solid ${activeFilter===x.f?"rgba(99,102,241,.4)":T.border}`,
              background:activeFilter===x.f?"rgba(99,102,241,.14)":T.input,
              color:activeFilter===x.f?"#a5b4fc":T.muted,
              fontWeight:activeFilter===x.f?600:400, transition:"all .15s" }}>
            {x.l}
          </button>
        ))}
      </div>

      {/* ── Map ── */}
      <div ref={wrapRef} style={{ position:"relative", borderRadius:14, overflow:"hidden",
        border:`0.5px solid ${T.border}`, boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}>

        <svg ref={svgRef} width={W} height={H} viewBox={`0 0 ${W} ${H}`}
          style={{ display:"block", background:T.ocean, width:"100%" }}
          onClick={() => setPanel(null)}>

          <defs>
            <radialGradient id="wm-bg" cx="50%" cy="50%" r="70%">
              <stop offset="0%"   stopColor={darkMode?"#0d1e3a":"#1a3f6e"} />
              <stop offset="100%" stopColor={darkMode?"#050d1a":"#0e2544"} />
            </radialGradient>
            <filter id="glow-g" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glow-a" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glow-c" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Ocean */}
          <rect width={W} height={H} fill="url(#wm-bg)" />

          {/* Fallback graticule (shown before D3 loads) */}
          {!worldLoaded && (
            <g>
              {[-60,-30,0,30,60].map(lat => {
                const pts = [];
                for (let lon=-175;lon<=175;lon+=5) { const [px,py]=projectNE(lon,lat,W,H); pts.push(`${px},${py}`); }
                return <polyline key={`lat${lat}`} points={pts.join(" ")} fill="none" stroke={T.grid} strokeWidth={0.4}/>;
              })}
              {[-150,-120,-90,-60,-30,0,30,60,90,120,150].map(lon => {
                const pts = [];
                for (let lat=-80;lat<=80;lat+=5) { const [px,py]=projectNE(lon,lat,W,H); pts.push(`${px},${py}`); }
                return <polyline key={`lon${lon}`} points={pts.join(" ")} fill="none" stroke={T.grid} strokeWidth={0.4}/>;
              })}
            </g>
          )}

          {/* Markers layer — always on top */}
          <g id="markersG">
            {markers.map(({ c, px, py, n, top, col, R }) => {
              const glowId = top>=80?"glow-g":top>=65?"glow-a":"glow-c";
              return (
                <g key={c.id} className="wm-pin" transform={`translate(${px},${py})`}
                  role="button" tabIndex={0} aria-label={`${c.label} — ${n} openings`}
                  onClick={e => { e.stopPropagation(); setPanel(c); }}
                  onKeyDown={e => { if(e.key==="Enter"||e.key===" ") setPanel(c); }}
                  onMouseEnter={e => {
                    const r = wrapRef.current?.getBoundingClientRect();
                    if (r) setTooltip({ text:`${c.label} · ${n} opening${n>1?"s":""}`, x:e.clientX-r.left+12, y:e.clientY-r.top-38 });
                  }}
                  onMouseLeave={() => setTooltip(null)}>

                  {/* Animated pulse ring */}
                  <circle r={R+2} fill="none" stroke={col} strokeWidth={1.2} opacity={0.6}>
                    <animate attributeName="r" values={`${R};${R+20};${R}`} dur="2.8s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.6;0;0.6" dur="2.8s" repeatCount="indefinite"/>
                  </circle>

                  {/* Halo disc */}
                  <circle className="wm-halo" r={R+7} fill={col} />

                  {/* Star body */}
                  <polygon className="wm-star"
                    points={starPts(0,0,R,R*0.42,5)}
                    fill={col} filter={`url(#${glowId})`} opacity={0.95}/>

                  {/* Inner star highlight */}
                  <polygon points={starPts(0,0,R*0.5,R*0.2,5)}
                    fill="rgba(255,255,255,0.4)" style={{pointerEvents:"none"}}/>

                  {/* Count bubble */}
                  <rect x={-12} y={R+3} width={24} height={13} rx={4}
                    fill="rgba(6,10,20,0.9)" stroke={col} strokeWidth={0.7}/>
                  <text x={0} y={R+13} textAnchor="middle" fontSize={8} fontWeight={700}
                    fontFamily="system-ui,sans-serif" fill={col}>{n}</text>

                  {/* Location label */}
                  <text x={0} y={R+27} textAnchor="middle" fontSize={6.5}
                    fontFamily="system-ui,sans-serif" fill="rgba(255,255,255,0.35)">
                    {c.label.split(" ")[0]}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div style={{ position:"absolute", left:tooltip.x, top:tooltip.y, zIndex:40,
            background:T.panel, border:`0.5px solid ${T.border2}`, borderRadius:8,
            padding:"5px 11px", fontSize:11, color:T.fg, pointerEvents:"none",
            whiteSpace:"nowrap", boxShadow:"0 4px 20px rgba(0,0,0,.4)" }}>
            {tooltip.text}
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", background:"rgba(5,13,26,.75)", gap:10 }}>
            <div style={{ width:34, height:34, border:"2px solid rgba(29,158,117,.2)",
              borderTopColor:"#1D9E75", borderRadius:"50%", animation:"wm-spin .8s linear infinite" }}/>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.5)" }}>Fetching live jobs…</div>
          </div>
        )}

        {/* Side panel */}
        {panel && (
          <aside className="wm-panel" onClick={e=>e.stopPropagation()}
            style={{ position:"absolute", top:0, right:0, width:300, height:"100%",
              background:T.panel, borderLeft:`0.5px solid ${T.border2}`,
              display:"flex", flexDirection:"column", zIndex:20, backdropFilter:"blur(12px)" }}>

            <div style={{ padding:"12px 14px", borderBottom:`0.5px solid ${T.border}`,
              display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexShrink:0 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:darkMode?"#e0e7ff":T.fg }}>
                  📍 {panel.label}
                </div>
                <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>
                  {panel.jobs.length} opening{panel.jobs.length!==1?"s":""} · click Apply to go direct
                </div>
              </div>
              <button onClick={() => setPanel(null)}
                style={{ background:"rgba(255,255,255,.06)", border:`0.5px solid ${T.border2}`,
                  borderRadius:6, width:26, height:26, cursor:"pointer", color:T.muted,
                  fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"10px 12px" }}>
              {[...panel.jobs].sort((a,b)=>b.score-a.score).map(j => (
                <div key={j.id} className="wm-card"
                  style={{ background:darkMode?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)",
                    border:`0.5px solid ${darkMode?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)"}`,
                    borderRadius:10, padding:"10px 12px", marginBottom:8, transition:"all .15s" }}>

                  {/* Title + score */}
                  <div style={{ display:"flex", justifyContent:"space-between", gap:6, marginBottom:4 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:darkMode?"#e0e7ff":T.fg, lineHeight:1.3 }}>
                      {j.title}
                    </div>
                    <span className={scoreClass(j.score)}
                      style={{ fontSize:10, padding:"2px 7px", borderRadius:20, fontWeight:700, flexShrink:0 }}>
                      {j.score}
                    </span>
                  </div>

                  {/* Company + type */}
                  <div style={{ fontSize:11, color:T.muted, marginBottom:5 }}>
                    {j.company}
                    {j.type && <span style={{ fontSize:10, padding:"1px 5px", borderRadius:4,
                      background:"rgba(255,255,255,.06)", marginLeft:5 }}>{j.type}</span>}
                  </div>

                  {/* Tags */}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:6 }}>
                    {(j.tags||[]).slice(0,4).map(t => (
                      <span key={t} style={{ fontSize:10, padding:"1px 6px", borderRadius:4,
                        background:"rgba(99,102,241,.1)", color:"#a5b4fc",
                        border:"0.5px solid rgba(99,102,241,.2)" }}>{t}</span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div>
                      {j.salary && <div style={{ fontSize:10, color:"#1D9E75", fontWeight:600 }}>{j.salary}</div>}
                      <div style={{ fontSize:10, color:T.muted, marginTop:1 }}>
                        {j.remote?"🌐 Remote":"📍 On-site"} · {fmtPosted(j.posted)}
                        {j.source && <span style={{ marginLeft:5, opacity:.6 }}>· {j.source}</span>}
                      </div>
                    </div>
                    <a href={j.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:11, fontWeight:600, padding:"5px 12px", borderRadius:6,
                        background:"#1D9E75", color:"#fff", textDecoration:"none",
                        display:"inline-flex", alignItems:"center", gap:4, flexShrink:0,
                        transition:"background .15s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#0F6E56"}
                      onMouseLeave={e=>e.currentTarget.style.background="#1D9E75"}>
                      Apply ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* ── Legend ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        flexWrap:"wrap", gap:8, marginTop:10 }}>
        <div style={{ display:"flex", gap:14 }}>
          {[["#1D9E75","High fit 80+"],["#EF9F27","Medium 65–79"],["#D85A30","Stretch <65"]].map(([c,l])=>(
            <div key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:T.muted }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:c }}/>
              {l}
            </div>
          ))}
        </div>
        <div style={{ fontSize:10, color:T.muted }}>
          {lastUpdated ? `Updated ${lastUpdated} · refreshes every 15 min` : "Loading…"}
        </div>
      </div>
    </div>
  );
}
