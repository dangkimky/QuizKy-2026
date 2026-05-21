"use client";

import React, { useEffect, useState } from "react";
import { useGameStore, PETS } from "@/store/gameStore";
import { motion, AnimatePresence } from "framer-motion";

const DIALOGUES = {
  idle: [
    "Tớ ở đây để nhân thêm điểm thưởng cho cậu!",
    "Bộ đề này trông thú vị ghê ta!",
    "Bật chế độ tập trung 100% đi nào!",
    "Màu sắc giao diện này đẹp quá ha!",
    "Hôm nay cậu trông thật thông thái!",
    "Chơi tiếp thôi, tớ đang đói EXP nè!",
  ],
  correct: [
    "Quá xuất sắc! Thiên tài là đây chứ đâu!",
    "Đỉnh của chóp luôn cậu ơi! 🌟",
    "Tuyệt cú mèo! Đúng nữa rồi!",
    "Dễ như ăn bánh đúng không nào?",
    "Thông thái quá! Tớ tự hào về cậu!",
  ],
  incorrect: [
    "Ui da, tiếc quá đi! Thử lại câu sau nhé!",
    "Không sao đâu, thất bại là mẹ thành công mà!",
    "Gần đúng rồi! Tập trung hơn chút nào!",
    "Bình tĩnh nha cậu, tớ tin cậu làm được!",
    "Đừng nản lòng! Đọc kỹ câu tiếp theo nè!",
  ],
  start: [
    "Bắt đầu chiến đấu thôi! Buff của tớ đã sẵn sàng!",
    "Hãy cho tớ thấy sức mạnh bộ não của cậu nào!",
    "Màn chơi này không làm khó được cậu đâu!",
  ],
  gameover: [
    "Trận đấu kết thúc rồi! Cậu đã chơi rất xuất sắc!",
    "Cố gắng lắm rồi! Điểm số quá ấn tượng!",
    "Tuyệt vời! EXP của tớ tăng vèo vèo!",
  ],
};

