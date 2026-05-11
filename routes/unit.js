const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const { status, jenis, q } = req.query;
  let where = 'WHERE 1=1'; const p = [];
  if (status) { where += ' AND u.StatusUnit=?'; p.push(status); }
  if (jenis)  { where += ' AND u.JenisMesin=?'; p.push(jenis); }
  if (q)      { where += ' AND (u.Merk LIKE ? OR u.Tipe LIKE ? OR u.UnitID LIKE ?)'; p.push(`%${q}%`,`%${q}%`,`%${q}%`); }
  const [rows] = await db.query(`SELECT u.*,s.NamaSupplier FROM unit u LEFT JOIN supplier s ON u.SupplierID=s.SupplierID ${where} ORDER BY u.CreatedAt DESC`, p);
  res.render('pages/unit', { title: 'Etalase Digital', rows, status, jenis, q });
});

router.get('/:id', async (req, res) => {
  const [[u]] = await db.query(`SELECT u.*,s.NamaSupplier FROM unit u LEFT JOIN supplier s ON u.SupplierID=s.SupplierID WHERE u.UnitID=?`, [req.params.id]);
  if (!u) { req.flash('error','Unit tidak ditemukan'); return res.redirect('/unit'); }
  const [lb] = await db.query('SELECT * FROM logbook WHERE UnitID=? ORDER BY CreatedAt DESC', [req.params.id]);
  const [inv] = await db.query(`SELECT i.*,p.NamaPelanggan FROM invoice i JOIN pelanggan p ON i.PelangganID=p.PelangganID WHERE i.UnitID=?`, [req.params.id]);
  res.render('pages/unit-detail', { title: u.UnitID, u, lb, inv: inv[0]||null });
});

module.exports = router;
