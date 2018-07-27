// Pull in variables from the environment
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || "development";

// Require node modules
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");

// Knex configuration/setup
const knex = require("knex");
const knexConfig = require("./knexfile")[NODE_ENV];
const knexLogger = require("knex-logger");

const db = knex(knexConfig);

// The user module contains all of our database access functions so we don't
// pollute the routes with database calls
const user = require("./models/user")(db);

const app = express();

// Use EJS as the view engine
app.set("view engine", "ejs");

// Setup our database logger
app.use(knexLogger(db));
// morgan is used to log HTTP requests
app.use(morgan("dev"));
// Use bodyParser to parse our request bodies
app.use(bodyParser.urlencoded({ extended: false }));

// Use a cookie to store session data
app.use(
  cookieSession({
    name: "session",
    keys: ["my super secret awesome key"],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  })
);

// This middleware reads the token from our session and sets req.currentUser to
// the user identified by the token. If there is no token, or it's invalid, we
// use the nullUser which is defined in the users model
// N.B. You need to call next() to have express move on to the next piece of
// middleware
app.use((req, res, next) => {
  const token = req.session.token;

  if (token) {
    user
      .getToken(token)
      .then(user => {
        req.currentUser = user;
        next();
      })
      .catch(err => {
        req.currentUser = user.nullUser;
        next();
      });
  } else {
    req.currentUser = user.nullUser;
    next();
  }
});

// GET / - Home Page
app.get("/", (req, res) => {
  res.render("index", { currentUser: req.currentUser });
});

// GET /register - Registration Page
app.get("/register", (req, res) => {
  res.render("register");
});

// POST /register - Registration Handler
app.post("/register", (req, res) => {
  const { username, password, password_confirm } = req.body;

  if (
    username &&
    password &&
    password_confirm &&
    password === password_confirm
  ) {
    user
      .register(username, password)
      .then(user => {
        req.session.token = user.token;
        res.redirect("/");
      })
      .catch(err => {
        console.log(err);
        res.redirect("/register");
      });
  } else {
    console.log("Username was not provided");
    res.redirect("/register");
  }
});

// GET /login - Login Page
app.get("/login", (req, res) => {
  res.render("login");
});

// POST /login - Login Handler
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username && password) {
    user
      .login(username, password)
      .then(user => {
        req.session.token = user.token;
        res.redirect("/");
      })
      .catch(err => {
        console.log(err);
        res.redirect("/login");
      });
  } else {
    res.redirect("/login");
  }
});

// POST /logout - Logout Handler
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`App is listening at http://localhost:${PORT}`);
});
