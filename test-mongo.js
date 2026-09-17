const mongoose = require('mongoose');

const uri = "mongodb://Vinit04:DGFSFM15xAbnOvjV@ac-69epuyt-shard-00-00.9vaob4b.mongodb.net:27017,ac-69epuyt-shard-00-01.9vaob4b.mongodb.net:27017,ac-69epuyt-shard-00-02.9vaob4b.mongodb.net:27017/adheen6?ssl=true&replicaSet=atlas-ikf2zx-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri)
  .then(() => {
    console.log("Successfully connected to MongoDB!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection error details:", err);
    process.exit(1);
  });
