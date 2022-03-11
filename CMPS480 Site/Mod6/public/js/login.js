(() => {

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

    let api = await apiCall("users/login", "POST", {email: email, password: password});
    if (api.success) {
      window.localStorage.setItem("user", JSON.stringify(api));
      if (api.role === "admin")
        return document.location = "admin-manage-sections.html";
      return document.location = `${api.role}-dashboard.html`;
    }
    return showError("Incorrect email and/or password.")
  }

  document.getElementById("loginForm").addEventListener("submit", login);

})();
