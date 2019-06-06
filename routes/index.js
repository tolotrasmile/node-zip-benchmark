const express = require('express');
const router = express.Router();
const qr = require('qr-image');
const fs = require('fs');
const archiver = require('archiver');
const EventEmitter = require("events").EventEmitter;

const zipEvent = new EventEmitter()

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

const delay = (value, delay) => new Promise((resolve, reject) => setTimeout(() => resolve(value), delay))

/* GET home page. */
router.get('/generate', async function (req, res, next) {
    zipEvent.on('zip-end', (data) => {
        console.log(data)
    });
    zipDirectory()
        .then((data) => zipEvent.emit('zip-end', data))
        .catch((error) => zipEvent.emit('zip-end', error))
    res.render('index', {title: 'Upload'});
});

const createStreams = (links = [], type = "png") => links.map(link => qr.image(link, {type}));

const zipStreams = (streams = [], filenames = [], path = `${new Date().toTimeString()}.zip`) => {
    return new Promise((resolve, reject) => {
        const archive = createArchiveStream(path, resolve, reject);
        for (const [key, stream] of streams.entries()) {
            const name = filenames[key] || `file-${new Date().toString()} (${key}).png`;
            archive.append(stream, {name});
        }
        archive.finalize();
    })
};

function createArchiveStream(path, onSuccess, onError) {
    const output = fs.createWriteStream(path);
    output.on('close', () => onSuccess(archive.pointer() + ' total bytes'));
    output.on('end', () => onSuccess('Data has been drained'));
    const archive = archiver('zip', {zlib: {level: 9}}); // Sets the compression level.
    archive.on('warning', (err) => (err.code === 'ENOENT') ? onSuccess("Warning") : onError(err))
    archive.on('error', (err) => onError(err));
    archive.pipe(output);
    return archive;
}

function zipDirectory(directory = './routes', path = `${directory}.zip`) {
    return new Promise((resolve, reject) => {
        // create a file to stream archive data to.
        const archive = createArchiveStream(path, resolve, reject);
        archive.directory(directory, false);
        archive.finalize();
    })
}

module.exports = router;
