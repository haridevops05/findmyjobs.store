import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import WorldMap from "./WorldMap";

/* ═══════════════════════════════════════════════════════════════════
   FINDMYJOBS.STORE — COMMAND CENTER v13
   NEW: 🌍 World Map Tab — live global job map, auto-updates on open
   KEPT: All v12 features — Voice Interview, Resume Score, 29 Portals,
   9 AI Tools, Live Feed, Negotiation AI, Analytics, Resume Builder
   ═══════════════════════════════════════════════════════════════════ */

const DP={
  name:"Hari Krishna S.",title:"Senior DevOps Engineer — AWS & Cloud Infrastructure",
  email:"s.harikrishna.1205@gmail.com",phone:"+91 9491370132",loc:"Hyderabad, India",
  li:"linkedin.com/in/hari-devops",gh:"github.com/haridevops05",web:"harikrishna.dev",
  sum:"AWS Solutions Architect Professional with 6+ years designing, automating, and securing cloud-native infrastructure at enterprise scale. Specialized in Kubernetes (EKS, KOPS, AKS, OpenShift), Terraform, GitLab CI/CD, Jenkins, Istio Service Mesh, ArgoCD GitOps, and DevSecOps — delivering HA, secure, compliant platforms for distributed microservices and healthcare workloads.",
  skills:"AWS EKS,Terraform,GitLab CI/CD,Jenkins,ArgoCD,Argo Rollouts,Istio,Falco,Kyverno,Kube-Bench,Trivy,ESO,Docker,Kubernetes,Helm,Kustomize,Prometheus,Grafana,Datadog,EFK,Python,Ansible,OpenShift,SonarQube,GitHub Actions,KOPS,Azure AKS,Packer,Vault,CloudFormation,Jaeger,Kiali,Envoy",
  exp:"6+ years",certs:"AWS SA Professional, Red Hat OpenShift EX-280",
  highlights:"CI 45min→8min | Cost $1500→$300/mo | 15+ daily deploys | MTTR 2hrs→15min | CIS 94/100 | 99.9% uptime 20+ microservices | SOC2/HIPAA compliant | Zero hardcoded secrets",
  current:"Senior DevOps Engineer @ Brillio (prev. Accenture)",
  avail:"Immediate Joiner — Remote/Hybrid/Relocation",
};

const CORS="https://api.allorigins.win/raw?url=";
const DEVOPS_KW=["devops","aws","kubernetes","k8s","terraform","cloud","sre","platform engineer","infrastructure","devsecops","gitops","argocd","helm","docker","eks","azure","gcp","ansible","ci/cd","jenkins","gitlab","github actions","openshift","site reliability","cloud engineer","cloud architect","cloud infra"];
function isDevOps(t,tags,desc){const h=(t+" "+(tags||[]).join(" ")+" "+(desc||"").slice(0,200)).toLowerCase();return DEVOPS_KW.some(k=>h.includes(k));}
const FEEDS=[
  {id:"remoteok",name:"RemoteOK",url:"https://remoteok.com/api?tag=devops",p:"rok"},
  {id:"remoteok2",name:"RemoteOK AWS",url:"https://remoteok.com/api?tag=aws",p:"rok"},
  {id:"remotive",name:"Remotive",url:"https://remotive.com/api/remote-jobs?category=devops-sysadmin",p:"rem"},
  {id:"arbeitnow",name:"Arbeitnow",url:"https://www.arbeitnow.com/api/job-board-api?search=devops+aws+kubernetes",p:"abn"},
];
function parseJ(p,d){
  if(p==="rok")return(Array.isArray(d)?d:[]).filter(j=>j.position&&isDevOps(j.position,j.tags,"")).slice(0,20).map(j=>({id:"r"+j.id,t:j.position,co:j.company||"?",url:j.url||"https://remoteok.com",dt:j.date||new Date().toISOString(),tags:(j.tags||[]).slice(0,5),sal:j.salary_min?`$${(j.salary_min/1e3).toFixed(0)}k–$${(j.salary_max/1e3).toFixed(0)}k`:null,loc:j.location||"Remote (Worldwide)",src:"RemoteOK",desc:j.description||""}));
  if(p==="rem")return(d?.jobs||[]).filter(j=>isDevOps(j.title,[j.category],j.description)).slice(0,20).map(j=>({id:"m"+j.id,t:j.title,co:j.company_name,url:j.url,dt:j.publication_date,tags:[j.category,...(j.tags||[])].filter(Boolean).slice(0,5),sal:j.salary||null,loc:j.candidate_required_location||"Remote (Worldwide)",src:"Remotive",desc:j.description||""}));
  if(p==="abn")return(d?.data||[]).filter(j=>isDevOps(j.title,j.tags,"")).slice(0,20).map(j=>({id:"a"+j.slug,t:j.title,co:j.company_name,url:j.url,dt:j.created_at?new Date(j.created_at*1e3).toISOString():new Date().toISOString(),tags:(j.tags||[]).slice(0,5),sal:null,loc:j.location||"Remote (Worldwide)",src:"Arbeitnow",desc:j.description||""}));
  return[];
}
const DEMO=[
  {id:"d1",t:"Senior DevOps Engineer",co:"TechCorp Global",url:"https://remoteok.com/remote-devops-jobs",dt:new Date().toISOString(),tags:["kubernetes","aws","terraform","eks"],sal:"$150k–$200k",loc:"Remote (US)",src:"RemoteOK",desc:"Senior DevOps engineer: Kubernetes EKS, AWS, Terraform, CI/CD."},
  {id:"d2",t:"Cloud Platform Architect",co:"FinanceAI",url:"https://remotive.com/remote-jobs/devops",dt:new Date(Date.now()-36e5).toISOString(),tags:["aws","gitops","argocd","istio"],sal:"$160k–$200k",loc:"Remote",src:"Remotive",desc:"Cloud architect: GitOps ArgoCD, Istio service mesh, AWS infra."},
  {id:"d3",t:"DevSecOps Lead",co:"HealthStack",url:"https://remoteok.com/remote-devops-jobs",dt:new Date(Date.now()-72e5).toISOString(),tags:["devsecops","falco","kyverno","trivy"],sal:"$140k–$180k",loc:"Remote (EU/US)",src:"RemoteOK",desc:"Lead DevSecOps: Falco, Kyverno, Trivy. SOC2/HIPAA required."},
  {id:"d4",t:"SRE Engineer",co:"DataFlow",url:"https://remotive.com/remote-jobs/devops",dt:new Date(Date.now()-1e5*60).toISOString(),tags:["sre","prometheus","grafana","terraform"],sal:"$130k–$170k",loc:"Remote",src:"Remotive",desc:"SRE: Prometheus/Grafana, Terraform, 99.9% uptime."},
  {id:"d5",t:"Senior K8s Engineer",co:"CloudNative Labs",url:"https://remoteok.com/remote-devops-jobs",dt:new Date(Date.now()-2e5*60).toISOString(),tags:["kubernetes","helm","eks","jenkins"],sal:"$145k–$190k",loc:"Remote (US/EU)",src:"Arbeitnow",desc:"K8s engineer: EKS, Helm, CI/CD GitLab/Jenkins."},
];

const PL=[
  {id:1,n:"LinkedIn",t:"must",u:"https://linkedin.com/jobs/search/?keywords=Senior+DevOps+Engineer+Kubernetes+AWS&f_WT=2&sortBy=DD",au:"https://linkedin.com/jobs/search/?keywords=Senior+DevOps+Engineer+Kubernetes+AWS&f_WT=2&f_AL=true",as:"Search → 'Set Alert' → Daily",desc:"#1 professional network"},
  {id:2,n:"Naukri",t:"must",u:"https://naukri.com/senior-devops-engineer-jobs?k=senior+devops+engineer+kubernetes+aws&jobAge=1",au:"https://naukri.com/mnjuser/recommendedjob",as:"Profile → Job Alerts → Instant",desc:"India's #1 portal"},
  {id:3,n:"Indeed",t:"must",u:"https://indeed.com/jobs?q=Senior+DevOps+Engineer+Kubernetes+AWS&sort=date",au:"https://indeed.com/jobs?q=Senior+DevOps+Engineer",as:"Search → 'Activate' alert → Daily",desc:"Largest global engine"},
  {id:4,n:"Wellfound",t:"premium",u:"https://wellfound.com/role/r/devops-engineer",au:"https://wellfound.com/jobs",as:"Profile → Preferences → Notifications",desc:"Startups + equity"},
  {id:5,n:"Arc.dev",t:"premium",u:"https://arc.dev/remote-jobs/devops",au:"https://arc.dev/remote-jobs/devops",as:"Create profile → Get matched",desc:"Vetted, US rates"},
  {id:6,n:"Turing",t:"premium",u:"https://turing.com",au:"https://turing.com/developer",as:"Sign up → Profile → AI matches",desc:"AI-matched, USD"},
  {id:7,n:"Toptal",t:"premium",u:"https://toptal.com",au:"https://toptal.com",as:"Apply → Screen → Matched",desc:"Top 3% elite"},
  {id:8,n:"Y Combinator",t:"premium",u:"https://workatastartup.com",au:"https://workatastartup.com",as:"Profile → Preferences",desc:"YC startups"},
  {id:9,n:"RemoteOK",t:"major",u:"https://remoteok.com/remote-devops-jobs",au:"https://remoteok.com/remote-devops-jobs",api:true,as:"Email at bottom",desc:"Remote startups — LIVE API ✓"},
  {id:10,n:"Remotive",t:"major",u:"https://remotive.com/remote-jobs/devops",au:"https://remotive.com/remote-jobs/devops",api:true,as:"Newsletter subscribe",desc:"152K+ curated — LIVE API ✓"},
  {id:11,n:"WWR",t:"major",u:"https://weworkremotely.com/categories/remote-devops-sysadmin-jobs",au:"https://weworkremotely.com",as:"Email subscribe",desc:"We Work Remotely"},
  {id:12,n:"Dice",t:"major",u:"https://dice.com/jobs?q=Senior+DevOps+Engineer&filters.isRemote=true&sort=date",au:"https://dice.com/jobs?q=Senior+DevOps+Engineer",as:"Save search → Alerts",desc:"Tech + salary insights"},
  {id:13,n:"Built In",t:"major",u:"https://builtin.com/jobs/remote/devops",au:"https://builtin.com/jobs/remote/devops",as:"Account → Save → Digest",desc:"Tech culture + remote"},
  {id:14,n:"ZipRecruiter",t:"major",u:"https://ziprecruiter.com/jobs-search?search=Senior+DevOps+Engineer",au:"https://ziprecruiter.com/candidate/suggested-jobs",as:"Save → Daily alerts",desc:"AI matching"},
  {id:15,n:"Arbeitnow",t:"major",u:"https://www.arbeitnow.com/jobs?search=devops",au:"https://www.arbeitnow.com/jobs?search=devops",api:true,desc:"EU jobs — LIVE API ✓"},
  {id:16,n:"Stack Overflow",t:"major",u:"https://stackoverflow.com/jobs?q=devops",au:"https://stackoverflow.com/jobs?q=devops",as:"Save search",desc:"Dev community"},
  {id:17,n:"FlexJobs",t:"spec",u:"https://flexjobs.com/search?search=devops",au:"https://flexjobs.com/search?search=devops",as:"Save → Alert",desc:"Vetted remote"},
  {id:18,n:"Jobspresso",t:"spec",u:"https://jobspresso.co/remote-devops-jobs/",au:"https://jobspresso.co",as:"RSS/email",desc:"Curated premium"},
  {id:19,n:"SimplyHired",t:"spec",u:"https://simplyhired.com/search?q=senior+devops",au:"https://simplyhired.com/search?q=senior+devops",as:"Create alert",desc:"Aggregator"},
  {id:20,n:"Remote.co",t:"spec",u:"https://remote.co/remote-jobs/devops/",au:"https://remote.co/remote-jobs/devops/",desc:"Remote listings"},
  {id:21,n:"Working Nomads",t:"spec",u:"https://workingnomads.com/jobs?category=devops",au:"https://workingnomads.com/jobs?category=devops",as:"Email subscribe",desc:"Nomad roles"},
  {id:22,n:"JustRemote",t:"spec",u:"https://justremote.co/remote-devops-jobs",au:"https://justremote.co/remote-devops-jobs",as:"Email alert",desc:"Clean interface"},
  {id:23,n:"Pangian",t:"spec",u:"https://pangian.com/job-travel-remote/",au:"https://pangian.com/job-travel-remote/",as:"Account → Alerts",desc:"Global network"},
  {id:24,n:"Remote Rocketship",t:"spec",u:"https://remoterocketship.com",au:"https://remoterocketship.com",as:"Email subscribe",desc:"Aggregator"},
  {id:25,n:"Europe Remotely",t:"reg",u:"https://europeremotely.com",au:"https://europeremotely.com",desc:"EU remote"},
  {id:26,n:"EU Remote",t:"reg",u:"https://euremotejobs.com",au:"https://euremotejobs.com",desc:"EU positions"},
  {id:27,n:"Remote Asia",t:"reg",u:"https://remoteofasia.com",au:"https://remoteofasia.com",desc:"Asia remote"},
  {id:28,n:"Monster",t:"gen",u:"https://monster.com/jobs/search?q=Senior+DevOps+Engineer",au:"https://monster.com/jobs/search?q=Senior+DevOps+Engineer",as:"Save → Alert",desc:"Traditional board"},
  {id:29,n:"Totaljobs",t:"gen",u:"https://totaljobs.com/jobs/devops",au:"https://totaljobs.com/jobs/devops",as:"Save → Daily",desc:"UK's largest"},
];
const TC={must:"#ef4444",premium:"#f59e0b",major:"#6366f1",spec:"#8b5cf6",reg:"#10b981",gen:"#6b7280"};
const TL={must:"🔴 Must-Have",premium:"⭐ Premium",major:"◆ Major",spec:"◈ Specialized",reg:"◉ Regional",gen:"○ General"};
const ST=["—","Alert ✓","Applied","Screen","Interview","Offer 🎉","Rejected"];
const STC={"—":"#4b5563","Alert ✓":"#6366f1","Applied":"#f59e0b","Screen":"#06b6d4","Interview":"#a78bfa","Offer 🎉":"#10b981","Rejected":"#ef4444"};

