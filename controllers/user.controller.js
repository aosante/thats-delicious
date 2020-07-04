const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (_, res) => {
  res.render('login', { title: 'Login' });
};

exports.registerForm = (_, res) => {
  res.render('register', { title: 'Register' });
};

exports.register = async (req, _, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });
  // the passport-local-mongoose plugin of the User model takes care of the low level registration and hashing the password
  const register = promisify(User.register, User);
  await register(user, req.body.password);
  next(); // pass to authController.login
};

exports.account = (_, res) => {
  res.render('account', { title: 'Edit your account' });
};

exports.updateAccount = async (req, res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email,
  };
  await User.findByIdAndUpdate(
    { _id: req.user._id },
    { $set: updates },
    { new: true, runValidators: true, context: 'query' } //options
  );
  req.flash('success', 'Profile updated!');
  res.redirect('back');
};
