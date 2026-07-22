const User = require('../models/User')

// POST /api/admin/create-staff
const createStaff = async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    const allowedRoles = ['warden', 'tutor', 'security', 'admin']

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid staff role' })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' })
    }

    const user = await User.create({ name, email, password, role, isActive: true })

    res.status(201).json({
      success: true,
      message: `${role} account created successfully`,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/admin/students
const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student', isActive: true })
      .select('name email rollNumber department hostelBlock roomNumber year')
      .sort({ name: 1 })
    res.json({ success: true, students })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/admin/staff
const getStaff = async (req, res) => {
  try {
    const staff = await User.find({
      role: { $in: ['warden', 'tutor', 'security', 'admin'] },
      isActive: true
    }).select('name email role createdAt').sort({ role: 1 })
    res.json({ success: true, staff })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/admin/link-parent
const linkParent = async (req, res) => {
  try {
    const { studentId, parentEmail, parentName, parentPassword } = req.body

    const student = await User.findById(studentId)
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })

    // Check if parent already exists
    let parent = await User.findOne({ email: parentEmail })

    if (!parent) {
      // Create parent account
      parent = await User.create({
        name:          parentName,
        email:         parentEmail,
        password:      parentPassword,
        role:          'parent',
        linkedStudent: studentId,
      })
    } else {
      // Link existing parent to student
      parent.linkedStudent = studentId
      await parent.save()
    }

    res.json({
      success: true,
      message: `Parent ${parent.name} linked to ${student.name}`,
      parent: { id: parent._id, name: parent.name, email: parent.email }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/admin/link-tutor
const linkTutor = async (req, res) => {
  try {
    const { tutorId, studentIds } = req.body

    const tutor = await User.findById(tutorId)
    if (!tutor || tutor.role !== 'tutor') {
      return res.status(404).json({ success: false, message: 'Tutor not found' })
    }

    tutor.assignedStudents = studentIds
    await tutor.save()

    res.json({ success: true, message: `${studentIds.length} students assigned to ${tutor.name}` })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// DELETE /api/admin/user/:id
const deactivateUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false })
    res.json({ success: true, message: 'User deactivated' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { createStaff, getStudents, getStaff, linkParent, linkTutor, deactivateUser }