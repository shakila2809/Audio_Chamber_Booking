const express = require('express');
const crypto = require('crypto');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const CalendarService = require('../services/calendarService');
const nodemailer = require('nodemailer');

const TIME_SLOTS = {
  slot1: { name: 'Morning', start: '09:00', end: '13:00', display: '9:00 AM - 1:00 PM' },
  slot2: { name: 'Afternoon', start: '13:00', end: '17:00', display: '1:00 PM - 5:00 PM' },
  slot3: { name: 'Evening', start: '17:00', end: '21:00', display: '5:00 PM - 9:00 PM' },
};

const OWNERS = ['kumpraveen@meta.com', 'karthipai@meta.com'];

// Delete booking (only by owner or the user who created it)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Only allow if user is owner/admin or the booking creator
    if (
      req.user.role !== 'owner' &&
      req.user.role !== 'admin' &&
      booking.user_id !== req.user.id
    ) {
      return res.status(403).json({ error: 'Not authorized to delete this booking' });
    }

    await booking.destroy();
    res.json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = (db) => {
  const router = express.Router();
  const { Booking, User } = db;

  // Email transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Helper: Format booking
  const formatBooking = (booking) => ({
    id: booking.id,
    requester_name: booking.requester_name,
    requester_email: booking.requester_email,
    booking_date: booking.booking_date,
    time_slot: booking.time_slot,
    time_slot_display: TIME_SLOTS[booking.time_slot]?.display || booking.time_slot,
    purpose: booking.purpose,
    additional_notes: booking.additional_notes,
    status: booking.status,
    approved_by: booking.approved_by,
    approval_date: booking.approval_date,
    created_at: booking.createdAt,
  });

  // Get all bookings
  router.get('/', optionalAuth, async (req, res) => {
    try {
      const { date, status } = req.query;
      const where = {};
      if (date) where.booking_date = date;
      if (status) where.status = status;

      const bookings = await Booking.findAll({
        where,
        order: [['createdAt', 'DESC']]
      });
      res.json(bookings.map(formatBooking));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get availability
  router.get('/availability/:date', async (req, res) => {
    try {
      const { date } = req.params;
      const bookings = await Booking.findAll({
        where: { booking_date: date, status: ['approved', 'pending'] },
      });

      const availability = {};
      Object.keys(TIME_SLOTS).forEach(slotId => {
        const booking = bookings.find(b => b.time_slot === slotId);
        availability[slotId] = booking
          ? { available: false, status: booking.status, booked_by: booking.status === 'approved' ? booking.requester_name : 'Pending' }
          : { available: true };
      });

      res.json(availability);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get booking by token
  router.get('/token/:token', async (req, res) => {
    try {
      const booking = await Booking.findOne({ where: { approval_token: req.params.token } });
      if (!booking) return res.status(404).json({ error: 'Booking not found' });
      res.json(formatBooking(booking));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create booking
  router.post('/', optionalAuth, async (req, res) => {
    try {
      const { requester_name, requester_email, booking_date, time_slot, purpose, additional_notes } = req.body;

      // Check existing
      const existing = await Booking.findOne({
        where: { booking_date, time_slot, status: 'approved' },
      });
      if (existing) {
        return res.status(400).json({ error: 'Time slot already booked' });
      }

      const booking = await Booking.create({
        requester_name: req.user?.name || requester_name,
        requester_email: req.user?.email || requester_email,
        booking_date,
        time_slot,
        purpose,
        additional_notes,
        approval_token: crypto.randomBytes(32).toString('hex'),
        user_id: req.user?.id || null,
      });

      // Send email notification
      try {
        const approvalUrl = `${process.env.FRONTEND_URL}/approve/${booking.approval_token}`;
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: OWNERS.join(', '),
          subject: `🔔 New Booking Request - ${booking_date}`,
          html: `
            <h2>New Booking Request</h2>
            <p><strong>Requester:</strong> ${booking.requester_name}</p>
            <p><strong>Date:</strong> ${booking_date}</p>
            <p><strong>Time:</strong> ${TIME_SLOTS[time_slot]?.display}</p>
            <p><strong>Purpose:</strong> ${purpose}</p>
            <a href="${approvalUrl}">Review & Approve/Reject</a>
          `,
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      res.status(201).json({ message: 'Booking submitted', booking: formatBooking(booking) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Approve booking
  router.post('/:id/approve', authenticateToken, requireRole('owner', 'admin'), async (req, res) => {
    try {
      const booking = await Booking.findByPk(req.params.id);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });

      const approver = await User.findByPk(req.user.id);
      let calendarEventId = null;

      // Create calendar event if Microsoft connected
      if (approver.microsoftAccessToken) {
        try {
          const calendarService = new CalendarService(approver);
          const event = await calendarService.createBookingEvent(booking, OWNERS);
          calendarEventId = event.id;
        } catch (calendarError) {
          console.error('Calendar error:', calendarError);
        }
      }

      booking.status = 'approved';
      booking.approved_by = req.user.name;
      booking.approval_date = new Date();
      booking.calendar_event_id = calendarEventId;
      await booking.save();

      // Send confirmation email
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: booking.requester_email,
          subject: `✅ Booking Approved - ${booking.booking_date}`,
          html: `<h2>Your booking has been approved!</h2><p>Date: ${booking.booking_date}</p><p>Time: ${TIME_SLOTS[booking.time_slot]?.display}</p>`,
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      res.json({ message: 'Booking approved', booking: formatBooking(booking) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reject booking
  router.post('/:id/reject', authenticateToken, requireRole('owner', 'admin'), async (req, res) => {
    try {
      const { reason } = req.body;
      const booking = await Booking.findByPk(req.params.id);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });

      booking.status = 'rejected';
      booking.approved_by = req.user.name;
      booking.approval_date = new Date();
      booking.rejection_reason = reason;
      await booking.save();

      // Send rejection email
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: booking.requester_email,
          subject: `❌ Booking Rejected - ${booking.booking_date}`,
          html: `<h2>Your booking has been rejected</h2><p>${reason || 'No reason provided'}</p>`,
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      res.json({ message: 'Booking rejected', booking: formatBooking(booking) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });



  return router;
};
