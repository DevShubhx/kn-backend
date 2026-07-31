// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to enforce strict User access control metrics.
 * Supports both standard Authorization headers and URL query string fallbacks for media streaming.
 */
const protectUser = async (req, res, next) => {
    let token;

    // 1. Detect and parse the authorization Bearer header entry or URL query token fallback
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]; // 🎯 Fixed: Index allocation restored
    } else if (req.query && req.query.token) {
        // Fallback for native HTML5 video stream requests that cannot supply custom HTTP headers
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ 
            message: 'Access denied. Secure authorization session token is missing.' 
        });
    }

    try {
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ 
                message: "CRITICAL CONFIG FAULT: Server environment keys are unassigned." 
            });
        }

        // 2. Decode and verify the signature hash using your precise secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Query MongoDB for matching profiles while stripping out password hashes safely
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            return res.status(401).json({ 
                message: 'Session verification failed. Associated user profile no longer exists.' 
            });
        }

        return next(); // Validation checks out! Grant passage to secure route.

    } catch (error) {
        console.error("🚨 Token verification exception caught:", error.message);
        return res.status(401).json({ 
            message: 'Session verification failed. Access token is invalid or expired.' 
        });
    }
};

/**
 * Middleware to enforce strict Administrator access control metrics
 */
const protectAdmin = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]; // 🎯 Fixed: Index allocation restored
    }

    if (!token) {
        return res.status(401).json({ 
            message: 'Access denied. Secure authorization session token is missing.' 
        });
    }

    try {
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ 
                message: "CRITICAL CONFIG FAULT: Server environment keys are unassigned." 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        
        if (req.user && req.user.role === 'admin') {
            return next();
        } else {
            return res.status(403).json({ 
                message: 'Access denied. Administrator privileges are required to perform this action.' 
            });
        }

    } catch (error) {
        console.error("🚨 Admin token verification exception caught:", error.message);
        return res.status(401).json({ 
            message: 'Session verification failed. Access token is invalid or expired.' 
        });
    }
};

module.exports = { protectAdmin, protectUser };
