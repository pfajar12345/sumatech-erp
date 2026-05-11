# Suma-Tech ERP 🔧
PT. Suma Karya Teknik — Cianjur | Node.js + Express + EJS + MySQL

## Instalasi
1. Import `database.sql` ke phpMyAdmin (database: `db_sumatech`)
2. `npm install`
3. `npm run dev`
4. Buka `http://localhost:3000`

## Login
| Username | Password | Role |
|---|---|---|
| owner | sumatech123 | Owner |
| sales1 | sumatech123 | Admin Sales |
| purchasing1 | sumatech123 | Admin Purchasing |
| finance1 | sumatech123 | Admin Finance |
| inventory1 | sumatech123 | Admin Inventory |
| teknisi1 | sumatech123 | Teknisi |
| teknisi2 | sumatech123 | Teknisi |

## UC yang Terimplementasi (20 UC)
- UC-01 Input data pelanggan
- UC-02 Inkuiri stok (Etalase Digital + filter)
- UC-03 Request unit + DP jaminan
- UC-04 Data supplier
- UC-05 Input unit kandidat (Purchasing)
- UC-06 Laporan inspeksi + AI rekomendasi
- UC-07 Tampilkan & pilih unit kandidat
- UC-08 Nota estimasi + AI rekomendasi harga jual
- UC-09 Catat opsi pembayaran A/B
- UC-10 LogBook rekondisi
- UC-11 Progress tahapan rekondisi
- UC-12 Pemakaian suku cadang (FIFO)
- UC-13 QC checklist per jenis mesin + anti-bias
- UC-14 Nota rekondisi aktual + kunci HPP
- UC-15 Invoice
- UC-16 Catat pembayaran + garansi otomatis
- UC-17 Klaim garansi
- UC-18 Inventaris + stock opname
- UC-19 Laporan keuangan (penjualan, pembelian, laba)
- UC-20 Executive dashboard (Owner)
