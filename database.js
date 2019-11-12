const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
 
const adapter = new FileSync('db.json')
const db = low(adapter)
 
// Set some defaults
db.defaults({ songs: [], user: {} })
  .write()

  // Set a user using Lodash shorthand syntax
db.set('user.name', 'admin')
.write()
