const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    boutique: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Boutique",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    image: {
      type: String,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Article", articleSchema);
