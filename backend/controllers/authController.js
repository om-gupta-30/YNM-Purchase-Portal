const { supabase } = require('../config/supabase');
const jwt = require('jsonwebtoken');
const { validateUsername } = require('../middleware/validation');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    // Find user by username
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error('Database error during login:', findError);
      // Check if table doesn't exist
      if (findError.code === 'PGRST116' || findError.message.includes('relation') || findError.message.includes('does not exist')) {
        return res.status(500).json({ 
          success: false, 
          message: 'Database tables not found. Please run the SQL migration in Supabase first.' 
        });
      }
      return res.status(500).json({ success: false, message: 'Database error: ' + findError.message });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Compare password (plain text comparison - passwords stored in plain text)
    if (password !== user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register user (Admin only)
// @route   POST /api/auth/register
// @access  Private/Admin
exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .limit(1)
      .single();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Store password in plain text (as requested)
    // Create user
    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert({
        username,
        password: password, // Plain text password
        role: role || 'employee'
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ success: false, message: insertError.message });
    }

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, role, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all employees (Admin only)
// @route   GET /api/auth/employees
// @access  Private/Admin
exports.getEmployees = async (req, res) => {
  try {
    const { data: employees, error } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('role', 'employee')
      .order('username', { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json({ success: true, data: employees || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

