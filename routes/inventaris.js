// routes/inventaris.js - UC-18
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM suku_cadang ORDER BY Kategori, NamaItem');
  const [opname] = await db.query(`SELECT so.*,sc.NamaItem,s.NamaStaf FROM stock_opname so JOIN suku_cadang sc ON so.PartID=sc.PartID JOIN staf s ON so.StafID=s.StafID ORDER BY so.TanggalOpname DESC LIMIT 10`);
  res.render('pages/inventaris', { title: 'Inventaris', rows, opname });
});

router.post('/', async (req, res) => {
  const { KodeItem, NamaItem, Kategori, Satuan, LokasiRak, HargaBeli, StokTersedia, BatasMinimum } = req.body;
  try {
    const [last] = await db.query("SELECT PartID FROM suku_cadang ORDER BY PartID DESC LIMIT 1");
    const n = last.length ? parseInt(last[0].PartID.split('-')[1]) + 1 : 1;
    await db.query('INSERT INTO suku_cadang VALUES (?,?,?,?,?,?,?,?,?,NOW())',
      ['PRT-'+String(n).padStart(3,'0'), KodeItem, NamaItem, Kategori, Satuan, LokasiRak||null, HargaBeli, StokTersedia||0, BatasMinimum||5]);
    req.flash('success', 'Item berhasil ditambahkan');
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/inventaris');
});

router.post('/:id/stok', async (req, res) => {
  try {
    await db.query('UPDATE suku_cadang SET StokTersedia=? WHERE PartID=?', [req.body.StokBaru, req.params.id]);
    req.flash('success', 'Stok berhasil diperbarui');
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/inventaris');
});

// stock opname
router.post('/opname', async (req, res) => {
  const { PartID, StokFisik, Keterangan, TanggalOpname } = req.body;
  try {
    const [[sc]] = await db.query('SELECT StokTersedia FROM suku_cadang WHERE PartID=?', [PartID]);
    const selisih = parseInt(StokFisik) - sc.StokTersedia;
    const [last] = await db.query("SELECT OpnameID FROM stock_opname ORDER BY OpnameID DESC LIMIT 1");
    const n = last.length ? parseInt(last[0].OpnameID.split('-')[1]) + 1 : 1;
    await db.query('INSERT INTO stock_opname VALUES (?,?,?,?,?,?,?,?,NOW())',
      ['OPN-'+String(n).padStart(3,'0'), PartID, sc.StokTersedia, StokFisik, selisih, Keterangan||null, req.session.user.StafID, TanggalOpname]);
    await db.query('UPDATE suku_cadang SET StokTersedia=? WHERE PartID=?', [StokFisik, PartID]);
    req.flash('success', `Stock opname dicatat, selisih: ${selisih}`);
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/inventaris');
});

module.exports = router;
