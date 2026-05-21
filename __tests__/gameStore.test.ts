import { useGameStore, PETS } from "../src/store/gameStore";

describe("QuizVerse Game Store - Integration Tests", () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useGameStore.setState({
      quizzes: [],
      activeQuizId: null,
      correctCount: 0,
      incorrectCount: 0,
      score: 0,
      streak: 0,
      lives: 3,
      isGameOver: false,
      player: {
        level: 1,
        exp: 0,
        totalQuizzesPlayed: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        activePet: "none",
        unlockedPets: ["slime"],
        achievements: [],
        highScore: 0,
      }
    });
  });

  test("Should initialize state correctly", () => {
    const state = useGameStore.getState();
    expect(state.correctCount).toBe(0);
    expect(state.score).toBe(0);
    expect(state.player.level).toBe(1);
    expect(state.player.activePet).toBe("none");
  });

  test("Should split levels correctly: 250 questions = 5 Levels", () => {
    const state = useGameStore.getState();
    const mockQuestions = Array.from({ length: 250 }, (_, i) => ({
      question: `Câu hỏi ${i + 1}`,
      answers: ["A", "B", "C", "D"],
      correct: 0,
    }));

    state.importQuiz("Mock Quiz", mockQuestions, "mock-id");
    
    // Start Level 1 (First 50 questions)
    state.startQuiz("mock-id", "classic", 1);
    const updatedState1 = useGameStore.getState();
    expect(updatedState1.shuffledQuestions.length).toBe(50);
    expect(updatedState1.shuffledQuestions[0].question).toContain("Câu hỏi");

    // Start Level 5 (Last 50 questions)
    state.startQuiz("mock-id", "classic", 5);
    const updatedState5 = useGameStore.getState();
    expect(updatedState5.shuffledQuestions.length).toBe(50);
  });

  test("Should score correct answers correctly: score = correctCount * 0.2", () => {
    const state = useGameStore.getState();
    const mockQuestions = [
      { question: "Q1", answers: ["A", "B"], correct: 0 },
      { question: "Q2", answers: ["A", "B"], correct: 1 },
    ];

    state.importQuiz("Mock Quiz", mockQuestions, "mock-id");
    state.startQuiz("mock-id", "classic", 1);

    // Select correct answer for Q1
    const activeQ = useGameStore.getState().shuffledQuestions[0];
    const correctIdx = activeQ.answers.findIndex(a => a.originalIndex === activeQ.correctOriginalIndex);
    
    useGameStore.getState().selectAnswer(correctIdx);
    useGameStore.getState().submitAnswer();

    const scoredState = useGameStore.getState();
    expect(scoredState.correctCount).toBe(1);
    expect(scoredState.score).toBe(0.2); // +0.2 points
    expect(scoredState.player.exp).toBe(10); // +10 EXP
  });

  test("Should apply Pet EXP buff multiplier correctly", () => {
    const state = useGameStore.getState();
    const mockQuestions = [
      { question: "Q1", answers: ["A", "B"], correct: 0 },
    ];

    state.importQuiz("Mock Quiz", mockQuestions, "mock-id");
    
    // Unlock and equip Dragon (+50% / +20% EXP)
    state.unlockPet("dragon");
    state.setActivePet("dragon");
    state.startQuiz("mock-id", "classic", 1);

    // Answer Q1 correctly
    const activeQ = useGameStore.getState().shuffledQuestions[0];
    const correctIdx = activeQ.answers.findIndex(a => a.originalIndex === activeQ.correctOriginalIndex);
    
    useGameStore.getState().selectAnswer(correctIdx);
    useGameStore.getState().submitAnswer();

    const scoredState = useGameStore.getState();
    // Dragon gives EXP +20% multiplier (10 * 1.2 = 12 EXP)
    expect(scoredState.player.exp).toBe(12);
  });
});
