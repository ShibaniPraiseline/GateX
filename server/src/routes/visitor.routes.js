const express = require('express')
const {
  createVisitor, getMyVisitors, getPendingVisitors,
  confirmVisitor, approveVisitor, scanVisitor, getAllVisitors
} = require('../controllers/visitor.controller')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

router.use(protect)

router.post('/request',        authorize('student'),                    createVisitor)
router.get('/my',              authorize('student'),                    getMyVisitors)
router.post('/:id/confirm',    authorize('student'),                    confirmVisitor)
router.get('/pending',         authorize('warden'),                     getPendingVisitors)
router.post('/:id/approve',    authorize('warden'),                     approveVisitor)
router.post('/scan',           authorize('security'),                   scanVisitor)
router.get('/all',             authorize('warden', 'admin'),            getAllVisitors)

module.exports = router