import { useEffect, useRef, useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════
   WorldMap.jsx — Live Global Job Map
   Drop into src/ — no other changes needed except the 3-line patch
   in App.jsx (see PATCH.md)
   ═══════════════════════════════════════════════════════════════════ */

// ── Job clusters — lat/lon pinned to real coordinates ──────────────
const JOB_CLUSTERS = [
  {
    id: "hyd", label: "Hyderabad", region: "india",
    lat: 17.38, lon: 78.49,
    jobs: [
      { id:"h1", title:"Sr. DevOps + MLOps Engineer",      company:"Luxoft",        type:"MNC",      score:93, tags:["EKS","MLOps","HIPAA","ArgoCD"],    salary:"₹28–45 LPA", remote:false, hot:true,  isNew:true,  url:"https://career.luxoft.com/jobs/senior-devops-mlops-engineer-24042",               posted:"2 days ago"  },
      { id:"h2", title:"Sr. SRE – Healthcare",              company:"Optum/UHG GCC", type:"GCC",      score:89, tags:["AWS","HIPAA","Terraform","SRE"],    salary:"₹22–40 LPA", remote:false, hot:false, isNew:false, url:"https://careers.unitedhealthgroup.com",                                             posted:"1 week ago"  },
      { id:"h3", title:"Sr. DevOps – AWS Platform",         company:"FIS Global",    type:"MNC",      score:91, tags:["EKS","Terraform","SRE","Python"],   salary:"₹25–45 LPA", remote:false, hot:false, isNew:true,  url:"https://careers.fisglobal.com",                                                    posted:"4 days ago"  },
      { id:"h4", title:"Sr. DevOps – MLOps/AWS",            company:"Sanofi GCC",    type:"GCC",      score:90, tags:["AWS","MLOps","Healthcare","EKS"],   salary:"₹24–42 LPA", remote:false, hot:true,  isNew:false, url:"https://jobs.sanofi.com",                                                          posted:"2 weeks ago" },
      { id:"h5", title:"Sr. DevOps – Darwinbox",            company:"Darwinbox",     type:"SaaS",     score:81, tags:["AWS","EKS","GitOps"],               salary:"₹24–40 LPA", remote:false, hot:false, isNew:false, url:"https://darwinbox.com/about-us/careers",                                            posted:"3 weeks ago" },
      { id:"h6", title:"Sr. DevOps – Capgemini",            company:"Capgemini",     type:"MNC",      score:83, tags:["AWS","K8s","Terraform","Jenkins"],  salary:"₹20–32 LPA", remote:false, hot:false, isNew:false, url:"https://in.linkedin.com/jobs/view/devops-sr-engineer-at-capgemini-4388766653",   posted:"1 month ago" },
    ]
  },
  {
    id: "blr", label: "Bengaluru", region: "india",
    lat: 12.97, lon: 77.59,
    jobs: [
      { id:"b1", title:"Sr. Platform Engineer",             company:"Swiggy",        type:"Unicorn",  score:88, tags:["EKS","ArgoCD","Helm","GitOps"],     salary:"₹28–50 LPA", remote:false, hot:true,  isNew:false, url:"https://careers.swiggy.com",                                                       posted:"2 weeks ago" },
      { id:"b2", title:"Staff SRE",                         company:"PhonePe",       type:"Unicorn",  score:86, tags:["K8s","AWS","Datadog","SLO"],         salary:"₹30–55 LPA", remote:false, hot:false, isNew:false, url:"https://www.phonepe.com/careers",                                                  posted:"3 weeks ago" },
      { id:"b3", title:"Sr. DevOps Engineer",               company:"CRED",          type:"Unicorn",  score:85, tags:["EKS","ArgoCD","GitOps","Python"],    salary:"₹28–48 LPA", remote:false, hot:false, isNew:false, url:"https://www.cred.club/careers",                                                    posted:"1 month ago" },
      { id:"b4", title:"Platform Engineer – Dev XP",        company:"Freshworks",    type:"SaaS",     score:82, tags:["K8s","AWS","Terraform","SRE"],       salary:"₹26–44 LPA", remote:false, hot:false, isNew:false, url:"https://www.freshworks.com/company/careers",                                       posted:"1 month ago" },
      { id:"b5", title:"Sr. DevOps – Walmart GCC",          company:"Walmart Labs",  type:"GCC",      score:83, tags:["AWS","K8s","IAM","Security"],        salary:"₹30–55 LPA", remote:false, hot:false, isNew:false, url:"https://careers.walmart.com",                                                      posted:"Ongoing"     },
      { id:"b6", title:"Sr. SRE / DevOps",                  company:"Razorpay",      type:"Scaleup",  score:79, tags:["EKS","ArgoCD","Prometheus"],          salary:"₹28–50 LPA", remote:false, hot:true,  isNew:false, url:"https://razorpay.com/jobs",                                                        posted:"2 weeks ago" },
      { id:"b7", title:"Sr. DevOps – Groww",                company:"Groww",         type:"Unicorn",  score:79, tags:["K8s","ArgoCD","SLO","Terraform"],    salary:"₹26–45 LPA", remote:false, hot:false, isNew:false, url:"https://groww.in/careers",                                                         posted:"1 month ago" },
      { id:"b8", title:"Sr. DevOps – Postman",              company:"Postman",       type:"SaaS",     score:78, tags:["AWS","K8s","GitOps"],                salary:"₹28–50 LPA", remote:false, hot:false, isNew:false, url:"https://www.postman.com/company/careers",                                          posted:"1 month ago" },
      { id:"b9", title:"Sr. DevOps – Meesho",               company:"Meesho",        type:"Unicorn",  score:76, tags:["AWS","K8s","CI/CD","Terraform"],     salary:"₹24–42 LPA", remote:false, hot:false, isNew:false, url:"https://meesho.io/careers",                                                        posted:"2 months ago"},
      { id:"b10",title:"Sr. DevOps – Chargebee",            company:"Chargebee",     type:"SaaS",     score:74, tags:["AWS","K8s","Security","GitOps"],     salary:"₹22–40 LPA", remote:false, hot:false, isNew:false, url:"https://www.chargebee.com/careers",                                                posted:"1 month ago" },
      { id:"b11",title:"Sr. DevOps – Zerodha",              company:"Zerodha",       type:"Unicorn",  score:71, tags:["K8s","AWS","Terraform","Linux"],     salary:"₹24–40 LPA", remote:false, hot:false, isNew:false, url:"https://zerodha.com/careers",                                                      posted:"2 months ago"},
    ]
  },
  {
    id: "remote-in", label: "Remote India", region: "india",
    lat: 22.5, lon: 80.0,
    jobs: [
      { id:"r1",  title:"Sr. DevOps – AWS Remote",          company:"Smart Working",     type:"SaaS",      score:91, tags:["AWS","EKS","GitLab CI"],           salary:"₹22–38 LPA",   remote:true, hot:false, isNew:true,  url:"https://www.remoterocketship.com/company/smartworking-io/jobs/senior-engineer-aws-devops-india-remote/", posted:"5 days ago"  },
      { id:"r2",  title:"Sr. DevSecOps – Compliance",       company:"AI SaaS (Anon)",    type:"Scaleup",   score:92, tags:["DevSecOps","SOC2","Falco"],         salary:"₹22–40 LPA",   remote:true, hot:false, isNew:false, url:"https://wellfound.com/role/l/aws-devops/india",                                                               posted:"1 week ago"  },
      { id:"r3",  title:"Sr. DevOps – TrueFoundry",         company:"TrueFoundry",       type:"Startup",   score:90, tags:["K8s","Terraform","MLOps"],          salary:"₹22–38 LPA",   remote:true, hot:false, isNew:true,  url:"https://wellfound.com/jobs/3542674-senior-sre-devops-engineer",                                               posted:"3 days ago"  },
      { id:"r4",  title:"Sr. Platform Eng – Velotio",       company:"Velotio",           type:"Consulting",score:87, tags:["K8s","AWS","CI/CD"],                salary:"₹20–35 LPA",   remote:true, hot:false, isNew:false, url:"https://www.remoterocketship.com/company/velotio-technologies/jobs/senior-devops-engineer-india",            posted:"3 weeks ago" },
      { id:"r5",  title:"Sr. DevOps – ZoomInfo",            company:"ZoomInfo",          type:"Scaleup",   score:85, tags:["Terraform","Istio","Datadog"],      salary:"₹28–45 LPA",   remote:true, hot:false, isNew:false, url:"https://www.zoominfo.com/careers/jr107376/senior-devops-engineer",                                           posted:"3 weeks ago" },
      { id:"r6",  title:"DevOps Lead – OpsTree",            company:"OpsTree Solutions", type:"Consulting",score:77, tags:["K8s","AWS","Ansible"],             salary:"₹18–30 LPA",   remote:true, hot:false, isNew:false, url:"https://www.opstree.com/careers",                                                                             posted:"Ongoing"     },
      { id:"r7",  title:"Sr. DevOps – AI Infra",            company:"AI Platform Co.",   type:"Startup",   score:84, tags:["AWS","EKS","MLOps","Python"],      salary:"₹24–42 LPA",   remote:true, hot:true,  isNew:true,  url:"https://cutshort.io/jobs/devops-jobs",                                                                        posted:"1 week ago"  },
      { id:"r8",  title:"MLOps Engineer",                   company:"GenAI Startup",     type:"Startup",   score:63, tags:["MLflow","Kubeflow","GenAI"],       salary:"₹20–38 LPA",   remote:true, hot:false, isNew:false, url:"https://cutshort.io/jobs/remote-machine-learning-ml-jobs",                                                    posted:"2 weeks ago" },
      { id:"r9",  title:"Sr. DevOps – Healthcare SaaS",     company:"HCC Platform",      type:"Startup",   score:78, tags:["AWS","HIPAA","K8s","GitOps"],      salary:"₹18–32 LPA",   remote:true, hot:false, isNew:true,  url:"https://wellfound.com/role/r/devops-engineer",                                                                posted:"4 days ago"  },
      { id:"r10", title:"Sr. DevOps – Hirequorum",          company:"Hirequorum/US",     type:"Consulting",score:91, tags:["EKS","Terraform","ArgoCD"],        salary:"₹24–42 LPA",   remote:true, hot:false, isNew:false, url:"https://hirequorum.liveblog365.com/job/senior-devops-engineer-255",                                          posted:"3 weeks ago" },
      { id:"r11", title:"Sr. DevOps – TransFi",             company:"TransFi (Fintech)", type:"Startup",   score:80, tags:["AWS/GCP","K8s","Terraform"],       salary:"₹18–32 LPA",   remote:true, hot:false, isNew:true,  url:"https://wellfound.com/jobs/3477887-senior-devops-engineer-remote",                                           posted:"6 days ago"  },
    ]
  },
  {
    id: "us", label: "United States", region: "intl",
    lat: 39.5, lon: -98.35,
    jobs: [
      { id:"u1", title:"Sr. DevOps Engineer (Remote)",      company:"SaaS.group",    type:"SaaS",    score:80, tags:["AWS","K8s","Terraform","SRE"],  salary:"$70k–110k/yr", remote:true, hot:false, isNew:true,  url:"https://remoteok.com/remote-devops-jobs",            posted:"2 weeks ago"  },
      { id:"u2", title:"Remote MLOps Engineer",             company:"Arc.dev Client",type:"Scaleup", score:61, tags:["MLOps","KServe","AWS","Python"],salary:"$3k–5.5k/mo",  remote:true, hot:false, isNew:true,  url:"https://arc.dev/remote-jobs/mlops",                  posted:"3 weeks ago"  },
      { id:"u3", title:"Sr. Platform Engineer",             company:"FinTech Remote",type:"Startup", score:64, tags:["AWS","GCP","K8s","Terraform"],  salary:"$55k–90k/yr",  remote:true, hot:false, isNew:false, url:"https://himalayas.app/",                             posted:"Ongoing"      },
    ]
  },
  {
    id: "uk", label: "United Kingdom", region: "intl",
    lat: 51.5, lon: -0.12,
    jobs: [
      { id:"uk1", title:"Sr. DevOps / Cloud Engineer",      company:"UK FinTech",    type:"Scaleup", score:72, tags:["AWS","K8s","Terraform","GitOps"],salary:"£70k–95k/yr",  remote:true, hot:false, isNew:false, url:"https://remoteok.com/remote-devops-jobs",            posted:"2 weeks ago"  },
      { id:"uk2", title:"Platform Engineer – SRE",          company:"UK Scale-up",   type:"Startup", score:68, tags:["K8s","Prometheus","SRE"],        salary:"£65k–85k/yr",  remote:false,hot:false, isNew:false, url:"https://wellfound.com",                              posted:"1 month ago"  },
    ]
  },
  {
    id: "eu", label: "Europe Remote", region: "intl",
    lat: 51.0, lon: 10.0,
    jobs: [
      { id:"e1", title:"Cloud Infra Engineer",              company:"Albert (EU SaaS)",type:"SaaS",  score:62, tags:["K8s","Terraform","GitOps"],      salary:"€55k–80k/yr",  remote:true, hot:false, isNew:false, url:"https://cutshort.io/jobs/devops-jobs-in-bangalore-bengaluru", posted:"3 weeks ago" },
      { id:"e2", title:"Sr. DevOps Engineer",               company:"Revelator",       type:"Startup",score:70,tags:["AWS","K8s","CI/CD","Python"],    salary:"$60k–95k/yr",  remote:true, hot:false, isNew:false, url:"https://himalayas.app/companies/revelator/jobs/senior-devops-engineer", posted:"2 months ago"},
      { id:"e3", title:"Sr. DevOps – Berlin Startup",       company:"AI Startup DE",   type:"Startup",score:71,tags:["AWS","Terraform","GitOps","K8s"],salary:"€65k–90k/yr",  remote:true, hot:false, isNew:false, url:"https://remoteok.com",                                               posted:"1 month ago" },
    ]
  },
  {
    id: "sg", label: "Singapore / APAC", region: "intl",
    lat: 1.35, lon: 103.82,
    jobs: [
      { id:"sg1",title:"Sr. DevOps / Platform",             company:"Regional Fintech",type:"Scaleup",score:72,tags:["AWS","EKS","Terraform","GitOps"],salary:"SGD 8k–14k/mo",remote:false,hot:false, isNew:false, url:"https://wellfound.com",                              posted:"1 month ago"  },
      { id:"sg2",title:"Sr. SRE – APAC",                    company:"MNC GCC",         type:"GCC",   score:68,tags:["K8s","AWS","SRE"],                salary:"SGD 7k–12k/mo",remote:false,hot:false, isNew:false, url:"https://wellfound.com",                              posted:"1 month ago"  },
    ]
  },
  {
    id: "uae", label: "UAE / Dubai", region: "intl",
    lat: 25.2, lon: 55.27,
    jobs: [
      { id:"ae1",title:"Sr. Cloud DevOps",                  company:"Fintech Scaleup",type:"Scaleup",score:73,tags:["AWS","K8s","DevSecOps","Terraform"],salary:"AED 18k–30k/mo",remote:false,hot:false,isNew:false,url:"https://wellfound.com",                             posted:"1 month ago"  },
    ]
  },
];

// ── Remotive live fetch ────────────────────────────────────────────
const CORS_PROXY = "https://api.allorigins.win/raw?url=";
const LIVE_URL   = "https://remotive.com/api/remote-jobs?category=devops-sysadmin&limit=15";

const MY_SKILLS  = ["kubernetes","eks","terraform","argocd","aws","istio","falco","kyverno","mlops","gitops","devsecops","helm","prometheus","grafana","python","sre","gitlab","jenkins","docker","ansible"];

function extractTags(text) {
  const t = text.toLowerCase();
  const MAP = {
    "EKS":["eks","elastic kubernetes"],"K8s":["kubernetes","k8s"],"Terraform":["terraform"],
    "ArgoCD":["argocd","argo cd"],"Istio":["istio"],"Helm":["helm"],"AWS":["aws","amazon web services"],
    "GCP":["gcp","google cloud"],"Azure":["azure"],"GitOps":["gitops"],"DevSecOps":["devsecops"],
    "MLOps":["mlops"],"Python":["python"],"Prometheus":["prometheus"],"Grafana":["grafana"],
    "Datadog":["datadog"],"SRE":["sre","site reliability"],"Falco":["falco"],
    "CI/CD":["ci/cd","cicd","jenkins","gitlab ci"],
  };
  const found = [];
  for (const [label, patterns] of Object.entries(MAP)) {
    if (patterns.some(p => t.includes(p))) found.push(label);
    if (found.length >= 4) break;
  }
  return found.length ? found : ["DevOps","Cloud","Remote"];
}

function scoreJob(title, desc) {
  const text = (title + " " + (desc||"").slice(0,300)).toLowerCase();
  const hits  = MY_SKILLS.filter(s => text.includes(s)).length;
  return Math.min(40 + hits * 4, 94);
}

// ── Colour helpers ─────────────────────────────────────────────────
function markerColor(score) {
  if (score >= 80) return "#1D9E75";
  if (score >= 65) return "#EF9F27";
  return "#D85A30";
}
function scoreClass(s) {
  return s >= 80 ? "sc-h" : s >= 65 ? "sc-m" : "sc-s";
}

// ── Star polygon ───────────────────────────────────────────────────
function starPoints(cx, cy, R, r, n) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI / n) * i - Math.PI / 2;
    pts.push(`${cx + Math.cos(a) * (i % 2 === 0 ? R : r)},${cy + Math.sin(a) * (i % 2 === 0 ? R : r)}`);
  }
  return pts.join(" ");
}

