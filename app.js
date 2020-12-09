require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose")
const LocalStrategy = require("passport-local").Strategy


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
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose)

const Users = mongoose.model("User", userSchema);
passport.use(new LocalStrategy(Users.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(Users.serializeUser());
passport.deserializeUser(Users.deserializeUser());


app.get("/", (req, res) => {
    res.render("home")
})

app.get("/login", (req, res) => {
    res.render("login")
})
app.get("/register", (req, res) => {
    res.render("register")
})

app.get("/logout",(req,res)=> {
    req.logout()
    res.redirect("/")
})

app.get("/secret", (req, res) => {
    if (req.isAuthenticated()){
        res.render("secrets")
    }
    else{
        res.redirect("login")
    }
})


app.post("/register", (req, res) => {
    Users.register({username:req.body.username}, req.body.password,function (err,user) { 
        if (err){
            console.log(err);
            res.redirect("/register")
        } else{
            passport.authenticate("local")(req,res,function () { 
                res.redirect("secret")
             });
        }

     })

})

app.post("/login", (req, res) => {
    const user = new Users({
        username:req.body.username,
        password:req.body.password
    })

    req.logIn(user,function (err) { 
        if (err){
            console.log(err);
            res.redirect("/login")
        }
        else if(!err){
            passport.authenticate("local",{ successRedirect: '/secret'})(req,res,function () { 
                // res.redirect("secret")
                res.flash("hello")
                
             });
        }
        else{
            console.log(res.statusCode);
        }
     })


})








app.listen(process.env.PORT || 3000, function () {
    console.log(`listening at port 3000`);
})