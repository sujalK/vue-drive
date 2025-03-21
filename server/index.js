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

// Read db.json file
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

// Utility function to read users from db.json
function getUsers() {
  const db = JSON.parse(fs.readFileSync(path.join(__dirname, 'db.json'), 'utf8'));
  return db.users || [];
}

// Utility function to save users to db.json
function saveUsers(users) {
  const db = JSON.parse(fs.readFileSync(path.join(__dirname, 'db.json'), 'utf8'));
  db.users = users;
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
}

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

  // Get the latest users array
  const users = getUsers();

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

  // Save the updated users array
  saveUsers(users);

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

  // Get the latest users array
  const users = getUsers();

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

// PUT endpoint to star/unstar a file
app.put('/files/:id/star', authenticateToken, (req, res) => {
  const fileId = parseInt(req.params.id);
  const { starred } = req.body;

  const file = db.files.find(file => file.id === fileId);
  if (file) {
    file.starred = starred;

    fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(200).send(file);
  } else {
    res.status(404).send({ message: 'File not found' });
  }
});

// PUT endpoint to star/unstar a folder
app.put('/folders/:id/star', authenticateToken, (req, res) => {
  const folderId = parseInt(req.params.id);
  const { starred } = req.body;

  const folder = db.folders.find(folder => folder.id === folderId);
  if (folder) {
    folder.starred = starred;

    fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(200).send(folder);
  } else {
    res.status(404).send({ message: 'Folder not found' });
  }
});



app.post('/folders', authenticateToken, (req, res) => {
  const { name, folderId } = req.body;

  if (!name) {
    return res.status(400).send({ message: 'Folder name is required' });
  }

  const newFolder = {
    id: db.folders.length ? db.folders[db.folders.length - 1].id + 1 : 1,
    name,
    folderId: folderId || 0 // Default to root folder if not specified
  };

  db.folders.push(newFolder);
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));

  res.status(201).send(newFolder);
});

app.get('/folders/:id/files', authenticateToken, (req, res) => {
  const folderId = parseInt(req.params.id);
  const filesWithinFolder = db.files.filter(file => file.folderId === folderId);
  res.status(200).send(filesWithinFolder);
});

app.post('/files', authenticateToken, (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).send({ message: 'Error uploading file' });
    }

    const { folderId } = req.body;

    const fileData = {
      id: db.files.length ? db.files[db.files.length - 1].id + 1 : 1,
      name: req.file.filename,
      fileUrl: req.file.path,
      folderId: folderId || 0 // Default to root folder if not specified
    };

    db.files.push(fileData);
    fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(201).send(fileData);
  });
});

app.put('/files/:id', authenticateToken, (req, res) => {
  const fileId = parseInt(req.params.id);
  const { name, folderId } = req.body;

  const file = db.files.find(file => file.id === fileId);
  if (file) {
    file.name = name || file.name;
    file.folderId = folderId !== undefined ? folderId : file.folderId;

    fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(200).send(file);
  } else {
    res.status(404).send({ message: 'File not found' });
  }
});

app.put('/folders/:id', authenticateToken, (req, res) => {
  const folderId = parseInt(req.params.id);
  const { name, folderId: newParentId } = req.body;

  const folder = db.folders.find(folder => folder.id === folderId);
  if (folder) {
    folder.name = name || folder.name;
    folder.folderId = newParentId !== undefined ? newParentId : folder.folderId;

    fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(200).send(folder);
  } else {
    res.status(404).send({ message: 'Folder not found' });
  }
});

app.delete('/files/:id', authenticateToken, (req, res) => {
  const fileId = parseInt(req.params.id);

  const fileIndex = db.files.findIndex(file => file.id === fileId);
  if (fileIndex !== -1) {
    const deletedFile = db.files.splice(fileIndex, 1)[0];
    fs.unlinkSync(path.join(__dirname, deletedFile.fileUrl)); // Delete the file from the server

    fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(200).send({ message: 'File deleted successfully' });
  } else {
    res.status(404).send({ message: 'File not found' });
  }
});

app.delete('/folders/:id', authenticateToken, (req, res) => {
  const folderId = parseInt(req.params.id);

  const folderIndex = db.folders.findIndex(folder => folder.id === folderId);
  if (folderIndex !== -1) {
    db.folders.splice(folderIndex, 1);

    fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(200).send({ message: 'Folder deleted successfully' });
  } else {
    res.status(404).send({ message: 'Folder not found' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
