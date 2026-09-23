// import necessary modules and dependencies
// Express framework for creating the API
import express from "express";

// create API with express
const api = express();

api.get("/", (req, res) => {
  res.send("Welcome!");
});

// create the web server
api.listen(7878, () => {
  console.log("server running at http://localhost:7878");
});
