SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS stock_opname;
DROP TABLE IF EXISTS klaim_garansi;
DROP TABLE IF EXISTS garansi;
DROP TABLE IF EXISTS pembayaran;
DROP TABLE IF EXISTS invoice;
DROP TABLE IF EXISTS nota_rekondisi_aktual;
DROP TABLE IF EXISTS laporan_qc;
DROP TABLE IF EXISTS pemakaian_suku_cadang;
DROP TABLE IF EXISTS suku_cadang;
DROP TABLE IF EXISTS detail_perbaikan;
DROP TABLE IF EXISTS logbook;
DROP TABLE IF EXISTS nota_estimasi;
DROP TABLE IF EXISTS laporan_inspeksi;
DROP TABLE IF EXISTS dp_jaminan;
DROP TABLE IF EXISTS request_unit;
DROP TABLE IF EXISTS unit;
DROP TABLE IF EXISTS staf;
DROP TABLE IF EXISTS supplier;
DROP TABLE IF EXISTS pelanggan;
DROP TABLE IF EXISTS role;
SET FOREIGN_KEY_CHECKS = 1;


CREATE TABLE role (
  RoleID VARCHAR(20) PRIMARY KEY,
  NamaRole VARCHAR(50) NOT NULL
);
INSERT INTO role VALUES
('owner','Owner'),('admin_sales','Admin Sales'),('admin_purchasing','Admin Purchasing'),
('admin_finance','Admin Finance'),('admin_inventory','Admin Inventory'),('teknisi','Teknisi');

CREATE TABLE staf (
  StafID VARCHAR(15) PRIMARY KEY,
  NamaStaf VARCHAR(100) NOT NULL,
  Username VARCHAR(50) NOT NULL UNIQUE,
  Password VARCHAR(255) NOT NULL,
  RoleID VARCHAR(20) NOT NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (RoleID) REFERENCES role(RoleID)
);
-- password: sumatech123
INSERT INTO staf VALUES
('STF-001','Bapak Owner','owner','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','owner',NOW()),
('STF-002','Budi Sales','sales1','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','admin_sales',NOW()),
('STF-003','Agus Purchasing','purchasing1','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','admin_purchasing',NOW()),
('STF-004','Rini Finance','finance1','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','admin_finance',NOW()),
('STF-005','Dedi Inventory','inventory1','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','admin_inventory',NOW()),
('STF-006','Andi Teknisi','teknisi1','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','teknisi',NOW()),
('STF-007','Joko Teknisi','teknisi2','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','teknisi',NOW());

