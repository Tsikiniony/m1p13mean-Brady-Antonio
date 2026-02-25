const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    boutique: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Boutique',
      required: true,
      index: true
    },
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
      index: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },
  { timestamps: true }
);

stockSchema.index({ boutique: 1, article: 1 }, { unique: true });

module.exports = mongoose.model('Stock', stockSchema);
