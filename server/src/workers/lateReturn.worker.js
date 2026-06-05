const { Queue, Worker } = require('bullmq')
const { redisClient }   = require('../config/redis')
const Outpass           = require('../models/Outpass')
const User              = require('../models/User')
const nodemailer        = require('nodemailer')

const connection = { url: process.env.REDIS_URL }

// Create the queue
const lateReturnQueue = new Queue('late-return-check', { connection })

// Email transporter
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
})

// Worker — processes each job
const worker = new Worker('late-return-check', async (job) => {
  console.log('Running late return check...')

  const now = new Date()

  // Find all students who should have returned but haven't
  const lateOutpasses = await Outpass.find({
    status:         'exited',
    expectedReturn: { $lt: now },
  }).populate('student', 'name email rollNumber')
    .populate('leaveRequest', 'destination')

  for (const outpass of lateOutpasses) {
    // Mark as late
    outpass.status = 'late'
    await outpass.save()

    // Invalidate dashboard cache so it refreshes
    await redisClient.del('dashboard:stats')

    // Send email alert to warden
    const wardens = await User.find({ role: 'warden' }).select('email name')

    for (const warden of wardens) {
      try {
        await transporter.sendMail({
          from:    process.env.EMAIL_USER,
          to:      warden.email,
          subject: `⚠️ Late Return Alert — ${outpass.student.name}`,
          html: `
            <h2>Late Return Alert</h2>
            <p><strong>Student:</strong> ${outpass.student.name} (${outpass.student.rollNumber})</p>
            <p><strong>Expected Return:</strong> ${new Date(outpass.expectedReturn).toLocaleString()}</p>
            <p><strong>Current Time:</strong> ${now.toLocaleString()}</p>
            <p><strong>Destination:</strong> ${outpass.leaveRequest?.destination}</p>
            <p>Please take necessary action.</p>
          `
        })
      } catch (emailErr) {
        console.error('Email failed:', emailErr.message)
      }
    }

    console.log(`Late return marked for: ${outpass.student.name}`)
  }

  console.log(`Late return check done. Found ${lateOutpasses.length} late students.`)
}, { connection })

worker.on('completed', job => console.log(`Late check job ${job.id} completed`))
worker.on('failed',    (job, err) => console.error(`Late check job failed:`, err.message))

// Schedule the check every 5 minutes
const scheduleCheck = async () => {
  await lateReturnQueue.add(
    'check',
    {},
    {
      repeat: { every: 5 * 60 * 1000 }, // every 5 minutes
    }
  )
  console.log('Late return worker scheduled')
}

module.exports = { scheduleCheck, lateReturnQueue }