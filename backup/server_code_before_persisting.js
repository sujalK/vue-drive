const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const port = 3030;

const JWT_SECRET = 'your_jwt_secret_here'; // Replace with your JWT secret

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure the uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Read db.json file initially
let db = JSON.parse(fs.readFileSync(path.join(__dirname, 'db.json'), 'utf8'));

// Initialize users from db.json or an empty object
let users = db.users || {};

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

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Register endpoint
// app.post('/register', async (req, res) => {
//   const { email, password } = req.body;
//
//   // Basic validation
//   if (!email || !password) {
//     return res.status(400).send({ message: 'Email and password are required' });
//   }
//
//   // Validate email format (basic example)
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailRegex.test(email)) {
//     return res.status(400).send({ message: 'Invalid email format' });
//   }
//
//   // Check if email already exists
//   if (users.some(user => user.email === email)) {
//     return res.status(400).send({ message: 'Email already registered' });
//   }
//
//   // Hash password
//   const hashedPassword = await bcrypt.hash(password, 10);
//
//   // Generate a unique id for the new user
//   const id = users.length > 0 ? Math.max(...users.map(user => user.id)) + 1 : 1;
//
//   // Create new user object
//   const newUser = { id, email, password: hashedPassword };
//
//   // Push the new user to the array
//   users.push(newUser);
//
//   // Update db.json with the updated users array
//   db.users = users;
//   fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
//
//   // Generate JWT access token
//   const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '1h' });
//
//   // Respond with access token and user information
//   res.status(201).send({
//     accessToken: token,
//     user: {
//       email,
//       id
//     }
//   });
// });

// Register endpoint
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).send({ message: 'Name, email, and password are required' });
  }

  // Validate email format (basic example)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send({ message: 'Invalid email format' });
  }

  // Check if email already exists
  if (users.some(user => user.email === email)) {
    return res.status(400).send({ message: 'Email already registered' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate a unique id for the new user
  const id = users.length > 0 ? Math.max(...users.map(user => user.id)) + 1 : 1;

  // Create new user object
  const newUser = { id, name, email, password: hashedPassword };

  // Push the new user to the array
  users.push(newUser);

  // Update db.json with the updated users array
  db.users = users;
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));

  // Generate JWT access token
  const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '1h' });

  // Respond with access token and user information
  res.status(201).send({
    accessToken: token,
    user: {
      email,
      id
    }
  });
});


// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Check if email exists in users array
  const user = users.find(user => user.email === email);

  // If user not found or password does not match, return error
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).send({ message: 'Invalid email or password' });
  }

  // Generate JWT token
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

  // Respond with token and user information
  res.status(200).send({
    accessToken: token,
    user: {
      email: user.email,
      id: user.id
    }
  });
});



