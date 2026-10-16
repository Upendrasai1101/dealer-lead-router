# Project Summary: PuREPower Dealer Lead Router

Author: Chaturvedula Upendrasai
Live app: https://project-0581f3ee-637c-4fd3-b5c.web.app
Repo: https://github.com/Upendrasai1101/dealer-lead-router

## 1. What this is

A small web app that takes dealer leads, sends each lead to the right dealer by pincode, and shows every lead on a live dashboard. It also includes a one-time script that cleans the legacy lead file (`data/legacy_leads.csv`) and loads it into Firestore.

## 2. Stack

- Front end: plain HTML, CSS and JavaScript (Firebase Web SDK from CDN, ES modules). No build step.
- Database: Firestore (region asia-south1).
- Hosting: Firebase Hosting.
- Import script: Node.js with `firebase-admin` (`scripts/clean-and-import.js`).
- Access control: `firestore.rules`.

## 3. How a lead is routed

1. The lead form checks the input (`public/validate.js`).
2. The first 3 digits of the pincode are matched to a dealer (`public/dealer-assign.js`, data in `data/dealers.csv`).
3. If no dealer covers that prefix, the lead goes to **In-house Sales**, so no lead is dropped.
4. If a lead with the same phone number already exists, the new details are merged into it. No duplicate is created.
5. The lead is saved to Firestore and appears on the dashboard straight away.

The dashboard (`public/dashboard.html`) updates live. Each lead has a status that can be changed: New, Contacted, Converted or Lost.

## 4. Data cleaning result (legacy file, 40 rows)

| Outcome | Rows |
|---|---|
| Imported as they were | 26 |
| Fixed, then imported | 5 |
| Assigned to In-house Sales (no dealer for the pincode) | 1 |
| Merged into an existing lead (same phone) | 5 |
| Rejected as unusable | 3 |

32 leads remain in Firestore. Every decision is recorded row by row in `reports/reconciliation.csv`.

## 5. Known limits (stated honestly)

- Lead L1023 has a product value ("Pure power 5…") that I could not map with confidence. It is flagged for a human to review and I did not guess.
- Dealers cannot log in yet. The dashboard is an internal view.
- Dealer coverage depends on the 3-digit prefix table. A prefix that is not in `dealers.csv` falls back to In-house Sales.

## 6. What I would build next

Listed in `NOTE.md`: dealer login, instant alerts for new leads, safer imports, and a weekly report.

## 7. Where to look

| File | Purpose |
|---|---|
| `README.md` | Routing rules, data problems, results |
| `reports/reconciliation.csv` | Row-by-row outcome of the import |
| `firestore.rules` | Database access rules |
| `AI_LOG.md` | How AI tools were used while building |
| `NOTE.md` | Next steps |
