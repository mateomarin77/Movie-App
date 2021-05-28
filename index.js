// Import modules
const express = require('express'),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    mongoose = require('mongoose'),
    Models = require('./models.js'),
    passport = require('passport'),
    cors = require('cors'),
    { check, validationResult } = require('express-validator');

require('./passport');

// Declare variables for the data models
const Movies = Models.Movie;
const Users = Models.User;

// Connect to our Mongo database through mongoose
// Local connection
// mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });
// Connection to MongoDB Atlas
mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

// Specifies that app uses CORS (cross-origin resource sharing). Allows requests from all origins for now
app.use(cors());

app.use(bodyParser.json());

// Import auth.js for user authentication. (app) argument ensures that Express is available in auth.js
let auth = require('./auth')(app);

// Set up logging using morgan
app.use(morgan('common'));

// Serve static files from the public folder (at this stage, specifically for documentation.html)
app.use(express.static('public'));

// GET route for the default endpoint "/"
app.get('/', (req, res) => {
    res.send('This is my movies page!');
});

// GET route for endpoint /movies - will return a list of all movies
// passport.authenticate() will run the authenticate function and ensure a user is logged in
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    // Find all movies in the database (db.movies), then either return a success status with json formatted movies, or run the error catching function
    Movies.find().then((movies) => {
        res.status(201).json(movies);
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// GET route for endpoint /movies/:Title - will return detailed data about a specific movie by title
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
    // Find a matching movie based on the title, then send the movie details in json format to the client
    Movies.findOne({ Title: req.params.Title }).then((movie) => {
        res.json(movie);
    // If errors are found run the error catching function
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// GET route for endpoint /movies/:Genre - will return detailed data about a movie genre by genre name
app.get('/movies/genres/:Genre', passport.authenticate('jwt', { session: false }), (req, res) => {
    // Find a matching genre based on the genre name passed in the URL, then send the genre details in json format to the client
    // This will be found from the db.movies collection, but we will obtain all information about a genre we need from a single entry
    Movies.findOne({ 'Genre.Name': req.params.Genre }).then((movie) => {
        res.json(movie.Genre);
    // If errors are found run the error catching function
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: '+ err);
    });
});

// GET route for endpoint /movies/directors/:Director - will return detailed data about a director by name
app.get('/movies/directors/:Director', passport.authenticate('jwt', { session: false }), (req, res) => {
    // Find a matching director based on the director name passed in the URL, then send the director details in json format ot the client
    // This will be found from the db.mobies collection, but we will obtain all information about a genre we need from a single entry
    Movies.findOne({ 'Director.Name': req.params.Director }).then((movie) => {
        res.json(movie.Director);
    // If errors are found run the error catching function
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// POST route for endpoint users/ - will allow a new user to register
/* The JSON for this POST request will come in the following format:
{
    iD: Integer,
    Username: String,
    Password: String,
    Email: String,
    Birthday: Date
} */
// First we will validate the submitted data (through the second argument of the POST request)
app.post('/users', [check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()], (req, res) => {
    // Check the validation object for errors
    let errors = validationResult(req);
    // If errors are present, return a 422 response with errors in a JSON object
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    };

    // Hash the submitted password
    let hashedPassword = Users.hashPassword(req.body.Password);
    // Check to see if the given Username is already taken in db.users
    Users.findOne({ Username: req.body.Username })
    .then((user) => {
        // If Username is taken, return response to client
        if (user) {
            return res.status(400).send(req.body.Username + ' already exists');
        // If it's not taken, create an entry in db.users
        } else {
            Users.create({
                Username: req.body.Username,
                Password: hashedPassword,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            // Callback to send response to client with status code and the document for the new User
            }).then((user) => { res.status(201).json(user) })
            // Error handling function for creating the user
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            })
        }
    // Error handling function for querying the database
    }).catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});

// GET route for endpoint users/ - will return a list of all users in the database
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
    // Find all users in the database (db.users), then either return a success status with the json formatted users, or run the error catching function
    Users.find().then((users) => {
        res.status(201).json(users);
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// GET route for endpoint usres/:Username - will return the details for a single user by username
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    // Find a matching user based on the username, then send the user in json format to the client
    Users.findOne({ Username: req.params.Username }).then((user) => {
        res.json(user);
    // Otherwise run the error catching function
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});


// PUT route for endpoint users/:Username - will allow a user to update their username
/* We expect JSON in this format:
{
    Username: String (required),
    Password: String (required),
    Email: String (required),
    Birthday: Date
} */
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), [check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()], (req, res) => {
    // Check the validation object for errors
    let errors = validationResult(req);
    // If errors are present, return a 422 response with errors in a JSON object
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    };

    // Hash the submitted password
    let hashedPassword = Users.hashPassword(req.body.Password);

    // Use the findOneAndUpdate function to find the user document based on the username, then update it using $set:
    Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
        {
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday
        }
    },
    // Ensure the updated document is returned by specifying that the callback function will take the updated object as a parameter
    // Then send the updated user in json format back to the client
    { new: true}).then((updatedUser) => {
        res.json(updatedUser);
    // If errors are found run the error catching function
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// POST route for endpoint /users/:Username/Movies/:MovieID - will allow a user to add a movie to their list of favourites by movie title
app.post('/users/:Username/Movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    // Find and updated one user document based on given username
    Users.findOneAndUpdate({ Username: req.params.Username }, {
        // Push will add a new movie ID to the FavouriteMovies array
        $push: { FavouriteMovies: req.params.MovieID }
    },
    // Ensure the updated docuemnt is returned by specifying that the callback function will take the updated object as a parameter
    // Then send the updated user in json format back to the client
    { new: true }).then((updatedUser) => {
        res.json(updatedUser);
    // If errors are found run the error catching function
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// DELETE route for endpoint users/:Username/Movies/:MovieID - will allow a user to remove a movie from their list of favourites by movie title
app.delete('/users/:Username/Movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    // Find and update one user document based on a given username
    Users.findOneAndUpdate({ Username: req.params.Username }, {
        // Pull will remove this movie ID from the FavouriteMovies array
        $pull: { FavouriteMovies: req.params.MovieID }
    },
    // Ensure the updated docuemnt is returned by specifying that the callback function will take the updated object as a parameter
    // Then send the updated user in json format back to the client
    { new: true }).then((updatedUser) => {
        res.json(updatedUser);
    // If errors are found run the error catching function
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// DELETE route for endpoint users/:Username - will allow a user to deregister
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    // Use findOneAndRemove to find a user document by Username and then delete it
    Users.findOneAndRemove({ Username: req.params.Username }).then((user) => {
        // If no user is found, return the message that it wasn't found
        if (!user) {
            res.status(400).send(req.params.Username + ' was not found');
        // Otherwise, return a success message
        } else {
            res.status(200).send(req.params.Username + ' was deleted');
        }
    // Error handling function
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Error handling function
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Listen for pre-configured port in environment variables, or sets to default of 8080
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on port ' + port);
});
