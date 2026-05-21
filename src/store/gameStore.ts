import { create } from "zustand";

export interface Question {
  question: string;
  answers: string[];
  correct: number;
}

export type GameMode = "classic" | "time_attack" | "survival" | "endless" | "boss";
export type UITheme = "cyberpunk" | "fantasy" | "anime" | "pixel" | "neon" | "light" | "dark" | "custom" | "retro_wave" | "matrix_green" | "forest_nature" | "candy_pop";
export type ParticleType = "none" | "sparkles" | "snow" | "fire" | "sakura" | "rain" | "cyber_grid" | "matrix_rain" | "bubbles";

export interface ThemeConfig {
  theme: UITheme;
  background: string; // url or hex
  panelBg: string;
  buttonBg: string;
  buttonHoverBg: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  glowColor: string;
  fontFamily: string;
  particles: ParticleType;
  uiScale: number; // 50, 75, 100, 125, 150, 200
  graphicQuality: "low" | "medium" | "high";
  animationSpeed: "slow" | "normal" | "fast";
  borderStyle: "glow" | "glass" | "double" | "pixel";
}

export interface PetConfig {
  id: string;
  name: string;
  description: string;
  buffType: "exp" | "score" | "both";
  buffMultiplier: number; // e.g. 1.5 (+50%)
  sprite: string; // emoji or designator
  color: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface PlayerStats {
  level: number;
  exp: number;
  totalQuizzesPlayed: number;
  totalCorrect: number;
  totalIncorrect: number;
  activePet: string;
  unlockedPets: string[];
  achievements: Achievement[];
  highScore: number;
}

export interface GameState {
  // Database of Quizzes
  quizzes: { id: string; title: string; questions: Question[]; config?: Partial<ThemeConfig> }[];
  activeQuizId: string | null;

  // Active Play Session
  activeQuestions: Question[];
  shuffledQuestions: { question: string; answers: { text: string; originalIndex: number }[]; correctOriginalIndex: number }[];
  currentQuestionIndex: number;
  selectedAnswerIndex: number | null;
  isAnswered: boolean;
  score: number; // calculated as correctCount * 0.2
  correctCount: number;
  incorrectCount: number;
  currentLevel: number; // level of questions split (50 questions = 1 level)
  gameMode: GameMode;
  timeLeft: number; // seconds left
  lives: number; // Survival lives
  streak: number; // consecutive correct answers
  isGameOver: boolean;

  // Sound Config
  soundVolume: number;
  musicVolume: number;
  isSoundMuted: boolean;

  // Player Profile
  player: PlayerStats;

  // Theme Settings
  themeConfig: ThemeConfig;
  customThemes: Record<string, Partial<ThemeConfig>>;

