const express = require('express')
const {
  createStaff, getStudents, getStaff,
  linkParent, linkTutor, deactivateUser
} = require('../controllers/admin.controller')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

router.use(protect)
router.use(authorize('admin'))

router.post('/create-staff',  createStaff)
router.get('/students',       getStudents)
router.get('/staff',          getStaff)
router.post('/link-parent',   linkParent)
router.post('/link-tutor',    linkTutor)
router.delete('/user/:id',    deactivateUser)

module.exports = router