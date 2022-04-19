
// Socket managment
var socket = io();



// Render PC GUI
socket.on('ID', (ID) => {
    console.log('id: ' + ID, typeof (ID))
    jQuery('#qrcode').qrcode(ID.toString());
    document.getElementById('textcode').innerHTML = ID;
});

socket.on('URL', url => {
    console.log('Got a URL of ' + url)
    window.open(url)
});


// New session preparations
function initiate(type) {
    if (type === "phone") {
        // QR scanner
        function onScanSuccess(decodedText, decodedResult) {
            //console.log(`Code scanned = ${decodedText}`, decodedResult);
            sendData(decodedText, document.getElementById('url').value)
        }
        var qrScanner = new Html5QrcodeScanner(
            "qr-reader", { fps: 10, qrbox: 350 });
        //qrScanner.clear()
        qrScanner.render(onScanSuccess);

        // var qrScanner = new Html5Qrcode("qr-reader");
        // const config = { fps: 2 };
        // qrScanner.start({ facingMode: "environment" }, config, onScanSuccess);
        // qrScanner.render(onScanSuccess);
        // alert(qrScanner.getState())

    }
    else if (type === "pc") {
        socket.emit('requestID')
    }
}

// Phone page element managment
function setupPage(mode) {
    // We need to use the visible property to avoid breaking the camera, but we use display
    // property on buttons so they align properly when toggled.
    if (mode === "camera") {
        console.log("setting up page for camera")
        document.getElementById("qr-reader").style.visibility = "visible";
        document.getElementById("code-box").style.display = "none";
        document.getElementById("manual-code").style.display = "block";
        document.getElementById("start-camera").style.display = "none";
    }
    else if (mode === "manual") {
        console.log("setting up page for code")
        document.getElementById("qr-reader").style.visibility = "hidden";
        document.getElementById("code-box").style.display = "inline-block";
        document.getElementById("manual-code").style.display = "none";
        document.getElementById("start-camera").style.display = "block";
    }
}

// Pass data from phone to backend
function sendData(ID, URL) {
    socket.emit("giveDestination", ID, URL)
}

// Error handling
socket.on('throwError', error => { alert(error) })

