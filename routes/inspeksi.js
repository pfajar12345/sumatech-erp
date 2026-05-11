const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const [rows] = await db.query(`SELECT li.*,u.Merk,u.Tipe,u.JenisMesin,s.NamaStaf FROM laporan_inspeksi li JOIN unit u ON li.UnitID=u.UnitID JOIN staf s ON li.StafID=s.StafID ORDER BY li.TanggalTerbit DESC`);
  const [unitAntri] = await db.query("SELECT u.*,s.NamaSupplier FROM unit u LEFT JOIN supplier s ON u.SupplierID=s.SupplierID WHERE u.StatusUnit='Menunggu Inspeksi'");
  res.render('pages/inspeksi', { title: 'Laporan Inspeksi', rows, unitAntri });
});

router.get('/form/:unitId', async (req, res) => {
  const [[u]] = await db.query('SELECT u.*,s.NamaSupplier FROM unit u LEFT JOIN supplier s ON u.SupplierID=s.SupplierID WHERE u.UnitID=?', [req.params.unitId]);
  if (!u) { req.flash('error','Unit tidak ditemukan'); return res.redirect('/inspeksi'); }
  res.render('pages/inspeksi-form', { title: 'Form Inspeksi', u });
});

router.post('/', async (req, res) => {
  const { UnitID, TanggalInspeksi, LokasiInspeksi, CatatanKerusakan, EstimasiJamKerja, EstimasiSukuCadang, KesimpulanKelayakan } = req.body;
  try {
    const [last] = await db.query("SELECT LaporanID FROM laporan_inspeksi ORDER BY LaporanID DESC LIMIT 1");
    const n = last.length ? parseInt(last[0].LaporanID.split('-')[1]) + 1 : 1;
    const id = 'INS-'+String(n).padStart(3,'0');
    const nomor = `INS/${new Date().getFullYear()}/${String(n).padStart(3,'0')}`;
    await db.query('INSERT INTO laporan_inspeksi VALUES (?,?,?,?,?,?,?,?,?,?,NOW())',
      [id, UnitID, req.session.user.StafID, nomor, TanggalInspeksi, LokasiInspeksi, CatatanKerusakan, EstimasiJamKerja||0, EstimasiSukuCadang||0, KesimpulanKelayakan]);
    const newStatus = KesimpulanKelayakan === 'Layak' ? 'Selesai Inspeksi' : 'Ditolak';
    await db.query('UPDATE unit SET StatusUnit=?, KondisiAwal=? WHERE UnitID=?', [newStatus, req.body.KondisiAwal||null, UnitID]);
    req.flash('success', `Laporan ${nomor} diterbitkan — unit ${newStatus}`);
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/inspeksi');
});

module.exports = router;
