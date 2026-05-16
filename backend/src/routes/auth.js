const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../db');
const auth = require('../middleware/auth');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const safeUser = (u) => ({ id: u._id.toString(), name: u.name, email: u.email, role: u.role });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password min 6 chars' });
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already in use' });
    const hash = await bcrypt.hash(password, 12);
    const safeRole = ['admin', 'member'].includes(role) ? role : 'member';
    
    const user = new User({ name, email, password: hash, role: safeRole });
    await user.save();
    
    res.status(201).json({ token: sign(user._id), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ token: sign(user._id), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => res.json(safeUser(req.user)));

// GET /api/auth/users
router.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find({}, 'name email role');
    const mapped = users.map(u => ({ id: u._id.toString(), name: u.name, email: u.email, role: u.role }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
