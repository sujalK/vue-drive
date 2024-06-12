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



// Endpoint to get the list of files with optional query parameters
// app.get('/files', (req, res) => {
//   let filteredFiles = db.files;
//
//   // Apply query parameters if provided
//   const { page, limit, q, _sort, _order } = req.query;
//
//   if (q) {
//     const searchTerm = q.toLowerCase();
//     filteredFiles = filteredFiles.filter(file => file.name.toLowerCase().includes(searchTerm));
//   }
//
//   if (_sort) {
//     const sortOrder = _order === 'desc' ? -1 : 1;
//     filteredFiles = filteredFiles.sort((a, b) => (a[_sort] > b[_sort] ? 1 : -1) * sortOrder);
//   }
//
//   if (page && limit) {
//     const startIndex = (page - 1) * limit;
//     const endIndex = page * limit;
//     filteredFiles = filteredFiles.slice(startIndex, endIndex);
//   }
//
//   res.status(200).send(filteredFiles);
// });

// Endpoint to get the list of files with optional query parameters
app.get('/files', (req, res) => {
  let filteredFiles = db.files;

  // Apply query parameters if provided
  const { page, limit, q, _sort, _order, folderId } = req.query;

  if (folderId !== undefined) {
    // If folderId is provided, filter files by folderId
    const folderIdInt = parseInt(folderId);
    filteredFiles = filteredFiles.filter(file => file.folderId === folderIdInt);
  }

  if (q) {
    const searchTerm = q.toLowerCase();
    filteredFiles = filteredFiles.filter(file => file.name.toLowerCase().includes(searchTerm));
  }

  if (_sort) {
    const sortOrder = _order === 'desc' ? -1 : 1;
    filteredFiles = filteredFiles.sort((a, b) => (a[_sort] > b[_sort] ? 1 : -1) * sortOrder);
  }

  if (page && limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    filteredFiles = filteredFiles.slice(startIndex, endIndex);
  }

  res.status(200).send(filteredFiles);
});


// Endpoint to get the list of folders with optional query parameters
// app.get('/folders', (req, res) => {
//   let filteredFolders = db.folders;
//
//   // Apply query parameters if provided
//   const { page, limit, q, _sort, _order, folderId } = req.query;
//
//   if (folderId !== undefined) {
//     filteredFolders = filteredFolders.filter(folder => folder.folderId === parseInt(folderId));
//   }
//
//   if (q) {
//     const searchTerm = q.toLowerCase();
//     filteredFolders = filteredFolders.filter(folder => folder.name.toLowerCase().includes(searchTerm));
//   }
//
//   if (_sort) {
//     const sortOrder = _order === 'desc' ? -1 : 1;
//     filteredFolders = filteredFolders.sort((a, b) => (a[_sort] > b[_sort] ? 1 : -1) * sortOrder);
//   }
//
//   if (page && limit) {
//     const startIndex = (page - 1) * limit;
//     const endIndex = page * limit;
//     filteredFolders = filteredFolders.slice(startIndex, endIndex);
//   }
//
//   res.status(200).send(filteredFolders);
// });

