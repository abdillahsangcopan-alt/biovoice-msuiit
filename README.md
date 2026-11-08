# BioVoice — MSU-IIT Interactive Photosynthesis Simulation & AI Voice Learning Platform

**Thesis Title:** *BIOVOICE: EMBEDDING AN AI-ASSISTED VOICE INTERACTION TOOL IN A BIOLOGY ACTIVITY TO IMPROVE SENIOR HIGH SCHOOL STUDENTS’ CONCEPTUAL UNDERSTANDING*  
**Researchers:** Abdillah G. Sangcopan & Karen M. Villa  
**Thesis Adviser:** Prof. Vanjoreeh Madale  
**Institution:** Mindanao State University – Iligan Institute of Technology (MSU-IIT), College of Education (Bachelor of Secondary Education, Major in Biology)  
**Research Site:** Iligan City National High School, Iligan City, Philippines (Grade 11 Biology 1, SY 2026–2027)

---

## 1. Quick Start (Local Server)

Run the multi-threaded local research server from this directory:

```bash
cd "/Users/abdillahg.sangcopan/Desktop/Research/AI Website html"
python3 server.py
```

Open **http://localhost:4173** in your browser.

---

## 2. Four-Role Login & Access Reference

When opening the website, the **Welcome & 4-Role Login Screen** is displayed first with **MSU-IIT** branding:

1. **Student / Research Participant (`BV-001` to `BV-200`)**
   - **Assigned Intervention Group Codes:** `BV-001` through `BV-054` (Parental Consent & Student Assent verified)
   - **Assigned Comparison Group Codes:** `BV-100` through `BV-154` (Parental Consent & Student Assent verified)
   - **Unassigned Test Codes (Rejected at Login):** `BV-056`–`BV-099`, `BV-155`–`BV-200`
   - **Unverified Consent Test Code (Rejected at Login):** `BV-055`
   - **Researcher-Issued Classroom PIN:** `2026` (or each code's unique 4-digit individual PIN listed in the Researcher Dashboard, e.g., `BV-001` → `4396`, `BV-100` → `4750`). *Note: Using the last 3 digits of a participant code is strictly rejected.*
2. **Administrator / Researcher**
   - **Username:** `researcher_admin`
   - **Password:** `BioVoiceMSUIIT2026!` (configurable via `.env`)
3. **Teacher**
   - **Username:** `biology_teacher`
   - **Password:** `ICNHSBiology2026!` (configurable via `.env`)
4. **Guest**
   - One-click **Explore as Guest** sandbox mode (demonstration simulation with free switching among *Hydrilla*, *Elodea*, and *Water Hyacinth*, Activity Guide preview, and isolated Sandbox BioVoice demo that never writes to official research logs).

---

## 3. Publishing to GitHub Pages or Google Firebase Hosting (Free Hosting)

### Option A: Publish on GitHub Pages (100% Free, No Credit Card Required)

1. Create a free account at [github.com](https://github.com) and click **New repository** (e.g., `biovoice-msuiit`, set to **Public**).
2. Open Terminal and run:
   ```bash
   cd "/Users/abdillahg.sangcopan/Desktop/Research/AI Website html"
   git init
   git branch -M main
   git add index.html styles.css app.js firebase.json .nojekyll .gitignore README.md
   git commit -m "Deploy BioVoice MSU-IIT platform"
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/biovoice-msuiit.git
   git push -u origin main
   ```
3. In your GitHub repository, go to **Settings → Pages → Build and deployment → Source: Deploy from a branch**, select **`main`** and **`/ (root)`**, and click **Save**.
4. Your live public URL will be: `https://<YOUR_GITHUB_USERNAME>.github.io/biovoice-msuiit/`

### Option B: Publish on Google Firebase Hosting (Free Spark Plan)

1. Go to [console.firebase.google.com](https://console.firebase.google.com/) and create a project (e.g., `biovoice-msuiit`).
2. Deploy using the Firebase CLI (`firebase.json` is already configured to block `/private_data/**`, `.env`, `server.py`, and `.xlsx`):
   ```bash
   cd "/Users/abdillahg.sangcopan/Desktop/Research/AI Website html"
   npx firebase-tools@latest login
   npx firebase-tools@latest use --add
   npx firebase-tools@latest deploy --only hosting
   ```
3. Your live public URL will be: `https://<YOUR_PROJECT_ID>.web.app`