const ROADMAP=[
  {id:"twin",title:"Digital Twin Auto-Apply",icon:"🤖",desc:"Browser extension that auto-fills & submits applications while you sleep",stack:"Chrome Manifest V3 + Plasmo + Pinecone + Playwright Stealth",status:"Architecture Ready",difficulty:"Hard",details:"Profile Vector DB embeds your resume into Pinecone. Puppeteer cluster crawls boards, extracts JDs. When match >80%, auto-fills forms. Human-in-the-loop: Telegram notification with one-click Approve before submit."},
  {id:"ghost",title:"Ghost Recruiter Network",icon:"👻",desc:"Monitor 50+ private Slack/Discord/Telegram channels for hidden jobs",stack:"Discord.js + Slack Bolt + Telegram MTProto + BERT NLP",status:"Architecture Ready",difficulty:"Medium",details:"Deploy bots across DevOps communities (K8s Slack, DevOps Discord, HangOps). Fine-tuned BERT detects 'we're hiring' messages. Private aggregator shows jobs 99% never see."},
  {id:"market",title:"Salary Arbitrage System",icon:"💰",desc:"Make companies bid for you with anonymous talent profiles",stack:"Next.js + Stripe + LinkedIn Ads API + Plausible",status:"Concept",difficulty:"Medium",details:"Anonymous landing page showcasing skills. Micro-budget LinkedIn/Twitter ads targeting DevOps recruiters ($5/day). Reverse auction: companies submit blind offers."},
  {id:"genetic",title:"Resume Genetic Algorithm",icon:"🧬",desc:"Evolve your resume through A/B testing generations",stack:"Python DEAP + pyresparser + Bayesian optimization",status:"Concept",difficulty:"Hard",details:"Break resume into modular genome. Multi-armed bandit submits variants to different postings. Fitness function: ATS pass → recruiter call → interview."},
  {id:"terminal",title:"Predictive Job Market Terminal",icon:"📈",desc:"Bloomberg Terminal for DevOps job markets",stack:"Temporal.io + ClickHouse + Prophet/ARIMA + Crunchbase API",status:"Architecture Ready",difficulty:"Very Hard",details:"Real-time data lake: job postings + layoff announcements + funding rounds. Leading indicator: 'Company raised $50M + 0 DevOps posts → hiring in 2 weeks'."},
  {id:"referralnet",title:"Virtual Referral Network",icon:"🔗",desc:"Automate referral discovery — 40% hire rate vs 3% cold apply",stack:"LinkedIn API + NetworkX + GPT-4 + Airtable CRM",status:"Architecture Ready",difficulty:"Medium",details:"LinkedIn 2nd-degree connection analysis. Score connections by engagement likelihood, seniority, dept match. AI drafts personalized referral asks."},
  {id:"compete",title:"Competitive Intelligence",icon:"🕵️",desc:"Track other applicants on the same jobs",stack:"Web scraping + OCR + Time-series DB + ML classification",status:"Concept",difficulty:"Hard",details:"Scrape 'X applicants' counts. Competitor profile analysis. Gap analysis: '47 applicants, only 3 have Terraform cert → your advantage'."},
  {id:"swarm",title:"Job Hunt Drone Swarm",icon:"🐝",desc:"100+ lightweight bots each monitoring one niche source 24/7",stack:"Cloudflare Workers + Durable Objects + WebSocket",status:"Architecture Ready",difficulty:"Hard",details:"Each bot = 1 Cloudflare Worker monitoring 1 source. Central command aggregates hits. Swarm intelligence: bots communicate patterns."},
  {id:"negocop",title:"Live Negotiation Copilot",icon:"🎙️",desc:"Real-time AI coaching during salary calls via earpiece",stack:"Whisper API + GPT-4 + Levels.fyi + Monte Carlo simulation",status:"Concept",difficulty:"Very Hard",details:"Real-time transcription during salary calls. AI suggests counter-arguments and tactics. Equity value calculator using Monte Carlo simulation."},
];

const AI_BTNS=[
  {ty:"score",lb:"🎯 Score",c:"#10b981"},
  {ty:"cover",lb:"✉️ Cover",c:"#6366f1"},
  {ty:"interview",lb:"🎤 Interview",c:"#a78bfa"},
  {ty:"resume",lb:"📄 Resume",c:"#f59e0b"},
  {ty:"ats",lb:"🔍 ATS",c:"#06b6d4"},
  {ty:"research",lb:"🏢 Research",c:"#ec4899"},
  {ty:"compete",lb:"🏆 Edge",c:"#14b8a6"},
  {ty:"referral",lb:"🤝 Referral",c:"#f97316"},
  {ty:"elevator",lb:"🗣️ Pitch",c:"#8b5cf6"},
];
const AI_LABELS={score:"Match Analysis",cover:"Cover Letter",interview:"Interview Prep",resume:"Resume Tips",elevator:"Elevator Pitch",ats:"ATS Analysis",research:"Company Intel",compete:"Competitive Edge",referral:"Referral Messages"};

function safeBeep(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=new A();(c.state==="suspended"?c.resume():Promise.resolve()).then(()=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;o.type="sine";g.gain.setValueAtTime(.1,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.3);o.start();o.stop(c.currentTime+.3);o.onended=()=>c.close()}).catch(()=>{})}catch{}}

async function callOllama(prompt,model,maxTokens){
  const r=await fetch("http://localhost:11434/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model,prompt,stream:false,options:{num_predict:maxTokens,temperature:0.7}})});
  if(!r.ok)throw new Error(`Ollama HTTP ${r.status}`);
  const d=await r.json();return d.response||"No response";
}

async function callGemini(prompt,apiKey,maxTokens){
  const MODELS=["gemini-1.5-flash-latest","gemini-1.5-flash","gemini-1.0-pro"];
  for(const model of MODELS){
    try{
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:maxTokens,temperature:0.7}})});
      if(!r.ok){const e=await r.json();const msg=e.error?.message||"";if(msg.includes("quota")||msg.includes("rate")||msg.includes("limit")){continue;}throw new Error(msg||`HTTP ${r.status}`)}
      const d=await r.json();return d.candidates?.[0]?.content?.parts?.[0]?.text||"No response";
    }catch(e){if(e.message?.includes("quota")||e.message?.includes("rate")||e.message?.includes("limit")){continue;}throw e;}
  }
  throw new Error("All Gemini models rate limited. Wait 1 min or switch to Ollama.");
}

async function callAI(prompt,maxTokens=1200){
  const mode=localStorage.getItem("fmj_ai_mode")||"gemini";
  const ollamaModel=localStorage.getItem("fmj_ollama_model")||"llama3";
  const geminiKey=localStorage.getItem("fmj_api_key")||"";
  if(mode==="auto"){
    try{return await callOllama(prompt,ollamaModel,maxTokens);}
    catch{
      if(!geminiKey)return"⚠️ Ollama not running + no Gemini key set.\nEither start Ollama or add a Gemini key in Settings.";
      try{return await callGemini(prompt,geminiKey,maxTokens);}
      catch(e){return`AI Error: ${e.message}`}
    }
  }
  if(mode==="ollama"){
    try{return await callOllama(prompt,ollamaModel,maxTokens);}
    catch(e){return`⚠️ Ollama Error: ${e.message}\n\nMake sure Ollama is running:\n  1. Install from ollama.com\n  2. Run: ollama serve\n  3. Pull model: ollama pull ${ollamaModel}`}
  }
  if(!geminiKey)return"⚠️ No Gemini API Key.\n\nGo to ⚙️ Settings → add your free key from aistudio.google.com\nOR switch to Ollama mode for unlimited local AI.";
  try{return await callGemini(prompt,geminiKey,maxTokens);}
  catch(e){return`AI Error: ${e.message}`}
}

