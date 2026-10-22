// app.js
//
// Logic for the "New Lead" form (index.html). Flow, in plain words:
//   1. Read and validate what the person typed.
//   2. Check Firestore for existing leads with the same phone number. If
//      there are any, the new lead is STILL saved, but it is flagged as a
//      repeat enquiry (is_repeat, repeat_of, enquiry_number). Nothing the
//      customer submits is thrown away.
//   3. Load the dealers list from Firestore and work out which dealer
//      this pincode belongs to (dealer-assign.js).
//   4. Write the new lead document to Firestore.
//
// This file intentionally does ONE thing per function so each step can be
// read (and explained out loud, e.g. in an interview) on its own.

import { db, LEADS_COLLECTION, DEALERS_COLLECTION } from "./firebase-init.js";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { normalizePhone, isValidPincode, isValidName } from "./validate.js";
import { assignDealer } from "./dealer-assign.js";

const form = document.getElementById("lead-form");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("form-status");

function setError(fieldId, message) {
  document.getElementById(`err-${fieldId}`).textContent = message || "";
}

function clearErrors() {
  ["name", "phone", "pincode", "product", "source"].forEach((f) => setError(f, ""));
}

/** Reads and validates the form. Returns {ok, data} or {ok:false}. */
function readAndValidateForm() {
  clearErrors();
  let ok = true;

  const name = form.name.value.trim();
  if (!isValidName(name)) {
    setError("name", "Name is required.");
    ok = false;
  }

  const phone = normalizePhone(form.phone.value);
  if (!phone) {
    setError("phone", "Enter a valid 10-digit mobile number.");
    ok = false;
  }

  const pincode = form.pincode.value.trim();
  if (!isValidPincode(pincode)) {
    setError("pincode", "Pincode must be exactly 6 digits.");
    ok = false;
  }

  const product = form.product.value;
  if (!product) {
    setError("product", "Select a product.");
    ok = false;
  }

  const source = form.source.value;
  if (!source) {
    setError("source", "Select a source.");
    ok = false;
  }

  if (!ok) return { ok: false };
  return { ok: true, data: { name, phone, pincode, product, source } };
}

/** Returns the existing leads (Firestore docs) that share this phone number. */
async function findLeadsByPhone(phone) {
  const q = query(collection(db, LEADS_COLLECTION), where("phone", "==", phone));
  const snap = await getDocs(q);
  return snap.docs;
}

/**
 * Works out the repeat-enquiry fields for a new lead from the leads that
 * already share its phone number. Points repeat_of at the first lead that is
 * not itself a repeat. Imported leads carry a lead_id like "L1003", web leads
 * only have a Firestore document id, so we use whichever exists.
 */
function buildRepeatInfo(existingDocs) {
  if (existingDocs.length === 0) {
    return { is_repeat: false, repeat_of: null, enquiry_number: 1 };
  }
  const original = existingDocs.find((d) => !d.data().is_repeat) || existingDocs[0];
  return {
    is_repeat: true,
    repeat_of: original.data().lead_id || original.id,
    enquiry_number: existingDocs.length + 1,
  };
}

/** Loads all dealers from Firestore (small collection, fine to load fully). */
async function loadDealers() {
  const snap = await getDocs(collection(db, DEALERS_COLLECTION));
  return snap.docs.map((d) => d.data());
}

/** Rejects after `ms` milliseconds with a clear error, so a hung Firestore
 * call fails loudly instead of leaving the button stuck on "Saving..." forever. */
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`[timeout] ${label} took longer than ${ms}ms - likely blocked by network/firewall/extension`)), ms)
    ),
  ]);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "";
  statusEl.className = "";

  const result = readAndValidateForm();
  if (!result.ok) return;
  const { name, phone, pincode, product, source } = result.data;

  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";

  try {
    const existing = await withTimeout(findLeadsByPhone(phone), 15000, "repeat phone check");
    const repeatInfo = buildRepeatInfo(existing);

    const dealers = await withTimeout(loadDealers(), 15000, "loading dealers");
    const dealer = assignDealer(pincode, dealers);
    await withTimeout(
      addDoc(collection(db, LEADS_COLLECTION), {
        name,
        phone,
        pincode,
        product,
        source,
        status: "New",
        dealer_id: dealer.dealer_id,
        dealer_name: dealer.dealer_name,
        origin: "web",
        ...repeatInfo,
        created_on: serverTimestamp(),
      }),
      15000,
      "writing lead"
    );

    statusEl.textContent =
      `Lead saved and routed to ${dealer.dealer_name}.` +
      (repeatInfo.is_repeat
        ? ` This mobile number already has ${existing.length} earlier lead(s), so it is saved as a repeat enquiry.`
        : "");
    statusEl.className = "success";
    form.reset();
  } catch (err) {
    statusEl.textContent = "Something went wrong saving this lead: " + err.message;
    statusEl.className = "error";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save Lead";
  }
});