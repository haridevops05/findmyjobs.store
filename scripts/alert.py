#!/usr/bin/env python3
"""
FindMyJobs v2.0 — GitHub Actions Optimized
Runs every 5 minutes, scores Cloud/DevOps/Platform/SRE roles
"""

import urllib.request
import urllib.parse
import json
import hashlib
import smtplib
import os
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# ==================== CONFIGURATION ====================
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "")
EMAIL_PASS = os.getenv("EMAIL_PASS", "")
EMAIL_TO = os.getenv("EMAIL_TO", "")
WA_PHONE = os.getenv("WA_PHONE", "")
WA_API_KEY = os.getenv("WA_API_KEY", "")

# Score thresholds
ALERT_THRESHOLD = 45
URGENT_THRESHOLD = 85

# ==================== ROLE KEYWORDS ====================
ROLE_KEYWORDS = {
    "cloud_engineer": ["cloud engineer", "cloud infrastructure", "cloud architect", "cloud ops", "cloud platform"],
    "devops": ["devops", "devops engineer", "site reliability", "sre", "platform engineer"],
    "platform_engineer": ["platform engineer", "platform infrastructure", "internal platform", "platform team"],
    "kubernetes": ["kubernetes", "k8s", "container orchestration", "eks", "gke", "aks"],
    "aws": ["aws", "amazon web services", "ec2", "s3", "lambda", "cloudformation", "eks"],
    "azure": ["azure", "microsoft azure", "aks", "azure devops", "azure functions"],
    "gcp": ["gcp", "google cloud", "gke", "cloud run", "bigquery"],
    "infrastructure": ["infrastructure", "infra engineer", "infra ops", "cloud infrastructure", "infrastructure engineer"],
}

# ==================== SKILL KEYWORDS ====================
SKILL_KEYWORDS = {
    "aws": ["aws", "ec2", "s3", "lambda", "rds", "dynamodb", "cloudformation", "eks", "vpc", "iam", "amazon web services"],
    "azure": ["azure", "aks", "azure devops", "azure functions", "azure storage", "entra id", "microsoft azure"],
    "gcp": ["gcp", "google cloud", "gke", "cloud run", "bigquery", "pub/sub", "cloud functions"],
    "kubernetes": ["kubernetes", "k8s", "eks", "gke", "aks", "helm", "kustomize", "kubeadm"],
    "docker": ["docker", "containerd", "podman", "container runtime"],
    "terraform": ["terraform", "hcl", "terraform cloud", "opentofu"],
    "ansible": ["ansible", "ansible playbook", "ansible tower"],
    "argocd": ["argocd", "argo rollouts", "gitops"],
    "jenkins": ["jenkins", "jenkins pipeline"],
    "github_actions": ["github actions", "gha", "workflow"],
    "gitlab_ci": ["gitlab ci", "gitlab runner"],
    "falco": ["falco", "runtime security"],
    "kyverno": ["kyverno", "policy engine"],
    "opa": ["opa", "open policy agent", "gatekeeper"],
    "soc2": ["soc2", "hipaa", "iso 27001", "compliance"],
    "prometheus": ["prometheus", "promql"],
    "grafana": ["grafana", "dashboards"],
    "datadog": ["datadog", "apm"],
    "mlops": ["mlops", "mlflow", "kubeflow", "sagemaker"],
    "kafka": ["kafka", "event streaming"],
}

# ==================== COMPANY WEIGHTS ====================
COMPANY_WEIGHTS = {
    "cloudflare": 10, "datadog": 10, "hashicorp": 10, "razorpay": 8, "phonepe": 8,
    "swiggy": 8, "cred": 8, "zerodha": 8, "postman": 7, "pagerduty": 7,
    "grafana": 7, "elastic": 7, "snyk": 7, "confluent": 6, "vercel": 6,
    "anthropic": 6, "mongodb": 6, "snowflake": 5, "stripe": 5, "databricks": 5,
}

