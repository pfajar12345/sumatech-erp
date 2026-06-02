const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const [rows] = await db.query(`SELECT lb.*,u.JenisMesin,u.Merk,u.Tipe,u.StatusUnit,s.NamaStaf FROM logbook lb JOIN unit u ON lb.UnitID=u.UnitID JOIN staf s ON lb.StafID=s.StafID ORDER BY lb.CreatedAt DESC`);
  const [unitSiap] = await db.query("SELECT * FROM unit WHERE StatusUnit='Masuk Gudang'");
  res.render('pages/rekondisi', { title: 'Rekondisi', rows, unitSiap });
});

// UC-10: buat logbook
router.post('/', async (req, res) => {
  const { UnitID, TanggalMulai } = req.body;
  try {
    const [last] = await db.query("SELECT LogBookID FROM logbook ORDER BY LogBookID DESC LIMIT 1");
    const n = last.length ? parseInt(last[0].LogBookID.split('-')[1]) + 1 : 1;
    const id = 'LGB-'+String(n).padStart(3,'0');
    await db.query('INSERT INTO logbook (LogBookID,UnitID,StafID,TanggalMulai) VALUES (?,?,?,?)', [id, UnitID, req.session.user.StafID, TanggalMulai]);
    await db.query("UPDATE unit SET StatusUnit='Dalam Rekondisi' WHERE UnitID=?", [UnitID]);
    req.flash('success', `LogBook ${id} dibuat, Teknisi siap memulai rekondisi`);
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/rekondisi');
});

router.get('/:id', async (req, res) => {
  const [[lb]] = await db.query(`SELECT lb.*,u.JenisMesin,u.Merk,u.Tipe,u.HargaBeli FROM logbook lb JOIN unit u ON lb.UnitID=u.UnitID WHERE lb.LogBookID=?`, [req.params.id]);
  if (!lb) { req.flash('error','LogBook tidak ditemukan'); return res.redirect('/rekondisi'); }
  const [details]  = await db.query('SELECT dp.*,s.NamaStaf FROM detail_perbaikan dp JOIN staf s ON dp.StafID=s.StafID WHERE dp.LogBookID=? ORDER BY dp.DetailID', [req.params.id]);
  const [pemakaian]= await db.query(`SELECT ps.*,sc.NamaItem,sc.Satuan FROM pemakaian_suku_cadang ps JOIN suku_cadang sc ON ps.PartID=sc.PartID WHERE ps.LogBookID=?`, [req.params.id]);
  const [sc]       = await db.query('SELECT * FROM suku_cadang WHERE StokTersedia>0 ORDER BY NamaItem');
  const [teknisi]  = await db.query("SELECT * FROM staf WHERE RoleID='teknisi'");
  res.render('pages/rekondisi-detail', { title: `LogBook ${req.params.id}`, lb, details, pemakaian, sc, teknisi });
});

// UC-11: update tahapan
// UC-11: update tahapan
router.post('/:id/tahapan', async (req, res) => {
  const { TahapanPerbaikan, StatusTahapan, DeskripsiKerja, StafID, JamKerja } = req.body;
  try {
    const selesai = StatusTahapan === 'Selesai' ? 'NOW()' : 'NULL';
    const jam = parseFloat(JamKerja)||0;
    const biayaTK = jam * 150000;
    await db.query(`INSERT INTO detail_perbaikan (LogBookID,StafID,TahapanPerbaikan,StatusTahapan,DeskripsiKerja,TanggalSelesai) VALUES (?,?,?,?,?,${selesai})`,
      [req.params.id, StafID||req.session.user.StafID, TahapanPerbaikan, StatusTahapan, DeskripsiKerja]);
    if (jam > 0) {
      await db.query('UPDATE logbook SET TotalBiayaTK=COALESCE(TotalBiayaTK,0)+? WHERE LogBookID=?', [biayaTK, req.params.id]);
    }
    req.flash('success', `Tahapan berhasil dicatat${jam>0?' ('+jam+' jam = Rp '+biayaTK.toLocaleString('id-ID')+')':''}`);
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/rekondisi/'+req.params.id);
});

// UC-12: pemakaian suku cadang FIFO
router.post('/:id/pemakaian', async (req, res) => {
  const { PartID, JumlahDigunakan, TanggalPemakaian } = req.body;
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const [[part]] = await conn.query('SELECT * FROM suku_cadang WHERE PartID=?', [PartID]);
    if (!part || part.StokTersedia < parseInt(JumlahDigunakan)) throw new Error('Stok tidak mencukupi');
    const subtotal = part.HargaBeli * parseInt(JumlahDigunakan);
    await conn.query('INSERT INTO pemakaian_suku_cadang (LogBookID,PartID,JumlahDigunakan,HargaSatuan,Subtotal,TanggalPemakaian) VALUES (?,?,?,?,?,?)',
      [req.params.id, PartID, JumlahDigunakan, part.HargaBeli, subtotal, TanggalPemakaian]);
    await conn.query('UPDATE suku_cadang SET StokTersedia=StokTersedia-? WHERE PartID=?', [JumlahDigunakan, PartID]);
    await conn.query('UPDATE logbook SET TotalBiayaSC=TotalBiayaSC+? WHERE LogBookID=?', [subtotal, req.params.id]);
    await conn.commit();
    req.flash('success', 'Pemakaian suku cadang dicatat (FIFO)');
  } catch(e) {
    if (conn) await conn.rollback();
    req.flash('error', e.message);
  } finally { if (conn) conn.release(); }
  res.redirect('/rekondisi/'+req.params.id);
});

// selesai rekondisi
router.post('/:id/selesai', async (req, res) => {
  try {
    const [[lb]] = await db.query('SELECT * FROM logbook WHERE LogBookID=?', [req.params.id]);
    await db.query("UPDATE logbook SET StatusLogBook='Selesai',TanggalSelesai=NOW() WHERE LogBookID=?", [req.params.id]);
    await db.query("UPDATE unit SET StatusUnit='Menunggu QC' WHERE UnitID=?", [lb.UnitID]);
    req.flash('success', 'Rekondisi selesai — unit masuk antrian QC');
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/rekondisi');
});

module.exports = router;
