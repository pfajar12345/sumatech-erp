const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('pages/login', { title: 'Login' });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query(
      'SELECT s.*, r.NamaRole FROM staf s JOIN role r ON s.RoleID=r.RoleID WHERE s.Username=?', [username]
    );
    if (!rows.length) { req.flash('error', 'Username tidak ditemukan'); return res.redirect('/login'); }
    const u = rows[0];
    console.log('DB Password:', u.Password);
console.log('Input password:', password);
    if (password !== u.Password) { req.flash('error', 'Password salah'); return res.redirect('/login'); }
    req.session.user = { StafID: u.StafID, NamaStaf: u.NamaStaf, Username: u.Username, RoleID: u.RoleID, NamaRole: u.NamaRole };
    res.redirect('/dashboard');
  } catch(e) { console.error(e); req.flash('error','Server error'); res.redirect('/login'); }
});

router.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

module.exports = router;
