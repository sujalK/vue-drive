const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const chokidar = require('chokidar');

const app = express();
const port = 3030;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure the uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

let db = JSON.parse(fs.readFileSync(path.join(__dirname, 'db.json'), 'utf8'));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, './uploads'));
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.toLowerCase().split(' ').join('-');
    cb(null, fileName);
  }
});

const upload = multer({
  storage,
  fileFilter: validateFileType
}).single('file');

function validateFileType(req, file, cb) {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|doc|docx|pdf|xls|xlsx)$/)) {
    return cb(new Error("File you're trying to upload was not allowed"));
  }
  cb(null, true);
}

// Endpoint to get the list of files with optional query parameters
app.get('/files', (req, res) => {
  let filteredFiles = db.files;

  // Apply query parameters if provided
  const { page, limit, name } = req.query;
  if (name) {
    const searchTerm = name.toLowerCase();
    filteredFiles = filteredFiles.filter(file => file.name.toLowerCase().includes(searchTerm));
  }
  if (page && limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    filteredFiles = filteredFiles.slice(startIndex, endIndex);
  }

  res.status(200).send(filteredFiles);
});

// Endpoint to get a specific file by ID
app.get('/files/:id', (req, res) => {
  const fileId = parseInt(req.params.id);
  const file = db.files.find(f => f.id === fileId);
  if (file) {
    res.status(200).send(file);
  } else {
    res.status(404).send({ message: 'File not found' });
  }
});

// Endpoint to upload files
app.post('/files', (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      return res.status(400).send({ message: err.message });
    }

    const fileData = {
      id: db.files.length ? db.files[db.files.length - 1].id + 1 : 1,
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      url: `http://localhost:${port}/uploads/${req.file.filename}`,
      path: req.file.path,
      createdAt: Date.now()
    };

    db.files.push(fileData);
    fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(201).send(fileData);
  });
});

// Endpoint to delete files
app.delete('/files/:id', (req, res) => {
  const fileId = parseInt(req.params.id);
  const fileIndex = db.files.findIndex(file => file.id === fileId);

  if (fileIndex !== -1) {
    const file = db.files[fileIndex];
    try {
      fs.unlinkSync(file.path);
      db.files.splice(fileIndex, 1);
      fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
      res.status(200).send({ message: 'File deleted successfully' });
    } catch (err) {
      res.status(500).send({ message: 'Failed to delete file', error: err.message });
    }
  } else {
    res.status(404).send({ message: 'File not found' });
  }
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Express server is running at port ${port}`);
});

// Watch for changes in db.json and reload data
const watcher = chokidar.watch(path.join(__dirname, 'db.json'), {
  persistent: true
});

watcher.on('change', (path) => {
  console.log(`File ${path} has been changed`);
  // Reload data from db.json
  db = JSON.parse(fs.readFileSync(path, 'utf8'));
});
