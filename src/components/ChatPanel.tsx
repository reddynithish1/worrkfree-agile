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
  projectMembers?: { id: string; displayName?: string; name?: string; avatar?: string }[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatPanel({ user, projectId, projectMembers = [], isOpen, onClose }: ChatPanelProps) {
  const [activeChannel, setActiveChannel] = useState<'project' | string>('project');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const socket = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Determine the effective ID for the current chat room (either project ID or DM ID)
  const getRoomId = () => {
    if (activeChannel === 'project') return projectId;
    return `dm_${[user.id, activeChannel].sort().join('_')}`;
  };

  const currentRoomId = getRoomId();

  useEffect(() => {
    if (!isOpen || !projectId) return;

    socket.current = io(window.location.origin, {
      withCredentials: true
    });
    
    socket.current.emit('join_project_room', currentRoomId);

    socket.current.on('new_chat_message', (message: ChatMessage) => {
      // Only process messages for the active room
      if (message.projectId === currentRoomId) {
        setMessages((prev) => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        scrollToBottom();
      }
    });

    socket.current.on('user_typing', (data: { userName: string }) => {
      if (data.userName === user.name) return;
      setTypingUser(data.userName);
    });

    socket.current.on('user_stopped_typing', (data: { userName: string }) => {
      if (data.userName === user.name) return;
      setTypingUser(null);
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [projectId, isOpen, user.name, currentRoomId]);

  useEffect(() => {
    if (!isOpen || !projectId) return;

    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/projects/${currentRoomId}/chat`, {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
        scrollToBottom();
      } catch (err) {
        console.error("Error fetching chat history", err);
      }
    };
    
    loadMessages();
  }, [projectId, isOpen, currentRoomId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !projectId) return;
    
    const messageText = inputValue.trim();
    setInputValue('');
    
    try {
      const res = await fetch(`/api/projects/${currentRoomId}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        credentials: 'include',
        body: JSON.stringify({ message: messageText })
      });
      
      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const savedMsg = await res.json();
      
      setMessages((prev) => {
        if (prev.some(m => m.id === savedMsg.id)) return prev;
        return [...prev, savedMsg];
      });
      scrollToBottom();

      if (socket.current) {
        socket.current.emit('typing_stop', {
          projectId: currentRoomId,
          userName: user.name
        });
      }
    } catch (error) {
      console.error('Send message failed:', error);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    if (socket.current) {
      socket.current.emit('typing_start', {
        projectId: currentRoomId,
        userName: user.name
      });
      
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      
      typingTimeout.current = setTimeout(() => {
        if (socket.current) {
          socket.current.emit('typing_stop', {
            projectId: currentRoomId,
            userName: user.name
          });
        }
      }, 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 md:inset-auto md:right-0 md:top-0 h-screen w-full md:w-[450px] bg-slate-50 flex flex-col z-50 shadow-2xl md:border-l border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shadow-sm z-10">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-slate-800">Chat</h2>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for Channels & DMs */}
        <div className="w-1/3 bg-slate-100 border-r border-slate-200 overflow-y-auto flex flex-col p-2 gap-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-2 mt-2">Channels</div>
          <button 
            onClick={() => setActiveChannel('project')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeChannel === 'project' ? 'bg-indigo-100 text-indigo-800 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            # Project Team
          </button>
          
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-2 mt-4">Direct Messages</div>
          {projectMembers.filter(m => m.id !== user.id).map(member => (
            <button
              key={member.id}
              onClick={() => setActiveChannel(member.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeChannel === member.id ? 'bg-indigo-100 text-indigo-800 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-300 flex-shrink-0 flex items-center justify-center">
                {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <User className="w-3 h-3 text-white" />}
              </div>
              <span className="truncate">{(member.displayName || member.name || 'Teammate').split(' ')[0]}</span>
            </button>
          ))}
          {projectMembers.filter(m => m.id !== user.id).length === 0 && (
            <div className="px-3 text-xs text-slate-400">No other teammates in this project yet.</div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Active Channel Header */}
          <div className="p-3 border-b border-slate-100 bg-white/50 backdrop-blur-sm text-sm font-semibold text-slate-700 flex items-center gap-2">
            {activeChannel === 'project' ? (
              <># Project Team</>
            ) : (
              <>
                <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-300 flex-shrink-0 flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                {(projectMembers.find(m => m.id === activeChannel)?.displayName || projectMembers.find(m => m.id === activeChannel)?.name || 'Teammate')}
              </>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="text-center text-slate-400 mt-10 text-sm bg-white/80 p-4 rounded-xl mx-auto shadow-sm border border-slate-100">
                No messages yet. <br/> <span className="font-medium text-slate-600">Start the conversation! 👋</span>
              </div>
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
                    <div className="w-7 h-7 flex-shrink-0" />
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
        
        {typingUser && (
          <div className="text-xs text-slate-500 italic ml-9">
            {typingUser} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-50/80 border-t border-slate-200">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-full border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2 rounded-full bg-blue-600 text-white disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
    </div>
    </div>
  );
}