  // Actions
  loadQuizzes: () => void;
  importQuiz: (title: string, questions: Question[], customId?: string) => string;
  deleteQuiz: (id: string) => void;
  startQuiz: (quizId: string, mode: GameMode, levelNum?: number) => void;
  selectAnswer: (index: number) => void;
  submitAnswer: () => void;
  nextQuestion: () => void;
  tickTimer: () => void;
  updateThemeConfig: (updates: Partial<ThemeConfig>) => void;
  saveCustomTheme: (name: string, theme: Partial<ThemeConfig>) => void;
  unlockPet: (petId: string) => void;
  setActivePet: (petId: string) => void;
  updateVolume: (type: "sound" | "music", value: number) => void;
  toggleMute: () => void;
  resetProgress: () => void;
  triggerAchievement: (id: string) => void;
  user: { uid: string; email: string; displayName: string; photoURL: string } | null;
  syncUser: (userPayload: { uid: string; email: string; displayName: string; photoURL: string } | null) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const DEFAULT_THEME_CONFIGS: Record<UITheme, ThemeConfig> = {
  cyberpunk: {
    theme: "cyberpunk",
    background: "linear-gradient(135deg, #0d0e15 0%, #170d1e 100%)",
    panelBg: "rgba(22, 17, 36, 0.8)",
    buttonBg: "rgba(255, 0, 127, 0.15)",
    buttonHoverBg: "rgba(255, 0, 127, 0.4)",
    textPrimary: "#00ffff",
    textSecondary: "#ff007f",
    borderColor: "#ff007f",
    glowColor: "rgba(255, 0, 127, 0.6)",
    fontFamily: "Orbitron, sans-serif",
    particles: "sparkles",
    uiScale: 100,
    graphicQuality: "high",
    animationSpeed: "normal",
    borderStyle: "glow",
  },
  fantasy: {
    theme: "fantasy",
    background: "linear-gradient(135deg, #110925 0%, #29104a 100%)",
    panelBg: "rgba(26, 11, 56, 0.75)",
    buttonBg: "rgba(212, 175, 55, 0.15)",
    buttonHoverBg: "rgba(212, 175, 55, 0.35)",
    textPrimary: "#f3e5ab",
    textSecondary: "#d4af37",
    borderColor: "#d4af37",
    glowColor: "rgba(212, 175, 55, 0.5)",
    fontFamily: "Cinzel, serif",
    particles: "snow",
    uiScale: 100,
    graphicQuality: "high",
    animationSpeed: "normal",
    borderStyle: "double",
  },
  anime: {
    theme: "anime",
    background: "linear-gradient(135deg, #fff0f5 0%, #ffe4e1 100%)",
    panelBg: "rgba(255, 255, 255, 0.9)",
    buttonBg: "rgba(255, 105, 180, 0.15)",
    buttonHoverBg: "rgba(255, 105, 180, 0.3)",
    textPrimary: "#ff1493",
    textSecondary: "#db7093",
    borderColor: "#ffc0cb",
    glowColor: "rgba(255, 192, 203, 0.8)",
    fontFamily: "Outfit, sans-serif",
    particles: "sakura",
    uiScale: 100,
    graphicQuality: "high",
    animationSpeed: "normal",
    borderStyle: "glass",
  },
  pixel: {
    theme: "pixel",
    background: "#080c10",
    panelBg: "#141b24",
    buttonBg: "#304050",
    buttonHoverBg: "#4f6a85",
    textPrimary: "#38b6ff",
    textSecondary: "#5271ff",
    borderColor: "#ffffff",
    glowColor: "rgba(255,255,255,0.2)",
    fontFamily: "'Courier New', monospace",
    particles: "none",
    uiScale: 100,
    graphicQuality: "high",
    animationSpeed: "normal",
    borderStyle: "pixel",
  },
  neon: {
    theme: "neon",
    background: "#000000",
    panelBg: "rgba(10, 10, 10, 0.9)",
    buttonBg: "rgba(0, 255, 0, 0.05)",
    buttonHoverBg: "rgba(0, 255, 0, 0.2)",
    textPrimary: "#39ff14",
    textSecondary: "#ff355e",
    borderColor: "#39ff14",
    glowColor: "rgba(57, 255, 20, 0.8)",
    fontFamily: "monospace",
    particles: "fire",
    uiScale: 100,
    graphicQuality: "high",
    animationSpeed: "normal",
    borderStyle: "glow",
  },
  light: {
    theme: "light",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    panelBg: "rgba(255, 255, 255, 0.65)",
    buttonBg: "rgba(74, 85, 104, 0.08)",
    buttonHoverBg: "rgba(74, 85, 104, 0.18)",
    textPrimary: "#1a202c",
    textSecondary: "#4a5568",
    borderColor: "#e2e8f0",
    glowColor: "rgba(0, 0, 0, 0.05)",
    fontFamily: "Inter, sans-serif",
    particles: "rain",
    uiScale: 100,
    graphicQuality: "high",
    animationSpeed: "normal",
    borderStyle: "glass",
  },
  dark: {
    theme: "dark",
    background: "#121212",
    panelBg: "rgba(30, 30, 30, 0.85)",
    buttonBg: "rgba(255, 255, 255, 0.05)",
    buttonHoverBg: "rgba(255, 255, 255, 0.15)",
    textPrimary: "#ffffff",
    textSecondary: "#b3b3b3",
    borderColor: "#333333",
    glowColor: "rgba(255, 255, 255, 0.05)",
    fontFamily: "Inter, sans-serif",
    particles: "none",
    uiScale: 100,
    graphicQuality: "high",
    animationSpeed: "normal",
    borderStyle: "glass",
  },
  custom: {
    theme: "custom",
    background: "#1e1e24",
    panelBg: "rgba(45, 45, 56, 0.85)",
    buttonBg: "rgba(99, 102, 241, 0.15)",
    buttonHoverBg: "rgba(99, 102, 241, 0.35)",
    textPrimary: "#818cf8",
    textSecondary: "#a78bfa",
    borderColor: "#6366f1",
    glowColor: "rgba(99, 102, 241, 0.5)",
    fontFamily: "sans-serif",
    particles: "none",
    uiScale: 100,
    graphicQuality: "high",
    animationSpeed: "normal",
    borderStyle: "glass",
  },
  retro_wave: {
    theme: "retro_wave",
    background: "linear-gradient(135deg, #1d072b 0%, #46063e 50%, #7d0b3b 100%)",
    panelBg: "rgba(25, 9, 36, 0.8)",
    buttonBg: "rgba(255, 0, 191, 0.15)",
    buttonHoverBg: "rgba(255, 0, 191, 0.4)",
    textPrimary: "#ff00bf",
    textSecondary: "#00ffff",
    borderColor: "#00ffff",
    glowColor: "rgba(0, 255, 255, 0.6)",
    fontFamily: "Orbitron, sans-serif",
    particles: "cyber_grid",
    uiScale: 100,
    graphicQuality: "high",
    animationSpeed: "normal",
    borderStyle: "glow",
  },
  matrix_green: {
    theme: "matrix_green",
    background: "#030704",
    panelBg: "rgba(8, 16, 10, 0.9)",
    buttonBg: "rgba(0, 255, 65, 0.1)",
    buttonHoverBg: "rgba(0, 255, 65, 0.3)",
    textPrimary: "#00ff41",
    textSecondary: "#008f11",
    borderColor: "#00ff41",
    glowColor: "rgba(0, 255, 65, 0.5)",
    fontFamily: "monospace",
    particles: "matrix_rain",
    uiScale: 100,
    graphicQuality: "high",
    animationSpeed: "normal",
    borderStyle: "pixel",
  },
  forest_nature: {
    theme: "forest_nature",
    background: "linear-gradient(135deg, #09170f 0%, #15321f 50%, #204c30 100%)",
    panelBg: "rgba(15, 33, 23, 0.8)",
    buttonBg: "rgba(46, 204, 113, 0.15)",
    buttonHoverBg: "rgba(46, 204, 113, 0.35)",
    textPrimary: "#2ecc71",
    textSecondary: "#27ae60",
    borderColor: "#2ecc71",
    glowColor: "rgba(46, 204, 113, 0.4)",
    fontFamily: "Outfit, sans-serif",
    particles: "bubbles",
    uiScale: 100,
    graphicQuality: "high",
    animationSpeed: "normal",
    borderStyle: "glass",
  },
  candy_pop: {
    theme: "candy_pop",
    background: "linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)",
    panelBg: "rgba(255, 255, 255, 0.85)",
    buttonBg: "rgba(255, 107, 107, 0.15)",
    buttonHoverBg: "rgba(255, 107, 107, 0.3)",
    textPrimary: "#ff4d6d",
    textSecondary: "#ff758c",
    borderColor: "#ff8da1",
    glowColor: "rgba(255, 77, 109, 0.3)",
    fontFamily: "Outfit, sans-serif",
    particles: "sparkles",
    uiScale: 100,
    graphicQuality: "high",
    animationSpeed: "normal",
    borderStyle: "glass",
  },
};

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: "first_quiz", title: "Khởi Đầu Kỳ Tích", description: "Hoàn thành phiên chơi trắc nghiệm đầu tiên", icon: "🏆", unlocked: false },
  { id: "correct_10", title: "Cực Kỳ Nhạy Bén", description: "Trả lời đúng 10 câu hỏi trong lịch sử", icon: "⚡", unlocked: false },
  { id: "correct_100", title: "Bậc Thầy Thông Thái", description: "Trả lời đúng 100 câu hỏi trong lịch sử", icon: "🧠", unlocked: false },
  { id: "quiz_master", title: "Nhà Vô Địch Quiz", description: "Đạt cấp độ người chơi 5", icon: "👑", unlocked: false },
  { id: "genius", title: "Trí Tuệ Thiên Tài", description: "Đạt điểm số tuyệt đối 10.0 trong một màn chơi", icon: "🌟", unlocked: false },
  { id: "speed_runner", title: "Tốc Độ Ánh Sáng", description: "Hoàn thành 1 level Time Attack với điểm số từ 8.0 trở lên", icon: "🏃", unlocked: false },
  { id: "survivor", title: "Kẻ Sống Sót Cuối Cùng", description: "Trả lời đúng liên tục 15 câu trong chế độ Survival", icon: "🛡️", unlocked: false },
];

