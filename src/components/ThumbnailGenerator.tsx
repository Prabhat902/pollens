"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Trash2, RefreshCw, Sparkles, Image as ImageIcon, X, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

type LogEntry = {
  time: string;
  msg: string;
  type: "info" | "success" | "error" | "warn";
};

export default function ThumbnailGenerator() {
  const [videoTitle, setVideoTitle] = useState("");
  const [imageDescription, setImageDescription] = useState("");
  const [characterCount, setCharacterCount] = useState("1");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [seed, setSeed] = useState(Math.floor(Math.random() * 999999));
  
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [
      ...prev.slice(-49),
      { time: new Date().toLocaleTimeString(), msg, type },
    ]);
  };

  const buildPrompt = (): string => {
    const chars = parseInt(characterCount) || 1;
    const charText = chars === 0
      ? "no people or characters"
      : chars === 1
        ? "1 character/person"
        : `${chars} characters/people`;
    
    return `YouTube thumbnail, ultra high CTR, 16:9 aspect ratio, vibrant saturated colors, bold dramatic composition, ${charText}, video title text: "${videoTitle}", scene description: ${imageDescription}, eye-catching, professional YouTube thumbnail style, trending, dramatic cinematic lighting, depth of field, high contrast, clean sharp focus, 4K quality`;
  };

  const generateThumbnail = async () => {
    if (!videoTitle.trim()) {
      addLog("Please enter a video title!", "error");
      return;
    }
    if (!imageDescription.trim()) {
      addLog("Please enter an image description!", "error");
      return;
    }

    setIsGenerating(true);
    const newSeed = Math.floor(Math.random() * 999999);
    setSeed(newSeed);
    
    const prompt = buildPrompt();
    setCurrentPrompt(prompt);
    addLog("Building optimized thumbnail prompt...", "info");
    addLog(`Prompt: ${prompt}`, "info");
    addLog("Sending to Pollinations AI (1280×720, 16:9)...", "info");

    const url = `/api/generate-image?prompt=${encodeURIComponent(prompt)}&width=1280&height=720&seed=${newSeed}`;

    try {
      // Load image via Image element to validate it
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image generation failed"));
        img.src = url;
      });

      setThumbnailUrl(url);
      addLog("Thumbnail generated successfully!", "success");
    } catch (error: any) {
      addLog(`Error: ${error.message || "Failed to generate thumbnail"}`, "error");
      setThumbnailUrl(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateThumbnail = () => {
    addLog("Regenerating with new seed...", "info");
    generateThumbnail();
  };

  const downloadThumbnail = () => {
    if (!thumbnailUrl) return;
    const a = document.createElement("a");
    a.href = thumbnailUrl;
    a.download = `thumbnail_${videoTitle.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.png`;
    a.click();
    addLog("Thumbnail downloaded!", "success");
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* LEFT: Inputs & Preview */}
        <div className="flex flex-col gap-6">
          {/* Input Card */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <Youtube className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">Thumbnail Creator</h3>
                <p className="text-xs text-gray-400">Fill in the details below to generate a high-CTR thumbnail</p>
              </div>
            </div>

            {/* Video Title */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Video Title
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="e.g. How I Made $10K in 30 Days"
                className="aura-input rounded-xl px-4 py-3 text-sm text-gray-800"
              />
            </div>

            {/* Image Description */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Image Description
              </label>
              <textarea
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                placeholder="Describe the thumbnail scene... e.g. A person with a shocked expression holding stacks of money, with a luxury car in the background"
                className="h-28 aura-input rounded-2xl p-4 text-sm text-gray-800 resize-none transition-all"
              />
            </div>

            {/* Number of Characters */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Number of Characters in Image
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={characterCount}
                onChange={(e) => setCharacterCount(e.target.value)}
                placeholder="e.g. 2"
                className="aura-input rounded-xl px-4 py-3 text-sm text-gray-800 w-32"
              />
              <p className="text-[11px] text-gray-400">How many people/characters should appear in the thumbnail</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                onClick={generateThumbnail}
                disabled={isGenerating}
                className="flex-1 btn-aura text-white font-bold tracking-wide border-none"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Thumbnail
                  </>
                )}
              </Button>

              {thumbnailUrl && (
                <>
                  <Button
                    onClick={regenerateThumbnail}
                    disabled={isGenerating}
                    variant="outline"
                    className="bg-white/50 border-gray-200 hover:bg-white text-gray-700 hover:text-aura-purple transition-all duration-300 shadow-sm"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                  <Button
                    onClick={downloadThumbnail}
                    variant="outline"
                    className="bg-white/50 border-gray-200 hover:bg-white text-gray-700 hover:text-aura-purple transition-all duration-300 shadow-sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Preview Card */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <ImageIcon className="h-5 w-5 text-aura-magenta" />
                Thumbnail Preview
              </h3>
              {thumbnailUrl && (
                <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  1280 × 720
                </span>
              )}
            </div>

            <div className="relative aspect-video bg-white/40 rounded-2xl overflow-hidden border border-gray-200 transition-all duration-500">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  className="w-full h-full object-cover transition-opacity duration-500"
                  alt="Generated YouTube Thumbnail"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                  {isGenerating ? (
                    <>
                      <div className="w-10 h-10 border-3 border-pink-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-medium text-gray-500">Generating your thumbnail...</p>
                      <p className="text-xs text-gray-400">This may take a few seconds</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium">Your thumbnail will appear here</p>
                      <p className="text-xs text-gray-400">16:9 • 1280 × 720px</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Prompt Display */}
            {currentPrompt && (
              <div className="mt-4 p-3 bg-white/40 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Generated Prompt</p>
                <p className="text-xs text-gray-600 leading-relaxed">{currentPrompt}</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Activity Log */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col h-[400px] lg:h-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm flex items-center gap-2 font-bold uppercase tracking-wider text-aura-purple">
              <span className="w-2 h-2 rounded-full bg-aura-purple animate-pulse" />
              Activity Log
            </h3>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-gray-400 hover:text-aura-magenta flex items-center gap-1 transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          </div>
          <div
            ref={logContainerRef}
            className="flex-1 overflow-y-auto font-mono text-xs space-y-1 aura-input p-4 rounded-xl border-none"
          >
            {logs.length === 0 && (
              <div className="text-gray-600 italic">Ready to generate thumbnails...</div>
            )}
            {logs.map((log, i) => (
              <div
                key={i}
                className={cn(
                  "break-all",
                  log.type === "error" && "text-red-500",
                  log.type === "warn" && "text-amber-500",
                  log.type === "success" && "text-emerald-500",
                  log.type === "info" && "text-gray-700"
                )}
              >
                <span className="opacity-30 mr-2">[{log.time}]</span>
                {log.msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
