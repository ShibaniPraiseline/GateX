const mongoose = require('mongoose')

const announcementSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  body:      { type: String, required: true },
  postedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  audience:  { type: [String], enum: ['all','student','parent','tutor','warden','security'], default: ['all'] },
  expiresAt: { type: Date }, // optional — auto-hide old notices
}, { timestamps: true })

module.exports = mongoose.model('Announcement', announcementSchema)