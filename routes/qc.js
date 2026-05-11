const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const [rows] = await db.query(`SELECT q.*,u.Merk,u.Tipe,u.JenisMesin,s.NamaStaf FROM laporan_qc q JOIN unit u ON q.UnitID=u.UnitID JOIN staf s ON q.StafID=s.StafID ORDER BY q.CreatedAt DESC`);
  const [unitAntri] = await db.query("SELECT u.*,lb.LogBookID,lb.StafID as StafRekondisi FROM unit u JOIN logbook lb ON u.UnitID=lb.UnitID WHERE u.StatusUnit='Menunggu QC' AND lb.StatusLogBook='Selesai'");
  res.render('pages/qc', { title: 'Quality Control', rows, unitAntri });
});

router.get('/form/:lbId', async (req, res) => {
  const [[lb]] = await db.query(`SELECT lb.*,u.JenisMesin,u.Merk,u.Tipe FROM logbook lb JOIN unit u ON lb.UnitID=u.UnitID WHERE lb.LogBookID=?`, [req.params.lbId]);
  if (!lb) { req.flash('error','LogBook tidak ditemukan'); return res.redirect('/qc'); }
  // checklist per jenis mesin
  const checklist = {
    'Pompa':['Tidak ada kebocoran seal','Impeller dalam kondisi baik','Bearing tidak berbunyi','Shaft tidak bengkok','Tekanan output sesuai spesifikasi','Tidak ada vibrasi berlebih'],
    'Boiler':['Tidak ada kebocoran pipa','Pressure gauge berfungsi normal','Safety valve berfungsi','Burner menyala normal','Isolasi termal baik','Tidak ada korosi parah'],
    'Dinamo':['Isolasi winding dalam batas normal','Bearing tidak panas','Shaft tidak oleng','Terminal box bersih dan kencang','Arus start normal','Tidak ada bau hangus'],
    'Control Panel':['Semua breaker berfungsi','Wiring rapi dan berlabel','Indikator lampu normal','Terminal kencang','Tidak ada panas berlebih','Ground terpasang baik'],
    'Valve':['Tidak ada kebocoran saat tertutup','Handle/aktuator berfungsi','Seat valve tidak aus parah','Packing gland tidak bocor','Flange bolt kencang']
  };
  const items = checklist[lb.JenisMesin] || ['Fungsi utama normal','Tidak ada kebocoran','Komponen lengkap'];
  res.render('pages/qc-form', { title: 'Form QC', lb, items });
});

router.post('/', async (req, res) => {
  const { LogBookID, UnitID, PersentaseKondisi, KesimpulanQC, CatatanQC } = req.body;
  try {
    // validasi anti-bias: QC tidak boleh dilakukan oleh teknisi yang sama
    const [[lb]] = await db.query('SELECT StafID FROM logbook WHERE LogBookID=?', [LogBookID]);
    if (lb.StafID === req.session.user.StafID) {
      req.flash('error', '⚠ DITOLAK: Anda tidak dapat melakukan QC pada unit yang Anda kerjakan sendiri (anti-bias)');
      return res.redirect('/qc');
    }
    const [last] = await db.query("SELECT QCID FROM laporan_qc ORDER BY QCID DESC LIMIT 1");
    const n = last.length ? parseInt(last[0].QCID.split('-')[1]) + 1 : 1;
    const id = 'QCC-'+String(n).padStart(3,'0');
    // kumpulkan checklist dari form
    const checklist = {};
    Object.keys(req.body).filter(k=>k.startsWith('chk_')).forEach(k => { checklist[k.replace('chk_','')] = req.body[k]; });
    await db.query('INSERT INTO laporan_qc VALUES (?,?,?,?,?,?,?,?,?,NOW())',
      [id, LogBookID, UnitID, req.session.user.StafID, PersentaseKondisi, JSON.stringify(checklist), KesimpulanQC, CatatanQC||null, new Date().toISOString().slice(0,10)]);
    if (KesimpulanQC === 'Lulus') {
      await db.query("UPDATE unit SET StatusUnit='Menunggu Validasi Finance', KondisiAkhir=? WHERE UnitID=?", [PersentaseKondisi+'%', UnitID]);
      req.flash('success', 'QC Lulus — unit menunggu validasi Finance');
    } else {
      await db.query("UPDATE unit SET StatusUnit='Dalam Rekondisi' WHERE UnitID=?", [UnitID]);
      await db.query("UPDATE logbook SET StatusLogBook='Aktif' WHERE LogBookID=?", [LogBookID]);
      req.flash('success', 'QC Gagal — unit dikembalikan ke proses rekondisi');
    }
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/qc');
});

module.exports = router;
