const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Role, SuspiciousUser, Log } = require('../models');
const activeOTPs = new Map();

// A secret key for signing tokens (In production, this goes in a .env file!)
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_livrogrande_key_2026';

// --- BRONZE: Secure Register Route ---
// --- BRONZE: Secure Register Route ---
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) return res.status(400).json({ message: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // 👑 ADMIN BACKDOOR: If the username is exactly 'admin', give them the keys to the castle!
    const targetRoleName = username.toLowerCase() === 'admin' ? 'ADMIN' : 'USER';

    // Find the role, or create it if it doesn't exist yet
    let userRole = await Role.findOne({ where: { name: targetRoleName } });
    if (!userRole) {
      userRole = await Role.create({ name: targetRoleName, description: `${targetRoleName} privileges` });
    }

    const newUser = await User.create({
      username,
      password: hashedPassword,
      roleId: userRole.id
    });

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error("🔥 REGISTER CRASH:", error); 
    res.status(500).json({ error: error.message });
  }
});

// --- BRONZE: Secure Login & Token Generation ---
// 🥈 SILVER: Step 1 of 3-Way Auth (Check Password & Send OTP)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 1. Find User
    const user = await User.findOne({ 
      where: { username }, 
      include: [{ model: Role, as: 'role' }] 
    });
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 2. Check Password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

    // 3. Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 4. Save it in memory for 5 minutes
    activeOTPs.set(username, { otp, expires: Date.now() + 5 * 60 * 1000 });

    // ☁️ CLOUD FIX: Render blocks outgoing email. Print OTP to console instead!
    console.log(`\n=================================================`);
    console.log(`🔐 MFA PASSCODE FOR [${username}]: ${otp}`);
    console.log(`=================================================\n`);

    // Tell the frontend to ask for the OTP instantly
    res.status(200).json({ message: 'OTP Generated! Check Render Logs.', requiresOtp: true, username: user.username });
  } catch (error) {
    console.error("🔥 LOGIN CRASH:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🥈 SILVER: Step 2 of 3-Way Auth (Verify OTP & Issue Token)
router.post('/verify-otp', async (req, res) => {
  try {
    const { username, otp } = req.body;
    const record = activeOTPs.get(username);

    // 1. Check if OTP exists, matches, and isn't expired
    if (!record || record.expires < Date.now() || record.otp !== otp) {
      return res.status(401).json({ message: "Invalid or expired OTP." });
    }

    // 2. OTP is correct! Delete it so it can't be reused
    activeOTPs.delete(username);

    // 3. Issue the real JWT Token
    const user = await User.findOne({ 
      where: { username }, 
      include: [{ model: Role, as: 'role' }] 
    });

    const token = jwt.sign(
      { id: user.id, role: user.role.name, roleId: user.roleId }, 
      JWT_SECRET, // Make sure JWT_SECRET is defined at the top of your file!
      { expiresIn: '1h' }
    );

    res.status(200).json({ 
      token, 
      user: { id: user.id, username: user.username, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GOLD (From Assignment 3): Observation List Route ---
router.get('/suspicious', async (req, res) => {
  try {
    const suspects = await SuspiciousUser.findAll({
      include: [{ model: User, as: 'user', attributes: ['username'] }]
    });
    res.status(200).json(suspects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GOLD (From Assignment 3): View Raw Logs Route ---
router.get('/logs', async (req, res) => {
  try {
    const allLogs = await Log.findAll({ 
        order: [['createdAt', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['username'] }]
    });
    res.status(200).json(allLogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🥈 SILVER: Password Recovery (Send Email)
router.post('/forgot-password', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ where: { username } });
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 1. Create a secure, temporary token that expires in 15 minutes
    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '15m' });
    
    // ☁️ CLOUD FIX: Use the true Vercel frontend URL
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendURL}/reset-password?token=${resetToken}`;

    // ☁️ CLOUD FIX: Print the reset link to Render logs instead of trying to email it
    console.log(`\n=================================================`);
    console.log(`✉️ PASSWORD RESET LINK FOR [${username}]:`);
    console.log(`${resetLink}`);
    console.log(`=================================================\n`);

    res.status(200).json({ message: 'Recovery link generated! Check the Render terminal.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🥈 SILVER: Password Recovery (Save New Password)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // 1. Verify the 15-minute token is still valid
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 2. Find the user
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 3. Hash the new password and save it
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password successfully updated!' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired token. Please request a new email.' });
  }
});

module.exports = router;