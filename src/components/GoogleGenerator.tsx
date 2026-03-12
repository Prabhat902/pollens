"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
// import { Download, Trash2, StopCircle, PlayCircle, Image as ImageIcon, Sparkles } from "lucide-react";
import JSZip from "jszip";
import { cn } from "@/lib/utils";

type ImageResult = {
  index: number;
  prompt: string;
  url?: string;
  blob?: Blob;
  status: "pending" | "loading" | "success" | "error";
  errorMsg?: string;
  filename: string;
};

type LogEntry = {
  time: string;
  msg: string;
  type: "info" | "success" | "error" | "warn";
};

export default function GoogleGenerator() {
  const [promptsText, setPromptsText] = useState("A photorealistic majestic lion\nA cyberpunk street in rain");
  const [token, setToken] = useState("");
  const [model, setModel] = useState("imagen-3.0-generate-001");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  
  const [isRunning, setIsRunning] = useState(false);
  const [images, setImages] = useState<ImageResult[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const isRunningRef = useRef(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load token from local storage
    const saved = localStorage.getItem("google_key");
    if (saved) setToken(saved);
  }, []);

  const saveToken = (val: string) => {
    setToken(val);
    localStorage.setItem("google_key", val);
  };

  useEffect(() => {
    if (logContainerRef.current) logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
  }, [logs]);

  const addLog = (msg: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [...prev.slice(-99), { time: new Date().toLocaleTimeString(), msg, type }]);
  };

  const generateImage = async (task: ImageResult) => {
    if (!isRunningRef.current) return;
    setImages(prev => prev.map(img => img.index === task.index ? { ...img, status: 'loading' } : img));

    try {
        const response = await fetch("/api/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: task.prompt,
                token: token,
                aspectRatio: aspectRatio,
                model: model
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || response.statusText);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        setImages(prev => prev.map(img => 
            img.index === task.index ? { ...img, status: 'success', url: objectUrl, blob } : img
        ));
        addLog(`Success: Prompt #${task.index}`, 'success');

    } catch (error: any) {
        setImages(prev => prev.map(img => 
            img.index === task.index ? { ...img, status: 'error', errorMsg: error.message } : img
        ));
        addLog(`Error #${task.index}: ${error.message}`, 'error');
    }
  };

  const startBatch = async () => {
    if (!token) return alert("Google API Key is required");
    const promptList = promptsText.split("\n").filter(p => p.trim());
    if (!promptList.length) return;

    setIsRunning(true);
    isRunningRef.current = true;
    setLogs([]);
    addLog(`Starting Google batch of ${promptList.length} images...`, 'info');

    const initialImages: ImageResult[] = promptList.map((p, i) => ({
        index: i + 1,
        prompt: p.trim(),
        status: "pending",
        filename: `imagen_${Date.now()}_${i + 1}.png`
    }));
    setImages(initialImages);

    // Sequential generation for Google to be safe with rate limits (can optimize later)
    for (const task of initialImages) {
        if (!isRunningRef.current) break;
        await generateImage(task);
    }

    setIsRunning(false);
    isRunningRef.current = false;
    addLog("Batch complete.", 'success');
  };

  const stopBatch = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    addLog("Batch stopped.", 'warn');
  };

  const downloadZip = async () => {
      const successImages = images.filter(img => img.status === 'success' && img.blob);
      if (!successImages.length) return alert("No images to download");
  
      const zip = new JSZip();
      successImages.forEach(img => {
          if(img.blob) zip.file(img.filename, img.blob);
      });
  
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `imagen_batch_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 h-full">
      <div className="flex flex-col gap-6 h-full">
        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 border-indigo-500/20">
             <div className="flex items-center gap-2 mb-2">
                 <Sparkles className="h-5 w-5 text-indigo-400" />
                 <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">Google Imagen 3 (Premium)</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">API Key</label>
                    <input 
                        type="password" 
                        value={token} 
                        onChange={e => saveToken(e.target.value)}
                        placeholder="AIzaSy..."
                        className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-[10px] text-indigo-400 hover:underline">Get Free Key</a>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Aspect Ratio</label>
                    <select 
                        value={aspectRatio} 
                        onChange={e => setAspectRatio(e.target.value)}
                        className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 [&>option]:text-black"
                    >
                        <option value="1:1">1:1 (Square)</option>
                        <option value="16:9">16:9 (Landscape)</option>
                        <option value="9:16">9:16 (Portrait)</option>
                        <option value="3:4">3:4 (Tall)</option>
                        <option value="4:3">4:3 (Wide)</option>
                    </select>
                </div>
             </div>

             <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Prompts</label>
                <textarea 
                    value={promptsText}
                    onChange={e => setPromptsText(e.target.value)}
                    className="h-32 bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white resize-none focus:outline-none focus:border-indigo-500 transition-colors"
                />
             </div>

             <div className="flex gap-4">
                {isRunning ? (
                    <Button onClick={stopBatch} variant="default" className="w-full bg-red-500 hover:bg-red-600">
                        <StopCircle className="mr-2 h-4 w-4" /> Stop
                    </Button>
                ) : (
                    <Button onClick={startBatch} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Sparkles className="mr-2 h-4 w-4" /> Generate with Google
                    </Button>
                )}
                <Button onClick={downloadZip} variant="secondary">
                    <Download className="mr-2 h-4 w-4" /> ZIP
                </Button>
             </div>
        </div>

        {/* Gallery */}
        <div className="glass-panel p-6 rounded-3xl flex-1 overflow-hidden flex flex-col border-indigo-500/10">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-indigo-400" />
                Gallery
            </h3>
            <div className="overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-min pb-10">
                {images.map((img) => (
                    <div key={img.index} className="relative group aspect-square bg-black/40 rounded-xl overflow-hidden border border-white/5">
                        {img.status === 'success' && img.url ? (
                            <img src={img.url} className="w-full h-full object-cover" alt={`Generated ${img.index}`} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-xs text-gray-500 p-2 text-center">
                                {img.status === 'loading' && <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />}
                                {img.status === 'error' && <span className="text-red-400">Failed</span>}
                                {img.status === 'pending' && <span className="opacity-50">Pending</span>}
                            </div>
                        )}
                        <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded-full text-[10px] text-white font-mono backdrop-blur-md">
                            #{img.index}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl flex flex-col h-[400px] lg:h-auto border-indigo-500/10">
         <div className="flex justify-between items-center mb-4">
             <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Google Logs</h3>
             <button onClick={() => setLogs([])} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                 <Trash2 className="h-3 w-3" /> Clear
             </button>
         </div>
         <div ref={logContainerRef} className="flex-1 overflow-y-auto font-mono text-xs space-y-1 bg-black/40 p-4 rounded-xl border border-white/5">
            {logs.map((log, i) => (
                <div key={i} className={cn(
                    "break-all",
                    log.type === 'error' && "text-red-400",
                    log.type === 'success' && "text-green-400",
                    log.type === 'info' && "text-indigo-300/80"
                )}>
                    <span className="opacity-30 mr-2">[{log.time}]</span>
                    {log.msg}
                </div>
            ))}
         </div>
      </div>
    </div>
  );
}
