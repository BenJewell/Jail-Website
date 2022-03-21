const API_HOST = "/json";

async function apiCall (path) {
  try {
    const call = await fetch(`${API_HOST}/${path}.json`);
    return await call.json();
  } catch (error) {
    console.error(error);
    return alert("Failed to fetch API: \n\n" + error);
  }
}
