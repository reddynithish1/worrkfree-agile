import { ChatMessageModel } from "./models";

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string;
}

export async function getMessages(): Promise<ChatMessage[]> {
  try {
    // Fetch last 1000 messages and sort by timestamp
    const messages = await ChatMessageModel.find()
      .sort({ timestamp: 1 })
      .limit(1000)
      .lean();
      
    return messages.map((m: any) => ({
      id: m.id,
      userId: m.userId,
      userName: m.userName,
      userAvatar: m.userAvatar,
      text: m.text,
      timestamp: m.timestamp
    }));
  } catch (error) {
    console.error("Error reading messages from DB:", error);
    return [];
  }
}

export async function saveMessage(message: ChatMessage): Promise<void> {
  try {
    await ChatMessageModel.create({
      id: message.id,
      userId: message.userId,
      userName: message.userName,
      userAvatar: message.userAvatar,
      text: message.text,
      timestamp: message.timestamp
    });
  } catch (error) {
    console.error("Error saving message to DB:", error);
  }
}
