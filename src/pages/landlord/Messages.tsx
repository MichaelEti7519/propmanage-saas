import React, { useState } from 'react';
import { 
  MessageSquare, 
  Search, 
  Send, 
  User, 
  Building,
  Phone,
  MoreVertical,
  Paperclip,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  isLandlord: boolean;
}

interface Conversation {
  id: string;
  tenantName: string;
  unit: string;
  property: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar?: string;
  status: 'Online' | 'Offline';
  messages: ChatMessage[];
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    tenantName: 'Sarah Jenkins',
    unit: '12B',
    property: 'Sunset Villas',
    lastMessage: 'I will drop off the spare keys tomorrow.',
    lastMessageTime: '10:45 AM',
    unreadCount: 2,
    status: 'Online',
    messages: [
      { id: 'm1', senderId: 'tenant-1', text: 'Hi, I need a spare key for my sister who is visiting.', timestamp: '10:30 AM', isRead: true, isLandlord: false },
      { id: 'm2', senderId: 'landlord', text: 'Hello Sarah! We can arrange that. Can you stop by the office?', timestamp: '10:35 AM', isRead: true, isLandlord: true },
      { id: 'm3', senderId: 'tenant-1', text: 'I will drop off the spare keys tomorrow.', timestamp: '10:45 AM', isRead: false, isLandlord: false }
    ]
  },
  {
    id: 'conv-2',
    tenantName: 'Michael Rodriguez',
    unit: '14A',
    property: 'Sunset Villas',
    lastMessage: 'The maintenance team fixed the AC. Thanks!',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    status: 'Offline',
    messages: [
      { id: 'm1', senderId: 'tenant-2', text: 'The AC is making a weird noise.', timestamp: 'Mon 2:00 PM', isRead: true, isLandlord: false },
      { id: 'm2', senderId: 'landlord', text: 'I will send the maintenance team over right away.', timestamp: 'Mon 2:15 PM', isRead: true, isLandlord: true },
      { id: 'm3', senderId: 'tenant-2', text: 'The maintenance team fixed the AC. Thanks!', timestamp: 'Yesterday 4:00 PM', isRead: true, isLandlord: false }
    ]
  },
  {
    id: 'conv-3',
    tenantName: 'Emily Chen',
    unit: '401',
    property: 'The Grand Apartments',
    lastMessage: 'Can I pay rent online this month?',
    lastMessageTime: 'Tuesday',
    unreadCount: 1,
    status: 'Offline',
    messages: [
      { id: 'm1', senderId: 'tenant-3', text: 'Can I pay rent online this month?', timestamp: 'Tuesday 9:00 AM', isRead: false, isLandlord: false }
    ]
  }
];

export const LandlordMessages = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeConvId, setActiveConvId] = useState(MOCK_CONVERSATIONS[0].id);
  const [newMessage, setNewMessage] = useState('');

  const activeConv = MOCK_CONVERSATIONS.find(c => c.id === activeConvId);

  const filteredConversations = MOCK_CONVERSATIONS.filter(c => 
    c.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.property.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-hidden h-[calc(100vh-4rem)] md:h-screen bg-slate-50 flex flex-col mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full space-y-4">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-indigo-600" />
            Tenant Messages
          </h1>
          <p className="text-slate-500 mt-1">Communicate directly with your tenants.</p>
        </div>

        {/* Chat Interface Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-1 min-h-0 overflow-hidden">
          
          {/* Sidebar / Conversation List */}
          <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-white shrink-0">
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search tenants..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-slate-50 text-sm"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {filteredConversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={cn(
                    "w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors flex gap-3 relative group",
                    activeConvId === conv.id ? "bg-indigo-50/50" : ""
                  )}
                >
                  {/* Active Indicator line */}
                  {activeConvId === conv.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-md"></div>
                  )}
                  
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                      {conv.tenantName.charAt(0)}
                    </div>
                    {conv.status === 'Online' && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-semibold text-slate-900 text-sm truncate pr-2">{conv.tenantName}</h4>
                      <span className="text-xs text-slate-400 whitespace-nowrap">{conv.lastMessageTime}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mb-1">{conv.property} - {conv.unit}</p>
                    <p className={cn(
                      "text-sm truncate",
                      conv.unreadCount > 0 ? "font-semibold text-slate-900" : "text-slate-500"
                    )}>
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="absolute top-4 right-4 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                      {conv.unreadCount}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Active Chat Area */}
          {activeConv ? (
            <div className="hidden md:flex flex-col flex-1 bg-slate-50/50 min-w-0">
              
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                    {activeConv.tenantName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{activeConv.tenantName}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Building className="w-3.5 h-3.5" />
                      {activeConv.property} - {activeConv.unit}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {activeConv.messages.map((msg, i) => (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "flex max-w-[80%] lg:max-w-[70%]",
                      msg.isLandlord ? "ml-auto justify-end" : "mr-auto justify-start"
                    )}
                  >
                    <div className={cn(
                      "rounded-2xl px-4 py-2.5 shadow-sm relative group",
                      msg.isLandlord 
                        ? "bg-indigo-600 text-white rounded-br-none" 
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"
                    )}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <div className={cn(
                        "text-[10px] mt-1 flex items-center justify-end gap-1 opacity-70",
                        msg.isLandlord ? "text-indigo-100" : "text-slate-400"
                      )}>
                        {msg.timestamp}
                        {msg.isLandlord && (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white border-t border-slate-200">
                <div className="flex items-end gap-2">
                  <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors shrink-0">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <div className="flex-1 relative">
                    <textarea 
                      placeholder="Type a message..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none h-[52px] text-sm"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                  </div>
                  <button className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors shrink-0">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50/50 flex-col text-center p-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Select a conversation</h3>
              <p className="text-slate-500 max-w-sm">Choose a tenant from the list to view your message history and start chatting.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
