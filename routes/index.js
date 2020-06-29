const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const validationHandlers = require('../handlers/validationHandlers');
const { catchErrors } = require('../handlers/errorHandlers');

// The catchErrors method is used for controller methods that handle promises, and it catches and handles potential errors

router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/add', authController.isLoggedIn, storeController.addStore);
router.post(
  '/add',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);
router.post(
  '/add/:storeId',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);
router.get('/stores/:storeId/edit', catchErrors(storeController.editStore));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));
router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/login', userController.loginForm);
router.post('/login', authController.login);
router.get('/register', userController.registerForm);
router.post(
  '/register',
  // first 2 middlewares validate fields with express-validator (latest version)
  validationHandlers.userValidationRules(),
  validationHandlers.validate,
  // register user with passport-local-mongoose which takes care of the password hashing
  userController.register,
  // login user just after registering
  authController.login
);
router.get('/logout', authController.logout);

router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:resetToken', catchErrors(authController.reset));
router.post(
  '/account/reset/:resetToken',
  authController.confirmedPasswords,
  catchErrors(authController.updatePassword)
);

router.get('/map', storeController.mapPage);

// API
router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));
router.post('/api/stores/:id/heart', catchErrors(storeController.heartStore));

module.exports = router;
