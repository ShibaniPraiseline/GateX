const mongoose = require('mongoose')

const visitorSchema = new mongoose.Schema({
  student:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  visitorName:   { type: String, required: true },
  visitorPhone:  { type: String, required: true },
  relation:      { type: String, required: true }, // father, mother, guardian
  purpose:       { type: String, required: true },
  visitDate:     { type: Date, required: true },

  studentConfirmed: { type: Boolean, default: false },
  wardenApproved:   { type: Boolean, default: false },

  qrToken:  { type: String, unique: true, sparse: true },
  qrImage:  { type: String },

  status: {
    type: String,
    enum: ['pending','student_confirmed','approved','rejected','visited'],
    default: 'pending'
  },

  entryTime: { type: Date },
  exitTime:  { type: Date },
}, { timestamps: true })

module.exports = mongoose.model('Visitor', visitorSchema)