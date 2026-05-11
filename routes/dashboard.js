const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [[ready]]    = await db.query("SELECT COUNT(*) c FROM unit WHERE StatusUnit='Ready'");
    const [[rekondisi]]= await db.query("SELECT COUNT(*) c FROM unit WHERE StatusUnit IN ('Dalam Rekondisi','Menunggu QC','Menunggu Validasi Finance')");
    const [[sold]]     = await db.query("SELECT COUNT(*) c FROM unit WHERE StatusUnit='Sold'");
    const [[penjualan]]= await db.query("SELECT COALESCE(SUM(TotalHarga),0) c FROM invoice WHERE StatusInvoice='Lunas'");
    const [[stokKritis]]= await db.query("SELECT COUNT(*) c FROM suku_cadang WHERE StokTersedia<=BatasMinimum");
    const [unitTerbaru]= await db.query("SELECT * FROM unit ORDER BY CreatedAt DESC LIMIT 5");
    const [kritis]     = await db.query("SELECT * FROM suku_cadang WHERE StokTersedia<=BatasMinimum LIMIT 5");
    res.render('pages/dashboard', { title:'Dashboard', ready:ready.c, rekondisi:rekondisi.c, sold:sold.c, penjualan:penjualan.c, stokKritis:stokKritis.c, unitTerbaru, kritis });
  } catch(e) { console.error(e); res.render('pages/dashboard',{title:'Dashboard',ready:0,rekondisi:0,sold:0,penjualan:0,stokKritis:0,unitTerbaru:[],kritis:[]}); }
});

module.exports = router;
