const Outpass      = require('../models/Outpass')
const LeaveRequest = require('../models/LeaveRequest')
const User         = require('../models/User')
const { redisClient } = require('../config/redis')

const CACHE_TTL = 60 // seconds

const getDashboardStats = async (req, res) => {
  try {
    // Try cache first
    const cached = await redisClient.get('dashboard:stats')
    if (cached) {
      return res.json({ success: true, fromCache: true, stats: JSON.parse(cached) })
    }

    const now = new Date()

    const [
      totalStudents,
      studentsOutside,
      pendingLeaves,
      lateReturns,
      todayExits,
      fullyApprovedLeaves,
    ] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      Outpass.countDocuments({ status: 'exited' }),
      LeaveRequest.countDocuments({ status: { $in: ['pending', 'parent_approved', 'tutor_approved'] } }),
      Outpass.countDocuments({ status: 'exited', expectedReturn: { $lt: now } }),
      Outpass.countDocuments({
        exitTime: { $gte: new Date(now.setHours(0,0,0,0)) },
      }),
      LeaveRequest.countDocuments({ status: 'fully_approved' }),
    ])

    const stats = {
      totalStudents,
      studentsInside: totalStudents - studentsOutside,
      studentsOutside,
      pendingLeaves,
      lateReturns,
      todayExits,
      fullyApprovedLeaves,
      generatedAt: new Date(),
    }

    // Cache for 60 seconds
    await redisClient.setEx('dashboard:stats', CACHE_TTL, JSON.stringify(stats))

    res.json({ success: true, fromCache: false, stats })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getLateReturns = async (req, res) => {
  try {
    const now = new Date()
    const lateOutpasses = await Outpass.find({
      status: 'exited',
      expectedReturn: { $lt: now },
    })
      .populate('student', 'name rollNumber hostelBlock roomNumber department')
      .populate('leaveRequest', 'destination type')
      .sort({ expectedReturn: 1 })

    const results = lateOutpasses.map(o => ({
      studentName:    o.student.name,
      rollNumber:     o.student.rollNumber,
      hostelBlock:    o.student.hostelBlock,
      destination:    o.leaveRequest?.destination,
      expectedReturn: o.expectedReturn,
      minutesLate:    Math.floor((now - new Date(o.expectedReturn)) / 60000),
    }))

    res.json({ success: true, count: results.length, lateStudents: results })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query
    const start = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()), 1)
    const end   = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()) + 1, 0)

    const leaves = await LeaveRequest.find({
      createdAt: { $gte: start, $lte: end }
    })
      .populate('student', 'name rollNumber department')
      .sort({ createdAt: -1 })

    const summary = {
      total:         leaves.length,
      approved:      leaves.filter(l => l.status === 'fully_approved').length,
      rejected:      leaves.filter(l => l.status === 'rejected').length,
      pending:       leaves.filter(l => !['fully_approved','rejected'].includes(l.status)).length,
      byType: {
        regular:   leaves.filter(l => l.type === 'regular').length,
        weekend:   leaves.filter(l => l.type === 'weekend').length,
        medical:   leaves.filter(l => l.type === 'medical').length,
        emergency: leaves.filter(l => l.type === 'emergency').length,
      }
    }

    res.json({ success: true, summary, leaves })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getDashboardStats, getLateReturns, getMonthlyReport }