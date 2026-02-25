const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      required: true,
      index: true
    },
    boutique: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Boutique',
      required: true,
      index: true
    },
    mobile: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      lat: {
        type: Number,
        required: true,
        min: -90,
        max: 90
      },
      lng: {
        type: Number,
        required: true,
        min: -180,
        max: 180
      }
    },
    status: {
      type: String,
      enum: ['en_attente', 'en_cours', 'livre'],
      default: 'en_attente',
      index: true
    }
  },
  { timestamps: true }
);

deliverySchema.index({ purchase: 1 }, { unique: true });

module.exports = mongoose.model('Delivery', deliverySchema);
