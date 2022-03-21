function letterGrade(num) {
    if (num >= 0.9) {
        return "A";
    }
    else if (num >= 0.8) {
        return "B";
    }
    else if (num >= 0.7) {
        return "C";
    }
    else if (num >= 0.6) {
        return "D";
    }
    else if (num < 0.6) {
        return "F";
    }
    return "";
}

// This sets row colors by grade. Setting row colors if missing is being done in a different way.
function rowColor(num) {
    if (num >= 0.9) {
        return "hsla(160, 100%, 50%, 0.3)";
    }
    else if (num >= 0.8) {
        return "hsla(100, 100%, 50%, 0.3)";
    }
    else if (num >= 0.7) {
        return "hsla(60, 100%, 50%, 0.3)";
    }
    else if (num >= 0.6) {
        return "hsla(30, 100%, 50%, 0.3)";
    }
    else if (num < 0.6) {
        return "hsla(0, 100%, 50%, 0.3)";
    }
    return "";
}

function toPercentage(num) {
    //return Math.round(num * 10000) / 100;
    return Math.round((num + Number.EPSILON) * 10000) / 100;
}

function checkNull(val) {
    return (val == null) ? "-" : val;
}

function checkNullZero(val) {
    return (val == null || val == 0) ? "-" : val;
}

function checkMissing(miss) {
    var warning = feather.icons['alert-circle'].toSvg();
    if (miss) {
        document.getElementById("missingTR").style = "background-color: hsla(0, 100%, 50%, 0.3)";
        document.getElementById("missingTD").innerHTML = warning;

    }
    document.getElementById("missingTR").id = "TR";
    document.getElementById("missingTD").id = "TD";
}