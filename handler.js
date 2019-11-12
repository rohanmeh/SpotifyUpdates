"use strict";
const fs = require("fs");
const rp = require("request-promise");
const low = require("lowdb");
const Twitter = require("twitter");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("db.json");
const db = low(adapter);

let properties = fs.readFileSync("properties.json");
properties = JSON.parse(properties);

module.exports.update = async event => {
  const authOptions = properties.authRequest;
  let apiOptions = properties.apiRequest;
  let twitterOptions = properties.twitter;
  var client = new Twitter({
    consumer_key: twitterOptions.consumer_key,
    consumer_secret: twitterOptions.consumer_secret,
    access_token_key: twitterOptions.access_token,
    access_token_secret: twitterOptions.access_token_secret
  });
  function tweetSong(song) {
    const statusUpdate =
      song.artist +
      " - " +
      song.name +
      " " +
      "https://open.spotify.com/track/" +
      song.id;
    client.post("statuses/update", { status: statusUpdate }, function(
      error,
      tweet,
      response
    ) {
      if (error) throw error;
    });
  }
  function processResponse(response) {
    const songs = response.items;
    songs.forEach(function(value) {
      let song = {
        id: value["track"]["id"],
        name: value["track"]["name"],
        artist: value["track"]["album"]["artists"][0]["name"]
      };
      if (
        db
          .get("songs")
          .find({ id: song.id })
          .value()
      ) {
        //console.log("Song Found", song.id)
      } else {
        console.log(song.id, "-", song.name, "-", song.artist);
        db.get("songs")
          .push(song)
          .write();
        tweetSong(song);
      }
    });
  }
  async function makeRequest(options) {
    try {
      let response = await rp(options);
      response = JSON.parse(response);
      return response;
    } catch (err) {
      console.log("Request failed", err);
    }
  }
  const access_token = await makeRequest(authOptions);
  apiOptions.headers.Authorization = "Bearer " + access_token.access_token;
  let apiResponse = await makeRequest(apiOptions);
  const requests = Math.floor(apiResponse.total / 100);
  processResponse(apiResponse);
  for (let i = 0; i < requests; i++) {
    const offset = (i + 1) * 100;
    apiOptions.url = apiOptions.url + "?offset=" + offset;
    apiResponse = await makeRequest(apiOptions);
    processResponse(apiResponse);
  }
};
