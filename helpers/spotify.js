const rp = require("request-promise");

async function makeRequest(options) {
  try {
    let response = await rp(options);
    response = JSON.parse(response);
    return response;
  } catch (err) {
    console.log("Request failed", err);
  }
}

module.exports = {
  makeRequest
};
