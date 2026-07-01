import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("MONGODB_URI is not defined. Skipping MongoDB connection.");
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log("Successfully connected to MongoDB.");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}