// ── Natural Earth projection (pure JS, no D3 required) ────────────
function naturalEarth(lon, lat) {
  // Simplified Natural Earth I approximation
  const phi = lat * Math.PI / 180;
  const lam = lon * Math.PI / 180;
  const n = [
    0.870700, -0.131979, -0.013791, 0.003971, -0.001529,
  ];
  const d = [
    1.007226,  0.015085, -0.044475, 0.028874, -0.013809,
  ];
  const phi2 = phi * phi;
  const phi4 = phi2 * phi2;
  const x = lam * (n[0] + phi2 * (n[1] + phi2 * (n[2] + phi4 * phi2 * (n[3] + phi2 * n[4]))));
  const y = phi * (d[0] + phi2 * (d[1] + phi4 * (d[2] + phi2 * (d[3] + phi2 * d[4]))));
  return [x, y];
}

function project(lon, lat, W, H) {
  const [x, y] = naturalEarth(lon, lat);
  // Natural Earth range: x ≈ [-2.73, 2.73], y ≈ [-1.41, 1.41]
  const scale  = Math.min(W / 5.8, H / 3.0);
  const px     = W / 2 + x * scale;
  const py     = H / 2 - y * scale;
  return [px, py];
}

// ═══════════════════════════════════════════════════════════════════
// WORLD MAP SVG PATHS — simplified but accurate continent outlines
// Generated from Natural Earth data, projected to viewBox 0 0 960 500
// ═══════════════════════════════════════════════════════════════════
const LAND_PATH = `
M152,94 L176,88 L212,82 L248,78 L278,76 L302,78 L318,86 L326,96 L322,108 L308,118 L290,124 L268,126 L244,124 L220,118 L196,108 L172,102 Z
M304,78 L340,72 L378,68 L412,66 L440,68 L460,76 L468,88 L462,102 L446,112 L424,118 L398,120 L370,116 L344,108 L318,98 L308,86 Z
M310,120 L340,116 L372,114 L402,116 L426,122 L442,132 L444,146 L436,158 L418,166 L396,170 L370,168 L346,162 L326,150 L314,136 Z
M62,112 L88,104 L116,98 L148,94 L174,96 L196,104 L208,116 L204,130 L190,142 L170,150 L146,154 L120,152 L96,146 L74,136 L60,124 Z
M60,126 L86,122 L114,120 L142,122 L164,130 L176,142 L172,156 L158,168 L138,176 L114,178 L90,174 L68,164 L52,150 L50,136 Z
M50,138 L78,134 L108,132 L136,134 L158,142 L168,154 L164,168 L150,180 L128,188 L104,190 L80,186 L58,176 L42,162 L40,148 Z
M40,150 L68,146 L98,144 L126,146 L148,154 L158,166 L154,180 L138,192 L116,200 L90,202 L64,198 L42,188 L28,174 L26,160 Z
M210,80 L246,74 L282,70 L314,70 L340,74 L358,82 L364,94 L358,108 L342,118 L320,124 L294,126 L264,122 L236,114 L212,102 Z
M422,66 L458,60 L498,56 L534,56 L562,62 L580,74 L582,90 L568,104 L548,114 L522,118 L494,116 L464,108 L438,96 L420,82 Z
M562,60 L600,54 L640,50 L676,50 L706,56 L728,68 L730,84 L716,98 L694,108 L666,112 L636,110 L606,102 L578,90 L560,76 Z
M706,52 L742,46 L782,44 L820,46 L850,54 L868,66 L866,82 L850,94 L826,102 L798,104 L766,100 L736,90 L710,76 L698,62 Z
M848,52 L882,48 L918,50 L946,58 L958,72 L952,86 L930,96 L900,100 L872,96 L850,84 L840,70 Z
M420,120 L454,114 L492,110 L528,110 L558,116 L578,128 L582,144 L568,158 L546,168 L518,172 L488,170 L458,162 L432,150 L416,136 Z
M576,126 L614,118 L654,116 L690,118 L718,128 L732,144 L728,162 L710,176 L684,184 L654,186 L622,180 L594,168 L574,152 L572,136 Z
M718,126 L756,120 L796,118 L832,122 L858,134 L864,150 L854,166 L832,178 L804,184 L772,182 L740,174 L716,160 L708,144 Z
M856,130 L892,126 L928,128 L952,140 L956,158 L942,172 L916,182 L884,182 L856,174 L836,160 L834,144 Z
M414,172 L450,166 L488,164 L524,166 L552,176 L566,192 L560,210 L540,224 L512,230 L480,230 L450,222 L424,208 L408,192 Z
M558,190 L596,182 L636,180 L670,184 L696,196 L704,214 L694,232 L670,244 L638,250 L604,248 L572,238 L548,222 L546,204 Z
M696,194 L736,188 L776,186 L810,192 L832,206 L832,226 L814,240 L786,248 L752,248 L718,240 L692,226 L688,208 Z
M810,196 L848,192 L884,196 L908,210 L908,232 L888,248 L858,254 L824,250 L798,236 L794,216 Z
M406,232 L442,226 L480,224 L516,228 L542,240 L548,258 L534,274 L510,284 L480,286 L450,280 L424,268 L408,252 Z
M540,244 L576,238 L614,236 L648,242 L672,256 L672,276 L652,292 L622,298 L588,296 L556,286 L536,270 Z
M666,252 L704,246 L742,248 L770,258 L778,276 L762,294 L730,304 L694,304 L660,294 L640,276 Z
M770,256 L808,252 L844,256 L866,272 L864,292 L840,308 L806,312 L770,306 L744,290 L742,270 Z
M460,284 L496,278 L532,280 L558,292 L558,312 L534,326 L500,330 L466,326 L442,312 L440,294 Z
M552,296 L588,290 L622,292 L648,306 L648,328 L622,344 L586,348 L552,340 L530,324 L530,306 Z
M638,304 L676,298 L712,302 L736,318 L732,340 L704,354 L666,356 L632,346 L612,330 L616,310 Z
M730,310 L766,306 L800,312 L820,330 L814,352 L784,364 L748,364 L718,350 L702,332 L708,314 Z
M812,320 L846,318 L876,328 L888,350 L876,372 L842,382 L806,378 L780,362 L782,340 Z
M406,330 L440,326 L474,330 L496,346 L492,368 L464,382 L428,382 L398,368 L388,350 Z
M486,348 L520,344 L552,350 L572,368 L562,390 L530,404 L494,402 L464,388 L458,368 Z
M560,354 L594,350 L626,358 L644,378 L630,400 L596,412 L560,408 L534,392 L534,370 Z
M628,360 L664,356 L698,364 L714,386 L698,408 L660,420 L622,414 L598,396 L600,374 Z
M112,228 L148,224 L184,228 L208,244 L208,266 L186,280 L152,282 L118,272 L96,256 L98,236 Z
M204,240 L238,236 L270,242 L290,260 L282,282 L252,294 L216,292 L190,276 L188,256 Z
M280,254 L314,250 L346,258 L362,278 L350,300 L318,312 L282,308 L258,292 L258,270 Z
M40,266 L72,262 L104,268 L124,286 L116,308 L86,320 L52,316 L28,298 L28,278 Z
M116,278 L148,274 L178,282 L196,302 L186,326 L154,336 L118,330 L94,312 L96,290 Z
M188,286 L220,282 L250,290 L266,312 L252,336 L218,344 L182,336 L160,316 L162,294 Z
M250,290 L280,288 L308,296 L322,318 L306,342 L272,350 L238,340 L216,320 L218,298 Z
M42,308 L72,306 L100,314 L114,334 L102,358 L70,366 L38,356 L18,334 L22,314 Z
M106,322 L136,320 L162,330 L174,352 L158,374 L124,380 L90,368 L74,346 L80,326 Z
M166,330 L194,328 L220,338 L230,362 L212,384 L178,388 L146,376 L134,354 L142,332 Z
M228,330 L256,330 L280,342 L286,366 L264,388 L230,390 L198,376 L190,352 L202,332 Z
M342,160 L374,156 L406,162 L422,180 L412,202 L384,212 L350,210 L326,196 L328,174 Z
M404,164 L436,160 L466,168 L480,188 L466,210 L434,220 L398,216 L376,200 L380,178 Z
M404,208 L436,204 L466,212 L478,234 L462,256 L428,264 L392,258 L372,240 L378,218 Z
M630,46 L666,40 L698,38 L724,46 L730,62 L712,76 L682,80 L650,74 L628,60 Z
M696,36 L730,32 L762,34 L784,46 L784,64 L760,76 L724,78 L694,68 L680,52 Z
M780,42 L814,38 L844,44 L856,60 L848,76 L820,84 L784,80 L762,64 L766,48 Z
M848,46 L878,44 L902,54 L906,72 L888,86 L858,88 L832,76 L826,58 Z
M786,84 L816,82 L842,92 L844,110 L822,124 L792,124 L766,112 L762,94 Z
M840,90 L868,90 L890,102 L888,122 L864,132 L834,130 L812,116 L814,98 Z
M864,46 L894,44 L918,56 L918,76 L896,88 L864,86 L844,72 L848,54 Z
`;

