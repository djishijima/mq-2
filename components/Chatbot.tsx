import React, { useState, useEffect, useRef } from 'react';
import { getChatbotResponse } from '../services/geminiService';
import { X, Loader, Send, MessageCircle } from './Icons';
import { EmployeeUser } from '../types'; // FIX: Import EmployeeUser

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

interface ChatbotProps {
  onClose: () => void;
  isAIOff: boolean;
  currentUser: EmployeeUser | null; // FIX: Added currentUser to props
}

const Chatbot: React.FC<ChatbotProps> = ({ onClose, isAIOff, currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAIOff) {
      setMessages([{ id: 'init', role: 'model', content: 'AI機能は現在無効です。' }]);
    } else {
      setMessages([{ id: 'init', role: 'model', content: 'こんにちは！何か質問はありますか？' }]);
    }
  }, [isAIOff]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isAIOff) return;

    const newUserMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: input };
    setMessages(prev => [...prev, newUserMessage]);
    const userInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // FIX: Passed currentUser?.id || 'anonymous' as the second argument
      const responseText = await getChatbotResponse(userInput, currentUser?.id || 'anonymous');
      const newAiMessage: Message = { id: `model-${Date.now()}`, role: 'model', content: responseText };
      setMessages(prev => [...prev, newAiMessage]);
    } catch (err) {
      const errorMessage = "申し訳ありません、エラーが発生しました。もう一度お試しください。";
      setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: 'model', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-8 z-[100] w-full max-w-sm h-[60vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col font-sans animate-fade-in-up">
      <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-500" />
          AIチャットボット
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X className="w-6 h-6" />
        </button>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
            {message.role === 'model' && <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">AI</div>}
            <div className={`max-w-xs p-3 rounded-2xl whitespace-pre-wrap ${message.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none'}`}>
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">AI</div>
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-700 rounded-bl-none">
              <Loader className="w-5 h-5 animate-spin text-slate-500"/>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <footer className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "AIが応答中です..." : (isAIOff ? "AI機能は無効です" : "メッセージを入力...")}
            disabled={isLoading || isAIOff}
            className="w-full bg-slate-100 dark:bg-slate-700 border border-transparent text-slate-900 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || isAIOff}
            className="bg-blue-600 text-white p-3 rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Send message"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default Chatbot;