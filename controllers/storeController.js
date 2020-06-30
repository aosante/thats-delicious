const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(_, file, next) {
    // mimetype describes the type of file it is
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) next(null, true);
    else next({ message: 'That file type is not allowed' });
  },
};

exports.homePage = (_, res) => {
  res.render('index');
};

exports.addStore = (_, res) => {
  res.render('addStore', {
    title: 'Add Store',
  });
};
// Some middleware to upload files
exports.upload = multer(multerOptions).single('photo');
// Middleware to resize images
exports.resize = async (req, _, next) => {
  // check if there's no new file to resize
  if (!req.file) {
    return next();
  }
  // e.g image/jpeg => jpeg
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // here we resize the image with jimp
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  // write to folder
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written our photo to our file system, continue
  next();
};

exports.createStore = async (req, res) => {
  // add the store's author
  req.body.author = req.user._id;
  const store = await new Store(req.body).save();
  req.flash('success', `Oh yeah, ${store.name} successfully created!`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (_, res) => {
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores });
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own a sotre to be able to edit.');
  }
};

exports.editStore = async (req, res) => {
  // 1 Find store by id
  const { storeId } = req.params;
  const store = await Store.findOne({ _id: storeId });
  // 2. Confirm owner of the store
  confirmOwner(store, req.user);
  // 3. Render out edit form
  res.render('addStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  // set location data to be a point
  req.body.location.type = 'Point';
  const { storeId } = req.params;
  const store = await Store.findOneAndUpdate({ _id: storeId }, req.body, {
    new: true, // returns the new store instead of old one
    runValidators: true, // runs schema validators
  }).exec();
  //redirect to store and tell them it worked
  req.flash(
    'success',
    `Successfully updated <strong>${store.name}</strong>. <a href="/store/${store.slug}">View Store</a>`
  );
  res.redirect(`/stores/${store._id}/edit`);
};

// individual store page
exports.getStoreBySlug = async (req, res, next) => {
  const { slug } = req.params;
  const store = await Store.findOne({ slug }).populate('author');
  if (!store) return next();
  res.render('store', { store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;
  // if there is no tag selected, just show all the stores
  const tagQuery = tag || { $exists: true };
  // getTagsList() is a custom method
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  res.render('tags', {
    tags,
    stores,
    title: 'Tags',
    tag,
  });
};

exports.searchStores = async (req, res) => {
  // using Mongo's $text, a text search will be performed on fields that were indexed as text
  const stores = await Store.find(
    {
      $text: {
        $search: req.query.q,
      },
    },
    // organizing results by those who match the query with more letters and/or word ocurreces
    {
      score: { $meta: 'textScore' },
    }
  ).sort({ score: { $meta: 'textScore' } });
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates,
        },
        // 10000 meters 10 km
        $maxDistance: 10000,
      },
    },
  };

  const stores = await Store.find(query)
    .select('name slug description location photo')
    .limit(15);
  res.json(stores);
};

exports.mapPage = async (req, res) => {
  res.render('map', { title: 'Map' });
};

exports.heartStores = async (req, res) => {
  // we get the array of object ids and we covert them into strings
  const hearts = req.user.hearts.map((obj) => obj.toString());

  // *pull removes from the hearts array
  // *addToSet is used (instead of push) because we want it to be unique
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { [operator]: { hearts: req.params.id } },
    { new: true }
  );
  res.json(user);
};
