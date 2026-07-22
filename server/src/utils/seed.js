const User = require('../models/User')

const seedAdmin = async () => {
  try {
    const existing = await User.findOne({ role: 'admin' })
    if (existing) {
      console.log('Admin already exists — skipping seed')
      return
    }

    await User.create({
      name:     'Super Admin',
      email:    'admin@gatex.com',
      password: 'Admin@2026',
      role:     'admin',
      isActive: true,
    })

    console.log('Default admin created — email: admin@gatex.com | password: Admin@2026')
    console.log('IMPORTANT: Change this password after first login')
  } catch (err) {
    console.error('Seed error:', err.message)
  }
}

module.exports = seedAdmin