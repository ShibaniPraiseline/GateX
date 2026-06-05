const mongoose = require('mongoose')

const approvalSchema = new mongoose.Schema({
  role:      { type: String, enum: ['parent','tutor','warden'] },
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:    { type: String, enum: ['pending','approved','rejected','clarification'], default: 'pending' },
  comment:   { type: String },
  actionAt:  { type: Date },
}, { _id: false })

const leaveRequestSchema = new mongoose.Schema({
  student:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:        { type: String, enum: ['regular','weekend','medical','emergency'], required: true },
  reason:      { type: String, required: true },
  destination: { type: String, required: true },
  fromDate:    { type: Date, required: true },
  toDate:      { type: Date, required: true },

  // The full approval chain — stored as array so we can track each stage
  approvals: {
    parent:  { type: approvalSchema, default: () => ({ role: 'parent',  status: 'pending' }) },
    tutor:   { type: approvalSchema, default: () => ({ role: 'tutor',   status: 'pending' }) },
    warden:  { type: approvalSchema, default: () => ({ role: 'warden',  status: 'pending' }) },
  },

  // Overall status — computed from approvals
  status: {
    type: String,
    enum: ['pending','parent_approved','tutor_approved','fully_approved','rejected'],
    default: 'pending'
  },

  isEmergency: { type: Boolean, default: false },
  outpass:     { type: mongoose.Schema.Types.ObjectId, ref: 'Outpass' },
}, { timestamps: true })

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema)