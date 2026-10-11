const fs = require('fs');
const path = require('path');

const write = (filePath, content) => {
    const fullPath = path.join(__dirname, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log(`Created: ${filePath}`);
};

write('src/mock/helpKnowledge.js', `
export const helpKnowledge = [
  { intent: "wifi", question: "What is the guest wifi password?", answer: "The guest network is 'Maze_Guest' and the password is 'Welcome2026'." },
  { intent: "cancel", question: "How do I cancel my booking?", answer: "Go to your Dashboard, find the meeting in your Upcoming Schedule, click on it, and select 'Cancel Meeting'." },
  { intent: "projector", question: "How to use the projector?", answer: "Connect via HDMI or use Apple AirPlay on channel 2. For Apollo room, use the ceiling panel switch." },
  { intent: "coffee", question: "Where is the coffee machine?", answer: "Coffee machines are located in the pantry on Floor 2 and Floor 3." },
  { intent: "capacity", question: "Can I bring more people than the room capacity?", answer: "Due to fire safety regulations, you cannot exceed the maximum capacity of a room. Please book a larger room like Innovation Lab (40 cap) or Boardroom Prime (20 cap)." },
  { intent: "owner", question: "How do I add a new room?", answer: "Switch to the Owner Portal at login, go to the Rooms directory, and click 'Add New Room'. You can set pricing and equipment there." }
];
`);

write('src/components/ChatBot.jsx', `
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, HelpCircle } from 'lucide-react';
import { helpKnowledge } from '../mock/helpKnowledge';
import Fuse from 'fuse.js';

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('HELP'); // 'HELP' or 'ROOMBOT'
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hi! I am Maze Guide. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const endOfMessagesRef = useRef(null);

  // Setup Fuse for NLP matching
  const fuse = new Fuse(helpKnowledge, {
      keys: ['question', 'intent', 'answer'],
      threshold: 0.4
  });

  useEffect(() => {
     if (endOfMessagesRef.current) {
         endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
     }
  }, [messages, isOpen]);

  const toggleMode = (newMode) => {
      setMode(newMode);
      if (newMode === 'HELP') {
          setMessages([{ id: Date.now(), sender: 'bot', text: 'I am Maze Guide! Ask me anything about the office, wifi, or how to use the app.' }]);
      } else {
          setMessages([{ id: Date.now(), sender: 'bot', text: 'I am RoomBot 🤖! I can help you book a room quickly. Try saying: "Book a room for 5 people at 2pm"' }]);
      }
  };

  const handleSend = () => {
      if (!input.trim()) return;
      const userText = input.trim();
      const newMessages = [...messages, { id: Date.now(), sender: 'user', text: userText }];
      setMessages(newMessages);
      setInput('');

      // Simulate Bot Thinking
      setTimeout(() => {
          let botResponse = "I'm sorry, I didn't quite get that.";
          
          if (mode === 'HELP') {
              const results = fuse.search(userText);
              if (results.length > 0) {
                  botResponse = results[0].item.answer;
              } else {
                  botResponse = "I couldn't find an answer in my knowledge base. Try asking about wifi, cancelling, or the projector.";
              }
          } else {
              // RoomBot NLP simulation
              const text = userText.toLowerCase();
              if (text.includes("book") || text.includes("room")) {
                  botResponse = "I can definitely help with that! However, natural language booking is currently locked in demo mode. Please use the Book Room wizard in the sidebar!";
              } else if (text.includes("hello") || text.includes("hi")) {
                  botResponse = "Hello there! Ready to book a room?";
              }
          }

          setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: botResponse }]);
      }, 600);
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} whileHover={{ scale: 1.1 }}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-indigo-900 cursor-pointer z-50"
            onClick={() => setIsOpen(true)}
          >
            <MessageSquare size={24} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
               <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                  <button onClick={() => toggleMode('HELP')} className={\`flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-md transition-colors \${mode === 'HELP' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}\`}><HelpCircle size={14}/> Guide</button>
                  <button onClick={() => toggleMode('ROOMBOT')} className={\`flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-md transition-colors \${mode === 'ROOMBOT' ? 'bg-white dark:bg-slate-800 shadow-sm text-teal-600 dark:text-teal-400' : 'text-slate-500'}\`}><Bot size={14}/> RoomBot</button>
               </div>
               <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X size={20}/></button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {messages.map(m => (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={m.id} className={\`flex \${m.sender === 'user' ? 'justify-end' : 'justify-start'}\`}>
                    <div className={\`max-w-[80%] rounded-2xl px-4 py-2 text-sm \${m.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}\`}>
                       {m.text}
                    </div>
                 </motion.div>
               ))}
               <div ref={endOfMessagesRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex gap-2">
               <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="Type a message..." className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
               <button onClick={handleSend} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-2 transition-colors"><Send size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
`);

// Modify AppLayout to include ChatBot
const appLayoutPath = path.join(__dirname, 'src/layouts/AppLayout.jsx');
let appLayoutContent = fs.readFileSync(appLayoutPath, 'utf8');

// Replace the placeholder floating button with ChatBot
appLayoutContent = appLayoutContent.replace(
  "import { motion } from 'framer-motion';",
  "import { motion } from 'framer-motion';\nimport { ChatBot } from '../components/ChatBot';"
);

appLayoutContent = appLayoutContent.replace(
  /{[\s\S]*?\/\* Floating Chatbots Placeholder \*\/[\s\S]*?<\/div>\s*<\/div>/,
  `      <ChatBot />
    </div>`
);

fs.writeFileSync(appLayoutPath, appLayoutContent, 'utf8');
console.log('Updated: src/layouts/AppLayout.jsx');
`);
