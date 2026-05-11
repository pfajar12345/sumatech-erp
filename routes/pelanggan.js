// routes/pelanggan.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM pelanggan ORDER BY NamaPelanggan');
  res.render('pages/pelanggan', { title: 'Pelanggan', rows });
});
router.post('/', async (req, res) => {
  const { NamaPelanggan, Alamat, NoTelp, Email } = req.body;
  try {
    const [last] = await db.query("SELECT PelangganID FROM pelanggan ORDER BY PelangganID DESC LIMIT 1");
    const n = last.length ? parseInt(last[0].PelangganID.split('-')[1]) + 1 : 1;
    await db.query('INSERT INTO pelanggan VALUES (?,?,?,?,?,NOW())', ['PLG-'+String(n).padStart(3,'0'), NamaPelanggan, Alamat, NoTelp, Email||null]);
    req.flash('success', 'Pelanggan berhasil ditambahkan');
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/pelanggan');
});

module.exports = router;
