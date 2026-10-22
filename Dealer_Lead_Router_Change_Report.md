# Dealer Lead Router: Change Report (Repeat Enquiries)

Prepared by: Upendra Sai Chaturvedula
Date: 22 Oct 2026
Status: Done locally and tested. NOT pushed to GitHub and NOT deployed. Waiting for written approval.

## 1. Requirement
Duplicate phone numbers must not be rejected or blocked. Every valid enquiry is kept in the data and clearly marked as a repeat enquiry.

## 2. What changed

| File | Change |
|---|---|
| scripts/clean-and-import.js | A duplicate phone is now kept as its own lead and flagged as a repeat (before, it was rejected). New fields: is_repeat, repeat_of, enquiry_number. Added --dry-run (writes only reports/reconciliation.csv, nothing to Firestore). Import is create-only, so statuses already changed on the dashboard are never reset. |
| public/app.js (live form) | Removed the duplicate-block. The form checks earlier leads with the same phone, saves the new lead as a repeat, and shows: "This mobile number already has N earlier lead(s), so it is saved as a repeat enquiry." |
| public/dashboard.js and dashboard.html | Shows a "Repeat xN" badge next to the name, a "Repeat customers" stat card, and a "Repeat enquiries only" filter. |
| public/index.html | Hero note updated to explain repeat handling. |
| README.md | Updated results, assumptions and dry-run note. |
| firestore.rules | No change needed (rules allow the extra fields). |

## 3. Import result on the 40 legacy rows
- 37 leads kept (earlier: 32 kept + duplicates rejected)
- 26 imported clean, 5 fixed (phone/pincode format), 1 routed in-house, 5 repeat enquiries
- 3 rejected (invalid phone or missing data, cannot be saved)
- Repeats: L1036 (of L1003), L1037 (of L1010), L1038 (of L1031), L1039 (of L1007), L1033-DUP (of L1013)

## 4. Testing done (local, 22 Oct)
1. Import dry-run: counts match the table above, no Firestore writes.
2. Live form: submitted an existing phone number. Saved as repeat with the correct message (no block).
3. Dashboard: both rows showed "Repeat x2", "Repeat customers" showed 1, filter worked.
4. Cleanup: the test lead and the interview demo lead were deleted from Firestore. Live data is back to the original 32 leads (New 13, Contacted 4, Converted 9, Lost 6).

## 5. Not done yet (needs approval)
- Push to GitHub
- firebase deploy --only hosting
- Run the import live (create-only) so the 5 repeat rows appear in live data (live would be 37 leads)

## 6. Before deploy
- Back up the Firestore leads collection
- No rules deploy needed