# ==================== SCORING ENGINE ====================
def calculate_fit_score(title, company, description):
    text = f"{title} {description}".lower()
    score = 0
    matched_skills = []

    for role, keywords in ROLE_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            score += 35
            break

    skill_points = 0
    for skill, keywords in SKILL_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            skill_points += 5
            matched_skills.append(skill)

    score += min(skill_points, 50)

    if any(kw in text for kw in ["senior", "sr.", "staff", "lead", "principal", "architect", "manager"]):
        score += 5

    if "aws" in matched_skills and "terraform" in matched_skills:
        score += 5

    if "kubernetes" in matched_skills and any(c in matched_skills for c in ["aws", "azure", "gcp"]):
        score += 5

    if all(c in matched_skills for c in ["aws", "azure", "gcp"]):
        score += 10

    if any(c in matched_skills for c in ["falco", "kyverno", "opa", "soc2"]):
        score += 5

    company_lower = company.lower()
    for name, weight in COMPANY_WEIGHTS.items():
        if name in company_lower:
            score += weight
            break

    return min(score, 97), matched_skills

# ==================== DEDUPLICATION ====================
def get_fingerprint(url, title, company):
    raw = f"{url}|{title}|{company}".encode()
    return hashlib.md5(raw).hexdigest()

def load_seen_jobs():
    try:
        with open("seen_jobs.json", "r") as f:
            return json.load(f)
    except:
        return {}

def save_seen_jobs(seen):
    with open("seen_jobs.json", "w") as f:
        json.dump(seen, f, indent=2)

# ==================== NOTIFICATION ENGINE ====================
def send_telegram_alert(title, company, location, salary, score, url, skills, urgent=False):
    try:
        if urgent:
            badge = "🔴"
            prefix = "🚨 URGENT — "
        else:
            badge = "🟢" if score >= 80 else "🟡"
            prefix = "📢 New Job — "

        hashtags = " ".join([f"#{s}" for s in skills[:4]])
        salary_text = f"💰 {salary}\n" if salary else ""

        message = f"{badge} {prefix}{title}\n"
        message += f"🏢 {company}\n"
        message += f"📍 {location}\n"
        message += f"{salary_text}"
        message += f"🎯 Fit Score: {score}/100\n"
        message += f"🛠️ {hashtags}\n\n"
        message += f"👉 Apply Now: {url}\n"
        message += f"⏱️ Found: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

        api_url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        data = urllib.parse.urlencode({
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "HTML"
        }).encode()

        req = urllib.request.Request(api_url, data=data)
        urllib.request.urlopen(req, timeout=10)
        print(f"✅ Telegram: {title}")
        return True
    except Exception as e:
        print(f"❌ Telegram error: {e}")
        return False

def send_whatsapp_alert(title, company, score, url, urgent=False):
    for attempt in range(3):
        try:
            prefix = "🚨 URGENT: " if urgent else "📢 New Job: "
            message = f"{prefix}{title} at {company} — Fit: {score}/100\n"
            message += f"Apply: {url}\n"
            message += f"Don't wait — apply NOW!"

            msg_encoded = urllib.parse.quote(message)
            api_url = f"https://api.callmebot.com/whatsapp.php?phone={WA_PHONE}&text={msg_encoded}&apikey={WA_API_KEY}"

            req = urllib.request.Request(api_url)
            urllib.request.urlopen(req, timeout=10)
            print(f"✅ WhatsApp: {title} (attempt {attempt+1})")
            return True
        except Exception as e:
            print(f"❌ WhatsApp error (attempt {attempt+1}): {e}")
            time.sleep(2)
    return False

