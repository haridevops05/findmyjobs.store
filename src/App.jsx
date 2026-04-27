import { useState, useEffect, useCallback, useRef, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════════
   FINDMYJOBS.STORE — COMMAND CENTER v10
   NEW: 📄 Resume Score Tab | 🎙️ Natural Voice-to-Voice Interview
   KEPT: All v9 features — 29 Portals, 9 AI Tools, Live Feed,
   Negotiation AI, Analytics, Quick Apply, Profile, Roadmap
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

const FEEDS=[
  {id:"remoteok",name:"RemoteOK",url:"https://remoteok.com/api?tag=devops",p:"rok"},
  {id:"remotive",name:"Remotive",url:"https://remotive.com/api/remote-jobs?category=devops",p:"rem"},
  {id:"arbeitnow",name:"Arbeitnow",url:"https://www.arbeitnow.com/api/job-board-api?search=devops",p:"abn"},
];
function parseJ(p,d){
  if(p==="rok")return(Array.isArray(d)?d:[]).filter(j=>j.position).slice(0,15).map(j=>({id:"r"+j.id,t:j.position,co:j.company||"?",url:j.url||"https://remoteok.com",dt:j.date||new Date().toISOString(),tags:(j.tags||[]).slice(0,5),sal:j.salary_min?`$${(j.salary_min/1e3).toFixed(0)}k–$${(j.salary_max/1e3).toFixed(0)}k`:null,loc:j.location||"Remote",src:"RemoteOK",desc:j.description||""}));
  if(p==="rem")return(d?.jobs||[]).slice(0,15).map(j=>({id:"m"+j.id,t:j.title,co:j.company_name,url:j.url,dt:j.publication_date,tags:[j.category,...(j.tags||[])].filter(Boolean).slice(0,5),sal:j.salary||null,loc:j.candidate_required_location||"Remote",src:"Remotive",desc:j.description||""}));
  if(p==="abn")return(d?.data||[]).slice(0,15).map(j=>({id:"a"+j.slug,t:j.title,co:j.company_name,url:j.url,dt:j.created_at?new Date(j.created_at*1e3).toISOString():new Date().toISOString(),tags:(j.tags||[]).slice(0,5),sal:null,loc:j.location||"Remote",src:"Arbeitnow",desc:j.description||""}));
  return[];
}
const DEMO=[
  {id:"d1",t:"Senior DevOps Engineer",co:"TechCorp Global",url:"https://remoteok.com/remote-devops-jobs",dt:new Date().toISOString(),tags:["kubernetes","aws","terraform","eks"],sal:"$150k–$200k",loc:"Remote (US)",src:"RemoteOK",desc:"Senior DevOps engineer: Kubernetes EKS, AWS, Terraform, CI/CD. Manage production infrastructure for microservices. GitOps, service mesh preferred."},
  {id:"d2",t:"Cloud Platform Architect",co:"FinanceAI",url:"https://remotive.com/remote-jobs/devops",dt:new Date(Date.now()-36e5).toISOString(),tags:["aws","gitops","argocd","istio"],sal:"$160k–$200k",loc:"Remote",src:"Remotive",desc:"Cloud architect: GitOps ArgoCD, Istio service mesh, AWS infra. SOC2 required."},
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

// ── Utilities ─────────────────────────────────────────────────────────
function safeBeep(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=new A();(c.state==="suspended"?c.resume():Promise.resolve()).then(()=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;o.type="sine";g.gain.setValueAtTime(.1,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.3);o.start();o.stop(c.currentTime+.3);o.onended=()=>c.close()}).catch(()=>{})}catch{}}

