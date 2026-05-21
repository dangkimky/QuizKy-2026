"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGameStore, GameMode, UITheme, ParticleType, PETS } from "@/store/gameStore";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  Sparkles,
  Trophy,
  Sliders,
  Volume2,
  Trash2,
  Play,
  Heart,
  Timer,
  Award,
  ChevronRight,
  BookOpen,
  User,
  Settings,
  X,
  VolumeX,
  FileText,
  RotateCcw,
  Sparkle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FileImport from "@/components/FileImport";
import CustomThemeBuilder from "@/components/CustomThemeBuilder";
import AudioEngine, { synthAudio, AudioSettingsPanel } from "@/components/AudioEngine";
import PetCompanion from "@/components/PetCompanion";
import AchievementToast from "@/components/AchievementToast";
import ParticleEffect from "@/components/ParticleEffect";

const getPanelStyle = (themeConfig: any) => {
  const baseStyle: React.CSSProperties = {
    backgroundColor: themeConfig.panelBg,
    borderColor: themeConfig.borderColor,
  };

  let borderClass = "";
  
  // Transition duration based on animationSpeed
  let speedClass = "transition-all duration-300";
  if (themeConfig.animationSpeed === "slow") {
    speedClass = "transition-all duration-700";
  } else if (themeConfig.animationSpeed === "fast") {
    speedClass = "transition-all duration-100";
  }

  switch (themeConfig.borderStyle) {
    case "glow":
      baseStyle.boxShadow = `0 0 20px ${themeConfig.glowColor || "rgba(255, 0, 127, 0.6)"}`;
      baseStyle.borderStyle = "solid";
      baseStyle.borderWidth = "1px";
      borderClass = `rounded-3xl backdrop-blur-md ${speedClass}`;
      break;
    case "glass":
      baseStyle.boxShadow = "0 8px 32px 0 rgba(0, 0, 0, 0.37)";
      baseStyle.borderStyle = "solid";
      baseStyle.borderWidth = "1px";
      baseStyle.borderColor = "rgba(255, 255, 255, 0.08)";
      borderClass = `rounded-3xl backdrop-blur-xl ${speedClass}`;
      break;
    case "double":
      baseStyle.borderStyle = "double";
      baseStyle.borderWidth = "4px";
      baseStyle.boxShadow = "none";
      borderClass = `rounded-3xl backdrop-blur-md ${speedClass}`;
      break;
    case "pixel":
      baseStyle.borderStyle = "solid";
      baseStyle.borderWidth = "4px";
      baseStyle.boxShadow = "none";
      borderClass = `rounded-none ${speedClass}`; // Sharp pixel style
      break;
    default:
      baseStyle.boxShadow = `0 0 15px ${themeConfig.glowColor}25`;
      baseStyle.borderStyle = "solid";
      baseStyle.borderWidth = "1px";
      borderClass = `rounded-3xl backdrop-blur-md ${speedClass}`;
  }

  return { style: baseStyle, className: borderClass };
};

