const API_HOST = "http://bjewel.it.pointpark.edu/CMPS480%20Site/Module%203%20Snapshot/JSON";
//const API_HOST = "http://45.55.44.163/json";

async function apiCall (path) {
  try {
    const call = await fetch(`${API_HOST}/${path}.json`);
    return await call.json();
  } catch (error) {
    console.error(error);
    return alert("Failed to fetch API: \n\n" + error);
  }
}
