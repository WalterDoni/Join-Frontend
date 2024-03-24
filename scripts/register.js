let usersBackend = [];
let email;
let user;

/**
 * Initializes the startup process by loading the user data.
 */
async function init() {
  await loadUsersRegister();
}

function logo() {
  setTimeout(function () {
    let logo = document.getElementById("join-logo");
    logo.src = "./img/JoinLogoDark.png";
  }, 800);
}

/**
 * Load the user data from a remote storage and handles potential loading errors.
 */
async function loadUsersRegister() {
  try {
    users = JSON.parse(await getItemUsers("users")) || [];
  } catch (e) {
    console.error("Loading error:", e);
  }
}

/**
 * Reset the registration form by clearing the values of the input fields and enabling the registration button.
 */
function resetForm() {
  const nameInput = document.getElementById("username");
  const emailInput = document.getElementById("emailLogin");
  const passwordInput = document.getElementById("password");
  const registerBtn = document.getElementById("registerBtn");
  nameInput.value = "";
  emailInput.value = "";
  passwordInput.value = "";
  registerBtn.disabled = false;
}

/**
 * Display a success message for registration and redirects the user to the login page after a short delay.
 */
function displayRegistrationSuccess() {
  let infoBox = document.getElementById("infoBox");
  infoBox.style.display = "block";
  setTimeout(() => {
    infoBox.style.display = "none";
  }, 1500); // Weiterleitung nach 1 Sekunde (1000 Millisekunden)
}

function showInfoBox() {
  let infoBox = document.getElementById("infoBox");
  infoBox.style.display = "block";
  setTimeout(() => {
    infoBox.style.display = "none";
  }, 1500); // Weiterleitung nach 1 Sekunde (1000 Millisekunden)
}

// Login //

function openGuestLoginBackend() {
  const emailField = document.getElementById("emailLogin");
  const passwordField = document.getElementById("passwordLogin");
  const loginError = document.getElementById("login-error");
  const emailValue = "testguest@test.de";
  const passwordValue = "123";
  emailField.value = emailValue;
  passwordField.value = passwordValue;
  loginError.style.display = "none";
  setTimeout(function () {
    emailField.value = "";
    passwordField.value = "";
    loginError.style.display = "none";
    const urlParams = new URLSearchParams(window.location.search);
    const userName = urlParams.get("name");
    window.location.href = `./html/summary.html?name=${userName || "Guest"}`;
  });
}

/**
 * Handles the login process by comparing the entered email and password with the registered users.
 * If a matching user is found, the page is redirected to the summary page with the user's name.
 * Otherwise, a login error message is displayed.
 * @param {Event} event - The event object from the login form submission.
 */
async function loginUser(event) {
  event.preventDefault();
  const emailInput = document.getElementById("emailLogin");
  const passwordInput = document.getElementById("passwordLogin");
  const loginError = document.getElementById("login-error");
  const email = emailInput.value;
  const password = passwordInput.value;
  const registeredUsers = await loadUsers();
  const user = registeredUsers.find(
    (user) => user.email === email && user.password === password
  );
  if (user) {
    window.location.href = `./html/summary.html?name=${user.name}`;
  } else {
    loginError.style.display = "block";
  }
}

/**
 * Load the list of registered users from the data source.
 * @function
 * @async
 * @returns {Promise<Array<Object>>} - A Promise that resolves to an array of user objects containing the registered users.
 * @throws {Error} - If there is an error while loading the user data.
 */

async function loadUsers() {
  try {
    const usersData = await getItemUsers("users");
    return JSON.parse(usersData) || [];
  } catch (error) {
    console.error("Loading error:", error);
    return [];
  }
}

/**
 * Change the source of the logo image after the page has loaded to display the "Join-Logo.svg" image.
 */
window.onload = function () {
  setTimeout(function () {
    let logo = document.getElementById("join-logo");
    logo.src = "./img/Join-Logo.svg";
  }, 800);
};

async function onSubmit(event) {
  event.preventDefault();
  let formData = new FormData(event.target);
  let response = await action(formData);
  if (response.ok) {
    showInfoBox();
  } else {
    alert("E-Mail was not sent!");
  }
}

function action(formData) {
  const input = "https://walter-doni.developerakademie.net/Join/send_mail.php";
  const requestInit = {
    method: "post",
    body: formData,
  };
  return fetch(input, requestInit);
}

function showInfoBox() {
  let infoBox = document.getElementById("infoBox");
  infoBox.style.display = "block";
  setTimeout(() => {
    infoBox.style.display = "none";
  }, 1500); // Weiterleitung nach 1 Sekunde (1000 Millisekunden)
}

async function onPageLoad() {
  email = getEmailUrl();
  user = await getPasswordResetUser();
}

/**
 * Retrieves the user object for password reset based on the email.
 *
 * @returns {Object|null} - The user object for password reset, or null if not found.
 */
async function getPasswordResetUser() {
  await loadUsers();
  let user = users.find((u) => u.email == email);
  return user;
}

function getEmailUrl() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const email = urlParams.get("email");
  return email;
}

async function clearUsers() {
  users.splice("1", 9);
  await setItem("users", users);
}

function displayEmailExistsMessage() {
  alert("The email is already registered.");
}

function checkIfEmailExistAllready(emailLogin) {
  return usersBackend[0].some(user => user.email === emailLogin);
}





//----Django-Backend-Functions----//

async function getUserBackend() {
  const url = "http://127.0.0.1:8000/login/";
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    usersBackend.push(data.map(({ email, username, id }) => ({ email, username, id })));
    return data;
  } catch (error) {
    console.error("Es gab ein Problem mit der Abrufoperation:", error);
    throw error;
  }
}

async function loginAsGuest() {
  const url = `http://127.0.0.1:8000/login/`;
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: "Gast",
      password: "Gast1234",
    }),
  });
  window.location.href = "./html/summary.html?name=Gast";
}

async function loginAsUser() {
  const selectedname = "";
  const url = `http://127.0.0.1:8000/login/`;
  const user = getUsername(selectedname);
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: user,
        password: passwordLogin.value,
      }),
    });
    window.location.href = `./html/summary.html?name=${user}`;
  } catch (error) {
    console.error("There was an error!", error);
  }
}

function getUsername(selectedname) {
  usersBackend[0].forEach((user) => {
    if (user["email"] == emailLogin.value) {
      selectedname = user["username"];
    }
  });
  return selectedname;
}

async function signUpNewUser() {
  const url = `http://127.0.0.1:8000/signup/`;
  if (checkIfEmailExistAllready(emailLogin.value)) {
    alert("Email address allready exist!");
    return false;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.value,
        email: emailLogin.value,
        password: password.value,
      }),
    });
    resetForm();
    displayRegistrationSuccess();
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 1500);
  } catch (error) {
    console.error("There was an error!", error);
  }
}
