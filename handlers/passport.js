// Handler that will configure our passport
const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');

passport.use(User.createStrategy());

// stores the user info in the session
passport.serializeUser(User.serializeUser());
//
passport.deserializeUser(User.deserializeUser());
