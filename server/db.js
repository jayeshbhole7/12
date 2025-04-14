const { Pool } = require("pg");
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    port: 5432,
    database: process.env.DB_NAME
});

pool.connect().then(() => {
    console.log('connected to database.');
}).catch((err) => {
    console.error('error connecting to database:', err);
});

module.exports = { pool };