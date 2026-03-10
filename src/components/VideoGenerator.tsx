"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Video, Play, Archive, X } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { cn } from "@/lib/utils";

type VideoEntry = {
  id: number;
  prompt: string;
  url?: string;
  blob?: Blob;
  status: "pending" | "loading" | "success" | "error";
  timestamp: string;
  filename: string;
  retryCount: number;
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState("A cinematic drone shot flying over a futuristic neon city during rain\nA fast-paced car chase through a cyberpunk alleyway");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoEntry | null>(null); // For Modal playback
  const [isZipping, setIsZipping] = useState(false);
  const isRunningRef = useRef(false);

  // Map aspect ratio to CSS class for gallery cards
  const getAspectClass = () => {
    if (aspectRatio === "9:16") return "aspect-[9/16]";
    if (aspectRatio === "1:1") return "aspect-square";
    return "aspect-video"; // 16:9
  };

  useEffect(() => {
    return () => {
      isRunningRef.current = false;
    };
  }, []);

  // Generate videos concurrently
  const generateVideos = async () => {
    const promptList = prompt.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    if (!promptList.length) return;

    setIsGenerating(true);
    isRunningRef.current = true;

    // Prepare UI with loading boxes
    const initialVideos: VideoEntry[] = promptList.map((p, i) => ({
      id: Date.now() + i,
      prompt: p,
      status: "loading",
      timestamp: new Date().toLocaleTimeString(),
      filename: `video_${i + 1}_${p.replace(/[^a-z0-9]/gi, '_').substring(0, 20)}.mp4`,
      retryCount: 0
    }));

    setVideos(initialVideos);

    // Map through array and fetch concurrently
    await Promise.allSettled(
      initialVideos.map(async (entry) => {
        let currentRetries = 0;
        let success = false;
        
        while (!success && isRunningRef.current) {
          try {
            if (currentRetries > 0) {
              const delay = Math.min(1000 * currentRetries, 10000) + Math.random() * 500;
              await sleep(delay);
              if (!isRunningRef.current) break;
              setVideos(prev => 
                prev.map(v => v.id === entry.id ? { ...v, status: 'loading', retryCount: currentRetries } : v)
              );
            }

            // Step 1: Get the signed Pollinations URL from our API (instant, <100ms)
            const seed = Math.floor(Math.random() * 999999) + (currentRetries * 13);
            const encodedPrompt = encodeURIComponent(entry.prompt);
            const urlRes = await fetch(`/api/generate-video?prompt=${encodedPrompt}&model=grok-video&aspect_ratio=${encodeURIComponent(aspectRatio)}&seed=${seed}`);

            if (!urlRes.ok) {
               throw new Error(`API error (${urlRes.status})`);
            }

            const { url: videoDirectUrl } = await urlRes.json();

            // Step 2: Fetch video DIRECTLY from Pollinations (bypasses Vercel 10s timeout)
            // Pollinations supports CORS (access-control-allow-origin: *) so this works
            const response = await fetch(videoDirectUrl);

            if (!response.ok) {
               throw new Error(`Video generation failed (${response.status})`);
            }

            const blob = await response.blob();
            if (!isRunningRef.current) break;

            const videoUrl = URL.createObjectURL(blob);

            setVideos(prev => 
              prev.map(v => v.id === entry.id ? { ...v, status: 'success', url: videoUrl, blob } : v)
            );
            success = true;

          } catch (error) {
             currentRetries++;
          }
        }
      })
    );

    if (isRunningRef.current) {
      setIsGenerating(false);
    }
  };

  const downloadZip = async () => {
    const successVideos = videos.filter(v => v.status === 'success' && v.blob);
    if (!successVideos.length) return;

    setIsZipping(true);
    const zip = new JSZip();
    const folder = zip.folder("generated_videos");
    
    successVideos.forEach((entry) => {
      if (entry.blob) {
        folder?.file(entry.filename, entry.blob);
      }
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `VideoGenAi_batch_${Date.now()}.zip`);
    setIsZipping(false);
  };

  const clearGallery = () => {
    isRunningRef.current = false;
    setIsGenerating(false);
    videos.forEach(v => {
      if (v.url) URL.revokeObjectURL(v.url);
    });
    setVideos([]);
  };

  const completedCount = videos.filter(v => v.status === "success").length;
  const progressPercent = videos.length > 0 ? Math.round((completedCount / videos.length) * 100) : 0;

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
      {/* LEFT: Controls & Input */}
      <div className="flex flex-col gap-6">
        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
             {/* Model info & Aspect Ratio selector */}
             <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Video Model</label>
                   <span className="text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 flex items-center gap-1">
                     <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
                     Grok Video
                   </span>
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Aspect Ratio</label>
                   <select
                       value={aspectRatio}
                       onChange={e => setAspectRatio(e.target.value)}
                       disabled={isGenerating}
                       className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500 [&>option]:text-black"
                   >
                       <option value="16:9">16:9 (Landscape)</option>
                       <option value="9:16">9:16 (Portrait)</option>
                       <option value="1:1">1:1 (Square)</option>
                   </select>
                </div>
             </div>

             <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Prompts (One per line)</label>
                <textarea 
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Describe the videos you want to generate in detail.&#10;&#10;Enter EACH prompt on a NEW LINE to generate them in Parallel!&#10;Outputs are natively forced to 1080p Landscape."
                    className="h-40 bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white resize-none focus:outline-none focus:border-sky-500 transition-colors"
                />
             </div>

             <div className="flex gap-4">
                 <Button 
                    onClick={generateVideos} 
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full relative overflow-hidden text-base shadow-lg shadow-sky-500/20"
                 >
                    {isGenerating ? (
                        <>
                            <div className="absolute left-0 top-0 bottom-0 bg-sky-400/20 transition-all duration-300 pointer-events-none" style={{ width: `${progressPercent}%` }} />
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                            Generating {progressPercent}% ({completedCount}/{videos.length})
                        </>
                    ) : (
                        <>
                            <Video className="mr-2 h-5 w-5" /> Generate Videos (Parallel)
                        </>
                    )}
                </Button>
             </div>
        </div>

        {/* Gallery Area */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col">
            {/* Header with count and zipping option */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Video className="h-5 w-5 text-sky-400" />
                    Video Gallery
                </h3>
                
                <div className="flex items-center gap-3">
                   {videos.length > 0 && (
                     <>
                        <button
                          onClick={downloadZip}
                          disabled={isZipping || completedCount === 0}
                          className="text-xs bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors font-medium shadow-md shadow-sky-500/20"
                        >
                          {isZipping ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Archive className="h-3 w-3" />} 
                          {isZipping ? 'Zipping...' : 'Download ZIP'}
                        </button>
                        <button onClick={clearGallery} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                            <Trash2 className="h-3 w-3" /> Clear
                        </button>
                     </>
                   )}
                </div>
            </div>
            
            {/* Fixed height gallery with scroll */}
            <div className="h-[500px] overflow-y-auto pr-2">
                {videos.length === 0 ? (
                    <div className="text-gray-600 italic text-sm text-center py-20 flex flex-col items-center justify-center">
                        <Video className="h-10 w-10 mx-auto mb-4 opacity-30" />
                        <p>No videos generated yet.</p>
                        <p className="text-xs mt-1">Videos will automatically appear here as a grid.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 auto-rows-min">
                        {videos.map((vid, index) => (
                            <div 
                                key={vid.id} 
                                className={`relative group ${getAspectClass()} bg-black/40 rounded-xl overflow-hidden border border-white/5 cursor-pointer shadow-xl`}
                                onClick={() => vid.status === 'success' && setSelectedVideo(vid)}
                            >
                                {vid.status === 'success' && vid.url ? (
                                    <>
                                        <video 
                                            src={vid.url} 
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                                            autoPlay muted loop playsInline 
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Play className="h-10 w-10 text-white drop-shadow-xl" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-xs text-gray-500 p-4 text-center">
                                        {vid.status === 'loading' && (
                                            <>
                                                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
                                                <span className={cn("text-sky-300/80 animate-pulse", vid.retryCount > 0 && "text-amber-400")}>
                                                    {vid.retryCount > 0 ? `Retry #${vid.retryCount}...` : "Rendering Video..."}
                                                </span>
                                            </>
                                        )}
                                        {vid.status === 'error' && <span className="text-red-400">Generation Failed</span>}
                                        {vid.status === 'pending' && <span className="opacity-50">Pending</span>}
                                    </div>
                                )}
                                
                                {/* Overlay with download button */}
                                {vid.status === 'success' && (
                                    <div className="absolute inset-0 bg-transparent flex flex-col justify-between pointer-events-none p-3">
                                        <div className="flex justify-end pointer-events-auto">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (vid.url) {
                                                        const a = document.createElement('a');
                                                        a.href = vid.url;
                                                        a.download = vid.filename;
                                                        a.click();
                                                    }
                                                }}
                                                className="bg-black/50 hover:bg-black/80 backdrop-blur-md p-2 rounded-lg transition-colors border border-white/10"
                                                title="Download MP4"
                                            >
                                                <Download className="h-4 w-4 text-white" />
                                            </button>
                                        </div>
                                        <div className="bg-gradient-to-t from-black/90 to-transparent -mx-3 -mb-3 p-3 pt-6 pointer-events-auto">
                                            <p className="text-[11px] text-white/90 line-clamp-2 leading-tight drop-shadow-md">{vid.prompt}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 bg-black/80 px-2 py-0.5 rounded-md text-[10px] text-white font-mono backdrop-blur-md border border-white/10 shadow-sm pointer-events-none">
                                    #{index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>

      {/* Video Modal (Fullscreen Playback) */}
      {selectedVideo && (
        <div 
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 lg:p-10"
            onClick={() => setSelectedVideo(null)}
        >
            <div className="relative w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
                {/* Close button */}
                <button
                    onClick={() => setSelectedVideo(null)}
                    className="absolute -top-12 right-0 text-white/60 hover:text-white p-2 transition-colors z-50"
                >
                    <X className="h-6 w-6" />
                </button>
                
                {/* Video Player Main */}
                <div className="flex-1 w-full bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
                    <video 
                        src={selectedVideo.url} 
                        className="w-full h-full object-contain"
                        controls
                        autoPlay
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
                
                {/* Info bar */}
                <div className="shrink-0 mt-6 flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
                    <div className="flex-1 pr-6">
                        <p className="text-sky-400 font-mono text-xs mb-1.5 uppercase tracking-wider">Grok-Video • Full HD 1080p</p>
                        <p className="text-white text-sm md:text-base leading-relaxed">{selectedVideo.prompt}</p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (selectedVideo.url) {
                                const a = document.createElement('a');
                                a.href = selectedVideo.url;
                                a.download = selectedVideo.filename;
                                a.click();
                            }
                        }}
                        className="bg-sky-500 hover:bg-sky-400 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-lg shadow-sky-500/20"
                    >
                        <Download className="h-5 w-5" />
                        Download MP4
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
