import urllib.request
import urllib.parse
import json
import hashlib
import os
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import xml.etree.ElementTree as ET
import google.generativeai as genai
from datetime import datetime
from auto_apply import apply_to_lever

# Configuration
EMAIL_FROM = os.getenv("EMAIL_FROM", "")
EMAIL_PASS = os.getenv("EMAIL_PASS", "")
EMAIL_TO = os.getenv("EMAIL_TO", "")
WA_PHONE = os.getenv("WA_PHONE", "")
WA_API_KEY = os.getenv("WA_API_KEY", "")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def fetch_url(url, timeout=10):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.read().decode("utf-8", errors="ignore")
    except Exception as e:
        return None

def calculate_semantic_score(title, company, description):
    model = genai.GenerativeModel('gemini-pro')
    prompt = f"""
    Evaluate this DevOps/MLOps job for a Senior Engineer with AWS, EKS, Terraform, ArgoCD, and Python skills.
    Job: {title} at {company}
    Description: {description[:2000]}
    Return ONLY valid JSON with no markdown:
    {{"score": 85, "skills": ["aws", "kubernetes"], "urgent": true}}
    """
    try:
        response = model.generate_content(prompt)
        result = json.loads(response.text.replace("```json", "").replace("```", "").strip())
        return result.get("score", 0), result.get("skills", []), result.get("urgent", False)
    except:
        return 45, ["devops"], False

def scrape_rss_feeds():
    jobs = []
    feeds = [
        ("Naukri", "https://www.naukri.com/rss/jobs?searchType=adv&keyword=devops,cloud,aws"),
        ("LinkedIn", "https://www.linkedin.com/jobs/search/?keywords=DevOps&location=India&format=rss")
    ]
    for source, url in feeds:
        data = fetch_url(url)
        if data:
            try:
                root = ET.fromstring(data)
                for item in root.findall(".//item")[:15]:
                    jobs.append({
                        "title": item.find("title").text or "",
                        "company": source,
                        "url": item.find("link").text or "",
                        "description": item.find("description").text or ""
                    })
            except: pass
    return jobs

def scrape_ats():
    jobs = []
    for company in ["postman", "razorpay", "cred", "swiggy", "phonepe"]:
        data = fetch_url(f"https://api.lever.co/v0/postings/{company}?mode=json")
        if data:
            try:
                for job in json.loads(data):
                    jobs.append({
                        "title": job.get("text", ""),
                        "company": company.capitalize(),
                        "url": job.get("hostedUrl", ""),
                        "description": job.get("descriptionPlain", "")
                    })
            except: pass
    return jobs

def send_whatsapp_alert(title, company, score, url):
    msg = f"🚨 URGENT: {title} at {company} (Fit: {score}/100)\nApply: {url}"
    try:
        urllib.request.urlopen(f"https://api.callmebot.com/whatsapp.php?phone={WA_PHONE}&text={urllib.parse.quote(msg)}&apikey={WA_API_KEY}", timeout=10)
    except: pass

def main():
    try:
        with open("seen_jobs.json", "r") as f: seen_jobs = json.load(f)
    except: seen_jobs = {}

    all_jobs = scrape_rss_feeds() + scrape_ats()
    
    for job in all_jobs:
        if not job.get("title") or not job.get("company"): continue
        fingerprint = hashlib.md5(f"{job['url']}|{job['title']}|{job['company']}".encode()).hexdigest()
        
        if fingerprint in seen_jobs: continue

        score, skills, is_urgent = calculate_semantic_score(job["title"], job["company"], job["description"])
        
        if score >= 45:
            if is_urgent or score >= 80:
                send_whatsapp_alert(job["title"], job["company"], score, job["url"])
                # Phase 4 trigger
                if "lever.co" in job["url"]:
                    apply_to_lever(job["url"])
        
        seen_jobs[fingerprint] = {"url": job["url"], "timestamp": datetime.now().isoformat()}

    # FIFO Cap
    if len(seen_jobs) > 2000:
        for k in list(seen_jobs.keys())[:500]: del seen_jobs[k]

    with open("seen_jobs.json", "w") as f: json.dump(seen_jobs, f)

if __name__ == "__main__": main()