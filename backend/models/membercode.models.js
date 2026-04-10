import mongoose from "mongoose";
const memberCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 10,
      maxlength: 10,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 3600 * 1000), // Expires in an hour
    },
  },
  { timestamps: true },
);

memberCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model("MemberCode", memberCodeSchema);
