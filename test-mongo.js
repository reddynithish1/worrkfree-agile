import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.log("No MONGODB_URI");
  process.exit(1);
}

const ChatMessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  projectId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String },
  message: { type: String, required: true },
  timestamp: { type: String, required: true }
}, { collection: 'workspace_chats' });

const ChatMessageModel = mongoose.model('ChatMessage', ChatMessageSchema);

async function run() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
    const msg = {
      id: Date.now().toString(),
      projectId: "P1",
      userId: "U1",
      userName: "Test User",
      userAvatar: "",
      message: "Test message",
      timestamp: new Date().toISOString()
    };
    await ChatMessageModel.create(msg);
    console.log("Saved successfully!");
    const msgs = await ChatMessageModel.find({ projectId: "P1" });
    console.log("Fetched:", msgs);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
run();
