
if (process.env.DATABASE_URL) {
  console.log("Configuring postgres...");
  module.exports = {
    client: 'pg',
    connection: process.env.DATABASE_URL
  }
} else {
  console.log("Configuring sqlite...");
  module.exports = {
    client: 'sqlite3',
    connection: {
      filename: "./mydb.sqlite"
    }
  }
}
