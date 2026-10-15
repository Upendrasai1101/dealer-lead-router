# AI Log

## Tools used

- **Claude** (Anthropic) - used throughout, for explaining the assignment
  requirements in plain language before any code was written, for writing
  the initial draft of every file in this project, and for reviewing my
  own changes once I started editing the code myself in VS Code.

## Three most useful prompts

1. **"Explain this README to me part by part, in plain language, before
   you write any code."**
   This was the most useful prompt of the whole project. Instead of
   getting a finished app I didn't understand, I had every part (the web
   app, the data cleaning script, the AI log, the video/note) explained
   separately first - what it does and why it's being asked for - which
   is the only reason I can walk through this code confidently in an
   interview instead of just having shipped something I can't defend.

2. **"Walk me through exactly how a lead gets assigned to a dealer, and
   show me where that logic lives."**
   This surfaced that the pincode-to-dealer matching rule has to exist in
   two places - once for the live website (JavaScript running in the
   browser) and once for the one-time import script (Node.js) - because
   this is a small static project with no shared build step between the
   two. Understanding *why* the same rule is duplicated, instead of just
   seeing two files, was what let me actually explain the architecture
   rather than just point at files.

3. **"Go through legacy_leads.csv row by row and tell me every actual
   data problem you find, with the row numbers, before writing the
   cleaning script."**
   This produced a concrete list (bad phone, bad pincode, missing name,
   an impossible date, five duplicate customers, one reused lead_id) that
   became the actual test cases for the cleaning script, instead of the
   script being written against a vague idea of "messy data."

## A time the AI was wrong, and how it was corrected

While setting up `firebase.json` for Hosting, the first draft included an
SPA-style rewrite rule (`"source": "**", "destination": "/index.html"`)
that is common for single-page apps built with frameworks like React.
This project is NOT a single-page app - it's two separate static pages,
`index.html` (the lead form) and `dashboard.html` (the dashboard) - so
that rewrite rule would have silently served the lead form for every URL,
including `/dashboard.html`, breaking the dashboard entirely on a real
deployment even though it worked fine when opening the file directly
during local testing.

This was caught by actually reading what the rewrite rule does rather
than trusting that it's a normal default, and it was removed so each
HTML file is served at its own URL. It's a good example of why I asked
for an explanation of every file instead of only asking "does it work" -
a mistake like this wouldn't show up until the real dashboard link was
opened after deployment.