// Endpoint to get the list of folders with optional query parameters
app.get('/folders', (req, res) => {
  let filteredFolders = db.folders;

  // Apply query parameters if provided
  const { page, limit, q, _sort, _order, folderId } = req.query;

  if (folderId !== undefined) {
    // Parse folderId as integer
    const parsedFolderId = parseInt(folderId);
    // Filter folders by folderId
    filteredFolders = filteredFolders.filter(folder => folder.folderId === parsedFolderId);
  }

  if (q) {
    const searchTerm = q.toLowerCase();
    filteredFolders = filteredFolders.filter(folder => folder.name.toLowerCase().includes(searchTerm));
  }

  if (_sort) {
    const sortOrder = _order === 'desc' ? -1 : 1;
    filteredFolders = filteredFolders.sort((a, b) => (a[_sort] > b[_sort] ? 1 : -1) * sortOrder);
  }

  if (page && limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    filteredFolders = filteredFolders.slice(startIndex, endIndex);
  }

  res.status(200).send(filteredFolders);
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

// Endpoint to get all folders within a specific parent folder by ID
app.get('/folders/:id/folders', (req, res) => {
  const parentId = parseInt(req.params.id);
  const foldersWithinParent = db.folders.filter(folder => folder.folderId === parentId);
  res.status(200).send(foldersWithinParent);
});

// Endpoint to create a new folder
app.post('/folders', (req, res) => {
  const { name, folderId } = req.body;

  if (!name) {
    return res.status(400).send({ message: 'Name is required' });
  }

  const folderData = {
    id: db.folders.length ? db.folders[db.folders.length - 1].id + 1 : 1,
    name: name,
    folderId: folderId || 0 // Default to root folder if not specified
  };

  db.folders.push(folderData);
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
  res.status(201).send(folderData);
});

// Endpoint to get all files within a specific folder by ID
app.get('/folders/:id/files', (req, res) => {
  const folderId = parseInt(req.params.id);

  // Find the folder with the specified ID
  const folder = db.folders.find(f => f.id === folderId);

  if (!folder) {
    return res.status(404).send({ message: 'Folder not found' });
  }

  // Filter files based on the folder ID
  let filesInFolder = db.files.filter(file => file.folderId === folderId);

  // Apply sorting if sort parameters are provided
  const { _sort, _order } = req.query;
  if (_sort) {
    filesInFolder.sort((a, b) => {
      const sortOrder = _order === 'desc' ? -1 : 1;
      return sortOrder * (a[_sort] > b[_sort] ? 1 : -1);
    });
  }

  res.status(200).send(filesInFolder);
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
      folderId: parseInt(req.body.folderId) || 0, // Default to root folder if not specified
      createdAt: Date.now()
    };

    db.files.push(fileData);
    fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(201).send(fileData);
  });
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
// app.delete('/folders/:id', (req, res) => {
//   const folderId = parseInt(req.params.id);
//   const folderIndex = db.folders.findIndex(folder => folder.id === folderId);
//
//   if (folderIndex !== -1) {
//     // Remove the folder
//     db.folders.splice(folderIndex, 1);
//
//     // Also remove files within this folder
//     db.files = db.files.filter(file => file.folderId !== folderId);
//
//     fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
//     res.status(200).send({ message: 'Folder and its contents deleted successfully' });
//   } else {
//     res.status(404).send({ message: 'Folder not found' });
//   }
// });

// Endpoint to delete folders
app.delete('/folders/:id', (req, res) => {
  const folderId = parseInt(req.params.id);

  // Function to recursively delete all sub-folders and files within a folder
  const deleteFolderRecursive = (folderId) => {
    // Find sub-folders of the current folder
    const subFolders = db.folders.filter(folder => folder.folderId === folderId);

    // Iterate over each sub-folder
    subFolders.forEach(subFolder => {
      // Recursively delete sub-folder and its contents
      deleteFolderRecursive(subFolder.id);

      // Remove sub-folder from the database
      const subFolderIndex = db.folders.findIndex(folder => folder.id === subFolder.id);
      if (subFolderIndex !== -1) {
        db.folders.splice(subFolderIndex, 1);
      }

      // Remove files within the sub-folder from the database
      db.files = db.files.filter(file => file.folderId !== subFolder.id);
    });
  };

  // Delete the folder and its contents recursively
  deleteFolderRecursive(folderId);

  // Remove the parent folder itself
  const folderIndex = db.folders.findIndex(folder => folder.id === folderId);
  if (folderIndex !== -1) {
    db.folders.splice(folderIndex, 1);
    res.status(200).send({ message: 'Folder and its contents deleted successfully' });
  } else {
    res.status(404).send({ message: 'Folder not found' });
  }

  // Write changes to the database file
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
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
