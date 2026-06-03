const jwt = require('jsonwebtoken');
const JWT_SECRET = 'super_secret_livrogrande_key_2026'; // Must match the one in userRoutes.js!

// 1. Verify that the user has a valid JWT Token
const verifyToken = (req, res, next) => {
  // Tokens are usually sent in the "Authorization" header as "Bearer <token>"
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(403).json({ message: 'No token provided. Access denied.' });
  }

  const token = authHeader.split(' ')[1]; // Removes the "Bearer " part

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
    }
    
    // Save the user's ID and Role from the token into the request so other functions can use it
    req.userId = decoded.id;
    req.userRole = decoded.role; 
    req.roleId = decoded.roleId;
    next();
  });
};

// 2. Verify that the user has the ADMIN role
const isAdmin = (req, res, next) => {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: You do not have Admin privileges.' });
  }
  next();
};

module.exports = { verifyToken, isAdmin };