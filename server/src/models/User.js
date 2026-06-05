const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  password:    { type: String, required: true },
  role:        { type: String, enum: ['student','parent','tutor','warden','security','admin'], required: true },
  googleId:    { type: String },          // only for student & parent OAuth

  // Student-specific fields
  rollNumber:  { type: String },
  department:  { type: String },
  hostelBlock: { type: String },
  roomNumber:  { type: String },
  year:        { type: Number },

  // Parent-specific — links parent to their child
  linkedStudent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Tutor/Warden — which students they manage
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  isActive:    { type: Boolean, default: true },
}, { timestamps: true })

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('User', userSchema)