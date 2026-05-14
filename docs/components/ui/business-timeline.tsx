"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const timelineData = [
  {
    title: "Phase 1: Foundation",
    description: "Open-source the core extension and memory engine. Focus on user growth and community feedback.",
    date: "Q3 2024",
    status: "Active"
  },
  {
    title: "Phase 2: Personal Cloud",
    description: "Launch the managed hosting service. Allow users to sync their memories across devices without setting up their own backend.",
    date: "Q1 2025",
    status: "Upcoming"
  },
  {
    title: "Phase 3: Team Context",
    description: "Introduce 'Shared Neural Workspaces'. Teams can collaboratively build a project-specific brain.",
    date: "Q3 2025",
    status: "Upcoming"
  },
  {
    title: "Phase 4: The Intelligence API",
    description: "Release the developer SDK. Allow any application to become 'context-aware' by plugging into MindBridge.",
    date: "2026",
    status: "Vision"
  }
];

export function BusinessTimeline() {
  return (
    <div className="py-10 max-w-4xl mx-auto">
      <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-3 md:ml-6">
        {timelineData.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="mb-10 ml-6 relative"
          >
            {/* Timeline Dot */}
            <div className={cn(
              "absolute w-4 h-4 rounded-full -left-[30px] border-4 border-white dark:border-black",
              item.status === "Active" ? "bg-blue-500 shadow-[0_0_10px_#3b82f6]" : "bg-zinc-300 dark:bg-zinc-700"
            )} />
            
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-500">
                {item.date}
              </span>
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-bold",
                item.status === "Active" ? "bg-blue-500/10 text-blue-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
              )}>
                {item.status}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
              {item.title}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {item.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
