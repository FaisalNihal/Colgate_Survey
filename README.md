# Colgate Retail Visibility Survey & Admin Portal

A mobile-first Progressive Web App (PWA) for field survey teams (15 interns covering 60,000+ retail outlets) and real-time admin monitoring, backed 100% for free by **Google Sheets**, **Google Drive**, and **OpenStreetMap**.

## Quick Setup

1. **Google Sheets & Drive Backend**:
   - Create a Google Sheet with 4 required tabs (`Users`, `Outlets`, `Products`, `Route_Logs`) and 2 optional master catalog tabs (`Catalog`, `SKU_Ranges`).
   - Open **Extensions → Apps Script**, paste the contents of `Code.gs`, insert your Google Drive Folder ID, and deploy as a **Web App** (`Execute as: Me`, `Who has access: Anyone`).
2. **Connect Frontend**:
   - Open `App.jsx` and paste your deployed `/exec` URL into `GOOGLE_SCRIPT_URL`.
3. **Deploy on Netlify**:
   - Push this repository to GitHub.
   - Connect the repository to Netlify (`Build command: npm run build`, `Publish directory: dist`).
