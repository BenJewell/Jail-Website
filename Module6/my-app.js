// const APIController = function () {
    const clientId = "f73580adbc8d4eb3b983a308ca50b289";
    const clientSecret = "d97f18e5cbc044d7980c38e7d535504a";

    // private methods
    const _getToken = async () => {

        const result = await fetch("http://accounts.spotify.com/api/token" {
            method: 'POST',
            headers {
                'content-type:............'
            }
        })
    }

    const _getGenres = async (token) => {

        const result = await fetch("" {
            method: 'GET',
            headers {
                'content-type:............'
            }
        })
    }

    const _getPlaylistByGenre = async (token, genreId) => {

    }

    const _getTracks = async (token, tracksEndPoint) => {

    }

    const _getTrack = async (token, tracksEndPoint) => {

    }

    return {
        getToken() {
            return _getToken();
        } // Need this for all of the constants that we have at the top.
    }

}