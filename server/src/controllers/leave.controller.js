const LeaveRequest = require('../models/LeaveRequest')
const Outpass      = require('../models/Outpass')
const User         = require('../models/User')
const { v4: uuidv4 } = require('uuid')
const QRCode       = require('qrcode')

// POST /api/leave/apply — student applies for leave
const applyLeave = async (req, res) => {
  try {
    const { type, reason, destination, fromDate, toDate } = req.body

    if (!type || !reason || !destination || !fromDate || !toDate) {
      return res.status(400).json({ success: false, message: 'All fields required' })
    }

    // Find parent linked to this student
    const parent = await User.findOne({ linkedStudent: req.user._id, role: 'parent' })

    const leave = await LeaveRequest.create({
      student:     req.user._id,
      type,
      reason,
      destination,
      fromDate:    new Date(fromDate),
      toDate:      new Date(toDate),
      isEmergency: type === 'emergency',
      approvals: {
        parent: { role: 'parent', status: parent ? 'pending' : 'approved', user: parent?._id },
        tutor:  { role: 'tutor',  status: 'pending' },
        warden: { role: 'warden', status: 'pending' },
      }
    })

    res.status(201).json({ success: true, message: 'Leave applied successfully', leave })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/leave/my — student sees their own leaves
const getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ student: req.user._id })
      .populate('outpass')
      .sort({ createdAt: -1 })

    res.json({ success: true, leaves })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/leave/pending/:role — get pending leaves for approver
const getPendingLeaves = async (req, res) => {
  try {
    const { role } = req.user
    let query = {}

    if (role === 'parent') {
      // Parent sees leaves of their linked student
      const student = await User.findOne({ _id: req.user.linkedStudent })
      if (!student) return res.json({ success: true, leaves: [] })
      query = { student: student._id, 'approvals.parent.status': 'pending' }
    } else if (role === 'tutor') {
      query = {
        'approvals.parent.status': 'approved',
        'approvals.tutor.status':  'pending',
      }
    } else if (role === 'warden') {
      query = {
        'approvals.parent.status': 'approved',
        'approvals.tutor.status':  'approved',
        'approvals.warden.status': 'pending',
      }
    }

    const leaves = await LeaveRequest.find(query)
      .populate('student', 'name rollNumber department hostelBlock roomNumber')
      .sort({ isEmergency: -1, createdAt: 1 })

    res.json({ success: true, leaves })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/leave/:id/approve — approve or reject at any stage
const processLeave = async (req, res) => {
  try {
    const { action, comment } = req.body  // action: 'approved' | 'rejected' | 'clarification'
    const { role } = req.user
    const validRoles = ['parent', 'tutor', 'warden']

    if (!validRoles.includes(role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to process leaves' })
    }

    if (!['approved', 'rejected', 'clarification'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' })
    }

    const leave = await LeaveRequest.findById(req.params.id)
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' })
    }

    // Update the approval for this role
    leave.approvals[role].status   = action
    leave.approvals[role].user     = req.user._id
    leave.approvals[role].comment  = comment
    leave.approvals[role].actionAt = new Date()

    // Update overall status
    if (action === 'rejected') {
      leave.status = 'rejected'
    } else if (action === 'approved') {
      if (role === 'parent')  leave.status = 'parent_approved'
      if (role === 'tutor')   leave.status = 'tutor_approved'
      if (role === 'warden') {
        leave.status = 'fully_approved'
        // Generate outpass
        await generateOutpass(leave)
      }
    }

    await leave.save()

    res.json({ success: true, message: `Leave ${action} successfully`, leave })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// Internal — generates QR outpass after warden approves
const generateOutpass = async (leave) => {
  const qrToken = uuidv4()

  // QR contains a JSON string security will scan
  const qrData = JSON.stringify({
    token:     qrToken,
    studentId: leave.student.toString(),
    leaveId:   leave._id.toString(),
    validTill: leave.toDate,
  })

  const qrImage = await QRCode.toDataURL(qrData)

  const outpass = await Outpass.create({
    leaveRequest:   leave._id,
    student:        leave.student,
    qrToken,
    qrImage,
    expectedReturn: leave.toDate,
    status:         'generated',
  })

  leave.outpass = outpass._id
  await leave.save()

  return outpass
}

// GET /api/leave/all — admin/warden sees all leaves
const getAllLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find()
      .populate('student', 'name rollNumber department hostelBlock')
      .populate('outpass')
      .sort({ createdAt: -1 })
      .limit(100)

    res.json({ success: true, leaves })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { applyLeave, getMyLeaves, getPendingLeaves, processLeave, getAllLeaves }