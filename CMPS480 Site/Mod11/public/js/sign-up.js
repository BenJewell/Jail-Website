(() => {

  function showError(text) {
    document.getElementById("signupError").style.display = "block";
    document.getElementById("signupError").innerHTML = text;
  }

  async function login(event) {
    event.preventDefault();

    let name = document.getElementById("signupName").value.toLowerCase();
    let email = document.getElementById("signupEmail").value.toLowerCase();
    let password = document.getElementById("signupPassword").value;

    if (name.length < 3 || email.length < 3 || password.length < 3) {
      return showError("Please enter a valid name, email and password.")
    }

    let api = await apiCall("users/signup", "POST", {name: name, email: email, password: password});
    if (api.success) {
      window.localStorage.setItem("user", JSON.stringify(api));
      return document.location = `student-dashboard.html`;
    }
    return showError("There was an error signing you up. Please try again.")
  }

  document.getElementById("signupForm").addEventListener("submit", login);

})();
