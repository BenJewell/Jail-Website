        // Set timeout variables.
        var timoutWarning = 900000; // Display warning in 15 Mins.
        var logoutUrl = 'logout.html'; // URL to logout page.

        var warningTimer;

        // Start warning timer.
        function StartWarningTimer() {
            warningTimer = setTimeout("IdleTimeout()", timoutWarning);
            // console.log("Timer set")
        }

        // Reset timer.
        function ResetTimeOutTimer() {
            // console.log("")
            clearTimeout(warningTimer)
            StartWarningTimer();
        }

        // Logout the user.
        function IdleTimeout() {
            console.log("Idle detected")
            //clearTimeout(warningTimer);
            //IdleTimeout()
            window.location = logoutUrl;
        }

        StartWarningTimer() // Initial timer on page load

        // document.addEventListener("mousemove", function (evt) {
        //     ResetTimeOutTimer()
        // });

        document.addEventListener("click", function (evt) {
            ResetTimeOutTimer()
        });

        window.addEventListener("scroll", function (evt) {
            ResetTimeOutTimer()
        });