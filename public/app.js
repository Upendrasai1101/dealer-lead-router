// app.js
//
// Logic for the "New Lead" form (index.html). Flow, in plain words:
//   1. Read and validate what the person typed.
//   2. Check Firestore for an existing lead with the same phone number
//      (that's the "duplicate mobile blocking" requirement) - if found,
//      stop and tell the user instead of creating a second record.
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

/** Returns true if a lead with this phone number already exists. */
async function phoneAlreadyExists(phone) {
  const q = query(collection(db, LEADS_COLLECTION), where("phone", "==", phone));
  const snap = await getDocs(q);
  return !snap.empty;
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
    if (await withTimeout(phoneAlreadyExists(phone), 15000, "duplicate phone check")) {
      statusEl.textContent =
        "A lead with this mobile number already exists. Not creating a duplicate.";
      statusEl.className = "error";
      return;
    }

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
        created_on: serverTimestamp(),
      }),
      15000,
      "writing lead"
    );

    statusEl.textContent = `Lead saved and routed to ${dealer.dealer_name}.`;
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