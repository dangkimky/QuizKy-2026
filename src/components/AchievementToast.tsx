"use client";

import React, { useEffect, useState } from "react";
import { useGameStore, Achievement } from "@/store/gameStore";
import { motion, AnimatePresence } from "framer-motion";

interface ToastItem {
  id: string;
  achievement: Achievement;
}

export default function AchievementToast() {
  const achievements = useGameStore(state => state.player.achievements);
  const [activeToasts, setActiveToasts] = useState<ToastItem[]>([]);
  const [prevAchievements, setPrevAchievements] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // On mount, cache existing unlock states
    const states: Record<string, boolean> = {};
    achievements.forEach(a => {
      states[a.id] = a.unlocked;
    });
    setPrevAchievements(states);
  }, []);

  useEffect(() => {
    if (Object.keys(prevAchievements).length === 0) return;

    // Detect newly unlocked achievements
    achievements.forEach(a => {
      const wasUnlocked = prevAchievements[a.id];
      if (a.unlocked && wasUnlocked === false) {
        // Trigger Toast!
        const toastId = crypto.randomUUID();
        setActiveToasts(prev => [...prev, { id: toastId, achievement: a }]);

        // Play achievement unlock sound (virtual trigger)
        try {
          const sfx = new Audio("/sounds/achievement.mp3");
          sfx.volume = 0.5;
          sfx.play().catch(() => {});
        } catch (e) {}

        // Auto remove toast after 4.5 seconds
        setTimeout(() => {
          setActiveToasts(prev => prev.filter(t => t.id !== toastId));
        }, 4500);
      }
    });

    // Update cache
    const currentStates: Record<string, boolean> = {};
    achievements.forEach(a => {
      currentStates[a.id] = a.unlocked;
    });
    setPrevAchievements(currentStates);
  }, [achievements, prevAchievements]);

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 items-center pointer-events-none w-full max-w-sm">
      <AnimatePresence>
        {activeToasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="pointer-events-auto bg-gradient-to-r from-amber-500/90 via-orange-600/90 to-yellow-500/90 p-0.5 rounded-2xl shadow-2xl flex items-center gap-4 text-white w-[90%] border border-yellow-300/40 backdrop-blur-md overflow-hidden relative"
          >
            {/* Ambient sliding light flare */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />

            <div className="bg-slate-950/90 px-4 py-3 rounded-2xl flex items-center gap-3 w-full">
              {/* Badge Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-2xl shadow-inner animate-[pulse_1.5s_infinite]">
                {toast.achievement.icon}
              </div>

              {/* Contents */}
              <div className="flex-1">
                <div className="text-[10px] uppercase font-black tracking-widest text-amber-400">
                  Thành Tích Đạt Được!
                </div>
                <h4 className="font-extrabold text-sm text-slate-100 font-mono">
                  {toast.achievement.title}
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  {toast.achievement.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
