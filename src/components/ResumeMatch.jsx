import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function ResumeMatch() {
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeMatch = async () => {
    if (!jdText || !resumeText) return alert("Please provide both a JD and Resume.");
    setLoading(true);
    
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `
        Act as an MLOps and DevOps recruiter. Cross-reference this JD against the Resume.
        Return ONLY a JSON object: {"match_score": 90, "missing_skills": ["Kafka"], "tailored_resume": "Text...", "deepsearch_summary": "Company stack and culture insights"}
        JD: ${jdText}
        Resume: ${resumeText}
      `;

      const response = await model.generateContent(prompt);
      const cleanedText = response.response.text().replace(/```json/g, "").replace(/```/g, "").strip();
      setResult(JSON.parse(cleanedText));
    } catch (e) {
      console.error(e);
      alert("Analysis failed. Check your API key and input formatting.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2>🎯 AI Resume Match & DeepSearch</h2>
      <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
        <textarea 
          rows="12" 
          style={{ width: "50%", padding: "10px" }} 
          placeholder="Paste Target Job Description" 
          onChange={(e) => setJdText(e.target.value)} 
        />
        <textarea 
          rows="12" 
          style={{ width: "50%", padding: "10px" }} 
          placeholder="Paste Baseline Resume" 
          onChange={(e) => setResumeText(e.target.value)} 
        />
      </div>
      
      <button 
        onClick={analyzeMatch} 
        disabled={loading} 
        style={{ padding: "12px 24px", cursor: loading ? "wait" : "pointer", background: "#000", color: "#fff", border: "none", borderRadius: "4px" }}
      >
        {loading ? "Running DeepSearch Analysis..." : "Analyze & Tailor Resume"}
      </button>

      {result && (
        <div style={{ marginTop: "30px", borderTop: "2px solid #eaeaea", paddingTop: "20px" }}>
          <h3 style={{ color: result.match_score >= 80 ? "green" : "orange" }}>Fit Score: {result.match_score}/100</h3>
          <p><strong>Missing Skills to Address:</strong> {result.missing_skills.join(", ")}</p>
          
          <div style={{ background: "#f0f4f8", padding: "15px", borderRadius: "6px", margin: "20px 0" }}>
            <h4>🔍 DeepSearch Insights</h4>
            <p>{result.deepsearch_summary}</p>
          </div>
          
          <h4>📝 Tailored Application Resume</h4>
          <pre style={{ whiteSpace: "pre-wrap", background: "#fafafa", padding: "20px", border: "1px solid #ccc", borderRadius: "6px" }}>
            {result.tailored_resume}
          </pre>
        </div>
      )}
    </div>
  );
}