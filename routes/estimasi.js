const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const [rows] = await db.query(`SELECT ne.*,u.Merk,u.Tipe,u.JenisMesin,s.NamaStaf FROM nota_estimasi ne JOIN unit u ON ne.UnitID=u.UnitID JOIN staf s ON ne.StafID=s.StafID ORDER BY ne.TanggalTerbit DESC`);
  const [unitSiap] = await db.query("SELECT u.*,li.EstimasiJamKerja,li.EstimasiSukuCadang FROM unit u LEFT JOIN laporan_inspeksi li ON u.UnitID=li.UnitID WHERE u.StatusUnit IN ('Dipilih Pelanggan','Selesai Inspeksi')");
  res.render('pages/estimasi', { title: 'Nota Estimasi', rows, unitSiap });
});

router.get('/form/:unitId', async (req, res) => {
  const [[u]] = await db.query(`SELECT u.*,li.EstimasiJamKerja,li.EstimasiSukuCadang,li.CatatanKerusakan FROM unit u LEFT JOIN laporan_inspeksi li ON u.UnitID=li.UnitID WHERE u.UnitID=?`, [req.params.unitId]);
  if (!u) { req.flash('error','Unit tidak ditemukan'); return res.redirect('/estimasi'); }
  // Ambil DP Jaminan jika ada RequestUnitID
  let nominalDP = 0;
  if (u.RequestUnitID) {
    const [[dp]] = await db.query('SELECT COALESCE(SUM(NominalDP),0) total FROM dp_jaminan WHERE RequestUnitID=?', [u.RequestUnitID]);
    nominalDP = dp.total || 0;
  }
  const estHPP = (u.HargaTawarSupplier||0) + ((u.EstimasiJamKerja||0)*150000) + (u.EstimasiSukuCadang||0);
  const rekomendasiHJ = Math.round(estHPP * 1.50 / 100000) * 100000;
  res.render('pages/estimasi-form', { title: 'Form Nota Estimasi', u, estHPP, rekomendasiHJ, nominalDP });
});

router.post('/', async (req, res) => {
  const { UnitID, RequestUnitID, BiayaPengadaan, BiayaJasaRekondisi, BiayaSukuCadang, HargaJualDisepakati } = req.body;
  try {
    const [last] = await db.query("SELECT NotaEstID FROM nota_estimasi ORDER BY NotaEstID DESC LIMIT 1");
    const n = last.length ? parseInt(last[0].NotaEstID.split('-')[1]) + 1 : 1;
    const id = 'NET-'+String(n).padStart(3,'0');
    const nomor = `NET/${new Date().getFullYear()}/${String(n).padStart(3,'0')}`;
    const total = parseInt(BiayaPengadaan)+parseInt(BiayaJasaRekondisi)+parseInt(BiayaSukuCadang);
    const rekHJ = Math.round(total * 1.50 / 100000) * 100000;
    await db.query('INSERT INTO nota_estimasi VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW())',
      [id, UnitID, RequestUnitID||null, req.session.user.StafID, nomor, BiayaPengadaan, BiayaJasaRekondisi, BiayaSukuCadang, total, rekHJ, HargaJualDisepakati||rekHJ, 'Terbit']);
    await db.query('UPDATE unit SET HargaJual=? WHERE UnitID=?', [HargaJualDisepakati||rekHJ, UnitID]);
    req.flash('success', `Nota Estimasi ${nomor} berhasil diterbitkan`);
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/estimasi');
});

module.exports = router;
