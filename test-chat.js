import mongoose from 'mongoose';
import { ChatMessageModel } from './src/db/models.js';

async function test() {
  await mongoose.connect('mongodb://localhost:27017/worrkfree'); // or whatever URI it uses locally.
  const msg = await ChatMessageModel.create({
    id: "test1",
    projectId: "test_project",
    userId: "u1",
    userName: "Test User",
    message: "Hello World",
    timestamp: new Date().toISOString()
  });
  console.log("Created:", msg);

  const found = await ChatMessageModel.find({ projectId: "test_project" });
  console.log("Found:", found);
  process.exit(0);
}

test().catch(console.error);
