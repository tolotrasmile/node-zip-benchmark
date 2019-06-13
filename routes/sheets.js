const express = require("express");
const path = require("path");
const PDFImage = require("pdf-image").PDFImage;

const router = express.Router();
const contentDisposition = require("content-disposition");
const { createSheet, execute: exec, sample } = require("../pdf");

router.get("/", (req, res, next) => {
  res.render("index", { title: "Express" });
});

router.get("/pdf", async (req, res, next) => {
  const { name, date, image } = {
    name: "Teractys LUMIS",
    date: new Date().toString(),
    image: "./00.jpeg"
  };

  const filename = `${name}-${date}.pdf`;

  res.header("Content-Type", "application/pdf");
  res.header("Content-Disposition", contentDisposition(filename));

  const doc = await createSheet({ name, date, image });
  doc.pipe(res);

  doc.on("error", () => {
    res.render("index", { title: "PDF Creation error" });
  });

  res.on("finish", () => {
    res.render("index", { title: `PDF Created ${filename}` });
  });
});

router.get("/zip", async (req, res, next) => {
  const filename = path.resolve(__dirname + "/test.pdf");

  var pdfImage = new PDFImage(filename, {
    combinedImage: true,
    graphicsMagick: true // graphicsmagick
  });

  pdfImage
    .convertFile()
    .then(imagePaths => {
      console.log(imagePaths);
      res.render("index", { title: `PDF Created ${filename}` });
    })
    .catch(error => {
      console.log(error);
      res.render("index", { title: `PDF ERROR ${filename}` });
    });
});

router.get("/sample", async (req, res, next) => {
  sample();
  res.render("index", { title: `SAMPLE` });
});

router.get("/convert", async (req, res, next) => {
  const command = `convert -density 300 -trim test.pdf -quality 100 ${new Date().getTime()}.jpeg`;
  try {
    const result = await exec(command);
    console.log(result);
    res.render("index", { title: `JPEG Created` });
  } catch (error) {
    console.log("Error", error);
    res.render("index", { title: `JPEG ERROR` });
  }
});

module.exports = router;
