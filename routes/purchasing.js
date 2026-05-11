const express = require('express');
const router = express.Router();
const db = require('../db');

// UC-05: daftar unit kandidat
router.get('/', async (req, res) => {
  const [rows] = await db.query(`SELECT u.*,s.NamaSupplier,r.RequestUnitID as ReqID FROM unit u LEFT JOIN supplier s ON u.SupplierID=s.SupplierID LEFT JOIN request_unit r ON u.RequestUnitID=r.RequestUnitID ORDER BY u.CreatedAt DESC`);
  const [suppliers] = await db.query('SELECT * FROM supplier ORDER BY NamaSupplier');
  const [requests]  = await db.query("SELECT r.*,p.NamaPelanggan FROM request_unit r JOIN pelanggan p ON r.PelangganID=p.PelangganID WHERE r.StatusRequest IN ('DP Diterima','Dalam Pencarian') ORDER BY r.TanggalRequest DESC");
  res.render('pages/purchasing', { title: 'Unit Kandidat', rows, suppliers, requests });
});

// UC-05: input unit kandidat
router.post('/', async (req, res) => {
  const { RequestUnitID, SupplierID, JenisMesin, Merk, Tipe, Tahun, LokasiUnit, HargaTawarSupplier } = req.body;
  try {
    const [last] = await db.query("SELECT UnitID FROM unit ORDER BY UnitID DESC LIMIT 1");
    const n = last.length ? parseInt(last[0].UnitID.split('-')[1]) + 1 : 1;
    const id = 'UNT-'+String(n).padStart(3,'0');
    if (!SupplierID) { req.flash('error', 'Supplier harus dipilih'); return res.redirect('/purchasing'); }
    await db.query('INSERT INTO unit (UnitID,RequestUnitID,SupplierID,JenisMesin,Merk,Tipe,Tahun,LokasiUnit,HargaTawarSupplier,KondisiAwal,StatusUnit) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [id, RequestUnitID||null, SupplierID, JenisMesin, Merk, Tipe, Tahun||null, LokasiUnit||null, HargaTawarSupplier, req.body.KondisiAwal||null, 'Menunggu Inspeksi']);
    if (RequestUnitID) await db.query("UPDATE request_unit SET StatusRequest='Dalam Pencarian' WHERE RequestUnitID=?", [RequestUnitID]);
    req.flash('success', `Unit ${id} berhasil diinput, menunggu inspeksi Teknisi`);
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/purchasing');
});

// konfirmasi pembelian & masuk gudang
router.post('/:id/beli', async (req, res) => {
  const { HargaBeli, TanggalMasukGudang } = req.body;
  try {
    await db.query("UPDATE unit SET HargaBeli=?, TanggalMasukGudang=?, StatusUnit='Masuk Gudang' WHERE UnitID=?", [HargaBeli, TanggalMasukGudang, req.params.id]);
    req.flash('success', 'Unit berhasil dibeli dan masuk gudang');
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/purchasing');
});

module.exports = router;
