const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM supplier ORDER BY NamaSupplier');
  res.render('pages/supplier', { title: 'Supplier', rows });
});
router.post('/', async (req, res) => {
  const { NamaSupplier, Alamat, Kontak, JenisPasokan } = req.body;
  try {
    const [last] = await db.query("SELECT SupplierID FROM supplier ORDER BY SupplierID DESC LIMIT 1");
    const n = last.length ? parseInt(last[0].SupplierID.split('-')[1]) + 1 : 1;
    await db.query('INSERT INTO supplier VALUES (?,?,?,?,?,NOW())', ['SUP-'+String(n).padStart(3,'0'), NamaSupplier, Alamat, Kontak, JenisPasokan]);
    req.flash('success', 'Supplier berhasil ditambahkan');
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/supplier');
});

module.exports = router;
