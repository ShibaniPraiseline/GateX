const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:      { type: String, required: true },
  action:    { type: String, required: true },  // e.g. 'LEAVE_APPLIED', 'WARDEN_APPROVED'
  targetId:  { type: mongoose.Schema.Types.ObjectId }, // the leave/outpass/visitor being acted on
  targetModel: { type: String },                // 'LeaveRequest', 'Outpass', etc.
  metadata:  { type: mongoose.Schema.Types.Mixed }, // any extra context
}, { timestamps: true })

// Never update audit logs — insert only
auditLogSchema.set('strict', true)

module.exports = mongoose.model('AuditLog', auditLogSchema)