const mongoose = require('mongoose');
const seedAdmin = require('./seedAdmin');

const connectToDb = () => {
  return mongoose
    .connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((data) => {
      console.log(`Database connected with ${data.connection.host}`);
      seedAdmin();
    });
};

module.exports = connectToDb;
