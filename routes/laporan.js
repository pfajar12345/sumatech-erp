const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const { jenis, dari, sampai } = req.query;
  const tglDari   = dari   || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);
  const tglSampai = sampai || new Date().toISOString().slice(0,10);
  try {
    // UC-20: KPI untuk Owner dashboard
    const [[totalPenjualan]] = await db.query("SELECT COALESCE(SUM(TotalHarga),0) c FROM invoice WHERE StatusInvoice='Lunas'");
    const [[unitReady]]      = await db.query("SELECT COUNT(*) c FROM unit WHERE StatusUnit='Ready'");
    const [[unitRekondisi]]  = await db.query("SELECT COUNT(*) c FROM unit WHERE StatusUnit IN ('Dalam Rekondisi','Menunggu QC','Menunggu Validasi Finance')");
    const [[unitSold]]       = await db.query("SELECT COUNT(*) c FROM unit WHERE StatusUnit='Sold'");

    // UC-19: laporan penjualan
    const [penjualan] = await db.query(`
      SELECT i.*,p.NamaPelanggan,u.JenisMesin,u.Merk,u.Tipe,u.HPP,
        (i.TotalHarga - COALESCE(u.HPP,0)) as LabaKotor
      FROM invoice i JOIN pelanggan p ON i.PelangganID=p.PelangganID JOIN unit u ON i.UnitID=u.UnitID
      WHERE i.StatusInvoice='Lunas' AND DATE(i.TanggalInvoice) BETWEEN ? AND ?
      ORDER BY i.TanggalInvoice DESC`, [tglDari, tglSampai]);

    const [pembelian] = await db.query(`
      SELECT u.*,s.NamaSupplier FROM unit u LEFT JOIN supplier s ON u.SupplierID=s.SupplierID
      WHERE u.HargaBeli IS NOT NULL AND DATE(u.CreatedAt) BETWEEN ? AND ?
      ORDER BY u.CreatedAt DESC`, [tglDari, tglSampai]);

    const [perJenis] = await db.query(`
      SELECT u.JenisMesin, COUNT(*) jumlah, SUM(i.TotalHarga) total
      FROM invoice i JOIN unit u ON i.UnitID=u.UnitID
      WHERE i.StatusInvoice='Lunas' AND DATE(i.TanggalInvoice) BETWEEN ? AND ?
      GROUP BY u.JenisMesin`, [tglDari, tglSampai]);

    const [[labaPeriode]] = await db.query(`
      SELECT COALESCE(SUM(i.TotalHarga - COALESCE(u.HPP,0)),0) c
      FROM invoice i JOIN unit u ON i.UnitID=u.UnitID
      WHERE i.StatusInvoice='Lunas' AND DATE(i.TanggalInvoice) BETWEEN ? AND ?`, [tglDari, tglSampai]);

    res.render('pages/laporan', { title:'Laporan & Dashboard', jenis, tglDari, tglSampai,
      totalPenjualan: totalPenjualan.c, unitReady: unitReady.c, unitRekondisi: unitRekondisi.c, unitSold: unitSold.c,
      penjualan, pembelian, perJenis, labaPeriode: labaPeriode.c });
  } catch(e) { console.error(e); req.flash('error','Gagal memuat laporan'); res.redirect('/dashboard'); }
});

module.exports = router;
