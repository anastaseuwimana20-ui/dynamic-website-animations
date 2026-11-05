
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// ======================================
// 1. FIREBASE CONFIGURATION
// ======================================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "eav-gitwe-tss.firebaseapp.com",
  projectId: "eav-gitwe-tss",
  storageBucket: "eav-gitwe-tss.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "1:457038227189:web:e929c5b758fee7c81487bc"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ======================================
// 2. HELPER FUNCTIONS
// ======================================

function showMessage(elementId, message, success = false) {
  const element = document.getElementById(elementId);

  if (!element) return;

  element.textContent = message;
  element.style.color = success ? "green" : "red";
}

function hideElement(element) {
  if (element) element.classList.add("hidden");
}

function showElement(element) {
  if (element) element.classList.remove("hidden");
}


// ======================================
// 3. ELEMENTS
// ======================================

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const authArea = document.getElementById("authArea");
const dashboard = document.getElementById("dashboard");

const logoutButton = document.getElementById("logoutButton");
const forgotPassword = document.getElementById("forgotPassword");


// ======================================
// 4. LOGIN AND REGISTER TABS
// ======================================

function showLoginTab() {
  showElement(loginForm);
  hideElement(registerForm);

  loginTab?.classList.add("active");
  registerTab?.classList.remove("active");
}

function showRegisterTab() {
  showElement(registerForm);
  hideElement(loginForm);

  registerTab?.classList.add("active");
  loginTab?.classList.remove("active");
}

loginTab?.addEventListener("click", showLoginTab);
registerTab?.addEventListener("click", showRegisterTab);


// ======================================
// 5. STUDENT REGISTRATION
// ======================================

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("studentName")?.value.trim();
  const email = document.getElementById("studentEmail")?.value.trim();
  const studentClass = document.getElementById("studentClass")?.value;
  const program = document.getElementById("studentProgram")?.value;
  const password = document.getElementById("registerPassword")?.value;

  if (!name || !email || !studentClass || !program || !password) {
    showMessage("registerMessage", "Please complete all fields.");
    return;
  }

  if (password.length < 6) {
    showMessage(
      "registerMessage",
      "Password must contain at least 6 characters."
    );
    return;
  }

  const submitButton = registerForm.querySelector('button[type="submit"]');

  try {
    if (submitButton) submitButton.disabled = true;

    showMessage("registerMessage", "Creating your account...");

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // Save student information in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: name,
      email: email,
      studentClass: studentClass,
      program: program,
      createdAt: serverTimestamp()
    });

    registerForm.reset();

    showMessage(
      "registerMessage",
      "Account created successfully!",
      true
    );

  } catch (error) {
    console.error("Registration error:", error);

    let message = "Registration failed. Please try again.";

    if (error.code === "auth/email-already-in-use") {
      message = "This email is already registered. Please login.";
    } else if (error.code === "auth/invalid-email") {
      message = "Please enter a valid email address.";
    } else if (error.code === "auth/weak-password") {
      message = "Please use a stronger password.";
    } else if (error.code === "permission-denied") {
      message = "Database permission denied. Check Firestore Rules.";
    }

    showMessage("registerMessage", message);

  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});


// ======================================
// 6. STUDENT LOGIN
// ======================================

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value;

  if (!email || !password) {
    showMessage("loginMessage", "Please enter email and password.");
    return;
  }

  const submitButton = loginForm.querySelector('button[type="submit"]');

  try {
    if (submitButton) submitButton.disabled = true;

    showMessage("loginMessage", "Logging in...");

    await signInWithEmailAndPassword(auth, email, password);

    loginForm.reset();

    showMessage("loginMessage", "Login successful!", true);

  } catch (error) {
    console.error("Login error:", error);

    let message = "Login failed. Check your email and password.";

    if (error.code === "auth/user-not-found") {
      message = "Account not found. Please register first.";
    } else if (error.code === "auth/wrong-password" ||
               error.code === "auth/invalid-credential") {
      message = "Incorrect email or password.";
    } else if (error.code === "auth/invalid-email") {
      message = "Please enter a valid email.";
    } else if (error.code === "auth/too-many-requests") {
      message = "Too many attempts. Please try again later.";
    }

    showMessage("loginMessage", message);

  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});


