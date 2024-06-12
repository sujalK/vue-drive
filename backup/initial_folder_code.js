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
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // Set limit to 5 GB
  fileFilter: validateFileType
}).single('file');

function validateFileType(req, file, cb) {
  // Allow all file types
  cb(null, true);
}

// Endpoint to get the list of files and folders with optional query parameters
app.get('/items', (req, res) => {
  const { folderId, page, limit, q, _sort, _order } = req.query;

  let folders = db.folders.filter(folder => folder.folderId === parseInt(folderId || 0));
  let files = db.files.filter(file => file.folderId === parseInt(folderId || 0));

  if (q) {
    const searchTerm = q.toLowerCase();
    folders = folders.filter(folder => folder.name.toLowerCase().includes(searchTerm));
    files = files.filter(file => file.name.toLowerCase().includes(searchTerm));
  }

  if (_sort) {
    folders = folders.sort((a, b) => {
      if (_order === 'desc') {
        return a[_sort] < b[_sort] ? 1 : -1;
      }
      return a[_sort] > b[_sort] ? 1 : -1;
    });

    files = files.sort((a, b) => {
      if (_order === 'desc') {
        return a[_sort] < b[_sort] ? 1 : -1;
      }
      return a[_sort] > b[_sort] ? 1 : -1;
    });
  }

  if (page && limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    folders = folders.slice(startIndex, endIndex);
    files = files.slice(startIndex, endIndex);
  }

  res.status(200).send({ folders, files });
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

// Endpoint to get a specific folder by ID
app.get('/folders/:id', (req, res) => {
  const folderId = parseInt(req.params.id);
  const folder = db.folders.find(f => f.id === folderId);
  if (folder) {
    res.status(200).send(folder);
  } else {
    res.status(404).send({ message: 'Folder not found' });
  }
});

// Endpoint to upload files
app.post('/files', (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      return res.status(400).send({ message: err.message });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(400).send({ message: err.message });
    }

    // Everything went fine.
    const fileData = {
      id: db.files.length ? db.files[db.files.length - 1].id + 1 : 1,
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      url: `http://localhost:${port}/uploads/${req.file.filename}`,
      path: req.file.path,
      folderId: parseInt(req.body.folderId || 0), // Associate file with folder
      createdAt: Date.now()
    };

    db.files.push(fileData);
    fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(201).send(fileData);
  });
});

// Endpoint to create a new folder
app.post('/folders', (req, res) => {
  const { name, folderId } = req.body;

  if (!name) {
    return res.status(400).send({ message: 'Name is required' });
  }

  const folderData = {
    id: db.folders.length ? db.folders[db.folders.length - 1].id + 1 : 1,
    name,
    folderId: parseInt(folderId || 0)
  };

  db.folders.push(folderData);
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
  res.status(201).send(folderData);
});

// Endpoint to update file name
app.put('/files/:id', (req, res) => {
  const fileId = parseInt(req.params.id);
  const { name } = req.body;

  if (!name) {
    return res.status(400).send({ message: 'Name is required' });
  }

  const file = db.files.find(f => f.id === fileId);
  if (file) {
    file.name = name;
    fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(200).send(file);
  } else {
    res.status(404).send({ message: 'File not found' });
  }
});

// Endpoint to update folder name
app.put('/folders/:id', (req, res) => {
  const folderId = parseInt(req.params.id);
  const { name } = req.body;

  if (!name) {
    return res.status(400).send({ message: 'Name is required' });
  }

  const folder = db.folders.find(f => f.id === folderId);
  if (folder) {
    folder.name = name;
    fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(200).send(folder);
  } else {
    res.status(404).send({ message: 'Folder not found' });
  }
});

// Endpoint to delete files
app.delete('/files/:id', (req, res) => {
  const fileId = parseInt(req.params.id);
  const fileIndex = db.files.findIndex(file => file.id === fileId);

  if (fileIndex !== -1) {
    db.files.splice(fileIndex, 1);
    fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(200).send({ message: 'File deleted successfully' });
  } else {
    res.status(404).send({ message: 'File not found' });
  }
});

// Endpoint to delete folders
app.delete('/folders/:id', (req, res) => {
  const folderId = parseInt(req.params.id);
  const folderIndex = db.folders.findIndex(folder => folder.id === folderId);

  if (folderIndex !== -1) {
    db.folders.splice(folderIndex, 1);
    db.files = db.files.filter(file => file.folderId !== folderId);
    fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(200).send({ message: 'Folder and its files deleted successfully' });
  } else {
    res.status(404).send({ message: 'Folder not found' });
  }
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Express server is running at port ${port}`);
});

// Increase server timeout
server.timeout = 600000; // Set timeout to 10 minutes

// Watch for changes in db.json and reload data
const watcher = chokidar.watch(path.join(__dirname, 'db.json'), {
  persistent: true
});

watcher.on('change', (path) => {
  console.log(`File ${path} has been changed`);
  // Reload data from db.json
  db = JSON.parse(fs.readFileSync(path, 'utf8'));
});
