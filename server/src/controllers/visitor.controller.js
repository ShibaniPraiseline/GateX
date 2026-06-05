const Visitor  = require('../models/Visitor')
const { v4: uuidv4 } = require('uuid')
const QRCode   = require('qrcode')

// POST /api/visitor/request — visitor pre-registers
const createVisitor = async (req, res) => {
  try {
    const { visitorName, visitorPhone, relation, purpose, visitDate } = req.body

    const visitor = await Visitor.create({
      student:      req.user._id,
      visitorName,
      visitorPhone,
      relation,
      purpose,
      visitDate:    new Date(visitDate),
    })

    res.status(201).json({ success: true, message: 'Visitor request created', visitor })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/visitor/my — student sees their visitor requests
const getMyVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find({ student: req.user._id }).sort({ createdAt: -1 })
    res.json({ success: true, visitors })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/visitor/pending — warden sees pending visitor requests
const getPendingVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find({
      studentConfirmed: true,
      wardenApproved:   false,
      status:           'student_confirmed'
    }).populate('student', 'name rollNumber hostelBlock roomNumber')
    res.json({ success: true, visitors })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/visitor/:id/confirm — student confirms visitor
const confirmVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ _id: req.params.id, student: req.user._id })
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' })

    visitor.studentConfirmed = true
    visitor.status           = 'student_confirmed'
    await visitor.save()

    res.json({ success: true, message: 'Visitor confirmed', visitor })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/visitor/:id/approve — warden approves visitor
const approveVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id)
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' })

    const { action } = req.body

    if (action === 'rejected') {
      visitor.status = 'rejected'
      await visitor.save()
      return res.json({ success: true, message: 'Visitor rejected' })
    }

    // Generate QR pass
    const qrToken = uuidv4()
    const qrData  = JSON.stringify({
      token:       qrToken,
      visitorName: visitor.visitorName,
      visitDate:   visitor.visitDate,
    })
    const qrImage = await QRCode.toDataURL(qrData)

    visitor.wardenApproved = true
    visitor.status         = 'approved'
    visitor.qrToken        = qrToken
    visitor.qrImage        = qrImage
    await visitor.save()

    res.json({ success: true, message: 'Visitor approved, QR generated', visitor })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/visitor/:id/scan — security scans visitor QR
const scanVisitor = async (req, res) => {
  try {
    const { qrToken } = req.body
    const visitor = await Visitor.findOne({ qrToken })
      .populate('student', 'name rollNumber hostelBlock')

    if (!visitor) return res.status(404).json({ success: false, message: 'Invalid visitor QR' })
    if (visitor.status === 'visited') return res.status(400).json({ success: false, message: 'Visitor already checked in' })

    const now = new Date()

    if (!visitor.entryTime) {
      visitor.entryTime = now
      visitor.status    = 'visited'
      await visitor.save()
      return res.json({ success: true, message: `Visitor ${visitor.visitorName} checked in`, visitor })
    }

    visitor.exitTime = now
    await visitor.save()
    res.json({ success: true, message: `Visitor ${visitor.visitorName} checked out`, visitor })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/visitor/all — warden/admin sees all visitors
const getAllVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find()
      .populate('student', 'name rollNumber hostelBlock')
      .sort({ createdAt: -1 })
      .limit(100)
    res.json({ success: true, visitors })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { createVisitor, getMyVisitors, getPendingVisitors, confirmVisitor, approveVisitor, scanVisitor, getAllVisitors }