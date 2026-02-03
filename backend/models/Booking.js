const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Booking = sequelize.define('Booking', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    requester_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    requester_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    booking_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time_slot: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    purpose: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    additional_notes: DataTypes.TEXT,
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
    },
    approval_token: {
      type: DataTypes.STRING,
      unique: true,
    },
    approved_by: DataTypes.STRING,
    approval_date: DataTypes.DATE,
    rejection_reason: DataTypes.TEXT,
    calendar_event_id: DataTypes.STRING,
    user_id: DataTypes.INTEGER,
  });

  // Delete booking (only by owner/admin or the user who created it)
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

  return Booking;
};
