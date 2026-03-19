"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, User, Copy, Check } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import ReactMarkdown from 'react-markdown';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

interface Message {
    role: 'user' | 'bot';
    content: string;
}

interface ChatbotModalProps {
    isOpen: boolean;
    onClose: () => void;
    contextData?: string;
}

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const [isCopied, setIsCopied] = useState(false);
    const codeRef = useRef<HTMLElement>(null);
    
    useEffect(() => {
        if (codeRef.current && !inline) {
            delete codeRef.current.dataset.highlighted;
            hljs.highlightElement(codeRef.current);
        }
    }, [children, inline, className]);

    const handleCopy = () => {
        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (!inline) {
        const language = match ? match[1] : 'text';
        return (
            <div className="not-prose relative rounded-lg overflow-hidden bg-slate-900 dark:bg-[#0d1117] my-3 shadow-sm border border-slate-700">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800 dark:bg-[#161b22] border-b border-slate-700">
                    <span className="text-xs font-mono text-slate-300 dark:text-slate-400 lowercase">{language}</span>
                    <button
                        onClick={handleCopy}
                        className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs"
                    >
                        {isCopied ? <><Check size={14} className="text-green-400" /> Copied!</> : <><Copy size={14} /> Copy</>}
                    </button>
                </div>
                <div className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed text-slate-200">
                    <pre className="!bg-transparent !p-0 !m-0">
                        <code ref={codeRef} className={className || 'language-text'} {...props}>
                            {children}
                        </code>
                    </pre>
                </div>
            </div>
        );
    }
    
    return (
        <code className="bg-blue-50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[13px] text-blue-600 dark:text-blue-400 font-mono" {...props}>
            {children}
        </code>
    );
};

export default function ChatbotModal({ isOpen, onClose, contextData = "Materi pembelajaran umum." }: ChatbotModalProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', content: 'Halo! Aku Kak Gem, asisten belajarmu. Ada materi yang bikin kamu bingung? Tanya aja ke aku!' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    if (!isOpen) return null;

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // Panggil API backend untuk mendapatkan respons chatbot
            const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai-tutor/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userMessage, context: contextData }),
            });

            if (!response.ok) {
                // Coba ambil detail error dari response backend jika ada
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || errorData?.error || `Server error: ${response.status}`);
            }

            const data = await response.json();
            
            const botReply = data.answer || "Maaf, Kak Gem tidak mengerti.";
            setMessages(prev => [...prev, { role: 'bot', content: botReply }]);
            
        } catch (error) {
            console.error("Chatbot error:", error);
            setMessages(prev => [...prev, { role: 'bot', content: `Waduh, sepertinya koneksi ke otak Kak Gem sedang terganggu. (${error instanceof Error ? error.message : 'Error tidak diketahui'})` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col h-[85vh] max-h-[700px] border border-slate-200 dark:border-slate-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                            <img src="/robot.png" alt="Kak Gem" className="w-6 h-6 object-contain drop-shadow-md" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg leading-tight">Tanya Kak Gem</h2>
                            <p className="text-[11px] text-sky-100 font-medium">Asisten AI Cerdasmu ✨</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50 dark:bg-slate-800/50">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'bot' && (
                                <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0 mt-auto overflow-hidden p-1">
                                    <img src="/robot.png" alt="Kak Gem" className="w-full h-full object-contain" />
                                </div>
                            )}
                            <div className={`max-w-[85%] rounded-2xl p-3.5 text-[14px] leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                            }`}>
                                {msg.role === 'user' ? (
                                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                                ) : (
                                    <ReactMarkdown 
                                        className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-sm"
                                        components={{ 
                                            pre: ({ children }: any) => <>{children}</>,
                                            code: CodeBlock 
                                        }}
                                    >{msg.content}</ReactMarkdown>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3 justify-start animate-in fade-in duration-300">
                            <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0 mt-auto overflow-hidden p-1">
                                <img src="/robot.png" alt="Kak Gem" className="w-full h-full object-contain" />
                            </div>
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-none p-4 flex items-center gap-3 shadow-sm">
                                <Loader2 size={16} className="animate-spin text-sky-600 dark:text-sky-400" />
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Kak Gem sedang mengetik...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-px" />
                </div>

                {/* Input Area */}
                <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shrink-0">
                    <div className="flex gap-2 items-end">
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Tanya sesuatu ke Kak Gem..."
                            className="flex-1 resize-none min-h-[48px] max-h-32 p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm text-slate-700 dark:text-slate-200 custom-scrollbar"
                            rows={1}
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isLoading}
                            className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white p-3 rounded-xl transition-all flex items-center justify-center h-[48px] w-[48px] flex-shrink-0 shadow-sm hover:shadow-md"
                        >
                            <Send size={18} className={input.trim() && !isLoading ? 'translate-x-0.5 -translate-y-0.5 transition-transform' : ''} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}