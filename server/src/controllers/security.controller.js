const Outpass      = require('../models/Outpass')
const LeaveRequest = require('../models/LeaveRequest')
const AuditLog     = require('../models/AuditLog')

// POST /api/security/scan — security scans QR code
const scanQR = async (req, res) => {
  try {
    const { qrToken } = req.body

    if (!qrToken) {
      return res.status(400).json({ success: false, message: 'QR token required' })
    }

    const outpass = await Outpass.findOne({ qrToken })
      .populate('student', 'name rollNumber hostelBlock roomNumber department')
      .populate('leaveRequest')

    if (!outpass) {
      return res.status(404).json({ success: false, message: 'Invalid QR code' })
    }

    if (outpass.status === 'expired') {
      return res.status(400).json({ success: false, message: 'Outpass has expired' })
    }

    if (outpass.status === 'returned') {
      return res.status(400).json({ success: false, message: 'Student already returned' })
    }

    const now = new Date()
    let message = ''

    if (outpass.status === 'generated') {
      // First scan — student exiting
      outpass.status   = 'exited'
      outpass.exitTime = now
      outpass.scannedBy = req.user._id
      message = `Exit recorded for ${outpass.student.name}`

      await AuditLog.create({
        user:        req.user._id,
        role:        req.user.role,
        action:      'SECURITY_EXIT_SCAN',
        targetId:    outpass._id,
        targetModel: 'Outpass',
        metadata:    { studentName: outpass.student.name, exitTime: now }
      })

    } else if (outpass.status === 'exited' || outpass.status === 'late') {
      // Second scan — student returning
      outpass.entryTime = now
      outpass.status    = 'returned'

      // Check if late
      const isLate = now > new Date(outpass.expectedReturn)
      message = isLate
        ? `Late return recorded for ${outpass.student.name}`
        : `Entry recorded for ${outpass.student.name}`

      await AuditLog.create({
        user:        req.user._id,
        role:        req.user.role,
        action:      'SECURITY_ENTRY_SCAN',
        targetId:    outpass._id,
        targetModel: 'Outpass',
        metadata:    { studentName: outpass.student.name, entryTime: now, isLate }
      })
    }

    await outpass.save()

    res.json({
      success: true,
      message,
      outpass: {
        studentName:    outpass.student.name,
        rollNumber:     outpass.student.rollNumber,
        hostelBlock:    outpass.student.hostelBlock,
        roomNumber:     outpass.student.roomNumber,
        status:         outpass.status,
        exitTime:       outpass.exitTime,
        entryTime:      outpass.entryTime,
        expectedReturn: outpass.expectedReturn,
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/security/outpass/:token — verify outpass details before scanning
const verifyOutpass = async (req, res) => {
  try {
    const outpass = await Outpass.findOne({ qrToken: req.params.token })
      .populate('student', 'name rollNumber hostelBlock roomNumber department')
      .populate('leaveRequest', 'type reason destination fromDate toDate')

    if (!outpass) {
      return res.status(404).json({ success: false, message: 'Invalid outpass' })
    }

    const now = new Date()
    const isLate = outpass.status === 'exited' && now > new Date(outpass.expectedReturn)

    res.json({
      success: true,
      outpass: {
        ...outpass.toObject(),
        isLate,
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/security/currently-outside — live occupancy
const currentlyOutside = async (req, res) => {
  try {
    const outpasses = await Outpass.find({ status: 'exited' })
      .populate('student', 'name rollNumber hostelBlock roomNumber department')
      .populate('leaveRequest', 'type destination expectedReturn')
      .sort({ exitTime: -1 })

    const now = new Date()
    const results = outpasses.map(o => ({
      studentName:    o.student.name,
      rollNumber:     o.student.rollNumber,
      hostelBlock:    o.student.hostelBlock,
      destination:    o.leaveRequest?.destination,
      exitTime:       o.exitTime,
      expectedReturn: o.expectedReturn,
      isLate:         now > new Date(o.expectedReturn),
    }))

    res.json({ success: true, count: results.length, students: results })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { scanQR, verifyOutpass, currentlyOutside }