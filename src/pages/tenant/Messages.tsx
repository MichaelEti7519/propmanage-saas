import React, { useState } from 'react';
import { MessageSquare, Search, Send, User, Bell, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export const TenantMessages = () => {
  const [activeThread, setActiveThread] = useState(1);
  const [messageText, setMessageText] = useState('');

  const threads = [
    {
      id: 1,
      name: 'Property Manager',
      role: 'Management',
      lastMessage: 'Your lease renewal documents are ready to sign.',
      time: '10:42 AM',
      unread: 2,
      online: true,
      avatar: 'PM'
    },
    {
      id: 2,
      name: 'Maintenance Team',
      role: 'Support',
      lastMessage: 'We will be there tomorrow between 2-4 PM.',
      time: 'Yesterday',
      unread: 0,
      online: false,
      avatar: 'MT'
    },
    {
      id: 3,
      name: 'Building Announcements',
      role: 'Automated',
      lastMessage: 'Water will be shut off for maintenance on Tuesday.',
      time: 'Oct 12',
      unread: 0,
      online: true,
      avatar: <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    }
  ];

  const messages = [
    { id: 1, sender: 'Property Manager', text: 'Hello Jane, I hope you are doing well.', time: '10:30 AM', isMine: false },
    { id: 2, sender: 'Jane Doe', text: 'Hi! Yes, everything is great. I had a question about the lease renewal.', time: '10:35 AM', isMine: true },
    { id: 3, sender: 'Property Manager', text: 'Sure, what would you like to know?', time: '10:38 AM', isMine: false },
    { id: 4, sender: 'Property Manager', text: 'By the way, your lease renewal documents are ready to sign. They are in your Documents tab.', time: '10:42 AM', isMine: false }
  ];

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      
      {/* Sidebar / Thread List */}
      <div className="w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col transition-colors duration-200 h-[calc(100vh-4rem)]">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
            <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Messages
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm dark:text-slate-200 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setActiveThread(thread.id)}
              className={cn(
                "w-full text-left p-4 sm:px-6 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex gap-4",
                activeThread === thread.id && "bg-indigo-50/50 dark:bg-indigo-900/20"
              )}
            >
              <div className="relative">
                {typeof thread.avatar === 'string' ? (
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    {thread.avatar}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                    {thread.avatar}
                  </div>
                )}
                {thread.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full"></span>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                  <h3 className={cn(
                    "font-semibold text-sm truncate",
                    thread.unread > 0 ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                  )}>{thread.name}</h3>
                  <span className="text-xs font-medium text-slate-400 whitespace-nowrap">{thread.time}</span>
                </div>
                <p className={cn(
                  "text-sm truncate",
                  thread.unread > 0 ? "font-medium text-slate-800 dark:text-slate-200" : "text-slate-500 dark:text-slate-400"
                )}>{thread.lastMessage}</p>
                <span className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider block">{thread.role}</span>
              </div>
              {thread.unread > 0 && (
                <div className="flex-shrink-0 flex items-center justify-center">
                  <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-xs font-medium flex items-center justify-center">
                    {thread.unread}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="hidden md:flex flex-1 flex-col h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        
        {/* Chat Header */}
        <div className="h-16 px-6 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              PM
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Property Manager</h3>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-500">Online</p>
            </div>
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-center">
            <span className="text-xs font-medium text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
              Today
            </span>
          </div>
          
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex w-full", msg.isMine ? "justify-end" : "justify-start")}>
              <div className={cn("flex max-w-[80%] gap-3", msg.isMine ? "flex-row-reverse" : "flex-row")}>
                {!msg.isMine && (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1">
                    PM
                  </div>
                )}
                
                <div>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm",
                    msg.isMine 
                      ? "bg-indigo-600 text-white rounded-tr-sm shadow-sm" 
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-sm border border-slate-100 dark:border-slate-700"
                  )}>
                    {msg.text}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium text-slate-400 mt-1.5 block",
                    msg.isMine ? "text-right" : "text-left"
                  )}>
                    {msg.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-4 sm:p-6 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm dark:text-slate-200 transition-colors"
            />
            <button className="w-12 h-12 flex-shrink-0 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-sm">
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