export default function Home() {
  const quizzes = useGameStore(state => state.quizzes);
  const activeQuizId = useGameStore(state => state.activeQuizId);
  const loadQuizzes = useGameStore(state => state.loadQuizzes);
  const importQuiz = useGameStore(state => state.importQuiz);
  const deleteQuiz = useGameStore(state => state.deleteQuiz);
  const startQuiz = useGameStore(state => state.startQuiz);
  
  const router = useRouter();
  const user = useGameStore(state => state.user);
  const signOutUser = useGameStore(state => state.signOutUser);

  // Game session states
  const shuffledQuestions = useGameStore(state => state.shuffledQuestions);
  const currentQuestionIndex = useGameStore(state => state.currentQuestionIndex);
  const selectedAnswerIndex = useGameStore(state => state.selectedAnswerIndex);
  const isAnswered = useGameStore(state => state.isAnswered);
  const score = useGameStore(state => state.score);
  const correctCount = useGameStore(state => state.correctCount);
  const incorrectCount = useGameStore(state => state.incorrectCount);
  const currentLevel = useGameStore(state => state.currentLevel);
  const gameMode = useGameStore(state => state.gameMode);
  const timeLeft = useGameStore(state => state.timeLeft);
  const lives = useGameStore(state => state.lives);
  const streak = useGameStore(state => state.streak);
  const isGameOver = useGameStore(state => state.isGameOver);
  const selectAnswer = useGameStore(state => state.selectAnswer);
  const submitAnswer = useGameStore(state => state.submitAnswer);
  const nextQuestion = useGameStore(state => state.nextQuestion);
  const tickTimer = useGameStore(state => state.tickTimer);
  const player = useGameStore(state => state.player);
  const setActivePet = useGameStore(state => state.setActivePet);
  const resetProgress = useGameStore(state => state.resetProgress);

  // Theme settings state
  const themeConfig = useGameStore(state => state.themeConfig);
  const updateThemeConfig = useGameStore(state => state.updateThemeConfig);

  const [activeTab, setActiveTab] = useState<"play" | "pets" | "achievements">("play");
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode>("classic");
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [videoBgUrl, setVideoBgUrl] = useState("");
  
  // Settings Modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"audio" | "appearance" | "graphics">("audio");

  // Sync DB on Mount with Firebase Auth Listener
  useEffect(() => {
    loadQuizzes();

    // Listen to Firebase Authentication changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Sync player data using Zustand syncUser
        const syncUser = useGameStore.getState().syncUser;
        const userPayload = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "QuizMaster",
          photoURL: firebaseUser.photoURL || ""
        };
        await syncUser(userPayload);
      } else {
        // Fallback to Guest / Load local database
        useGameStore.setState({ user: null });
        
        try {
          const qRes = await fetch("/api/quizzes");
          if (qRes.ok) {
            const serverQ = await qRes.json();
            serverQ.forEach((q: any) => {
              importQuiz(q.title, q.questions, q.id);
            });
          }

          const pRes = await fetch("/api/player?playerId=default-player");
          if (pRes.ok) {
            const data = await pRes.json();
            if (data.success && data.player) {
              const serverP = data.player;
              useGameStore.setState(state => ({
                player: {
                  ...state.player,
                  name: serverP.name,
                  level: serverP.level,
                  exp: serverP.exp,
                  activePet: serverP.activePet,
                  activeTheme: serverP.activeTheme,
                  ...(serverP.stats || {})
                }
              }));
            }
          }
        } catch (e) {
          console.log("Operating in offline fallback mode");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Timer loop for Active Quiz
  useEffect(() => {
    if (!activeQuizId || isGameOver || isAnswered) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQuizId, isGameOver, isAnswered]);

  // Sync local Video BG state
  useEffect(() => {
    const handleVideoUpdate = () => {
      setVideoBgUrl(localStorage.getItem("quizverse_video_bg") || "");
    };
    handleVideoUpdate();
    window.addEventListener("video-bg-updated", handleVideoUpdate);
    return () => window.removeEventListener("video-bg-updated", handleVideoUpdate);
  }, []);

  // Sync settings theme background
  const appBgStyle: React.CSSProperties = {
    background: themeConfig.background === "video" ? "transparent" : themeConfig.background,
    fontFamily: themeConfig.fontFamily,
  };

  const scalePercent = themeConfig.uiScale / 100;

  // Render Dashboard
  return (
    <div
      style={appBgStyle}
      className="min-h-screen flex flex-col w-full relative transition-all duration-300 overflow-x-hidden"
    >
      {/* HTML5 Video background if active */}
      {themeConfig.background === "video" && videoBgUrl && (
        <div className="video-bg-container">
          <video autoPlay loop muted playsInline src={videoBgUrl} />
          {/* Neon Grid overlay for Cyberpunk vibe */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.1),rgba(0,0,0,0.85))]" />
        </div>
      )}

      {/* Particle Effects Canvas */}
      <ParticleEffect />

      {/* Dynamic Toast for newly unlocked Achievements */}
      <AchievementToast />

      {/* Audio Engine loops */}
      <AudioEngine />

      {/* Pet companion flying */}
      <PetCompanion />

      {/* Global Scaling container */}
      <div
        style={{ transform: `scale(${scalePercent})`, transformOrigin: "top center" }}
        className="w-full flex-1 flex flex-col max-w-7xl mx-auto px-4 py-6 z-10 transition-transform duration-300"
      >
        {/* Header HUD */}
        <header
          style={getPanelStyle(themeConfig).style}
          className={`p-5 border mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 ${getPanelStyle(themeConfig).className}`}
        >
          {/* Logo Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => useGameStore.setState({ activeQuizId: null })}>
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-lg border"
              style={{
                borderColor: themeConfig.borderColor,
                boxShadow: `0 0 15px ${themeConfig.glowColor}`,
                color: themeConfig.textPrimary,
              }}
            >
              🪐
            </div>
            <div>
              <h1
                style={{ color: themeConfig.textPrimary, textShadow: `0 0 8px ${themeConfig.glowColor}80` }}
                className="text-xl font-black font-mono tracking-wider"
              >
                QuizVerse Builder
              </h1>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">
                Nền tảng sinh game tự động AI
              </p>
            </div>
          </div>

          {/* Player stats HUD */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-900">
            {/* Player Level */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-black shadow-md">
                LV{player.level}
              </div>
              <div>
                <div className="text-[9px] font-black text-slate-500 uppercase">TIẾN TRÌNH EXP</div>
                <div className="w-24 h-2 bg-slate-800 rounded-full mt-1 overflow-hidden relative border border-slate-900">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${(player.exp / (player.level * 100)) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Highscore & Pet HUD */}
            <div className="h-8 w-px bg-slate-900 hidden sm:block" />

            <div className="flex items-center gap-4 text-xs font-extrabold">
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">ĐIỂM KỶ LỤC</span>
                <span className="text-amber-400 font-black">{player.highScore || "0.0"} pts</span>
              </div>

              <div>
                <span className="text-[9px] text-slate-500 block uppercase">THÚ CƯNG DUY TRÌ</span>
                <span className="text-slate-200 flex items-center gap-1">
                  {player.activePet === "none" ? "Chưa có" : PETS[player.activePet]?.sprite}{" "}
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    {player.activePet === "none" ? "" : PETS[player.activePet]?.name}
                  </span>
                </span>
              </div>
            </div>

            {/* Mute button */}
            <button
              onClick={() => useGameStore.getState().toggleMute()}
              style={{ borderColor: themeConfig.borderColor }}
              className="p-2 rounded-xl bg-slate-900 border text-slate-450 hover:text-slate-200 cursor-pointer flex items-center justify-center"
            >
              {useGameStore(state => state.isSoundMuted) ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-500" />
              )}
            </button>

            {/* Premium Settings button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              style={{ borderColor: themeConfig.borderColor }}
              className="p-2 rounded-xl bg-slate-900 border text-slate-455 hover:text-slate-200 cursor-pointer flex items-center justify-center transition-transform hover:rotate-45"
              title="Cài đặt Premium"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
            </button>

            {/* Firebase Auth Profile Controls */}
            {user ? (
              <div className="flex items-center gap-2 bg-slate-900/90 border rounded-xl p-1 pr-3" style={{ borderColor: themeConfig.borderColor }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-lg object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-black font-mono border border-indigo-500/10">
                    {user.displayName?.slice(0, 2).toUpperCase() || "QM"}
                  </div>
                )}
                <div className="flex flex-col max-w-[80px] hidden md:block">
                  <span className="text-[9px] text-slate-350 font-bold truncate block leading-none">{user.displayName}</span>
                  <button 
                    onClick={() => signOutUser()}
                    className="text-[8px] text-rose-450 hover:text-rose-400 font-extrabold cursor-pointer text-left uppercase tracking-wider block mt-0.5"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                style={{ borderColor: themeConfig.borderColor }}
                className="p-2 px-3 rounded-xl bg-slate-900 border text-[10px] font-mono font-bold text-slate-200 hover:text-indigo-300 cursor-pointer flex items-center gap-1.5"
                title="Đăng nhập để lưu tiến trình"
              >
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Đăng nhập</span>
              </button>
            )}
          </div>
        </header>

        {/* Core Content Switching */}
        <AnimatePresence mode="wait">
          {activeQuizId ? (
            /* ======================================================== */
            /* =============== ACTIVE PLAYING SCREEN ================= */
            /* ======================================================== */
            <motion.div
              key="gameplay"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex-1 flex flex-col md:flex-row gap-6"
            >
              {/* Left Column: Play panel */}
              <div
                style={getPanelStyle(themeConfig).style}
                className={`p-6 border flex flex-col justify-between min-h-[480px] ${getPanelStyle(themeConfig).className}`}
              >
                {/* HUD: Question progress */}
                {isGameOver ? (
                  /* GameOver screen inside gameplay container */
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-4xl shadow-2xl mb-6 border-2 border-yellow-300 animate-bounce">
                      🏆
                    </div>
                    
                    <h2
                      style={{ color: themeConfig.textPrimary, textShadow: `0 0 10px ${themeConfig.glowColor}` }}
                      className="text-2xl font-black font-mono tracking-wide"
                    >
                      MÀN CHƠI HOÀN THÀNH!
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Bạn đã chinh phục thử thách cực đỉnh trong chế độ{" "}
                      <span className="text-indigo-400 font-extrabold capitalize">{gameMode.replace("_", " ")}</span>
                    </p>

                    {/* Stats summary table */}
                    <div className="w-full max-w-md mt-8 grid grid-cols-2 gap-3 text-left">
                      <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-900">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">SỐ CÂU ĐÚNG</span>
                        <div className="text-xl font-mono font-black text-emerald-400 mt-1">
                          {correctCount} / {shuffledQuestions.length}
                        </div>
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-900">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">ĐIỂM SỐ TỔNG (MAX 10)</span>
                        <div className="text-xl font-mono font-black text-amber-400 mt-1">
                          {score} / 10
                        </div>
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-900 col-span-2 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">EXP NHẬN ĐƯỢC</span>
                          <div className="text-base font-mono font-black text-indigo-400 mt-0.5">
                            +{correctCount * 10} EXP
                          </div>
                        </div>
                        {player.activePet !== "none" && (
                          <div className="text-[10px] text-right font-extrabold bg-slate-900 border border-slate-800 text-amber-400 px-3 py-1 rounded-full">
                            Buff {PETS[player.activePet]?.sprite} Hoạt động!
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                      <button
                        onClick={() => startQuiz(activeQuizId, gameMode, currentLevel)}
                        className="px-6 py-3 rounded-2xl font-extrabold text-xs text-white bg-indigo-600 hover:bg-indigo-500 cursor-pointer transform active:scale-95 shadow-[0_4px_15px_rgba(99,102,241,0.4)] transition-all"
                      >
                        CHƠI LẠI MÀN NÀY
                      </button>
                      <button
                        onClick={() => useGameStore.setState({ activeQuizId: null })}
                        className="px-6 py-3 rounded-2xl font-extrabold text-xs text-slate-200 bg-slate-900 border border-slate-800 hover:border-slate-600 cursor-pointer transform active:scale-95 transition-all"
                      >
                        VỀ TRANG CHỦ
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Gameplay active block */
                  <>
                    <div className="flex justify-between items-center border-b border-slate-800/60 pb-4 mb-4">
                      <div>
                        <span
                          style={{ color: themeConfig.textSecondary }}
                          className="text-[10px] font-black uppercase tracking-widest"
                        >
                          Chế độ: {gameMode.replace("_", " ")} | LEVEL {currentLevel}
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-200 mt-0.5">
                          {quizzes.find(q => q.id === activeQuizId)?.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Lives for survival */}
                        {gameMode === "survival" && (
                          <div className="flex gap-1.5 items-center text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-black">
                            <Heart className="w-3.5 h-3.5 fill-current" />
                            {lives} MẠNG
                          </div>
                        )}

                        {/* Question Count HUD */}
                        <div className="px-3 py-1 rounded-full bg-slate-950/60 border border-slate-900 text-xs font-extrabold text-slate-400">
                          Câu {currentQuestionIndex + 1} / {shuffledQuestions.length}
                        </div>
                      </div>
                    </div>

                    {/* Timer progress bar */}
                    {(gameMode === "time_attack" || gameMode === "classic" || gameMode === "boss" || gameMode === "survival") && (
                      <div className="mb-4">
                        <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-1">
                          <span className="flex items-center gap-1"><Timer className="w-3 h-3 text-indigo-400" /> THỜI GIAN CÒN LẠI</span>
                          <span className={timeLeft <= 5 ? "text-rose-500 animate-pulse font-mono" : "font-mono"}>{timeLeft}s</span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 border border-slate-900 rounded-full overflow-hidden relative">
                          <motion.div
                            animate={{
                              width: `${(timeLeft / (gameMode === "time_attack" ? 20 : 30)) * 100}%`,
                              backgroundColor: timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#f59e0b" : "#4f46e5",
                            }}
                            transition={{ duration: 1, ease: "linear" }}
                            className="absolute left-0 top-0 h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Core Question Box */}
                    <div className="bg-slate-950/50 rounded-2xl border border-slate-900 p-5 min-h-[100px] flex items-center justify-center mb-6">
                      <p className="text-sm font-extrabold text-center text-slate-100 font-mono leading-relaxed">
                        {shuffledQuestions[currentQuestionIndex]?.question}
                      </p>
                    </div>

                    {/* Choices Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {shuffledQuestions[currentQuestionIndex]?.answers.map((answer, index) => {
                        const isSelected = selectedAnswerIndex === index;
                        const isCorrectOption = answer.originalIndex === shuffledQuestions[currentQuestionIndex]?.correctOriginalIndex;
                        
                        let choiceStyle = {};
                        let classStr =
                          "p-4 rounded-xl border text-xs font-bold text-left transition-all duration-200 flex items-center justify-between cursor-pointer relative overflow-hidden ";

                        if (!isAnswered) {
                          if (isSelected) {
                            classStr += "bg-indigo-600/20 text-indigo-300";
                            choiceStyle = {
                              borderColor: themeConfig.borderColor,
                              boxShadow: `0 0 10px ${themeConfig.glowColor}40`,
                            };
                          } else {
                            classStr += "bg-slate-950/40 border-slate-900 hover:border-slate-700 text-slate-300 hover:bg-slate-900/30";
                          }
                        } else {
                          // Answer submitted state
                          if (isCorrectOption) {
                            classStr += "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
                          } else if (isSelected && !isCorrectOption) {
                            classStr += "bg-rose-500/10 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]";
                          } else {
                            classStr += "bg-slate-950/20 border-slate-950 text-slate-600";
                          }
                        }

                        return (
                          <button
                            key={index}
                            style={choiceStyle}
                            onClick={() => selectAnswer(index)}
                            disabled={isAnswered}
                            className={classStr}
                          >
                            <span className="flex items-center gap-3">
                              <span className="w-5 h-5 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-500 uppercase">
                                {String.fromCharCode(65 + index)}
                              </span>
                              <span>{answer.text}</span>
                            </span>

                            {/* Checkmark or Cross icons */}
                            {isAnswered && isCorrectOption && (
                              <span className="text-emerald-400 font-extrabold text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">ĐÚNG</span>
                            )}
                            {isAnswered && isSelected && !isCorrectOption && (
                              <span className="text-rose-400 font-extrabold text-[10px] bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">SAI</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Submit / Next HUD */}
                    <div className="flex justify-between items-center border-t border-slate-805/50 pt-4">
                      <div className="flex gap-4 text-xs font-black">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase block">ĐIỂM HIỆN TẠI</span>
                          <span className="text-amber-400">{score} pts</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase block">STREAK CORR</span>
                          <span className="text-indigo-400">{streak} liên tiếp</span>
                        </div>
                      </div>

                      <div>
                        {!isAnswered ? (
                          <button
                            onClick={submitAnswer}
                            disabled={selectedAnswerIndex === null}
                            className={`px-6 py-2.5 rounded-xl font-extrabold text-xs transition-all transform active:scale-95 cursor-pointer text-white ${
                              selectedAnswerIndex === null
                                ? "bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed"
                                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                            }`}
                          >
                            NỘP BÀI
                          </button>
                        ) : (
                          <button
                            onClick={nextQuestion}
                            className="px-6 py-2.5 rounded-xl font-extrabold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all transform active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            TIẾP TỤC <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            /* ======================================================== */
            /* ================= MAIN DASHBOARD HOME ================== */
            /* ======================================================== */
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col lg:flex-row gap-6"
            >
              {/* Left Column: File Import & Quiz selection directory */}
              <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6">
                {/* Uploader Card */}
                <div
                  style={getPanelStyle(themeConfig).style}
                  className={`p-5 border ${getPanelStyle(themeConfig).className}`}
                >
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-3">Tải File Câu Hỏi Lên</h3>
                  <FileImport />
                </div>

                {/* Quizzes Directory List */}
                <div
                  style={getPanelStyle(themeConfig).style}
                  className={`p-5 border flex-1 ${getPanelStyle(themeConfig).className}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider">
                      Thư Viện Đề Của Bạn
                    </h3>
                    <span className="text-[10px] bg-slate-950/60 border border-slate-900 font-bold px-2 py-0.5 rounded-full text-slate-400">
                      {quizzes.length} Bộ đề
                    </span>
                  </div>

                  {quizzes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                      <span className="text-3xl mb-2">📂</span>
                      <p className="text-xs font-bold">Thư viện trống trơn</p>
                      <p className="text-[10px] mt-0.5 leading-relaxed max-w-[200px]">Tải file đề DOCX/PDF/TXT của bạn lên để sinh game!</p>
                    </div>
                  ) : (
                    <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
                      {quizzes.map(quiz => (
                        <div
                          key={quiz.id}
                          onClick={() => {
                            setSelectedQuizId(quiz.id);
                            setSelectedLevel(1);
                          }}
                          className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between group ${
                            selectedQuizId === quiz.id
                              ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                              : "border-slate-805 bg-slate-950/40 hover:bg-slate-900/30 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs shrink-0 font-bold">
                              📝
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-xs text-slate-200 truncate group-hover:text-white">
                                {quiz.title}
                              </h4>
                              <span className="text-[9px] font-bold text-slate-500 uppercase block mt-0.5">
                                {quiz.questions.length} câu hỏi
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={e => {
                              e.stopPropagation();
                              deleteQuiz(quiz.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Console deck with tabs */}
              <div className="flex-1 flex flex-col gap-6">
                {/* Deck Navigation Tabs */}
                <div className="flex gap-1.5 overflow-x-auto bg-slate-950/60 p-1.5 rounded-2xl border border-slate-900">
                  {([
                    { id: "play", label: "Chiến Đấu", icon: Play },
                    { id: "pets", label: "Thú Cưng (Pet)", icon: Heart },
                    { id: "achievements", label: "Thành Tích", icon: Trophy },
                  ] as const).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === tab.id
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                          : "text-slate-400 hover:bg-slate-900"
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab: Play setup */}
                {activeTab === "play" && (
                  <div
                    style={getPanelStyle(themeConfig).style}
                    className={`p-6 border flex-1 flex flex-col justify-between ${getPanelStyle(themeConfig).className}`}
                  >
                    {!selectedQuizId ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-500">
                        <span className="text-4xl mb-3">🎮</span>
                        <h4 className="text-sm font-extrabold text-slate-300">Chọn Một Bộ Đề Để Bắt Đầu</h4>
                        <p className="text-xs max-w-xs mt-1 leading-relaxed">Vui lòng nhấp chọn một bộ đề trong thư viện danh sách bên trái để mở bảng cài đặt chế độ chơi.</p>
                      </div>
                    ) : (
                      <div className="space-y-6 flex-1">
                        <div>
                          <span className="text-[10px] text-slate-500 font-black uppercase">ĐANG LỰA CHỌN BỘ ĐỀ</span>
                          <h3 className="text-lg font-black text-slate-200 font-mono mt-0.5">
                            {quizzes.find(q => q.id === selectedQuizId)?.title}
                          </h3>
                        </div>

                        {/* Game Mode Pickers */}
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">
                            Lựa Chọn Chế Độ Chơi Trắc Nghiệm
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {([
                              { id: "classic", label: "Cổ Điển (Classic)", desc: "Làm lần lượt từng câu hỏi trong level, 30s/câu." },
                              { id: "time_attack", label: "Tốc Độ (Time Attack)", desc: "Chạy đua đếm ngược thời gian, 20s/câu." },
                              { id: "survival", label: "Sống Sót (Survival)", desc: "Chỉ có 3 mạng, sai 1 câu mất mạng. Trả lời đúng liên tục." },
                              { id: "endless", label: "Vô Hạn (Endless)", desc: "Câu hỏi ngẫu nhiên vô hạn từ toàn bộ bộ đề." },
                              { id: "boss", label: "Trùm Cuối (Boss Stage)", desc: "10 câu hỏi cuối của level khó, nhân đôi điểm thưởng!" },
                            ] as const).map(mode => (
                              <button
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id)}
                                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                                  selectedMode === mode.id
                                    ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.25)]"
                                    : "border-slate-805 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/40"
                                }`}
                              >
                                <span className="text-xs font-black text-slate-200 block">{mode.label}</span>
                                <span className="text-[10px] text-slate-500 font-bold block mt-1.5 leading-relaxed">{mode.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Level Splitting selectors */}
                        {selectedMode !== "endless" && (
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">
                              Lựa Chọn Màn Chơi (Levels) - <span className="text-indigo-400">50 câu/màn</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {Array.from({
                                length: Math.ceil(
                                  (quizzes.find(q => q.id === selectedQuizId)?.questions.length || 0) / 50
                                ),
                              }).map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setSelectedLevel(i + 1)}
                                  className={`w-12 h-10 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                                    selectedLevel === i + 1
                                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.25)]"
                                      : "border-slate-805 bg-slate-950/40 hover:border-slate-700 text-slate-400"
                                  }`}
                                >
                                  Màn {i + 1}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t border-slate-900 flex justify-end">
                          <button
                            onClick={() => startQuiz(selectedQuizId, selectedMode, selectedLevel)}
                            className="flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-400 hover:via-purple-500 hover:to-pink-400 text-white shadow-[0_4px_25px_rgba(99,102,241,0.45)] hover:shadow-[0_4px_30px_rgba(99,102,241,0.6)] transition-all cursor-pointer transform active:scale-95"
                          >
                            <Play className="w-4 h-4 fill-white" />
                            KHỞI CHẠY PHÊN CHƠI
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Pet Shop */}
                {activeTab === "pets" && (
                  <div
                    style={{
                      backgroundColor: themeConfig.panelBg,
                      borderColor: themeConfig.borderColor,
                      boxShadow: `0 0 15px ${themeConfig.glowColor}10`,
                    }}
                    className="rounded-3xl border p-6 backdrop-blur-md flex-1 transition-all"
                  >
                    <div className="mb-4">
                      <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider">Cửa Hàng Thú Cưng Hỗ Trợ</h3>
                      <p className="text-[10px] text-slate-400">Nuôi thú cưng để kích hoạt các bùa lợi nhân EXP & Điểm thưởng vô cùng hiếm</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Slime pet default */}
                      {Object.values(PETS).map(pet => {
                        const isUnlocked = player.unlockedPets.includes(pet.id);
                        const isActive = player.activePet === pet.id;
                        
                        // Condition check for lock
                        let levelLock = 0;
                        if (pet.id === "cat") levelLock = 3;
                        if (pet.id === "dragon") levelLock = 5;
                        if (pet.id === "phoenix") levelLock = 8;
                        
                        const isLevelLocked = player.level < levelLock;

                        return (
                          <div
                            key={pet.id}
                            style={{ borderColor: isActive ? pet.color : themeConfig.borderColor }}
                            className={`p-4 rounded-2xl border bg-slate-950/40 relative overflow-hidden flex flex-col justify-between ${
                              isActive ? "shadow-[0_0_15px_rgba(255,255,255,0.05)]" : ""
                            }`}
                          >
                            {/* Level lock layer */}
                            {isLevelLocked && (
                              <div className="absolute inset-0 bg-slate-950/90 border border-slate-900 rounded-2xl flex flex-col items-center justify-center p-4 text-center z-10 backdrop-blur-sm">
                                <span className="text-xl mb-1">🔒</span>
                                <h4 className="font-extrabold text-[11px] text-slate-300">Đang Khóa</h4>
                                <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">
                                  Yêu cầu cấp độ người chơi đạt đến <span className="text-indigo-400 font-bold">Cấp {levelLock}</span> để mở khóa.
                                </p>
                              </div>
                            )}

                            <div>
                              <div className="flex justify-between items-start">
                                <div className="text-3xl p-1 bg-slate-900 border border-slate-800 rounded-xl w-12 h-12 flex items-center justify-center">
                                  {pet.sprite}
                                </div>
                                <span
                                  style={{ color: pet.color, backgroundColor: `${pet.color}15`, borderColor: `${pet.color}30` }}
                                  className="text-[9px] font-black uppercase px-2 py-0.5 rounded border"
                                >
                                  {pet.buffType === "both"
                                    ? `EXP & Điểm x${pet.buffMultiplier}`
                                    : `${pet.buffType} x${pet.buffMultiplier}`}
                                </span>
                              </div>

                              <h4 className="font-extrabold text-xs text-slate-200 mt-3">{pet.name}</h4>
                              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{pet.description}</p>
                            </div>

                            <div className="mt-4 flex gap-2">
                              {isActive ? (
                                <span className="w-full text-center text-[10px] font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-1.5 rounded-xl uppercase">
                                  Đang Đồng Hành
                                </span>
                              ) : (
                                <button
                                  onClick={() => setActivePet(pet.id)}
                                  style={{ borderColor: pet.color }}
                                  className="w-full text-center text-[10px] font-black bg-slate-950 border hover:bg-slate-900 text-slate-300 py-1.5 rounded-xl uppercase cursor-pointer transition-all"
                                >
                                  Triệu Hồi Đồng Hành
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab: Achievements */}
                {activeTab === "achievements" && (
                  <div
                    style={getPanelStyle(themeConfig).style}
                    className={`p-6 border flex-1 ${getPanelStyle(themeConfig).className}`}
                  >
                    <div className="mb-4 flex justify-between items-center">
                      <div>
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider">Hành Lang Thành Tích</h3>
                        <p className="text-[10px] text-slate-400">Các huy hiệu danh dự khẳng định mức độ thông thái của bạn</p>
                      </div>
                      
                      <button
                        onClick={resetProgress}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-rose-500/10 border border-rose-500/30 hover:border-rose-400 text-rose-400 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        RESET TIẾN TRÌNH
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[320px] pr-1">
                      {player.achievements.map(ach => (
                        <div
                          key={ach.id}
                          className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
                            ach.unlocked
                              ? "bg-slate-900/30 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.05)]"
                              : "bg-slate-950/20 border-slate-900 opacity-60"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                            ach.unlocked ? "bg-amber-500/10 border border-amber-500/30 text-amber-400" : "bg-slate-900 border border-slate-800 text-slate-500"
                          }`}>
                            {ach.unlocked ? ach.icon : "🔒"}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xs text-slate-200">{ach.title}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{ach.description}</p>
                            {ach.unlocked && ach.unlockedAt && (
                              <span className="text-[8px] font-mono text-emerald-400/80 block mt-1 uppercase font-bold">
                                Đã đạt: {new Date(ach.unlockedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Premium Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              style={getPanelStyle(themeConfig).style}
              className={`w-full max-w-4xl p-6 border flex flex-col max-h-[85vh] overflow-hidden ${getPanelStyle(themeConfig).className}`}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                    <Settings className="w-5 h-5 animate-spin-slow" />
                  </div>
                  <div>
                    <h2 style={{ color: themeConfig.textPrimary }} className="text-lg font-black font-mono tracking-wider">
                      CÀI ĐẶT PREMIUM
                    </h2>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">
                      Tùy biến toàn diện giao diện, âm thanh và hiệu năng game
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-650 text-slate-400 hover:text-slate-200 transition-all cursor-pointer flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body Columns */}
              <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                {/* Left side: Tabs Selector */}
                <div className="w-full md:w-56 shrink-0 flex flex-col gap-2">
                  <button
                    onClick={() => setSettingsTab("audio")}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black transition-all text-left border cursor-pointer ${
                      settingsTab === "audio"
                        ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-md"
                        : "bg-slate-950 border-slate-900 text-slate-400 hover:bg-slate-900/50 hover:border-slate-800"
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    Hệ Thống Âm Thanh
                  </button>

                  <button
                    onClick={() => setSettingsTab("graphics")}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black transition-all text-left border cursor-pointer ${
                      settingsTab === "graphics"
                        ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-md"
                        : "bg-slate-950 border-slate-900 text-slate-400 hover:bg-slate-900/50 hover:border-slate-800"
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    Đồ Họa & Hiệu Ứng
                  </button>

                  <button
                    onClick={() => setSettingsTab("appearance")}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black transition-all text-left border cursor-pointer ${
                      settingsTab === "appearance"
                        ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-md"
                        : "bg-slate-950 border-slate-900 text-slate-400 hover:bg-slate-900/50 hover:border-slate-800"
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Tự Thiết Kế Theme
                  </button>
                </div>

                {/* Right side: Tab Content */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-6 min-h-[300px]">
                  {settingsTab === "audio" && (
                    <AudioSettingsPanel />
                  )}

                  {settingsTab === "graphics" && (
                    <div className="space-y-6 pb-6">
                      {/* Themes preset list */}
                      <div>
                        <span className="text-[10px] text-slate-500 font-black uppercase block mb-2">Chủ đề mẫu cao cấp (Premium Themes)</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {([
                            { id: "cyberpunk", label: "Cyberpunk", icon: "🌌" },
                            { id: "fantasy", label: "Fantasy", icon: "✨" },
                            { id: "anime", label: "Anime Sakura", icon: "🌸" },
                            { id: "pixel", label: "Retro Pixel", icon: "👾" },
                            { id: "neon", label: "Matrix Neon", icon: "🟢" },
                            { id: "light", label: "Giao Diện Sáng", icon: "☀️" },
                            { id: "dark", label: "Giao Diện Tối", icon: "🌙" },
                            { id: "retro_wave", label: "Retro Wave", icon: "🌇" },
                            { id: "matrix_green", label: "Matrix Rain", icon: "📟" },
                            { id: "forest_nature", label: "Rừng Xanh", icon: "🌿" },
                            { id: "candy_pop", label: "Candy Pop", icon: "🍬" },
                          ] as const).map(t => (
                            <button
                              key={t.id}
                              onClick={() => updateThemeConfig({ theme: t.id })}
                              className={`py-2 px-1.5 rounded-xl text-[10px] font-black cursor-pointer border transition-all flex flex-col items-center gap-1 ${
                                themeConfig.theme === t.id
                                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg"
                                  : "bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-700"
                              }`}
                            >
                              <span className="text-sm">{t.icon}</span>
                              <span>{t.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Graphic quality levels */}
                      <div>
                        <span className="text-[10px] text-slate-500 font-black uppercase block mb-2">Chất lượng đồ họa</span>
                        <div className="grid grid-cols-3 gap-2">
                          {(["low", "medium", "high"] as const).map(q => (
                            <button
                              key={q}
                              onClick={() => updateThemeConfig({ graphicQuality: q })}
                              className={`py-2 rounded-xl text-xs font-black uppercase cursor-pointer border transition-all ${
                                themeConfig.graphicQuality === q
                                  ? "bg-indigo-600 border-indigo-500 text-white"
                                  : "bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-700"
                              }`}
                            >
                              {q === "low" ? "Thấp (Màn nhẹ)" : q === "medium" ? "Trung Bình" : "Cao (Tối đa)"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Animation speeds */}
                      <div>
                        <span className="text-[10px] text-slate-500 font-black uppercase block mb-2">Tốc độ hoạt ảnh chuyển động UI</span>
                        <div className="grid grid-cols-3 gap-2">
                          {(["slow", "normal", "fast"] as const).map(s => (
                            <button
                              key={s}
                              onClick={() => updateThemeConfig({ animationSpeed: s })}
                              className={`py-2 rounded-xl text-xs font-black uppercase cursor-pointer border transition-all ${
                                themeConfig.animationSpeed === s
                                  ? "bg-indigo-600 border-indigo-500 text-white"
                                  : "bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-700"
                              }`}
                            >
                              {s === "slow" ? "Chậm Mượt" : s === "normal" ? "Bình Thường" : "Nhanh Tức Thì"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Border styles */}
                      <div>
                        <span className="text-[10px] text-slate-500 font-black uppercase block mb-2">Kiểu viền bảng điều khiển</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {(["glow", "glass", "double", "pixel"] as const).map(b => (
                            <button
                              key={b}
                              onClick={() => updateThemeConfig({ borderStyle: b })}
                              className={`py-2 rounded-xl text-[10px] font-black uppercase cursor-pointer border transition-all ${
                                themeConfig.borderStyle === b
                                  ? "bg-indigo-600 border-indigo-500 text-white"
                                  : "bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-700"
                              }`}
                            >
                              {b === "glow" ? "Neon Phát Sáng" : b === "glass" ? "Kính Mờ Blur" : b === "double" ? "Viền Kép Cổ Điển" : "Pixel Sắc Nét"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Canvas particles */}
                      <div>
                        <span className="text-[10px] text-slate-500 font-black uppercase block mb-2">Hiệu ứng hạt nền Canvas</span>
                        <div className="grid grid-cols-3 gap-2">
                          {([
                            { id: "none", label: "Tắt Hạt" },
                            { id: "sparkles", label: "Lấp Lánh" },
                            { id: "snow", label: "Tuyết Rơi" },
                            { id: "fire", label: "Hỏa Tinh" },
                            { id: "sakura", label: "Hoa Anh Đào" },
                            { id: "rain", label: "Mưa Bay" },
                            { id: "cyber_grid", label: "Lưới Cyber" },
                            { id: "matrix_rain", label: "Matrix Rain" },
                            { id: "bubbles", label: "Bóng Nước" },
                          ] as const).map(p => (
                            <button
                              key={p.id}
                              onClick={() => updateThemeConfig({ particles: p.id })}
                              className={`py-2 rounded-xl text-[10px] font-black cursor-pointer border transition-all ${
                                themeConfig.particles === p.id
                                  ? "bg-indigo-600 border-indigo-500 text-white"
                                  : "bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-700"
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* UI Scaling */}
                      <div>
                        <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-2">
                          <span>Tỉ lệ kích thước giao diện UI</span>
                          <span>{themeConfig.uiScale}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="50"
                            max="150"
                            step="25"
                            value={themeConfig.uiScale}
                            onChange={e => updateThemeConfig({ uiScale: parseInt(e.target.value) })}
                            className="flex-1 accent-indigo-500 cursor-pointer bg-slate-800 h-1.5 rounded-full"
                          />
                          <div className="flex gap-1.5">
                            {[75, 100, 125].map(scale => (
                              <button
                                key={scale}
                                onClick={() => updateThemeConfig({ uiScale: scale })}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black cursor-pointer border ${
                                  themeConfig.uiScale === scale
                                    ? "bg-indigo-600 border-indigo-500 text-white"
                                    : "bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-700"
                                }`}
                              >
                                {scale}%
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === "appearance" && (
                    <div className="flex-1 flex flex-col pb-6">
                      <CustomThemeBuilder />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
