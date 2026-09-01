from playwright.sync_api import sync_playwright

def apply_to_lever(job_url, resume_path="scripts/Hari_Krishna_Resume.pdf"):
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(job_url)
            
            page.click("a.template-btn-submit")
            page.fill("input[name='name']", "Hari Krishna S.")
            page.fill("input[name='email']", "s.harikrishna.1205@gmail.com")
            page.fill("input[name='phone']", "+919491370132")
            page.fill("input[name='urls[LinkedIn]']", "https://linkedin.com/in/harikrishna")
            page.fill("input[name='urls[GitHub]']", "https://github.com/haridevops05")
            
            page.set_input_files("input[type='file']", resume_path)
            page.click("button[data-qa='submit-button']")
            
            page.wait_for_timeout(3000)
            browser.close()
    except Exception as e:
        print(f"Auto-apply failed for {job_url}: {e}")