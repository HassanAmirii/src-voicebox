import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: [20, "Title must be at least 10 characters long"],
      maxlength: [
        30,
        "limit title to 30 characters, you can espress more in comment section",
      ],
      trim: true,
    },
    tags: {
      type: [String],
      required: true,
      enum: [
        "Assault",
        "Mockery",
        "Unfair Academic Challenge",
        "Class Disturbance",
        "Harassment",
        "Bullying",
        "Discrimination",
        "Lab Safety",
        "Hostel Safety",
        "Lecturer Misconduct",
        "Peer Threat",
        "Mental Health Distress",
      ],
      validate: {
        validator: function (pickedTag) {
          return Array.isArray(pickedTag) && pickedTag.length > 0;
        },
        message: "you must select atleast one tag",
      },
    },
    identity: {
      type: String,
      select: false,
      default: "Anonymous",
      required: true,
      trim: true,
    },
    comment: {
      type: String,
      minlength: [
        150,
        "Please describe the incident in more detail (150 chars min) to help us take action.",
      ],
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      default: "Unhandled",
      enum: ["Unhandled", "Queue", "Handled"],
      trim: true,
    },

    adminNote: {
      type: String,
      validate: {
        Validator: function (v) {
          if (this.status === "Handled" || this.status === "Queue") {
            return typeof v === "string" && v.trim().length > 10;
          }
          return true;
        },
      },
      message:
        "An admin note of at least 10 characters is required when updating status.",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Report", reportSchema);
