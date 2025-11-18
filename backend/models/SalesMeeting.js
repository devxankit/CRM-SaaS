const mongoose = require('mongoose');

const salesMeetingSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Sales', required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'Sales', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  meetingDate: { type: Date, required: true },
  meetingTime: { type: String, required: true },
  meetingType: { type: String, enum: ['in-person', 'video', 'phone'], default: 'in-person' },
  location: { type: String, trim: true },
  notes: { type: String, trim: true },
  status: { 
    type: String, 
    enum: ['scheduled', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  completedAt: { type: Date }
}, { timestamps: true });

salesMeetingSchema.index({ assignee: 1, meetingDate: 1 });

module.exports = mongoose.model('SalesMeeting', salesMeetingSchema);


