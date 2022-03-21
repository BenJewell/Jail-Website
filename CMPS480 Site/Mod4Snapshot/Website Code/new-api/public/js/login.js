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


    // fake API call to get a successful login message
    let api = await apiCall("users/login", "POST", { email: email, password: password });
    if (api.success) {
		window.localStorage.setItem("user", JSON.stringify(api));
      if (api.role === "admin")
        return document.location = "admin-department1.html";
      return document.location = `${api.role}-dashboard.html`;
    }
     return showError("Incorrect email and/or password.")
  }

  document.getElementById("loginForm").addEventListener("submit", login);

})();
