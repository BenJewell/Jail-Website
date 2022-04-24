async function logoutAudit(reason) {
    await apiCall(`users/logout`, "POST", { reason: reason });
};

// Set timeout variables.
var timoutWarning = 900000; // Display warning in 15 Mins.

var warningTimer;

// Start warning timer.
function StartWarningTimer() {
    warningTimer = setTimeout("IdleTimeout()", timoutWarning);
}

// Reset timer.
function ResetTimeOutTimer() {
    clearTimeout(warningTimer)
    StartWarningTimer();
}

// Logout the user.
function IdleTimeout() {
    console.log("Idle detected")
    logoutAudit("Session timeout")
    window.localStorage.removeItem("user");
    document.location = "index.html?timeout=true";
}

StartWarningTimer() // Initial timer on page load

document.addEventListener("click", function (evt) {
    ResetTimeOutTimer()
});

window.addEventListener("scroll", function (evt) {
    ResetTimeOutTimer()
});