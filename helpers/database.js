const AWS = require('aws-sdk');
const Twitter = require('./twitter');

AWS.config.update({ region: 'us-east-1' });
const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
const awsOptions = process.env.aws_dynamoDBTable;
function writeToDatabase(song) {
  song = {
    TableName: awsOptions,
    Item: {
      id: { S: song.id.toString() },
      name: { S: song.name },
      artist: { S: song.artist },
    },
  };
  ddb.putItem(song, (err, data) => {
    if (err) {
      console.log('Error', err);
    } else {
      console.log('Success', song.Item.id, song.Item.name, song.Item.artist);
    }
  });
}

function checkDatabase(song) {
  const songRead = {
    TableName: awsOptions,
    Key: {
      id: { S: song.id },
    },
    ProjectionExpression: 'id',
    ConsistentRead: true,
  };
  ddb.getItem(songRead, (err, data) => {
    if (err) {
      console.log('Error', err);
    } else {
      if (data.Item != null) {
        return true;
      }
      // Item not in db
      console.log('Item not in database');
      writeToDatabase(song);
      Twitter.tweetSong(song);
      // return false
    }
  });
}
module.exports = {
  checkDatabase,
  writeToDatabase,
};
