"use client";

import React from "react";
import ImageGenAIGenerator from "@/components/PollinationsGenerator";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col p-4 md:p-6 lg:p-8 gap-6 max-w-[1800px] mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div>
           <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
             ImageGenAI <span className="text-sky-500">Pro</span>
           </h1>
           <p className="text-sm text-gray-500">Professional AI Generation Suite</p>
        </div>
      </header>

      <div className="flex-1 overflow-visible">
        <ImageGenAIGenerator />
      </div>
    </main>
  );
}
