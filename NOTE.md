# What I'd build next

**1. Dealer login.** Today anyone with the link can see the dashboard. I'd add Firebase Authentication so each dealer sees and updates only their own leads.

**2. Instant alerts.** Voice Agent and WhatsApp are major lead sources. A WhatsApp or SMS to the dealer when a lead is assigned should cut the time from New to Contacted.

**3. Safer imports.** The script only finds duplicates inside the CSV. I'd check phone numbers against leads already in Firestore, and add an upload screen so no one has to run a script.

**4. Weekly report.** Leads per dealer and conversion per source, emailed automatically, so we can see whether things are improving.

**5. AI, only where it helps (idea, not built).** I have used the Groq API in other projects. It could suggest fixes for rows the script won't guess, like the odd product in L1023, or draft a first follow-up message. A person approves every suggestion before it is saved.
