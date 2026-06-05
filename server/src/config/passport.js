const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../models/User')

const initializePassport = () => {
  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  '/api/auth/google/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value
      let user = await User.findOne({ email })

      if (user) {
        if (!['student', 'parent'].includes(user.role)) {
          return done(null, false, { message: 'Google login not allowed for this role' })
        }
        if (!user.googleId) {
          user.googleId = profile.id
          await user.save()
        }
        return done(null, user)
      }

      user = await User.create({
        name:     profile.displayName,
        email,
        googleId: profile.id,
        password: `google_${profile.id}_${Date.now()}`,
        role:     'student',
      })

      return done(null, user)
    } catch (err) {
      return done(err, null)
    }
  }))

  return passport
}

module.exports = { initializePassport, passport }