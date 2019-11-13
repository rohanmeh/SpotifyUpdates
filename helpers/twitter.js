const Twitter = require("twitter")

const client = new Twitter({
    consumer_key: process.env.twitter_consumer_key,
    consumer_secret: process.env.twitter_consumer_secret,
    access_token_key: process.env.twitter_access_token,
    access_token_secret: process.env.twitter_access_token_secret
});

function tweetSong(song) {
    const statusUpdate =
      song.artist +
      " - " +
      song.name +
      " " +
      "https://open.spotify.com/track/" +
      song.id;
    client.post('statuses/update', {status: statusUpdate})
    .then(function (tweet) {
        console.log(tweet);
    })
    .catch(function (error) {
        throw error;
    })
}

module.exports = {
    tweetSong
}