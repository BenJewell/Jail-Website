(() => {

  // to be removed when backend is implemented
  const testUsers = {
    "teacher1@test.edu": {
      password: "test123",
      role: "teacher"
    },
    "student1@test.edu": {
      password: "test123",
      role: "student"
    },
    "admin1@test.edu": {
      password: "test123",
      role: "admin"
    }
  };

  function showError(text) {
    document.getElementById("loginError").style.display = "block";
    document.getElementById("loginError").innerHTML = text;
  }

  async function login(event) {
    event.preventDefault();

    let email = document.getElementById("loginEmail").value.toLowerCase();
    let password = document.getElementById("loginPassword").value;

    if (email.length < 3 || password.length < 3) {
      return showError("Please enter a valid email and password.")
    }

    if (testUsers[email] === undefined) {
      return showError("User and/or password is incorrect.");
    }

    let user = testUsers[email];
    if (user.password !== password) {
      return showError("User and/or password is incorrect.");
    }

    // fake API call to get a successful login message
    let api = await apiCall("login-successful");
    if (api.success) {
      if (user.role === "admin")
        return document.location = "admin-department1.html";
      return document.location = `${user.role}-dashboard.html`;
    }
    return alert("Login failed. Please try again.");
  }

  document.getElementById("loginForm").addEventListener("submit", login);

})();