def send_email_alert(title, company, location, salary, score, url, skills, urgent=False):
    try:
        if urgent:
            subject = f"🚨 URGENT — {title} at {company} ({score}/100)"
        else:
            subject = f"📢 New Job — {title} at {company} ({score}/100)"

        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2 style="color: {'#FF0000' if urgent else '#0000FF'};">
                {'🚨 URGENT' if urgent else '📢 New Job'} — {title}
            </h2>
            <p><b>Company:</b> {company}</p>
            <p><b>Location:</b> {location}</p>
            <p><b>Salary:</b> {salary if salary else 'Not specified'}</p>
            <p><b>Fit Score:</b> <span style="color: {'#FF0000' if score >= 85 else '#FFA500' if score >= 65 else '#008000'};">
                {score}/100
            </span></p>
            <p><b>Top Skills:</b> {', '.join(skills[:5])}</p>
            <p><b>Apply Now:</b> <a href="{url}">{url}</a></p>
            <p style="color: gray; font-size: 12px;">
                Job found at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}. Be the FIRST applicant!
            </p>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = EMAIL_FROM
        msg["To"] = EMAIL_TO
        msg.attach(MIMEText(body, "html"))

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_FROM, EMAIL_PASS)
        server.sendmail(EMAIL_FROM, EMAIL_TO, msg.as_string())
        server.quit()

        print(f"✅ Email: {title}")
        return True
    except Exception as e:
        print(f"❌ Email error: {e}")
        return False

# ==================== JOB SCRAPERS ====================
def fetch_url(url, timeout=10):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"⚠️ Fetch error: {e}")
        return None

def scrape_remoteok():
    jobs = []
    url = "https://remoteok.com/api?tags=devops,cloud,sre,platform,infrastructure"
    data = fetch_url(url)
    if data:
        try:
            json_data = json.loads(data)
            for job in json_data[1:]:
                jobs.append({
                    "title": job.get("position", ""),
                    "company": job.get("company", ""),
                    "location": job.get("location", "Remote"),
                    "salary": job.get("salary", ""),
                    "url": job.get("url", ""),
                    "description": job.get("description", ""),
                    "source": "RemoteOK"
                })
        except:
            pass
    return jobs

def scrape_remotive():
    jobs = []
    url = "https://remotive.com/api/remote-jobs?category=devops"
    data = fetch_url(url)
    if data:
        try:
            json_data = json.loads(data)
            for job in json_data.get("jobs", []):
                jobs.append({
                    "title": job.get("title", ""),
                    "company": job.get("company_name", ""),
                    "location": job.get("candidate_required_location", "Remote"),
                    "salary": job.get("salary", ""),
                    "url": job.get("url", ""),
                    "description": job.get("description", ""),
                    "source": "Remotive"
                })
        except:
            pass
    return jobs

def scrape_greenhouse():
    jobs = []
    companies = ["cloudflare", "datadog", "hashicorp", "grafana", "elastic", "snyk", "pagerduty", "confluent", "vercel", "anthropic", "mongodb", "snowflake"]
    for company in companies:
        url = f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs"
        data = fetch_url(url)
        if data:
            try:
                json_data = json.loads(data)
                for job in json_data.get("jobs", []):
                    jobs.append({
                        "title": job.get("title", ""),
                        "company": company.capitalize(),
                        "location": job.get("location", {}).get("name", "Remote"),
                        "salary": "",
                        "url": job.get("absolute_url", ""),
                        "description": job.get("content", ""),
                        "source": f"Greenhouse ({company})"
                    })
            except:
                pass
    return jobs

def scrape_lever():
    jobs = []
    companies = ["postman", "razorpay", "cred", "swiggy", "phonepe", "meesho", "zerodha", "groww"]
    for company in companies:
        url = f"https://api.lever.co/v0/postings/{company}?mode=json"
        data = fetch_url(url)
        if data:
            try:
                json_data = json.loads(data)
                for job in json_data:
                    jobs.append({
                        "title": job.get("text", ""),
                        "company": company.capitalize(),
                        "location": job.get("categories", {}).get("location", "Remote"),
                        "salary": job.get("categories", {}).get("salary_range", ""),
                        "url": job.get("hostedUrl", ""),
                        "description": job.get("descriptionPlain", ""),
                        "source": f"Lever ({company})"
                    })
            except:
                pass
    return jobs

