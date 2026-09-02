import { useState, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════
   JDMatcher.jsx — AI Resume Tailor
   Paste any JD → Gemini rewrites your resume to match it exactly
   ✅ ATS Score 0-100 with breakdown
   ✅ Missing keywords identified
   ✅ Rewrites every bullet to match the JD
   ✅ Tailored summary + headline
   ✅ One-click PDF download
   ═══════════════════════════════════════════════════════════════════ */

const GEMINI_MODEL = "gemini-2.5-pro"; // current live model
const API_BASE     = "https://generativelanguage.googleapis.com/v1beta/models";

async function callGemini(prompt, apiKey, maxTokens = 4000) {
  const models = [GEMINI_MODEL, "gemini-3-pro", "gemini-3.5-flash"];
  for (const model of models) {
    try {
      const res = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error?.message || `HTTP ${res.status}`;
        if (/not found|deprecated|shut down/i.test(msg)) continue; // try next model
        throw new Error(msg);
      }
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (e) {
      if (models.indexOf(model) === models.length - 1) throw e;
    }
  }
}

export default function JDMatcher({ profile, darkMode }) {
  const [jd,         setJd]         = useState("");
  const [result,     setResult]      = useState(null);
  const [loading,    setLoading]     = useState(false);
  const [error,      setError]       = useState("");
  const [step,       setStep]        = useState("idle"); // idle|analyzing|scoring|rewriting|done
  const [copyStates, setCopyStates]  = useState({});
  const fileRef = useRef(null);

  const T = {
    bg:     darkMode ? "#03040a"              : "#f0f4f8",
    card:   darkMode ? "rgba(255,255,255,.03)": "rgba(255,255,255,.85)",
    border: darkMode ? "rgba(255,255,255,.06)": "#e2e8f0",
    fg:     darkMode ? "#e2e8f0"             : "#1a202c",
    muted:  darkMode ? "#6b7280"             : "#64748b",
    input:  darkMode ? "rgba(255,255,255,.05)": "#f7fafc",
  };

  const IS = {
    padding:"9px 12px", borderRadius:8, background:T.input, border:`1px solid ${T.border}`,
    color:T.fg, fontSize:13, fontFamily:"inherit", width:"100%",
  };

  const profStr = () => `
Name:         ${profile.name}
Title:        ${profile.title}
Experience:   ${profile.exp}
Current:      ${profile.current}
Skills:       ${profile.skills}
Certs:        ${profile.certs}
Highlights:   ${profile.highlights}
Summary:      ${profile.sum}
Availability: ${profile.avail}
`.trim();

  const analyze = async () => {
    const apiKey = localStorage.getItem("fmj_api_key") || "";
    if (!apiKey) { setError("⚠️ Add your Gemini API key in ⚙️ Settings first."); return; }
    if (!jd.trim() || jd.trim().length < 100) { setError("⚠️ Paste a complete job description (at least 100 characters)."); return; }

    setError(""); setLoading(true); setResult(null);

    try {
      // ── Step 1: Score + keyword analysis ─────────────────────
      setStep("scoring");
      const scorePrompt = `You are an elite ATS and resume expert. Analyze this candidate's profile against the job description.

CANDIDATE PROFILE:
${profStr()}

JOB DESCRIPTION:
${jd}

Return ONLY a JSON object (no markdown, no fences) with this exact structure:
{
  "ats_score": <number 0-100>,
  "score_breakdown": {
    "skills_match": <number 0-25>,
    "experience_match": <number 0-25>,
    "keywords_match": <number 0-25>,
    "format_clarity": <number 0-25>
  },
  "job_title": "<extracted job title>",
  "company": "<extracted company name or 'Not specified'>",
  "required_skills": ["skill1","skill2",...],
  "matching_skills": ["skill1","skill2",...],
  "missing_skills": ["skill1","skill2",...],
  "nice_to_have": ["skill1","skill2",...],
  "critical_keywords": ["kw1","kw2",...],
  "missing_keywords": ["kw1","kw2",...],
  "estimated_salary": "<range or 'Not specified'>",
  "seniority": "<Junior/Mid/Senior/Staff/Lead>",
  "remote": <true/false>,
  "verdict": "<2 sentence honest assessment>",
  "apply_recommendation": "<Apply Now/Strong Apply/Apply with Customization/Skip>"
}`;

      const scoreRaw = await callGemini(scorePrompt, apiKey, 1500);
      let scoreData;
      try {
        const clean = scoreRaw.replace(/```json|```/g,"").trim();
        const s = clean.indexOf("{"), e = clean.lastIndexOf("}");
        scoreData = JSON.parse(clean.slice(s, e+1));
      } catch {
        throw new Error("Could not parse score data. Try again.");
      }

      // ── Step 2: Rewrite resume bullets ────────────────────────
      setStep("rewriting");
      const rewritePrompt = `You are an elite resume writer and ATS expert. Rewrite this candidate's resume to perfectly match the job description.

CANDIDATE PROFILE:
${profStr()}

JOB DESCRIPTION:
${jd}

JOB TITLE: ${scoreData.job_title}
MISSING KEYWORDS TO ADD: ${(scoreData.missing_keywords||[]).join(", ")}
CRITICAL KEYWORDS TO EMPHASIZE: ${(scoreData.critical_keywords||[]).join(", ")}

Provide a complete tailored resume rewrite. Return ONLY a JSON object (no markdown, no fences):
{
  "tailored_headline": "<powerful one-line headline for this specific role>",
  "tailored_summary": "<3-sentence professional summary perfectly matching this JD — include their top metrics and exact keywords from the JD>",
  "rewritten_bullets": [
    {
      "section": "<CI/CD | Kubernetes | DevSecOps | etc>",
      "original": "<original bullet point>",
      "rewritten": "<rewritten bullet — same facts, but language matched to JD keywords>",
      "keywords_added": ["kw1","kw2"]
    }
  ],
  "skills_to_highlight": ["skill1","skill2",...],
  "skills_to_add": ["skill1","skill2",...],
  "cover_letter_opener": "<one powerful opening paragraph for cover letter>",
  "interview_angle": "<the one thing to emphasize most in interviews for this specific role>"
}

RULES:
- Never invent experience that isn't in the profile
- Keep all metrics (percentages, numbers) exactly as they are
- Just rephrase using the JD's language and keywords
- Make every bullet action-oriented with impact`;

      const rewriteRaw = await callGemini(rewritePrompt, apiKey, 3000);
      let rewriteData;
      try {
        const clean = rewriteRaw.replace(/```json|```/g,"").trim();
        const s = clean.indexOf("{"), e = clean.lastIndexOf("}");
        rewriteData = JSON.parse(clean.slice(s, e+1));
      } catch {
        throw new Error("Could not parse rewrite data. Try again.");
      }

      setResult({ score: scoreData, rewrite: rewriteData, jdSnippet: jd.slice(0,200) });
      setStep("done");
    } catch (e) {
      setError(`⚠️ ${e.message}`);
      setStep("idle");
    }

    setLoading(false);
  };

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStates(p => ({ ...p, [key]: true }));
      setTimeout(() => setCopyStates(p => ({ ...p, [key]: false })), 2000);
    } catch {}
  };

  const generatePDF = () => {
    if (!result) return;
    const { score, rewrite } = result;
    const bulletsHTML = (rewrite.rewritten_bullets||[]).map(b => `
      <div style="margin-bottom:10px">
        <div style="font-size:9px;color:#6366f1;text-transform:uppercase;font-weight:700;letter-spacing:1px">${b.section}</div>
        <div style="font-size:12px;color:#1a1a1a;margin-top:2px">${b.rewritten}</div>
        ${b.keywords_added?.length ? `<div style="margin-top:3px">${b.keywords_added.map(k=>`<span style="background:#eff0ff;color:#6366f1;border-radius:3px;padding:1px 5px;font-size:9px;margin:1px;display:inline-block">${k}</span>`).join("")}</div>` : ""}
      </div>`).join("");

    const skillsHTML = (rewrite.skills_to_highlight||profile.skills.split(",").slice(0,12))
      .map(s=>`<span style="background:#eff0ff;color:#6366f1;border-radius:4px;padding:3px 8px;font-size:11px;display:inline-block;margin:2px">${s}</span>`)
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${profile.name} — ${score.job_title}</title>
    <style>
      body{font-family:Georgia,serif;max-width:860px;margin:0 auto;padding:32px;color:#1a1a1a;font-size:13px;line-height:1.5}
      h1{font-size:22px;margin:0;color:#111}
      .sub{font-size:12px;color:#6366f1;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:2px 0 4px}
      .contact{font-size:11px;color:#555;margin:0 0 16px}
      .section{margin:14px 0}
      .section-title{font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#6366f1;border-bottom:1.5px solid #6366f1;padding-bottom:2px;margin-bottom:8px}
      .summary{font-size:12px;color:#333;border-left:3px solid #6366f1;padding-left:10px;margin:6px 0}
      .metrics{font-size:11px;color:#10b981;border-left:3px solid #10b981;padding-left:10px;margin:6px 0}
      .badge{background:#fff9e6;border:1px solid #f59e0b;border-radius:4px;padding:4px 12px;font-size:11px;color:#92400e;display:inline-block;margin-bottom:12px;font-weight:600}
      @media print{body{padding:16px}}
    </style></head><body>
    <div class="badge">✅ ATS Optimized for: ${score.job_title} ${score.company!=="Not specified"?"@ "+score.company:""} · Score: ${score.ats_score}/100</div>
    <h1>${profile.name}</h1>
    <div class="sub">${rewrite.tailored_headline||profile.title}</div>
    <div class="contact">${profile.email} · ${profile.phone} · ${profile.loc} · ${profile.web} · linkedin.com/${profile.li}</div>

    <div class="section"><div class="section-title">Professional Summary</div>
    <div class="summary">${rewrite.tailored_summary}</div></div>

    <div class="section"><div class="section-title">Key Achievements & Metrics</div>
    <div class="metrics">${profile.highlights}</div></div>

    <div class="section"><div class="section-title">Tailored Experience Highlights</div>
    ${bulletsHTML}</div>

    <div class="section"><div class="section-title">Technical Skills</div>
    <div>${skillsHTML}</div></div>

    <div class="section"><div class="section-title">Certifications</div>
    <p style="font-size:12px">${profile.certs}</p></div>

    <div class="section"><div class="section-title">Availability</div>
    <p style="font-size:12px">${profile.avail}</p></div>
    </body></html>`;

    const w = window.open("","_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 600);
  };

  const scoreColor = s => s>=80?"#1D9E75":s>=65?"#EF9F27":"#D85A30";
  const stepLabels = { scoring:"Scoring against JD…", rewriting:"Rewriting resume bullets…", done:"Done!" };

  return (
    <div style={{ animation:"fu .2s", maxWidth:960, margin:"0 auto" }}>
      <h2 style={{ fontSize:20, fontWeight:700, color:darkMode?"#e0e7ff":T.fg, margin:"0 0 4px" }}>
        🎯 JD Resume Tailor
      </h2>
      <p style={{ fontSize:13, color:T.muted, marginBottom:20 }}>
        Paste any job description → AI rewrites your resume to match it exactly, scores ATS compatibility, identifies every missing keyword. Like Jobscan — but built for you.
      </p>

      {/* ── Input area ── */}
      {!result && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:12 }}>
          <div style={{ padding:20, borderRadius:12, background:T.card, border:`1px solid ${T.border}` }}>
            <label style={{ fontSize:12, color:T.muted, display:"block", marginBottom:6, fontWeight:600 }}>
              PASTE JOB DESCRIPTION
            </label>
            <textarea
              value={jd} onChange={e=>setJd(e.target.value)}
              placeholder={"Paste the complete job description here...\n\nExample:\nSenior DevOps Engineer at Razorpay\n\nWe're looking for a Senior DevOps Engineer with 5+ years experience in AWS, Kubernetes, Terraform...\n\n(Paste the full JD — the more detail, the better the match)"}
              style={{ ...IS, minHeight:260, resize:"vertical", fontFamily:"'JetBrains Mono',monospace", fontSize:12, lineHeight:1.6 }}
            />
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:10, flexWrap:"wrap", gap:8 }}>
              <div style={{ fontSize:11, color:T.muted }}>
                {jd.length > 0 ? `${jd.length} characters · ${jd.split(/\s+/).length} words` : "Paste a JD to get started"}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {jd && <button onClick={()=>setJd("")}
                  style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, fontSize:12, cursor:"pointer" }}>
                  Clear
                </button>}
                <button onClick={analyze} disabled={loading||jd.trim().length<100}
                  style={{ padding:"10px 28px", background:loading||jd.trim().length<100?"rgba(99,102,241,.3)":"linear-gradient(135deg,#6366f1,#10b981)",
                    color:"#fff", border:"none", borderRadius:10, cursor:loading||jd.trim().length<100?"not-allowed":"pointer",
                    fontWeight:700, fontSize:14, display:"flex", alignItems:"center", gap:8 }}>
                  {loading ? (
                    <><div style={{ width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"wm-spin .8s linear infinite" }}/>{stepLabels[step]||"Analyzing…"}</>
                  ) : "🎯 Match My Resume"}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ padding:12, borderRadius:8, background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", color:"#f87171", fontSize:12 }}>
              {error}
            </div>
          )}

          {/* How it works */}
          <div style={{ padding:16, borderRadius:10, background:`rgba(99,102,241,.04)`, border:`1px solid rgba(99,102,241,.1)` }}>
            <h3 style={{ fontSize:13, color:"#a5b4fc", margin:"0 0 10px" }}>What this does:</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, fontSize:12, color:T.muted }}>
              {[
                "📊 ATS Score 0-100 with 4-dimension breakdown",
                "✅ Shows which of your skills match the JD",
                "❌ Finds every missing keyword the ATS is checking",
                "✏️ Rewrites your bullets using the JD's exact language",
                "📝 Tailored 3-sentence summary for this specific role",
                "💡 Tells you the #1 angle to push in interviews",
                "📄 One-click PDF of your tailored resume",
                "📧 Opening paragraph for your cover letter",
              ].map(t=>(
                <div key={t} style={{ padding:"7px 10px", borderRadius:6, background:T.card, border:`1px solid ${T.border}` }}>{t}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <div style={{ animation:"fu .2s" }}>
          {/* Action bar */}
          <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
            <button onClick={() => { setResult(null); setStep("idle"); setJd(""); }}
              style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${T.border}`, background:T.input, color:T.muted, fontSize:12, cursor:"pointer", fontWeight:600 }}>
              ← New JD
            </button>
            <button onClick={generatePDF}
              style={{ padding:"8px 16px", borderRadius:8, background:"linear-gradient(135deg,#1D9E75,#0F6E56)", color:"#fff", border:"none", fontSize:12, cursor:"pointer", fontWeight:700 }}>
              📄 Download Tailored PDF
            </button>
            <button onClick={() => copy(result.rewrite.tailored_summary,"summary")}
              style={{ padding:"8px 16px", borderRadius:8, background:"rgba(99,102,241,.1)", border:"1px solid rgba(99,102,241,.2)", color:"#a5b4fc", fontSize:12, cursor:"pointer", fontWeight:600 }}>
              {copyStates["summary"]?"✓ Copied":"📋 Copy Summary"}
            </button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>

            {/* ── ATS Score card ── */}
            <div style={{ padding:20, borderRadius:12, background:T.card, border:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:darkMode?"#e0e7ff":T.fg, margin:0 }}>ATS Score</h3>
                <div style={{ fontSize:11, padding:"3px 10px", borderRadius:20,
                  background:`${scoreColor(result.score.ats_score)}15`,
                  color:scoreColor(result.score.ats_score),
                  border:`1px solid ${scoreColor(result.score.ats_score)}30`,
                  fontWeight:700 }}>
                  {result.score.apply_recommendation}
                </div>
              </div>

              {/* Big score */}
              <div style={{ textAlign:"center", marginBottom:16 }}>
                <div style={{ fontSize:60, fontWeight:800, color:scoreColor(result.score.ats_score), lineHeight:1 }}>
                  {result.score.ats_score}
                </div>
                <div style={{ fontSize:12, color:T.muted }}>/ 100</div>
                <div style={{ fontSize:12, color:T.muted, marginTop:6 }}>
                  {result.score.job_title} {result.score.company!=="Not specified"?`@ ${result.score.company}`:""}
                </div>
              </div>

              {/* Score breakdown bars */}
              {Object.entries(result.score.score_breakdown||{}).map(([k,v])=>(
                <div key={k} style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
                    <span style={{ color:T.muted, textTransform:"capitalize" }}>{k.replace(/_/g," ")}</span>
                    <span style={{ color:darkMode?"#e0e7ff":T.fg, fontWeight:600 }}>{v}/25</span>
                  </div>
                  <div style={{ height:5, borderRadius:3, background:T.border, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(v/25)*100}%`, borderRadius:3,
                      background:v>=20?"#1D9E75":v>=15?"#EF9F27":"#D85A30",
                      transition:"width .5s" }}/>
                  </div>
                </div>
              ))}

              <div style={{ marginTop:12, padding:"10px 12px", borderRadius:8, background:`rgba(99,102,241,.05)`, border:`1px solid rgba(99,102,241,.1)`, fontSize:11, color:T.muted, lineHeight:1.5 }}>
                💡 {result.score.verdict}
              </div>
            </div>

            {/* ── Keywords analysis ── */}
            <div style={{ padding:20, borderRadius:12, background:T.card, border:`1px solid ${T.border}` }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:darkMode?"#e0e7ff":T.fg, margin:"0 0 12px" }}>Keyword Analysis</h3>

              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#1D9E75", marginBottom:6 }}>
                  ✅ You have ({(result.score.matching_skills||[]).length})
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {(result.score.matching_skills||[]).map(s=>(
                    <span key={s} style={{ fontSize:10, padding:"2px 7px", borderRadius:4,
                      background:"rgba(29,158,117,.12)", color:"#1D9E75",
                      border:"0.5px solid rgba(29,158,117,.25)" }}>{s}</span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#D85A30", marginBottom:6 }}>
                  ❌ Missing — add these ({(result.score.missing_keywords||result.score.missing_skills||[]).length})
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {(result.score.missing_keywords||result.score.missing_skills||[]).map(s=>(
                    <span key={s} style={{ fontSize:10, padding:"2px 7px", borderRadius:4,
                      background:"rgba(216,90,48,.12)", color:"#D85A30",
                      border:"0.5px solid rgba(216,90,48,.25)" }}>{s}</span>
                  ))}
                </div>
              </div>

              {(result.score.nice_to_have||[]).length>0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:"#EF9F27", marginBottom:6 }}>
                    💛 Nice to have
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {(result.score.nice_to_have||[]).map(s=>(
                      <span key={s} style={{ fontSize:10, padding:"2px 7px", borderRadius:4,
                        background:"rgba(239,159,39,.12)", color:"#EF9F27",
                        border:"0.5px solid rgba(239,159,39,.25)" }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.score.estimated_salary && result.score.estimated_salary !== "Not specified" && (
                <div style={{ marginTop:12, padding:"8px 10px", borderRadius:6,
                  background:"rgba(29,158,117,.08)", border:"1px solid rgba(29,158,117,.15)",
                  fontSize:12, color:"#1D9E75", fontWeight:600 }}>
                  💰 Estimated salary: {result.score.estimated_salary}
                </div>
              )}
            </div>
          </div>

          {/* ── Tailored headline + summary ── */}
          <div style={{ padding:16, borderRadius:12, background:T.card, border:`1px solid ${T.border}`, marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:darkMode?"#e0e7ff":T.fg, margin:0 }}>
                ✏️ Tailored Headline + Summary
              </h3>
              <button onClick={()=>copy(`${result.rewrite.tailored_headline}\n\n${result.rewrite.tailored_summary}`,"hs")}
                style={{ padding:"4px 12px", borderRadius:6, border:`1px solid ${T.border}`, background:T.input,
                  color:copyStates["hs"]?"#1D9E75":T.muted, fontSize:11, cursor:"pointer" }}>
                {copyStates["hs"]?"✓ Copied":"📋 Copy"}
              </button>
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:"#6366f1", marginBottom:8, fontStyle:"italic" }}>
              "{result.rewrite.tailored_headline}"
            </div>
            <div style={{ fontSize:13, color:T.muted, lineHeight:1.7, borderLeft:"3px solid #6366f1", paddingLeft:12 }}>
              {result.rewrite.tailored_summary}
            </div>
          </div>

          {/* ── Rewritten bullets ── */}
          <div style={{ padding:16, borderRadius:12, background:T.card, border:`1px solid ${T.border}`, marginBottom:12 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:darkMode?"#e0e7ff":T.fg, margin:"0 0 12px" }}>
              🔁 Rewritten Bullets — matched to JD language
            </h3>
            {(result.rewrite.rewritten_bullets||[]).map((b,i) => (
              <div key={i} style={{ marginBottom:14, paddingBottom:14,
                borderBottom:i<(result.rewrite.rewritten_bullets||[]).length-1?`1px solid ${T.border}`:"none" }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#6366f1", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>
                  {b.section}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div style={{ padding:"8px 10px", borderRadius:6, background:`rgba(239,68,68,.06)`, border:`1px solid rgba(239,68,68,.12)` }}>
                    <div style={{ fontSize:10, color:"#f87171", fontWeight:600, marginBottom:4 }}>BEFORE</div>
                    <div style={{ fontSize:12, color:T.muted, lineHeight:1.5 }}>{b.original}</div>
                  </div>
                  <div style={{ padding:"8px 10px", borderRadius:6, background:`rgba(29,158,117,.06)`, border:`1px solid rgba(29,158,117,.15)`, position:"relative" }}>
                    <div style={{ fontSize:10, color:"#1D9E75", fontWeight:600, marginBottom:4 }}>AFTER — ATS OPTIMIZED</div>
                    <div style={{ fontSize:12, color:darkMode?"#e0e7ff":T.fg, lineHeight:1.5 }}>{b.rewritten}</div>
                    {(b.keywords_added||[]).length>0 && (
                      <div style={{ marginTop:6, display:"flex", flexWrap:"wrap", gap:3 }}>
                        {(b.keywords_added||[]).map(k=>(
                          <span key={k} style={{ fontSize:9, padding:"1px 5px", borderRadius:3,
                            background:"rgba(99,102,241,.1)", color:"#a5b4fc",
                            border:"0.5px solid rgba(99,102,241,.2)" }}>+{k}</span>
                        ))}
                      </div>
                    )}
                    <button onClick={()=>copy(b.rewritten,"bullet_"+i)}
                      style={{ position:"absolute", top:6, right:6, padding:"2px 7px", borderRadius:4,
                        border:`1px solid rgba(29,158,117,.2)`, background:"rgba(29,158,117,.08)",
                        color:copyStates["bullet_"+i]?"#1D9E75":"#6b7280", fontSize:10, cursor:"pointer" }}>
                      {copyStates["bullet_"+i]?"✓":"📋"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Interview angle + Cover letter opener ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div style={{ padding:14, borderRadius:10, background:`rgba(139,92,246,.06)`, border:`1px solid rgba(139,92,246,.15)` }}>
              <h3 style={{ fontSize:13, color:"#a78bfa", margin:"0 0 8px", fontWeight:700 }}>🎙️ Interview Angle</h3>
              <p style={{ fontSize:12, color:T.muted, lineHeight:1.6, margin:0 }}>
                {result.rewrite.interview_angle}
              </p>
            </div>
            <div style={{ padding:14, borderRadius:10, background:`rgba(29,158,117,.06)`, border:`1px solid rgba(29,158,117,.15)` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <h3 style={{ fontSize:13, color:"#1D9E75", margin:0, fontWeight:700 }}>✉️ Cover Letter Opener</h3>
                <button onClick={()=>copy(result.rewrite.cover_letter_opener,"cover")}
                  style={{ padding:"2px 8px", borderRadius:4, border:`1px solid rgba(29,158,117,.2)`,
                    background:"transparent", color:copyStates["cover"]?"#1D9E75":T.muted, fontSize:10, cursor:"pointer" }}>
                  {copyStates["cover"]?"✓":"📋"}
                </button>
              </div>
              <p style={{ fontSize:12, color:T.muted, lineHeight:1.6, margin:0 }}>
                {result.rewrite.cover_letter_opener}
              </p>
            </div>
          </div>

          {/* ── PDF CTA ── */}
          <div style={{ padding:16, borderRadius:12, background:"linear-gradient(135deg,rgba(99,102,241,.1),rgba(16,185,129,.1))",
            border:`1px solid rgba(99,102,241,.2)`, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:darkMode?"#e0e7ff":T.fg }}>
                Your tailored resume is ready
              </div>
              <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>
                ATS Score: <span style={{ color:scoreColor(result.score.ats_score), fontWeight:700 }}>{result.score.ats_score}/100</span>
                {" "} · {(result.score.matching_skills||[]).length} skills matched
                {" "} · {(result.rewrite.rewritten_bullets||[]).length} bullets rewritten
              </div>
            </div>
            <button onClick={generatePDF}
              style={{ padding:"12px 28px", background:"linear-gradient(135deg,#6366f1,#10b981)",
                color:"#fff", border:"none", borderRadius:10, cursor:"pointer",
                fontWeight:700, fontSize:14 }}>
              📄 Download PDF Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
