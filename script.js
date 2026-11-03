
import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// =====================================
// SELECT HTML ELEMENTS
// =====================================

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const authArea = document.getElementById("authArea");
const dashboard = document.getElementById("dashboard");

const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");
const dashboardMessage = document.getElementById("dashboardMessage");

const logoutButton = document.getElementById("logoutButton");
const forgotPassword = document.getElementById("forgotPassword");

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");


// =====================================
// HELPER FUNCTIONS
// =====================================

function showMessage(element, message, success = false) {
  if (!element) return;

  element.textContent = message;
  element.style.color = success ? "#145c3a" : "#c0392b";
}

function clearMessages() {
  showMessage(loginMessage, "");
  showMessage(registerMessage, "");
  showMessage(dashboardMessage, "");
}

function friendlyError(error) {
  const errors = {
    "auth/email-already-in-use":
      "This email is already registered. Please login.",

    "auth/invalid-email":
      "Please enter a valid email address.",

    "auth/weak-password":
      "Password must contain at least 6 characters.",

    "auth/user-not-found":
      "No account found with this email.",

    "auth/wrong-password":
      "Incorrect email or password.",

    "auth/invalid-credential":
      "Incorrect email or password.",

    "auth/too-many-requests":
      "Too many attempts. Please try again later.",

    "auth/network-request-failed":
      "Network error. Check your internet connection.",

    "auth/operation-not-allowed":
      "Email and Password login is not enabled in Firebase."
  };

  return errors[error.code] || "Something went wrong. Please try again.";
}


// =====================================
// LOGIN AND REGISTER TABS
// =====================================

function showLogin() {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");

  loginTab.classList.add("active");
  registerTab.classList.remove("active");

  clearMessages();
}

function showRegister() {
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");

  registerTab.classList.add("active");
  loginTab.classList.remove("active");

  clearMessages();
}

loginTab.addEventListener("click", showLogin);
registerTab.addEventListener("click", showRegister);


// =====================================
// STUDENT REGISTRATION
// =====================================

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  clearMessages();

  const fullName =
    document.getElementById("studentName").value.trim();

  const email =
    document.getElementById("studentEmail").value.trim();

  const studentClass =
    document.getElementById("studentClass").value.trim();

  const program =
    document.getElementById("studentProgram").value;

  const password =
    document.getElementById("registerPassword").value;

  if (!fullName || !email || !studentClass || !program || !password) {
    showMessage(registerMessage, "Please complete all fields.");
    return;
  }

  if (password.length < 6) {
    showMessage(registerMessage, "Password must be at least 6 characters.");
    return;
  }

  const submitButton = registerForm.querySelector(
    'button[type="submit"]'
  );

  submitButton.disabled = true;
  submitButton.textContent = "Creating account...";

  try {

    // Create Firebase Authentication account
    const userCredential =
      await createUserWithEmailAndPassword(auth, email, password);

    const user = userCredential.user;

    // Save student profile in Firestore
    const studentData = {
      fullName: fullName,
      email: user.email,
      studentClass: studentClass,
      program: program,
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, "users", user.uid), studentData);

    showMessage(
      registerMessage,
      "Account created successfully!",
      true
    );

    registerForm.reset();

    await renderDashboard(user, studentData);

  } catch (error) {

    console.error("Registration error:", error);

    showMessage(registerMessage, friendlyError(error));

  } finally {

    submitButton.disabled = false;
    submitButton.textContent = "Create Student Account";

  }
});


// =====================================
// STUDENT LOGIN
// =====================================

loginForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  clearMessages();

  const email =
    document.getElementById("loginEmail").value.trim();

  const password =
    document.getElementById("loginPassword").value;

  const submitButton = loginForm.querySelector(
    'button[type="submit"]'
  );

  submitButton.disabled = true;
  submitButton.textContent = "Logging in...";

  try {

    const userCredential =
      await signInWithEmailAndPassword(auth, email, password);

    await renderDashboard(userCredential.user);

    loginForm.reset();

  } catch (error) {

    console.error("Login error:", error);

    showMessage(loginMessage, friendlyError(error));

  } finally {

    submitButton.disabled = false;
    submitButton.textContent = "Login to Portal";

  }

});


// =====================================
// FORGOT PASSWORD
// =====================================

forgotPassword.addEventListener("click", async () => {

  const email =
    document.getElementById("loginEmail").value.trim();

  if (!email) {
    showMessage(
      loginMessage,
      "Enter your email address first."
    );
    return;
  }

  try {

    await sendPasswordResetEmail(auth, email);

    showMessage(
      loginMessage,
      "Password reset instructions have been sent to your email.",
      true
    );

  } catch (error) {

    console.error("Password reset error:", error);

    showMessage(loginMessage, friendlyError(error));

  }

});


// =====================================
// DISPLAY STUDENT DASHBOARD
// =====================================

async function renderDashboard(user, suppliedData = null) {

  try {

    let studentData = suppliedData;

    if (!studentData) {

      const studentRef = doc(db, "users", user.uid);

      const studentSnapshot = await getDoc(studentRef);

      if (studentSnapshot.exists()) {
        studentData = studentSnapshot.data();
      } else {
        studentData = {};
      }

    }

    document.getElementById("profileName").textContent =
      studentData.fullName || "Student";

    document.getElementById("profileEmail").textContent =
      user.email || "-";

    document.getElementById("profileClass").textContent =
      studentData.studentClass || "Not provided";

    document.getElementById("profileProgram").textContent =
      studentData.program || "Not provided";

    authArea.classList.add("hidden");
    dashboard.classList.remove("hidden");

    showMessage(
      dashboardMessage,
      "You are successfully logged in.",
      true
    );

  } catch (error) {

    console.error("Dashboard error:", error);

    showMessage(
      dashboardMessage,
      "Unable to load your student profile."
    );

  }

}


// =====================================
// FIREBASE AUTHENTICATION STATE
// =====================================

onAuthStateChanged(auth, async (user) => {

  if (user) {

    await renderDashboard(user);

  } else {

    dashboard.classList.add("hidden");
    authArea.classList.remove("hidden");

  }

});


// =====================================
// STUDENT LOGOUT
// =====================================

logoutButton.addEventListener("click", async () => {

  try {

    await signOut(auth);

    dashboard.classList.add("hidden");
    authArea.classList.remove("hidden");

    showLogin();

  } catch (error) {

    console.error("Logout error:", error);

    showMessage(
      dashboardMessage,
      "Unable to logout. Please try again."
    );

  }

});


// =====================================
// MOBILE NAVIGATION
// =====================================

menuToggle.addEventListener("click", () => {

  navLinks.classList.toggle("show");

});

document.querySelectorAll(".nav-links a").forEach((link) => {

  link.addEventListener("click", () => {

    navLinks.classList.remove("show");

  });

});


// =====================================
// CURRENT YEAR
// =====================================

document.getElementById("currentYear").textContent =
  new Date().getFullYear();


console.log("EAV Gitwe TSS website initialized successfully.");
