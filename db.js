const config = require('./config.json');

const Pool = require('pg').Pool;
const pool = new Pool({
    user: config.database.user,
    password: config.database.password,
    host: config.database.host,
    port: config.database.port,
    database: config.database.database
});

module.exports = pool;
