const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'sumatech2024', resave: false, saveUninitialized: false, cookie: { maxAge: 8 * 60 * 60 * 1000 } }));
app.use(flash());
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

const auth = (req, res, next) => { if (!req.session.user) return res.redirect('/login'); next(); };

app.use('/', require('./routes/auth'));
app.use('/dashboard', auth, require('./routes/dashboard'));
app.use('/pelanggan', auth, require('./routes/pelanggan'));
app.use('/supplier', auth, require('./routes/supplier'));
app.use('/unit', auth, require('./routes/unit'));
app.use('/request', auth, require('./routes/request'));
app.use('/purchasing', auth, require('./routes/purchasing'));
app.use('/inspeksi', auth, require('./routes/inspeksi'));
app.use('/estimasi', auth, require('./routes/estimasi'));
app.use('/rekondisi', auth, require('./routes/rekondisi'));
app.use('/qc', auth, require('./routes/qc'));
app.use('/nota', auth, require('./routes/nota'));
app.use('/invoice', auth, require('./routes/invoice'));
app.use('/garansi', auth, require('./routes/garansi'));
app.use('/inventaris', auth, require('./routes/inventaris'));
app.use('/laporan', auth, require('./routes/laporan'));

app.get('/', (req, res) => res.redirect(req.session.user ? '/dashboard' : '/login'));
app.use((req, res) => res.status(404).render('pages/404', { title: '404' }));

app.listen(3000, () => console.log('Suma-Tech ERP: http://localhost:3000'));