// Protected endpoints
app.get('/files', authenticateToken, (req, res) => {
  let filteredFiles = db.files;

  const { page, limit, q, _sort, _order, folderId, starred } = req.query;

  if (folderId !== undefined) {
    const folderIdInt = parseInt(folderId);
    filteredFiles = filteredFiles.filter(file => file.folderId === folderIdInt);
  }

  if (q) {
    const searchTerm = q.toLowerCase();
    filteredFiles = filteredFiles.filter(file => file.name.toLowerCase().includes(searchTerm));
  }

  if (starred !== undefined) {
    const isStarred = starred.toLowerCase() === 'true';
    filteredFiles = filteredFiles.filter(file => file.starred === isStarred);
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

app.get('/folders', authenticateToken, (req, res) => {
  let filteredFolders = db.folders;

  const { page, limit, q, _sort, _order, folderId, starred } = req.query;

  if (folderId !== undefined) {
    const parsedFolderId = parseInt(folderId);
    filteredFolders = filteredFolders.filter(folder => folder.folderId === parsedFolderId);
  }

  if (q) {
    const searchTerm = q.toLowerCase();
    filteredFolders = filteredFolders.filter(folder => folder.name.toLowerCase().includes(searchTerm));
  }

  if (starred !== undefined) {
    const isStarred = starred.toLowerCase() === 'true';
    filteredFolders = filteredFolders.filter(folder => folder.starred === isStarred);
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

app.get('/files/:id', authenticateToken, (req, res) => {
  const fileId = parseInt(req.params.id);
  const file = db.files.find(f => f.id === fileId);
  if (file) {
    res.status(200).send(file);
  } else {
    res.status(404).send({ message: 'File not found' });
  }
});

app.get('/folders/:id', authenticateToken, (req, res) => {
  const folderId = parseInt(req.params.id);
  const folder = db.folders.find(f => f.id === folderId);
  if (folder) {
    res.status(200).send(folder);
  } else {
    res.status(404).send({ message: 'Folder not found' });
  }
});

app.get('/folders/:id/folders', authenticateToken, (req, res) => {
  const parentId = parseInt(req.params.id);
  const foldersWithinParent = db.folders.filter(folder => folder.folderId === parentId);
  res.status(200).send(foldersWithinParent);
});

app.post('/folders', authenticateToken, (req, res) => {
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

app.get('/folders/:id/files', authenticateToken, (req, res) => {
  const folderId = parseInt(req.params.id);

  const folder = db.folders.find(f => f.id === folderId);

  if (!folder) {
    return res.status(404).send({ message: 'Folder not found' });
  }

  let filesInFolder = db.files.filter(file => file.folderId === folderId);

  const { _sort, _order } = req.query;
  if (_sort) {
    filesInFolder.sort((a, b) => {
      const sortOrder = _order === 'desc' ? -1 : 1;
      return sortOrder * (a[_sort] > b[_sort] ? 1 : -1);
    });
  }

  res.status(200).send(filesInFolder);
});

app.post('/files', authenticateToken, (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).send({ message: err.message });
    } else if (err) {
      return res.status(400).send({ message: err.message });
    }

    const fileData = {
      id: db.files.length ? db.files[db.files.length - 1].id + 1 : 1,
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      url: `http://localhost:${port}/uploads/${req.file.filename}`,
      path: req.file.path,
      folderId: parseInt(req.body.folderId) || 0, // Default to root folder if not specified
      createdAt: Date.now()
    };

    fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(201).send(fileData);
  });
});

app.put('/files/:id', authenticateToken, (req, res) => {
  const fileId = parseInt(req.params.id);
  const file = db.files.find(f => f.id === fileId);

  if (!file) {
    return res.status(404).send({ message: 'File not found' });
  }

  const { name, folderId, starred } = req.body;

  if (name !== undefined) {
    file.name = name;
  }

  if (folderId !== undefined) {
    file.folderId = parseInt(folderId);
  }

  if (starred !== undefined) {
    file.starred = starred;
  }

  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
  res.status(200).send(file);
});

app.delete('/files/:id', authenticateToken, (req, res) => {
  const fileId = parseInt(req.params.id);
  const fileIndex = db.files.findIndex(f => f.id === fileId);

  if (fileIndex === -1) {
    return res.status(404).send({ message: 'File not found' });
  }

  const file = db.files[fileIndex];
  db.files.splice(fileIndex, 1);

  fs.unlink(file.path, (err) => {
    if (err) {
      return res.status(500).send({ message: 'Failed to delete file from disk' });
    }

    fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(200).send({ message: 'File deleted successfully' });
  });
});

app.delete('/folders/:id', authenticateToken, (req, res) => {
  const folderId = parseInt(req.params.id);
  const folderIndex = db.folders.findIndex(f => f.id === folderId);

  if (folderIndex === -1) {
    return res.status(404).send({ message: 'Folder not found' });
  }

  const filesInFolder = db.files.filter(file => file.folderId === folderId);
  if (filesInFolder.length > 0) {
    return res.status(400).send({ message: 'Cannot delete folder with files inside' });
  }

  db.folders.splice(folderIndex, 1);
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
  res.status(200).send({ message: 'Folder deleted successfully' });
});

app.post('/folders/:id/star', authenticateToken, (req, res) => {
  const folderId = parseInt(req.params.id);
  const folder = db.folders.find(f => f.id === folderId);

  if (!folder) {
    return res.status(404).send({ message: 'Folder not found' });
  }

  folder.starred = true;
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
  res.status(200).send({ message: 'Folder starred successfully' });
});

app.delete('/folders/:id/star', authenticateToken, (req, res) => {
  const folderId = parseInt(req.params.id);
  const folder = db.folders.find(f => f.id === folderId);

  if (!folder) {
    return res.status(404).send({ message: 'Folder not found' });
  }

  folder.starred = false;
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
  res.status(200).send({ message: 'Folder unstarred successfully' });
});

app.post('/files/:id/star', authenticateToken, (req, res) => {
  const fileId = parseInt(req.params.id);
  const file = db.files.find(f => f.id === fileId);

  if (!file) {
    return res.status(404).send({ message: 'File not found' });
  }

  file.starred = true;
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
  res.status(200).send({ message: 'File starred successfully' });
});

app.delete('/files/:id/star', authenticateToken, (req, res) => {
  const fileId = parseInt(req.params.id);
  const file = db.files.find(f => f.id === fileId);

  if (!file) {
    return res.status(404).send({ message: 'File not found' });
  }

  file.starred = false;
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
  res.status(200).send({ message: 'File unstarred successfully' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
