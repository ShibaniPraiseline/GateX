const express = require('express')
const { getDashboardStats, getLateReturns, getMonthlyReport } = require('../controllers/dashboard.controller')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

router.use(protect)
router.use(authorize('admin', 'warden', 'security'))

router.get('/stats',          getDashboardStats)
router.get('/late-returns',   getLateReturns)
router.get('/monthly-report', getMonthlyReport)

module.exports = router