export default function PetCompanion() {
  const activePetId = useGameStore(state => state.player.activePet);
  const correctCount = useGameStore(state => state.correctCount);
  const incorrectCount = useGameStore(state => state.incorrectCount);
  const isGameOver = useGameStore(state => state.isGameOver);
  const activeQuizId = useGameStore(state => state.activeQuizId);
  const isAnswered = useGameStore(state => state.isAnswered);
  const shuffledQuestions = useGameStore(state => state.shuffledQuestions);
  const currentQuestionIndex = useGameStore(state => state.currentQuestionIndex);
  const selectedAnswerIndex = useGameStore(state => state.selectedAnswerIndex);

  const [speech, setSpeech] = useState("");
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [petEmotion, setPetEmotion] = useState<"idle" | "happy" | "sad">("idle");

  const pet = PETS[activePetId];

  // Function to show bubble
  const showBubble = (text: string, duration = 4000) => {
    setSpeech(text);
    setBubbleVisible(true);
    const timer = setTimeout(() => setBubbleVisible(false), duration);
    return () => clearTimeout(timer);
  };

  // Dialogue trigger on startup
  useEffect(() => {
    if (pet && activeQuizId && currentQuestionIndex === 0 && !isAnswered) {
      const idx = Math.floor(Math.random() * DIALOGUES.start.length);
      showBubble(DIALOGUES.start[idx]);
      setPetEmotion("idle");
    }
  }, [activeQuizId, activePetId]);

  // Dialogue trigger on answers
  useEffect(() => {
    if (!pet || !activeQuizId || !isAnswered) return;

    const currentQ = shuffledQuestions[currentQuestionIndex];
    if (!currentQ || selectedAnswerIndex === null) return;

    const chosen = currentQ.answers[selectedAnswerIndex];
    const isCorrect = chosen?.originalIndex === currentQ.correctOriginalIndex;

    if (isCorrect) {
      const idx = Math.floor(Math.random() * DIALOGUES.correct.length);
      showBubble(DIALOGUES.correct[idx]);
      setPetEmotion("happy");
    } else {
      const idx = Math.floor(Math.random() * DIALOGUES.incorrect.length);
      showBubble(DIALOGUES.incorrect[idx]);
      setPetEmotion("sad");
    }

    const timer = setTimeout(() => setPetEmotion("idle"), 2500);
    return () => clearTimeout(timer);
  }, [isAnswered, currentQuestionIndex]);

  // Dialogue trigger on game over
  useEffect(() => {
    if (pet && isGameOver) {
      const idx = Math.floor(Math.random() * DIALOGUES.gameover.length);
      showBubble(DIALOGUES.gameover[idx]);
      setPetEmotion("happy");
    }
  }, [isGameOver]);

  // Idle thoughts loop
  useEffect(() => {
    if (!pet) return;

    const interval = setInterval(() => {
      if (!bubbleVisible && !isGameOver && activeQuizId) {
        const idx = Math.floor(Math.random() * DIALOGUES.idle.length);
        showBubble(DIALOGUES.idle[idx]);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [pet, bubbleVisible, isGameOver, activeQuizId]);

  if (!pet) return null;

  // Render buffs string
  const buffText =
    pet.buffType === "both"
      ? `EXP & Điểm x${pet.buffMultiplier}`
      : `${pet.buffType.toUpperCase()} x${pet.buffMultiplier}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 pointer-events-none flex flex-col items-end">
      {/* Speech Bubble */}
      <AnimatePresence>
        {bubbleVisible && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mb-3 max-w-[220px] bg-slate-900/90 border border-slate-700/80 p-3 rounded-2xl rounded-br-none shadow-2xl text-xs text-slate-200 pointer-events-auto backdrop-blur-md relative"
          >
            <div className="font-semibold text-[10px] uppercase text-indigo-400 mb-1 flex justify-between">
              <span>{pet.name}</span>
              <span className="text-amber-400 font-bold">{buffText}</span>
            </div>
            <p className="leading-relaxed">{speech}</p>
            {/* Pointer arrow */}
            <div className="absolute right-0 bottom-[-6px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900/90" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pet Character Body */}
      <motion.div
        animate={{
          y: petEmotion === "happy" ? [0, -15, 0, -15, 0] : [0, -10, 0],
          rotate: petEmotion === "sad" ? [-5, 5, -5, 5, 0] : [0, 2, -2, 0],
          scale: petEmotion === "happy" ? [1, 1.1, 1] : 1,
        }}
        transition={{
          y: {
            repeat: petEmotion === "idle" ? Infinity : 1,
            duration: petEmotion === "idle" ? 3 : 0.8,
            ease: "easeInOut",
          },
          rotate: {
            repeat: petEmotion === "idle" ? Infinity : 0,
            duration: 4,
            ease: "easeInOut",
          },
        }}
        className="pointer-events-auto cursor-pointer flex flex-col items-center select-none"
        onClick={() => {
          const idx = Math.floor(Math.random() * DIALOGUES.idle.length);
          showBubble(DIALOGUES.idle[idx]);
        }}
      >
        {/* Glow halo */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-4xl shadow-xl transition-all duration-300 relative"
          style={{
            backgroundColor: `${pet.color}20`,
            border: `2px solid ${pet.color}`,
            boxShadow: `0 0 20px ${pet.color}50`,
          }}
        >
          {pet.sprite}
          {/* Eyes animation based on emotion */}
          <span className="absolute text-[10px] bottom-1 font-bold tracking-wider" style={{ color: pet.color }}>
            {petEmotion === "happy" ? "●‿●" : petEmotion === "sad" ? "ಥ_ಥ" : "◕‿◕"}
          </span>
        </div>
        
        {/* Pet Name Tag */}
        <div
          className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-950/80 border border-slate-700 text-slate-300"
          style={{ borderColor: `${pet.color}80` }}
        >
          {pet.name}
        </div>
      </motion.div>
    </div>
  );
}
