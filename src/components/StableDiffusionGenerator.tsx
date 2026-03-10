"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Trash2, StopCircle, PlayCircle, Image as ImageIcon, Sliders } from "lucide-react";
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

export default function StableDiffusionGenerator() {
  const [promptsText, setPromptsText] = useState("A futuristic city with flying cars, 8k resolution\nPortrait of a warrior, intricate armor, cinematic lighting");
  const [negativePrompt, setNegativePrompt] = useState("ugly, blurry, low quality, distorted, extra limbs, watermark, text");
  const [token, setToken] = useState("");
  const [modelId, setModelId] = useState("sd-1.5");
  const [width, setWidth] = useState("512");
  const [height, setHeight] = useState("512");
  const [steps, setSteps] = useState(30);
  const [guidance, setGuidance] = useState(7.5);

  const [isRunning, setIsRunning] = useState(false);
  const [images, setImages] = useState<ImageResult[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const isRunningRef = useRef(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("sd_key");
    if (saved) setToken(saved);
  }, []);

  const saveToken = (val: string) => {
    setToken(val);
    localStorage.setItem("sd_key", val);
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
        const response = await fetch("/api/sd", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                key: token,
                prompt: task.prompt,
                negative_prompt: negativePrompt,
                model_id: modelId,
                width,
                height,
                samples: "1",
                num_inference_steps: String(steps),
                guidance_scale: guidance
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || response.statusText);
        }

        const data = await response.json();

        // Specific handling for stablediffusionapi.com responses
        if (data.status === "error") {
            throw new Error(data.message || "Unknown API Error");
        }

        let imageUrl = "";
        if (data.output && data.output.length > 0) {
            imageUrl = data.output[0];
        } else if (data.image) {
            imageUrl = data.image; // Sometimes just 'image'
        } else {
             throw new Error("No image URL in response");
        }

        // Fetch the image to display and blob it
        // Note: The URL might be restricted by CORS, so we might need to proxy fetching it client side 
        // or just display it via <img> tag. For download we fetch.
        
        let blob: Blob | undefined;
        try {
            const imgRes = await fetch(imageUrl);
            blob = await imgRes.blob();
        } catch (e) {
            console.warn("CORS blocked direct blob fetch, using URL only for display", e);
        }

        setImages(prev => prev.map(img => 
            img.index === task.index ? { ...img, status: 'success', url: imageUrl, blob } : img
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
    if (!token) return alert("Stable Diffusion API Key is required");
    const promptList = promptsText.split("\n").filter(p => p.trim());
    if (!promptList.length) return;

    setIsRunning(true);
    isRunningRef.current = true;
    setLogs([]);
    addLog(`Starting SD Batch (${promptList.length} prompts)...`, 'info');

    const initialImages: ImageResult[] = promptList.map((p, i) => ({
        index: i + 1,
        prompt: p.trim(),
        status: "pending",
        filename: `sd_${Date.now()}_${i + 1}.png`
    }));
    setImages(initialImages);

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
      const successImages = images.filter(img => img.status === 'success');
      if (!successImages.length) return alert("No images to download");
  
      const zip = new JSZip();
      let addedCount = 0;

      for (const img of successImages) {
          if (img.blob) {
              zip.file(img.filename, img.blob);
              addedCount++;
          } else if (img.url) {
              // Try fetching again if blob wasn't saved initially
              try {
                  const r = await fetch(img.url);
                  const b = await r.blob();
                  zip.file(img.filename, b);
                  addedCount++;
              } catch (e) {
                  addLog(`Could not zip image #${img.index} (CORS/Network)`, 'error');
              }
          }
      }

      if (addedCount > 0) {
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sd_batch_${Date.now()}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert("Could not download any images due to network restrictions.");
      }
    };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 h-full">
      <div className="flex flex-col gap-6 h-full">
        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 border-purple-500/20">
             <div className="flex items-center gap-2 mb-2">
                 <Sliders className="h-5 w-5 text-purple-400" />
                 <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">Stable Diffusion (Direct API)</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="col-span-1 md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">API Key</label>
                    <input 
                        type="password" 
                        value={token} 
                        onChange={e => saveToken(e.target.value)}
                        placeholder="Key from stablediffusionapi.com"
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>
                <div>
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Model ID</label>
                     <select 
                        value={modelId} 
                        onChange={e => setModelId(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 [&>option]:text-black"
                     >
                        <option value="sd-1.5">SD 1.5 (Standard)</option>
                        <option value="juggernaut-xl">Juggernaut XL</option>
                        <option value="realistic-vision-v5">Realistic Vision V5</option>
                        <option value="dreamshaper-v8">DreamShaper V8</option>
                     </select>
                </div>
                 <div>
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Size</label>
                     <select 
                        value={`${width}x${height}`} 
                        onChange={e => {
                            const [w, h] = e.target.value.split("x");
                            setWidth(w); setHeight(h);
                        }}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 [&>option]:text-black"
                     >
                        <option value="512x512">512x512</option>
                        <option value="768x768">768x768</option>
                        <option value="512x768">512x768</option>
                        <option value="768x512">768x512</option>
                        <option value="1024x1024">1024x1024 (XL)</option>
                     </select>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Inference Steps: {steps}</label>
                    <input 
                        type="range" min="10" max="50" value={steps} onChange={e => setSteps(Number(e.target.value))}
                        className="w-full accent-purple-500"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Guidance Scale: {guidance}</label>
                    <input 
                        type="range" min="1" max="20" step="0.5" value={guidance} onChange={e => setGuidance(Number(e.target.value))}
                        className="w-full accent-purple-500"
                    />
                 </div>
             </div>

             <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Positive Prompts (Batch)</label>
                <textarea 
                    value={promptsText}
                    onChange={e => setPromptsText(e.target.value)}
                    className="h-24 bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white resize-none focus:outline-none focus:border-purple-500 transition-colors"
                />
             </div>
             
             <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-red-300">Negative Prompt</label>
                <textarea 
                    value={negativePrompt}
                    onChange={e => setNegativePrompt(e.target.value)}
                    className="h-16 bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white resize-none focus:outline-none focus:border-red-500/50 transition-colors"
                />
             </div>

             <div className="flex gap-4">
                {isRunning ? (
                    <Button onClick={stopBatch} variant="default" className="w-full bg-red-500 hover:bg-red-600">
                        <StopCircle className="mr-2 h-4 w-4" /> Stop
                    </Button>
                ) : (
                    <Button onClick={startBatch} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        <PlayCircle className="mr-2 h-4 w-4" /> Generate
                    </Button>
                )}
                <Button onClick={downloadZip} variant="secondary">
                    <Download className="mr-2 h-4 w-4" /> ZIP
                </Button>
             </div>
        </div>

        {/* Gallery */}
        <div className="glass-panel p-6 rounded-3xl flex-1 overflow-hidden flex flex-col border-purple-500/10">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-400" />
                Gallery
            </h3>
            <div className="overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-min pb-10">
                {images.map((img) => (
                    <div key={img.index} className="relative group aspect-square bg-black/40 rounded-xl overflow-hidden border border-white/5">
                        {img.status === 'success' && img.url ? (
                            <img src={img.url} className="w-full h-full object-cover" alt={`Generated ${img.index}`} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-xs text-gray-500 p-2 text-center">
                                {img.status === 'loading' && <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2" />}
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

      <div className="glass-panel p-6 rounded-3xl flex flex-col h-[400px] lg:h-auto border-purple-500/10">
         <div className="flex justify-between items-center mb-4">
             <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">SD Logs</h3>
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
                    log.type === 'info' && "text-purple-300/80"
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
