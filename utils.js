// Import the klaw module
const klaw = require("klaw");
const qr = require("qr-image");
const fs = require("fs");
const archiver = require("archiver");

function streamDirectory(directoryPath, streamFunction = fs.createReadStream) {
  return new Promise((resolve, reject) => {
    // an array to store the folder and files inside
    const items = [];
    klaw(directoryPath)
      .on("data", item => {
        if (fs.lstatSync(item).isDirectory()) {
          return;
        }
        items.push(streamFunction(item.path));
      })
      .on("end", () => resolve(items))
      .on("error", (err, item) => {
        reject(items);
      });
  });
}

const delay = (value, delay) =>
  new Promise(resolve => setTimeout(() => resolve(value), delay));

const createStreams = (links = [], type = "png") =>
  links.map(link => qr.image(link, { type }));

function zipStreams(
  streams = [],
  filenames = [],
  path = `${new Date().toTimeString()}.zip`
) {
  return new Promise((resolve, reject) => {
    const archive = createArchiveStream(path, resolve, reject);
    for (const [key, stream] of streams.entries()) {
      const name =
        filenames[key] || `file-${new Date().toString()} (${key}).png`;
      archive.append(stream, { name });
    }
    archive.finalize();
  });
}

function createArchiveStream(path, onSuccess, onError) {
  const ws = fs.createWriteStream(path);
  ws.on("close", () => onSuccess(archive.pointer() + " total bytes"));
  ws.on("end", () => onSuccess("Data has been drained"));
  const archive = archiver("zip", { zlib: { level: 9 } }); // Sets the compression level.
  archive.on("warning", err =>
    err.code === "ENOENT" ? onSuccess("Warning") : onError(err)
  );
  archive.on("error", err => onError(err));
  archive.pipe(ws);
  return archive;
}

function zipDirectory(
  directory = __dirname + "/../test",
  path = `${directory}.zip`
) {
  return new Promise((resolve, reject) => {
    // create a file to stream archive data to.
    const archive = createArchiveStream(path, resolve, reject);
    let count = 0;
    klaw(directory)
      .on("data", function(item) {
        console.log(item);
        if (!fs.lstatSync(item.path).isDirectory()) {
          const parts = item.path.split("/");
          const stream = fs.createReadStream(item.path);
          archive.append(stream, {
            name: parts[parts.length - 1]
          });
        }
      })
      .on("end", () => {
        archive.finalize();
      })
      .on("error", function(err, item) {
        console.log(err.message);
        console.log(item.path); // the file the error occurred on
      });
  });
}

module.exports = { streamDirectory, createStreams, zipStreams, zipDirectory };