CREATE TABLE pelanggan (
  PelangganID VARCHAR(15) PRIMARY KEY,
  NamaPelanggan VARCHAR(100) NOT NULL,
  Alamat TEXT NOT NULL,
  NoTelp VARCHAR(20) NOT NULL,
  Email VARCHAR(100),
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO pelanggan VALUES
('PLG-001','PT. Maju Bersama','Jl. Industri No.12, Bandung','022-5551234','maju@email.com',NOW()),
('PLG-002','CV. Sumber Teknik','Jl. Raya Bekasi No.45, Jakarta','021-6789012','sumber@email.com',NOW()),
('PLG-003','PT. Karya Mandiri','Jl. Sudirman No.8, Cimahi','022-7654321','karya@email.com',NOW());

CREATE TABLE supplier (
  SupplierID VARCHAR(15) PRIMARY KEY,
  NamaSupplier VARCHAR(100) NOT NULL,
  Alamat TEXT NOT NULL,
  Kontak VARCHAR(50) NOT NULL,
  JenisPasokan VARCHAR(100) NOT NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO supplier VALUES
('SUP-001','Lapak Mesin Bekas Jaya','Jl. Pasar Lama No.5, Bandung','081234567890','Pompa, Dinamo',NOW()),
('SUP-002','UD. Mesin Tua Lestari','Jl. Industri No.23, Jakarta','082345678901','Control Panel, Valve',NOW()),
('SUP-003','Bongkaran Pabrik Sejahtera','Jl. Raya No.77, Karawang','083456789012','Boiler, Pompa',NOW());

CREATE TABLE request_unit (
  RequestUnitID VARCHAR(15) PRIMARY KEY,
  PelangganID VARCHAR(15) NOT NULL,
  JenisMesin VARCHAR(50) NOT NULL,
  SpesifikasiTeknis TEXT,
  MerkPreferensi VARCHAR(50),
  KondisiMinimum VARCHAR(20),
  HargaBudget DECIMAL(15,0) NOT NULL,
  CatatanTambahan TEXT,
  OpsiPembayaran ENUM('sebagian','penuh') DEFAULT NULL,
  NilaiDisepakati DECIMAL(15,0),
  StatusRequest ENUM('Baru','DP Diterima','Dalam Pencarian','Estimasi Terkirim','Disetujui','Dibatalkan','Selesai') DEFAULT 'Baru',
  StafID VARCHAR(15),
  TanggalRequest TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (PelangganID) REFERENCES pelanggan(PelangganID),
  FOREIGN KEY (StafID) REFERENCES staf(StafID)
);

CREATE TABLE dp_jaminan (
  DPJaminanID VARCHAR(15) PRIMARY KEY,
  RequestUnitID VARCHAR(15) NOT NULL,
  NominalDP DECIMAL(15,0) NOT NULL,
  NomorReferensi VARCHAR(50) NOT NULL,
  TanggalBayar DATE NOT NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (RequestUnitID) REFERENCES request_unit(RequestUnitID)
);

CREATE TABLE unit (
  UnitID VARCHAR(15) PRIMARY KEY,
  RequestUnitID VARCHAR(15),
  SupplierID VARCHAR(15),
  JenisMesin ENUM('Pompa','Boiler','Dinamo','Control Panel','Valve') NOT NULL,
  Merk VARCHAR(50) NOT NULL,
  Tipe VARCHAR(100) NOT NULL,
  Tahun INT,
  LokasiUnit VARCHAR(100),
  HargaTawarSupplier DECIMAL(15,0),
  HargaBeli DECIMAL(15,0),
  HPP DECIMAL(15,0),
  HargaJual DECIMAL(15,0),
  KondisiAwal VARCHAR(10),
  KondisiAkhir VARCHAR(10),
  StatusUnit ENUM('Menunggu Inspeksi','Selesai Inspeksi','Dipilih Pelanggan','Masuk Gudang','Dalam Rekondisi','Menunggu QC','Menunggu Validasi Finance','Ready','Dalam Negosiasi','Reserved','Sold','Ditolak') DEFAULT 'Menunggu Inspeksi',
  TanggalMasukGudang DATE,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (SupplierID) REFERENCES supplier(SupplierID)
);
INSERT INTO unit VALUES
('UNT-001',NULL,'SUP-001','Pompa','Grundfos','CM5-6 A-R-I-E',2015,NULL,8500000,8500000,14200000,21000000,'45%','78%','Ready','2024-10-15',NOW()),
('UNT-002',NULL,'SUP-002','Boiler','Thermax','FBT-500',2013,NULL,25000000,25000000,38000000,57000000,'40%','75%','Ready','2024-11-01',NOW()),
('UNT-003',NULL,'SUP-001','Dinamo','ABB','M2BAX 160MLA4',2017,NULL,7000000,7000000,11000000,16500000,'55%','85%','Ready','2024-11-05',NOW()),
('UNT-004',NULL,'SUP-002','Control Panel','Schneider','TeSys D LC1D09',2018,NULL,5500000,5500000,8500000,13000000,'60%','88%','Dalam Rekondisi',NULL,NOW()),
('UNT-005',NULL,'SUP-003','Pompa','KSB','Etanorm 050-032',2015,NULL,13000000,13000000,NULL,NULL,'48%',NULL,'Menunggu QC',NULL,NOW());

CREATE TABLE laporan_inspeksi (
  LaporanID VARCHAR(15) PRIMARY KEY,
  UnitID VARCHAR(15) NOT NULL,
  StafID VARCHAR(15) NOT NULL,
  NomorDokumen VARCHAR(30) NOT NULL UNIQUE,
  TanggalInspeksi DATE NOT NULL,
  LokasiInspeksi VARCHAR(200) NOT NULL,
  CatatanKerusakan TEXT NOT NULL,
  EstimasiJamKerja INT NOT NULL DEFAULT 0,
  EstimasiSukuCadang DECIMAL(15,0) DEFAULT 0,
  KesimpulanKelayakan ENUM('Layak','Tidak Layak') NOT NULL,
  TanggalTerbit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (UnitID) REFERENCES unit(UnitID),
  FOREIGN KEY (StafID) REFERENCES staf(StafID)
);

CREATE TABLE nota_estimasi (
  NotaEstID VARCHAR(15) PRIMARY KEY,
  UnitID VARCHAR(15) NOT NULL,
  RequestUnitID VARCHAR(15),
  StafID VARCHAR(15) NOT NULL,
  NomorDokumen VARCHAR(30) NOT NULL UNIQUE,
  BiayaPengadaan DECIMAL(15,0) NOT NULL,
  BiayaJasaRekondisi DECIMAL(15,0) NOT NULL,
  BiayaSukuCadang DECIMAL(15,0) NOT NULL,
  TotalEstimasiHPP DECIMAL(15,0) NOT NULL,
  RekomendasiHargaJual DECIMAL(15,0),
  HargaJualDisepakati DECIMAL(15,0),
  StatusNota ENUM('Terbit','Disetujui','Revisi') DEFAULT 'Terbit',
  TanggalTerbit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (UnitID) REFERENCES unit(UnitID),
  FOREIGN KEY (StafID) REFERENCES staf(StafID)
);

CREATE TABLE logbook (
  LogBookID VARCHAR(15) PRIMARY KEY,
  UnitID VARCHAR(15) NOT NULL,
  StafID VARCHAR(15) NOT NULL,
  TanggalMulai DATE NOT NULL,
  TanggalSelesai DATE,
  StatusLogBook ENUM('Aktif','Selesai') DEFAULT 'Aktif',
  TotalBiayaTK DECIMAL(15,0) DEFAULT 0,
  TotalBiayaSC DECIMAL(15,0) DEFAULT 0,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (UnitID) REFERENCES unit(UnitID),
  FOREIGN KEY (StafID) REFERENCES staf(StafID)
);
INSERT INTO logbook VALUES ('LGB-001','UNT-004','STF-005','2024-12-01',NULL,'Aktif',2500000,1800000,NOW());

CREATE TABLE detail_perbaikan (
  DetailID INT AUTO_INCREMENT PRIMARY KEY,
  LogBookID VARCHAR(15) NOT NULL,
  StafID VARCHAR(15) NOT NULL,
  TahapanPerbaikan ENUM('Inspeksi Mendalam','Pembongkaran','Perbaikan dan Penggantian Komponen','Perakitan','Pengujian Fungsional') NOT NULL,
  StatusTahapan ENUM('Belum Dimulai','Sedang Berjalan','Selesai') DEFAULT 'Sedang Berjalan',
  DeskripsiKerja TEXT,
  TanggalMulai DATETIME DEFAULT CURRENT_TIMESTAMP,
  TanggalSelesai DATETIME,
  FOREIGN KEY (LogBookID) REFERENCES logbook(LogBookID),
  FOREIGN KEY (StafID) REFERENCES staf(StafID)
);

CREATE TABLE suku_cadang (
  PartID VARCHAR(15) PRIMARY KEY,
  KodeItem VARCHAR(30) NOT NULL UNIQUE,
  NamaItem VARCHAR(100) NOT NULL,
  Kategori VARCHAR(50) NOT NULL,
  Satuan VARCHAR(20) NOT NULL,
  LokasiRak VARCHAR(20),
  HargaBeli DECIMAL(12,0) NOT NULL,
  StokTersedia INT NOT NULL DEFAULT 0,
  BatasMinimum INT NOT NULL DEFAULT 5,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO suku_cadang VALUES
('PRT-001','ORS-001','O-Ring Set Pompa','Seal & Gasket','Set','A-01',45000,25,10,NOW()),
('PRT-002','BRG-001','Bearing 6205 2RS','Bearing','Pcs','B-01',85000,20,8,NOW()),
('PRT-003','KBL-001','Kabel NYY 4x2.5mm','Elektrikal','Meter','C-01',28000,100,20,NOW()),
('PRT-004','IMP-001','Impeller Pompa 6"','Spare Part Pompa','Pcs','E-01',850000,8,3,NOW()),
('PRT-005','RLY-001','Relay Omron MY2N','Elektrikal','Pcs','C-03',75000,4,8,NOW());

CREATE TABLE pemakaian_suku_cadang (
  UsageID INT AUTO_INCREMENT PRIMARY KEY,
  LogBookID VARCHAR(15) NOT NULL,
  PartID VARCHAR(15) NOT NULL,
  JumlahDigunakan INT NOT NULL,
  HargaSatuan DECIMAL(12,0) NOT NULL,
  Subtotal DECIMAL(15,0) NOT NULL,
  TanggalPemakaian DATE NOT NULL,
  FOREIGN KEY (LogBookID) REFERENCES logbook(LogBookID),
  FOREIGN KEY (PartID) REFERENCES suku_cadang(PartID)
);

CREATE TABLE laporan_qc (
  QCID VARCHAR(15) PRIMARY KEY,
  LogBookID VARCHAR(15) NOT NULL,
  UnitID VARCHAR(15) NOT NULL,
  StafID VARCHAR(15) NOT NULL,
  PersentaseKondisi INT NOT NULL,
  HasilChecklist JSON,
  KesimpulanQC ENUM('Lulus','Gagal') NOT NULL,
  CatatanQC TEXT,
  TanggalQC DATE NOT NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (LogBookID) REFERENCES logbook(LogBookID),
  FOREIGN KEY (UnitID) REFERENCES unit(UnitID),
  FOREIGN KEY (StafID) REFERENCES staf(StafID)
);

CREATE TABLE nota_rekondisi_aktual (
  NotaAktualID VARCHAR(15) PRIMARY KEY,
  UnitID VARCHAR(15) NOT NULL,
  LogBookID VARCHAR(15) NOT NULL,
  StafID VARCHAR(15) NOT NULL,
  NomorDokumen VARCHAR(30) NOT NULL UNIQUE,
  BiayaPengadaanAktual DECIMAL(15,0) NOT NULL,
  BiayaRekondisiAktual DECIMAL(15,0) NOT NULL,
  BiayaSCaktual DECIMAL(15,0) NOT NULL,
  TotalHPPAktual DECIMAL(15,0) NOT NULL,
  TagihanFinal DECIMAL(15,0),
  TanggalTerbit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (UnitID) REFERENCES unit(UnitID),
  FOREIGN KEY (LogBookID) REFERENCES logbook(LogBookID),
  FOREIGN KEY (StafID) REFERENCES staf(StafID)
);

CREATE TABLE invoice (
  InvoiceID VARCHAR(15) PRIMARY KEY,
  PelangganID VARCHAR(15) NOT NULL,
  UnitID VARCHAR(15) NOT NULL,
  RequestUnitID VARCHAR(15),
  NomorInvoice VARCHAR(30) NOT NULL UNIQUE,
  TotalHarga DECIMAL(15,0) NOT NULL,
  BiayaPengiriman DECIMAL(12,0) DEFAULT 0,
  BiayaInstalasi DECIMAL(12,0) DEFAULT 0,
  SyaratGaransi VARCHAR(200),
  DurasiGaransi INT DEFAULT 3,
  StatusInvoice ENUM('Menunggu Pembayaran','DP Diterima','Lunas') DEFAULT 'Menunggu Pembayaran',
  TanggalInvoice TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (PelangganID) REFERENCES pelanggan(PelangganID),
  FOREIGN KEY (UnitID) REFERENCES unit(UnitID)
);

CREATE TABLE pembayaran (
  PembayaranID VARCHAR(15) PRIMARY KEY,
  InvoiceID VARCHAR(15) NOT NULL,
  JenisPembayaran ENUM('DP','Pelunasan','Penuh') NOT NULL,
  NominalDibayar DECIMAL(15,0) NOT NULL,
  NomorReferensi VARCHAR(50) NOT NULL,
  TanggalBayar DATE NOT NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (InvoiceID) REFERENCES invoice(InvoiceID)
);

CREATE TABLE garansi (
  GaransiID VARCHAR(15) PRIMARY KEY,
  InvoiceID VARCHAR(15) NOT NULL,
  UnitID VARCHAR(15) NOT NULL,
  PelangganID VARCHAR(15) NOT NULL,
  TanggalAktif DATE NOT NULL,
  TanggalBerakhir DATE NOT NULL,
  StatusGaransi ENUM('Aktif','Berakhir') DEFAULT 'Aktif',
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (InvoiceID) REFERENCES invoice(InvoiceID),
  FOREIGN KEY (UnitID) REFERENCES unit(UnitID),
  FOREIGN KEY (PelangganID) REFERENCES pelanggan(PelangganID)
);

CREATE TABLE klaim_garansi (
  KlaimID VARCHAR(15) PRIMARY KEY,
  GaransiID VARCHAR(15) NOT NULL,
  UnitID VARCHAR(15) NOT NULL,
  PelangganID VARCHAR(15) NOT NULL,
  DeskripsiMasalah TEXT NOT NULL,
  StatusKlaim ENUM('Dalam Proses','Selesai','Ditolak') DEFAULT 'Dalam Proses',
  TanggalKlaim DATE NOT NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (GaransiID) REFERENCES garansi(GaransiID),
  FOREIGN KEY (UnitID) REFERENCES unit(UnitID),
  FOREIGN KEY (PelangganID) REFERENCES pelanggan(PelangganID)
);

CREATE TABLE stock_opname (
  OpnameID VARCHAR(15) PRIMARY KEY,
  PartID VARCHAR(15) NOT NULL,
  StokSistem INT NOT NULL,
  StokFisik INT NOT NULL,
  Selisih INT NOT NULL,
  Keterangan TEXT,
  StafID VARCHAR(15) NOT NULL,
  TanggalOpname DATE NOT NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (PartID) REFERENCES suku_cadang(PartID),
  FOREIGN KEY (StafID) REFERENCES staf(StafID)
);
