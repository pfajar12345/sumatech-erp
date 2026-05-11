const fs = require('fs');
const mysql = require('mysql2/promise');

async function importDB() {
  const db = await mysql.createConnection({
    host: 'mysql-3b4e9779-pepsicola45510-b240.i.aivencloud.com',
    port: 13457,
    user: 'avnadmin',
    password: 'AVNS_ereEieUbu7iwEFelNpj',
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false },
    multipleStatements: true
  });

  const sql = fs.readFileSync('database.sql', 'utf8');
  console.log('Mengimport database...');
  await db.query(sql);
  console.log('Import berhasil!');
  await db.end();
}

importDB().catch(console.error);