export const PETS: Record<string, PetConfig> = {
  slime: { id: "slime", name: "Bóng Nước Slime", description: "Slime tinh nghịch nhảy nhót. Nhận +10% EXP.", buffType: "exp", buffMultiplier: 1.1, sprite: "💧", color: "#38b6ff" },
  cat: { id: "cat", name: "Mèo Neon Cyber", description: "Mèo điện tử cực ngầu. Nhận +30% Điểm Thưởng.", buffType: "score", buffMultiplier: 1.3, sprite: "🐱", color: "#ff007f" },
  dragon: { id: "dragon", name: "Rồng Lửa Cổ Đại", description: "Rồng bay lượn xung quanh. Nhận +20% EXP và +20% Điểm Thưởng.", buffType: "both", buffMultiplier: 1.2, sprite: "🐉", color: "#f59e0b" },
  phoenix: { id: "phoenix", name: "Phượng Hoàng Lửa", description: "Phượng hoàng tái sinh huyền thoại. Nhận +50% EXP.", buffType: "exp", buffMultiplier: 1.5, sprite: "🐦", color: "#ef4444" },
};

const syncPlayerStatsToServer = async (stats: PlayerStats, user: any, activeTheme: string) => {
  if (!user) return;
  try {
    await fetch("/api/player", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        playerId: user.uid,
        name: user.displayName || "QuizMaster",
        level: stats.level,
        exp: stats.exp,
        activePet: stats.activePet,
        activeTheme: activeTheme,
        statsJson: JSON.stringify(stats)
      })
    });
  } catch (err) {
    console.error("Error syncing player stats to server:", err);
  }
};

