const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async ({ name, email, password, department = null, role = 'USER' }) => {
  if (!name || !email || !password) throw new Error('Name, email, and password are required');
  if (password.length < 5) throw new Error('Password must be at least 5 characters');

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) throw new Error('Email already registered');

  const password_hash = await bcrypt.hash(password, 10);
  
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, password_hash, role]
  );

  return { id: result.insertId, name, email, role };
};

const login = async ({ email, password }) => {
  if (!email || !password) throw new Error('Email and password required');

  const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (users.length === 0) throw new Error('Invalid email or password');

  const user = users[0];
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) throw new Error('Invalid email or password');

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '1d' }
  );

  return { 
    token, 
    user: { id: user.id, name: user.name, email: user.email, role: user.role } 
  };
};

const getMe = async (userId) => {
  const [users] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [userId]);
  if (users.length === 0) throw new Error('User not found');
  return users[0];
};

module.exports = { register, login, getMe };
