const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const [rows] = await db.query(`SELECT i.*,p.NamaPelanggan,u.JenisMesin,u.Merk,u.Tipe FROM invoice i JOIN pelanggan p ON i.PelangganID=p.PelangganID JOIN unit u ON i.UnitID=u.UnitID ORDER BY i.TanggalInvoice DESC`);
  const [unitReady] = await db.query("SELECT * FROM unit WHERE StatusUnit='Ready' ORDER BY Merk");
  const [pelanggan] = await db.query('SELECT * FROM pelanggan ORDER BY NamaPelanggan');
  res.render('pages/invoice', { title: 'Invoice & Pembayaran', rows, unitReady, pelanggan });
});

// UC-15: buat invoice
router.post('/', async (req, res) => {
  const { PelangganID, UnitID, TotalHarga, BiayaPengiriman, BiayaInstalasi, DurasiGaransi, SyaratGaransi } = req.body;
  try {
    const [last] = await db.query("SELECT InvoiceID FROM invoice ORDER BY InvoiceID DESC LIMIT 1");
    const n = last.length ? parseInt(last[0].InvoiceID.split('-')[1]) + 1 : 1;
    const id = 'INV-'+String(n).padStart(3,'0');
    const now = new Date();
    const nomor = `INV/${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(n).padStart(3,'0')}`;
    await db.query('INSERT INTO invoice (InvoiceID,PelangganID,UnitID,NomorInvoice,TotalHarga,BiayaPengiriman,BiayaInstalasi,SyaratGaransi,DurasiGaransi) VALUES (?,?,?,?,?,?,?,?,?)',
      [id, PelangganID, UnitID, nomor, TotalHarga, BiayaPengiriman||0, BiayaInstalasi||0, SyaratGaransi||'Garansi 3 bulan suku cadang', DurasiGaransi||3]);
    await db.query("UPDATE unit SET StatusUnit='Reserved' WHERE UnitID=?", [UnitID]);
    req.flash('success', `Invoice ${nomor} berhasil diterbitkan`);
  } catch(e) { req.flash('error', e.message); }
  res.redirect('/invoice');
});

// UC-16: catat pembayaran
router.post('/:id/bayar', async (req, res) => {
  const { JenisPembayaran, NominalDibayar, NomorReferensi, TanggalBayar } = req.body;
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    const [lastP] = await conn.query("SELECT PembayaranID FROM pembayaran ORDER BY PembayaranID DESC LIMIT 1");
    const np = lastP.length ? parseInt(lastP[0].PembayaranID.split('-')[1]) + 1 : 1;
    await conn.query('INSERT INTO pembayaran VALUES (?,?,?,?,?,?,NOW())',
      ['PAY-'+String(np).padStart(3,'0'), req.params.id, JenisPembayaran, NominalDibayar, NomorReferensi, TanggalBayar]);
    const [[inv]] = await conn.query('SELECT * FROM invoice WHERE InvoiceID=?', [req.params.id]);
    let newStatus = inv.StatusInvoice;
    if (JenisPembayaran === 'DP') newStatus = 'DP Diterima';
    if (JenisPembayaran === 'Pelunasan' || JenisPembayaran === 'Penuh') {
      newStatus = 'Lunas';
      await conn.query("UPDATE unit SET StatusUnit='Sold' WHERE UnitID=?", [inv.UnitID]);
      // aktifkan garansi otomatis
      const [lastG] = await conn.query("SELECT GaransiID FROM garansi ORDER BY GaransiID DESC LIMIT 1");
      const ng = lastG.length ? parseInt(lastG[0].GaransiID.split('-')[1]) + 1 : 1;
      const tglAktif = new Date(TanggalBayar);
      const tglBerakhir = new Date(TanggalBayar);
      tglBerakhir.setMonth(tglBerakhir.getMonth() + (inv.DurasiGaransi||3));
      await conn.query('INSERT INTO garansi VALUES (?,?,?,?,?,?,?,NOW())',
        ['GRS-'+String(ng).padStart(3,'0'), req.params.id, inv.UnitID, inv.PelangganID,
         tglAktif.toISOString().slice(0,10), tglBerakhir.toISOString().slice(0,10), 'Aktif']);
    }
    await conn.query('UPDATE invoice SET StatusInvoice=? WHERE InvoiceID=?', [newStatus, req.params.id]);
    await conn.commit();
    req.flash('success', `Pembayaran dicatat — status: ${newStatus}`);
  } catch(e) {
    if (conn) await conn.rollback();
    req.flash('error', e.message);
  } finally { if (conn) conn.release(); }
  res.redirect('/invoice');
});

module.exports = router;
