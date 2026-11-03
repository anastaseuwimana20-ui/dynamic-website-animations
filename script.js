
import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// MOBILE MENU
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("active");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ANIMATIONS
const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  revealItems.forEach(item => revealObserver.observe(item));
} else {
  revealItems.forEach(item => item.classList.add("is-visible"));
}

// COPYRIGHT
const year = new Date().getFullYear();
const footerText = document.querySelector(".copyright");

if (footerText) {
  footerText.textContent =
    `© ${year} EAV Gitwe TSS. All rights reserved.`;
}

// AUTH MESSAGE
function showMessage(message, success = false) {
  const messageBox = document.getElementById("authMessage");

  if (messageBox) {
    messageBox.textContent = message;
    messageBox.style.color = success ? "#32d4a4" : "#ff7777";
  }
}

// REGISTER
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async event => {
    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(result.user, {
        displayName: name
      });

      await setDoc(doc(db, "users", result.user.uid), {
        name,
        email,
        createdAt: serverTimestamp()
      });

      showMessage("Konti yawe yakozwe neza!", true);
      registerForm.reset();

    } catch (error) {
      showMessage(error.message);
    }
  });
}

// LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showMessage("Winjiye neza!", true);
      loginForm.reset();

    } catch (error) {
      showMessage("Kwinjira byanze. Reba email na password.");
    }
  });
}

// LOGOUT
const logoutButton = document.getElementById("logoutBtn");

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      await signOut(auth);
      showMessage("Wasohotse neza.", true);
    } catch (error) {
      showMessage(error.message);
    }
  });
}

// CHECK USER LOGIN STATUS
onAuthStateChanged(auth, user => {
  const registerPanel = document.getElementById("registerPanel");
  const loginPanel = document.getElementById("loginPanel");
  const userPanel = document.getElementById("userPanel");
  const userName = document.getElementById("userName");
  const userEmail = document.getElementById("userEmail");

  if (user) {
    if (registerPanel) registerPanel.hidden = true;
    if (loginPanel) loginPanel.hidden = true;
    if (userPanel) userPanel.hidden = false;

    if (userName) userName.textContent = user.displayName || "Umunyeshuri";
    if (userEmail) userEmail.textContent = user.email || "";

  } else {
    if (registerPanel) registerPanel.hidden = false;
    if (loginPanel) loginPanel.hidden = false;
    if (userPanel) userPanel.hidden = true;
  }
});
