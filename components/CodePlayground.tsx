"use client";

import React, { useState, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Trash2, X, Terminal, FileCode, Eye, Code } from 'lucide-react';

interface CodePlaygroundProps {
    isOpen: boolean;
    onClose: () => void;
    initialCode?: string;
    autoRun?: boolean;
}

export default function CodePlayground({ isOpen, onClose, initialCode, autoRun = false }: CodePlaygroundProps) {
    const [mode, setMode] = useState<'html' | 'js'>('html');
    const [htmlCode, setHtmlCode] = useState(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; background: #f8fafc; color: #334155; }
    .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; }
    h1 { color: #2563eb; margin-top: 0; }
    button { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s; }
    button:hover { background: #1d4ed8; transform: scale(1.05); }
    #result { margin-top: 1rem; font-weight: bold; color: #059669; min-height: 1.5em; }
  </style>
</head>
<body>
  <div class="card">
    <h1>DOM Playground 🎨</h1>
    <p>Edit HTML, CSS, dan JS di editor sebelah kiri.</p>
    <button id="myBtn">Klik Saya!</button>
    <div id="result"></div>
  </div>

  <script>
    // Kode JavaScript untuk memanipulasi DOM
    const btn = document.getElementById('myBtn');
    const result = document.getElementById('result');

    btn.addEventListener('click', () => {
      result.textContent = 'Tombol berhasil diklik pada ' + new Date().toLocaleTimeString();
      console.log('Event klik terdeteksi!');
    });

    console.log('Halaman siap digunakan.');
  </script>
</body>
</html>`);
    const [jsCode, setJsCode] = useState(`// JavaScript Playground
console.log("Halo dari JS Playground!");

// Contoh fungsi sederhana
function hitungLuas(panjang, lebar) {
  return panjang * lebar;
}

const p = 10;
const l = 5;
console.log(\`Luas persegi panjang (\${p} x \${l}) = \`, hitungLuas(p, l));
`);
    
    const [htmlOutput, setHtmlOutput] = useState<{level: 'log' | 'error' | 'warn', message: string}[]>([]);
    const [jsOutput, setJsOutput] = useState<{level: 'log' | 'error' | 'warn', message: string}[]>([]);
    const [iframeSrc, setIframeSrc] = useState("");
    const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'console'>('code');

    // Efek untuk memuat kode awal saat modal dibuka
    useEffect(() => {
        if (isOpen && initialCode) {
            let detectedMode: 'html' | 'js' = 'html';
            // Heuristik sederhana: jika kode tidak mengandung tag HTML dan tidak kosong, anggap itu JS.
            if (!/<[a-z][\s\S]*>/i.test(initialCode) && initialCode.trim().length > 0) {
                detectedMode = 'js';
                setMode('js');
                setJsCode(initialCode);
            } else {
                detectedMode = 'html';
                setMode('html');
                setHtmlCode(initialCode);
            }

            if (autoRun) {
                // Gunakan timeout kecil untuk memastikan state modal/iframe siap sebelum eksekusi
                setTimeout(() => {
                    runCode(initialCode, detectedMode);
                    setActiveTab(detectedMode === 'html' ? 'preview' : 'console');
                }, 300);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialCode, autoRun]);

    // Listener untuk menangkap pesan console dari iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'console') {
                setHtmlOutput(prev => [...prev, { level: event.data.level, message: event.data.message }]);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const runCode = useCallback((codeOverride?: string | React.MouseEvent, modeOverride?: 'html' | 'js') => {
        // Determine if we are using an override (from autoRun) or current state
        const isOverride = typeof codeOverride === 'string';
        const activeMode = (isOverride && modeOverride) ? modeOverride : mode;
        const activeCode = isOverride ? (codeOverride as string) : (activeMode === 'html' ? htmlCode : jsCode);

        if (activeMode === 'html') {
            setHtmlOutput([]); // Reset HTML console
            // Script injeksi untuk menangkap console.log dari dalam iframe (HTML Mode)
            const consoleInterceptor = `
                <script>
                    (function() {
                        var oldLog = console.log;
                        var oldError = console.error;
                        var oldWarn = console.warn;

                        function safeStringify(obj) {
                            try {
                                return JSON.stringify(obj, null, 2);
                            } catch(e) {
                                return '[Object]';
                            }
                        }

                        function send(level, args) {
                            try {
                                var msg = args.map(arg => typeof arg === 'object' ? safeStringify(arg) : String(arg)).join(' ');
                                window.parent.postMessage({ type: 'console', level: level, message: msg }, '*');
                            } catch(e) {}
                        }
                        console.log = function(...args) { oldLog.apply(console, args); send('log', args); };
                        console.error = function(...args) { oldError.apply(console, args); send('error', args); };
                        console.warn = function(...args) { oldWarn.apply(console, args); send('warn', args); };
                        window.onerror = function(msg, url, line) { send('error', [msg + ' (Line: ' + line + ')']); };
                        
                        // Intercept alert agar muncul di console juga
                        var oldAlert = window.alert;
                        window.alert = function(msg) {
                            send('log', ['[Alert]', msg]);
                            if (oldAlert) oldAlert(msg);
                        };
                    })();
                </script>
            `;
            
            // Inject interceptor secara cerdas agar tidak merusak struktur HTML
            let finalHtml = activeCode;
            if (finalHtml.includes('<head>')) {
                finalHtml = finalHtml.replace('<head>', '<head>' + consoleInterceptor);
            } else if (finalHtml.includes('<body>')) {
                finalHtml = finalHtml.replace('<body>', '<body>' + consoleInterceptor);
            } else {
                finalHtml = consoleInterceptor + finalHtml;
            }
            setIframeSrc(finalHtml);
            setActiveTab('preview');
        } else {
            // Mode JS: Jalankan langsung di runtime JS (tanpa iframe)
            setJsOutput([]); // Reset JS console
            // Kita buat mock console untuk menangkap output
            const logs: {level: 'log' | 'error' | 'warn', message: string}[] = [];
            const mockConsole = {
                log: (...args: any[]) => logs.push({ level: 'log', message: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') }),
                error: (...args: any[]) => logs.push({ level: 'error', message: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') }),
                warn: (...args: any[]) => logs.push({ level: 'warn', message: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') }),
            };

            try {
                // Gunakan Function constructor untuk isolasi scope sederhana
                // Kita passing 'console' sebagai argumen agar kode user menggunakan mockConsole kita
                // eslint-disable-next-line no-new-func
                const run = new Function('console', activeCode);
                run(mockConsole);
            } catch (e) {
                mockConsole.error(e instanceof Error ? e.message : String(e));
            }
            
            setJsOutput(logs);
            setActiveTab('console');
        }
    }, [mode, htmlCode, jsCode]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="flex flex-row justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 gap-3">
                    <div className="flex items-center gap-2">
                            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1 gap-1">
                                <button
                                    onClick={() => setMode('html')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'html' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                                >
                                    <FileCode size={16} /> HTML
                                </button>
                                <button
                                    onClick={() => setMode('js')}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${mode === 'js' ? 'bg-white dark:bg-gray-600 text-yellow-600 dark:text-yellow-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                                >
                                    <Terminal size={16} /> <span className="hidden sm:inline">JavaScript</span><span className="sm:hidden">JS</span>
                                </button>
                            </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={runCode} 
                            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm active:scale-95 transform"
                            title="Jalankan"
                        >
                            <Play size={16} fill="currentColor" /> 
                            <span className="">Jalankan</span>
                        </button>
                        <div className="hidden md:block w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                        <button 
                            onClick={onClose} 
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 gap-1 shrink-0">
                    <button
                        onClick={() => setActiveTab('code')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'code' ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900' : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                        <Code size={14} /> Code
                    </button>
                    {mode === 'html' && (
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'preview' ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-900' : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                            <Eye size={14} /> Preview
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('console')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'console' ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-white dark:bg-gray-900' : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                        <Terminal size={14} /> Console
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 relative overflow-hidden bg-white dark:bg-gray-900">
                    {/* Editor Area */}
                    <div className={`absolute inset-0 ${activeTab === 'code' ? 'z-10' : 'z-0 invisible'}`}>
                        <Editor
                            height="100%"
                            language={mode === 'html' ? 'html' : 'javascript'}
                            theme="vs-dark"
                            value={mode === 'html' ? htmlCode : jsCode}
                            onChange={(value) => mode === 'html' ? setHtmlCode(value || "") : setJsCode(value || "")}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 16, bottom: 16 },
                                fontFamily: "'Fira Code', 'Consolas', monospace",
                            }}
                        />
                    </div>

                    {/* Preview Section (Only visible in HTML mode) */}
                    {mode === 'html' && (
                        <div className={`absolute inset-0 bg-white ${activeTab === 'preview' ? 'z-10' : 'z-0 invisible'}`}>
                                <div className="w-full h-full relative">
                                    {iframeSrc ? (
                                        <iframe srcDoc={iframeSrc} className="w-full h-full border-none" title="Preview" sandbox="allow-scripts allow-same-origin allow-modals" />
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                                            <Eye size={32} className="opacity-20" />
                                            <span className="italic text-xs">Klik "Jalankan" untuk melihat hasil</span>
                                        </div>
                                    )}
                                </div>
                        </div>
                    )}

                    {/* Console Section */}
                    <div className={`absolute inset-0 flex flex-col bg-[#1e1e1e] text-gray-100 ${activeTab === 'console' ? 'z-10' : 'z-0 invisible'}`}>
                            <div className="px-3 py-1.5 bg-[#252526] border-b border-[#333] flex justify-between items-center shrink-0">
                                <span className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1"><Terminal size={12}/> {mode === 'js' ? 'Terminal' : 'Console'}</span>
                                <button 
                                    onClick={() => mode === 'html' ? setHtmlOutput([]) : setJsOutput([])} 
                                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-2 py-0.5 hover:bg-white/10 rounded transition-colors"
                                >
                                    <Trash2 size={12} /> Clear
                                </button>
                            </div>
                            <div className="flex-1 p-2 font-mono text-xs overflow-y-auto space-y-1">
                                {(mode === 'html' ? htmlOutput : jsOutput).length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-gray-600 italic">
                                        {mode === 'js' ? 'Terminal siap...' : 'Console kosong'}
                                    </div>
                                ) : (
                                    (mode === 'html' ? htmlOutput : jsOutput).map((log, i) => (
                                        <div key={i} className={`break-words border-b border-gray-800/30 pb-0.5 last:border-0 ${log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-gray-300'}`}>
                                            <span className="opacity-50 mr-2">[{log.level}]</span>
                                            {log.message}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                </div>
            </div>
        </div>
    );
}