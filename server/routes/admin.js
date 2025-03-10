const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const adminLayout = "../views/layouts/admin";
const jwtSecret = process.env.JWT_SECRET;

//GET - Check Login
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ msg: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Unauthorized" });
  }
};

//GET - Admin : Login Page
router.get("/admin", async (req, res) => {
  try {
    const locals = {
      title: "Admin",
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
    };
    res.render("admin/index", { locals, layout: adminLayout });
  } catch (error) {}
});

//POST - Admin : Check Login
router.post("/admin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user._id }, jwtSecret);
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/dashboard");
  } catch (error) {}
});

//GET - Dashboard
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Dashboard",
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
    };
    const data = await Post.find();
    res.render("admin/dashboard", {
      locals,
      data,
      layout: adminLayout,
    });
  } catch (error) {
    console.log(error);
  }
});

//POST - Admin : Register
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const user = await User.create({ username, password: hashedPassword });
      res.status(200).json({ msg: "User created", user });
    } catch (error) {
      if (error.code === 11000) {
        res.status(409).json({ msg: "User already in use" });
      }
      res.status(500).json({ msg: "Internal server error" });
    }
  } catch (error) {}
});

//GET - Admin : Create new post
router.get("/add-post", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Add Post",
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
    };
    const data = await Post.find();
    res.render("admin/add-post", {
      locals,
      layout: adminLayout,
    });
  } catch (error) {
    console.log(error);
  }
});

//POST - add post to db
router.post("/add-post", authMiddleware, async (req, res) => {
  try {
    const { title, body } = req.body;
    try {
      const newPost = new Post({
        title: title,
        body: body,
      });
      await Post.create(newPost);
    } catch (error) {}
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
});

//PUT - Admin : Edit post
router.put("/edit-post/:id", authMiddleware, async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      body: req.body.body,
      updatedAt: Date.now(),
    });

    res.redirect(`/edit-post/${req.params.id}`);
  } catch (error) {
    console.log(error);
  }
});

//GET - Admin : Edit post
router.get("/edit-post/:id", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Edit Post",
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
    };

    const data = await Post.findOne({ _id: req.params.id });
    res.render("admin/edit-post", {
      data,
      locals,
      layout: adminLayout,
    });
  } catch (error) {
    console.log(error);
  }
});

//DELETE : Admin - delete post
router.delete("/delete-post/:id", authMiddleware, async (req, res) => {
  try {
    await Post.deleteOne({ _id: req.params.id });
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
});

//GET - Admin Logout
router.get("/logout", (req, res) => {
  res.clearCookie("token");

  res.redirect("/");
});

module.exports = router;
