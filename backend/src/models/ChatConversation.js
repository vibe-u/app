import mongoose from "mongoose";

const chatConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        required: true,
      },
    ],
    participantsHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    lastMessage: {
      type: String,
      default: "",
      trim: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

chatConversationSchema.pre("validate", function (next) {
  if (!Array.isArray(this.participants) || this.participants.length !== 2) {
    return next(new Error("A conversation must have exactly 2 participants"));
  }

  const normalized = this.participants.map((id) => id.toString()).sort();
  if (normalized[0] === normalized[1]) {
    return next(new Error("Participants must be different users"));
  }

  this.participantsHash = normalized.join(":");
  this.participants = normalized.map((id) => new mongoose.Types.ObjectId(id));
  next();
});

chatConversationSchema.index({ participants: 1 });

export default mongoose.model("ChatConversation", chatConversationSchema);
