const mongoose = require('mongoose')

const outpassSchema = new mongoose.Schema({
  leaveRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest', required: true },
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  qrToken:      { type: String, required: true, unique: true }, // unique UUID stored here
  qrImage:      { type: String },                               // base64 QR image

  expectedReturn: { type: Date, required: true },
  exitTime:       { type: Date },
  entryTime:      { type: Date },

  status: {
    type: String,
    enum: ['generated','exited','returned','expired','late'],
    default: 'generated'
  },

  scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // security officer
}, { timestamps: true })

module.exports = mongoose.model('Outpass', outpassSchema)