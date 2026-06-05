require('dotenv').config()
const app                           = require('./app')
const connectDB                     = require('./config/db')
const { connectRedis }              = require('./config/redis')
const { scheduleCheck }             = require('./workers/lateReturn.worker')

const PORT = process.env.PORT || 5000

const start = async () => {
  await connectDB()
  await connectRedis()
  await scheduleCheck()

  app.listen(PORT, () => {
    console.log(`GateX server running on port ${PORT}`)
  })
}

start()