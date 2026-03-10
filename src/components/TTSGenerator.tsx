"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Play, Pause, Volume2, Mic, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

type AudioEntry = {
  id: number;
  text: string;
  voice: string;
  url: string;
  blob: Blob;
  timestamp: string;
  format: string;
};

type VoiceInfo = {
  name: string;
  gender: string;
  accent: string;
  description: string;
  hasPreview: boolean;
  hasHindiPreview: boolean;
};

const VOICES: VoiceInfo[] = [
  // ElevenLabs premade voices (with offline preview)
  { name: "sarah", gender: "female", accent: "american", description: "Mature, Reassuring, Confident", hasPreview: true, hasHindiPreview: true },
  { name: "charlie", gender: "male", accent: "australian", description: "Deep, Confident, Energetic", hasPreview: true, hasHindiPreview: true },
  { name: "george", gender: "male", accent: "british", description: "Warm, Captivating Storyteller", hasPreview: true, hasHindiPreview: true },
  { name: "callum", gender: "male", accent: "american", description: "Husky Trickster", hasPreview: true, hasHindiPreview: true },
  { name: "liam", gender: "male", accent: "american", description: "Energetic, Social Media Creator", hasPreview: true, hasHindiPreview: true },
  { name: "matilda", gender: "female", accent: "american", description: "Knowledgeable, Professional", hasPreview: true, hasHindiPreview: true },
  { name: "bella", gender: "female", accent: "american", description: "Professional, Bright, Warm", hasPreview: true, hasHindiPreview: true },
  { name: "brian", gender: "male", accent: "american", description: "Deep, Resonant, Comforting", hasPreview: true, hasHindiPreview: true },
  { name: "daniel", gender: "male", accent: "british", description: "Steady Broadcaster", hasPreview: true, hasHindiPreview: true },
  { name: "lily", gender: "female", accent: "british", description: "Velvety Actress", hasPreview: true, hasHindiPreview: true },
  { name: "adam", gender: "male", accent: "american", description: "Dominant, Firm", hasPreview: true, hasHindiPreview: true },
  { name: "bill", gender: "male", accent: "american", description: "Wise, Mature, Balanced", hasPreview: true, hasHindiPreview: true },
  // OpenAI-compatible voices (now with offline previews!)
  { name: "alloy", gender: "neutral", accent: "american", description: "Versatile, Balanced", hasPreview: true, hasHindiPreview: true },
  { name: "echo", gender: "male", accent: "american", description: "Smooth, Natural", hasPreview: true, hasHindiPreview: true },
  { name: "fable", gender: "male", accent: "british", description: "Expressive, Story-like", hasPreview: true, hasHindiPreview: true },
  { name: "onyx", gender: "male", accent: "american", description: "Deep, Authoritative", hasPreview: true, hasHindiPreview: true },
  { name: "nova", gender: "female", accent: "american", description: "Friendly, Upbeat", hasPreview: true, hasHindiPreview: true },
  { name: "shimmer", gender: "female", accent: "american", description: "Soft, Gentle", hasPreview: true, hasHindiPreview: true },
  { name: "ash", gender: "male", accent: "american", description: "Calm, Composed", hasPreview: true, hasHindiPreview: true },
  { name: "ballad", gender: "male", accent: "american", description: "Melodic, Warm", hasPreview: true, hasHindiPreview: true },
  { name: "coral", gender: "female", accent: "american", description: "Clear, Articulate", hasPreview: true, hasHindiPreview: true },
  { name: "sage", gender: "female", accent: "american", description: "Thoughtful, Considered", hasPreview: true, hasHindiPreview: true },
  { name: "verse", gender: "neutral", accent: "american", description: "Poetic, Rhythmic", hasPreview: true, hasHindiPreview: true },
  { name: "rachel", gender: "female", accent: "american", description: "Warm, Engaging", hasPreview: false, hasHindiPreview: false },
  { name: "domi", gender: "female", accent: "american", description: "Strong, Dynamic", hasPreview: false, hasHindiPreview: false },
  { name: "elli", gender: "female", accent: "american", description: "Sweet, Young", hasPreview: false, hasHindiPreview: false },
  { name: "charlotte", gender: "female", accent: "european", description: "Elegant, Seductive", hasPreview: false, hasHindiPreview: false },
  { name: "dorothy", gender: "female", accent: "british", description: "Pleasant, Friendly", hasPreview: false, hasHindiPreview: false },
  { name: "emily", gender: "female", accent: "american", description: "Calm, Natural", hasPreview: false, hasHindiPreview: false },
  { name: "antoni", gender: "male", accent: "american", description: "Well-Spoken, Approachable", hasPreview: false, hasHindiPreview: false },
  { name: "arnold", gender: "male", accent: "american", description: "Crisp, Animated", hasPreview: false, hasHindiPreview: false },
  { name: "josh", gender: "male", accent: "american", description: "Deep, Distinct", hasPreview: false, hasHindiPreview: false },
  { name: "sam", gender: "male", accent: "american", description: "Raspy, Lively", hasPreview: false, hasHindiPreview: false },
  { name: "james", gender: "male", accent: "australian", description: "Calm, Authoritative", hasPreview: false, hasHindiPreview: false },
  { name: "fin", gender: "male", accent: "irish", description: "Rugged, Seasoned", hasPreview: false, hasHindiPreview: false },
];

