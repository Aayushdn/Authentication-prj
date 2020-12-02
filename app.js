require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption")

const app = express();

app.use(express.static(__dirname + "/public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}))

//connecting to databse
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology:true})

const userSchema = new mongoose.Schema({
    email:String,
    password :String
});

var secret = process.env.SECRET
userSchema.plugin(encrypt,{secret:secret,encryptedFields: ['password']})

const Users =  mongoose.model("User",userSchema);


app.get("/",(req,res) =>{
    res.render("home")
})

app.get("/login",(req,res) =>{
    res.render("login")
})
app.get("/register",(req,res) =>{
    res.render("register")
})

app.get("/secret",(req,res) =>{
    res.render("secrets")
})


app.post("/register",(req,res) =>{
    const email = req.body.username
    const password = req.body.password

    const newUser = new Users({
        email:email,
        password:password
    })
    newUser.save(() =>{
        res.render("secrets")
    })

})

app.post("/login",(req,res) =>{
    const email = req.body.username
    const password = req.body.password
    Users.findOne({email:email},(err,result) =>{
        if (err){
            console.log(err);
        }
        else{
            if (result){
                if (result.password === password){
                    res.render("secrets")
                }
            }
        }
    })

})








app.listen(process.env.PORT || 3000 , function () { 
    console.log(`listening at port 3000`);
 })