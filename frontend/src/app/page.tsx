"use client";
import { useState } from "react";
import CodeEditor from "@/components/Editor/Editor";
import { FolderCode, MessageSquare, Terminal as TerminalIcon, Wallet, Play, Save } from "lucide-react";

export default function Home() {
  const [code, setCode] = useState("// Start coding...");
  const [aiPrompt, setAiPrompt] = useState("");

  return (
    <div className="flex h-screen w-full bg-[#1E1E2E] text-[#CDD6F4] font-sans selection:bg-[#4FC3F7]/30">
      {/* Zone A: Sidebar */}
      <aside className="w-[220px] h-full bg-[#252537] border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
          <FolderCode className="text-[#4FC3F7] w-5 h-5" />
          <span className="font-semibold text-sm">Explorer</span>
        </div>
        <div className="flex-1 p-2 text-xs text-zinc-400">
          <div className="p-2 hover:bg-white/5 rounded cursor-pointer">main.py</div>
          <div className="p-2 hover:bg-white/5 rounded cursor-pointer">utils.js</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col relative">
        {/* Zone B: Top Toolbar */}
        <header className="h-[48px] bg-[#252537] border-b border-zinc-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-4 text-xs font-medium">
            <button className="flex items-center gap-1.5 hover:text-[#4FC3F7] transition-colors"><Save size={14} /> Save</button>
            <button className="flex items-center gap-1.5 text-[#A8FF78] hover:opacity-80 transition-opacity"><Play size={14} /> Run</button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#1E1E2E] px-3 py-1 rounded-full border border-zinc-800">
              <Wallet size={14} className="text-[#FFB347]" />
              <span className="text-xs">0x1234...5678</span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          {/* Zone C: Main Editor */}
          <section className="flex-1 p-4 bg-[#1E1E2E]">
            <CodeEditor code={code} onChange={(v) => setCode(v || "")} />
          </section>

          {/* Zone D: AI Prompt Panel */}
          <aside className="w-[300px] bg-[#252537] border-l border-zinc-800 flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
              <MessageSquare className="text-[#4FC3F7] w-4 h-4" />
              <span className="text-xs font-semibold">AI Assistant</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
               {/* Chat history would go here */}
               <div className="text-[11px] text-zinc-500 italic text-center">Ask me to generate code or fix bugs</div>
            </div>
            <div className="p-4 border-t border-zinc-800">
              <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask AI..."
                className="w-full h-24 bg-[#1E1E2E] border border-zinc-700 rounded-md p-2 text-xs focus:ring-1 focus:ring-[#4FC3F7] outline-none"
              />
              <button className="w-full mt-2 bg-[#4FC3F7] text-[#1E1E2E] font-bold py-1.5 rounded-md text-xs hover:bg-[#4FC3F7]/90 transition-all">
                Send Request
              </button>
            </div>
          </aside>
        </main>

        {/* Zone E: Bottom Terminal */}
        <section className="h-[200px] bg-[#1E1E2E] border-t border-zinc-800 flex flex-col">
          <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2 bg-[#252537]">
            <TerminalIcon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Terminal</span>
          </div>
          <div className="flex-1 p-4 font-mono text-xs text-[#A8FF78]">
            <p>$ node main.js</p>
            <p className="text-[#CDD6F4]">Server running on port 3000...</p>
          </div>
        </section>
      </div>
    </div>
  );
}