async function callAI(prompt,maxTokens=1200){
  try{
    const k=localStorage.getItem("fmj_api_key");
    if(!k)return"⚠️ Gemini API Key not set.\n\nGo to ⚙️ Settings tab → enter your Gemini API key.\nGet a FREE key at: https://aistudio.google.com/app/apikey\n(No credit card required!)";
    // Gemini 1.5 Flash — free tier: 15 req/min, 1500 req/day
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${k}`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        contents:[{parts:[{text:prompt}]}],
        generationConfig:{maxOutputTokens:maxTokens,temperature:0.7}
      })
    });
    if(!r.ok){const e=await r.json();throw new Error(e.error?.message||`HTTP ${r.status}`)}
    const d=await r.json();
    return d.candidates?.[0]?.content?.parts?.[0]?.text||"No response";
  }catch(e){return`AI Error: ${e.message}`}
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
  const[tab,setTab]=useState("live");

  // Portals
  const[ps,setPs]=useState(()=>{try{const s=JSON.parse(localStorage.getItem("fmj_ps")||"null");if(s)return s}catch{}return PL.reduce((a,p)=>{a[p.id]={st:"—",ck:null,notes:"",star:false};return a},{})});
  const[expId,setExpId]=useState(null);
  const[pSrch,setPSrch]=useState("");
  const[pFlt,setPFlt]=useState("all");
  const dPSrch=useDebounce(pSrch,300);

  // Jobs
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

  // AI per job
  const[scores,setScores]=useState(()=>{try{return JSON.parse(localStorage.getItem("fmj_scores")||"{}")}catch{return{}}});
  const[aiJob,setAiJob]=useState(null);
  const[aiType,setAiType]=useState(null);
  const[aiOut,setAiOut]=useState("");
  const[aiLoad,setAiLoad]=useState(false);

  // Negotiation
  const[negoIn,setNegoIn]=useState("");
  const[negoOut,setNegoOut]=useState("");
  const[negoLoad,setNegoLoad]=useState(false);

  // Copy state
  const[cpd,setCpd]=useState(null);

  // Roadmap
  const[roadmapOpen,setRoadmapOpen]=useState(null);

  // API Key
  const[apiKey,setApiKey]=useState(()=>localStorage.getItem("fmj_api_key")||"");
  const[apiSaved,setApiSaved]=useState(false);

  // ── RESUME SCORE STATE ─────────────────────────────────────────────
  const[resumeFile,setResumeFile]=useState(null);
  const[resumeText,setResumeText]=useState(""); // pasted text fallback
  const[resumeScore,setResumeScore]=useState(null); // full AI response
  const[resumeLoading,setResumeLoading]=useState(false);
  const[resumeTarget,setResumeTarget]=useState("Senior DevOps Engineer"); // target role
  const resumeFileRef=useRef(null);

  // ── VOICE INTERVIEW STATE ──────────────────────────────────────────
  const[ivActive,setIvActive]=useState(false);
  const[ivRole,setIvRole]=useState("Senior DevOps Engineer");
  const[ivCompany,setIvCompany]=useState("");
  const[ivMessages,setIvMessages]=useState([]); // [{role:"ai"|"user", text, ts}]
  const[ivLoading,setIvLoading]=useState(false);  // Claude is thinking
  const[ivListening,setIvListening]=useState(false); // mic is on
  const[ivSpeaking,setIvSpeaking]=useState(false);   // TTS playing
  const[ivVoiceOn,setIvVoiceOn]=useState(true);
  const[ivTranscript,setIvTranscript]=useState(""); // live speech-to-text
  const[ivEnded,setIvEnded]=useState(false);
  const[ivSessionScore,setIvSessionScore]=useState(null);

  const synthRef=useRef(window.speechSynthesis);
  const recRef=useRef(null);
  const chatRef=useRef(null);
  const intRef=useRef(null);

  // ── PERSIST ────────────────────────────────────────────────────────
  useEffect(()=>{localStorage.setItem("fmj_seen",JSON.stringify([...seen]))},[seen]);
  useEffect(()=>{localStorage.setItem("fmj_scores",JSON.stringify(scores))},[scores]);
  useEffect(()=>{localStorage.setItem("fmj_ps",JSON.stringify(ps))},[ps]);

  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight},[ivMessages,ivTranscript]);

  // ── HELPERS ────────────────────────────────────────────────────────
  const upd=(id,u)=>setPs(p=>({...p,[id]:{...p[id],...u}}));
  const cyc=id=>{const i=ST.indexOf(ps[id].st);upd(id,{st:ST[(i+1)%ST.length]})};
  const cp=async(t,f)=>{try{await navigator.clipboard.writeText(t);setCpd(f);setTimeout(()=>setCpd(null),2e3)}catch{}};
  const profStr=()=>`${profile.name} | ${profile.title} | ${profile.exp}\nSkills: ${profile.skills}\nCerts: ${profile.certs}\nMetrics: ${profile.highlights}\nCurrent: ${profile.current}\nSummary: ${profile.sum}`;

  // ── TTS ────────────────────────────────────────────────────────────
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

  // ── SPEECH RECOGNITION ────────────────────────────────────────────
  const startListening=useCallback(()=>{
    try{
      const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!SR){alert("Speech recognition not available. Use Chrome or Edge.");return;}
      if(recRef.current){try{recRef.current.stop()}catch{}}
      const rec=new SR();
      rec.continuous=true;
      rec.interimResults=true;
      rec.lang="en-US";
      setIvListening(true);
      setIvTranscript("");
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
      rec.start();
      recRef.current=rec;
    }catch(e){alert("Mic error: "+e.message)}
  },[]);

  const stopListening=useCallback(()=>{
    try{if(recRef.current)recRef.current.stop()}catch{}
    setIvListening(false);
  },[]);

  // ── INTERVIEW ENGINE ───────────────────────────────────────────────
  // The key: Claude acts as a REAL interviewer.
  // No fixed question count. It reads the conversation history and decides
  // naturally when to probe deeper, change topic, wrap up.
  // Every question is grounded in the candidate's actual resume.
  const INTERVIEWER_SYSTEM=()=>`You are a senior technical interviewer at a top tech company.
You are interviewing ${profile.name} for: ${ivRole}${ivCompany?` at ${ivCompany}`:""}

CANDIDATE PROFILE (study this carefully — all your questions must reference their actual experience):
${profStr()}

INTERVIEW RULES:
- Behave exactly like a real human interviewer — natural, conversational, warm but professional
- Ask ONE question at a time. Never list multiple questions.
- Base questions on the candidate's ACTUAL resume — reference specific things they've done
  e.g. "You mentioned reducing CI from 45min to 8min — walk me through how you achieved that"
  e.g. "Your EKS setup handled 20+ microservices at 99.9% — what was your HA strategy?"
  e.g. "You worked with Falco + Kyverno — describe a real security incident you caught in production"
- Mix question types naturally: technical depth → real scenarios → behavioral → situational
- After each answer: give brief natural feedback (1-2 sentences) then ask your next question
- If an answer is vague: dig deeper with "Can you be more specific?" or "Give me a concrete example"
- If an answer is excellent: acknowledge it genuinely, then probe even deeper
- Decide YOURSELF when the interview feels complete (typically after 15-25 min of conversation)
- When wrapping up: say it naturally like "I think we've covered everything well..." then give honest feedback
- Keep responses under 120 words (you're speaking, not writing an essay)`;

  const startInterview=async()=>{
    if(!ivRole.trim())return;
    setIvActive(true);setIvMessages([]);setIvEnded(false);setIvSessionScore(null);setIvLoading(true);
    const opening=await callAI(`${INTERVIEWER_SYSTEM()}\n\nThis is the START of the interview. Greet the candidate warmly (1-2 sentences), introduce yourself briefly, then ask your FIRST question — make it specific to something in their resume. Keep it under 80 words total.`,300);
    const msg={role:"ai",text:opening,ts:Date.now()};
    setIvMessages([msg]);
    setIvLoading(false);
    if(ivVoiceOn)speak(opening);
  };

  const sendAnswer=async(answer)=>{
    if(!answer.trim()||ivLoading||ivEnded)return;
    stopSpeaking();
    setIvTranscript("");
    const userMsg={role:"user",text:answer,ts:Date.now()};
    setIvMessages(h=>[...h,userMsg]);
    setIvLoading(true);

    const history=[...ivMessages,userMsg].map(m=>`${m.role==="ai"?"INTERVIEWER":"CANDIDATE"}: ${m.text}`).join("\n\n");
    const questionCount=ivMessages.filter(m=>m.role==="ai").length;

    const prompt=`${INTERVIEWER_SYSTEM()}

CONVERSATION SO FAR:
${history}

CANDIDATE JUST SAID: "${answer}"

${questionCount>=8?"You've asked ${questionCount} questions. Consider whether the interview has covered enough ground. If yes, wrap it up naturally with honest feedback and a score out of 10 for each: Technical Depth, Communication, Real-World Experience. If there's still a key area uncovered, ask one more question.":"Respond naturally as the interviewer. Give brief feedback on their answer (1-2 sentences), then ask your next question grounded in their resume. ONE question only. Under 120 words total."}`;

    const response=await callAI(prompt,400);

    // Detect if Claude is wrapping up
    const isEnding=/(overall|final|wrap|conclude|session|score|10|that.{0,20}covers|good luck|best of luck|thank you for)/i.test(response)&&questionCount>=6;

    const aiMsg={role:"ai",text:response,ts:Date.now()};
    setIvMessages(h=>[...h,aiMsg]);
    setIvLoading(false);
    if(isEnding)setIvEnded(true);
    if(ivVoiceOn)speak(response);
  };

  // ── RESUME SCORER ─────────────────────────────────────────────────
  const scoreResume=async()=>{
    const content=resumeText.trim();
    if(!content&&!resumeFile){alert("Paste your resume text or upload a file");return;}
    setResumeLoading(true);setResumeScore(null);
    let text=content;
    if(!text&&resumeFile){try{text=await resumeFile.text()}catch{text="[Binary file — analyzing from profile data]"}}
    const r=await callAI(`You are an elite resume coach + ATS expert for DevOps/Cloud roles.

CANDIDATE PROFILE (for context):
${profStr()}

TARGET ROLE: ${resumeTarget}

RESUME CONTENT:
${text.substring(0,3000)}

Provide a comprehensive resume analysis:

📊 OVERALL SCORE: X/100
Breakdown:
- Impact & Metrics: X/25
- Technical Depth: X/25  
- ATS Optimization: X/25
- Structure & Clarity: X/25

✅ TOP STRENGTHS (3-4 specific things done exceptionally well — quote actual lines from the resume)

🔴 CRITICAL GAPS (things that WILL cause ATS rejection or recruiter rejection)

💡 TOP 5 IMPROVEMENT ACTIONS (in priority order):
For each: [SECTION] → Before: "exact current text" → After: "exact improved text"

🔍 ATS KEYWORD GAPS (15 keywords missing that ${resumeTarget} roles need — sorted by importance)

📝 REWRITTEN PROFESSIONAL SUMMARY (3 sentences, ATS-optimized for ${resumeTarget})

📈 SALARY IMPACT: What this resume can currently command vs. what it COULD command after fixes

⚡ ONE THING to fix in the next 30 minutes for maximum impact`,2500);
    setResumeScore(r);setResumeLoading(false);
  };

  // ── JOB FEED ──────────────────────────────────────────────────────
  const fetchAll=useCallback(async()=>{
    setLoading(true);setFErr([]);setDemo(false);let res=[];const errs=[];
    for(const f of FEEDS){try{const r=await fetch(f.url);if(!r.ok)throw new Error(`${r.status}`);const d=await r.json();res.push(...parseJ(f.p,d))}catch(e){errs.push({n:f.name,m:e.message})}}
    if(errs.length)setFErr(errs);if(!res.length){res=[...DEMO];setDemo(true)}
    res.sort((a,b)=>new Date(b.dt)-new Date(a.dt));
    const uniq=new Map();res.forEach(j=>uniq.set(j.url,j));res=[...uniq.values()];
    if(seen.size>0){const n=res.filter(j=>!seen.has(j.id));if(n.length){setFresh(new Set(n.map(j=>j.id)));setBanner(n.length);safeBeep();setTimeout(()=>setBanner(null),8e3)}}
    setSeen(new Set(res.map(j=>j.id)));setJobs(res);setLastF(new Date());setLoading(false);
  },[seen]);

  useEffect(()=>{fetchAll()},[]);// eslint-disable-line
  useEffect(()=>{if(autoR){intRef.current=setInterval(fetchAll,12e4)}return()=>{clearInterval(intRef.current);intRef.current=null}},[autoR,fetchAll]);

  // ── AI PER JOB ────────────────────────────────────────────────────
  const runAI=async(job,type)=>{
    setAiJob(job.id);setAiType(type);setAiOut("");setAiLoad(true);
    const prof=profStr();
    const jd=`${job.t}@${job.co}|${job.loc}|${job.sal||"N/A"}\nTags:${job.tags.join(",")}\nDesc:${(job.desc||"").substring(0,600)}`;
    const prompts={
      score:`Score 0-100 match.\nSCORE: X/100\nLEVEL: Excellent/Strong/Good/Fair/Weak\n\n✅ MATCHING:\n- skill: why\n\n⚠️ GAPS:\n- gap: suggestion\n\n📊 VERDICT: 2 sentences\n\nCANDIDATE:\n${prof}\n\nJOB:\n${jd}`,
      cover:`180-word cover letter. Specific metrics. Strong hook. Body only.\n\nCANDIDATE:\n${prof}\n\nJOB:\n${jd}`,
      interview:`7 most likely interview questions. Per question:\n- Question\n- Why asked\n- Answer using candidate's experience (2-3 bullets)\n\nCANDIDATE:\n${prof}\n\nJOB:\n${jd}`,
      resume:`5 specific resume tailoring tips.\nFormat: NUM. TITLE\n→ Exact change\n\nCANDIDATE:\n${prof}\n\nJOB:\n${jd}`,
      elevator:`30-second elevator pitch. Punchy, metric-heavy. Under 80 words.\n\nCANDIDATE:\n${prof}\n\nJOB:\n${jd}`,
      ats:`ATS analysis:\n1. TOP 15 KEYWORDS ranked (✅ HAS / ❌ MISSING)\n2. EXACT PHRASES to add\n3. ATS PASS SCORE (0-100)\n4. ATS-OPTIMIZED SUMMARY\n\nCANDIDATE:\n${prof}\n\nJOB:\n${jd}`,
      research:`Company intel:\n1. 🏢 OVERVIEW\n2. 🛠️ TECH STACK\n3. 📈 GROWTH SIGNALS\n4. 🎯 WHY HIRING\n5. 💡 INTERVIEW ANGLE\n6. ⚠️ RED FLAGS\n\nCompany: ${job.co}\nRole: ${job.t}\nDesc: ${(job.desc||"").substring(0,500)}`,
      compete:`Competitive advantage analysis:\n1. 🏆 YOUR EDGE (specific metrics)\n2. 📊 MARKET POSITION (top X%)\n3. 🎯 KILLER DIFFERENTIATORS\n4. ⚠️ WEAKNESSES TO ADDRESS\n5. 🗣️ POSITIONING STATEMENT\n\nCANDIDATE:\n${prof}\n\nJOB:\n${jd}`,
      referral:`3 LinkedIn referral messages (<150 words each):\n1. MUTUAL CONNECTION\n2. COLD OUTREACH\n3. ALUMNI/COMMUNITY\n\nCandidate: ${profile.name} | ${profile.title}\nTarget: ${job.co} | ${job.t}\nHighlights: ${profile.highlights}`,
    };
    const r=await callAI(prompts[type]||prompts.score);
    setAiOut(r);setAiLoad(false);
    if(type==="score"){const m=r.match(/SCORE:\s*(\d+)/);if(m)setScores(p=>({...p,[job.id]:parseInt(m[1])}))}
  };

  // ── NEGOTIATION ───────────────────────────────────────────────────
  const runNego=async()=>{
    if(!negoIn.trim())return;setNegoLoad(true);setNegoOut("");
    const r=await callAI(`Expert salary negotiation coach.\n\nCANDIDATE: ${profile.name}|${profile.title}|${profile.exp}|${profile.certs}\nMetrics: ${profile.highlights}\n\nOFFER:\n${negoIn}\n\n1. 📊 OFFER BREAKDOWN\n2. 📈 MARKET COMPARISON\n3. 💰 COUNTER-OFFER (specific numbers)\n4. 📝 COUNTER EMAIL DRAFT\n5. 🎯 3 NEGOTIATION TIPS\n6. ⚠️ RED FLAGS\n7. 🚪 WALK-AWAY NUMBER`,1500);
    setNegoOut(r);setNegoLoad(false);
  };

  // ── EXPORT ────────────────────────────────────────────────────────
  const exportCSV=()=>{const rows=[["Portal","Type","Status","Starred","Checked","Notes"]];PL.forEach(p=>{const s=ps[p.id];rows.push([p.n,p.t,s.st,s.star?"Yes":"No",s.ck?new Date(s.ck).toLocaleDateString():"—",(s.notes||"").replace(/,/g,";")]);});const b=new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="findmyjobs.csv";a.click();URL.revokeObjectURL(u);};
  const exportJSON=()=>{const b=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),profile,portals:PL.map(p=>({...p,status:ps[p.id]})),scores},null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="findmyjobs.json";a.click();URL.revokeObjectURL(u);};

  // ── FILTERED DATA ─────────────────────────────────────────────────
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

  // ── THEME ─────────────────────────────────────────────────────────
  const T={bg:darkMode?"#03040a":"#f0f4f8",fg:darkMode?"#adb5c4":"#1a202c",card:darkMode?"rgba(255,255,255,.012)":"#fff",border:darkMode?"rgba(255,255,255,.025)":"#e2e8f0",input:darkMode?"rgba(255,255,255,.04)":"#f7fafc",muted:darkMode?"#4b5563":"#64748b"};
  const IS={padding:"9px 12px",borderRadius:8,background:T.input,border:`1px solid ${T.border}`,color:T.fg,fontSize:13,fontFamily:"inherit",width:"100%"};

  const TABS=[
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
  ];

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
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
        .hv:hover{border-color:rgba(99,102,241,.3)!important;transform:translateY(-1px)}
        .ab:hover{filter:brightness(1.15);transform:translateY(-1px)}
        input:focus,textarea:focus,select:focus{border-color:rgba(99,102,241,.4)!important;outline:none}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(99,102,241,.2);border-radius:2px}
        .nj{animation:nj 3s forwards}
        .spin{width:13px;height:13px;border:2px solid rgba(99,102,241,.15);border-top-color:#6366f1;border-radius:50%;animation:sp .7s linear infinite;display:inline-block;flex-shrink:0}
        pre.ao{white-space:pre-wrap;word-wrap:break-word;font-size:12px;line-height:1.65;color:${darkMode?"#c9d1d9":T.fg};font-family:'JetBrains Mono',monospace;margin:0}
        .job-card:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(99,102,241,.12)}
        .mic-pulse::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:2px solid #ef4444;animation:pulse-ring 1.2s infinite}
      `}</style>

      <div style={{position:"fixed",inset:0,backgroundImage:"radial-gradient(rgba(99,102,241,.015) 1px,transparent 1px)",backgroundSize:"16px 16px",pointerEvents:"none"}}/>

      {/* NEW JOBS BANNER */}
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
              <h1 style={{fontWeight:700,fontSize:18,color:darkMode?"#e0e7ff":T.fg,margin:0}}>Job Hunt Command Center <span style={{fontSize:10,color:T.muted,fontWeight:400}}>v10</span></h1>
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

        {/* Funnel mini-bar */}
        {fT>0&&<div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>
          {[{l:"Applied",v:funnel.applied,c:"#f59e0b"},{l:"Screen",v:funnel.screen,c:"#06b6d4"},{l:"Interview",v:funnel.interview,c:"#a78bfa"},{l:"Offer",v:funnel.offer,c:"#10b981"},{l:"Rejected",v:funnel.rejected,c:"#ef4444"}].filter(s=>s.v>0).map(s=>(
            <div key={s.l} style={{padding:"3px 10px",borderRadius:4,background:`${s.c}10`,border:`1px solid ${s.c}20`,fontSize:11,color:s.c,fontWeight:600}}><b>{s.v}</b> {s.l}</div>
          ))}
        </div>}

        {/* TABS */}
        <div style={{display:"flex",gap:1,marginBottom:14,borderBottom:`1px solid ${T.border}`,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          {TABS.map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"10px 14px",border:"none",borderBottom:tab===t.k?"3px solid #6366f1":"3px solid transparent",cursor:"pointer",fontSize:12,fontWeight:tab===t.k?700:400,color:tab===t.k?"#6366f1":T.muted,background:"transparent",whiteSpace:"nowrap",transition:"all .15s",position:"relative"}}>
              {t.l}
              {t.b!=null&&<span style={{marginLeft:4,fontSize:10,padding:"1px 5px",borderRadius:8,background:tab===t.k?"rgba(99,102,241,.15)":T.input,color:tab===t.k?"#a5b4fc":T.muted}}>{t.b}</span>}
              {t.gw&&<span style={{position:"absolute",top:4,right:4,width:7,height:7,borderRadius:"50%",background:"#10b981",animation:"gw 1.5s infinite"}}/>}
            </button>
          ))}
        </div>

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
          {loading&&<div style={{textAlign:"center",padding:40}}><div className="spin" style={{width:32,height:32,margin:"0 auto 10px"}}/><p style={{color:T.muted}}>Fetching live DevOps jobs...</p></div>}
          {!loading&&filteredJobs.length===0&&<div style={{textAlign:"center",padding:60,color:T.muted}}><p style={{fontSize:18,marginBottom:8}}>😕 No jobs found</p><p>Try different search terms</p></div>}
          {!loading&&<>
            <p style={{color:T.muted,fontSize:12,marginBottom:12}}>Showing {filteredJobs.length} of {jobs.length} jobs{activeSearch?` matching "${activeSearch}"`:""}  ·  9 AI tools per job</p>
            {filteredJobs.map((j,i)=>{const isN=fresh.has(j.id),sc=scores[j.id],aiO=aiJob===j.id;return(
              <div key={j.id} style={{marginBottom:10,animation:`fu .2s ${Math.min(i*20,200)}ms both`}}>
                <div className={`job-card${isN?" nj":""}`} style={{padding:16,borderRadius:10,background:T.card,border:`1px solid ${isN?"rgba(16,185,129,.25)":T.border}`,position:"relative",transition:"all .2s"}}>
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
                    <a href={j.url} target="_blank" rel="noopener noreferrer" className="ab" style={{padding:"8px 18px",borderRadius:8,flexShrink:0,background:isN?"linear-gradient(135deg,rgba(16,185,129,.18),rgba(5,150,105,.18))":"linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.12))",border:`1px solid ${isN?"rgba(16,185,129,.3)":"rgba(99,102,241,.2)"}`,color:isN?"#6ee7b7":"#c7d2fe",textDecoration:"none",fontSize:12,fontWeight:700,transition:"all .15s"}}>Apply ↗</a>
                  </div>
                  <div style={{display:"flex",gap:5,marginTop:12,flexWrap:"wrap"}}>
                    {AI_BTNS.map(a=>(
                      <button key={a.ty} onClick={()=>runAI(j,a.ty)} className="ab" style={{padding:"4px 10px",borderRadius:5,cursor:"pointer",fontSize:11,fontWeight:500,background:aiJob===j.id&&aiType===a.ty?`${a.c}18`:`${a.c}08`,border:`1px solid ${aiJob===j.id&&aiType===a.ty?`${a.c}35`:`${a.c}15`}`,color:a.c,transition:"all .15s"}}>{a.lb}</button>
                    ))}
                  </div>
                </div>
                {aiO&&<div style={{margin:"2px 0 0",padding:14,borderRadius:"0 0 10px 10px",background:"rgba(99,102,241,.03)",border:`1px solid rgba(99,102,241,.1)`,borderTop:"none"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontSize:12,fontWeight:600,color:"#a5b4fc"}}>🤖 {AI_LABELS[aiType]||"AI Analysis"}</span>
                    <div style={{display:"flex",gap:5}}>
                      {!aiLoad&&aiOut&&<button onClick={()=>cp(aiOut,"ai")} style={{padding:"2px 9px",borderRadius:4,cursor:"pointer",fontSize:10,background:cpd==="ai"?"rgba(16,185,129,.1)":T.input,border:`1px solid ${T.border}`,color:cpd==="ai"?"#10b981":T.muted}}>{cpd==="ai"?"✓ Copied":"📋 Copy"}</button>}
                      <button onClick={()=>{setAiJob(null);setAiType(null);setAiOut("")}} style={{padding:"2px 7px",borderRadius:4,cursor:"pointer",fontSize:10,background:T.input,border:`1px solid ${T.border}`,color:T.muted}}>✕</button>
                    </div>
                  </div>
                  {aiLoad?<div style={{display:"flex",alignItems:"center",gap:10,padding:10}}><div className="spin"/><span style={{fontSize:12,color:T.muted}}>Claude is analyzing...</span></div>
                  :<pre className="ao">{aiOut}</pre>}
                </div>}
              </div>
            );})}
          </>}
        </div>}

        {/* ═══ ALL PORTALS ════════════════════════════════════════ */}
        {tab==="portals"&&<div style={{animation:"fu .2s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div><h2 style={{fontSize:18,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:0}}>📋 All Job Portals — {PL.length} Portals</h2><p style={{color:T.muted,fontSize:12,marginTop:3}}>Track status, set alerts, take notes on every portal</p></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:8,marginBottom:14}}>
            {[{l:"Total",v:pCounts.all,c:darkMode?"#e0e7ff":T.fg},{l:"Starred",v:pCounts.star,c:"#f59e0b"},{l:"Unchecked",v:pCounts.unc,c:"#ef4444"},{l:"Must-Have",v:pCounts.must,c:"#ef4444"},{l:"Premium",v:pCounts.premium,c:"#f59e0b"},{l:"Major",v:pCounts.major,c:"#6366f1"}].map(s=>(
              <div key={s.l} style={{padding:"8px 10px",borderRadius:8,background:T.card,border:`1px solid ${T.border}`,textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:T.muted}}>{s.l}</div></div>
            ))}
          </div>
          <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
            <input value={pSrch} onChange={e=>setPSrch(e.target.value)} placeholder="🔍 Search portals..." style={{...IS,flex:"1 1 160px",width:"auto"}}/>
            {[{l:`All (${pCounts.all})`,f:"all"},{l:`⭐ (${pCounts.star})`,f:"star"},{l:`❓ Unchecked`,f:"unc"},...Object.entries(TL).map(([k,l])=>({l:`${l.split(" ")[0]} (${pCounts[k]||0})`,f:k}))].map(x=>(
              <button key={x.f} onClick={()=>setPFlt(pFlt===x.f?"all":x.f)} style={{padding:"5px 10px",borderRadius:6,cursor:"pointer",fontSize:11,border:`1px solid ${pFlt===x.f?"rgba(99,102,241,.3)":T.border}`,background:pFlt===x.f?"rgba(99,102,241,.1)":T.input,color:pFlt===x.f?"#a5b4fc":T.muted,whiteSpace:"nowrap"}}>{x.l}</button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:8}}>
            {fPtls.map((p,i)=>{const s=ps[p.id],ex=expId===p.id;return(
              <div key={p.id} className="hv" style={{padding:12,borderRadius:10,background:T.card,border:`1px solid ${s.star?"rgba(245,158,11,.2)":T.border}`,borderLeft:`4px solid ${TC[p.t]}`,animation:`fu .2s ${Math.min(i*10,150)}ms both`,transition:"all .2s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                      <a href={p.u} target="_blank" rel="noopener noreferrer" onClick={()=>upd(p.id,{ck:new Date().toISOString()})} style={{color:darkMode?"#e0e7ff":T.fg,textDecoration:"none",fontSize:13,fontWeight:700}}>{p.n}</a>
                      {p.api&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:"rgba(16,185,129,.1)",color:"#6ee7b7",border:"1px solid rgba(16,185,129,.2)"}}>LIVE API</span>}
                      {s.star&&<span style={{fontSize:12}}>🔥</span>}
                    </div>
                    <p style={{fontSize:11,color:T.muted,margin:0}}>{p.desc}</p>
                  </div>
                  <button onClick={()=>cyc(p.id)} style={{padding:"2px 8px",borderRadius:4,cursor:"pointer",background:`${STC[s.st]}10`,border:`1px solid ${STC[s.st]}20`,color:STC[s.st],fontSize:10,fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>{s.st}</button>
                </div>
                <div style={{display:"flex",gap:5,marginTop:8}}>
                  <a href={p.u} target="_blank" rel="noopener noreferrer" onClick={()=>upd(p.id,{ck:new Date().toISOString()})} className="ab" style={{flex:1,textAlign:"center",padding:"4px 6px",borderRadius:5,background:"rgba(99,102,241,.07)",border:"1px solid rgba(99,102,241,.12)",color:"#a5b4fc",textDecoration:"none",fontSize:11,transition:"all .15s"}}>Search ↗</a>
                  {p.au&&<a href={p.au} target="_blank" rel="noopener noreferrer" className="ab" style={{padding:"4px 8px",borderRadius:5,background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,.12)",color:"#fbbf24",textDecoration:"none",fontSize:11}}>🔔</a>}
                  <button onClick={()=>upd(p.id,{star:!s.star})} className="ab" style={{padding:"4px 8px",borderRadius:5,cursor:"pointer",background:s.star?"rgba(245,158,11,.08)":"transparent",border:`1px solid ${s.star?"rgba(245,158,11,.15)":T.border}`,color:s.star?"#f59e0b":T.muted,fontSize:11}}>{s.star?"★":"☆"}</button>
                  <button onClick={()=>setExpId(ex?null:p.id)} className="ab" style={{padding:"4px 8px",borderRadius:5,cursor:"pointer",border:`1px solid ${T.border}`,color:T.muted,fontSize:11,background:"transparent"}}>✎</button>
                </div>
                {ex&&<textarea value={s.notes} onChange={e=>upd(p.id,{notes:e.target.value})} placeholder="Notes (recruiter name, feedback, next steps...)" style={{width:"100%",minHeight:40,marginTop:8,padding:6,borderRadius:5,background:"rgba(0,0,0,.15)",border:`1px solid ${T.border}`,color:T.fg,fontSize:11,fontFamily:"inherit",resize:"vertical"}}/>}
                {s.ck&&<p style={{fontSize:9,color:T.muted,marginTop:4}}>Checked: {new Date(s.ck).toLocaleDateString()}</p>}
              </div>
            );})}
          </div>
        </div>}

        {/* ═══ VOICE INTERVIEW ════════════════════════════════════ */}
        {tab==="interview"&&<div style={{animation:"fu .2s",maxWidth:860,margin:"0 auto"}}>
          <h2 style={{fontSize:20,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:"0 0 4px"}}>🎙️ AI Voice Mock Interview</h2>
          <p style={{fontSize:13,color:T.muted,marginBottom:20}}>
            Claude acts as your real interviewer — asks scenario-based questions from your actual resume, responds to your answers naturally, digs deeper, and wraps up when satisfied. No fixed question count. Just like a real interview.
          </p>

          {!ivActive&&!ivEnded&&<div style={{textAlign:"center"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,maxWidth:520,margin:"0 auto 28px",textAlign:"left"}}>
              {["✅ Questions based on YOUR actual resume","✅ Real scenario-based technical questions","✅ Claude digs deeper if answers are vague","✅ Natural conversation — no fixed count","✅ Voice-to-voice (you speak, Claude speaks)","✅ Wraps up naturally when interview is complete"].map(f=>(
                <div key={f} style={{padding:"10px 14px",background:T.card,borderRadius:8,border:`1px solid ${T.border}`,fontSize:12}}>{f}</div>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10,maxWidth:480,margin:"0 auto 20px"}}>
              <div>
                <label style={{fontSize:12,color:T.muted,display:"block",marginBottom:5}}>Target Role</label>
                <input value={ivRole} onChange={e=>setIvRole(e.target.value)} placeholder="e.g. Senior DevOps Engineer" style={IS}/>
              </div>
              <div>
                <label style={{fontSize:12,color:T.muted,display:"block",marginBottom:5}}>Company (optional)</label>
                <input value={ivCompany} onChange={e=>setIvCompany(e.target.value)} placeholder="e.g. Netflix, Stripe (leaves blank for generic)" style={IS}/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:10}}>
              <button onClick={startInterview} disabled={!ivRole.trim()||ivLoading} style={{padding:"14px 36px",background:"#6366f1",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:16}}>{ivLoading?"Starting...":"🎙️ Start Interview"}</button>
              <button onClick={()=>setIvVoiceOn(!ivVoiceOn)} style={{padding:"14px 18px",background:ivVoiceOn?"rgba(16,185,129,.1)":"rgba(255,255,255,.04)",color:ivVoiceOn?"#10b981":T.muted,border:`1px solid ${ivVoiceOn?"rgba(16,185,129,.3)":T.border}`,borderRadius:10,cursor:"pointer",fontWeight:600,fontSize:14}}>{ivVoiceOn?"🔊 Voice ON":"🔇 Voice OFF"}</button>
            </div>
          </div>}

          {(ivActive||ivEnded)&&<div>
            {/* Status bar */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,padding:"10px 16px",background:"rgba(99,102,241,.06)",borderRadius:10,border:`1px solid rgba(99,102,241,.12)`,flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{position:"relative",width:10,height:10}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:ivEnded?"#6b7280":ivSpeaking?"#f59e0b":ivListening?"#10b981":"#6366f1",animation:ivEnded?"none":"pl 1.5s infinite"}}/>
                </div>
                <span style={{fontSize:13,color:T.muted}}>
                  {ivEnded?"Interview complete":ivLoading?"Claude is thinking...":ivSpeaking?"Claude is speaking...":ivListening?"Listening to you...":"Your turn — press 🎤 to speak"}
                </span>
                <span style={{fontSize:12,fontWeight:600,color:darkMode?"#e0e7ff":T.fg}}>· {ivRole}{ivCompany?` @ ${ivCompany}`:""}</span>
                <span style={{fontSize:11,color:T.muted}}>· {ivMessages.filter(m=>m.role==="ai").length} exchanges</span>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setIvVoiceOn(!ivVoiceOn)} style={{padding:"5px 12px",fontSize:11,background:ivVoiceOn?"rgba(16,185,129,.1)":T.input,color:ivVoiceOn?"#10b981":T.muted,border:`1px solid ${T.border}`,borderRadius:6,cursor:"pointer"}}>{ivVoiceOn?"🔊":"🔇"}</button>
                {ivSpeaking&&<button onClick={stopSpeaking} style={{padding:"5px 12px",fontSize:11,background:"rgba(245,158,11,.1)",color:"#f59e0b",border:"1px solid rgba(245,158,11,.2)",borderRadius:6,cursor:"pointer"}}>⏹ Stop</button>}
                <button onClick={()=>{stopSpeaking();stopListening();setIvActive(false);setIvEnded(false);setIvMessages([]);setIvTranscript("")}} style={{padding:"5px 12px",fontSize:11,background:"rgba(239,68,68,.08)",color:"#ef4444",border:"1px solid rgba(239,68,68,.15)",borderRadius:6,cursor:"pointer",fontWeight:600}}>End Interview</button>
              </div>
            </div>

            {/* Chat */}
            <div ref={chatRef} style={{display:"flex",flexDirection:"column",gap:12,maxHeight:460,overflowY:"auto",padding:16,background:"rgba(0,0,0,.15)",borderRadius:12,marginBottom:12}}>
              {ivMessages.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",animation:"fu .2s"}}>
                  <div style={{maxWidth:"78%",padding:"12px 16px",borderRadius:12,background:m.role==="user"?"#6366f1":T.card,border:m.role==="ai"?`1px solid ${T.border}`:"none"}}>
                    <div style={{fontSize:10,fontWeight:700,marginBottom:4,opacity:.6}}>{m.role==="ai"?"🤖 INTERVIEWER":"👤 YOU"}</div>
                    <div style={{fontSize:14,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{m.text}</div>
                  </div>
                </div>
              ))}
              {ivLoading&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 12px"}}><div className="spin"/><span style={{fontSize:13,color:T.muted}}>Claude is thinking...</span></div>}
              {/* Live transcript while speaking */}
              {ivListening&&ivTranscript&&<div style={{display:"flex",justifyContent:"flex-end"}}>
                <div style={{maxWidth:"78%",padding:"10px 14px",borderRadius:12,background:"rgba(99,102,241,.3)",border:"1px dashed rgba(99,102,241,.5)"}}>
                  <div style={{fontSize:10,fontWeight:700,marginBottom:3,opacity:.6}}>👤 YOU (listening...)</div>
                  <div style={{fontSize:13,lineHeight:1.5,fontStyle:"italic"}}>{ivTranscript}</div>
                </div>
              </div>}
            </div>

            {/* Controls */}
            {!ivEnded&&<div style={{display:"flex",gap:8,alignItems:"stretch"}}>
              {/* MIC BUTTON — big, central */}
              <button
                onClick={ivListening?stopListening:startListening}
                disabled={ivLoading||ivSpeaking}
                style={{
                  position:"relative",width:56,height:56,borderRadius:"50%",border:"none",cursor:ivLoading||ivSpeaking?"not-allowed":"pointer",
                  background:ivListening?"#ef4444":"#6366f1",color:"#fff",fontSize:22,
                  flexShrink:0,transition:"all .2s",opacity:ivLoading||ivSpeaking?.5:1
                }}
                className={ivListening?"mic-pulse":""}
                title={ivListening?"Stop speaking":"Click and speak your answer"}
              >{ivListening?"🔴":"🎤"}</button>

              {/* Text fallback */}
              <textarea
                value={ivTranscript}
                onChange={e=>setIvTranscript(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.ctrlKey){e.preventDefault();if(ivTranscript.trim()){sendAnswer(ivTranscript)}}}}
                placeholder={ivListening?"Listening... (or type here)":"Type your answer or press 🎤 to speak  (Enter to send)"}
                disabled={ivLoading}
                style={{...IS,flex:1,minHeight:56,resize:"none",fontFamily:"inherit"}}
              />
              <button
                onClick={()=>{if(ivTranscript.trim())sendAnswer(ivTranscript)}}
                disabled={!ivTranscript.trim()||ivLoading}
                style={{padding:"0 22px",background:"#10b981",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:14,flexShrink:0}}
              >Send →</button>
            </div>}

            {ivEnded&&<div style={{textAlign:"center",padding:20,background:"rgba(16,185,129,.06)",borderRadius:10,border:"1px solid rgba(16,185,129,.15)"}}>
              <p style={{fontSize:16,fontWeight:700,color:"#10b981",marginBottom:8}}>✅ Interview Complete</p>
              <p style={{fontSize:13,color:T.muted,marginBottom:12}}>Review your feedback above. Ready to practice again?</p>
              <button onClick={()=>{stopSpeaking();stopListening();setIvActive(false);setIvEnded(false);setIvMessages([]);setIvTranscript("")}} style={{padding:"10px 28px",background:"#6366f1",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700}}>Practice Again</button>
            </div>}

            <p style={{fontSize:11,color:T.muted,marginTop:10,textAlign:"center"}}>
              💡 Voice works best in Chrome/Edge · Click 🎤 and speak your answer · Claude will respond based on your actual resume
            </p>
          </div>}
        </div>}

        {/* ═══ RESUME SCORE ════════════════════════════════════════ */}
        {tab==="resume_score"&&<div style={{animation:"fu .2s",maxWidth:860,margin:"0 auto"}}>
          <h2 style={{fontSize:20,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:"0 0 4px"}}>📄 Resume Score & Optimizer</h2>
          <p style={{fontSize:13,color:T.muted,marginBottom:20}}>Get a detailed AI score, identify what's killing your ATS pass rate, and get exact before/after rewrites — all specific to your target role.</p>

          {/* Input section */}
          <div style={{padding:20,borderRadius:12,background:T.card,border:`1px solid ${T.border}`,marginBottom:16}}>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,color:T.muted,display:"block",marginBottom:6,fontWeight:600}}>TARGET ROLE</label>
              <input value={resumeTarget} onChange={e=>setResumeTarget(e.target.value)} placeholder="e.g. Senior DevOps Engineer, Cloud Architect, SRE" style={IS}/>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              {/* Upload */}
              <div>
                <label style={{fontSize:12,color:T.muted,display:"block",marginBottom:6,fontWeight:600}}>UPLOAD RESUME (PDF, DOCX, TXT)</label>
                <input ref={resumeFileRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={e=>{const f=e.target.files[0];if(f){setResumeFile(f);setResumeText("")}}} style={{display:"none"}}/>
                <button onClick={()=>resumeFileRef.current?.click()} style={{width:"100%",padding:"12px",borderRadius:8,border:`2px dashed ${resumeFile?"#6366f1":T.border}`,background:resumeFile?"rgba(99,102,241,.06)":T.input,color:resumeFile?"#a5b4fc":T.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>
                  {resumeFile?`📎 ${resumeFile.name}`:"📁 Click to Upload"}
                </button>
              </div>
              {/* OR paste */}
              <div>
                <label style={{fontSize:12,color:T.muted,display:"block",marginBottom:6,fontWeight:600}}>OR PASTE RESUME TEXT</label>
                <textarea value={resumeText} onChange={e=>{setResumeText(e.target.value);if(e.target.value)setResumeFile(null)}} placeholder="Paste your resume content here..." style={{...IS,minHeight:52,resize:"none",fontFamily:"'JetBrains Mono',monospace",fontSize:11}}/>
              </div>
            </div>

            <button onClick={scoreResume} disabled={resumeLoading||(!resumeFile&&!resumeText.trim())} style={{padding:"12px 32px",background:"linear-gradient(135deg,#6366f1,#10b981)",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:15,width:"100%"}}>
              {resumeLoading?"🤖 Analyzing your resume...":"🤖 Score & Optimize My Resume"}
            </button>
          </div>

          {resumeLoading&&<div style={{textAlign:"center",padding:40}}>
            <div className="spin" style={{width:40,height:40,margin:"0 auto 14px"}}/>
            <p style={{color:T.muted,fontSize:14}}>Claude is analyzing your resume against {resumeTarget} market requirements...</p>
            <p style={{color:T.muted,fontSize:12,marginTop:6}}>Checking ATS optimization, keyword density, impact metrics, and formatting...</p>
          </div>}

          {resumeScore&&!resumeLoading&&<div style={{padding:22,borderRadius:12,background:T.card,border:`1px solid ${T.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div>
                <h3 style={{fontSize:15,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:0}}>Resume Analysis — {resumeTarget}</h3>
                <p style={{fontSize:11,color:T.muted,margin:"4px 0 0"}}>Analyzed against 2025 market standards for {resumeTarget} roles</p>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>cp(resumeScore,"res")} style={{padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:11,background:cpd==="res"?"rgba(16,185,129,.1)":T.input,border:`1px solid ${T.border}`,color:cpd==="res"?"#10b981":T.muted}}>{cpd==="res"?"✓ Copied":"📋 Copy"}</button>
                <button onClick={()=>{setResumeScore(null);setResumeFile(null);setResumeText("")}} style={{padding:"6px 12px",borderRadius:6,cursor:"pointer",fontSize:11,background:T.input,border:`1px solid ${T.border}`,color:T.muted}}>🔄 Rescore</button>
              </div>
            </div>
            <pre className="ao" style={{fontSize:13,lineHeight:1.8}}>{resumeScore}</pre>
          </div>}

          {/* Tips */}
          {!resumeScore&&!resumeLoading&&<div style={{padding:16,borderRadius:10,background:"rgba(99,102,241,.04)",border:"1px solid rgba(99,102,241,.1)"}}>
            <h3 style={{fontSize:13,color:"#a5b4fc",margin:"0 0 10px"}}>What Claude will analyze:</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12,color:T.muted}}>
              {["📊 Overall score with 4-dimension breakdown","✅ Specific strengths (quoting your resume)","🔴 Critical gaps that cause ATS rejection","💡 5 improvements with before/after rewrites","🔍 15 missing ATS keywords by importance","📝 Rewritten professional summary for your role","📈 Salary impact of current vs. optimized resume","⚡ #1 thing to fix in the next 30 minutes"].map(t=>(
                <div key={t} style={{padding:"8px 12px",borderRadius:6,background:T.card,border:`1px solid ${T.border}`}}>{t}</div>
              ))}
            </div>
          </div>}
        </div>}

        {/* ═══ ALERT SETUP ════════════════════════════════════════ */}
        {tab==="alerts"&&<div style={{animation:"fu .2s"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:"0 0 4px"}}>🔔 Alert Setup Checklist</h2>
          <p style={{fontSize:12,color:T.muted,marginBottom:12}}>Set up email alerts so new DevOps jobs come straight to your inbox. Progress auto-saves.</p>
          <div style={{padding:10,borderRadius:8,background:"rgba(16,185,129,.04)",border:"1px solid rgba(16,185,129,.08)",marginBottom:14,fontSize:12,color:"#6ee7b7"}}>💡 Priority: LinkedIn → Naukri → Indeed → Dice → Wellfound = 90%+ of relevant postings covered</div>
          {PL.filter(p=>p.as).map((p,i)=>{const s=ps[p.id],done=s.st==="Alert ✓";return(
            <div key={p.id} style={{padding:12,borderRadius:10,background:T.card,border:`1px solid ${T.border}`,borderLeft:`4px solid ${TC[p.t]}`,marginBottom:8,animation:`fu .2s ${i*15}ms both`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:18,opacity:done?1:.3}}>{done?"✅":"⬜"}</span>
                  <div><span style={{fontSize:13,fontWeight:600,color:done?"#6ee7b7":darkMode?"#e0e7ff":T.fg,textDecoration:done?"line-through":"none"}}>{p.n}</span><p style={{fontSize:11,color:T.muted,margin:"2px 0 0"}}>{p.as}</p></div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>upd(p.id,{st:done?"—":"Alert ✓"})} style={{padding:"5px 12px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700,background:done?"rgba(16,185,129,.1)":"rgba(99,102,241,.07)",border:`1px solid ${done?"rgba(16,185,129,.2)":"rgba(99,102,241,.15)"}`,color:done?"#6ee7b7":"#a5b4fc"}}>{done?"✓ Done":"Mark Done"}</button>
                  <a href={p.au||p.u} target="_blank" rel="noopener noreferrer" className="ab" style={{padding:"5px 12px",borderRadius:6,textDecoration:"none",fontSize:11,fontWeight:700,background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.15)",color:"#fbbf24",transition:"all .15s"}}>Open ↗</a>
                </div>
              </div>
            </div>
          );})}
        </div>}

        {/* ═══ NEGOTIATION ════════════════════════════════════════ */}
        {tab==="nego"&&<div style={{animation:"fu .2s",maxWidth:800,margin:"0 auto"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:"0 0 4px"}}>🤝 Negotiation AI Copilot</h2>
          <p style={{fontSize:12,color:T.muted,marginBottom:16}}>Paste offer details → counter-offer strategy, market comparison, and ready-to-send negotiation email</p>
          <textarea value={negoIn} onChange={e=>setNegoIn(e.target.value)} placeholder={"Paste offer here...\n\nExample:\nCompany: TechCorp\nRole: Senior DevOps Engineer\nBase: $155,000\nBonus: 10%\nEquity: 5,000 RSUs / 4 years\nBenefits: Health, dental, 401k 4%\nPTO: 20 days\nRemote: Yes"} style={{...IS,minHeight:140,fontFamily:"'JetBrains Mono',monospace",resize:"vertical",marginBottom:10}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={runNego} disabled={negoLoad||!negoIn.trim()} className="ab" style={{padding:"10px 22px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,background:"linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.15))",border:"1px solid rgba(99,102,241,.25)",color:"#c7d2fe"}}>{negoLoad?"🤖 Analyzing...":"🤖 Analyze & Generate Counter-Offer"}</button>
            {negoOut&&<button onClick={()=>cp(negoOut,"nego")} style={{padding:"10px 16px",borderRadius:8,cursor:"pointer",fontSize:13,background:cpd==="nego"?"rgba(16,185,129,.1)":T.input,border:`1px solid ${T.border}`,color:cpd==="nego"?"#10b981":T.muted}}>{cpd==="nego"?"✓ Copied":"📋 Copy"}</button>}
          </div>
          {negoLoad&&<div style={{display:"flex",alignItems:"center",gap:10,padding:16,marginTop:10}}><div className="spin"/><span style={{fontSize:12,color:T.muted}}>AI negotiation expert analyzing your offer...</span></div>}
          {negoOut&&!negoLoad&&<div style={{padding:14,marginTop:12,borderRadius:10,background:T.card,border:`1px solid ${T.border}`}}><pre className="ao">{negoOut}</pre></div>}
          <div style={{padding:14,marginTop:16,borderRadius:10,background:T.card,border:`1px solid ${T.border}`}}>
            <h3 style={{fontSize:13,color:"#a5b4fc",margin:"0 0 10px"}}>💡 Negotiation Power Moves</h3>
            <div style={{fontSize:12,color:T.muted,lineHeight:1.8}}>
              <div>1. <b style={{color:"#f59e0b"}}>Never accept first offer</b> — 85% of companies expect negotiation</div>
              <div>2. <b style={{color:"#10b981"}}>Lead with metrics</b> — "I reduced CI costs by 80% at Brillio"</div>
              <div>3. <b style={{color:"#a78bfa"}}>Negotiate total comp</b> — Base + bonus + equity + signing bonus + PTO</div>
              <div>4. <b style={{color:"#ef4444"}}>Have a BATNA</b> — Best Alternative To Negotiated Agreement</div>
              <div>5. <b style={{color:"#06b6d4"}}>Use silence</b> — After stating your number, stop talking</div>
            </div>
          </div>
        </div>}

        {/* ═══ ANALYTICS ══════════════════════════════════════════ */}
        {tab==="funnel"&&<div style={{animation:"fu .2s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <h2 style={{fontSize:18,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:0}}>📊 Application Pipeline Analytics</h2>
            <div style={{display:"flex",gap:6}}>
              <button onClick={exportCSV} className="ab" style={{padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600,background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.15)",color:"#6ee7b7"}}>⬇ CSV</button>
              <button onClick={exportJSON} className="ab" style={{padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600,background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.15)",color:"#a5b4fc"}}>⬇ JSON</button>
            </div>
          </div>
          <div style={{padding:20,borderRadius:10,background:T.card,border:`1px solid ${T.border}`,marginBottom:14}}>
            <div style={{display:"flex",alignItems:"flex-end",gap:6,height:110,justifyContent:"center"}}>
              {[{l:"Applied",v:funnel.applied,c:"#f59e0b"},{l:"Screen",v:funnel.screen,c:"#06b6d4"},{l:"Interview",v:funnel.interview,c:"#a78bfa"},{l:"Offer",v:funnel.offer,c:"#10b981"}].map(s=>{const mx=Math.max(funnel.applied,1);return(<div key={s.l} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,maxWidth:120}}><div style={{fontSize:20,fontWeight:700,color:s.c,marginBottom:5}}>{s.v}</div><div style={{width:"100%",borderRadius:5,height:Math.max((s.v/mx)*70,4),background:`${s.c}25`,transition:"height .4s"}}/><div style={{fontSize:11,color:T.muted,marginTop:5}}>{s.l}</div></div>);})}
            </div>
            {fT>0&&<div style={{textAlign:"center",marginTop:12,fontSize:12,color:T.muted}}>A→S {funnel.applied>0?((funnel.screen/funnel.applied)*100).toFixed(0):0}% · S→I {funnel.screen>0?((funnel.interview/funnel.screen)*100).toFixed(0):0}% · I→O {funnel.interview>0?((funnel.offer/funnel.interview)*100).toFixed(0):0}%</div>}
            {fT===0&&<p style={{textAlign:"center",fontSize:12,color:T.muted,marginTop:8}}>Update portal statuses to see your funnel.</p>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:14}}>
            {[{l:"Portals Tracked",v:PL.length,c:darkMode?"#e0e7ff":T.fg},{l:"Alerts Set",v:Object.values(ps).filter(s=>s.st==="Alert ✓").length,c:"#6366f1"},{l:"AI Scored",v:Object.keys(scores).length,c:"#a78bfa"},{l:"Live Sources",v:FEEDS.length,c:"#10b981"},{l:"Jobs Loaded",v:jobs.length,c:"#f59e0b"},{l:"Starred",v:Object.values(ps).filter(s=>s.star).length,c:"#ef4444"}].map(s=>(
              <div key={s.l} style={{padding:12,borderRadius:10,background:T.card,border:`1px solid ${T.border}`,textAlign:"center"}}><div style={{fontSize:11,color:T.muted,marginBottom:3}}>{s.l}</div><div style={{fontSize:20,fontWeight:700,color:s.c}}>{s.v}</div></div>
            ))}
          </div>
          {Object.keys(scores).length>0&&<div><h3 style={{fontSize:14,color:"#a5b4fc",margin:"0 0 8px"}}>🎯 AI Score Leaderboard</h3>
            {Object.entries(scores).sort((a,b)=>b[1]-a[1]).map(([jid,sc])=>{const job=jobs.find(j=>j.id===jid);if(!job)return null;return(<div key={jid} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,background:T.card,border:`1px solid ${T.border}`,marginBottom:6}}><span style={{fontSize:14,fontWeight:700,color:sc>=80?"#10b981":sc>=60?"#f59e0b":"#ef4444",minWidth:36}}>{sc}%</span><span style={{fontSize:12,color:darkMode?"#e0e7ff":T.fg,flex:1}}>{job.t} @ {job.co}</span><a href={job.url} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#6366f1",textDecoration:"none"}}>Apply ↗</a></div>);})}
          </div>}
        </div>}

        {/* ═══ QUICK APPLY ════════════════════════════════════════ */}
        {tab==="apply"&&<div style={{animation:"fu .2s"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:"0 0 4px"}}>⚡ Quick Apply — Click to Copy</h2>
          <p style={{fontSize:12,color:T.muted,marginBottom:14}}>Tap any field to copy instantly.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:8}}>
            {[{f:"Full Name",v:profile.name},{f:"Email",v:profile.email},{f:"Phone",v:profile.phone},{f:"Location",v:profile.loc},{f:"LinkedIn",v:`https://${profile.li}`},{f:"GitHub",v:`https://${profile.gh}`},{f:"Portfolio",v:`https://${profile.web}`},{f:"Job Title",v:profile.title},{f:"Experience",v:profile.exp},{f:"Current Role",v:profile.current},{f:"Certifications",v:profile.certs},{f:"Availability",v:profile.avail},{f:"Summary",v:profile.sum},{f:"Skills",v:profile.skills}].map(x=>(
              <button key={x.f} onClick={()=>cp(x.v,x.f)} style={{textAlign:"left",padding:10,borderRadius:8,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",background:cpd===x.f?"rgba(16,185,129,.06)":T.card,border:`1px solid ${cpd===x.f?"rgba(16,185,129,.2)":T.border}`}}>
                <div style={{fontSize:10,color:cpd===x.f?"#10b981":T.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:.5,fontWeight:600}}>{cpd===x.f?"✓ COPIED":x.f}</div>
                <div style={{fontSize:11,color:T.fg,lineHeight:1.4,wordBreak:"break-word"}}>{x.v}</div>
              </button>
            ))}
          </div>
          <div style={{marginTop:16}}>
            <h3 style={{fontSize:14,color:"#a5b4fc",margin:"0 0 10px"}}>📝 Cover Letter Snippets</h3>
            {[{l:"Opening Hook",t:`Senior DevOps Engineer with 6+ years building cloud-native infrastructure at enterprise scale. At Brillio, I architected AWS EKS platforms supporting 20+ microservices at 99.9% uptime, reduced CI pipeline times from 45min to 8min, and achieved a 94/100 CIS Kubernetes Benchmark score.`},{l:"Impact Metrics",t:`CI costs cut 80% ($1,500→$300/month), 15+ automated daily deployments via ArgoCD GitOps, MTTR reduced from 2 hours to 15 minutes, SOC2/HIPAA compliant healthcare platforms at Accenture.`},{l:"Tech Stack",t:`AWS EKS, Terraform, GitLab CI/CD, Jenkins, ArgoCD, Istio (mTLS, Canary, Circuit Breaker), DevSecOps (Falco, Kyverno, Kube-Bench, Trivy, ESO). AWS SA Professional + Red Hat OpenShift (EX-280) certified.`}].map(s=>(
              <button key={s.l} onClick={()=>cp(s.t,s.l)} style={{display:"block",width:"100%",textAlign:"left",padding:12,borderRadius:8,marginBottom:8,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",background:cpd===s.l?"rgba(16,185,129,.04)":T.card,border:`1px solid ${cpd===s.l?"rgba(16,185,129,.15)":T.border}`}}>
                <div style={{fontSize:10,color:cpd===s.l?"#10b981":"#6366f1",marginBottom:4,textTransform:"uppercase",letterSpacing:.5,fontWeight:600}}>{cpd===s.l?"✓ COPIED":s.l}</div>
                <div style={{fontSize:12,color:T.muted,lineHeight:1.5}}>{s.t}</div>
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
              :<button onClick={()=>{setPDraft(profile);setEditP(true)}} className="ab" style={{padding:"6px 16px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700,background:"rgba(99,102,241,.1)",border:"1px solid rgba(99,102,241,.2)",color:"#a5b4fc"}}>✎ Edit Profile</button>}
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
          {[{k:"sum",l:"Professional Summary",r:4},{k:"highlights",l:"Key Metrics & Achievements",r:2},{k:"skills",l:"Skills (comma separated)",r:2}].map(({k,l,r})=>(
            <div key={k} style={{padding:12,borderRadius:8,background:T.card,border:`1px solid ${T.border}`,marginTop:10}}>
              <div style={{fontSize:10,color:T.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
              {editP?<textarea value={pDraft[k]||""} onChange={e=>setPDraft(d=>({...d,[k]:e.target.value}))} rows={r} style={{...IS,resize:"vertical",fontFamily:"'JetBrains Mono',monospace",fontSize:12}}/>:<div style={{fontSize:12,color:T.fg,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{profile[k]}</div>}
            </div>
          ))}
        </div>}

        {/* ═══ SETTINGS ═══════════════════════════════════════════ */}
        {tab==="settings"&&<div style={{animation:"fu .2s",maxWidth:700,margin:"0 auto"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:"0 0 20px"}}>⚙️ Settings</h2>
          <div style={{padding:20,borderRadius:12,background:T.card,border:`2px solid #10b981`,marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <h3 style={{fontSize:15,margin:0,color:"#6ee7b7"}}>🔑 Gemini API Key</h3>
              <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:"rgba(16,185,129,.15)",color:"#10b981",fontWeight:700}}>100% FREE</span>
            </div>
            <p style={{fontSize:12,color:T.muted,marginBottom:10}}>Powered by Google Gemini 1.5 Flash — completely free, no credit card required.</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
              {[{i:"✅",l:"No credit card"},{i:"⚡",l:"1,500 req/day free"},{i:"🔒",l:"Stored in browser only"}].map(x=>(
                <div key={x.l} style={{padding:"8px 10px",borderRadius:6,background:"rgba(16,185,129,.06)",border:"1px solid rgba(16,185,129,.12)",fontSize:11,color:"#6ee7b7",textAlign:"center"}}>{x.i} {x.l}</div>
              ))}
            </div>
            <div style={{padding:12,borderRadius:8,background:"rgba(16,185,129,.04)",border:"1px solid rgba(16,185,129,.1)",marginBottom:12}}>
              <p style={{fontSize:12,fontWeight:700,color:"#6ee7b7",margin:"0 0 8px"}}>How to get your free key (2 minutes):</p>
              <div style={{fontSize:12,color:T.muted,lineHeight:2.2}}>
                <div>1️⃣ Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{color:"#6366f1",fontWeight:600}}>aistudio.google.com/app/apikey</a></div>
                <div>2️⃣ Sign in with your <b style={{color:darkMode?"#e0e7ff":T.fg}}>Google account</b></div>
                <div>3️⃣ Click <b style={{color:darkMode?"#e0e7ff":T.fg}}>"Create API key"</b></div>
                <div>4️⃣ Copy the key — starts with <code style={{fontSize:11,color:"#a5b4fc",background:"rgba(99,102,241,.08)",padding:"1px 5px",borderRadius:3}}>AIzaSy...</code></div>
                <div>5️⃣ Paste below and click <b style={{color:"#6ee7b7"}}>Save</b> ✓</div>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <input type="password" value={apiKey} onChange={e=>{setApiKey(e.target.value);localStorage.setItem("fmj_api_key",e.target.value)}} placeholder="AIzaSy..." style={{...IS,flex:1,fontFamily:"'JetBrains Mono',monospace"}}/>
              <button onClick={()=>{setApiSaved(true);setTimeout(()=>setApiSaved(false),2500)}} style={{padding:"9px 20px",background:apiSaved?"#10b981":"#6366f1",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,transition:"all .3s"}}>{apiSaved?"✓ Saved!":"Save"}</button>
            </div>
            <div style={{marginTop:10,padding:"8px 12px",borderRadius:6,fontSize:12,background:apiKey?"rgba(16,185,129,.06)":"rgba(239,68,68,.06)",color:apiKey?"#10b981":"#ef4444"}}>
              {apiKey?"✅ Gemini key set — all AI features are active and FREE!":"⚠️ No key yet — follow the 5 steps above to get your free Gemini key"}
            </div>
          </div>
        </div>}

        {/* ═══ ROADMAP ════════════════════════════════════════════ */}
        {tab==="roadmap"&&<div style={{animation:"fu .2s"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:darkMode?"#e0e7ff":T.fg,margin:"0 0 4px"}}>🗺️ Advanced Systems Roadmap</h2>
          <p style={{fontSize:12,color:T.muted,marginBottom:14}}>9 systems to build beyond this dashboard. Click any card for full architecture details.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:10}}>
            {ROADMAP.map((r,i)=>{const open=roadmapOpen===r.id;return(
              <div key={r.id} style={{padding:14,borderRadius:10,background:T.card,border:`1px solid ${T.border}`,animation:`fu .2s ${i*25}ms both`,cursor:"pointer",transition:"all .2s"}} onClick={()=>setRoadmapOpen(open?null:r.id)} className="hv">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:20}}>{r.icon}</span><h3 style={{fontSize:13,fontWeight:600,color:darkMode?"#e0e7ff":T.fg,margin:0}}>{r.title}</h3></div>
                    <p style={{fontSize:11,color:T.muted,margin:"0 0 8px",lineHeight:1.4}}>{r.desc}</p>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <span style={{fontSize:10,padding:"1px 7px",borderRadius:4,background:r.difficulty==="Very Hard"?"rgba(239,68,68,.08)":r.difficulty==="Hard"?"rgba(245,158,11,.08)":"rgba(16,185,129,.08)",color:r.difficulty==="Very Hard"?"#f87171":r.difficulty==="Hard"?"#fbbf24":"#6ee7b7",border:`1px solid ${r.difficulty==="Very Hard"?"rgba(239,68,68,.15)":r.difficulty==="Hard"?"rgba(245,158,11,.15)":"rgba(16,185,129,.15)"}`}}>{r.difficulty}</span>
                      <span style={{fontSize:10,padding:"1px 7px",borderRadius:4,background:"rgba(99,102,241,.08)",color:"#a5b4fc",border:"1px solid rgba(99,102,241,.15)"}}>{r.status}</span>
                    </div>
                  </div>
                  <span style={{fontSize:12,color:T.muted,transition:"transform .2s",transform:open?"rotate(180deg)":"rotate(0)"}}>▼</span>
                </div>
                {open&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${T.border}`}}>
                  <p style={{fontSize:11,color:darkMode?"#9ca3af":T.muted,lineHeight:1.6,marginBottom:8}}>{r.details}</p>
                  <div style={{fontSize:10,color:T.muted,padding:8,borderRadius:6,background:"rgba(0,0,0,.15)",border:`1px solid ${T.border}`,fontFamily:"'JetBrains Mono',monospace"}}><span style={{color:T.muted}}>Stack: </span><span style={{color:"#a5b4fc"}}>{r.stack}</span></div>
                </div>}
              </div>
            );})}
          </div>
        </div>}

      </div>

      <footer style={{textAlign:"center",padding:"14px 0 6px",borderTop:`1px solid ${T.border}`,color:T.muted,fontSize:11,marginTop:20}}>
        {profile.name} · FindMyJobs.store · Job Hunt Command Center v10 · {new Date().getFullYear()}
      </footer>
    </div>
  );
}