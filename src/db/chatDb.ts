import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/db/messages.json');

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string;
}

// Ensure the db directory and file exist
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify([]));
}

export function getMessages(): ChatMessage[] {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading messages database:", error);
    return [];
  }
}

export function saveMessage(message: ChatMessage): void {
  try {
    const messages = getMessages();
    messages.push(message);
    
    // Optional: Keep only the last 1000 messages to prevent infinite file growth
    if (messages.length > 1000) {
      messages.shift();
    }
    
    fs.writeFileSync(DB_PATH, JSON.stringify(messages, null, 2));
  } catch (error) {
    console.error("Error writing to messages database:", error);
  }
}
