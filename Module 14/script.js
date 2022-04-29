
const form = document.getElementById("form");
const query = document.getElementById("query");
const search = document.getElementById("search");
const result = document.getElementById("result");
const lyrics = document.getElementById("lyrics-result");
// const more = 

const endPoint = "https://api.lyrics.ovh"

// Search for song or artist
async function searchSongs(value) {
    console.log("user searched for", value)
    const res = await fetch(`${endPoint}/suggest/${value}`)
    const data = await res.json();
    console.log("data we got is", data)
    showSongs(data)
}

// Onclick for lyrics button to get lyrics for the song that was clicked.
async function getData(song, artist) {
    console.log("Getting lyrics for", song)
    const res = await fetch(`${endPoint}/v1/${artist}/${song}`)
    const data = await res.json();
    console.log("data we got is", data)
    if (!data.lyrics) {
        lyrics.innerHTML = data.error
    }
    else {
        lyrics.innerHTML = data.lyrics
    }
    lyrics.scrollIntoView()

}

// I did this a different way I think so I would like to see your code after I turn this so I can compare them.
// I am wondering if you used something like ".dataset."

// Function to make returned data visable.
function showSongs(data) {
    result.innerHTML = `
    <ul class="songs">${data.data.map(song => `<li>
    <span><strong>${song.artist.name}</strong> - ${song.title}</span>
    <button class="btn" onclick="getData('${song.title}', '${song.artist.name}')">Show Lyrics</button>
    </li>`).join("")}
    </ul>
`}

// Event lisner for submit
search.addEventListener("click", e => {
    e.preventDefault();
    const searchTerm = query.value.trim();
    if (!searchTerm) {
        alert("Please input a search term")
    }
    else {
        searchSongs(searchTerm)
    }
})

//Is there a way to do this using the word "this"?