# What I'd build next

**1. Dealer login.** A dealer can only see the dashboard today. I'd add
Firebase Authentication so each dealer sees and updates only the leads
routed to them. That also closes the gap that the dashboard has no access
control at all.

**2. Instant alerts.** "Voice Agent" and "WhatsApp" are two of the biggest
lead sources. A WhatsApp or SMS message to the dealer the moment a lead is
assigned should shorten the time from New to Contacted.

**3. Safer imports.** The cleaning script only finds duplicates inside the
CSV. For future files I'd check each phone number against the leads already
in Firestore, and add an upload screen so the team doesn't need to run a
script.

**4. A weekly report.** Leads per dealer and conversion per source, emailed
automatically. The dashboard shows how things look now, not whether they are
getting better.

**5. AI, only where it helps (idea, not built).** I have used the Groq API in
other projects. Here it could suggest a fix for rows the script refuses to
guess, like the odd product name in L1023, or draft a first follow-up
message for the dealer. A person would approve each suggestion before
anything is saved.
