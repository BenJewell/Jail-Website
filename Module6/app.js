const APIController = (function () {
    const clientId = 'f73580adbc8d4eb3b983a308ca50b289';
    const clientSecret = 'd97f18e5cbc044d7980c38e7d535504a';

    //private methods
    const _getToken = async () => {

        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        const data = await result.json();
        return data.access_token;

    }

    const _getGenres = async (token) => {

        const result = await fetch('https://api.spotify.com/v1/browse/categories?locale=sv_US', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data.categories.items;

    }

    const _getPlaylistByGenre = async (token, genreId) => {

        const limit = 25;
        const result = await fetch('https://api.spotify.com/v1/browse/categories/${genreId}/playlists?limit=${limit}', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data.playlists.items;

    }

    const _getTracks = async (token, tracksEndPoint) => {

        const limit = 25;
        const result = await fetch('$tracksEndPoint}?limit=${limit}', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data.items;

    }

    const _getTrack = async (token, tracksEndPoint) => {

        const limit = 25;
        const result = await fetch('$tracksEndPoint}', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data;

    }


    return {
        getToken() {
            return _getToken();
        },
        getGenres(token) {
            return _getGenres();
        },
        getPlaylistByGenre(token, genreId) {
            return _getPlaylistByGenre(token, genreId);
        },
        getTracks(token, trackEndPoint) {
            return _getTracks(token, trackEndPoint);
        },
        getTrack(token, trackEndPoint) {
            return _getTrack(token, trackEndPoint);
        },
        //Need to do this for all of the constants that we have at the top
    }

})();

// UI Module
const UIController = (function () {
    const DOMElements = {
        selectGenre: '#select_genre',
        selectPlaylist: '#select_playlist',
        buttonSubmit: '#btn_submit',
        divSongDetail: '#song-detail',
        hfToken: '#hidden_token',
        divSongList: '.song-list'
    }

    // Public Methods
    return {
        inputField() {
            return {
                genre: document.querySelector(DOMElements.selectGenre),
                playlist: document.querySelector(DOMElements.selectPlaylist),
                tracks: document.querySelector(DOMElements.divSongList),
                submit: document.querySelector(DOMElements.buttonSubmit),
                songDetail: document.querySelector(DOMElements.divSongDetail)
            }
        },

        // Methods to create our selection list option
        createGenre(text, value) {
            const html = `<option value="${value}">${text}</option>`
            document.querySelector(DOMElements.selectGenre).insertAdjacentHTML('beforeend', html);
        },

        createPlaylist(text, value) {
            const html = `<option value="${value}">${text}</option>`
            document.querySelector(DOMElements.divSongList).insertAdjacentHTML('beforeend', html);
        },

        createTrack(id, name) {
            const html = `<a href="#" class="list-group-item list-group-item-action list-group-item-light" id="${id}">${name}></a>`
                document.querySelector(DOMElements.selectGenre).insertAdjacentHTML('beforeend', html);
        },

        // Method for the song detail

        createTrackDetail(img, title, artist) {
            const detailDiv = document.querySelector(DOMElements.divSongDeatil);
            detailDiv.innerHTML = '';
            const html =
                `
            <div class="row col-sm-12 px-0">
                <img src="${img}" alt"">
            </div>
            <div class="row col-sm-12 px-0">
                <label for="Genre" class="form-label col-sm-12">By ${title}:</label>
            </div>
            <div class="row col-sm-12 px-0">
                <label for="artist" class="form-label col-sm-12">By ${artist}:</label>
            </div>
            `;

            detailDiv.insertAdjacentHTML('beforeend', html)
        },

        resetTrackDetail() {
            this.inputField().songDetail.innerHTML = '';
        },

        resetTracks() {
            this.inputField().tracks.innerHTML = '';
            this.resetTrackDetail();
        },

        resetPlaylist() {
            this.inputField().songDetail.innerHTML = '';
            this.resetTracks();
        },

        storeToken(value) {
            document.querySelector(DOMElements.hfToken).value = value;
        },

        getStoredToken() {
            return {
                token: document.querySelector(DOMElements.hfToken).value
            }
        },

    }

})();

const APPController = (function (UICtrl, APICtrl) {
    const DOMInputs = UICtrl.inputField();

    // Get genres on page load
    const loadGenres = async () => {
        const token = await APICtrl.getToken();
        UICtrl.storeToken(token);
        const genres = await APICtrl.getGenres(token);
        genres.forEach(element => UICtrl.createGenre(element.name, element.id))
    };

    // Create submit button click even listener
    DOMInputs.submit.addEventListener('click', async (e) => {
        e.preventDefault();
        UICtrl.resetTracks();
        const token = UICtrl.getStoredToken().token;
        const playlistSelect = UICtrl.inputField().playlist;
        const trackEndPoint = playlistSelect.options[playlistSelect.selectedIndex].value;
        const tracks = await APICtrl.getTracks(token, tracksEndPoint);
        tracks.forEach(el => UICtrl.createTrack(el.track.href, el.track.name))
    });

    // Create song selection click even listener
    DOMInputs.submit.addEventListener('click', async (e) => {
        e.preventDefault();
        UICtrl.resetTrackDetail();
        const token = UICtrl.getStoredToken().token;
        const trackEndPoint = e.target.id;
        const track = await APICtrl.getTrack(token, tracksEndPoint);
        UICtrl.createTrackDetail(track.album.images[2].url, track.name, track.artists[0].name);
    });

    return {
        init() {
            console.log('App is starting');
            loadGenres();
        }
    }
})(UIController, APIController);

// Call initial method to load page
APPController.init();