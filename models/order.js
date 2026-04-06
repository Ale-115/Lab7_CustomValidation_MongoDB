const mongoose = require('mongoose');

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

module.exports = Order;
