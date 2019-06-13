const PDFDocument = require("pdfkit");
const fs = require("fs");
const exec = require("child_process").exec;

/**
 * Create PDF sheet
 * @param {*} path Sheet path
 * @param {*} item Sheet params
 * @param {*} size Options
 * @param {string} layout
 */
async function createSheet(
  { name, date, image },
  size = "A4",
  layout = "portrait"
) {
  const document = new PDFDocument({
    size,
    layout,
    margin: 0
  });
  const { width, height } = document.page;
  const padding = Math.abs(width - height) / 6;
  const contentRect = {
    x: padding,
    y: padding,
    w: width - 2 * padding,
    h: height - 2 * padding
  };

  const drawText = (text, options) => {
    const { font, fontSize, textAlign, left, top } = {
      font: "Helvetica",
      fontSize: 30,
      color: "#000000",
      textAlign: "center",
      left: 0,
      top: 0,
      ...options
    };

    document.font(font).fontSize(fontSize);

    const rect = {
      x: left + contentRect.x,
      y: top + contentRect.y,
      w: contentRect.w - left,
      h: document.heightOfString(text, { width: contentRect.w })
    };

    document.rect(rect.x, rect.y, rect.w, rect.h).fill("#FFFF00");
    document
      .fill("#000000")
      .text(text, rect.x, rect.y, { width: rect.w, align: textAlign });

    contentRect.y += rect.h + 10;
  };
  drawText(name, { font: "Helvetica-Bold", fontSize: 60 });
  drawText(date);
  drawText(name, { font: "Helvetica-Bold", fontSize: 60 });
  drawText(date);
  drawText(name, { font: "Helvetica-Bold", fontSize: 60 });

  const img = await streamToBuffer(image);

  document.image(img, contentRect.x, contentRect.y, {
    fit: [width - 2 * padding, 500],
    align: "center",
    valign: "top"
  });

  document.end();
  return document;
}

function streamToBuffer(path) {
  const buffers = [];
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(path);

    stream.on("data", data => buffers.push(data));
    stream.on("end", () => resolve(Buffer.concat(buffers)));
    stream.on("error", err => {
      reject("[streamToBuffer] impossible de transformer le stream en buffer");
    });

    stream.read();
  });
}

function execute(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error !== null) {
        console.log(error);
        reject(error);
      } else {
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        resolve("ok");
      }
    });
  });
}

function sample() {
  const doc = new PDFDocument({
    size: "A4",
    margin: 20
  });
  const stream = doc.pipe(fs.createWriteStream("./test/test.pdf"));
  stream.on("finish", function() {
    console.log("FINISH");
  });

  let pageNumber = 0;
  doc.on("pageAdded", () => {
    pageNumber++;
    let bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc.text(
      `Page ${pageNumber}`,
      0.5 * (doc.page.width - 100),
      doc.page.height - 50,
      {
        width: 100,
        align: "center",
        lineBreak: false
      }
    );

    // Reset text writer position
    doc.text("", 50, 50);
    doc.page.margins.bottom = bottom;
  });

  doc.fontSize(20);
  for (let y = 0; y < 1000; y++) {
    doc.text(
      `Line=${y}: doc_pos=(${doc.x}, ${doc.y});specified_pos=(10, ${y * 20})`,
      10,
      y * 20
    );
    doc.text("", 50, 50);
  }

  doc.end();
}

module.exports = { createSheet, execute, sample };
