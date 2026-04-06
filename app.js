const express = require('express');
const path = require('path');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();

// 🔌 MongoDB
mongoose.connect("mongodb+srv://hellobyaledesign_db:ale123@cluster0.boqmu7v.mongodb.net/CollegeOrder")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Error:", err));

// ⚙️ Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// 🔐 Sessions
app.use(session({
  secret: 'mysecretkey123',
  resave: false,
  saveUninitialized: true
}));

// 🔥 Variables globales para vistas
app.use((req, res, next) => {
  res.locals.isAdmin = req.session.isAdmin || false;
  res.locals.adminName = req.session.adminName || '';
  next();
});

// 📦 Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 📦 Models
const Admin = require('./models/Admin');

const Order = mongoose.model('Order', {
  name: String,
  email: String,
  phone: String,
  postcode: String,
  lunch: String,
  ticket: Number,
  campus: String,
  sub: Number,
  tax: Number,
  total: Number
});

// 🔐 Middleware de protección
function isAuthenticated(req, res, next) {
  if (req.session.isAdmin) return next();
  res.redirect('/login');
}

// ---------------- ROUTES ----------------

// Home
app.get('/', (req, res) => {
  res.render('form');
});

// LOGIN
app.get('/login', (req, res) => {
  res.render('login', { error: null, errors: undefined, loginError: undefined });
});

app.post('/login', [
  check('uname', 'User field empty').notEmpty(),
  check('pass', 'Password field empty').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.render('login', { errors: errors.array(), loginError: undefined });
  }

  const admin = await Admin.findOne({ username: req.body.uname });

  if (!admin || admin.password !== req.body.pass) {
    return res.render('login', { errors: undefined, loginError: 'Invalid credentials' });
  }

  req.session.isAdmin = true;
  req.session.adminName = admin.displayName || admin.username;
  res.redirect('/allOrders');
});

// LOGOUT
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// FORM PROCESS
app.post('/processForm', [
  check('name', 'Name is Empty').notEmpty(),
  check('email', 'Not a valid Email').isEmail(),
  check('tickets', 'Ticket Not Selected').notEmpty().custom(value => {
    if (isNaN(value)) throw Error("Tickets must be a valid number.");
    if (value <= 0) throw Error("Tickets must be greater than 0.");
    return true;
  }),
  check('campus', 'Campus Not Selected').notEmpty(),
  check('lunch', 'Select Yes/No for Lunch').notEmpty(),
  check('lunch').custom((value, { req }) => {
    if (value === 'yes' && req.body.tickets < 3) {
      throw Error("Must buy 3 or more tickets to have lunch.");
    }
    return true;
  }),
  check('postcode', 'Invalid Post Code Format').matches(/^[a-zA-Z]\d[a-zA-Z]\s\d[a-zA-Z]\d$/),
  check('phone', 'Invalid phone Number').matches(/^\d{3}(\s|-)\d{3}(\s|-)\d{4}$/)
], (req, res) => {

  const errors = validationResult(req);

  if (errors.isEmpty()) {
    let cost = 100 * req.body.tickets;
    if (req.body.lunch === 'yes') cost += 60;

    let tax = cost * 0.13;
    let total = cost + tax;

    const newOrder = new Order({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      postcode: req.body.postcode,
      lunch: req.body.lunch,
      ticket: req.body.tickets,
      campus: req.body.campus,
      sub: parseFloat(cost.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    });

    newOrder.save()
      .then(data => res.render('form', { recpt: data }))
      .catch(err => console.log("Save Error:", err));

  } else {
    res.render('form', { errors: errors.array(), old: req.body });
  }
});

// 🔒 ALL ORDERS (protegida)
app.get('/allOrders', isAuthenticated, (req, res) => {
  Order.find({})
    .then(data => res.render('orders', { datax: data }))
    .catch(err => console.log("Read Error:", err));
});

// 🗑️ DELETE ORDER
app.get('/delete/:id', isAuthenticated, (req, res) => {
  Order.findByIdAndDelete(req.params.id)
    .then(data => {
      if (data) res.redirect('/allOrders');
    })
    .catch(err => console.log("Delete Error:", err));
});

// SERVER
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});killall node