def scrape_arbeitnow():
    jobs = []
    url = "https://www.arbeitnow.com/api/job-board-api"
    data = fetch_url(url)
    if data:
        try:
            json_data = json.loads(data)
            for job in json_data.get("data", []):
                if any(kw in job.get("title", "").lower() for kw in ["devops", "cloud", "sre", "platform", "infrastructure", "kubernetes", "aws", "azure"]):
                    jobs.append({
                        "title": job.get("title", ""),
                        "company": job.get("company_name", ""),
                        "location": job.get("location", "Remote"),
                        "salary": "",
                        "url": job.get("url", ""),
                        "description": job.get("description", ""),
                        "source": "Arbeitnow"
                    })
        except:
            pass
    return jobs

def scrape_weworkremotely():
    jobs = []
    url = "https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss"
    data = fetch_url(url)
    if data:
        import xml.etree.ElementTree as ET
        try:
            root = ET.fromstring(data)
            for item in root.findall(".//item"):
                title = item.find("title").text if item.find("title") is not None else ""
                company = item.find("source").text if item.find("source") is not None else ""
                link = item.find("link").text if item.find("link") is not None else ""
                description = item.find("description").text if item.find("description") is not None else ""
                jobs.append({
                    "title": title,
                    "company": company,
                    "location": "Remote",
                    "salary": "",
                    "url": link,
                    "description": description,
                    "source": "WeWorkRemotely"
                })
        except:
            pass
    return jobs

# ==================== MAIN PIPELINE ====================
def process_job(job, seen_jobs):
    fingerprint = get_fingerprint(job["url"], job["title"], job["company"])
    if fingerprint in seen_jobs:
        return False

    score, skills = calculate_fit_score(job["title"], job["company"], job["description"])

    if score >= ALERT_THRESHOLD:
        urgent = score >= URGENT_THRESHOLD
        print(f"\n{'🚨' if urgent else '📢'} Found: {job['title']} at {job['company']} — Score: {score}/100")

        send_telegram_alert(job["title"], job["company"], job["location"], job["salary"], score, job["url"], skills, urgent)
        if urgent:
            send_whatsapp_alert(job["title"], job["company"], score, job["url"], urgent)
            send_email_alert(job["title"], job["company"], job["location"], job["salary"], score, job["url"], skills, urgent)

    seen_jobs[fingerprint] = {
        "title": job["title"],
        "company": job["company"],
        "url": job["url"],
        "score": score,
        "timestamp": datetime.now().isoformat()
    }
    return True

def main():
    print("=" * 60)
    print("🚀 FindMyJobs v2.0 — GitHub Actions Run")
    print(f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    seen_jobs = load_seen_jobs()
    print(f"📊 Loaded {len(seen_jobs)} seen jobs")

    all_jobs = []
    all_jobs.extend(scrape_remoteok())
    all_jobs.extend(scrape_remotive())
    all_jobs.extend(scrape_greenhouse())
    all_jobs.extend(scrape_lever())
    all_jobs.extend(scrape_arbeitnow())
    all_jobs.extend(scrape_weworkremotely())

    print(f"📥 Found {len(all_jobs)} jobs total")

    new_jobs = 0
    for job in all_jobs:
        if job.get("title") and job.get("company"):
            if process_job(job, seen_jobs):
                new_jobs += 1

    print(f"\n✅ New jobs found: {new_jobs} | Total seen: {len(seen_jobs)}")

    if len(seen_jobs) > 5000:
        keys = list(seen_jobs.keys())[:1000]
        for k in keys:
            del seen_jobs[k]

    save_seen_jobs(seen_jobs)
    print("💾 State saved.")

if __name__ == "__main__":
    main()