const LANGUAGES = [
  { code: "auto", label: "Auto Detect" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "en", label: "English" },
  { code: "es", label: "Español (Spanish)" },
  { code: "fr", label: "Français (French)" },
  { code: "de", label: "Deutsch (German)" },
  { code: "ja", label: "日本語 (Japanese)" },
  { code: "ko", label: "한국어 (Korean)" },
  { code: "zh", label: "中文 (Chinese)" },
  { code: "pt", label: "Português (Portuguese)" },
  { code: "ar", label: "العربية (Arabic)" },
  { code: "it", label: "Italiano (Italian)" },
  { code: "ru", label: "Русский (Russian)" },
];

const FORMATS = ["mp3", "opus", "aac", "flac", "wav"];

const MAX_CHARS = 15000;

function splitText(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let remainingText = text;

  while (remainingText.length > 0) {
    if (remainingText.length <= maxLength) {
      chunks.push(remainingText);
      break;
    }

    let splitPos = -1;
    const delimiters = ['\n', '।', '.', '!', '?'];
    for (const d of delimiters) {
      const pos = remainingText.lastIndexOf(d, maxLength);
      if (pos > 0) {
        splitPos = pos + d.length;
        break;
      }
    }

    if (splitPos === -1) {
      splitPos = remainingText.lastIndexOf(' ', maxLength);
    }

    if (splitPos === -1) {
      splitPos = maxLength;
    }

    chunks.push(remainingText.substring(0, splitPos).trim());
    remainingText = remainingText.substring(splitPos).trim();
  }

  return chunks.filter(c => c.length > 0);
}

