const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const [garansi] = await db.query(`SELECT g.*,p.NamaPelanggan,u.Merk,u.Tipe,u.JenisMesin FROM garansi g JOIN pelanggan p ON g.PelangganID=p.PelangganID JOIN unit u ON g.UnitID=u.UnitID ORDER BY g.TanggalAktif DESC`);
  const [klaim]   = await db.query(`SELECT k.*,p.NamaPelanggan,u.Merk,u.Tipe FROM klaim_garansi k JOIN pelanggan p ON k.PelangganID=p.PelangganID JOIN unit u ON k.UnitID=u.UnitID ORDER BY k.CreatedAt DESC`);
  res.render('pages/garansi', { title: 'Garansi & Klaim', garansi, klaim });
});

// UC-17: catat klaim
router.post('/klaim', async (req, res) => {
  const { GaransiID, UnitID, PelangganID, DeskripsiMasalah, TanggalKlaim } = req.body;
  try {
    // cek garansi masih aktif
    const [[g]] = await db.query('SELECT * FROM garansi WHERE GaransiID=?', [GaransiID]);
    if (!g || g.StatusGaransi !== 'Aktif') { req.flash('error','Garansi tidak aktif atau sudah berakhir'); return res.redirect('/garansi'); }
    const [last] = await db.query("SELECT KlaimID FROM klaim_garansi ORDER BY KlaimID DESC LIMIT 1");
    const n = last.length ? parseInt(last[0].KlaimID.split('-')[1]) + 1 : 1;
    await db.query('INSERT INTO klaim_garansi VALUES (?,?,?,?,?,?,?,NOW())',
      ['KLM-'+String(n).padStart(3,'0'), GaransiID, UnitID, PelangganID, DeskripsiMasalah, 'Dalam Proses', TanggalKlaim]);
    req.flash('success', 'Klaim garansi berhasil dicatat, status: Dalam Proses');
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/garansi');
});

router.post('/klaim/:id/update', async (req, res) => {
  try {
    await db.query('UPDATE klaim_garansi SET StatusKlaim=? WHERE KlaimID=?', [req.body.StatusKlaim, req.params.id]);
    req.flash('success', 'Status klaim diperbarui');
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/garansi');
});

module.exports = router;
