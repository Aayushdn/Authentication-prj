require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose")
const LocalStrategy = require("passport-local").Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require('mongoose-findorcreate')



const app = express();

app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }))

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());

//connecting to databse
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.set('useCreateIndex', true);
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String,
  facebookId: String

});

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const Users = mongoose.model("User", userSchema);
passport.use(Users.createStrategy())
// use static serialize and deserialize of model for passport session support
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  Users.findById(id, function (err, user) {
    done(err, user);
  });
});
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secret",
  userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'

},
  function (accessToken, refreshToken, profile, cb) {
    console.log(profile.displayName);
    Users.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/secret",
  profileFields: ['id']
},
  function (accessToken, refreshToken, profile, cb) {
    console.log(profile.id);
    Users.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get("/", (req, res) => {
  res.render("home")
})


app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);
app.get('/auth/google/secret',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secret');
  });


app.get('/auth/facebook',
  passport.authenticate('facebook', { scope: "email" })
);
app.get('/auth/facebook/secret',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secret');
  });


app.get("/login", (req, res) => {
  res.render("login")
})
app.get("/register", (req, res) => {
  res.render("register")
})

app.get("/logout", (req, res) => {
  req.logout()
  res.redirect("/")
})

app.get("/secret", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets")
    console.log(req.user);
  }
  else {
    res.redirect("login")
  }
})


app.post("/register", (req, res) => {
  Users.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register")
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secret")
      });
    }

  })

})

app.post("/login", (req, res) => {
  const user = new Users({
    username: req.body.username,
    password: req.body.password
  })

  req.logIn(user, function (err) {
    if (err) {
      console.log(err);
      res.redirect("/login")
    }
    else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secret")

      });
    }

  })


})








app.listen(process.env.PORT || 3000, function () {
  console.log(`listening at port 3000`);
})