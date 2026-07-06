import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, X, MessageSquare, User } from 'lucide-react';

interface ChatMessage {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: string;
}

interface ChatPanelProps {
  user: { id: string; name: string; avatar?: string };
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatPanel({ user, projectId, isOpen, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen || !projectId) return;

    // Fetch initial chat history from the backend
    fetch(`/api/projects/${projectId}/chat`)
      .then(res => res.json())
      .then(data => {
        setMessages(data || []);
        scrollToBottom();
      })
      .catch(err => console.error("Error fetching chat history", err));

    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('new_message', (msg: ChatMessage) => {
      // Only process messages for the current project
      if (msg.projectId === projectId) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    });

    newSocket.on('user_typing', (userName: string) => {
      if (userName === user.name) return;
      
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.add(userName);
        return next;
      });

      setTimeout(() => {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(userName);
          return next;
        });
      }, 3000);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user.name, isOpen, projectId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !projectId) return;

    socket.emit('send_message', {
      projectId: projectId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      message: inputText.trim()
    });

    setInputText('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (socket) {
      socket.emit('typing', user.name);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 md:inset-auto md:right-0 md:top-0 h-screen w-full md:w-96 glass-sidebar flex flex-col z-50 shadow-2xl md:border-l border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-slate-900">Workspace Chat</h2>
        </div>
        <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 mt-10">No messages yet. Say hi! 👋</div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.userId === user.id;
            const showHeader = index === 0 || messages[index - 1].userId !== msg.userId;
            
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {showHeader && !isMe && (
                  <span className="text-xs text-slate-500 ml-9 mb-1">{msg.userName}</span>
                )}
                
                <div className={`flex gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  {(!isMe && showHeader) ? (
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-300">
                      {msg.userAvatar ? (
                        <img src={msg.userAvatar} alt={msg.userName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  ) : (
                    <div className="w-7 h-7 flex-shrink-0" /> // Spacer for alignment
                  )}

                  {/* Message Bubble */}
                  <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-slate-900 rounded-tl-sm border border-slate-200 shadow-sm'}`}>
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {typingUsers.size > 0 && (
          <div className="text-xs text-slate-500 italic ml-9">
            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-50/80 border-t border-slate-200">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-full border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 rounded-full bg-blue-600 text-white disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
