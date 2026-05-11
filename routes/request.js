const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const [rows] = await db.query(`SELECT r.*,p.NamaPelanggan FROM request_unit r JOIN pelanggan p ON r.PelangganID=p.PelangganID ORDER BY r.TanggalRequest DESC`);
  const [pelanggan] = await db.query('SELECT * FROM pelanggan ORDER BY NamaPelanggan');
  res.render('pages/request', { title: 'Request Unit', rows, pelanggan });
});

// UC-03: tambah request
router.post('/', async (req, res) => {
  const { PelangganID, JenisMesin, SpesifikasiTeknis, MerkPreferensi, KondisiMinimum, HargaBudget, CatatanTambahan } = req.body;
  try {
    const [last] = await db.query("SELECT RequestUnitID FROM request_unit ORDER BY RequestUnitID DESC LIMIT 1");
    const n = last.length ? parseInt(last[0].RequestUnitID.split('-')[1]) + 1 : 1;
    const id = 'REQ-'+String(n).padStart(3,'0');
    await db.query('INSERT INTO request_unit (RequestUnitID,PelangganID,JenisMesin,SpesifikasiTeknis,MerkPreferensi,KondisiMinimum,HargaBudget,CatatanTambahan,StafID) VALUES (?,?,?,?,?,?,?,?,?)',
      [id, PelangganID, JenisMesin, SpesifikasiTeknis||null, MerkPreferensi||null, KondisiMinimum||null, HargaBudget, CatatanTambahan||null, req.session.user.StafID]);
    req.flash('success', `Request ${id} berhasil dibuat`);
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/request');
});

// UC-03: catat DP jaminan
router.post('/:id/dp', async (req, res) => {
  const { NominalDP, NomorReferensi, TanggalBayar } = req.body;
  try {
    const [last] = await db.query("SELECT DPJaminanID FROM dp_jaminan ORDER BY DPJaminanID DESC LIMIT 1");
    const n = last.length ? parseInt(last[0].DPJaminanID.split('-')[1]) + 1 : 1;
    await db.query('INSERT INTO dp_jaminan VALUES (?,?,?,?,?,NOW())', ['DPJ-'+String(n).padStart(3,'0'), req.params.id, NominalDP, NomorReferensi, TanggalBayar]);
    await db.query("UPDATE request_unit SET StatusRequest='DP Diterima' WHERE RequestUnitID=?", [req.params.id]);
    req.flash('success', 'DP Jaminan berhasil dicatat');
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/request');
});

// UC-07: tampilkan unit kandidat ke pelanggan & catat pilihan
router.get('/:id/pilih', async (req, res) => {
  const [[req_unit]] = await db.query(`SELECT r.*,p.NamaPelanggan FROM request_unit r JOIN pelanggan p ON r.PelangganID=p.PelangganID WHERE r.RequestUnitID=?`, [req.params.id]);
  if (!req_unit) { req.flash('error','Request tidak ditemukan'); return res.redirect('/request'); }
  const [kandidat] = await db.query(`SELECT u.*,li.KesimpulanKelayakan,li.EstimasiJamKerja,li.EstimasiSukuCadang FROM unit u LEFT JOIN laporan_inspeksi li ON u.UnitID=li.UnitID WHERE u.RequestUnitID=? AND u.StatusUnit='Selesai Inspeksi'`, [req.params.id]);
  res.render('pages/request-pilih', { title: 'Pilih Unit Kandidat', req_unit, kandidat });
});

router.post('/:id/pilih', async (req, res) => {
  const { UnitID } = req.body;
  try {
    await db.query("UPDATE unit SET StatusUnit='Dipilih Pelanggan' WHERE UnitID=?", [UnitID]);
    await db.query("UPDATE request_unit SET StatusRequest='Estimasi Terkirim' WHERE RequestUnitID=?", [req.params.id]);
    req.flash('success', 'Pilihan unit berhasil dicatat. Admin Finance dapat menerbitkan Nota Estimasi.');
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/request');
});

// UC-09: catat opsi pembayaran
router.post('/:id/opsi', async (req, res) => {
  const { OpsiPembayaran, NilaiDisepakati } = req.body;
  try {
    await db.query("UPDATE request_unit SET OpsiPembayaran=?, NilaiDisepakati=?, StatusRequest='Disetujui' WHERE RequestUnitID=?",
      [OpsiPembayaran, NilaiDisepakati||null, req.params.id]);
    req.flash('success', 'Opsi pembayaran berhasil dicatat');
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/request');
});

module.exports = router;
