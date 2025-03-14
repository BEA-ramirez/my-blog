require("dotenv").config();

const express = require("express");
const expressEjsLayouts = require("express-ejs-layouts");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const MongoStore = require("connect-mongo");
const session = require("express-session");

const connectDB = require("./server/routes/config/db");
const isActiveRoute = require("./server/helpers/routeHelpers");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to DB
connectDB();

//middleware to be able to pass data through forms
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride("_method"));

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
    //cookie: {maxAge: new Date(Date.now() + (3600000))}
    //Date.now() - 30 * 24 * 60 * 60 * 1000
  })
);

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

//Templating Engine
app.use(expressEjsLayouts);

app.set("views", path.join(__dirname, "views")); // Explicitly set the views path
app.set("view engine", "ejs");
app.set("layout", path.join(__dirname, "views/layouts/main")); // Explicit absolute path

app.locals.isActiveRoute = isActiveRoute;

app.use("/", require("./server/routes/main"));
app.use("/", require("./server/routes/admin"));

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
