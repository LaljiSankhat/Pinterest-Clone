var express = require('express');
var router = express.Router();
const userModel = require("./users");
const passport = require('passport');
const localStrategy = require('passport-local');
const upload = require("./multer");
const postModel = require("./post");

passport.use(new localStrategy(userModel.authenticate()));


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index',{nav: false});
});

router.get('/register', function(req, res, next) {
  res.render('register',{nav: false});
});



router.post('/register', function(req, res, next) {
  const data = new userModel({
    username: req.body.username,
    email: req.body.email,
    contact: req.body.contact,
    name: req.body.name
  });

  userModel.register(data,req.body.password)
  .then(function(){
    passport.authenticate("local")(req,res,function(){
      res.redirect("/profile");
    })
  })
});

router.get('/profile', isLoggedIn, async function(req, res, next) {
  const user = 
  await userModel
      .findOne({username: req.session.passport.user})
      .populate("posts");
  res.render("profile",{user: user,nav:true});
});

router.get('/edit', isLoggedIn,function(req, res, next) {
  res.render('edit',{nav: true});
});

router.post('/editProfile', isLoggedIn,async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  const name = req.body.name;
  const username = req.body.username;
  await user.updateOne({ _id: user._id }, { $set: { name:  name, username: username}})
  .then(result => {
    console.log(result);
    // Check the result object for information about the update
    // result.nModified will be 1 if the update was successful
  })
  .catch(error => {
    console.error(error);
  });

  // await user.save();
  res.redirect("/profile");
});

router.get('/show/posts', isLoggedIn, async function(req, res, next) {
  const user = 
  await userModel
      .findOne({username: req.session.passport.user})
      .populate("posts");
  res.render("show",{user: user,nav:true});
});

router.get('/feed', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  const posts = await postModel.find()
  .populate("user")
  res.render("feed",{user: user,posts: posts ,nav:true});
});

router.get('/add', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render("add",{user: user,nav:true});
});

router.post('/createpost', isLoggedIn, upload.single("postimage"),async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  })
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
  
});

router.post('/fileupload', isLoggedIn, upload.single("image"), async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  user.profileImage = req.file.filename;
  await user.save();
});

router.post('/login', passport.authenticate("local",{
  failureRedirect: "/",
  successRedirect: "/profile"
}),function(req, res, next) {
  res.render('register');
});

router.get("logout",function(req,res,next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/");
}

module.exports = router;
