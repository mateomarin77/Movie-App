const express = require("express"),
  morgan = require("morgan");

const app = express();

app.use(morgan("common"));

let topMovies = [
  {
    title: "The Shining"
  },
  {
    title: "Apocalypse Now"
  },
  {
    title: "Taxi Driver"
  },
  {
    title: "Incepcion"
  },
  {
    title: "Super Bad"
  },
  {
    title: "The Big Lewoski"
  },
  {
    title: "Raiders Of The Lost Arc"
  },
  {
    title: "Goodfellas"
  },
  {
    title: "Eyes Wide Shut"
  },
  {
    title: "The Godfather"
  }
];

// GET requests
app.get("/", (req, res) => {
  res.send("Welcome to my movie API!");
});

app.get("/documentation", (req, res) => {
  res.sendFile("public/documentation.html", { root: __dirname });
});

app.get("/movies", (req, res) => {
  res.json(topMovies);
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Ups! Something is not working!");
});

// listen for requests
app.listen(8080, () => {
  console.log("Your app is listening on port 8080.");
});
