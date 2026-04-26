const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your_secret_key_change_me';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Хранилище для файлов
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
if (!fs.existsSync('./data')) fs.mkdirSync('./data');

// Файлы БД (упрощённая)
const DB_USERS = './data/users.json';
const DB_MESSAGES = './data/messages.json';
const DB_POSTS = './data/posts.json';

// Инициализация БД
if (!fs.existsSync(DB_USERS)) fs.writeFileSync(DB_USERS, JSON.stringify([]));
if (!fs.existsSync(DB_MESSAGES)) fs.writeFileSync(DB_MESSAGES, JSON.stringify([]));
if (!fs.existsSync(DB_POSTS)) fs.writeFileSync(DB_POSTS, JSON.stringify([
  { id: 1, author: 'admin', text: 'Добро пожаловать!', imageUrl: null, likes: 0, comments: [] }
]));

const readDB = (file) => JSON.parse(fs.readFileSync(file));
const writeDB = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// Загрузка аватара
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Middleware проверки токена
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Регистрация
app.post('/api/register', async (req, res) => {
  const { login, password } = req.body;
  const users = readDB(DB_USERS);
  if (users.find(u => u.login === login)) return res.status(400).json({ error: 'Login exists' });
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now(), login, password: hashedPassword, avatar: null, friends: [] };
  users.push(newUser);
  writeDB(DB_USERS, users);
  res.json({ message: 'Registered successfully' });
});

// Вход
app.post('/api/login', async (req, res) => {
  const { login, password } = req.body;
  const users = readDB(DB_USERS);
  const user = users.find(u => u.login === login);
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, login: user.login }, SECRET_KEY);
  res.json({ token, user: { id: user.id, login: user.login, avatar: user.avatar, friends: user.friends } });
});

// Получить данные пользователя
app.get('/api/user', auth, (req, res) => {
  const users = readDB(DB_USERS);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, login: user.login, avatar: user.avatar, friends: user.friends });
});

// Обновить профиль
app.post('/api/user/update', auth, async (req, res) => {
  const { login, password, avatar } = req.body;
  const users = readDB(DB_USERS);
  const index = users.findIndex(u => u.id === req.user.id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  if (login) users[index].login = login;
  if (password) users[index].password = await bcrypt.hash(password, 10);
  if (avatar) users[index].avatar = avatar;
  writeDB(DB_USERS, users);
  res.json({ message: 'Updated' });
});

// Загрузка аватара
app.post('/api/upload-avatar', auth, upload.single('avatar'), (req, res) => {
  const avatarUrl = `/uploads/${req.file.filename}`;
  const users = readDB(DB_USERS);
  const index = users.findIndex(u => u.id === req.user.id);
  if (index !== -1) users[index].avatar = avatarUrl;
  writeDB(DB_USERS, users);
  res.json({ avatarUrl });
});

// Поиск пользователей
app.get('/api/users/search', auth, (req, res) => {
  const { q } = req.query;
  const users = readDB(DB_USERS);
  const filtered = users.filter(u => u.id !== req.user.id && u.login.includes(q));
  res.json(filtered.map(u => ({ id: u.id, login: u.login, avatar: u.avatar })));
});

// Добавить друга
app.post('/api/friends/add', auth, (req, res) => {
  const { friendId } = req.body;
  const users = readDB(DB_USERS);
  const user = users.find(u => u.id === req.user.id);
  if (user && !user.friends.includes(friendId)) {
    user.friends.push(friendId);
    writeDB(DB_USERS, users);
    res.json({ message: 'Friend added' });
  } else res.status(400).json({ error: 'Already friends or invalid' });
});

// Получить сообщения с другом
app.get('/api/messages/:friendId', auth, (req, res) => {
  const messages = readDB(DB_MESSAGES);
  const { friendId } = req.params;
  const dialog = messages.filter(m => (m.from === req.user.id && m.to == friendId) || (m.from == friendId && m.to === req.user.id));
  res.json(dialog);
});

// Отправить сообщение
app.post('/api/messages/send', auth, (req, res) => {
  const { to, text } = req.body;
  const messages = readDB(DB_MESSAGES);
  const newMsg = { from: req.user.id, to, text, timestamp: Date.now() };
  messages.push(newMsg);
  writeDB(DB_MESSAGES, messages);
  res.json(newMsg);
});

// Лента постов
app.get('/api/posts', auth, (req, res) => {
  const posts = readDB(DB_POSTS);
  res.json(posts);
});

app.post('/api/posts', auth, upload.single('image'), (req, res) => {
  const { text } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const posts = readDB(DB_POSTS);
  const newPost = { id: Date.now(), author: req.user.login, text, imageUrl, likes: 0, comments: [] };
  posts.unshift(newPost);
  writeDB(DB_POSTS, posts);
  res.json(newPost);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));