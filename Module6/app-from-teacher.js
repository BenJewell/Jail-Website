const APIController = (function(){
   const clientId = 'd174071615cf4e25a9935d59053bc454';
   const clientSecret = '5f45fdae5f794eaaa0d7cd0ec4770427';

   //private methods
   const _getToken = async () => {

        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Authorization' : 'Basic ' + btoa( clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

            const data = await result.json();
            return data.access_token;

   }

   const _getGenres = async (token) => {
     
       const result = await fetch('https://api.spotify.com/v1/browse/categories?locale=sv_US', {
           method: 'GET',
           headers: { 'Authorization' : 'Bearer ' + token}
       });

       const data = await result.json();
       return data.categories.items;

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
       }
       //Need to do this for all of the constants that we have at the top
   }

})();