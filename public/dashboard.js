// dashboard.js
//
// Shows every lead, with live counts by dealer and by status, and lets
// a manager change a lead's status inline (New -> Contacted -> Converted
// / Lost). Uses onSnapshot so the dashboard updates in real time if two
// people have it open at once - no manual refresh needed.

import { db, LEADS_COLLECTION } from "./firebase-init.js";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { STATUS_VALUES } from "./validate.js";

const tbody = document.getElementById("leads-tbody");
const statusStats = document.getElementById("status-stats");
const dealerStats = document.getElementById("dealer-stats");
const filterDealer = document.getElementById("filter-dealer");
const filterStatus = document.getElementById("filter-status");

let allLeads = []; // the full, unfiltered list we got from Firestore

function formatDate(ts) {
  if (!ts) return "-";
  // Firestore Timestamp -> JS Date. Handles both live (server) leads and
  // imported legacy leads, which we store as Firestore Timestamps too.
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function renderStats(leads) {
  const byStatus = {};
  STATUS_VALUES.forEach((s) => (byStatus[s] = 0));
  const byDealer = {};

  leads.forEach((l) => {
    byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    const key = l.dealer_name || "Unassigned";
    byDealer[key] = (byDealer[key] || 0) + 1;
  });

  statusStats.innerHTML = STATUS_VALUES.map(
    (s) => `<div class="stat-card"><div class="num">${byStatus[s] || 0}</div><div class="label">${s}</div></div>`
  ).join("");

  dealerStats.innerHTML = Object.entries(byDealer)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([name, count]) =>
        `<div class="stat-card"><div class="num">${count}</div><div class="label">${name}</div></div>`
    )
    .join("");
}

function populateDealerFilter(leads) {
  const dealers = [...new Set(leads.map((l) => l.dealer_name).filter(Boolean))].sort();
  const current = filterDealer.value;
  filterDealer.innerHTML =
    `<option value="">All dealers</option>` +
    dealers.map((d) => `<option value="${d}">${d}</option>`).join("");
  filterDealer.value = current;
}

async function onStatusChange(leadId, newStatus) {
  try {
    await updateDoc(doc(db, LEADS_COLLECTION, leadId), { status: newStatus });
  } catch (err) {
    console.error("Failed to update status", err);
    alert("Could not update status. See console for details.");
  }
}

function renderTable() {
  const dealerFilterVal = filterDealer.value;
  const statusFilterVal = filterStatus.value;

  const filtered = allLeads.filter((l) => {
    if (dealerFilterVal && l.dealer_name !== dealerFilterVal) return false;
    if (statusFilterVal && l.status !== statusFilterVal) return false;
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="muted">No leads match these filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((l) => {
      const statusOptions = STATUS_VALUES.map(
        (s) => `<option value="${s}" ${s === l.status ? "selected" : ""}>${s}</option>`
      ).join("");
      return `
        <tr>
          <td>${l.name}</td>
          <td>${l.phone}</td>
          <td>${l.pincode}</td>
          <td>${l.product}</td>
          <td>${l.dealer_name || "-"}</td>
          <td>${l.source}</td>
          <td>
            <select class="status-select" data-id="${l.id}">
              ${statusOptions}
            </select>
          </td>
        </tr>`;
    })
    .join("");

  tbody.querySelectorAll(".status-select").forEach((sel) => {
    sel.addEventListener("change", (e) => {
      onStatusChange(e.target.dataset.id, e.target.value);
    });
  });
}

function render() {
  renderStats(allLeads);
  populateDealerFilter(allLeads);
  renderTable();
}

filterDealer.addEventListener("change", renderTable);
filterStatus.addEventListener("change", renderTable);

const leadsQuery = query(collection(db, LEADS_COLLECTION), orderBy("created_on", "desc"));
onSnapshot(
  leadsQuery,
  (snap) => {
    allLeads = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  },
  (err) => {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7" class="muted">Could not load leads: ${err.message}</td></tr>`;
  }
);
