import React, { useState, useRef, useEffect } from 'react';
import { generateChatResponse } from '../services/gemini';
import { ChatMessage } from '../types';

export const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hi! I am VolunBot. I can help you find events or plan volunteer activities. How can I help?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    
    const newHistory: ChatMessage[] = [...messages, { role: 'user', text: userMsg }];
    setMessages(newHistory);
    setLoading(true);

    const isComplex = userMsg.length > 50 || userMsg.toLowerCase().includes('plan') || userMsg.toLowerCase().includes('organize');

    if (isComplex) {
         setMessages(prev => [...prev, { role: 'model', text: '', isThinking: true }]);
    }

    const response = await generateChatResponse(userMsg, newHistory.map(m => ({ role: m.role, text: m.text })));
    
    setLoading(false);
    if (isComplex) {
        setMessages(prev => {
            const filtered = prev.filter(m => !m.isThinking);
            return [...filtered, { role: 'model', text: response }];
        });
    } else {
        setMessages(prev => [...prev, { role: 'model', text: response }]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-xl shadow-primary-300 transition-transform transform hover:scale-105 flex items-center justify-center ring-4 ring-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-[90vw] sm:w-96 flex flex-col border border-gray-200 overflow-hidden transition-all animate-fade-in-up fixed bottom-6 right-4 sm:right-6 h-[70vh] sm:h-[500px]">
          <div className="bg-primary-600 p-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
                <div className="h-2.5 w-2.5 bg-green-300 rounded-full animate-pulse shadow-[0_0_8px_rgba(134,239,172,0.8)]"></div>
                <div>
                    <h3 className="text-white font-bold text-sm leading-none">VolunBot AI</h3>
                    <p className="text-primary-200 text-[10px] mt-0.5">Online • Campus Assistant</p>
                </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 scrollbar-hide">
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary-600 text-white rounded-br-none' 
                    : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
                }`}>
                  {msg.isThinking ? (
                      <div className="flex items-center space-x-2 text-gray-500">
                          <svg className="animate-spin h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-xs font-medium">Processing...</span>
                      </div>
                  ) : (
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center bg-gray-50 rounded-full px-4 py-2 ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-primary-500 transition-all">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about events..."
                className="bg-transparent flex-1 outline-none text-sm text-gray-700 placeholder-gray-400"
                disabled={loading}
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className={`ml-2 p-1.5 rounded-full transition-colors ${loading || !input.trim() ? 'text-gray-300' : 'text-primary-600 hover:bg-primary-50'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};