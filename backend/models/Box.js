const mongoose = require("mongoose");
const Counter = require("./Counter");

const boxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true
    },
    number: {
      type: Number,
      required: true,
      unique: true,
      min: 1
    },
    rent: {
      type: Number,
      required: true,
      min: 0
    },
    rentExpiresAt: {
      type: Date,
      default: null
    },
    boutique: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

boxSchema.pre("validate", async function () {
  if (this.isNew && !this.number) {
    const counter = await Counter.findOneAndUpdate(
      { name: "box" },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );
    this.number = counter.seq;
  }

  if (!this.name && this.number) {
    this.name = `B${this.number}`;
  }
});

module.exports = mongoose.model("Box", boxSchema);