// ======================================
// 7. FORGOT PASSWORD
// ======================================

forgotPassword?.addEventListener("click", async (event) => {
  event.preventDefault();

  const email = document.getElementById("loginEmail")?.value.trim();

  if (!email) {
    showMessage(
      "loginMessage",
      "Enter your email address first."
    );
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);

    showMessage(
      "loginMessage",
      "Password reset instructions have been sent to your email.",
      true
    );

  } catch (error) {
    console.error("Password reset error:", error);

    showMessage(
      "loginMessage",
      "Could not send reset email. Check the email address and Firebase settings."
    );
  }
});


// ======================================
// 8. DISPLAY STUDENT DASHBOARD
// ======================================

async function loadStudentDashboard(user) {
  try {
    const studentRef = doc(db, "users", user.uid);
    const studentSnapshot = await getDoc(studentRef);

    if (!studentSnapshot.exists()) {
      showMessage(
        "dashboardMessage",
        "Student profile was not found. Contact the school administrator."
      );
      return;
    }

    const student = studentSnapshot.data();

    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const profileClass = document.getElementById("profileClass");
    const profileProgram = document.getElementById("profileProgram");

    if (profileName) profileName.textContent = student.name || "Student";
    if (profileEmail) profileEmail.textContent = student.email || user.email;
    if (profileClass) profileClass.textContent = student.studentClass || "Not provided";
    if (profileProgram) profileProgram.textContent = student.program || "Not provided";

    showElement(dashboard);
    hideElement(authArea);

    showMessage("dashboardMessage", "Welcome to your student dashboard.", true);

  } catch (error) {
    console.error("Dashboard error:", error);

    showMessage(
      "dashboardMessage",
      "Unable to load student profile. Check your internet connection and Firestore Rules."
    );
  }
}


// ======================================
// 9. LOGOUT
// ======================================

logoutButton?.addEventListener("click", async () => {
  try {
    await signOut(auth);

    showElement(authArea);
    hideElement(dashboard);

    showLoginTab();

    showMessage("loginMessage", "You have logged out successfully.", true);

  } catch (error) {
    console.error("Logout error:", error);

    showMessage("dashboardMessage", "Logout failed. Please try again.");
  }
});


// ======================================
// 10. CHECK USER LOGIN STATUS
// ======================================

onAuthStateChanged(auth, async (user) => {
  if (user) {
    hideElement(authArea);
    showElement(dashboard);

    await loadStudentDashboard(user);

  } else {
    showElement(authArea);
    hideElement(dashboard);
  }
});


// ======================================
// 11. CONTACT FORM
// ======================================

const contactForm = document.getElementById("contactForm");

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("contactName")?.value.trim();
  const email = document.getElementById("contactEmail")?.value.trim();
  const subject = document.getElementById("contactSubject")?.value.trim();
  const message = document.getElementById("contactMessage")?.value.trim();

  if (!name || !email || !subject || !message) {
    showMessage("contactStatus", "Please complete all contact fields.");
    return;
  }

  const submitButton = contactForm.querySelector('button[type="submit"]');

  try {
    if (submitButton) submitButton.disabled = true;

    showMessage("contactStatus", "Sending your message...");

    await addDoc(collection(db, "messages"), {
      name: name,
      email: email,
      subject: subject,
      message: message,
      createdAt: serverTimestamp()
    });

    contactForm.reset();

    showMessage(
      "contactStatus",
      "Your message has been sent successfully. Thank you!",
      true
    );

  } catch (error) {
    console.error("Contact form error:", error);

    showMessage(
      "contactStatus",
      "Message could not be sent. Please try again."
    );

  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});


// ======================================
// 12. MOBILE NAVIGATION
// ======================================

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle?.addEventListener("click", () => {
  const isOpen = navLinks?.classList.toggle("show");

  menuToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
  menuToggle.textContent = isOpen ? "✕" : "☰";
});

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("show");

    menuToggle?.setAttribute("aria-expanded", "false");

    if (menuToggle) menuToggle.textContent = "☰";
  });
});


// ======================================
// 13. INITIAL PAGE STATE
// ======================================

showLoginTab();

console.log("EAV Gitwe TSS Website initialized successfully.");
