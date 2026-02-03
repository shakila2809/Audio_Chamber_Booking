require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Config
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const OWNER_EMAILS = ['kumpraveen@meta.com', 'karthipai@meta.com'];
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false,
});

// Models
const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING, defaultValue: 'user' },
});

const Booking = sequelize.define('Booking', {
  requester_name: { type: DataTypes.STRING, allowNull: false },
  requester_email: { type: DataTypes.STRING, allowNull: false },
  booking_date: { type: DataTypes.DATEONLY, allowNull: false },
  time_slot: { type: DataTypes.STRING, allowNull: false },
  purpose: { type: DataTypes.TEXT, allowNull: false },
  additional_notes: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  approval_token: { type: DataTypes.STRING },
  approved_by: { type: DataTypes.STRING },
  approval_date: { type: DataTypes.DATE },
  rejection_reason: { type: DataTypes.TEXT },
  user_id: { type: DataTypes.INTEGER },
});

const TIME_SLOTS = {
  slot1: { name: 'Morning', display: '9:00 AM - 1:00 PM' },
  slot2: { name: 'Afternoon', display: '1:00 PM - 5:00 PM' },
  slot3: { name: 'Evening', display: '5:00 PM - 9:00 PM' },
};

// Email Setup
let transporter = null;

async function setupEmail() {
  try {
    console.log('Setting up test email...');
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log('');
    console.log('========================================');
    console.log('EMAIL CONFIGURED - View emails at:');
    console.log('https://ethereal.email/login');
    console.log('Email: ' + testAccount.user);
    console.log('Password: ' + testAccount.pass);
    console.log('========================================');
    console.log('');
  } catch (error) {
    console.log('Email setup failed:', error.message);
    transporter = null;
  }
}

