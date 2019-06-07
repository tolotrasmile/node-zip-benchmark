const express = require("express");
const router = express.Router();
const { zipDirectory } = require("../utils");

/* GET home page. */
router.get("/", (req, res, next) => {
  res.render("index", { title: "Express" });
});

/* GET home page. */
router.get("/generate", async (req, res, next) => {
  // an array to store the folder and files inside
  try {
    await zipDirectory("./test");
  } catch (error) {}

  res.render("index", { title: "Express" });
});

module.exports = router;
