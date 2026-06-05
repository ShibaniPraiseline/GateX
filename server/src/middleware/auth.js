const { verifyToken } = require('../utils/jwt')
const { redisClient }  = require('../config/redis')
const User             = require('../models/User')

// Verifies JWT and attaches user to req
const protect = async (req, res, next) => {
  try {
    let token

    // Accept token from Authorization header or cookie
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies?.token) {
      token = req.cookies.token
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated' })
    }

    // Check if token has been blacklisted (logout)
    const isBlacklisted = await redisClient.get(`blacklist:${token}`)
    if (isBlacklisted) {
      return res.status(401).json({ success: false, message: 'Token has been invalidated' })
    }

    // Verify the token
    const decoded = verifyToken(token)

    // Attach full user to request
    const user = await User.findById(decoded.id).select('-password')
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' })
    }

    req.user  = user
    req.token = token
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

// Role-based access control — use after protect
// Usage: authorize('admin', 'warden')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not allowed to access this route`,
      })
    }
    next()
  }
}

module.exports = { protect, authorize }