# What I'd build next

Right now a dealer has no way to see their own leads except through the
shared dashboard. The next thing I'd build is dealer-specific login
(Firebase Authentication), so each dealer only sees and updates the leads
routed to them, instead of the full list. That also closes the current
gap where the dashboard has no access control at all.

After that, I'd add WhatsApp or SMS notifications the moment a new lead
is assigned, since "Voice Agent" and "WhatsApp" are already two of the
biggest lead sources in the data - a dealer finding out instantly, rather
than by checking the dashboard, should directly improve how fast a New
lead becomes Contacted.

Finally, I'd add a simple weekly report (leads per dealer, conversion
rate per source) emailed automatically, since the dashboard answers "what
does it look like right now" but not "is this getting better or worse,"
which is the question a sales manager actually needs answered over time.
