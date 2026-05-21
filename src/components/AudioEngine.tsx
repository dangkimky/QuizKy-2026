"use client";

import React, { useState, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { Volume2, VolumeX, Upload, Play, Check } from "lucide-react";
import { audioDb } from "@/lib/audioDb";

// Web Audio API procedural sound synthesizer (Fallback if no audio imported)
export const synthAudio = {
  playCorrect: (volume = 0.5) => {
    if (typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = "sine";
      // Arpeggio sound
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.24); // C6
      
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch (e) {}
  },
  
  playIncorrect: (volume = 0.5) => {
    if (typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.35);
      
      gain.gain.setValueAtTime(volume * 0.8, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}
  },
  
  playWin: (volume = 0.5) => {
    if (typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = "triangle";
      osc2.type = "sine";
      
      const chord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      chord.forEach((freq, idx) => {
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.12);
        osc2.frequency.setValueAtTime(freq * 1.5, audioCtx.currentTime + idx * 0.12);
      });
      
      gain.gain.setValueAtTime(volume * 0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
      
      osc.start();
      osc2.start();
      osc.stop(audioCtx.currentTime + 1.6);
      osc2.stop(audioCtx.currentTime + 1.6);
    } catch (e) {}
  }
};

/**
 * BACKGROUND AUDIO CONTROLLER (Invisible, renders nothing, single instance)
 */
export default function AudioEngine() {
  const soundVolume = useGameStore(state => state.soundVolume);
  const musicVolume = useGameStore(state => state.musicVolume);
  const isSoundMuted = useGameStore(state => state.isSoundMuted);
  
  const isAnswered = useGameStore(state => state.isAnswered);
  const shuffledQuestions = useGameStore(state => state.shuffledQuestions);
  const currentQuestionIndex = useGameStore(state => state.currentQuestionIndex);
  const selectedAnswerIndex = useGameStore(state => state.selectedAnswerIndex);
  const isGameOver = useGameStore(state => state.isGameOver);
  const activeQuizId = useGameStore(state => state.activeQuizId);

  const [bgMusicNode, setBgMusicNode] = useState<HTMLAudioElement | null>(null);

  const playSoundBase64 = (base64Str: string, vol: number) => {
    try {
      const audio = new Audio(base64Str);
      audio.volume = vol;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  // Play sound effect on answering
  useEffect(() => {
    if (!isAnswered || isSoundMuted) return;
    
    const currentQ = shuffledQuestions[currentQuestionIndex];
    if (!currentQ || selectedAnswerIndex === null) return;
    
    const chosen = currentQ.answers[selectedAnswerIndex];
    const isCorrect = chosen?.originalIndex === currentQ.correctOriginalIndex;
    const vol = soundVolume / 100;

    const playSfx = async () => {
      const dbKey = isCorrect ? "quizverse_sfx_correct" : "quizverse_sfx_incorrect";
      const customSfx = await audioDb.getAudio(dbKey);
      if (customSfx) {
        playSoundBase64(customSfx, vol);
      } else {
        if (isCorrect) {
          synthAudio.playCorrect(vol);
        } else {
          synthAudio.playIncorrect(vol);
        }
      }
    };

    playSfx();
  }, [isAnswered]);

  // Play win sound on game over
  useEffect(() => {
    if (!isGameOver || isSoundMuted) return;
    const vol = soundVolume / 100;
    
    const playWinSfx = async () => {
      const customWin = await audioDb.getAudio("quizverse_sfx_win");
      if (customWin) {
        playSoundBase64(customWin, vol);
      } else {
        synthAudio.playWin(vol);
      }
    };

    playWinSfx();
  }, [isGameOver]);

  // Background music controller (Init & Loop)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let music: HTMLAudioElement | null = null;
    let isStopped = false;

    const initBgm = async () => {
      const customBgm = await audioDb.getAudio("quizverse_bgm");
      if (isStopped) return;

      if (customBgm) {
        music = new Audio(customBgm);
      } else {
        // Fallback gentle loop
        music = new Audio("https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg");
      }

      music.loop = true;
      music.volume = isSoundMuted ? 0 : musicVolume / 100;
      setBgMusicNode(music);

      if (activeQuizId && !isGameOver) {
        music.play().catch(() => {});
      }
    };

    initBgm();

    return () => {
      isStopped = true;
      if (music) {
        music.pause();
      }
    };
  }, [activeQuizId]);

  // Update BGM Volume dynamically
  useEffect(() => {
    if (!bgMusicNode) return;
    bgMusicNode.volume = isSoundMuted ? 0 : musicVolume / 100;
  }, [musicVolume, isSoundMuted, bgMusicNode]);

  // Start/Stop BGM on active status changes
  useEffect(() => {
    if (!bgMusicNode) return;
    if (activeQuizId && !isGameOver) {
      bgMusicNode.play().catch(() => {});
    } else {
      bgMusicNode.pause();
    }
  }, [activeQuizId, isGameOver, bgMusicNode]);

  // Listen to custom audio BGM update events to refresh the background player instantly
  useEffect(() => {
    const handleBgmUpdate = async () => {
      if (bgMusicNode) {
        bgMusicNode.pause();
      }
      const customBgm = await audioDb.getAudio("quizverse_bgm");
      let newM: HTMLAudioElement;
      if (customBgm) {
        newM = new Audio(customBgm);
      } else {
        newM = new Audio("https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg");
      }
      newM.loop = true;
      newM.volume = isSoundMuted ? 0 : musicVolume / 100;
      setBgMusicNode(newM);
      if (activeQuizId && !isGameOver) {
        newM.play().catch(() => {});
      }
    };

    window.addEventListener("quizverse-bgm-updated", handleBgmUpdate);
    return () => window.removeEventListener("quizverse-bgm-updated", handleBgmUpdate);
  }, [bgMusicNode, activeQuizId, isGameOver, isSoundMuted, musicVolume]);

  return null; // Logic controller is 100% invisible
}

/**
 * VISIBLE CONTROL PANEL (For configuration panels, modular, avoids loops)
 */
export function AudioSettingsPanel() {
  const soundVolume = useGameStore(state => state.soundVolume);
  const musicVolume = useGameStore(state => state.musicVolume);
  const isSoundMuted = useGameStore(state => state.isSoundMuted);
  const updateVolume = useGameStore(state => state.updateVolume);
  const toggleMute = useGameStore(state => state.toggleMute);
  
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});

  const handleAudioUpload = async (type: "bgm" | "correct" | "incorrect" | "win", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingState(prev => ({ ...prev, [type]: true }));

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const key =
          type === "bgm"
            ? "quizverse_bgm"
            : type === "correct"
            ? "quizverse_sfx_correct"
            : type === "incorrect"
            ? "quizverse_sfx_incorrect"
            : "quizverse_sfx_win";

        try {
          // Store directly into IndexedDB! No 5MB size limit!
          await audioDb.saveAudio(key, event.target.result as string);
          
          setUploadingState(prev => ({ ...prev, [type]: false }));
          alert(`Đã tải lên âm thanh [${type.toUpperCase()}] thành công!`);

          // Trigger custom event to notify background audio controller
          if (type === "bgm") {
            window.dispatchEvent(new Event("quizverse-bgm-updated"));
          }
        } catch (err) {
          console.error("Lỗi khi lưu âm thanh:", err);
          setUploadingState(prev => ({ ...prev, [type]: false }));
          alert("Lỗi khi nạp file âm thanh vào thư viện.");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const playPreview = async (type: "bgm" | "correct" | "incorrect" | "win") => {
    const vol = soundVolume / 100;
    const key =
      type === "bgm"
        ? "quizverse_bgm"
        : type === "correct"
        ? "quizverse_sfx_correct"
        : type === "incorrect"
        ? "quizverse_sfx_incorrect"
        : "quizverse_sfx_win";

    const data = await audioDb.getAudio(key);
    if (data) {
      const audio = new Audio(data);
      audio.volume = type === "bgm" ? musicVolume / 100 : vol;
      audio.play().catch(() => {});
      if (type === "bgm") {
        setTimeout(() => audio.pause(), 4000); // Only play 4s preview of BGM
      }
    } else {
      // Fallback synthesizer
      if (type === "correct") synthAudio.playCorrect(vol);
      if (type === "incorrect") synthAudio.playIncorrect(vol);
      if (type === "win") synthAudio.playWin(vol);
      if (type === "bgm") {
        const defaultAudio = new Audio("https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg");
        defaultAudio.volume = musicVolume / 100;
        defaultAudio.play().catch(() => {});
        setTimeout(() => defaultAudio.pause(), 4000);
      }
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
          <Volume2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-slate-100">Hệ Thống Âm Thanh Game Hóa</h3>
          <p className="text-xs text-slate-400">Tùy biến hiệu ứng âm thanh và nhạc nền sống động (Lưu trữ không giới hạn)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Volume Sliders */}
        <div className="space-y-5">
          <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleMute}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer"
              >
                {isSoundMuted ? <VolumeX className="w-4 h-4 text-rose-450" /> : <Volume2 className="w-4 h-4 text-emerald-450" />}
              </button>
              <div>
                <div className="text-xs font-extrabold text-slate-200">Trạng Thái Âm Thanh</div>
                <div className="text-[10px] text-slate-500">Bật/Tắt toàn bộ tiếng</div>
              </div>
            </div>
            <span className={`text-xs font-black px-2.5 py-1 rounded-full ${isSoundMuted ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
              {isSoundMuted ? "ĐANG TẮT" : "ĐANG BẬT"}
            </span>
          </div>

          <div className="bg-slate-900/20 p-4 rounded-2xl border border-slate-900/50 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-extrabold text-slate-300 mb-2">
                <span>Hiệu Ứng Âm Thanh SFX</span>
                <span>{soundVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={soundVolume}
                onChange={e => updateVolume("sound", parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer bg-slate-800 h-1.5 rounded-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-extrabold text-slate-300 mb-2">
                <span>Nhạc Nền BGM</span>
                <span>{musicVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={musicVolume}
                onChange={e => updateVolume("music", parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer bg-slate-800 h-1.5 rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Right: Sound Importer */}
        <div className="grid grid-cols-2 gap-3">
          {([
            { id: "bgm", label: "Nhạc Nền BGM" },
            { id: "correct", label: "Đáp Án Đúng" },
            { id: "incorrect", label: "Đáp Án Sai" },
            { id: "win", label: "Chiến Thắng Màn" },
          ] as const).map(item => (
            <div
              key={item.id}
              className="bg-slate-900/30 border border-slate-800/85 p-3 rounded-2xl flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase">IMPORT</span>
                <h4 className="text-xs font-extrabold text-slate-200 mt-0.5">{item.label}</h4>
              </div>

              <div className="flex gap-1.5 mt-4">
                <button
                  type="button"
                  onClick={() => playPreview(item.id)}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-650 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                  title="Nghe thử"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>

                <label className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[10px] font-extrabold bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white cursor-pointer transition-all">
                  <Upload className="w-3 h-3" />
                  {uploadingState[item.id] ? "ĐANG NẠP..." : "TẢI FILE"}
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    disabled={uploadingState[item.id]}
                    onChange={e => handleAudioUpload(item.id, e)}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
