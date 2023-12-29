const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

// Connecting to the database
mongoose
  .connect(process.env.url, {
    useNewUrlParser: true,
    //uniFieldTopplogy:true
  })
  .then(() => {
    console.log("Successfully connected DB");
  })
  .catch((err) => {
    console.log("Not connect to the DB. Exiting now...", err);
    process.exit();
  });
