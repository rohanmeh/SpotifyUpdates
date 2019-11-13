
const fs = require('fs');
const Spotify = require('./helpers/spotify');
const Database = require('./helpers/database');


let properties = fs.readFileSync('properties.json');
properties = JSON.parse(properties);

module.exports.update = async (event) => {
  const authOptions = properties.authRequest;
  const apiOptions = properties.apiRequest;
  function processResponse(response) {
    const songs = response.items;
    songs.forEach((value) => {
      const song = {
        id: value.track.id,
        name: value.track.name,
        artist: value.track.album.artists[0].name,
      };
      Database.checkDatabase(song);
    });
  }
  const accessToken = await Spotify.makeRequest(authOptions);
  apiOptions.headers.Authorization = `Bearer ${accessToken.access_token}`;
  let apiResponse = await Spotify.makeRequest(apiOptions);
  const requests = Math.floor(apiResponse.total / 100);
  processResponse(apiResponse);
  for (let i = 0; i < requests; i += 1) {
    const offset = (i + 1) * 100;
    apiOptions.url = `https://api.spotify.com/v1/playlists/37i9dQZF1DWWBHeXOYZf74/tracks?offset=${
      offset}`;
    apiResponse = await Spotify.makeRequest(apiOptions);
    processResponse(apiResponse);
  }
};