export const useGameStore = create<GameState>((set, get) => ({
  quizzes: [],
  activeQuizId: null,

  activeQuestions: [],
  shuffledQuestions: [],
  currentQuestionIndex: 0,
  selectedAnswerIndex: null,
  isAnswered: false,
  score: 0,
  correctCount: 0,
  incorrectCount: 0,
  currentLevel: 1,
  gameMode: "classic",
  timeLeft: 30,
  lives: 3,
  streak: 0,
  isGameOver: false,

  soundVolume: 75,
  musicVolume: 50,
  isSoundMuted: false,

  player: {
    level: 1,
    exp: 0,
    totalQuizzesPlayed: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    activePet: "none",
    unlockedPets: ["slime"],
    achievements: INITIAL_ACHIEVEMENTS,
    highScore: 0,
  },

  themeConfig: DEFAULT_THEME_CONFIGS.cyberpunk,
  customThemes: {},
  user: null,

  loadQuizzes: () => {
    if (typeof window === "undefined") return;
    const localQuizzes = localStorage.getItem("quizverse_quizzes");
    const localPlayer = localStorage.getItem("quizverse_player");
    const localTheme = localStorage.getItem("quizverse_theme");
    const localCustomThemes = localStorage.getItem("quizverse_custom_themes");

    set(state => {
      const parsedPlayer = localPlayer ? JSON.parse(localPlayer) : null;
      let finalAchievements = state.player.achievements;
      if (parsedPlayer?.achievements) {
        // Merge stored achievements with initial to prevent structure drift
        finalAchievements = INITIAL_ACHIEVEMENTS.map(initial => {
          const match = parsedPlayer.achievements.find((a: Achievement) => a.id === initial.id);
          return match ? { ...initial, unlocked: match.unlocked, unlockedAt: match.unlockedAt } : initial;
        });
      }

      return {
        quizzes: localQuizzes ? JSON.parse(localQuizzes) : [],
        player: parsedPlayer ? {
          ...state.player,
          ...parsedPlayer,
          achievements: finalAchievements,
        } : state.player,
        themeConfig: localTheme ? JSON.parse(localTheme) : state.themeConfig,
        customThemes: localCustomThemes ? JSON.parse(localCustomThemes) : {},
      };
    });
  },

  importQuiz: (title: string, questions: Question[], customId?: string) => {
    const id = customId || crypto.randomUUID();
    set(state => {
      const newQuiz = { id, title, questions };
      const updated = [...state.quizzes.filter(q => q.id !== id), newQuiz];
      localStorage.setItem("quizverse_quizzes", JSON.stringify(updated));
      return { quizzes: updated };
    });
    return id;
  },

  deleteQuiz: (id: string) => {
    set(state => {
      const updated = state.quizzes.filter(q => q.id !== id);
      localStorage.setItem("quizverse_quizzes", JSON.stringify(updated));
      return { quizzes: updated, activeQuizId: state.activeQuizId === id ? null : state.activeQuizId };
    });
  },

  startQuiz: (quizId: string, mode: GameMode, levelNum: number = 1) => {
    const quiz = get().quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    // Quiz levels are split by 50 questions
    const allQuestions = [...quiz.questions];
    
    // Split into current level
    const questionsPerLevel = 50;
    const startIndex = (levelNum - 1) * questionsPerLevel;
    let selectedQuestions: Question[] = [];

    if (mode === "endless") {
      // Endless: full random pool, select all
      selectedQuestions = allQuestions;
    } else if (mode === "boss") {
      // Boss: Last 10 questions of current level (or final 10 of entire quiz)
      const levelPool = allQuestions.slice(startIndex, startIndex + questionsPerLevel);
      selectedQuestions = levelPool.slice(-10); // last 10
      if (selectedQuestions.length === 0) {
        selectedQuestions = allQuestions.slice(-10);
      }
    } else {
      // Classic, Time Attack, Survival: 50 questions
      selectedQuestions = allQuestions.slice(startIndex, startIndex + questionsPerLevel);
      if (selectedQuestions.length === 0) {
        selectedQuestions = allQuestions.slice(0, questionsPerLevel);
      }
    }

    // Shuffle questions
    const shuffledQuestionsList = [...selectedQuestions].sort(() => Math.random() - 0.5);

    // Shuffle answers for each question but retain their original indices
    const preparedQuestions = shuffledQuestionsList.map(q => {
      const answersWithOrig = q.answers.map((text, idx) => ({ text, originalIndex: idx }));
      // Shuffle answers
      const shuffledAnswers = answersWithOrig.sort(() => Math.random() - 0.5);
      return {
        question: q.question,
        answers: shuffledAnswers,
        correctOriginalIndex: q.correct,
      };
    });

    // Reset session variables
    let initialTimeLeft = 30; // 30s per question in Time Attack
    if (mode === "time_attack") initialTimeLeft = 20;

    set({
      activeQuizId: quizId,
      activeQuestions: selectedQuestions,
      shuffledQuestions: preparedQuestions,
      currentQuestionIndex: 0,
      selectedAnswerIndex: null,
      isAnswered: false,
      score: 0,
      correctCount: 0,
      incorrectCount: 0,
      currentLevel: levelNum,
      gameMode: mode,
      timeLeft: initialTimeLeft,
      lives: mode === "survival" ? 3 : 1, // 3 lives in Survival, not used in others
      streak: 0,
      isGameOver: false,
    });

    // Apply quiz-specific theme configuration if available
    if (quiz.config) {
      set(state => ({ themeConfig: { ...state.themeConfig, ...quiz.config } }));
    }
  },

  selectAnswer: (index: number) => {
    if (get().isAnswered || get().isGameOver) return;
    set({ selectedAnswerIndex: index });
  },

  submitAnswer: () => {
    const state = get();
    if (state.isAnswered || state.selectedAnswerIndex === null || state.isGameOver) return;

    const currentQ = state.shuffledQuestions[state.currentQuestionIndex];
    const chosenAnswer = currentQ.answers[state.selectedAnswerIndex];
    const isCorrect = chosenAnswer.originalIndex === currentQ.correctOriginalIndex;

    // Pet multiplier processing
    let expGained = 0;
    let scoreIncrement = 0;
    const petId = state.player.activePet;
    const pet = PETS[petId];

    let expMultiplier = 1;
    let scoreMultiplier = 1;

    if (pet) {
      if (pet.buffType === "exp" || pet.buffType === "both") expMultiplier = pet.buffMultiplier;
      if (pet.buffType === "score" || pet.buffType === "both") scoreMultiplier = pet.buffMultiplier;
    }

    // Boss stage multipliers: score is x2
    const stageMultiplier = state.gameMode === "boss" ? 2.0 : 1.0;

    let newLives = state.lives;

    if (isCorrect) {
      expGained = Math.round(10 * expMultiplier);
      scoreIncrement = 0.2 * scoreMultiplier * stageMultiplier;
      newLives = state.lives; // unchanged
    } else {
      expGained = 0;
      scoreIncrement = 0;
      if (state.gameMode === "survival") {
        newLives = state.lives - 1;
      }
    }

    const newStreak = isCorrect ? state.streak + 1 : 0;
    const isLivesOver = state.gameMode === "survival" && newLives <= 0;
    const isLastQuestion = state.currentQuestionIndex >= state.shuffledQuestions.length - 1;
    const shouldEndSession = isLivesOver || (state.gameMode !== "endless" && isLastQuestion);

    // Save statistics in Player info
    const updatedStats = { ...state.player };
    updatedStats.totalCorrect += isCorrect ? 1 : 0;
    updatedStats.totalIncorrect += isCorrect ? 0 : 1;
    updatedStats.exp += expGained;

    // Check player Level Up (100 EXP per level)
    const requiredExp = updatedStats.level * 100;
    if (updatedStats.exp >= requiredExp) {
      updatedStats.exp -= requiredExp;
      updatedStats.level += 1;
    }

    // Unlock new pets based on Level
    if (updatedStats.level >= 3 && !updatedStats.unlockedPets.includes("cat")) {
      updatedStats.unlockedPets.push("cat");
    }
    if (updatedStats.level >= 5 && !updatedStats.unlockedPets.includes("dragon")) {
      updatedStats.unlockedPets.push("dragon");
    }
    if (updatedStats.level >= 8 && !updatedStats.unlockedPets.includes("phoenix")) {
      updatedStats.unlockedPets.push("phoenix");
    }

    // Process game achievements
    if (updatedStats.totalCorrect >= 10) {
      const a = updatedStats.achievements.find(ac => ac.id === "correct_10");
      if (a && !a.unlocked) {
        a.unlocked = true;
        a.unlockedAt = new Date().toISOString();
      }
    }
    if (updatedStats.totalCorrect >= 100) {
      const a = updatedStats.achievements.find(ac => ac.id === "correct_100");
      if (a && !a.unlocked) {
        a.unlocked = true;
        a.unlockedAt = new Date().toISOString();
      }
    }
    if (updatedStats.level >= 5) {
      const a = updatedStats.achievements.find(ac => ac.id === "quiz_master");
      if (a && !a.unlocked) {
        a.unlocked = true;
        a.unlockedAt = new Date().toISOString();
      }
    }
    if (newStreak >= 15 && state.gameMode === "survival") {
      const a = updatedStats.achievements.find(ac => ac.id === "survivor");
      if (a && !a.unlocked) {
        a.unlocked = true;
        a.unlockedAt = new Date().toISOString();
      }
    }

    set(prev => ({
      isAnswered: true,
      score: Number((prev.score + scoreIncrement).toFixed(2)),
      correctCount: prev.correctCount + (isCorrect ? 1 : 0),
      incorrectCount: prev.incorrectCount + (isCorrect ? 0 : 1),
      lives: newLives,
      streak: newStreak,
      player: updatedStats,
      isGameOver: shouldEndSession ? true : prev.isGameOver,
    }));

    if (shouldEndSession) {
      get().triggerAchievement("first_quiz");
      // Check for perfect score (10.0 score)
      const finalScore = get().score;
      if (finalScore >= 10.0) {
        get().triggerAchievement("genius");
      }
      if (state.gameMode === "time_attack" && finalScore >= 8.0) {
        get().triggerAchievement("speed_runner");
      }
      
      // Update highscore
      if (finalScore > updatedStats.highScore) {
        updatedStats.highScore = Number(finalScore.toFixed(2));
      }
      updatedStats.totalQuizzesPlayed += 1;
      
      // Save game history to local DB
      const historyRecord = {
        id: crypto.randomUUID(),
        quizId: state.activeQuizId || "unknown",
        quizTitle: state.quizzes.find(q => q.id === state.activeQuizId)?.title || "Bài Trắc Nghiệm",
        score: finalScore,
        correctCount: get().correctCount,
        totalQuestions: state.shuffledQuestions.length,
        mode: state.gameMode,
        expGained: state.correctCount * 10,
        playedAt: new Date().toISOString(),
      };
      
      const localHistory = localStorage.getItem("quizverse_history");
      const currentHist = localHistory ? JSON.parse(localHistory) : [];
      localStorage.setItem("quizverse_history", JSON.stringify([historyRecord, ...currentHist]));

      localStorage.setItem("quizverse_player", JSON.stringify(updatedStats));
      
      // Sync stats and history to server
      syncPlayerStatsToServer(updatedStats, state.user, state.themeConfig.theme);
      
      if (state.user) {
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: state.user.uid,
            quizId: historyRecord.quizId,
            quizTitle: historyRecord.quizTitle,
            score: historyRecord.score,
            correctCount: historyRecord.correctCount,
            totalQuestions: historyRecord.totalQuestions,
            mode: historyRecord.mode,
            expGained: historyRecord.expGained
          })
        }).catch(err => console.error("Lỗi đồng bộ history lên server:", err));
      }
    }
  },

  nextQuestion: () => {
    const state = get();
    if (!state.isAnswered || state.isGameOver) return;

    let initialTimeLeft = 30;
    if (state.gameMode === "time_attack") initialTimeLeft = 20;

    if (state.gameMode === "endless" && state.currentQuestionIndex >= state.shuffledQuestions.length - 1) {
      // Loop or add random question from active pool
      const randQ = state.activeQuestions[Math.floor(Math.random() * state.activeQuestions.length)];
      const answersWithOrig = randQ.answers.map((text, idx) => ({ text, originalIndex: idx })).sort(() => Math.random() - 0.5);
      
      set(prev => ({
        shuffledQuestions: [...prev.shuffledQuestions, {
          question: randQ.question,
          answers: answersWithOrig,
          correctOriginalIndex: randQ.correct,
        }],
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        selectedAnswerIndex: null,
        isAnswered: false,
        timeLeft: initialTimeLeft,
      }));
    } else {
      set(prev => ({
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        selectedAnswerIndex: null,
        isAnswered: false,
        timeLeft: initialTimeLeft,
      }));
    }
  },

  tickTimer: () => {
    const state = get();
    if (state.isGameOver || !state.activeQuizId || state.isAnswered) return;

    if (state.gameMode === "time_attack" || state.gameMode === "classic" || state.gameMode === "boss" || state.gameMode === "survival") {
      const newTime = state.timeLeft - 1;
      if (newTime <= 0) {
        // Time expired! Mark answered with incorrect selection
        set({ selectedAnswerIndex: -1 }); // no choice made
        get().submitAnswer();
      } else {
        set({ timeLeft: newTime });
      }
    }
  },

  updateThemeConfig: (updates: Partial<ThemeConfig>) => {
    set(state => {
      let mergedTheme = { ...state.themeConfig, ...updates };
      if (updates.theme && updates.theme !== "custom" && updates.theme !== state.themeConfig.theme) {
        mergedTheme = { ...DEFAULT_THEME_CONFIGS[updates.theme], ...updates };
      }
      localStorage.setItem("quizverse_theme", JSON.stringify(mergedTheme));
      return { themeConfig: mergedTheme };
    });
  },

  saveCustomTheme: (name: string, theme: Partial<ThemeConfig>) => {
    set(state => {
      const updatedCustom = { ...state.customThemes, [name]: theme };
      localStorage.setItem("quizverse_custom_themes", JSON.stringify(updatedCustom));
      return { customThemes: updatedCustom };
    });
  },

  unlockPet: (petId: string) => {
    set(state => {
      if (state.player.unlockedPets.includes(petId)) return {};
      const updated = {
        ...state.player,
        unlockedPets: [...state.player.unlockedPets, petId],
      };
      localStorage.setItem("quizverse_player", JSON.stringify(updated));
      syncPlayerStatsToServer(updated, state.user, state.themeConfig.theme);
      return { player: updated };
    });
  },

  setActivePet: (petId: string) => {
    set(state => {
      const updated = {
        ...state.player,
        activePet: petId,
      };
      localStorage.setItem("quizverse_player", JSON.stringify(updated));
      syncPlayerStatsToServer(updated, state.user, state.themeConfig.theme);
      return { player: updated };
    });
  },

  updateVolume: (type: "sound" | "music", value: number) => {
    set(state => {
      const updates = type === "sound" ? { soundVolume: value } : { musicVolume: value };
      localStorage.setItem(`quizverse_${type}_vol`, String(value));
      return updates;
    });
  },

  toggleMute: () => {
    set(state => {
      const updated = !state.isSoundMuted;
      localStorage.setItem("quizverse_muted", String(updated));
      return { isSoundMuted: updated };
    });
  },

  resetProgress: () => {
    const defaultPlayer: PlayerStats = {
      level: 1,
      exp: 0,
      totalQuizzesPlayed: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      activePet: "none",
      unlockedPets: ["slime"],
      achievements: INITIAL_ACHIEVEMENTS.map(a => ({ ...a, unlocked: false, unlockedAt: undefined })),
      highScore: 0,
    };
    set({
      player: defaultPlayer,
      themeConfig: DEFAULT_THEME_CONFIGS.cyberpunk,
    });
    localStorage.setItem("quizverse_player", JSON.stringify(defaultPlayer));
    localStorage.setItem("quizverse_theme", JSON.stringify(DEFAULT_THEME_CONFIGS.cyberpunk));
    localStorage.removeItem("quizverse_history");
    syncPlayerStatsToServer(defaultPlayer, get().user, DEFAULT_THEME_CONFIGS.cyberpunk.theme);
  },

  triggerAchievement: (id: string) => {
    set(state => {
      const ach = state.player.achievements.find(a => a.id === id);
      if (ach && !ach.unlocked) {
        const updatedAchievements = state.player.achievements.map(a =>
          a.id === id ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() } : a
        );
        const updatedPlayer = {
          ...state.player,
          achievements: updatedAchievements,
        };
        localStorage.setItem("quizverse_player", JSON.stringify(updatedPlayer));
        syncPlayerStatsToServer(updatedPlayer, state.user, state.themeConfig.theme);
        return { player: updatedPlayer };
      }
      return {};
    });
  },

  syncUser: async (userPayload) => {
    if (!userPayload) {
      set({ user: null });
      return;
    }

    try {
      // 1. Fetch player progress from PostgreSQL server
      const res = await fetch(`/api/player?playerId=${userPayload.uid}`);
      const data = await res.json();

      if (data.success && data.player) {
        const serverPlayer = data.player;
        
        set(state => {
          let mergedStats = { ...state.player };
          
          if (serverPlayer.stats) {
            // Server has advanced stats, use it
            mergedStats = serverPlayer.stats;
          } else {
            // First time login - server only has basic profile. Let's initialize server with local stats!
            syncPlayerStatsToServer(state.player, userPayload, state.themeConfig.theme);
          }

          // Fetch user history from server
          fetch(`/api/history?playerId=${userPayload.uid}`)
            .then(r => r.json())
            .then(history => {
              if (Array.isArray(history)) {
                localStorage.setItem("quizverse_history", JSON.stringify(history));
              }
            })
            .catch(err => console.error("Error fetching user history:", err));

          localStorage.setItem("quizverse_player", JSON.stringify(mergedStats));

          // Sync theme if server has customized theme
          let nextTheme = state.themeConfig;
          if (serverPlayer.activeTheme && serverPlayer.activeTheme !== state.themeConfig.theme) {
            // Update active theme in store
            const matchedThemeConfig = DEFAULT_THEME_CONFIGS[serverPlayer.activeTheme as UITheme];
            if (matchedThemeConfig) {
              nextTheme = matchedThemeConfig;
              localStorage.setItem("quizverse_theme", JSON.stringify(nextTheme));
            }
          }

          return {
            user: userPayload,
            player: mergedStats,
            themeConfig: nextTheme
          };
        });
      }
    } catch (err) {
      console.error("Lỗi đồng bộ Firebase user với Backend:", err);
      // Fallback
      set({ user: userPayload });
    }
  },

  signOutUser: async () => {
    set({ user: null });
    // Reset back to local Guest profile from localStorage
    get().loadQuizzes();
  },
}));