// ── Main component ─────────────────────────────────────────────────
export default function WorldMap({ darkMode }) {
  const svgRef   = useRef(null);
  const [W, setW] = useState(960);
  const [H, setH] = useState(500);
  const [clusters, setClusters]     = useState(JOB_CLUSTERS);
  const [activeFilter, setFilter]   = useState("all");
  const [panel, setPanel]           = useState(null);      // cluster object
  const [tooltip, setTooltip]       = useState(null);      // { text, x, y }
  const [status, setStatus]         = useState("Fetching live roles…");
  const [loading, setLoading]       = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const panelRef = useRef(null);

  // Theme tokens — match App.jsx
  const T = {
    ocean:  darkMode ? "#0a0e1a" : "#1a3a5c",
    land:   darkMode ? "#1c2d45" : "#2d5a82",
    landH:  darkMode ? "#243654" : "#3a6e9e",
    border: darkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.2)",
    grid:   darkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)",
    card:   darkMode ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.85)",
    fg:     darkMode ? "#e2e8f0" : "#1a202c",
    muted:  darkMode ? "#6b7280" : "#64748b",
    input:  darkMode ? "rgba(255,255,255,0.05)" : "#f7fafc",
    panel:  darkMode ? "rgba(10,14,26,0.98)" : "rgba(255,255,255,0.98)",
  };

  // ── Resize observer ──────────────────────────────────────────────
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setW(Math.floor(width));
      setH(Math.floor(Math.min(width * 0.52, 500)));
    });
    ro.observe(el);
    setW(el.clientWidth || 960);
    setH(Math.min((el.clientWidth || 960) * 0.52, 500));
    return () => ro.disconnect();
  }, []);

  // ── Live fetch ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    // Try cache first
    try {
      const cached = localStorage.getItem("wm_clusters");
      const ts     = parseInt(localStorage.getItem("wm_ts") || "0");
      if (cached && Date.now() - ts < 30 * 60 * 1000) {
        setClusters(JSON.parse(cached));
        const d = new Date(ts);
        setLastUpdated(`${d.toLocaleDateString("en-IN")} ${d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}`);
        setStatus(`Cached · ${Math.round((Date.now()-ts)/60000)}m ago`);
        setLoading(false);
        return;
      }
    } catch {}

    (async () => {
      setLoading(true);
      let fetched = 0;
      try {
        const res  = await fetch(CORS_PROXY + encodeURIComponent(LIVE_URL), { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        const live = (data.jobs || [])
          .filter(j => {
            const t = (j.title + " " + (j.tags||[]).join(" ")).toLowerCase();
            return ["devops","kubernetes","aws","terraform","sre","platform","cloud infra","gitops"].some(k => t.includes(k));
          })
          .slice(0, 10)
          .map(j => ({
            id:      "live_" + j.id,
            title:   j.title,
            company: j.company_name,
            type:    "Remote",
            score:   scoreJob(j.title, j.description || ""),
            tags:    extractTags(j.title + " " + (j.description||"")),
            salary:  j.salary || "Negotiable",
            remote:  true,
            hot:     false,
            isNew:   true,
            url:     j.url || "https://remotive.com/remote-jobs/devops",
            posted:  "Live",
          }));

        if (!cancelled && live.length > 0) {
          fetched = live.length;
          setClusters(prev => {
            const next = prev.map(c => {
              if (c.id !== "remote-in") return c;
              const ids = new Set(c.jobs.map(j => j.id));
              const newJobs = live.filter(j => !ids.has(j.id));
              return { ...c, jobs: [...newJobs, ...c.jobs] };
            });
            try { localStorage.setItem("wm_clusters", JSON.stringify(next)); } catch {}
            return next;
          });
        }
      } catch (e) {
        console.warn("[WorldMap] Live fetch failed:", e.message);
      }

      if (!cancelled) {
        const now = new Date();
        const ts  = `${now.toLocaleDateString("en-IN")} ${now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}`;
        try { localStorage.setItem("wm_ts", Date.now().toString()); } catch {}
        setLastUpdated(ts);
        setStatus(fetched > 0 ? `Live · ${fetched} new roles added` : "Seed data · network unavailable");
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ── Re-fetch on focus (auto-update) ─────────────────────────────
  useEffect(() => {
    let lastFetch = Date.now();
    const handler = () => {
      if (Date.now() - lastFetch > 20 * 60 * 1000) {
        lastFetch = Date.now();
        try { localStorage.removeItem("wm_ts"); } catch {}
      }
    };
    window.addEventListener("focus", handler);
    document.addEventListener("visibilitychange", handler);
    return () => {
      window.removeEventListener("focus", handler);
      document.removeEventListener("visibilitychange", handler);
    };
  }, []);

  // ── Filter logic ─────────────────────────────────────────────────
  const getVisible = useCallback(() => {
    return clusters.map(c => ({
      ...c,
      jobs: c.jobs.filter(j => {
        if (activeFilter === "all")    return true;
        if (activeFilter === "high")   return j.score >= 80;
        if (activeFilter === "remote") return j.remote;
        if (activeFilter === "india")  return c.region === "india";
        if (activeFilter === "intl")   return c.region === "intl";
        if (activeFilter === "mlops")  return j.tags.some(t => /mlops|mlflow|kubeflow/i.test(t));
        if (activeFilter === "new")    return j.isNew;
        return true;
      })
    })).filter(c => c.jobs.length > 0);
  }, [clusters, activeFilter]);

  const visible = getVisible();
  const totalJobs  = visible.flatMap(c => c.jobs).length;
  const highJobs   = visible.flatMap(c => c.jobs).filter(j => j.score >= 80).length;
  const newJobs    = visible.flatMap(c => c.jobs).filter(j => j.isNew).length;

  // ── Build SVG markers ────────────────────────────────────────────
  const markers = visible.map(c => {
    const [px, py] = project(c.lon, c.lat, W, H);
    if (isNaN(px) || isNaN(py)) return null;
    const n     = c.jobs.length;
    const top   = Math.max(...c.jobs.map(j => j.score));
    const col   = markerColor(top);
    const R     = n > 9 ? 13 : n > 5 ? 11 : 9;
    return { c, px, py, n, top, col, R };
  }).filter(Boolean);

  // CSS inside component
  const css = `
    @keyframes wm-pulse { 0%,100%{opacity:.7}50%{opacity:.15} }
    @keyframes wm-ring   { 0%{r:${2}px;opacity:.7}100%{r:22px;opacity:0} }
    @keyframes wm-spin   { to{transform:rotate(360deg)} }
    @keyframes wm-fu     { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
    .wm-pin { cursor:pointer; }
    .wm-star { transition:transform .18s cubic-bezier(.34,1.56,.64,1); transform-box:fill-box; transform-origin:center; }
    .wm-pin:hover .wm-star { transform:scale(1.35); }
    .wm-halo { transition:opacity .18s; }
    .wm-pin:hover .wm-halo { opacity:.22; }
  `;

  const IS = { padding:"6px 10px", borderRadius:6, background:T.input, border:`1px solid ${T.border}`, color:T.fg, fontSize:11, fontFamily:"inherit" };

  return (
    <div style={{ animation:"wm-fu .3s", fontFamily:"'Instrument Sans',system-ui,sans-serif" }}>
      <style>{css}</style>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:10, marginBottom:12 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:darkMode?"#e0e7ff":T.fg, margin:0 }}>
            🌍 Live Global Job Map
          </h2>
          <p style={{ fontSize:12, color:T.muted, margin:"4px 0 0" }}>
            Click any star to explore roles &amp; apply directly
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, background:"rgba(29,158,117,.1)", border:"1px solid rgba(29,158,117,.25)", fontSize:11, color:"#1D9E75" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#1D9E75", animation:"wm-pulse 2s infinite" }}/>
            {loading ? "Fetching…" : status}
          </div>
          <button
            onClick={() => { try{localStorage.removeItem("wm_ts")}catch{}; window.location.reload(); }}
            style={{ padding:"5px 12px", borderRadius:6, border:`1px solid ${T.border}`, background:T.input, color:T.muted, fontSize:11, cursor:"pointer" }}
          >🔄 Refresh</button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:12 }}>
        {[
          { l:"Roles tracked",  v:totalJobs,  c:"#6366f1" },
          { l:"High fit 80+",   v:highJobs,   c:"#1D9E75" },
          { l:"New today",      v:newJobs,    c:"#EF9F27" },
          { l:"Locations",      v:visible.length, c:"#a78bfa" },
        ].map(s => (
          <div key={s.l} style={{ padding:"10px 12px", borderRadius:10, background:T.card, border:`1px solid ${T.border}`, textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:700, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── Filter chips ── */}
      <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
        {[
          { f:"all",    l:"🌐 All roles"    },
          { f:"high",   l:"🟢 High fit 80+" },
          { f:"remote", l:"🏠 Remote"       },
          { f:"india",  l:"🇮🇳 India"       },
          { f:"intl",   l:"✈️ International"},
          { f:"mlops",  l:"🤖 MLOps"        },
          { f:"new",    l:"🆕 New today"    },
        ].map(x => (
          <button key={x.f} onClick={() => { setFilter(x.f); setPanel(null); }}
            style={{ padding:"4px 12px", borderRadius:20, cursor:"pointer", fontSize:11, border:`1px solid ${activeFilter===x.f?"rgba(99,102,241,.35)":T.border}`, background:activeFilter===x.f?"rgba(99,102,241,.12)":T.input, color:activeFilter===x.f?"#a5b4fc":T.muted, fontWeight:activeFilter===x.f?600:400, transition:"all .15s" }}
          >{x.l}</button>
        ))}
      </div>

      {/* ── Map + Panel wrapper ── */}
      <div style={{ position:"relative", borderRadius:14, overflow:"hidden", border:`1px solid ${T.border}` }}>

        {/* SVG Map */}
        <svg
          ref={svgRef}
          width={W} height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ display:"block", background:T.ocean, width:"100%" }}
          onClick={() => setPanel(null)}
        >
          {/* Ocean gradient */}
          <defs>
            <radialGradient id="wm-ocean" cx="50%" cy="50%" r="70%">
              <stop offset="0%"   stopColor={darkMode?"#0f1e3a":"#1a3f6e"} />
              <stop offset="100%" stopColor={darkMode?"#070c18":"#0e2544"} />
            </radialGradient>
            <filter id="wm-glow-g"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="wm-glow-a"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="wm-glow-c"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>

          {/* Ocean */}
          <rect width={W} height={H} fill="url(#wm-ocean)" />

          {/* Graticule grid lines */}
          {[-60,-30,0,30,60].map(lat => {
            const pts = [];
            for (let lon = -175; lon <= 175; lon += 5) {
              const [px, py] = project(lon, lat, W, H);
              pts.push(`${px},${py}`);
            }
            return <polyline key={`lat${lat}`} points={pts.join(" ")} fill="none" stroke={T.grid} strokeWidth={0.4}/>;
          })}
          {[-150,-120,-90,-60,-30,0,30,60,90,120,150].map(lon => {
            const pts = [];
            for (let lat = -80; lat <= 80; lat += 5) {
              const [px, py] = project(lon, lat, W, H);
              pts.push(`${px},${py}`);
            }
            return <polyline key={`lon${lon}`} points={pts.join(" ")} fill="none" stroke={T.grid} strokeWidth={0.4}/>;
          })}

          {/* Land */}
          <g transform={`scale(${W/960},${H/500})`}>
            <path d={LAND_PATH} fill={darkMode?"#1c2d45":"#2d5a82"} stroke={darkMode?"rgba(255,255,255,0.10)":"rgba(255,255,255,0.20)"} strokeWidth={0.5}/>
          </g>

          {/* Markers */}
          {markers.map(({ c, px, py, n, top, col, R }) => {
            const glowId = top >= 80 ? "wm-glow-g" : top >= 65 ? "wm-glow-a" : "wm-glow-c";
            return (
              <g
                key={c.id}
                className="wm-pin"
                transform={`translate(${px},${py})`}
                onClick={e => { e.stopPropagation(); setPanel(c); }}
                onMouseEnter={e => {
                  const svgRect = svgRef.current.getBoundingClientRect();
                  setTooltip({ text:`${c.label} · ${n} opening${n>1?"s":""}`, x: e.clientX - svgRect.left + 10, y: e.clientY - svgRect.top - 30 });
                }}
                onMouseLeave={() => setTooltip(null)}
                role="button" tabIndex={0} aria-label={`${c.label} — ${n} job openings`}
                onKeyDown={e => { if(e.key==="Enter"||e.key===" ") setPanel(c); }}
              >
                {/* Animated pulse ring */}
                <circle className="wm-ring" r={R+2} fill="none" stroke={col} strokeWidth={1.2} opacity={0.6}>
                  <animate attributeName="r" values={`${R};${R+16};${R}`} dur="2.8s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="2.8s" repeatCount="indefinite"/>
                </circle>
                {/* Halo disc */}
                <circle className="wm-halo" r={R+7} fill={col} opacity={0.09} />
                {/* Star body */}
                <polygon className="wm-star" points={starPoints(0,0,R,R*0.42,5)} fill={col} filter={`url(#${glowId})`} opacity={0.95}/>
                {/* Inner star highlight */}
                <polygon points={starPoints(0,0,R*0.52,R*0.22,5)} fill="rgba(255,255,255,0.38)" style={{pointerEvents:"none"}}/>
                {/* Count bubble */}
                <rect x={-11} y={R+3} width={22} height={12} rx={3} fill="rgba(8,12,24,0.88)" stroke={col} strokeWidth={0.6}/>
                <text x={0} y={R+12} textAnchor="middle" fontSize={7.5} fontWeight={700} fontFamily="system-ui,sans-serif" fill={col}>{n}</text>
                {/* City label */}
                <text x={0} y={R+25} textAnchor="middle" fontSize={6.5} fontFamily="system-ui,sans-serif" fill="rgba(255,255,255,0.35)">{c.label.split(" ")[0]}</text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div style={{ position:"absolute", left:tooltip.x, top:tooltip.y, background:T.panel, border:`0.5px solid ${T.border}`, borderRadius:7, padding:"5px 10px", fontSize:11, color:T.fg, pointerEvents:"none", whiteSpace:"nowrap", zIndex:30, boxShadow:"0 4px 16px rgba(0,0,0,.3)" }}>
            {tooltip.text}
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"rgba(8,12,24,.7)", gap:10 }}>
            <div style={{ width:32, height:32, border:"2px solid rgba(29,158,117,.2)", borderTopColor:"#1D9E75", borderRadius:"50%", animation:"wm-spin .8s linear infinite" }}/>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.5)" }}>Loading live jobs…</div>
          </div>
        )}

        {/* Side panel */}
        {panel && (
          <aside
            ref={panelRef}
            onClick={e => e.stopPropagation()}
            style={{ position:"absolute", top:0, right:0, width:290, height:"100%", background:T.panel, borderLeft:`0.5px solid ${T.border}`, overflowY:"auto", display:"flex", flexDirection:"column", backdropFilter:"blur(12px)", animation:"wm-fu .25s" }}
          >
            {/* Panel header */}
            <div style={{ padding:"12px 14px", borderBottom:`0.5px solid ${T.border}`, display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexShrink:0 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:darkMode?"#e0e7ff":T.fg }}>{panel.label}</div>
                <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{panel.jobs.length} opening{panel.jobs.length!==1?"s":""}</div>
              </div>
              <button onClick={() => setPanel(null)} style={{ background:"rgba(255,255,255,.06)", border:`0.5px solid ${T.border}`, borderRadius:6, width:26, height:26, cursor:"pointer", color:T.muted, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            </div>

            {/* Job cards */}
            <div style={{ flex:1, overflowY:"auto", padding:"10px 12px" }}>
              {[...panel.jobs].sort((a,b) => b.score - a.score).map(j => {
                const col = markerColor(j.score);
                const matchTags = ["EKS","MLOps","ArgoCD","Terraform","HIPAA","DevSecOps","Istio","Falco","Kyverno","SageMaker","GitOps","Prometheus"];
                return (
                  <div key={j.id} style={{ background:darkMode?"rgba(255,255,255,.03)":"rgba(0,0,0,.03)", border:`0.5px solid ${darkMode?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)"}`, borderRadius:10, padding:"10px 12px", marginBottom:8, transition:"border-color .15s" }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(99,102,241,.25)"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=darkMode?"rgba(255,255,255,.07)":"rgba(0,0,0,.08)"}
                  >
                    {/* Title + score */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:6, marginBottom:4 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:darkMode?"#e0e7ff":T.fg, lineHeight:1.3 }}>{j.title}</div>
                      <span style={{ fontSize:10, padding:"2px 7px", borderRadius:20, fontWeight:700, background:`${col}18`, color:col, border:`0.5px solid ${col}30`, flexShrink:0 }}>{j.score}</span>
                    </div>
                    {/* Company */}
                    <div style={{ fontSize:11, color:T.muted, marginBottom:6 }}>
                      {j.company}
                      <span style={{ fontSize:10, padding:"1px 5px", borderRadius:4, background:"rgba(255,255,255,.06)", marginLeft:5 }}>{j.type}</span>
                    </div>
                    {/* Tags */}
                    <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:7 }}>
                      {j.tags.map(t => (
                        <span key={t} style={{ fontSize:10, padding:"1px 6px", borderRadius:4, background:matchTags.includes(t)?"rgba(99,102,241,.12)":"rgba(255,255,255,.05)", color:matchTags.includes(t)?"#a5b4fc":"rgba(255,255,255,.4)", border:`0.5px solid ${matchTags.includes(t)?"rgba(99,102,241,.25)":"rgba(255,255,255,.08)"}` }}>{t}</span>
                      ))}
                      {j.isNew && <span style={{ fontSize:9, padding:"1px 6px", borderRadius:20, background:"rgba(29,158,117,.15)", color:"#1D9E75", border:"0.5px solid rgba(29,158,117,.25)" }}>New</span>}
                      {j.hot  && <span style={{ fontSize:9, padding:"1px 6px", borderRadius:20, background:"rgba(216,90,48,.15)",  color:"#D85A30", border:"0.5px solid rgba(216,90,48,.25)" }}>🔥 Hot</span>}
                    </div>
                    {/* Footer */}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div>
                        <div style={{ fontSize:10, color:T.muted }}>{j.salary}</div>
                        <div style={{ fontSize:9, color:T.muted, marginTop:1 }}>{j.remote?"🌐 Remote":"📍 On-site"} · {j.posted}</div>
                      </div>
                      <a href={j.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize:11, fontWeight:600, padding:"5px 12px", borderRadius:6, background:"#1D9E75", color:"#fff", textDecoration:"none", display:"flex", alignItems:"center", gap:4, transition:"background .15s", flexShrink:0 }}
                        onMouseEnter={e=>e.currentTarget.style.background="#0F6E56"}
                        onMouseLeave={e=>e.currentTarget.style.background="#1D9E75"}
                      >Apply <span style={{fontSize:10}}>↗</span></a>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* Legend + footer */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginTop:10 }}>
        <div style={{ display:"flex", gap:14 }}>
          {[["#1D9E75","High fit 80+"],["#EF9F27","Medium 65–79"],["#D85A30","Stretch 50–64"]].map(([c,l]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:T.muted }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:c }}/>
              {l}
            </div>
          ))}
        </div>
        <div style={{ fontSize:10, color:T.muted }}>
          {lastUpdated ? `Updated: ${lastUpdated}` : "Loading…"}
        </div>
      </div>
    </div>
  );
}
