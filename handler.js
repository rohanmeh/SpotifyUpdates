"use strict";
const fs = require("fs");
const rp = require("request-promise");
//const Twitter = require("twitter");
const Twitter = require("./helpers/twitter")
const Spotify = require("./helpers/spotify")
const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });


/*const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("/tmp/db.json");
const db = low(adapter);*/

let properties = fs.readFileSync("properties.json");
properties = JSON.parse(properties);

module.exports.update = async event => {
  const authOptions = properties.authRequest;
  let apiOptions = properties.apiRequest;
  const awsOptions = properties.AWS;

  function checkDatabase(song) {
    let songRead = {
      TableName: awsOptions.dynamoDBTable,
      Key: {
        id: { S: song.id }
      },
      ProjectionExpression: "id",
      ConsistentRead: true
    };
    ddb.getItem(songRead, function(err, data) {
      if (err) {
        console.log("Error", err);
      } else {
        if (data.Item != null) {
          return true;
        } else {
          //Item not in db
          console.log("Item not in database");
          writeToDatabase(song);
          Twitter.tweetSong(song);
          //return false
        }
      }
    });
  }
  function writeToDatabase(song) {
    song = {
      TableName: awsOptions.dynamoDBTable,
      Item: {
        id: { S: song.id.toString() },
        name: { S: song.name },
        artist: { S: song.artist }
      }
    };
    ddb.putItem(song, function(err, data) {
      if (err) {
        console.log("Error", err);
      } else {
        console.log(song)
        console.log("Success", song.Item.id, song.Item.name, song.Item.artist);
      }
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
      checkDatabase(song);
    });
  };
  /*async function makeRequest(options) {
    try {
      let response = await rp(options);
      response = JSON.parse(response);
      return response;
    } catch (err) {
      console.log("Request failed", err);
    }
  }*/
  const access_token = await Spotify.makeRequest(authOptions);
  apiOptions.headers.Authorization = "Bearer " + access_token.access_token;
  let apiResponse = await Spotify.makeRequest(apiOptions);
  const requests = Math.floor(apiResponse.total / 100);
  processResponse(apiResponse);
  for (let i = 0; i < requests; i++) {
    const offset = (i + 1) * 100;
    apiOptions.url = apiOptions.url + "?offset=" + offset;
    apiResponse = await Spotify.makeRequest(apiOptions);
    processResponse(apiResponse);
  }
};