export default function TTSGenerator() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("sarah");
  const [speed, setSpeed] = useState(1.0);
  const [format, setFormat] = useState("mp3");
  const [language, setLanguage] = useState("auto");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<AudioEntry[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewVoice, setPreviewVoice] = useState<string | null>(null);
  const [progress, setProgress] = useState<{current: number, total: number} | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const idCounter = useRef(0);

  const selectedVoice = VOICES.find((v) => v.name === voice);

  const playPreview = (voiceName: string) => {
    const v = VOICES.find((v) => v.name === voiceName);
    if (!v?.hasPreview) return;

    // Use Hindi preview when language is set to Hindi and available
    const useHindi = language === "hi" && v.hasHindiPreview;
    const previewKey = useHindi ? `${voiceName}_hi` : voiceName;

    if (previewVoice === previewKey) {
      previewAudioRef.current?.pause();
      setPreviewVoice(null);
      return;
    }

    if (previewAudioRef.current) {
      const suffix = useHindi ? `${voiceName}_hi` : voiceName;
      previewAudioRef.current.src = `/voice-previews/${suffix}.mp3`;
      previewAudioRef.current.play();
      setPreviewVoice(previewKey);
    }
  };

  const generateAudio = async () => {
    if (!text.trim()) return;
    if (text.length > MAX_CHARS) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Chunk size 200 to be extremely safe for Hindi characters which encode to ~9 bytes each.
      // 200 * 9 = 1800 bytes, well under standard URL limits.
      const textChunks = splitText(text.trim(), 200);
      const audioBlobs: Blob[] = [];
      const totalChunks = textChunks.length;

      // Determine the correct model based on voice selection.
      // OpenAI voices use the vastly cheaper/free openai-audio model!
      const isElevenLabsVoice = VOICES.findIndex(v => v.name === voice) < 12;
      const targetModel = isElevenLabsVoice ? "elevenlabs" : "openai-audio";

      setProgress({ current: 0, total: totalChunks });

      for (let i = 0; i < totalChunks; i++) {
        const chunk = textChunks[i];
        
        const params = new URLSearchParams({
          model: targetModel,
          voice,
          response_format: format,
        });

        if (speed !== 1.0) {
          params.set("speed", speed.toString());
        }

        const encodedText = encodeURIComponent(chunk);
        const url = `/api/generate-audio?text=${encodedText}&${params.toString()}`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errMsg = errorData?.error?.message || errorData?.details?.fieldErrors?.input?.[0] || errorData?.message || `Generation failed (${response.status})`;
          throw new Error(totalChunks > 1 ? `Chunk ${i + 1}/${totalChunks} failed: ${errMsg}` : errMsg);
        }

        const blob = await response.blob();
        audioBlobs.push(blob);
        setProgress({ current: i + 1, total: totalChunks });
      }

      // Concatenate the blobs 
      const finalBlob = new Blob(audioBlobs, { type: audioBlobs[0].type });
      const audioUrl = URL.createObjectURL(finalBlob);

      const entry: AudioEntry = {
        id: ++idCounter.current,
        text: text.trim(),
        voice,
        url: audioUrl,
        blob: finalBlob,
        timestamp: new Date().toLocaleTimeString(),
        format,
      };

      setHistory((prev) => [entry, ...prev]);

      // Auto-play the generated audio
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setCurrentlyPlaying(entry.id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate audio");
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  const playEntry = (entry: AudioEntry) => {
    if (audioRef.current) {
      if (currentlyPlaying === entry.id) {
        audioRef.current.pause();
        setCurrentlyPlaying(null);
      } else {
        audioRef.current.src = entry.url;
        audioRef.current.play();
        setCurrentlyPlaying(entry.id);
      }
    }
  };

  const downloadEntry = (entry: AudioEntry) => {
    const a = document.createElement("a");
    a.href = entry.url;
    a.download = `tts_${entry.voice}_${entry.id}.${entry.format}`;
    a.click();
  };

  const removeEntry = (id: number) => {
    setHistory((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (entry) URL.revokeObjectURL(entry.url);
      return prev.filter((e) => e.id !== id);
    });
    if (currentlyPlaying === id) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    }
  };

  const clearHistory = () => {
    history.forEach((e) => URL.revokeObjectURL(e.url));
    setHistory([]);
    audioRef.current?.pause();
    setCurrentlyPlaying(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
      {/* Hidden audio elements */}
      <audio
        ref={audioRef}
        onEnded={() => setCurrentlyPlaying(null)}
        className="hidden"
      />
      <audio
        ref={previewAudioRef}
        onEnded={() => setPreviewVoice(null)}
        className="hidden"
      />

      {/* LEFT: Controls */}
      <div className="flex flex-col gap-6">
        {/* Input Panel */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-5">
          {/* Language hint */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500 [&>option]:text-black"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500">
              ElevenLabs v3 auto-detects language from your text. Write in your
              target language for best results.
            </p>
          </div>

          {/* Voice selector with preview */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Voice
            </label>
            <div className="flex gap-2">
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500 [&>option]:text-black"
              >
                <optgroup label="⭐ Premade Voices (with preview)">
                  {VOICES.filter((v) => v.hasPreview).map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name.charAt(0).toUpperCase() + v.name.slice(1)} — {v.description} ({v.gender}, {v.accent})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="OpenAI-compatible Voices">
                  {VOICES.filter((v) => !v.hasPreview).map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name.charAt(0).toUpperCase() + v.name.slice(1)} — {v.description} ({v.gender})
                    </option>
                  ))}
                </optgroup>
              </select>
              {selectedVoice?.hasPreview && (
                <button
                  onClick={() => playPreview(voice)}
                  className={cn(
                    "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    previewVoice?.startsWith(voice)
                      ? "bg-sky-500 text-white animate-pulse"
                      : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                  )}
                  title={language === "hi" && selectedVoice.hasHindiPreview ? "Preview voice in Hindi (offline)" : "Preview voice (offline)"}
                >
                  <Headphones className="h-4 w-4" />
                </button>
              )}
            </div>
            {selectedVoice && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">
                  {selectedVoice.gender}
                </span>
                <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">
                  {selectedVoice.accent}
                </span>
                <span className="text-[10px] text-gray-500">
                  {selectedVoice.description}
                </span>
                {selectedVoice.hasPreview && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                    ♫ {language === "hi" && selectedVoice.hasHindiPreview ? "हिन्दी preview" : "preview"}
                  </span>
                )}
                {language === "hi" && selectedVoice.hasHindiPreview && (
                  <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full">
                    🇮🇳 Hindi
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Speed + Format row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Speed ({speed.toFixed(2)}x)
              </label>
              <input
                type="range"
                min="0.25"
                max="4.0"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-sky-500 mt-2"
              />
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>0.25x</span>
                <span>1x</span>
                <span>4x</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500 [&>option]:text-black"
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Text area */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Text to speak
              </label>
              <span
                className={cn(
                  "text-[11px] font-mono",
                  text.length > MAX_CHARS ? "text-red-400" : "text-gray-500"
                )}
              >
                {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                language === "hi"
                  ? "यहाँ हिन्दी में टेक्स्ट लिखें..."
                  : "Enter text to convert to speech..."
              }
              className="h-48 bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white resize-none focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Generate button */}
          <Button
            onClick={generateAudio}
            disabled={isGenerating || !text.trim() || text.length > MAX_CHARS}
            className="w-full relative overflow-hidden"
          >
            {isGenerating ? (
              <>
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-sky-400/20 transition-all duration-300 pointer-events-none"
                  style={{ width: progress ? `${(progress.current / progress.total) * 100}%` : '0%' }}
                />
                <div className="relative flex items-center justify-center z-10 w-full font-medium">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {progress && progress.total > 1 
                    ? `Generating... ${Math.round((progress.current / progress.total) * 100)}%` 
                    : "Generating Audio..."}
                </div>
              </>
            ) : (
              <>
                <Volume2 className="mr-2 h-4 w-4" /> Generate Speech
              </>
            )}
          </Button>
        </div>

        {/* Now Playing Panel */}
        {history.length > 0 && history[0] && (
          <div className="glass-panel p-5 rounded-3xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center shrink-0">
                <Volume2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  Latest Generation
                </p>
                <p className="text-xs text-gray-400">
                  Voice: {history[0].voice} • Format: {history[0].format}
                </p>
              </div>
            </div>
            <audio
              controls
              src={history[0].url}
              className="w-full h-10 rounded-lg"
              style={{ filter: "invert(1) hue-rotate(180deg)", opacity: 0.8 }}
            />
          </div>
        )}
      </div>

      {/* RIGHT: History Panel */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col h-[400px] lg:h-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <Mic className="h-4 w-4" /> History
          </h3>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {history.length === 0 && (
            <div className="text-gray-600 italic text-sm text-center py-12">
              <Volume2 className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p>No audio generated yet.</p>
              <p className="text-xs mt-1">
                Enter text and click Generate to get started.
              </p>
            </div>
          )}

          {history.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "bg-black/30 border rounded-xl p-3 transition-all",
                currentlyPlaying === entry.id
                  ? "border-sky-500/50 shadow-lg shadow-sky-500/10"
                  : "border-white/5 hover:border-white/10"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Play/Pause */}
                <button
                  onClick={() => playEntry(entry)}
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    currentlyPlaying === entry.id
                      ? "bg-sky-500 text-white"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  )}
                >
                  {currentlyPlaying === entry.id ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" />
                  )}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">
                    {entry.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                      {entry.voice}
                    </span>
                    <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                      {entry.format}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {entry.timestamp}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => downloadEntry(entry)}
                    className="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5 text-white/60" />
                  </button>
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="bg-white/10 hover:bg-red-500/30 p-1.5 rounded-lg transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-white/60" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
