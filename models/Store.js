const mongoose = require('mongoose');
const slug = require('slugs');
const Schema = mongoose.Schema;

const storeSchema = new Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name',
  },
  slug: String,
  description: {
    type: String,
    trim: true,
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now(),
  },
  location: {
    type: {
      type: String,
      default: 'Point',
    },
    coordinates: [
      {
        type: Number,
        required: 'You must supply coordinates',
      },
    ],
    address: {
      type: String,
      requried: 'You must supply an address',
    },
  },
  photo: String,
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
});

// Index definition
storeSchema.index({
  name: 'text',
  description: 'text',
});

storeSchema.index({
  location: '2dsphere',
});

// using pre-save hook to create unique slugs in case there are repeated ones
storeSchema.pre('save', async function (next) {
  if (!this.isModified('name')) {
    next();
    return;
  }
  this.slug = slug(this.name);
  // find other stores that have a slug of name, name-1, name-2;
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
});

storeSchema.statics.getTagsList = function () {
  // $unwind gives an instance of a store for each tag
  return this.aggregate([
    { $unwind: '$tags' },
    // group based on tag field and create new field count
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

// method and aggregation to get the top stores based on average rating from all reviews
storeSchema.statics.getTopStores = function () {
  return this.aggregate([
    // Lookup Stores and populate their reviews (similar to the virtual method below)
    {
      $lookup: {
        // Mongo takes the model name (Review), and adds an 's' at the end and lowercases it
        from: 'reviews',
        localField: '_id',
        foreignField: 'store',
        as: 'reviews',
      },
    },
    // filter for only items that have 2 or more reviews
    { $match: { 'reviews.1': { $exists: true } } },
    // Add the average reviews field
    {
      $project: {
        photo: '$$ROOT.photo',
        name: '$$ROOT.name',
        reviews: '$$ROOT.reviews',
        slug: '$$ROOT.slug',
        averageRating: { $avg: '$reviews.rating' },
      },
    },
    // sort it by our new field, highest reviews first
    { $sort: { averageRating: -1 } },
    // limit to at most 15
    { $limit: 15 },
  ]);
};

// this mongoose method finds reviews where store's _id === the review's store property in order to fetch the store's reviews
storeSchema.virtual('reviews', {
  ref: 'Review', // links the store model to the review model
  localField: '_id', // the field on the store model
  foreignField: 'store', // the field on the review model
});

function autoPopulate(next) {
  this.populate('reviews');
  next();
}

storeSchema.pre('find', autoPopulate);
storeSchema.pre('findOne', autoPopulate);

module.exports = mongoose.model('Store', storeSchema);
