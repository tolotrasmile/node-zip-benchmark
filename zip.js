const packer = require("zip-stream");

function createZip(files) {
  return new Promise(async (resolve, reject) => {
    const archive = new packer(); // OR new packer(options)

    archive.on("error", function(err) {
      reject(err);
    });

    archive.on("end", function() {
      console.log("end archive")
      resolve(archive);
    });

    async function addEntry(name, content = null) {
      if (name) {
        return new Promise((resolve, reject) => {
          archive.entry(content, { name }, (err, entry) => {
            if (err) {
              reject(err);
            } else {
              resolve(name);
            }
          });
        });
      }
      return Promise.reject(null);
    }

    console.log("begin archive")
    for (const file of files) {
      await addEntry(file);
    }

    archive.finish();
  });
}

module.exports = { createZip };
