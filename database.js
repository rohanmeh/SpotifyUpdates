const AWS = require('aws-sdk')

AWS.config.update({region: 'us-east-1'});

// Create the DynamoDB service object
const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

const params = {
  TableName: 'ss1-spotify-songs',
  Item: {
    'id': {S: "456"},
    'name': {S: "Test"},
    'artist': {S: 'Test Test'}
  }
};

// Call DynamoDB to add the item to the table
ddb.putItem(params, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", data);
  }
});

const paramsGet = {
  TableName: "ss1-spotify-songs",
  Key: {
    "id": {S: "123"}
  },
  ProjectionExpression: "id"
}

ddb.getItem(paramsGet, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
      if (data.Item) {
        console.log("Success", data.Item);
      }
      else {
        //Item not in db
        console.log("Item not in database")
      }
  }
});
