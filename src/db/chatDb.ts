import { ChatMessageModel } from "./models";

export interface ChatMessage {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: string;
}

export async function getMessages(projectId: string): Promise<ChatMessage[]> {
  try {
    // Fetch last 50 messages and sort by timestamp
    const messages = await ChatMessageModel.find({ projectId })
      .sort({ timestamp: 1 })
      .limit(50)
      .lean();
      
    return messages.map((m: any) => ({
      id: m.id,
      projectId: m.projectId,
      userId: m.userId,
      userName: m.userName,
      userAvatar: m.userAvatar,
      message: m.message,
      timestamp: m.timestamp
    }));
  } catch (error) {
    console.error("Error reading messages from DB:", error);
    return [];
  }
}

export async function saveMessage(msg: ChatMessage): Promise<void> {
  try {
    await ChatMessageModel.create({
      id: msg.id,
      projectId: msg.projectId,
      userId: msg.userId,
      userName: msg.userName,
      userAvatar: msg.userAvatar,
      message: msg.message,
      timestamp: msg.timestamp
    });
  } catch (error) {
    console.error("Error saving message to DB:", error);
  }
}
