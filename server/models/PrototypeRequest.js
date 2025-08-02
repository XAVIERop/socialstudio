const mongoose = require('mongoose');

const PrototypeRequestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  business_type: { type: String, required: true, trim: true },
  website: { type: String, trim: true },
  message: { type: String, trim: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PrototypeRequest', PrototypeRequestSchema);
