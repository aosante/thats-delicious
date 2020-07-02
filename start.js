const mongoose = require('mongoose');

// import environmental variables from our variables.env file
require('dotenv').config({ path: 'variables.env' });
// Connect to our Database and handle any bad connections
require('./models/Store');
require('./models/User');
require('./models/Review');
mongoose
  .connect(process.env.DATABASE, {
    useUnifiedTopology: true,
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
  })
  .then(() => console.log('Connected to MongoDB!'))
  .catch((error) =>
    console.error(`🙅 🚫 🙅 🚫 🙅 🚫 🙅 🚫 → ${error.message}`)
  );

// import all of our models

// Start our app!
const app = require('./app');
app.set('port', process.env.PORT || 7777);
const server = app.listen(app.get('port'), () => {
  console.log(`Express running → PORT ${server.address().port}`);
});
