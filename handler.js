"use strict";
const fs = require("fs");
const rp = require("request-promise");
const Twitter = require("twitter");
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
  let twitterOptions = properties.twitter;
  const awsOptions = properties.AWS;
  const client = new Twitter({
    consumer_key: twitterOptions.consumer_key,
    consumer_secret: twitterOptions.consumer_secret,
    access_token_key: twitterOptions.access_token,
    access_token_secret: twitterOptions.access_token_secret
  });
  function tweetSong(song) {
    console.log(song.id);
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
          //console.log("Data", song.artist, song.name);
          //console.log("Success", data.Item);
          return true;
        } else {
          //Item not in db
          console.log("Item not in database");
          writeToDatabase(song);
          tweetSong(song);
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
    //song["ProjectionExpression"] = "id"
    ddb.putItem(song, function(err, data) {
      if (err) {
        console.log("Error", err);
      } else {
        console.log("Success", song.id, song.name, song.artist);
      }
    });
  }
  var processResponse = async function(response) {
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