async function sendEmail(to, subject, html) {
  const recipients = Array.isArray(to) ? to.join(', ') : to;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: 'Audio Chamber <booking@test.com>',
        to: recipients,
        subject: subject,
        html: html,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('Email sent to: ' + recipients);
      if (previewUrl) {
        console.log('Preview URL: ' + previewUrl);
      }
      return true;
    } catch (error) {
      console.log('Email error:', error.message);
    }
  }

  console.log('Email (not sent): To=' + recipients + ', Subject=' + subject);
  return false;
}

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  jwt.verify(token, JWT_SECRET, function(err, user) {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, function(err, user) {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
}

function requireRole(roles) {
  return function(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// AUTH ROUTES
app.post('/api/auth/register', async function(req, res) {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existing = await User.findOne({ where: { email: email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const isOwner = OWNER_EMAILS.map(function(e) { return e.toLowerCase(); }).includes(email.toLowerCase());
    const role = isOwner ? 'owner' : 'user';

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name, email: email, password: hashedPassword, role: role });

    console.log('User registered: ' + email + ' (' + role + ')');

    const token = generateToken(user);
    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async function(req, res) {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User logged in: ' + email);

    const token = generateToken(user);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async function(req, res) {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// BOOKING ROUTES
app.get('/api/bookings', optionalAuth, async function(req, res) {
  try {
    const bookings = await Booking.findAll({ order: [['createdAt', 'DESC']] });

    const result = bookings.map(function(b) {
      return {
        id: b.id,
        requester_name: b.requester_name,
        requester_email: b.requester_email,
        booking_date: b.booking_date,
        time_slot: b.time_slot,
        time_slot_display: TIME_SLOTS[b.time_slot] ? TIME_SLOTS[b.time_slot].display : b.time_slot,
        purpose: b.purpose,
        status: b.status,
        approved_by: b.approved_by
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bookings/availability/:date', async function(req, res) {
  try {
    const date = req.params.date;
    const bookings = await Booking.findAll({
      where: { booking_date: date, status: ['approved', 'pending'] }
    });

    const availability = {};
    var slotIds = Object.keys(TIME_SLOTS);

    for (var i = 0; i < slotIds.length; i++) {
      var slotId = slotIds[i];
      var booking = null;

      for (var j = 0; j < bookings.length; j++) {
        if (bookings[j].time_slot === slotId) {
          booking = bookings[j];
          break;
        }
      }

      if (booking) {
        availability[slotId] = { available: false, status: booking.status };
      } else {
        availability[slotId] = { available: true };
      }
    }

    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bookings/token/:token', async function(req, res) {
  try {
    const booking = await Booking.findOne({ where: { approval_token: req.params.token } });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      id: booking.id,
      requester_name: booking.requester_name,
      requester_email: booking.requester_email,
      booking_date: booking.booking_date,
      time_slot_display: TIME_SLOTS[booking.time_slot] ? TIME_SLOTS[booking.time_slot].display : booking.time_slot,
      purpose: booking.purpose,
      status: booking.status,
      approved_by: booking.approved_by
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings', optionalAuth, async function(req, res) {
  try {
    const requester_name = req.body.requester_name;
    const requester_email = req.body.requester_email;
    const booking_date = req.body.booking_date;
    const time_slot = req.body.time_slot;
    const purpose = req.body.purpose;
    const additional_notes = req.body.additional_notes;

    if (!requester_name || !requester_email || !booking_date || !time_slot || !purpose) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existing = await Booking.findOne({
      where: { booking_date: booking_date, time_slot: time_slot, status: 'approved' }
    });

    if (existing) {
      return res.status(400).json({ error: 'Slot already booked' });
    }

    const approval_token = crypto.randomBytes(32).toString('hex');

    const booking = await Booking.create({
      requester_name: requester_name,
      requester_email: requester_email,
      booking_date: booking_date,
      time_slot: time_slot,
      purpose: purpose,
      additional_notes: additional_notes,
      approval_token: approval_token,
      user_id: req.user ? req.user.id : null
    });

    console.log('Booking created: #' + booking.id + ' by ' + requester_name);

    // Send email to owners
    var approvalUrl = FRONTEND_URL + '/approve/' + approval_token;
    var slotDisplay = TIME_SLOTS[time_slot] ? TIME_SLOTS[time_slot].display : time_slot;

    var emailHtml = '<div style="font-family: Arial; max-width: 500px;">' +
      '<h2 style="background: #667eea; color: white; padding: 20px; margin: 0;">New Booking Request</h2>' +
      '<div style="padding: 20px; background: #f3f4f6;">' +
      '<p><strong>From:</strong> ' + requester_name + '</p>' +
      '<p><strong>Email:</strong> ' + requester_email + '</p>' +
      '<p><strong>Date:</strong> ' + booking_date + '</p>' +
      '<p><strong>Time:</strong> ' + slotDisplay + '</p>' +
      '<p><strong>Purpose:</strong> ' + purpose + '</p>' +
      '</div>' +
      '<div style="padding: 20px; text-align: center;">' +
      '<a href="' + approvalUrl + '" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review & Approve</a>' +
      '</div></div>';

    await sendEmail(OWNER_EMAILS, 'New Booking Request - ' + booking_date, emailHtml);

    res.status(201).json({
      message: 'Booking submitted!',
      booking: { id: booking.id, status: 'pending' }
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings/:id/approve', authenticateToken, requireRole(['owner', 'admin']), async function(req, res) {
  try {
    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.status = 'approved';
    booking.approved_by = req.user.name;
    booking.approval_date = new Date();
    await booking.save();

    console.log('Booking #' + booking.id + ' APPROVED by ' + req.user.name);

    // Send email to requester
    var slotDisplay = TIME_SLOTS[booking.time_slot] ? TIME_SLOTS[booking.time_slot].display : booking.time_slot;

    var emailHtml = '<div style="font-family: Arial; max-width: 500px;">' +
      '<h2 style="background: #10b981; color: white; padding: 20px; margin: 0;">Booking Approved!</h2>' +
      '<div style="padding: 20px; background: #f3f4f6;">' +
      '<p>Your Audio Chamber booking has been approved!</p>' +
      '<p><strong>Date:</strong> ' + booking.booking_date + '</p>' +
      '<p><strong>Time:</strong> ' + slotDisplay + '</p>' +
      '<p><strong>Approved by:</strong> ' + booking.approved_by + '</p>' +
      '</div></div>';

    await sendEmail(booking.requester_email, 'Booking Approved - ' + booking.booking_date, emailHtml);

    res.json({
      message: 'Approved!',
      booking: { id: booking.id, status: 'approved', approved_by: booking.approved_by }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings/:id/reject', authenticateToken, requireRole(['owner', 'admin']), async function(req, res) {
  try {
    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.status = 'rejected';
    booking.approved_by = req.user.name;
    booking.approval_date = new Date();
    booking.rejection_reason = req.body.reason || '';
    await booking.save();

    console.log('Booking #' + booking.id + ' REJECTED by ' + req.user.name);

    // Send email to requester
    var slotDisplay = TIME_SLOTS[booking.time_slot] ? TIME_SLOTS[booking.time_slot].display : booking.time_slot;
    var reasonText = req.body.reason ? '<p><strong>Reason:</strong> ' + req.body.reason + '</p>' : '';

    var emailHtml = '<div style="font-family: Arial; max-width: 500px;">' +
      '<h2 style="background: #ef4444; color: white; padding: 20px; margin: 0;">Booking Rejected</h2>' +
      '<div style="padding: 20px; background: #f3f4f6;">' +
      '<p>Your booking request has been rejected.</p>' +
      '<p><strong>Date:</strong> ' + booking.booking_date + '</p>' +
      '<p><strong>Time:</strong> ' + slotDisplay + '</p>' +
      reasonText +
      '</div></div>';

    await sendEmail(booking.requester_email, 'Booking Rejected - ' + booking.booking_date, emailHtml);

    res.json({
      message: 'Rejected',
      booking: { id: booking.id, status: 'rejected' }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', function(req, res) {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Start Server
sequelize.sync().then(async function() {
  console.log('Database ready');
  await setupEmail();
  app.listen(PORT, function() {
    console.log('Server running on http://localhost:' + PORT);
  });
}).catch(function(err) {
  console.error('Database error:', err);
});
