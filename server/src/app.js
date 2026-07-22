const express      = require('express')
const cors         = require('cors')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
const { initializePassport, passport } = require('./config/passport')

const app = express()

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:5173',
      process.env.CLIENT_URL,
    ]
    if (!origin || allowed.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(helmet())
initializePassport()
app.use(passport.initialize())


app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/leave', require('./routes/leave.routes'))
app.use('/api/security', require('./routes/security.routes'))
app.use('/api/dashboard', require('./routes/dashboard.routes'))
app.use('/api/visitor', require('./routes/visitor.routes'))
app.use('/api/announcements', require('./routes/announcement.routes'))
app.use('/api/admin', require('./routes/admin.routes'))


app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err.message)
  res.status(500).json({ success: false, message: err.message })
})

module.exports = app