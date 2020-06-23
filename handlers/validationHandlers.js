const { check, validationResult } = require('express-validator');

exports.userValidationRules = (req, _) => {
  return [
    check('name', 'You must supply a name').not().isEmpty(),
    check('email', 'That email is not valid!')
      .normalizeEmail({
        gmail_remove_dots: true,
        gmail_remove_subaddress: true,
      })
      .isEmail(),
    check('password', "Password can't be blank").not().isEmpty(),
    check('password-confirm', "Confirmed password can't be blank")
      .not()
      .isEmpty(),
    check('password-confirm').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords don't match");
      } else {
        return value;
      }
    }),
  ];
};

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash(
      'error',
      errors.array().map((err) => err.msg)
    );
    res.render('register', {
      title: 'Register',
      body: req.body,
      flashes: req.flash(),
    });
    return;
  }
  next();
};
