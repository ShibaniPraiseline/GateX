const Announcement = require('../models/Announcement')

const createAnnouncement = async (req, res) => {
  try {
    const { title, body, audience, expiresAt } = req.body
    const announcement = await Announcement.create({
      title, body, audience: audience || ['all'],
      postedBy: req.user._id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    res.status(201).json({ success: true, announcement })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getAnnouncements = async (req, res) => {
  try {
    const { role } = req.user
    const now = new Date()
    const announcements = await Announcement.find({
      $or: [{ audience: 'all' }, { audience: role }],
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .populate('postedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(20)
    res.json({ success: true, announcements })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const deleteAnnouncement = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { createAnnouncement, getAnnouncements, deleteAnnouncement }