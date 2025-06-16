
import { auth, db } from './firebase.js';
import {
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, updateDoc, Timestamp, increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// UI Elements
const usernameEl = document.getElementById("username");
const userImageEl = document.getElementById("userImage");
const checkinBtn = document.getElementById("checkinBtn");
const checkoutBtn = document.getElementById("checkoutBtn");
const checkinTimeEl = document.getElementById("checkinTime");
const checkoutTimeEl = document.getElementById("checkoutTime");
const breakStatus = document.getElementById("breakStatus");
const breakCountsEl = document.getElementById("breakCounts");
const endBreakBtn = document.getElementById("endBreakBtn");

let currentUser, userDocRef;
let breakStartTime = null;
let currentBreakType = "";

// Check Auth State
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "login.html";
  currentUser = user;
  userDocRef = doc(db, "users", user.uid);
  const snap = await getDoc(userDocRef);
  const data = snap.data() || {};

  usernameEl.textContent = data.name || "User";
  userImageEl.textContent = (data.name || "U")[0].toUpperCase();

  // Set times
  if (data.checkInTime) checkinTimeEl.textContent = new Date(data.checkInTime.seconds * 1000).toLocaleTimeString();
  if (data.checkOutTime) checkoutTimeEl.textContent = new Date(data.checkOutTime.seconds * 1000).toLocaleTimeString();

  // Check current session state
  if (data.checkInTime && !data.checkOutTime) {
    checkinBtn.classList.add("d-none");
    checkoutBtn.classList.remove("d-none");
    enableBreakButtons(true);
  } else {
    checkinBtn.classList.remove("d-none");
    checkoutBtn.classList.add("d-none");
    enableBreakButtons(false);
  }

  updateBreakCounts(data.breakCounts || {});
  updateBreakHistory(data.breakHistory || {});
});

// Check In
checkinBtn.onclick = async () => {
  const now = Timestamp.now();
  const snap = await getDoc(userDocRef);
  const data = snap.data();

  if (data.checkInTime) {
    const last = data.checkInTime.toDate();
    if ((Date.now() - last) < 12 * 3600000) {
      alert("Already checked in in last 12 hours.");
      return;
    }
  }

  await updateDoc(userDocRef, { checkInTime: now, checkOutTime: null });
  checkinTimeEl.textContent = now.toDate().toLocaleTimeString();
  checkinBtn.classList.add("d-none");
  checkoutBtn.classList.remove("d-none");
  enableBreakButtons(true);
  alert("Checked In!");
};

// Check Out
checkoutBtn.onclick = async () => {
  const now = Timestamp.now();
  const snap = await getDoc(userDocRef);
  const data = snap.data();

  if (data.checkOutTime) {
    const last = data.checkOutTime.toDate();
    if ((Date.now() - last) < 12 * 3600000) {
      alert("Already checked out in last 12 hours.");
      return;
    }
  }

  await updateDoc(userDocRef, { checkOutTime: now });
  checkoutTimeEl.textContent = now.toDate().toLocaleTimeString();
  checkinBtn.classList.remove("d-none");
  checkoutBtn.classList.add("d-none");
  enableBreakButtons(false);
  alert("Checked Out!");
};

// Start Break
window.startBreak = async (type) => {
  const snap = await getDoc(userDocRef);
  const data = snap.data();

  if (!data.checkInTime || data.checkOutTime) {
    return alert("Please check in first and don’t check out before taking break.");
  }

  if (breakStartTime !== null) {
    return alert(`Already on ${currentBreakType} break.`);
  }

  breakStartTime = new Date();
  currentBreakType = type;
  breakStatus.innerHTML = `<strong>On ${type} break...</strong>`;
  endBreakBtn.classList.remove("d-none");
};

// End Break
endBreakBtn.onclick = async () => {
  const end = new Date();
  const mins = Math.round((end - breakStartTime) / 60000);

  await updateDoc(userDocRef, {
    [`breakHistory.${Date.now()}`]: {
      type: currentBreakType,
      start: breakStartTime,
      end,
      duration: mins
    },
    [`breakCounts.${currentBreakType}`]: increment(1)
  });

  breakStatus.innerHTML = `<strong>${currentBreakType} ended: ${mins} min</strong>`;
  breakStartTime = null;
  currentBreakType = "";
  endBreakBtn.classList.add("d-none");

  const snap = await getDoc(userDocRef);
  const updatedData = snap.data();
  updateBreakCounts(updatedData.breakCounts || {});
  updateBreakHistory(updatedData.breakHistory || {});
};

// Logout
document.getElementById("logoutBtn").onclick = async () => {
  await signOut(auth);
  location.href = "login.html";
};

// Show Break Counts
function updateBreakCounts(counts) {
  breakCountsEl.innerHTML = "";
  for (const [type, count] of Object.entries(counts)) {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = `${type}: ${count} times`;
    breakCountsEl.appendChild(li);
  }
}

// Show Break History
function updateBreakHistory(history) {
  const historyList = document.getElementById("breakHistory");
  historyList.innerHTML = "";

  const sortedHistory = Object.values(history || {}).sort((a, b) => {
    return new Date(b.start.toDate ? b.start.toDate() : b.start) - new Date(a.start.toDate ? a.start.toDate() : a.start);
  });

  for (const entry of sortedHistory) {
    const li = document.createElement("li");
    li.className = "list-group-item";
    const start = new Date(entry.start.toDate ? entry.start.toDate() : entry.start);
    const end = new Date(entry.end.toDate ? entry.end.toDate() : entry.end);
    li.innerHTML = `
      <strong>${entry.type}</strong>:
      ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}
      (${entry.duration} mins)
    `;
    historyList.appendChild(li);
  }
}

// Toggle break buttons
function enableBreakButtons(state) {
  document.querySelectorAll('.btn-outline-light').forEach(btn => {
    btn.disabled = !state;
  });
}
