const User              = require('../models/User')
const { generateToken } = require('../utils/jwt')
const { redisClient }   = require('../config/redis')

const sendToken = (res, user, statusCode = 200) => {
  const token = generateToken({ id: user._id, role: user.role })

  res.cookie('token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000,
  })

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  })
}

const register = async (req, res) => {
  console.log('1. register hit')
  try {
    console.log('2. body:', req.body)
    const { name, email, password, role, rollNumber, department, hostelBlock, roomNumber, year } = req.body
    console.log('3. destructured')

    const restrictedRoles = ['tutor', 'warden', 'security', 'admin']
    if (restrictedRoles.includes(role)) {
      return res.status(403).json({ success: false, message: 'Contact admin to create this account type' })
    }
    console.log('4. role check passed')

    const existing = await User.findOne({ email })
    console.log('5. existing check done:', existing ? 'found' : 'not found')

    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' })
    }

    const user = await User.create({ name, email, password, role, rollNumber, department, hostelBlock, roomNumber, year })
    console.log('6. user created:', user._id)

    sendToken(res, user, 201)
    console.log('7. token sent')
  } catch (err) {
    console.error('REGISTER ERROR:', err)
    res.status(500).json({ success: false, message: err.message })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' })
    }

    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' })
    }

    sendToken(res, user)
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ success: false, message: err.message })
  }
}

const logout = async (req, res) => {
  try {
    await redisClient.setEx(`blacklist:${req.token}`, 7 * 24 * 60 * 60, 'true')
    res.clearCookie('token')
    res.json({ success: true, message: 'Logged out successfully' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getMe = async (req, res) => {
  res.json({ success: true, user: req.user })
}

const googleCallback = (req, res) => {
  sendToken(res, req.user)
}

module.exports = { register, login, logout, getMe, googleCallback }