const API_HOST = "."; // leave blank if testing locally
//const API_HOST = "http://45.55.44.163/json";

function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    if (decodeURIComponent(pair[0]) == variable) {
      return decodeURIComponent(pair[1]);
    }
  }
  return false;
}


async function apiCall(path, method = "GET", data = undefined) {
  let key = "";
  let user = window.localStorage.getItem("user");
  if (user) {
    user = JSON.parse(user);
    key = user.key;
  }
  try {
    const call = await fetch(`${API_HOST}/${path}`, {
      method: method,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Key': key
      }
    });
    if (call.status == 500) { // HTTP level error handeling, if API is up
     throw("500 Internal Server Error");
    }
    return await call.json();
  } catch (error) { // API error handled, if API is down
    console.error(error);
	throw(error);
  }
}
