const mongoose = require('mongoose');

const Admin = mongoose.model('Admin', {
  username: String,
  password: String,
  displayName: String
});

module.exports = Admin;