const mysql = require('mysql2/promise');
const db = mysql.createPool({
  host: 'mysql-3b4e9779-pepsicola45510-b240.i.aivencloud.com',
  port: 13457,
  user: 'avnadmin',
  password: 'AVNS_ereEieUbu7iwEFelNpj',
  database: 'defaultdb',
  waitForConnections: true,
  connectionLimit: 10,
  ssl: { rejectUnauthorized: false }
});
module.exports = db;