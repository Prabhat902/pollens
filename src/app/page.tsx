"use client";

import React from "react";
import ImageGenAIGenerator from "@/components/PollinationsGenerator";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col p-4 md:p-6 lg:p-8 gap-6 max-w-[1800px] mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
         <div className="text-center w-full">
           <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-3">
             <span className="text-aura-gradient">AuraGen</span>
             <span className="text-gray-800 ml-3 font-light">Studio</span>
           </h1>
           <p className="text-base md:text-lg text-gray-500 font-medium tracking-wide">Ethereal AI Creation Suite</p>
         </div>
      </header>

      <div className="flex-1 overflow-visible">
        <ImageGenAIGenerator />
      </div>
    </main>
  );
}