function ago(d){if(!d)return"—";const m=Math.floor((Date.now()-new Date(d).getTime())/6e4);if(m<1)return"now";if(m<60)return m+"m";const h=Math.floor(m/60);return h<24?h+"h":Math.floor(h/24)+"d";}
function tstr(d){try{return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"})}catch{return""}}
function useDebounce(v,d){const[dv,setDv]=useState(v);useEffect(()=>{const h=setTimeout(()=>setDv(v),d);return()=>clearTimeout(h)},[v,d]);return dv;}

// ═══════════════════════════════════════════════════════════════════
export default function App(){
  const[darkMode,setDarkMode]=useState(true);
  const[profile,setProfile]=useState(DP);
  const[editP,setEditP]=useState(false);
  const[pDraft,setPDraft]=useState(DP);
  const[tab,setTab]=useState("worldmap"); // ← DEFAULT to world map on open

  const[ps,setPs]=useState(()=>{try{const s=JSON.parse(localStorage.getItem("fmj_ps")||"null");if(s)return s}catch{}return PL.reduce((a,p)=>{a[p.id]={st:"—",ck:null,notes:"",star:false};return a},{})});
  const[expId,setExpId]=useState(null);
  const[pSrch,setPSrch]=useState("");
  const[pFlt,setPFlt]=useState("all");
  const dPSrch=useDebounce(pSrch,300);

  const[jobs,setJobs]=useState([]);
  const[seen,setSeen]=useState(()=>{try{return new Set(JSON.parse(localStorage.getItem("fmj_seen")||"[]"))}catch{return new Set()}});
  const[fresh,setFresh]=useState(new Set());
  const[loading,setLoading]=useState(false);
  const[lastF,setLastF]=useState(null);
  const[autoR,setAutoR]=useState(true);
  const[feedF,setFeedF]=useState("all");
  const[banner,setBanner]=useState(null);
  const[demo,setDemo]=useState(false);
  const[fErr,setFErr]=useState([]);
  const[searchInput,setSearchInput]=useState("");
  const[activeSearch,setActiveSearch]=useState("");
  const[locFilter,setLocFilter]=useState("");
  const[activeLocFilter,setActiveLocFilter]=useState("");
  const[sortBy,setSortBy]=useState("recent");

  const[scores,setScores]=useState(()=>{try{return JSON.parse(localStorage.getItem("fmj_scores")||"{}")}catch{return{}}});
  const[aiJob,setAiJob]=useState(null);
  const[aiType,setAiType]=useState(null);
  const[aiOut,setAiOut]=useState("");
  const[aiLoad,setAiLoad]=useState(false);

  const[negoIn,setNegoIn]=useState("");
  const[negoOut,setNegoOut]=useState("");
  const[negoLoad,setNegoLoad]=useState(false);

  const[cpd,setCpd]=useState(null);
  const[roadmapOpen,setRoadmapOpen]=useState(null);

  const[apiKey,setApiKey]=useState(()=>localStorage.getItem("fmj_api_key")||"");
  const[apiSaved,setApiSaved]=useState(false);

  const[resumeFile,setResumeFile]=useState(null);
  const[resumeText,setResumeText]=useState("");
  const[resumeScore,setResumeScore]=useState(null);
  const[resumeLoading,setResumeLoading]=useState(false);
  const[resumeTarget,setResumeTarget]=useState("Senior DevOps Engineer");
  const resumeFileRef=useRef(null);

  const[researchJob,setResearchJob]=useState(null);
  const[researchOut,setResearchOut]=useState({});
  const[researchLoad,setResearchLoad]=useState(null);

  const[resumeBlocks,setResumeBlocks]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("fmj_rblocks")||"null")||[
      {id:"b1",cat:"CI/CD",title:"CI/CD Pipeline Transformation @ Brillio",content:"Redesigned GitLab CI/CD pipelines cutting build time from 45min→8min (82%) and CI costs $1,500→$300/mo.",tags:["gitlab","ci/cd","docker","jenkins"],impact:"82% faster builds, 80% cost reduction"},
      {id:"b2",cat:"Kubernetes",title:"AWS EKS Production Platform @ Brillio",content:"Architected multi-cluster AWS EKS running 20+ microservices at 99.9% uptime with Karpenter autoscaling.",tags:["eks","kubernetes","argocd","helm"],impact:"99.9% uptime, 15+ daily deploys"},
      {id:"b3",cat:"DevSecOps",title:"DevSecOps Hardening — SOC2/HIPAA @ Brillio",content:"Led security hardening for HIPAA-compliant platform. Deployed Falco, Kyverno, Kube-Bench. CIS 67%→94%.",tags:["falco","kyverno","trivy","vault","hipaa","soc2"],impact:"CIS 94/100, zero secrets violations"},
      {id:"b4",cat:"Service Mesh",title:"Istio Service Mesh Implementation @ Brillio",content:"Deployed Istio on EKS with mTLS, traffic management via Argo Rollouts canary/blue-green, Jaeger/Kiali tracing.",tags:["istio","envoy","jaeger","kiali","mtls"],impact:"100% mTLS coverage, zero-downtime deployments"},
      {id:"b5",cat:"Observability",title:"Full-Stack Observability Platform @ Brillio",content:"Built Prometheus+Grafana, EFK, Jaeger, Datadog APM. Reduced MTTR from 2hrs→15min (87%).",tags:["prometheus","grafana","datadog","opentelemetry"],impact:"87% MTTR reduction, 40+ runbooks"},
      {id:"b6",cat:"IaC",title:"Terraform Infrastructure Automation @ Brillio",content:"Managed 50+ Terraform modules for AWS (VPC, EKS, RDS). Remote state with S3+DynamoDB, Terragrunt DRY.",tags:["terraform","aws","iac","terragrunt"],impact:"100% IaC coverage, 3 environments"},
      {id:"b7",cat:"MLOps",title:"MLOps Platform — ML Retraining Pipeline @ Brillio",content:"Built Kubeflow-based MLOps platform reducing ML retraining from 2 weeks→30min. Airflow, MLflow, GPU auto-provisioning.",tags:["mlops","kubeflow","airflow","mlflow"],impact:"ML training 2 weeks→30min"},
      {id:"b8",cat:"Incident Response",title:"Incident Response & SRE Practices @ Brillio",content:"Led SRE practices: SLOs/SLIs/error budgets for 20+ services. P1 MTTR 5min for known issues. Blameless post-mortems.",tags:["sre","incident","slo","sli"],impact:"P1 MTTR 5min, 60% fewer repeats"},
    ]}catch{return[]}
  });
  const[selectedBlocks,setSelectedBlocks]=useState([]);
  const[rvJob,setRvJob]=useState("");
  const[rvOut,setRvOut]=useState("");
  const[rvLoad,setRvLoad]=useState(false);
  const[editingBlock,setEditingBlock]=useState(null);
  const[newBlock,setNewBlock]=useState(null);

  const[ivActive,setIvActive]=useState(false);
  const[ivRole,setIvRole]=useState("Senior DevOps Engineer");
  const[ivCompany,setIvCompany]=useState("");
  const[ivMessages,setIvMessages]=useState([]);
  const[ivLoading,setIvLoading]=useState(false);
  const[ivListening,setIvListening]=useState(false);
  const[ivSpeaking,setIvSpeaking]=useState(false);
  const[ivVoiceOn,setIvVoiceOn]=useState(true);
  const[ivTranscript,setIvTranscript]=useState("");
  const[ivEnded,setIvEnded]=useState(false);

  const synthRef=useRef(window.speechSynthesis);
  const recRef=useRef(null);
  const chatRef=useRef(null);
  const intRef=useRef(null);

  useEffect(()=>{localStorage.setItem("fmj_seen",JSON.stringify([...seen]))},[seen]);
  useEffect(()=>{localStorage.setItem("fmj_scores",JSON.stringify(scores))},[scores]);
  useEffect(()=>{localStorage.setItem("fmj_ps",JSON.stringify(ps))},[ps]);
  useEffect(()=>{localStorage.setItem("fmj_rblocks",JSON.stringify(resumeBlocks))},[resumeBlocks]);
  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight},[ivMessages,ivTranscript]);

  useEffect(()=>{
    const h=(e)=>{
      if(e.ctrlKey||e.metaKey){
        const map={"1":"worldmap","2":"live","3":"portals","4":"interview","5":"resume_score","6":"alerts","7":"nego","8":"funnel","9":"profile","0":"settings"};
        if(map[e.key]){e.preventDefault();setTab(map[e.key]);}
      }
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[]);

  const upd=(id,u)=>setPs(p=>({...p,[id]:{...p[id],...u}}));
  const cyc=id=>{const i=ST.indexOf(ps[id].st);upd(id,{st:ST[(i+1)%ST.length]})};
  const cp=async(t,f)=>{try{await navigator.clipboard.writeText(t);setCpd(f);setTimeout(()=>setCpd(null),2e3)}catch{}};
  const profStr=()=>`${profile.name} | ${profile.title} | ${profile.exp}\nSkills: ${profile.skills}\nCerts: ${profile.certs}\nMetrics: ${profile.highlights}\nCurrent: ${profile.current}\nSummary: ${profile.sum}`;

  const runDeepResearch=async(job)=>{
    setResearchJob(job.id);setResearchLoad(job.id);
    const cached=researchOut[job.id];if(cached){setResearchLoad(null);return;}
    const r=await callAI(`You are an elite tech researcher. Research this company for a DevOps candidate.\n\nCOMPANY: ${job.co}\nROLE: ${job.t}\nJD: ${(job.desc||"").slice(0,400)}\n\nProvide:\n🏢 COMPANY SNAPSHOT\n💻 TECH STACK INTEL\n📈 GROWTH SIGNALS\n🎯 WHY HIRING\n🗣️ INTERVIEW POWER MOVES\n⚠️ RED FLAGS`,1800);
    setResearchOut(prev=>({...prev,[job.id]:r}));
    setResearchLoad(null);
  };

  const runResumeVersion=async()=>{
    if(!rvJob.trim())return;setRvLoad(true);setRvOut("");
    const blockList=resumeBlocks.map((b,i)=>`[${i+1}] ${b.cat}: ${b.title}\nTags: ${b.tags.join(", ")}\nImpact: ${b.impact}`).join("\n\n");
    const r=await callAI("You are an elite resume strategist. Target job: "+rvJob+"\n\nCandidate: "+profStr()+"\n\nBlocks:\n"+blockList+"\n\nTASK:\n1.BLOCK SELECTION: Pick 5 BEST blocks\n2.TAILORED SUMMARY\n3.SKILLS: 15 most relevant\n4.ATS KEYWORDS: 10\n5.HEADLINE: 1 powerful line",1800);
    setRvOut(r);setRvLoad(false);
  };

  const generatePDF=()=>{
    const selectedB=resumeBlocks.filter((_,i)=>selectedBlocks.includes(i));
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>body{font-family:Georgia,serif;max-width:850px;margin:0 auto;padding:40px;color:#1a1a1a;font-size:13px;line-height:1.5}h1{font-size:22px;margin:0}h2{font-size:11px;color:#6366f1;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 2px}.section-title{font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#6366f1;border-bottom:1.5px solid #6366f1;padding-bottom:2px;margin:14px 0 8px}.block{margin-bottom:10px}.block-title{font-weight:bold}.block-content{font-size:12px;color:#333;margin:3px 0}.block-impact{font-size:11px;color:#10b981;font-weight:bold}.tag{display:inline-block;background:#f0f4ff;color:#6366f1;border-radius:3px;padding:1px 5px;font-size:9px;margin:1px}.skill{background:#f0f4ff;color:#6366f1;border-radius:4px;padding:3px 8px;font-size:11px;display:inline-block;margin:2px}</style></head><body>
      <h1>${profile.name}</h1><h2>${profile.title}</h2>
      <div style="font-size:11px;color:#555;margin:4px 0 16px">${profile.email} · ${profile.phone} · ${profile.loc} · ${profile.web}</div>
      <div class="section-title">Summary</div><div style="border-left:3px solid #6366f1;padding-left:10px;font-size:13px">${profile.sum}</div>
      <div class="section-title">Key Metrics</div><div style="border-left:3px solid #10b981;padding-left:10px;font-size:12px;color:#10b981">${profile.highlights}</div>
      <div class="section-title">Experience</div>${selectedB.map(b=>`<div class="block"><div style="font-size:9px;color:#6366f1;text-transform:uppercase">${b.cat}</div><div class="block-title">${b.title}</div><div class="block-content">${b.content}</div><div class="block-impact">📈 ${b.impact}</div><div>${b.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div></div>`).join("")}
      <div class="section-title">Skills</div><div>${profile.skills.split(",").map(s=>`<span class="skill">${s.trim()}</span>`).join("")}</div>
      <div class="section-title">Certifications</div><p style="font-size:12px">${profile.certs}</p>
    </body></html>`;
    const w=window.open("","_blank");w.document.write(html);w.document.close();setTimeout(()=>w.print(),500);
  };

  const speak=useCallback((text,onEnd)=>{
    try{
      synthRef.current.cancel();
      const u=new SpeechSynthesisUtterance(text.replace(/[*#🎯✅⚠️📊💡🔍📝🏢🚩⭐🎙️]/g,""));
      u.rate=0.92;u.pitch=1.0;
      u.onstart=()=>setIvSpeaking(true);
      u.onend=()=>{setIvSpeaking(false);if(onEnd)onEnd()};
      u.onerror=()=>{setIvSpeaking(false);if(onEnd)onEnd()};
      synthRef.current.speak(u);
    }catch{setIvSpeaking(false);if(onEnd)onEnd()}
  },[]);

  const stopSpeaking=()=>{try{synthRef.current.cancel();setIvSpeaking(false)}catch{}};

  const startListening=useCallback(()=>{
    try{
      const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!SR){alert("Speech recognition not available. Use Chrome or Edge.");return;}
      if(recRef.current){try{recRef.current.stop()}catch{}}
      const rec=new SR();
      rec.continuous=true;rec.interimResults=true;rec.lang="en-US";
      setIvListening(true);setIvTranscript("");
      rec.onresult=(e)=>{
        let interim="",final="";
        for(let i=e.resultIndex;i<e.results.length;i++){
          if(e.results[i].isFinal)final+=e.results[i][0].transcript;
          else interim+=e.results[i][0].transcript;
        }
        setIvTranscript(prev=>(prev+final)||interim);
      };
      rec.onerror=(e)=>{console.warn("Mic:",e.error);setIvListening(false)};
      rec.onend=()=>setIvListening(false);
      rec.start();recRef.current=rec;
    }catch(e){alert("Mic error: "+e.message)}
  },[]);

  const stopListening=useCallback(()=>{
    try{if(recRef.current)recRef.current.stop()}catch{}
    setIvListening(false);
  },[]);

  const INTERVIEWER_SYSTEM=()=>`You are a senior technical interviewer at a top tech company interviewing ${profile.name} for: ${ivRole}${ivCompany?` at ${ivCompany}`:""}\n\nCANDIDATE PROFILE:\n${profStr()}\n\nRULES:\n- Ask ONE question at a time\n- Base questions on their ACTUAL resume metrics\n- Give brief feedback then ask next question\n- Keep under 120 words\n- Wrap up naturally after 15-25 min of conversation`;

  const startInterview=async()=>{
    if(!ivRole.trim())return;
    setIvActive(true);setIvMessages([]);setIvEnded(false);setIvLoading(true);
    const opening=await callAI(`${INTERVIEWER_SYSTEM()}\n\nGreet warmly and ask your FIRST question specific to their resume. Under 80 words total.`,300);
    setIvMessages([{role:"ai",text:opening,ts:Date.now()}]);
    setIvLoading(false);
    if(ivVoiceOn)speak(opening);
  };

  const sendAnswer=async(answer)=>{
    if(!answer.trim()||ivLoading||ivEnded)return;
    stopSpeaking();setIvTranscript("");
    const userMsg={role:"user",text:answer,ts:Date.now()};
    setIvMessages(h=>[...h,userMsg]);setIvLoading(true);
    const history=[...ivMessages,userMsg].map(m=>`${m.role==="ai"?"INTERVIEWER":"CANDIDATE"}: ${m.text}`).join("\n\n");
    const questionCount=ivMessages.filter(m=>m.role==="ai").length;
    const response=await callAI(`${INTERVIEWER_SYSTEM()}\n\nCONVERSATION:\n${history}\n\nCANDIDATE SAID: "${answer}"\n\n${questionCount>=8?"Consider wrapping up with honest feedback and score /10 for Technical Depth, Communication, Real-World Experience.":"Give brief feedback, ask next question from their resume. ONE question. Under 120 words."}`,400);
    const isEnding=/(overall|final|wrap|conclude|session|score|good luck|thank you for)/i.test(response)&&questionCount>=6;
    setIvMessages(h=>[...h,{role:"ai",text:response,ts:Date.now()}]);
    setIvLoading(false);if(isEnding)setIvEnded(true);
    if(ivVoiceOn)speak(response);
  };

  const scoreResume=async()=>{
    const content=resumeText.trim();
    if(!content&&!resumeFile){alert("Paste your resume text or upload a file");return;}
    setResumeLoading(true);setResumeScore(null);
    let text=content;
    if(!text&&resumeFile){try{text=await resumeFile.text()}catch{text="[Binary file — analyzing from profile data]"}}
    const r=await callAI(`You are an elite resume coach + ATS expert for DevOps/Cloud roles.\n\nCANDIDATE:\n${profStr()}\n\nTARGET ROLE: ${resumeTarget}\n\nRESUME:\n${text.substring(0,3000)}\n\nProvide:\n📊 OVERALL SCORE: X/100\n✅ TOP STRENGTHS (3-4 specific)\n🔴 CRITICAL GAPS\n💡 TOP 5 IMPROVEMENTS (before/after)\n🔍 ATS KEYWORD GAPS (15)\n📝 REWRITTEN SUMMARY\n📈 SALARY IMPACT\n⚡ #1 THING TO FIX NOW`,2500);
    setResumeScore(r);setResumeLoading(false);
  };

  const fetchAll=useCallback(async()=>{
    setLoading(true);setFErr([]);setDemo(false);let res=[];const errs=[];
    for(const f of FEEDS){try{const r=await fetch(CORS+encodeURIComponent(f.url));if(!r.ok)throw new Error(`${r.status}`);const d=await r.json();res.push(...parseJ(f.p,d))}catch(e){errs.push({n:f.name,m:e.message})}}
    if(errs.length)setFErr(errs);if(!res.length){res=[...DEMO];setDemo(true)}
    res.sort((a,b)=>new Date(b.dt)-new Date(a.dt));
    const uniq=new Map();res.forEach(j=>uniq.set(j.url,j));res=[...uniq.values()];
    if(seen.size>0){const n=res.filter(j=>!seen.has(j.id));if(n.length){setFresh(new Set(n.map(j=>j.id)));setBanner(n.length);safeBeep();setTimeout(()=>setBanner(null),8e3)}}
    setSeen(new Set(res.map(j=>j.id)));setJobs(res);setLastF(new Date());setLoading(false);
  },[seen]);

  useEffect(()=>{fetchAll()},[]);// eslint-disable-line
  useEffect(()=>{if(autoR){intRef.current=setInterval(fetchAll,12e4)}return()=>{clearInterval(intRef.current);intRef.current=null}},[autoR,fetchAll]);

  const runAI=async(job,type)=>{
    setAiJob(job.id);setAiType(type);setAiOut("");setAiLoad(true);
    const prof=profStr();
    const jd=`${job.t}@${job.co}|${job.loc}|${job.sal||"N/A"}\nTags:${job.tags.join(",")}\nDesc:${(job.desc||"").substring(0,600)}`;
    const prompts={
      score:`Score 0-100 match.\nSCORE: X/100\n\n✅ MATCHING:\n- skill: why\n\n⚠️ GAPS:\n- gap: suggestion\n\n📊 VERDICT:\n\nCANDIDATE:\n${prof}\n\nJOB:\n${jd}`,
      cover:`180-word cover letter. Specific metrics. Strong hook.\n\nCANDIDATE:\n${prof}\n\nJOB:\n${jd}`,
      interview:`7 most likely interview questions with answers using candidate's experience.\n\nCANDIDATE:\n${prof}\n\nJOB:\n${jd}`,
      resume:`5 specific resume tailoring tips.\n\nCANDIDATE:\n${prof}\n\nJOB:\n${jd}`,
      elevator:`30-second elevator pitch. Under 80 words.\n\nCANDIDATE:\n${prof}\n\nJOB:\n${jd}`,
      ats:`ATS analysis: keywords, pass score, optimized summary.\n\nCANDIDATE:\n${prof}\n\nJOB:\n${jd}`,
      research:`Company intel: overview, tech stack, growth signals, interview angle, red flags.\n\nCompany: ${job.co}\nRole: ${job.t}`,
      compete:`Competitive advantage: your edge, market position, differentiators, positioning.\n\nCANDIDATE:\n${prof}\n\nJOB:\n${jd}`,
      referral:`3 LinkedIn referral messages (<150 words each).\n\nCandidate: ${profile.name} | ${profile.title}\nTarget: ${job.co} | ${job.t}`,
    };
    const r=await callAI(prompts[type]||prompts.score);
    setAiOut(r);setAiLoad(false);
    if(type==="score"){const m=r.match(/SCORE:\s*(\d+)/);if(m)setScores(p=>({...p,[job.id]:parseInt(m[1])}))}
  };

  const runNego=async()=>{
    if(!negoIn.trim())return;setNegoLoad(true);setNegoOut("");
    const r=await callAI(`Expert salary negotiation coach.\n\nCANDIDATE: ${profile.name}|${profile.title}|${profile.exp}|${profile.certs}\nMetrics: ${profile.highlights}\n\nOFFER:\n${negoIn}\n\n1.OFFER BREAKDOWN\n2.MARKET COMPARISON\n3.COUNTER-OFFER (specific numbers)\n4.COUNTER EMAIL DRAFT\n5.NEGOTIATION TIPS\n6.RED FLAGS\n7.WALK-AWAY NUMBER`,1500);
    setNegoOut(r);setNegoLoad(false);
  };

  const exportCSV=()=>{const rows=[["Portal","Type","Status","Starred","Notes"]];PL.forEach(p=>{const s=ps[p.id];rows.push([p.n,p.t,s.st,s.star?"Yes":"No",(s.notes||"").replace(/,/g,";")]);});const b=new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="findmyjobs.csv";a.click();URL.revokeObjectURL(u);};
  const exportJSON=()=>{const b=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),profile,portals:PL.map(p=>({...p,status:ps[p.id]})),scores},null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="findmyjobs.json";a.click();URL.revokeObjectURL(u);};

  const funnel=useMemo(()=>{const f={applied:0,screen:0,interview:0,offer:0,rejected:0};Object.values(ps).forEach(s=>{if(s.st==="Applied")f.applied++;if(s.st==="Screen")f.screen++;if(s.st==="Interview")f.interview++;if(s.st==="Offer 🎉")f.offer++;if(s.st==="Rejected")f.rejected++;});return f},[ps]);
  const fT=funnel.applied+funnel.screen+funnel.interview+funnel.offer;
  const pCounts=useMemo(()=>{const c={all:PL.length,star:0,unc:0};Object.keys(TC).forEach(k=>{c[k]=0});PL.forEach(p=>{const s=ps[p.id];c[p.t]=(c[p.t]||0)+1;if(s.star)c.star++;if(!s.ck)c.unc++;});return c},[ps]);
  const filteredJobs=useMemo(()=>{
    let r=feedF==="all"?jobs:jobs.filter(j=>j.src.toLowerCase().includes(feedF));
    if(activeSearch){const t=activeSearch.toLowerCase();r=r.filter(j=>j.t.toLowerCase().includes(t)||j.co.toLowerCase().includes(t)||j.tags.some(tg=>tg.includes(t))||j.loc.toLowerCase().includes(t))}
    if(activeLocFilter)r=r.filter(j=>j.loc.toLowerCase().includes(activeLocFilter.toLowerCase()));
    switch(sortBy){case"recent":r.sort((a,b)=>new Date(b.dt)-new Date(a.dt));break;case"company":r.sort((a,b)=>a.co.localeCompare(b.co));break;case"title":r.sort((a,b)=>a.t.localeCompare(b.t));break;default:r.sort((a,b)=>b.tags.length-a.tags.length||new Date(b.dt)-new Date(a.dt));}
    return r;
  },[jobs,feedF,activeSearch,activeLocFilter,sortBy]);
  const fPtls=useMemo(()=>PL.filter(p=>{const s=ps[p.id];if(pFlt==="star")return s.star;if(pFlt==="unc")return!s.ck;if(TC[pFlt])return p.t===pFlt;if(dPSrch){const q=dPSrch.toLowerCase();return p.n.toLowerCase().includes(q)||p.desc?.toLowerCase().includes(q)}return true}),[ps,pFlt,dPSrch]);
  const doSearch=()=>{setActiveSearch(searchInput);setActiveLocFilter(locFilter)};

  const T={bg:darkMode?"#03040a":"#f0f4f8",fg:darkMode?"#e2e8f0":"#1a202c",card:darkMode?"rgba(255,255,255,.03)":"rgba(255,255,255,.85)",border:darkMode?"rgba(255,255,255,.06)":"#e2e8f0",input:darkMode?"rgba(255,255,255,.05)":"#f7fafc",muted:darkMode?"#6b7280":"#64748b",glass:darkMode?"rgba(255,255,255,.03)":"rgba(255,255,255,.7)"};
  const IS={padding:"9px 12px",borderRadius:8,background:T.input,border:`1px solid ${T.border}`,color:T.fg,fontSize:13,fontFamily:"inherit",width:"100%",backdropFilter:"blur(8px)",transition:"border-color .2s"};

  // ── TABS — World Map is now the first tab and default ─────────────
  const TABS=[
    {k:"worldmap",l:"🌍 World Map"},
    {k:"live",l:"📡 Live Jobs",b:filteredJobs.length,gw:fresh.size>0},
    {k:"portals",l:"📋 All Portals",b:PL.length},
    {k:"interview",l:"🎙️ Voice Interview"},
    {k:"resume_score",l:"📄 Resume Score"},
    {k:"alerts",l:"🔔 Alerts"},
    {k:"nego",l:"🤝 Negotiate"},
    {k:"funnel",l:"📊 Analytics"},
    {k:"apply",l:"⚡ Quick Apply"},
    {k:"profile",l:"👤 Profile"},
    {k:"settings",l:"⚙️ Settings"},
    {k:"roadmap",l:"🗺️ Roadmap"},
    {k:"research",l:"🔬 Deep Research"},
    {k:"resume_v",l:"🧬 Resume Builder"},
    {k:"market",l:"📈 Market Intel"},
  ];

  return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.fg,fontFamily:"'Instrument Sans',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0}
        @keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pl{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes gw{0%,100%{box-shadow:0 0 5px rgba(16,185,129,.3)}50%{box-shadow:0 0 16px rgba(16,185,129,.6)}}
        @keyframes sd{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes nj{0%{background:rgba(16,185,129,.12)}100%{background:transparent}}
        @keyframes sp{to{transform:rotate(360deg)}}
        @keyframes pulse-ring{0%{transform:scale(.9);opacity:1}70%{transform:scale(1.3);opacity:0}100%{transform:scale(.9);opacity:0}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        ::selection{background:rgba(99,102,241,.3);color:#fff}
        .hv:hover{border-color:rgba(99,102,241,.4)!important;transform:translateY(-2px);box-shadow:0 8px 24px rgba(99,102,241,.12)!important}
        .ab{transition:all .18s cubic-bezier(.4,0,.2,1)!important}
        .ab:hover{filter:brightness(1.18);transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.2)!important}
        .ab:active{transform:translateY(0)!important;filter:brightness(.95)}
        input:focus,textarea:focus,select:focus{border-color:rgba(99,102,241,.5)!important;outline:none;box-shadow:0 0 0 3px rgba(99,102,241,.08)}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(99,102,241,.25);border-radius:2px}
        .nj{animation:nj 3s forwards}
        .spin{width:13px;height:13px;border:2px solid rgba(99,102,241,.12);border-top-color:#6366f1;border-radius:50%;animation:sp .7s linear infinite;display:inline-block;flex-shrink:0}
        .skeleton{background:linear-gradient(90deg,rgba(255,255,255,.03) 25%,rgba(255,255,255,.07) 50%,rgba(255,255,255,.03) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:6px}
        pre.ao{white-space:pre-wrap;word-wrap:break-word;font-size:12px;line-height:1.65;color:${darkMode?"#c9d1d9":T.fg};font-family:'JetBrains Mono',monospace;margin:0}
        .job-card{transition:all .22s cubic-bezier(.4,0,.2,1)!important}
        .job-card:hover{transform:translateY(-3px)!important;box-shadow:0 12px 32px rgba(99,102,241,.15),0 0 0 1px rgba(99,102,241,.12)!important}
        .tab-btn{transition:all .18s cubic-bezier(.4,0,.2,1)!important}
        .tab-btn:hover{color:#a5b4fc!important}
        .mic-pulse::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:2px solid #ef4444;animation:pulse-ring 1.2s infinite}
        .market-card{transition:all .2s}.market-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.2)}
      `}</style>

      <div style={{position:"fixed",inset:0,backgroundImage:"radial-gradient(rgba(99,102,241,.015) 1px,transparent 1px)",backgroundSize:"16px 16px",pointerEvents:"none"}}/>

      {banner&&<div style={{position:"fixed",top:0,left:0,right:0,zIndex:100,padding:"8px 14px",background:"linear-gradient(135deg,rgba(16,185,129,.93),rgba(5,150,105,.93))",color:"#fff",textAlign:"center",fontSize:12,fontWeight:600,animation:"sd .3s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
        🚨 {banner} NEW JOB{banner>1?"S":""} DETECTED!
        <button onClick={()=>setBanner(null)} style={{background:"rgba(255,255,255,.2)",border:"none",color:"#fff",borderRadius:3,padding:"1px 7px",cursor:"pointer",fontSize:10,marginLeft:6}}>✕</button>
      </div>}

      <div style={{position:"relative",zIndex:1,maxWidth:1380,margin:"0 auto",padding:banner?"46px 14px 14px":"14px"}}>

        {/* HEADER */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:12,animation:"fu .4s"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#6366f1,#10b981)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>⚡</div>
            <div>
              <h1 style={{fontWeight:700,fontSize:18,color:darkMode?"#e0e7ff":T.fg,margin:0}}>Job Hunt Command Center <span style={{fontSize:10,color:T.muted,fontWeight:400}}>v13</span></h1>
              <p style={{fontSize:11,color:T.muted,margin:0}}>{profile.name} · {profile.avail}</p>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {fErr.length>0&&<span style={{padding:"3px 8px",borderRadius:4,background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.15)",color:"#f87171",fontSize:10}}>⚠️ {fErr.length} fail</span>}
            {demo&&<span style={{padding:"3px 7px",borderRadius:3,background:"rgba(245,158,11,.08)",color:"#fbbf24",fontSize:10}}>📦 Demo</span>}
            <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:T.muted}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:autoR?"#10b981":T.muted,animation:autoR?"pl 2s infinite":"none"}}/>
              {autoR?"Live":"Paused"}
            </div>
            {lastF&&<span style={{fontSize:11,color:T.muted}}>{ago(lastF.toISOString())} ago</span>}
            <button onClick={()=>setDarkMode(!darkMode)} style={{padding:"6px 10px",background:T.input,border:`1px solid ${T.border}`,borderRadius:6,cursor:"pointer",color:T.fg,fontSize:14}}>{darkMode?"☀️":"🌙"}</button>
          </div>
        </div>

        {fT>0&&<div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>
          {[{l:"Applied",v:funnel.applied,c:"#f59e0b"},{l:"Screen",v:funnel.screen,c:"#06b6d4"},{l:"Interview",v:funnel.interview,c:"#a78bfa"},{l:"Offer",v:funnel.offer,c:"#10b981"},{l:"Rejected",v:funnel.rejected,c:"#ef4444"}].filter(s=>s.v>0).map(s=>(
            <div key={s.l} style={{padding:"3px 10px",borderRadius:4,background:`${s.c}10`,border:`1px solid ${s.c}20`,fontSize:11,color:s.c,fontWeight:600}}><b>{s.v}</b> {s.l}</div>
          ))}
        </div>}

        {/* TABS */}
        <div style={{display:"flex",gap:1,marginBottom:14,borderBottom:`1px solid ${T.border}`,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          {TABS.map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} className="tab-btn" style={{padding:"10px 14px",border:"none",borderBottom:tab===t.k?"3px solid #6366f1":"3px solid transparent",cursor:"pointer",fontSize:12,fontWeight:tab===t.k?700:400,color:tab===t.k?"#6366f1":T.muted,background:"transparent",whiteSpace:"nowrap",transition:"all .15s",position:"relative"}}>
              {t.l}
              {t.b!=null&&<span style={{marginLeft:4,fontSize:10,padding:"1px 5px",borderRadius:8,background:tab===t.k?"rgba(99,102,241,.15)":T.input,color:tab===t.k?"#a5b4fc":T.muted}}>{t.b}</span>}
              {t.gw&&<span style={{position:"absolute",top:4,right:4,width:7,height:7,borderRadius:"50%",background:"#10b981",animation:"gw 1.5s infinite"}}/>}
            </button>
          ))}
        </div>

        {/* ═══ WORLD MAP ══════════════════════════════════════════ */}
        {tab==="worldmap"&&<div style={{animation:"fu .2s"}}>
          <WorldMap darkMode={darkMode}/>
        </div>}

        {/* ═══ LIVE JOBS ═══════════════════════════════════════════ */}
        {tab==="live"&&<div style={{animation:"fu .2s"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:16}}>
            {[{l:"Total Jobs",v:jobs.length,c:"#6366f1",i:"📡"},{l:"Filtered",v:filteredJobs.length,c:"#22c55e",i:"🎯"},{l:"AI Scored",v:Object.keys(scores).length,c:"#a78bfa",i:"🤖"},{l:"New Today",v:fresh.size,c:"#10b981",i:"🆕"}].map(s=>(
              <div key={s.l} style={{padding:12,borderRadius:10,background:`${s.c}10`,borderLeft:`4px solid ${s.c}`,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:22}}>{s.i}</span>
                <div><div style={{fontSize:10,color:T.muted}}>{s.l}</div><div style={{fontSize:20,fontWeight:700,color:s.c}}>{s.v}</div></div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr auto auto auto",gap:8,marginBottom:12,alignItems:"center"}}>
            <input value={searchInput} onChange={e=>setSearchInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()} placeholder="🔍 Search jobs..." style={IS}/>
            <button onClick={doSearch} style={{padding:"9px 20px",background:"#6366f1",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13,whiteSpace:"nowrap"}}>Search</button>
            <input value={locFilter} onChange={e=>setLocFilter(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()} placeholder="📍 Location..." style={IS}/>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{...IS,width:"auto"}}><option value="recent">🕒 Recent</option><option value="relevance">📊 Relevance</option><option value="company">🏢 Company</option><option value="title">📝 Title</option></select>
            <button onClick={()=>{setSearchInput("");setLocFilter("");setActiveSearch("");setActiveLocFilter("")}} style={{padding:"9px 14px",background:"rgba(239,68,68,.1)",color:"#ef4444",border:`1px solid rgba(239,68,68,.2)`,borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12}}>Clear</button>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,marginBottom:12}}>
            <div style={{display:"flex",gap:4}}>
              {["all","remoteok","remotive","arbeitnow"].map(f=>(
                <button key={f} onClick={()=>setFeedF(f)} style={{padding:"5px 12px",borderRadius:6,cursor:"pointer",fontSize:11,border:"none",background:feedF===f?"rgba(99,102,241,.12)":T.input,color:feedF===f?"#a5b4fc":T.muted,fontWeight:feedF===f?600:400}}>{f==="all"?"All Sources":f.charAt(0).toUpperCase()+f.slice(1)}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>setAutoR(!autoR)} style={{padding:"5px 12px",borderRadius:6,cursor:"pointer",fontSize:11,border:"none",background:autoR?"rgba(16,185,129,.1)":T.input,color:autoR?"#6ee7b7":T.muted}}>{autoR?"⏸ Pause":"▶ Auto"}</button>
              <button onClick={fetchAll} disabled={loading} style={{padding:"5px 14px",borderRadius:6,cursor:"pointer",fontSize:11,border:"none",background:"rgba(99,102,241,.1)",color:"#a5b4fc",fontWeight:600}}>{loading?"⏳ Fetching...":"🔄 Refresh"}</button>
            </div>
          </div>
          {loading&&<div style={{display:"flex",flexDirection:"column",gap:10}}>{[1,2,3].map(i=><div key={i} style={{padding:16,borderRadius:10,background:T.card,border:`1px solid ${T.border}`}}><div className="skeleton" style={{height:18,width:"60%",marginBottom:8}}/><div className="skeleton" style={{height:13,width:"40%"}}/></div>)}</div>}
          {!loading&&filteredJobs.length===0&&<div style={{textAlign:"center",padding:60,color:T.muted}}><p style={{fontSize:18,marginBottom:8}}>😕 No jobs found</p><p>Try different search terms</p></div>}
          {!loading&&<>
            <p style={{color:T.muted,fontSize:12,marginBottom:12}}>Showing {filteredJobs.length} of {jobs.length} jobs · 9 AI tools per job</p>
            {filteredJobs.map((j,i)=>{const isN=fresh.has(j.id),sc=scores[j.id],aiO=aiJob===j.id;return(
              <div key={j.id} style={{marginBottom:10,animation:`fu .2s ${Math.min(i*20,200)}ms both`}}>
                <div className={`job-card${isN?" nj":""}`} style={{padding:16,borderRadius:10,background:T.card,border:`1px solid ${isN?"rgba(16,185,129,.25)":T.border}`,position:"relative"}}>
                  {isN&&<div style={{position:"absolute",top:10,right:12,fontSize:10,padding:"2px 7px",borderRadius:4,background:"rgba(16,185,129,.12)",color:"#6ee7b7",fontWeight:700,animation:"pl 1.5s infinite"}}>🆕 NEW</div>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                        <h4 style={{fontSize:15,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:0}}>{j.t}</h4>
                        {sc!=null&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:6,fontWeight:700,background:sc>=80?"rgba(16,185,129,.12)":sc>=60?"rgba(245,158,11,.12)":"rgba(239,68,68,.12)",color:sc>=80?"#6ee7b7":sc>=60?"#fbbf24":"#f87171"}}>{sc}%</span>}
                      </div>
                      <p style={{fontSize:12,color:T.muted,margin:"0 0 8px"}}>{j.co} · {j.loc}{j.sal&&<span style={{color:"#10b981",fontWeight:600}}> · {j.sal}</span>} · {tstr(j.dt)} ({ago(j.dt)})</p>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        <span style={{fontSize:10,padding:"2px 7px",borderRadius:5,background:"rgba(245,158,11,.08)",color:"#fbbf24"}}>{j.src}</span>
                        {j.tags.slice(0,5).map(t=><span key={t} style={{fontSize:10,padding:"2px 7px",borderRadius:5,background:"rgba(99,102,241,.07)",color:"#818cf8"}}>{t}</span>)}
                      </div>
                    </div>
                    <a href={j.url} target="_blank" rel="noopener noreferrer" className="ab" style={{padding:"8px 18px",borderRadius:8,flexShrink:0,background:isN?"linear-gradient(135deg,rgba(16,185,129,.18),rgba(5,150,105,.18))":"linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.12))",border:`1px solid ${isN?"rgba(16,185,129,.3)":"rgba(99,102,241,.2)"}`,color:isN?"#6ee7b7":"#c7d2fe",textDecoration:"none",fontSize:12,fontWeight:700}}>Apply ↗</a>
                  </div>
                  <div style={{display:"flex",gap:5,marginTop:12,flexWrap:"wrap"}}>
                    {AI_BTNS.map(a=>(
                      <button key={a.ty} onClick={()=>runAI(j,a.ty)} className="ab" style={{padding:"4px 10px",borderRadius:5,cursor:"pointer",fontSize:11,fontWeight:500,background:aiJob===j.id&&aiType===a.ty?`${a.c}18`:`${a.c}08`,border:`1px solid ${aiJob===j.id&&aiType===a.ty?`${a.c}35`:`${a.c}15`}`,color:a.c}}>{a.lb}</button>
                    ))}
                    <button onClick={()=>runDeepResearch(j)} className="ab" style={{padding:"4px 10px",borderRadius:5,cursor:"pointer",fontSize:11,fontWeight:600,background:researchJob===j.id?"rgba(139,92,246,.18)":"rgba(139,92,246,.07)",border:`1px solid ${researchJob===j.id?"rgba(139,92,246,.4)":"rgba(139,92,246,.15)"}`,color:"#a78bfa"}}>{researchLoad===j.id?"⏳":"🔬"} Deep Research</button>
                  </div>
                  {researchJob===j.id&&<div style={{marginTop:8,padding:10,borderRadius:6,background:"rgba(139,92,246,.04)",border:"1px solid rgba(139,92,246,.12)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:12,fontWeight:600,color:"#a78bfa"}}>🔬 {j.co} Intelligence</span>
                      <button onClick={()=>setResearchJob(null)} style={{padding:"1px 7px",borderRadius:3,cursor:"pointer",fontSize:10,background:"transparent",border:"1px solid rgba(255,255,255,.06)",color:"#6b7280"}}>✕</button>
                    </div>
                    {researchLoad===j.id?<div style={{display:"flex",alignItems:"center",gap:8,padding:8}}><div className="spin"/><span style={{fontSize:12,color:"#a78bfa"}}>Researching {j.co}...</span></div>
                    :<pre className="ao" style={{fontSize:11}}>{researchOut[j.id]||"Click Deep Research to analyze"}</pre>}
                  </div>}
                </div>
                {aiO&&<div style={{margin:"2px 0 0",padding:14,borderRadius:"0 0 10px 10px",background:"rgba(99,102,241,.03)",border:`1px solid rgba(99,102,241,.1)`,borderTop:"none"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontSize:12,fontWeight:600,color:"#a5b4fc"}}>🤖 {AI_LABELS[aiType]||"AI Analysis"}</span>
                    <div style={{display:"flex",gap:5}}>
                      {!aiLoad&&aiOut&&<button onClick={()=>cp(aiOut,"ai")} style={{padding:"2px 9px",borderRadius:4,cursor:"pointer",fontSize:10,background:cpd==="ai"?"rgba(16,185,129,.1)":T.input,border:`1px solid ${T.border}`,color:cpd==="ai"?"#10b981":T.muted}}>{cpd==="ai"?"✓ Copied":"📋 Copy"}</button>}
                      <button onClick={()=>{setAiJob(null);setAiType(null);setAiOut("")}} style={{padding:"2px 7px",borderRadius:4,cursor:"pointer",fontSize:10,background:T.input,border:`1px solid ${T.border}`,color:T.muted}}>✕</button>
                    </div>
                  </div>
                  {aiLoad?<div style={{display:"flex",alignItems:"center",gap:10,padding:10}}><div className="spin"/><span style={{fontSize:12,color:T.muted}}>AI analyzing...</span></div>
                  :<pre className="ao">{aiOut}</pre>}
                </div>}
              </div>
            );})}
          </>}
        </div>}

        {/* ═══ ALL PORTALS ════════════════════════════════════════ */}
        {tab==="portals"&&<div style={{animation:"fu .2s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div><h2 style={{fontSize:18,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:0}}>📋 All Job Portals — {PL.length} Portals</h2></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:8,marginBottom:14}}>
            {[{l:"Total",v:pCounts.all,c:darkMode?"#e0e7ff":T.fg},{l:"Starred",v:pCounts.star,c:"#f59e0b"},{l:"Must-Have",v:pCounts.must,c:"#ef4444"},{l:"Premium",v:pCounts.premium,c:"#f59e0b"},{l:"Major",v:pCounts.major,c:"#6366f1"}].map(s=>(
              <div key={s.l} style={{padding:"8px 10px",borderRadius:8,background:T.card,border:`1px solid ${T.border}`,textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:T.muted}}>{s.l}</div></div>
            ))}
          </div>
          <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
            <input value={pSrch} onChange={e=>setPSrch(e.target.value)} placeholder="🔍 Search portals..." style={{...IS,flex:"1 1 160px",width:"auto"}}/>
            {[{l:"All",f:"all"},{l:"⭐ Starred",f:"star"},...Object.entries(TL).map(([k,l])=>({l:`${l.split(" ")[0]}`,f:k}))].map(x=>(
              <button key={x.f} onClick={()=>setPFlt(pFlt===x.f?"all":x.f)} style={{padding:"5px 10px",borderRadius:6,cursor:"pointer",fontSize:11,border:`1px solid ${pFlt===x.f?"rgba(99,102,241,.3)":T.border}`,background:pFlt===x.f?"rgba(99,102,241,.1)":T.input,color:pFlt===x.f?"#a5b4fc":T.muted}}>{x.l}</button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:8}}>
            {fPtls.map((p,i)=>{const s=ps[p.id],ex=expId===p.id;return(
              <div key={p.id} className="hv" style={{padding:12,borderRadius:10,background:T.card,border:`1px solid ${s.star?"rgba(245,158,11,.2)":T.border}`,borderLeft:`4px solid ${TC[p.t]}`,animation:`fu .2s ${Math.min(i*10,150)}ms both`,transition:"all .2s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                      <a href={p.u} target="_blank" rel="noopener noreferrer" onClick={()=>upd(p.id,{ck:new Date().toISOString()})} style={{color:darkMode?"#e0e7ff":T.fg,textDecoration:"none",fontSize:13,fontWeight:700}}>{p.n}</a>
                      {p.api&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:"rgba(16,185,129,.1)",color:"#6ee7b7",border:"1px solid rgba(16,185,129,.2)"}}>LIVE</span>}
                      {s.star&&<span style={{fontSize:12}}>🔥</span>}
                    </div>
                    <p style={{fontSize:11,color:T.muted,margin:0}}>{p.desc}</p>
                  </div>
                  <button onClick={()=>cyc(p.id)} style={{padding:"2px 8px",borderRadius:4,cursor:"pointer",background:`${STC[s.st]}10`,border:`1px solid ${STC[s.st]}20`,color:STC[s.st],fontSize:10,fontWeight:600,flexShrink:0}}>{s.st}</button>
                </div>
                <div style={{display:"flex",gap:5,marginTop:8}}>
                  <a href={p.u} target="_blank" rel="noopener noreferrer" onClick={()=>upd(p.id,{ck:new Date().toISOString()})} className="ab" style={{flex:1,textAlign:"center",padding:"4px 6px",borderRadius:5,background:"rgba(99,102,241,.07)",border:"1px solid rgba(99,102,241,.12)",color:"#a5b4fc",textDecoration:"none",fontSize:11}}>Search ↗</a>
                  {p.au&&<a href={p.au} target="_blank" rel="noopener noreferrer" className="ab" style={{padding:"4px 8px",borderRadius:5,background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,.12)",color:"#fbbf24",textDecoration:"none",fontSize:11}}>🔔</a>}
                  <button onClick={()=>upd(p.id,{star:!s.star})} className="ab" style={{padding:"4px 8px",borderRadius:5,cursor:"pointer",background:s.star?"rgba(245,158,11,.08)":"transparent",border:`1px solid ${s.star?"rgba(245,158,11,.15)":T.border}`,color:s.star?"#f59e0b":T.muted,fontSize:11}}>{s.star?"★":"☆"}</button>
                  <button onClick={()=>setExpId(ex?null:p.id)} className="ab" style={{padding:"4px 8px",borderRadius:5,cursor:"pointer",border:`1px solid ${T.border}`,color:T.muted,fontSize:11,background:"transparent"}}>✎</button>
                </div>
                {ex&&<textarea value={s.notes} onChange={e=>upd(p.id,{notes:e.target.value})} placeholder="Notes..." style={{width:"100%",minHeight:40,marginTop:8,padding:6,borderRadius:5,background:"rgba(0,0,0,.15)",border:`1px solid ${T.border}`,color:T.fg,fontSize:11,fontFamily:"inherit",resize:"vertical"}}/>}
              </div>
            );})}
          </div>
        </div>}

        {/* ═══ VOICE INTERVIEW ════════════════════════════════════ */}
        {tab==="interview"&&<div style={{animation:"fu .2s",maxWidth:860,margin:"0 auto"}}>
          <h2 style={{fontSize:20,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:"0 0 4px"}}>🎙️ AI Voice Mock Interview</h2>
          <p style={{fontSize:13,color:T.muted,marginBottom:20}}>Claude acts as your real interviewer — scenario-based questions from your actual resume, digs deeper, wraps up naturally.</p>
          {!ivActive&&!ivEnded&&<div style={{textAlign:"center"}}>
            <div style={{display:"flex",flexDirection:"column",gap:10,maxWidth:480,margin:"0 auto 20px"}}>
              <div><label style={{fontSize:12,color:T.muted,display:"block",marginBottom:5}}>Target Role</label><input value={ivRole} onChange={e=>setIvRole(e.target.value)} placeholder="e.g. Senior DevOps Engineer" style={IS}/></div>
              <div><label style={{fontSize:12,color:T.muted,display:"block",marginBottom:5}}>Company (optional)</label><input value={ivCompany} onChange={e=>setIvCompany(e.target.value)} placeholder="e.g. Netflix, Stripe" style={IS}/></div>
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:10}}>
              <button onClick={startInterview} disabled={!ivRole.trim()||ivLoading} style={{padding:"14px 36px",background:"#6366f1",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:16}}>{ivLoading?"Starting...":"🎙️ Start Interview"}</button>
              <button onClick={()=>setIvVoiceOn(!ivVoiceOn)} style={{padding:"14px 18px",background:ivVoiceOn?"rgba(16,185,129,.1)":"rgba(255,255,255,.04)",color:ivVoiceOn?"#10b981":T.muted,border:`1px solid ${ivVoiceOn?"rgba(16,185,129,.3)":T.border}`,borderRadius:10,cursor:"pointer",fontWeight:600}}>{ivVoiceOn?"🔊 Voice ON":"🔇 Voice OFF"}</button>
            </div>
          </div>}
          {(ivActive||ivEnded)&&<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,padding:"10px 16px",background:"rgba(99,102,241,.06)",borderRadius:10,border:`1px solid rgba(99,102,241,.12)`,flexWrap:"wrap",gap:8}}>
              <span style={{fontSize:13,color:T.muted}}>{ivEnded?"✅ Complete":ivLoading?"Thinking...":ivSpeaking?"Speaking...":ivListening?"Listening...":"Your turn"} · {ivMessages.filter(m=>m.role==="ai").length} exchanges</span>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setIvVoiceOn(!ivVoiceOn)} style={{padding:"5px 12px",fontSize:11,background:T.input,color:T.muted,border:`1px solid ${T.border}`,borderRadius:6,cursor:"pointer"}}>{ivVoiceOn?"🔊":"🔇"}</button>
                {ivSpeaking&&<button onClick={stopSpeaking} style={{padding:"5px 12px",fontSize:11,background:"rgba(245,158,11,.1)",color:"#f59e0b",border:"1px solid rgba(245,158,11,.2)",borderRadius:6,cursor:"pointer"}}>⏹</button>}
                <button onClick={()=>{stopSpeaking();stopListening();setIvActive(false);setIvEnded(false);setIvMessages([]);setIvTranscript("")}} style={{padding:"5px 12px",fontSize:11,background:"rgba(239,68,68,.08)",color:"#ef4444",border:"1px solid rgba(239,68,68,.15)",borderRadius:6,cursor:"pointer"}}>End</button>
              </div>
            </div>
            <div ref={chatRef} style={{display:"flex",flexDirection:"column",gap:12,maxHeight:460,overflowY:"auto",padding:16,background:"rgba(0,0,0,.15)",borderRadius:12,marginBottom:12}}>
              {ivMessages.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"78%",padding:"12px 16px",borderRadius:12,background:m.role==="user"?"#6366f1":T.card,border:m.role==="ai"?`1px solid ${T.border}`:"none"}}>
                    <div style={{fontSize:10,fontWeight:700,marginBottom:4,opacity:.6}}>{m.role==="ai"?"🤖 INTERVIEWER":"👤 YOU"}</div>
                    <div style={{fontSize:14,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{m.text}</div>
                  </div>
                </div>
              ))}
              {ivLoading&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 12px"}}><div className="spin"/><span style={{fontSize:13,color:T.muted}}>Thinking...</span></div>}
              {ivListening&&ivTranscript&&<div style={{display:"flex",justifyContent:"flex-end"}}><div style={{maxWidth:"78%",padding:"10px 14px",borderRadius:12,background:"rgba(99,102,241,.3)",border:"1px dashed rgba(99,102,241,.5)"}}><div style={{fontSize:10,fontWeight:700,marginBottom:3,opacity:.6}}>👤 YOU (listening...)</div><div style={{fontSize:13,fontStyle:"italic"}}>{ivTranscript}</div></div></div>}
            </div>
            {!ivEnded&&<div style={{display:"flex",gap:8,alignItems:"stretch"}}>
              <button onClick={ivListening?stopListening:startListening} disabled={ivLoading||ivSpeaking} style={{position:"relative",width:56,height:56,borderRadius:"50%",border:"none",cursor:"pointer",background:ivListening?"#ef4444":"#6366f1",color:"#fff",fontSize:22,flexShrink:0}} className={ivListening?"mic-pulse":""}>{ivListening?"🔴":"🎤"}</button>
              <textarea value={ivTranscript} onChange={e=>setIvTranscript(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(ivTranscript.trim())sendAnswer(ivTranscript)}}} placeholder="Type or press 🎤 to speak (Enter to send)" disabled={ivLoading} style={{...IS,flex:1,minHeight:56,resize:"none"}}/>
              <button onClick={()=>{if(ivTranscript.trim())sendAnswer(ivTranscript)}} disabled={!ivTranscript.trim()||ivLoading} style={{padding:"0 22px",background:"#10b981",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:14}}>Send →</button>
            </div>}
            {ivEnded&&<div style={{textAlign:"center",padding:20,background:"rgba(16,185,129,.06)",borderRadius:10,border:"1px solid rgba(16,185,129,.15)"}}>
              <p style={{fontSize:16,fontWeight:700,color:"#10b981",marginBottom:8}}>✅ Interview Complete</p>
              <button onClick={()=>{stopSpeaking();stopListening();setIvActive(false);setIvEnded(false);setIvMessages([]);setIvTranscript("")}} style={{padding:"10px 28px",background:"#6366f1",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700}}>Practice Again</button>
            </div>}
          </div>}
        </div>}

        {/* ═══ RESUME SCORE ════════════════════════════════════════ */}
        {tab==="resume_score"&&<div style={{animation:"fu .2s",maxWidth:860,margin:"0 auto"}}>
          <h2 style={{fontSize:20,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:"0 0 4px"}}>📄 Resume Score & Optimizer</h2>
          <p style={{fontSize:13,color:T.muted,marginBottom:20}}>AI score, ATS pass rate, exact before/after rewrites — specific to your target role.</p>
          <div style={{padding:20,borderRadius:12,background:T.card,border:`1px solid ${T.border}`,marginBottom:16}}>
            <div style={{marginBottom:14}}><label style={{fontSize:12,color:T.muted,display:"block",marginBottom:6,fontWeight:600}}>TARGET ROLE</label><input value={resumeTarget} onChange={e=>setResumeTarget(e.target.value)} placeholder="e.g. Senior DevOps Engineer" style={IS}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div>
                <label style={{fontSize:12,color:T.muted,display:"block",marginBottom:6,fontWeight:600}}>UPLOAD RESUME</label>
                <input ref={resumeFileRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={e=>{const f=e.target.files[0];if(f){setResumeFile(f);setResumeText("")}}} style={{display:"none"}}/>
                <button onClick={()=>resumeFileRef.current?.click()} style={{width:"100%",padding:"12px",borderRadius:8,border:`2px dashed ${resumeFile?"#6366f1":T.border}`,background:resumeFile?"rgba(99,102,241,.06)":T.input,color:resumeFile?"#a5b4fc":T.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>{resumeFile?`📎 ${resumeFile.name}`:"📁 Click to Upload"}</button>
              </div>
              <div>
                <label style={{fontSize:12,color:T.muted,display:"block",marginBottom:6,fontWeight:600}}>OR PASTE RESUME</label>
                <textarea value={resumeText} onChange={e=>{setResumeText(e.target.value);if(e.target.value)setResumeFile(null)}} placeholder="Paste resume content here..." style={{...IS,minHeight:52,resize:"none",fontFamily:"'JetBrains Mono',monospace",fontSize:11}}/>
              </div>
            </div>
            <button onClick={scoreResume} disabled={resumeLoading||(!resumeFile&&!resumeText.trim())} style={{padding:"12px 32px",background:"linear-gradient(135deg,#6366f1,#10b981)",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:15,width:"100%"}}>{resumeLoading?"🤖 Analyzing...":"🤖 Score & Optimize My Resume"}</button>
          </div>
          {resumeLoading&&<div style={{textAlign:"center",padding:40}}><div className="spin" style={{width:40,height:40,margin:"0 auto 14px"}}/><p style={{color:T.muted}}>Analyzing your resume...</p></div>}
          {resumeScore&&!resumeLoading&&<div style={{padding:22,borderRadius:12,background:T.card,border:`1px solid ${T.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
              <h3 style={{fontSize:15,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:0}}>Analysis — {resumeTarget}</h3>
              <button onClick={()=>cp(resumeScore,"res")} style={{padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:11,background:cpd==="res"?"rgba(16,185,129,.1)":T.input,border:`1px solid ${T.border}`,color:cpd==="res"?"#10b981":T.muted}}>{cpd==="res"?"✓ Copied":"📋 Copy"}</button>
            </div>
            <pre className="ao" style={{fontSize:13,lineHeight:1.8}}>{resumeScore}</pre>
          </div>}
        </div>}

        {/* ═══ ALERTS ══════════════════════════════════════════════ */}
        {tab==="alerts"&&<div style={{animation:"fu .2s"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:"0 0 4px"}}>🔔 Alert Setup Checklist</h2>
          <p style={{fontSize:12,color:T.muted,marginBottom:12}}>Set up email alerts so new DevOps jobs come straight to your inbox.</p>
          {PL.filter(p=>p.as).map((p,i)=>{const s=ps[p.id],done=s.st==="Alert ✓";return(
            <div key={p.id} style={{padding:12,borderRadius:10,background:T.card,border:`1px solid ${T.border}`,borderLeft:`4px solid ${TC[p.t]}`,marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:18,opacity:done?1:.3}}>{done?"✅":"⬜"}</span>
                  <div><span style={{fontSize:13,fontWeight:600,color:done?"#6ee7b7":darkMode?"#e0e7ff":T.fg}}>{p.n}</span><p style={{fontSize:11,color:T.muted,margin:"2px 0 0"}}>{p.as}</p></div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>upd(p.id,{st:done?"—":"Alert ✓"})} style={{padding:"5px 12px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700,background:done?"rgba(16,185,129,.1)":"rgba(99,102,241,.07)",border:`1px solid ${done?"rgba(16,185,129,.2)":"rgba(99,102,241,.15)"}`,color:done?"#6ee7b7":"#a5b4fc"}}>{done?"✓ Done":"Mark Done"}</button>
                  <a href={p.au||p.u} target="_blank" rel="noopener noreferrer" className="ab" style={{padding:"5px 12px",borderRadius:6,textDecoration:"none",fontSize:11,fontWeight:700,background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.15)",color:"#fbbf24"}}>Open ↗</a>
                </div>
              </div>
            </div>
          );})}
        </div>}

        {/* ═══ NEGOTIATION ════════════════════════════════════════ */}
        {tab==="nego"&&<div style={{animation:"fu .2s",maxWidth:800,margin:"0 auto"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:"0 0 4px"}}>🤝 Negotiation AI Copilot</h2>
          <p style={{fontSize:12,color:T.muted,marginBottom:16}}>Paste offer → counter-offer strategy, market comparison, negotiation email</p>
          <textarea value={negoIn} onChange={e=>setNegoIn(e.target.value)} placeholder={"Paste offer here...\n\nExample:\nCompany: TechCorp\nRole: Senior DevOps Engineer\nBase: ₹28,00,000\nBonus: 10%\nEquity: ESOPs"} style={{...IS,minHeight:140,fontFamily:"'JetBrains Mono',monospace",resize:"vertical",marginBottom:10}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={runNego} disabled={negoLoad||!negoIn.trim()} className="ab" style={{padding:"10px 22px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,background:"linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.15))",border:"1px solid rgba(99,102,241,.25)",color:"#c7d2fe"}}>{negoLoad?"🤖 Analyzing...":"🤖 Generate Counter-Offer"}</button>
            {negoOut&&<button onClick={()=>cp(negoOut,"nego")} style={{padding:"10px 16px",borderRadius:8,cursor:"pointer",fontSize:13,background:cpd==="nego"?"rgba(16,185,129,.1)":T.input,border:`1px solid ${T.border}`,color:cpd==="nego"?"#10b981":T.muted}}>{cpd==="nego"?"✓ Copied":"📋 Copy"}</button>}
          </div>
          {negoLoad&&<div style={{display:"flex",alignItems:"center",gap:10,padding:16,marginTop:10}}><div className="spin"/><span style={{fontSize:12,color:T.muted}}>Analyzing offer...</span></div>}
          {negoOut&&!negoLoad&&<div style={{padding:14,marginTop:12,borderRadius:10,background:T.card,border:`1px solid ${T.border}`}}><pre className="ao">{negoOut}</pre></div>}
        </div>}

        {/* ═══ ANALYTICS ══════════════════════════════════════════ */}
        {tab==="funnel"&&<div style={{animation:"fu .2s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <h2 style={{fontSize:18,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:0}}>📊 Application Pipeline</h2>
            <div style={{display:"flex",gap:6}}>
              <button onClick={exportCSV} className="ab" style={{padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600,background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.15)",color:"#6ee7b7"}}>⬇ CSV</button>
              <button onClick={exportJSON} className="ab" style={{padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600,background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.15)",color:"#a5b4fc"}}>⬇ JSON</button>
            </div>
          </div>
          <div style={{padding:20,borderRadius:10,background:T.card,border:`1px solid ${T.border}`,marginBottom:14}}>
            <div style={{display:"flex",alignItems:"flex-end",gap:6,height:110,justifyContent:"center"}}>
              {[{l:"Applied",v:funnel.applied,c:"#f59e0b"},{l:"Screen",v:funnel.screen,c:"#06b6d4"},{l:"Interview",v:funnel.interview,c:"#a78bfa"},{l:"Offer",v:funnel.offer,c:"#10b981"}].map(s=>{const mx=Math.max(funnel.applied,1);return(<div key={s.l} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,maxWidth:120}}><div style={{fontSize:20,fontWeight:700,color:s.c,marginBottom:5}}>{s.v}</div><div style={{width:"100%",borderRadius:5,height:Math.max((s.v/mx)*70,4),background:`${s.c}25`}}/><div style={{fontSize:11,color:T.muted,marginTop:5}}>{s.l}</div></div>);})}
            </div>
            {fT===0&&<p style={{textAlign:"center",fontSize:12,color:T.muted,marginTop:8}}>Update portal statuses to see your funnel.</p>}
          </div>
          {Object.keys(scores).length>0&&<div><h3 style={{fontSize:14,color:"#a5b4fc",margin:"0 0 8px"}}>🎯 AI Score Leaderboard</h3>
            {Object.entries(scores).sort((a,b)=>b[1]-a[1]).map(([jid,sc])=>{const job=jobs.find(j=>j.id===jid);if(!job)return null;return(<div key={jid} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,background:T.card,border:`1px solid ${T.border}`,marginBottom:6}}><span style={{fontSize:14,fontWeight:700,color:sc>=80?"#10b981":sc>=60?"#f59e0b":"#ef4444",minWidth:36}}>{sc}%</span><span style={{fontSize:12,color:darkMode?"#e0e7ff":T.fg,flex:1}}>{job.t} @ {job.co}</span><a href={job.url} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#6366f1",textDecoration:"none"}}>Apply ↗</a></div>);})}
          </div>}
        </div>}

        {/* ═══ QUICK APPLY ════════════════════════════════════════ */}
        {tab==="apply"&&<div style={{animation:"fu .2s"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:"0 0 4px"}}>⚡ Quick Apply — Click to Copy</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:8}}>
            {[{f:"Full Name",v:profile.name},{f:"Email",v:profile.email},{f:"Phone",v:profile.phone},{f:"Location",v:profile.loc},{f:"LinkedIn",v:`https://${profile.li}`},{f:"GitHub",v:`https://${profile.gh}`},{f:"Portfolio",v:`https://${profile.web}`},{f:"Job Title",v:profile.title},{f:"Experience",v:profile.exp},{f:"Current Role",v:profile.current},{f:"Certifications",v:profile.certs},{f:"Availability",v:profile.avail},{f:"Summary",v:profile.sum},{f:"Skills",v:profile.skills}].map(x=>(
              <button key={x.f} onClick={()=>cp(x.v,x.f)} style={{textAlign:"left",padding:10,borderRadius:8,cursor:"pointer",fontFamily:"inherit",background:cpd===x.f?"rgba(16,185,129,.06)":T.card,border:`1px solid ${cpd===x.f?"rgba(16,185,129,.2)":T.border}`}}>
                <div style={{fontSize:10,color:cpd===x.f?"#10b981":T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:.5,fontWeight:600}}>{cpd===x.f?"✓ COPIED":x.f}</div>
                <div style={{fontSize:11,color:T.fg,lineHeight:1.4,wordBreak:"break-word"}}>{x.v}</div>
              </button>
            ))}
          </div>
        </div>}

        {/* ═══ PROFILE ════════════════════════════════════════════ */}
        {tab==="profile"&&<div style={{animation:"fu .2s",maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h2 style={{fontSize:18,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:0}}>👤 Your Profile</h2>
            <div style={{display:"flex",gap:6}}>
              {editP?<><button onClick={()=>{setProfile(pDraft);setEditP(false)}} className="ab" style={{padding:"6px 16px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700,background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.2)",color:"#6ee7b7"}}>✓ Save</button><button onClick={()=>{setPDraft(profile);setEditP(false)}} style={{padding:"6px 12px",borderRadius:6,cursor:"pointer",fontSize:11,background:T.input,border:`1px solid ${T.border}`,color:T.muted}}>Cancel</button></>
              :<button onClick={()=>{setPDraft(profile);setEditP(true)}} className="ab" style={{padding:"6px 16px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700,background:"rgba(99,102,241,.1)",border:"1px solid rgba(99,102,241,.2)",color:"#a5b4fc"}}>✎ Edit</button>}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:10}}>
            {[{k:"name",l:"Full Name"},{k:"title",l:"Job Title"},{k:"email",l:"Email"},{k:"phone",l:"Phone"},{k:"loc",l:"Location"},{k:"li",l:"LinkedIn"},{k:"gh",l:"GitHub"},{k:"web",l:"Website"},{k:"exp",l:"Experience"},{k:"certs",l:"Certifications"},{k:"current",l:"Current Role"},{k:"avail",l:"Availability"}].map(({k,l})=>(
              <div key={k} style={{padding:10,borderRadius:8,background:T.card,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:10,color:T.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
                {editP?<input value={pDraft[k]||""} onChange={e=>setPDraft(d=>({...d,[k]:e.target.value}))} style={{...IS,padding:"5px 8px",fontSize:12}}/>:<div style={{fontSize:12,color:T.fg,wordBreak:"break-word"}}>{profile[k]}</div>}
              </div>
            ))}
          </div>
          {[{k:"sum",l:"Professional Summary",r:4},{k:"highlights",l:"Key Metrics",r:2},{k:"skills",l:"Skills",r:2}].map(({k,l,r})=>(
            <div key={k} style={{padding:12,borderRadius:8,background:T.card,border:`1px solid ${T.border}`,marginTop:10}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
              {editP?<textarea value={pDraft[k]||""} onChange={e=>setPDraft(d=>({...d,[k]:e.target.value}))} rows={r} style={{...IS,resize:"vertical",fontFamily:"'JetBrains Mono',monospace",fontSize:12}}/>:<div style={{fontSize:12,color:T.fg,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{profile[k]}</div>}
            </div>
          ))}
        </div>}

        {/* ═══ SETTINGS ═══════════════════════════════════════════ */}
        {tab==="settings"&&<div style={{animation:"fu .2s",maxWidth:700,margin:"0 auto"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:"0 0 20px"}}>⚙️ Settings</h2>
          <div style={{padding:20,borderRadius:12,background:T.card,border:"2px solid #6366f1",marginBottom:20}}>
            <h3 style={{fontSize:15,margin:"0 0 14px",color:"#a5b4fc"}}>🤖 AI Engine</h3>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
              {[{v:"gemini",label:"☁️ Gemini",sub:"Cloud API",desc:"Free key, 15 req/min.",c:"#10b981"},{v:"ollama",label:"🖥️ Ollama",sub:"Local LLM",desc:"Unlimited, private.",c:"#6366f1"},{v:"auto",label:"⚡ Auto",sub:"Smart Fallback",desc:"Ollama first, then Gemini.",c:"#f59e0b"}].map(opt=>{const active=(localStorage.getItem("fmj_ai_mode")||"gemini")===opt.v;return(
                <button key={opt.v} onClick={()=>{localStorage.setItem("fmj_ai_mode",opt.v);setApiSaved(true);setTimeout(()=>setApiSaved(false),1500)}} style={{padding:12,borderRadius:8,cursor:"pointer",border:`2px solid ${active?opt.c:"rgba(255,255,255,.06)"}`,background:active?`${opt.c}12`:"transparent",textAlign:"left"}}>
                  <div style={{fontSize:16,marginBottom:3}}>{opt.label}</div>
                  <div style={{fontSize:10,fontWeight:700,color:opt.c,marginBottom:2}}>{opt.sub}</div>
                  <div style={{fontSize:10,color:T.muted}}>{opt.desc}</div>
                </button>
              );})}
            </div>
          </div>
          <div style={{padding:20,borderRadius:12,background:T.card,border:"2px solid #10b981"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><h3 style={{fontSize:15,margin:0,color:"#6ee7b7"}}>🔑 Gemini API Key</h3><span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:"rgba(16,185,129,.15)",color:"#10b981",fontWeight:700}}>FREE</span></div>
            <p style={{fontSize:12,color:T.muted,marginBottom:10}}>Get your free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{color:"#6366f1"}}>aistudio.google.com</a></p>
            <div style={{display:"flex",gap:8}}>
              <input type="password" value={apiKey} onChange={e=>{setApiKey(e.target.value);localStorage.setItem("fmj_api_key",e.target.value)}} placeholder="AIzaSy..." style={{...IS,flex:1,fontFamily:"'JetBrains Mono',monospace"}}/>
              <button onClick={()=>{setApiSaved(true);setTimeout(()=>setApiSaved(false),2500)}} style={{padding:"9px 20px",background:apiSaved?"#10b981":"#6366f1",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700}}>{apiSaved?"✓ Saved!":"Save"}</button>
            </div>
            <div style={{marginTop:10,padding:"8px 12px",borderRadius:6,fontSize:12,background:apiKey?"rgba(16,185,129,.06)":"rgba(239,68,68,.06)",color:apiKey?"#10b981":"#ef4444"}}>{apiKey?"✅ Gemini key active — all AI features enabled!":"⚠️ Add your free Gemini key to enable AI tools"}</div>
          </div>
        </div>}

        {/* ═══ DEEP RESEARCH ══════════════════════════════════════ */}
        {tab==="research"&&<div style={{animation:"fu .2s"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:"0 0 4px"}}>🔬 Deep Research</h2>
          <p style={{fontSize:13,color:T.muted,marginBottom:20}}>Click 🔬 Deep Research on any job in Live Jobs tab. Reports cached here.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:12}}>
            {Object.entries(researchOut).map(([jid,report])=>{
              const job=jobs.find(j=>j.id===jid);if(!job)return null;
              return(<div key={jid} style={{padding:14,borderRadius:10,background:T.card,border:"1px solid rgba(139,92,246,.2)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div><div style={{fontWeight:700,color:darkMode?"#e0e7ff":T.fg,fontSize:13}}>{job.t}</div><div style={{fontSize:11,color:T.muted}}>{job.co}</div></div>
                  <button onClick={()=>setResearchOut(prev=>{const n={...prev};delete n[jid];return n})} style={{padding:"1px 7px",borderRadius:3,cursor:"pointer",fontSize:10,background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.1)",color:"#f87171"}}>✕</button>
                </div>
                <pre className="ao" style={{fontSize:10,maxHeight:300,overflow:"auto"}}>{report}</pre>
              </div>);
            })}
          </div>
          {Object.keys(researchOut).length===0&&<div style={{textAlign:"center",padding:60,color:T.muted}}><div style={{fontSize:40,marginBottom:12}}>🔬</div><p>Go to 📡 Live Jobs → click 🔬 Deep Research on any job card</p></div>}
        </div>}

        {/* ═══ RESUME BUILDER ═════════════════════════════════════ */}
        {tab==="resume_v"&&<div style={{animation:"fu .2s"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:"0 0 4px"}}>🧬 Resume Genetic Builder</h2>
          <p style={{fontSize:13,color:T.muted,marginBottom:16}}>Modular blocks — AI picks best 5 for any role, generates tailored PDF.</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <h3 style={{fontSize:14,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:0}}>📦 Blocks ({resumeBlocks.length})</h3>
                <button onClick={()=>setNewBlock({cat:"",title:"",content:"",tags:[],impact:""})} style={{padding:"4px 12px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600,background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.2)",color:"#6ee7b7"}}>+ New</button>
              </div>
              {newBlock&&<div style={{padding:12,borderRadius:8,background:T.card,border:`1px solid ${T.border}`,marginBottom:10}}>
                {[{k:"cat",l:"Category"},{k:"title",l:"Title"},{k:"impact",l:"Impact"}].map(f=><div key={f.k} style={{marginBottom:6}}><div style={{fontSize:10,color:T.muted,marginBottom:2}}>{f.l}</div><input value={newBlock[f.k]} onChange={e=>setNewBlock(b=>({...b,[f.k]:e.target.value}))} style={{...IS,fontSize:11,padding:"5px 8px"}}/></div>)}
                <div style={{marginBottom:6}}><div style={{fontSize:10,color:T.muted,marginBottom:2}}>Content</div><textarea value={newBlock.content} onChange={e=>setNewBlock(b=>({...b,content:e.target.value}))} rows={3} style={{...IS,fontSize:11,padding:"5px 8px",resize:"vertical"}}/></div>
                <div style={{marginBottom:8}}><div style={{fontSize:10,color:T.muted,marginBottom:2}}>Tags (comma separated)</div><input value={newBlock.tags?.join(",")||""} onChange={e=>setNewBlock(b=>({...b,tags:e.target.value.split(",").map(t=>t.trim())}))} style={{...IS,fontSize:11,padding:"5px 8px"}}/></div>
                <div style={{display:"flex",gap:6}}><button onClick={()=>{setResumeBlocks(prev=>[...prev,{...newBlock,id:"b"+Date.now()}]);setNewBlock(null)}} style={{padding:"4px 14px",borderRadius:5,cursor:"pointer",fontSize:11,fontWeight:600,background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.2)",color:"#6ee7b7"}}>✓ Save</button><button onClick={()=>setNewBlock(null)} style={{padding:"4px 10px",borderRadius:5,cursor:"pointer",fontSize:11,background:T.input,border:`1px solid ${T.border}`,color:T.muted}}>Cancel</button></div>
              </div>}
              <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:580,overflowY:"auto"}}>
                {resumeBlocks.map((b,i)=>{const sel=selectedBlocks.includes(i);return(
                  <div key={b.id} style={{padding:10,borderRadius:8,background:T.card,border:`2px solid ${sel?"#6366f1":T.border}`,cursor:"pointer"}} onClick={()=>setSelectedBlocks(prev=>sel?prev.filter(x=>x!==i):[...prev,i])}>
                    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}>
                      <span style={{fontSize:9,padding:"1px 6px",borderRadius:3,background:"rgba(99,102,241,.1)",color:"#a5b4fc",fontWeight:600}}>{b.cat}</span>
                      {sel&&<span style={{fontSize:9,color:"#6366f1",fontWeight:700}}>✓</span>}
                    </div>
                    <div style={{fontSize:12,fontWeight:600,color:darkMode?"#e0e7ff":T.fg}}>{b.title}</div>
                    <div style={{fontSize:10,color:"#10b981",fontWeight:600,marginTop:2}}>📈 {b.impact}</div>
                  </div>
                );})}
              </div>
            </div>
            <div>
              <div style={{padding:14,borderRadius:10,background:T.card,border:`1px solid ${T.border}`,marginBottom:12}}>
                <h3 style={{fontSize:14,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:"0 0 10px"}}>🤖 AI Block Selector</h3>
                <input value={rvJob} onChange={e=>setRvJob(e.target.value)} placeholder="Target role / job description..." style={{...IS,marginBottom:8}}/>
                <button onClick={runResumeVersion} disabled={rvLoad||!rvJob.trim()} style={{width:"100%",padding:"10px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,background:"linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.12))",border:"1px solid rgba(99,102,241,.2)",color:"#c7d2fe",marginBottom:8}}>{rvLoad?"Analyzing...":"🤖 Pick Best 5 Blocks"}</button>
                {rvOut&&!rvLoad&&<pre className="ao" style={{fontSize:11,maxHeight:300,overflow:"auto"}}>{rvOut}</pre>}
              </div>
              <div style={{padding:14,borderRadius:10,background:T.card,border:"1px solid rgba(16,185,129,.2)"}}>
                <h3 style={{fontSize:14,fontWeight:700,color:"#6ee7b7",margin:"0 0 8px"}}>📄 PDF Resume</h3>
                <p style={{fontSize:11,color:T.muted,marginBottom:8}}>{selectedBlocks.length} blocks selected. Opens in browser → Save as PDF.</p>
                <button onClick={generatePDF} disabled={selectedBlocks.length===0} style={{width:"100%",padding:"10px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,background:selectedBlocks.length>0?"linear-gradient(135deg,rgba(16,185,129,.12),rgba(5,150,105,.12))":"rgba(255,255,255,.02)",border:`1px solid ${selectedBlocks.length>0?"rgba(16,185,129,.25)":"rgba(255,255,255,.04)"}`,color:selectedBlocks.length>0?"#6ee7b7":"#374151"}}>🖨️ Print / Save PDF ({selectedBlocks.length} blocks)</button>
              </div>
            </div>
          </div>
        </div>}

        {/* ═══ ROADMAP ════════════════════════════════════════════ */}
        {tab==="roadmap"&&<div style={{animation:"fu .2s"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:"0 0 4px"}}>🗺️ Advanced Systems Roadmap</h2>
          <p style={{fontSize:12,color:T.muted,marginBottom:14}}>9 systems to build. Click any card for architecture details.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:10}}>
            {ROADMAP.map((r)=>{const open=roadmapOpen===r.id;return(
              <div key={r.id} style={{padding:14,borderRadius:10,background:T.card,border:`1px solid ${T.border}`,cursor:"pointer"}} onClick={()=>setRoadmapOpen(open?null:r.id)} className="hv">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:20}}>{r.icon}</span><h3 style={{fontSize:13,fontWeight:600,color:darkMode?"#e0e7ff":T.fg,margin:0}}>{r.title}</h3></div>
                    <p style={{fontSize:11,color:T.muted,margin:"0 0 8px"}}>{r.desc}</p>
                    <div style={{display:"flex",gap:6}}>
                      <span style={{fontSize:10,padding:"1px 7px",borderRadius:4,background:"rgba(245,158,11,.08)",color:"#fbbf24"}}>{r.difficulty}</span>
                      <span style={{fontSize:10,padding:"1px 7px",borderRadius:4,background:"rgba(99,102,241,.08)",color:"#a5b4fc"}}>{r.status}</span>
                    </div>
                  </div>
                  <span style={{fontSize:12,color:T.muted,transform:open?"rotate(180deg)":"rotate(0)"}}>▼</span>
                </div>
                {open&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${T.border}`}}>
                  <p style={{fontSize:11,color:T.muted,lineHeight:1.6,marginBottom:8}}>{r.details}</p>
                  <div style={{fontSize:10,color:"#a5b4fc",padding:8,borderRadius:6,background:"rgba(0,0,0,.15)",fontFamily:"'JetBrains Mono',monospace"}}>Stack: {r.stack}</div>
                </div>}
              </div>
            );})}
          </div>
        </div>}

        {/* ═══ MARKET INTELLIGENCE ════════════════════════════════ */}
        {tab==="market"&&<div style={{animation:"fu .2s"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
            <h2 style={{fontSize:20,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:0}}>📈 Global DevOps Market Intelligence</h2>
            <span style={{fontSize:10,padding:"3px 10px",borderRadius:10,background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.2)",color:"#6ee7b7",fontWeight:700}}>2026 DATA</span>
          </div>
          <p style={{fontSize:13,color:T.muted,marginBottom:20}}>Real market data — where to focus for maximum results.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:10,marginBottom:20}}>
            {[{v:"$10B+",l:"Market Size",c:"#6366f1",sub:"19-25% YoY growth"},{v:"8:1",l:"Demand/Supply",c:"#10b981",sub:"Massive talent gap"},{v:"48%",l:"Assessments Up",c:"#f59e0b",sub:"vs 2024"},{v:"$185k",l:"Senior SRE Avg",c:"#a78bfa",sub:"US full-time"},{v:"$280/hr",l:"Freelance Top",c:"#06b6d4",sub:"Senior specialist"}].map(s=>(
              <div key={s.l} className="market-card" style={{padding:16,borderRadius:12,background:T.card,border:`1px solid ${T.border}`,borderTop:`3px solid ${s.c}`}}>
                <div style={{fontSize:26,fontWeight:800,color:s.c}}>{s.v}</div>
                <div style={{fontSize:12,fontWeight:600,color:darkMode?"#e0e7ff":T.fg,margin:"4px 0 2px"}}>{s.l}</div>
                <div style={{fontSize:10,color:T.muted}}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <div style={{padding:16,borderRadius:12,background:T.card,border:`1px solid ${T.border}`}}>
              <h3 style={{fontSize:14,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:"0 0 12px"}}>🌍 Postings by Region</h3>
              {[{region:"🌐 Remote (Global)",count:"5,000+",c:"#06b6d4",w:100},{region:"🇮🇳 India",count:"3,000+",c:"#a78bfa",w:95},{region:"🇬🇧 United Kingdom",count:"2,800+",c:"#10b981",w:90},{region:"🇺🇸 United States",count:"1,800+",c:"#6366f1",w:75},{region:"🇳🇱 Netherlands",count:"500+",c:"#f59e0b",w:35},{region:"🇩🇪 Germany",count:"400+",c:"#ec4899",w:28}].map(r=>(
                <div key={r.region} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,color:darkMode?"#e0e7ff":T.fg}}>{r.region}</span><span style={{fontSize:11,fontWeight:700,color:r.c}}>{r.count}</span></div>
                  <div style={{height:5,borderRadius:3,background:T.border,overflow:"hidden"}}><div style={{height:"100%",width:`${r.w}%`,borderRadius:3,background:r.c}}/></div>
                </div>
              ))}
            </div>
            <div style={{padding:16,borderRadius:12,background:"rgba(16,185,129,.05)",border:"1px solid rgba(16,185,129,.15)"}}>
              <h3 style={{fontSize:14,fontWeight:700,color:"#6ee7b7",margin:"0 0 10px"}}>✅ Your Skills vs Market</h3>
              {[["EKS + Kubernetes","Platform Eng #1"],["Terraform + IaC","All roles"],["Falco + Kyverno","DevSecOps rare"],["Istio Service Mesh","Platform premium"],["SOC2/HIPAA","Healthcare niche"],["ArgoCD GitOps","High demand 2026"]].map(([skill,note])=>(
                <div key={skill} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.border}`}}>
                  <span style={{fontSize:12,color:darkMode?"#e0e7ff":T.fg,fontWeight:600}}>{skill}</span>
                  <span style={{fontSize:10,color:"#6ee7b7"}}>✓ {note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>}

      </div>

      <footer style={{textAlign:"center",padding:"14px 0 6px",borderTop:`1px solid ${T.border}`,color:T.muted,fontSize:11,marginTop:20}}>
        {profile.name} · FindMyJobs.store · Job Hunt Command Center v13 · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
