const express = require('express')
const { scanQR, verifyOutpass, currentlyOutside } = require('../controllers/security.controller')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

router.use(protect)

router.post('/scan',               authorize('security'),              scanQR)
router.get('/outpass/:token',      authorize('security', 'warden'),   verifyOutpass)
router.get('/currently-outside',   authorize('security', 'warden', 'admin'), currentlyOutside)

module.exports = router