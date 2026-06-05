const express = require('express')
const { createAnnouncement, getAnnouncements, deleteAnnouncement } = require('../controllers/announcement.controller')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

router.use(protect)

router.get('/',        getAnnouncements)
router.post('/',       authorize('admin', 'warden'), createAnnouncement)
router.delete('/:id',  authorize('admin'),            deleteAnnouncement)

module.exports = router