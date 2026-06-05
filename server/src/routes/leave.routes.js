const express = require('express')
const {
  applyLeave, getMyLeaves, getPendingLeaves, processLeave, getAllLeaves
} = require('../controllers/leave.controller')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

// All leave routes require login
router.use(protect)

router.post('/apply',          authorize('student'),                          applyLeave)
router.get('/my',              authorize('student'),                          getMyLeaves)
router.get('/pending',         authorize('parent','tutor','warden'),          getPendingLeaves)
router.post('/:id/approve',    authorize('parent','tutor','warden'),          processLeave)
router.get('/all',             authorize('admin','warden'),                   getAllLeaves)

module.exports = router