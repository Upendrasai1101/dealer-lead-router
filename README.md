Kandi

# PuREPower Dealer Lead Router

A practical assignment submission for the MIS Assistant role at PURE Energy.
Builds a small lead-capture web app that routes customer leads to the right
dealer by pincode, plus a one-time script that cleans up the old
`legacy_leads.csv` export and imports it into the same database.

## What's in this project

```
public/                  Part A - the web app (deploy this to Firebase Hosting)
  index.html             "New Lead" form
  dashboard.html         Dashboard: counts by dealer/status, editable lead status
  firebase-init.js        <- fill in your Firebase project config here
  app.js                 form validation + save-to-Firestore logic
  dashboard.js           live lead list + status updates
  dealer-assign.js       the pincode -> dealer matching rule (shared logic)
  validate.js            phone/pincode/name validation helpers
  style.css

scripts/
  clean-and-import.js    Part B - cleans data/legacy_leads.csv and imports it

data/
  dealers.csv            source data (unchanged)
  legacy_leads.csv        source data (unchanged)

reports/
  reconciliation.csv     output of the cleaning script (lead_id, action, reason)

firestore.rules          Firestore Security Rules
firebase.json            Firebase Hosting config
AI_LOG.md                Part C - how AI tools were used while building this
NOTE.md                  Part D - what I'd build next for PURE Energy's dealers
submission.json
```

## How to run this locally

1. **Install Node.js** (v18+) if you don't have it, then from the project
   folder:
   ```
   npm install
   ```

2. **Create a Firebase project** (free, no credit card):
   - Go to https://console.firebase.google.com -> Add project.
   - Inside the project: Build -> Firestore Database -> Create database
     (any region close to India is fine; start in production mode, the
     rules in `firestore.rules` handle access).
   - Still in the console: click the `</>` (web) icon to register a web
     app. It will show you a `firebaseConfig` object.
   - Open `public/firebase-init.js` and paste your real values in place
     of the `REPLACE_WITH_...` placeholders.

3. **Get a service account key** (only needed to run the import script,
   not to run the website):
   - Firebase console -> Project Settings (gear icon) -> Service Accounts
     -> Generate new private key.
   - Save the downloaded file as `service-account-key.json` in the
     project root (same folder as this README). It is already listed in
     `.gitignore` so it will never be committed.

4. **Clean and import the legacy data:**
   ```
   npm run clean-and-import
   ```
   This writes `reports/reconciliation.csv` and (if the service account
   key is present) uploads the `dealers` and cleaned `leads` collections
   to Firestore. Without the key, it still cleans the data and writes the
   report, so the logic can be checked before any Firebase project exists.

5. **Run the website locally.** The site is plain static HTML/JS (no
   build step), so any static file server works, e.g.:
   ```
   npx firebase-tools emulators:start --only hosting
   ```
   or simply open `public/index.html` directly in a browser (Firestore
   calls still work over the network once `firebase-init.js` has real
   config values).

6. **Deploy for real:**
   ```
   npx firebase-tools login
   npx firebase-tools use --add        (pick your Firebase project)
   npx firebase-tools deploy --only hosting,firestore:rules
   ```

## How dealer assignment works

Each dealer in `dealers.csv` covers one or more 3-digit pincode prefixes
(e.g. Vizag Home Power covers `530` and `531`). A new lead's pincode is
matched against those prefixes; if nothing matches, the lead is routed to
"In-house Sales" instead of being left unassigned. The exact same rule is
implemented twice on purpose - once in `public/dealer-assign.js` for the
live web form, once inside `scripts/clean-and-import.js` for the legacy
import - because one runs in the browser and one runs in Node.js, and
this project has no shared build step between them. Both must stay in
sync if the rule ever changes.

## Known data problems found in legacy_leads.csv, and how they were handled

These were found by actually reading all 40 rows, not guessed at:

| Problem | Example | How it's handled |
|---|---|---|
| Inconsistent phone formats | `"98480 22 431"`, `"+91-9000012345"` | Stripped to a plain 10-digit number |
| Invalid/too-short phone | `"12345"` (L1009) | Row **rejected** - can't be fixed without contacting the customer |
| Invalid pincode (4 digits) | `"5000"` (L1012) | Row **rejected** - guessing the missing 2 digits risks routing a real customer to the wrong dealer |
| Duplicate customers (same phone, different lead_id) | Suresh Reddy, Prakash N, Sridevi P, Satish P all appear twice | Treated as **one lead per phone number**, matching the duplicate-mobile rule the live form also enforces. The later duplicate is **merged** into the first one; it is not imported as a second record |
| Reused lead_id (`L1033` used for two different rows) | `L1033` = Mohan Rao, then later `L1033` = Kiran Kumar | The second `L1033` row is actually an exact duplicate of `L1013` (same name, phone, pincode, product, date) - it gets caught and **merged** into `L1013` by the phone-number rule above, so the ID collision resolves itself. As a safety net, the script also detects a true lead_id collision in general (same ID, genuinely different person) and would reassign a new ID like `L1033-DUP` with a `fixed` action and a logged reason, in case a future export has one that isn't also a phone duplicate |
| Missing name | L1026 (name blank) | Row **rejected** - a lead with no name and only a phone number isn't usable as-is |
| Invalid date | `31/09/2026` (L1018) - September has only 30 days | **Fixed**: clamped to the last real day of that month (`2026-09-30`), and the correction is recorded in the reconciliation report so it's never silently changed without a trace |
| Inconsistent text casing | `"website"` vs `"Website"`, `"converted "` vs `"Converted"` | Normalized to Title Case, trimmed |
| Pincode outside any dealer's coverage | `110001` (Delhi) for L1015 | **assigned_inhouse** - routed to "In-house Sales" rather than left unassigned |

### Known issue we did NOT auto-fix

`L1023` has product `"Pure power 5 kwh"` instead of the standard
`"PuREPower Home 5kWh"`. This looks like a typo for the Home 5kWh product,
but guessing and silently rewriting it risks putting a real customer on
the wrong product record. This row is still imported (phone, pincode,
name etc. are all valid) but the product field is left exactly as
written, so a human can review and correct it - the goal of this cleaning
script is to fix formatting problems, not to guess intent.

## Assumptions made

- "Duplicate lead" = same phone number. A customer can only have one lead
  record; if they get in touch again under a different lead_id or a
  typo'd name, it's merged rather than treated as a new customer.
- A pincode is only checked for being 6 digits, not checked against a
  real postal-code database (no such database was provided).
- There is no login system in this assignment's scope, so the dashboard
  is reachable by anyone with the link, same as the lead form. In a real
  deployment this would sit behind Firebase Authentication restricted to
  PURE Energy staff - noted here rather than built, to stay inside the
  assignment's scope and timeline.
- No AI features were added to the product itself (the assignment asks
  only to document AI tool usage in `AI_LOG.md`, Part C - not to build AI
  into the app).
