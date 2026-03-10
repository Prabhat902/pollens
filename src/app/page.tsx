"use client";

import React, { useState } from "react";
import ImageGenAIGenerator from "@/components/PollinationsGenerator";
import TTSGenerator from "@/components/TTSGenerator";
import VideoGenerator from "@/components/VideoGenerator";
import { Image as ImageIcon, Volume2, Video } from "lucide-react";

const TABS = [
  { id: "image", label: "Image Generation", icon: ImageIcon },
  { id: "tts", label: "Text to Speech", icon: Volume2 },
  { id: "video", label: "Video Generation", icon: Video },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("image");

  return (
    <main className="min-h-screen flex flex-col p-4 md:p-6 lg:p-8 gap-6 max-w-[1800px] mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div>
           <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
             ImageGenAI <span className="text-sky-500">Pro</span>
           </h1>
           <p className="text-sm text-gray-500">Professional AI Generation Suite</p>
        </div>

        {/* Tab Navigation */}
        <nav className="flex bg-black/20 border border-white/10 rounded-2xl p-1 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <div className="flex-1 overflow-visible">
        {activeTab === "image" && <ImageGenAIGenerator />}
        {activeTab === "tts" && <TTSGenerator />}
        {activeTab === "video" && <VideoGenerator />}
      </div>
    </main>
  );
}
