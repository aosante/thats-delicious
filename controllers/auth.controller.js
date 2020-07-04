const mongoose = require('mongoose');
const User = mongoose.model('User');
const passport = require('passport');
const crypto = require('crypto');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: 'Failed login!',
  successFlash: 'Welcome!',
});

exports.logout = (req, res) => {
  // req.logout() is a meht exposed by passport js, see here: http://www.passportjs.org/docs/logout/
  req.logout();
  req.flash('success', 'You are now logged out! 👋');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  // method provided by passport js
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Oops! You must be logged in to do that');
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  // 1. See if user exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'No account with that email exists');
    return res.redirect('login');
  }
  // 2. If there's a user, reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
  await user.save();
  // 3. Send email with the generated token (on next video)
  const resetUrl = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user,
    subject: 'Password Reset',
    resetUrl,
    // fileName looks for this pug file template
    fileName: 'password-reset',
  });
  req.flash('success', `You have been sent a password reset link.`);
  // 4. Redirect to login after sending email
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const { resetToken } = req.params;
  // check if there's somebody with that token and if token hasn't expired
  const user = User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }

  // if there is a user, show them the reset password form
  res.render('reset', { title: 'Reset Password' });
};

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    return next();
  }
  req.flash('error', 'Passwords must match');
  res.redirect('back');
};

exports.updatePassword = async (req, res) => {
  const { resetToken } = req.params;
  // check if there's somebody with that token and if token hasn't expired
  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }
  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash('success', 'Your password has been reset');
  res.redirect('/');
};
