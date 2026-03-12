"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, Trash2, StopCircle, PlayCircle, Image as ImageIcon, X } from "lucide-react";
import JSZip from "jszip";
import { cn } from "@/lib/utils";

type ImageResult = {
  index: number;
  prompt: string;
  url?: string;
  blob?: Blob;
  status: "pending" | "loading" | "success" | "error";
  retryCount: number;
  filename: string;
};

type LogEntry = {
  time: string;
  msg: string;
  type: "info" | "success" | "error" | "warn";
};

export default function PollinationsGenerator() {
  // Kaggle mode commented out
  // const [mode, setMode] = useState<"pollinations" | "kaggle">("pollinations");
  // const [kaggleUrl, setKaggleUrl] = useState(""); // ngrok URL from Kaggle
  const [promptsText, setPromptsText] = useState("Cyberpunk city in neon rain\nSurreal desert with giant trees");
  const [resolution, setResolution] = useState("1280x720");
  const workers = 100; // Fixed at 100 parallel

  // Get aspect ratio class based on resolution
  const getAspectClass = () => {
    if (resolution === "768x1024") return "aspect-[3/4]"; // Portrait
    if (resolution === "1024x1024") return "aspect-square"; // Square
    return "aspect-video"; // Landscape (default)
  };
  
  const [isRunning, setIsRunning] = useState(false);
  const [images, setImages] = useState<ImageResult[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null); // For modal
  const [isZipping, setIsZipping] = useState(false);
  
  // Ref to track running state inside async loops without closure staleness
  const isRunningRef = useRef(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [
      ...prev.slice(-99),
      { time: new Date().toLocaleTimeString(), msg, type },
    ]);
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  /* Kaggle mode commented out
  const generateImageKaggle = async (task: ImageResult) => {...};
  */

  // Generate image via backend API
  const generateImagePollinations = async (task: ImageResult) => {
    if (!isRunningRef.current) return;

    setImages(prev => prev.map(img => img.index === task.index ? { ...img, status: 'loading' } : img));

    const [w, h] = resolution.split("x");
    let currentRetries = task.retryCount;

    while (isRunningRef.current) {
        const seed = Math.floor(Math.random() * 999999) + (currentRetries * 13);
        // Use our backend API instead of direct Pollinations call
        const url = `/api/generate-image?prompt=${encodeURIComponent(task.prompt)}&width=${w}&height=${h}&seed=${seed}`;

        try {
            if (currentRetries > 0) {
                 const delay = Math.min(1000 * (currentRetries + 1), 10000) + Math.random() * 500;
                 await sleep(delay);
                 setImages(prev => prev.map(img => 
                    img.index === task.index ? { ...img, retryCount: currentRetries } : img
                 ));
            }

            await new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => reject(new Error("Image load failed"));
                img.src = url;
            });

            setImages(prev => prev.map(img => 
                img.index === task.index ? { ...img, status: 'success', url: url } : img
            ));
            
            return;

        } catch (error: any) {
            currentRetries++;
            if (!isRunningRef.current) break;
        }
    }
  };

  const generateImage = async (task: ImageResult) => {
    return generateImagePollinations(task);
  };

  const startBatch = async () => {
    const promptList = promptsText.split("\n").filter(p => p.trim());
    if (!promptList.length) return;

    setIsRunning(true);
    isRunningRef.current = true;
    setLogs([]);
    addLog(`Starting batch of ${promptList.length} images...`, 'info');

    // Initialize images
    const initialImages: ImageResult[] = promptList.map((p, i) => ({
        index: i + 1,
        prompt: p.trim(),
        status: "pending",
        retryCount: 0,
        filename: `image_${i + 1}.png`
    }));
    setImages(initialImages);

    // Concurrency Control
    const queue = [...initialImages];
    const activePromises: Promise<void>[] = [];

    const worker = async () => {
        while (queue.length > 0 && isRunningRef.current) {
            const task = queue.shift();
            if (task) {
                await generateImage(task);
            }
        }
    };

    // Spin up workers
    for (let i = 0; i < workers; i++) {
        activePromises.push(worker());
    }

    await Promise.all(activePromises);
    setIsRunning(false);
    isRunningRef.current = false;
    addLog("Batch processing complete.", 'success');
  };

  const stopBatch = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    addLog("Batch stopped by user.", 'warn');
  };

  const downloadZip = async () => {
    const successImages = images.filter(img => img.status === 'success' && img.url);
    if (!successImages.length) return alert("No images to download");

    setIsZipping(true);
    addLog(`Preparing ZIP with ${successImages.length} images...`, 'info');
    const zip = new JSZip();
    
    // Fetch each image using canvas to get blob data
    for (const img of successImages) {
      try {
        const imgEl = new Image();
        imgEl.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          imgEl.onload = () => resolve();
          imgEl.onerror = () => reject();
          imgEl.src = img.url!;
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = imgEl.naturalWidth;
        canvas.height = imgEl.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(imgEl, 0, 0);
        
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          zip.file(img.filename, blob);
        }
      } catch {
        addLog(`Failed to add image #${img.index} to ZIP`, 'warn');
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `imageGenAi_batch_${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setIsZipping(false);
    addLog("ZIP downloaded!", 'success');
  };

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
      {/* LEFT: Controls & Input */}
      <div className="flex flex-col gap-6">
        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
             {/* Resolution dropdown only - Mode toggle and Threads removed */}
             <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resolution</label>
                <select 
                    value={resolution} 
                    onChange={e => setResolution(e.target.value)}
                    className="aura-input rounded-xl px-4 py-3 text-sm text-gray-800"
                >
                    <option value="1280x720">1280x720 (Wide)</option>
                    <option value="1024x1024">1024x1024 (Square)</option>
                    <option value="768x1024">768x1024 (Portrait)</option>
                </select>
             </div>

             <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prompts (One per line)</label>
                <textarea 
                    value={promptsText}
                    onChange={e => setPromptsText(e.target.value)}
                    className="h-40 aura-input rounded-2xl p-4 text-sm text-gray-800 resize-none transition-all"
                />
             </div>

             <div className="flex gap-4">
                {isRunning ? (
                    <Button onClick={stopBatch} variant="default" className="w-full bg-red-400 hover:bg-red-500 border-none text-white shadow-md">
                        <StopCircle className="mr-2 h-4 w-4" /> Stop Batch
                    </Button>
                ) : (
                    <Button onClick={startBatch} className="w-full btn-aura text-white font-bold tracking-wide border-none">
                        <PlayCircle className="mr-2 h-4 w-4" /> Run Batch
                    </Button>
                )}
                <Button 
                    onClick={downloadZip} 
                    variant="outline"
                    className="bg-white/50 border-gray-200 hover:bg-white text-gray-700 hover:text-aura-purple transition-all duration-300 shadow-sm"
                    disabled={images.filter(i => i.status === 'success').length === 0 || isZipping}
                >
                    {isZipping ? (
                        <>
                            <div className="w-4 h-4 border-2 border-neon-blue border-t-transparent rounded-full animate-spin mr-2" />
                            Preparing...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" /> ZIP
                        </>
                    )}
                </Button>
             </div>
        </div>

        {/* Gallery Area */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col">
            {/* Header with count */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                    <ImageIcon className="h-5 w-5 text-aura-magenta" />
                    Studio Gallery
                </h3>
                <span className="text-sm text-gray-400">
                    {images.length > 0 && images.filter(i => i.status === 'success').length === images.length 
                        ? <span className="text-emerald-400 font-medium">Done ✓</span>
                        : `${images.filter(i => i.status === 'success').length} / ${images.length} complete`
                    }
                </span>
            </div>

            {/* Progress Bar - hide when 100% complete */}
            {images.length > 0 && images.filter(i => i.status === 'success').length < images.length && (
                <div className="mb-4">
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-neon-blue via-purple-500 to-neon-purple transition-all duration-300 shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                            style={{ width: `${(images.filter(i => i.status === 'success').length / images.length) * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                        {Math.round((images.filter(i => i.status === 'success').length / images.length) * 100)}% complete
                    </p>
                </div>
            )}
            
            {/* Fixed height gallery with scroll */}
            <div className="h-[500px] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-min">
                    {images.map((img) => (
                        <div 
                            key={img.index} 
                            className={`relative group ${getAspectClass()} bg-white/40 rounded-xl overflow-hidden border border-gray-200 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
                            onClick={() => img.status === 'success' && setSelectedImage(img)}
                        >
                            {img.status === 'success' && img.url ? (
                                <img src={img.url} className="w-full h-full object-cover" alt={`Generated ${img.index}`} />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-xs text-gray-500 p-2 text-center">
                                    {img.status === 'loading' && (
                                        <>
                                            <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-2" />
                                            <span className={cn(img.retryCount > 0 && "text-amber-400")}>
                                                {img.retryCount > 0 ? `Retry #${img.retryCount}` : "Generating..."}
                                            </span>
                                        </>
                                    )}
                                    {img.status === 'pending' && <span className="opacity-50">#{img.index} Pending</span>}
                                </div>
                            )}
                            
                            {/* Overlay with download button */}
                            {img.status === 'success' && (
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                    <div className="flex justify-end">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (img.url) {
                                                    const a = document.createElement('a');
                                                    a.href = img.url;
                                                    a.download = img.filename;
                                                    a.click();
                                                }
                                            }}
                                            className="bg-white/80 hover:bg-white text-gray-800 p-2 rounded-lg transition-colors shadow-sm"
                                            title="Download"
                                        >
                                            <Download className="h-4 w-4 text-gray-800" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-white/80 line-clamp-2 leading-tight">{img.prompt}</p>
                                </div>
                            )}
                            <div className="absolute top-2 left-2 bg-white/80 px-2 py-0.5 rounded-full text-[10px] text-gray-800 font-bold tracking-wider backdrop-blur-md shadow-sm border border-white/50">
                                #{img.index}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* RIGHT: Console */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col h-[400px] lg:h-auto">
         <div className="flex justify-between items-center mb-4">
             <h3 className="text-sm flex items-center gap-2 font-bold uppercase tracking-wider text-aura-purple">
                <span className="w-2 h-2 rounded-full bg-aura-purple animate-pulse" />
                Activity Log
             </h3>
             <button onClick={() => setLogs([])} className="text-xs text-gray-400 hover:text-aura-magenta flex items-center gap-1 transition-colors">
                 <Trash2 className="h-3 w-3" /> Clear
             </button>
         </div>
         <div ref={logContainerRef} className="flex-1 overflow-y-auto font-mono text-xs space-y-1 aura-input p-4 rounded-xl border-none">
            {logs.length === 0 && <div className="text-gray-600 italic">Ready...</div>}
            {logs.map((log, i) => (
                <div key={i} className={cn(
                    "break-all",
                    log.type === 'error' && "text-red-500",
                    log.type === 'warn' && "text-amber-500",
                    log.type === 'success' && "text-emerald-500",
                    log.type === 'info' && "text-gray-700"
                )}>
                    <span className="opacity-30 mr-2">[{log.time}]</span>
                    {log.msg}
                </div>
            ))}
         </div>
       </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
        >
            <div className="relative max-w-5xl max-h-[90vh] w-full">
                {/* Close button */}
                <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-12 right-0 text-white/60 hover:text-white p-2 transition-colors"
                >
                    <X className="h-6 w-6" />
                </button>
                
                {/* Image */}
                <div className="relative group p-1 rounded-xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)]">
                    <img 
                        src={selectedImage.url} 
                        alt={selectedImage.prompt}
                        className="w-full h-auto max-h-[80vh] object-contain rounded-lg bg-gray-100"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
                
                {/* Info bar */}
                <div className="mt-4 flex items-center justify-between glass-panel rounded-lg p-5 border-white border-[1px]">
                    <div className="flex-1 pr-4">
                        <p className="text-gray-500 text-xs mb-1 font-bold tracking-wider">#{selectedImage.index}</p>
                        <p className="text-gray-800 text-sm line-clamp-2 font-medium">{selectedImage.prompt}</p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (selectedImage.url) {
                                const a = document.createElement('a');
                                a.href = selectedImage.url;
                                a.download = selectedImage.filename;
                                a.click();
                            }
                        }}
                        className="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Download
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
