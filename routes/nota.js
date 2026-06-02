const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const [rows] = await db.query(`SELECT na.*,u.Merk,u.Tipe,u.JenisMesin,s.NamaStaf FROM nota_rekondisi_aktual na JOIN unit u ON na.UnitID=u.UnitID JOIN staf s ON na.StafID=s.StafID ORDER BY na.TanggalTerbit DESC`);
  const [unitSiap] = await db.query(`SELECT u.*,lb.LogBookID,lb.TotalBiayaTK,lb.TotalBiayaSC FROM unit u JOIN logbook lb ON u.UnitID=lb.UnitID WHERE u.StatusUnit='Menunggu Validasi Finance' AND lb.StatusLogBook='Selesai'`);
  res.render('pages/nota', { title: 'Nota Rekondisi Aktual', rows, unitSiap });
});

router.get('/form/:lbId', async (req, res) => {
  const [[lb]] = await db.query(`SELECT lb.*,u.JenisMesin,u.Merk,u.Tipe,u.HargaBeli,u.UnitID FROM logbook lb JOIN unit u ON lb.UnitID=u.UnitID WHERE lb.LogBookID=?`, [req.params.lbId]);
  if (!lb) { req.flash('error','LogBook tidak ditemukan'); return res.redirect('/nota'); }
  const [[req_unit]] = await db.query(`SELECT r.OpsiPembayaran,r.NilaiDisepakati,r.RequestUnitID FROM unit u LEFT JOIN request_unit r ON u.RequestUnitID=r.RequestUnitID WHERE u.UnitID=?`, [lb.UnitID]);
  let nominalDP = 0;
  if (req_unit && req_unit.RequestUnitID) {
    const [[dp]] = await db.query('SELECT COALESCE(SUM(NominalDP),0) total FROM dp_jaminan WHERE RequestUnitID=?', [req_unit.RequestUnitID]);
    nominalDP = dp.total || 0;
  }
  res.render('pages/nota-form', { title: 'Form Nota Aktual', lb, req_unit: req_unit||null, nominalDP });
});

router.post('/', async (req, res) => {
  const { UnitID, LogBookID, BiayaPengadaanAktual, BiayaRekondisiAktual, BiayaSCaktual, HargaJualFinal, NominalDP } = req.body;
  try {
    const [last] = await db.query("SELECT NotaAktualID FROM nota_rekondisi_aktual ORDER BY NotaAktualID DESC LIMIT 1");
    const n = last.length ? parseInt(last[0].NotaAktualID.split('-')[1]) + 1 : 1;
    const id = 'NAK-'+String(n).padStart(3,'0');
    const nomor = `NAK/${new Date().getFullYear()}/${String(n).padStart(3,'0')}`;
    const totalHPP = parseInt(BiayaPengadaanAktual)+parseInt(BiayaRekondisiAktual)+parseInt(BiayaSCaktual);
    const dp = parseInt(NominalDP)||0;
    const tagihanFinal = Math.max(0, parseInt(HargaJualFinal||0) - dp);
    await db.query('INSERT INTO nota_rekondisi_aktual VALUES (?,?,?,?,?,?,?,?,?,?,NOW())',
      [id, UnitID, LogBookID, req.session.user.StafID, nomor, BiayaPengadaanAktual, BiayaRekondisiAktual, BiayaSCaktual, totalHPP, tagihanFinal]);
    await db.query("UPDATE unit SET StatusUnit='Ready', HPP=?, HargaJual=? WHERE UnitID=?", [totalHPP, tagihanFinal, UnitID]);
    req.flash('success', `Nota ${nomor} diterbitkan — HPP dikunci${dp>0?', DP Rp '+dp.toLocaleString('id-ID')+' sudah dipotong':''}`);
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/nota');
});

module.exports = router;