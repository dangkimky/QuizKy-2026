import { parseTextContent, parseExcel } from "../src/lib/parser";

describe("QuizVerse Parser Engine - Unit Tests", () => {
  
  test("Should parse standard TXT format with 'Đáp án:' indicator correctly", () => {
    const rawText = `
      Câu 1: CPU là gì?
      A. Bộ nhớ
      B. Thiết bị nhập
      C. Bộ xử lý trung tâm
      D. Card màn hình
      Đáp án: C
    `;
    const questions = parseTextContent(rawText);
    expect(questions.length).toBe(1);
    expect(questions[0].question).toBe("CPU là gì?");
    expect(questions[0].answers).toEqual([
      "Bộ nhớ",
      "Thiết bị nhập",
      "Bộ xử lý trung tâm",
      "Card màn hình"
    ]);
    expect(questions[0].correct).toBe(2); // C is index 2
  });

  test("Should parse choices containing bold marker [STRONG] correctly", () => {
    const rawText = `
      Câu 1: RAM là gì?
      A. Bộ nhớ truy cập ngẫu nhiên [STRONG]RAM[/STRONG]
      B. Thiết bị xuất
      C. Bảng mạch chính
      D. Nguồn điện
      Đáp án: A
    `;
    const questions = parseTextContent(rawText);
    expect(questions.length).toBe(1);
    expect(questions[0].correct).toBe(0); // A is index 0
  });

  test("Should parse inline correct markers like 🟩 or ✓ correctly", () => {
    const rawText = `
      Câu 1: SSD là gì?
      A. Ổ cứng thể rắn 🟩
      B. Ổ đĩa quang
      C. Băng từ
      D. Đĩa mềm
    `;
    const questions = parseTextContent(rawText);
    expect(questions.length).toBe(1);
    expect(questions[0].correct).toBe(0); // SSD 🟩 is correct
  });

  test("Should parse inline correct text suffixes like '← màu xanh' correctly", () => {
    const rawText = `
      Câu 1: GPU là gì?
      A. Bộ nhớ chính
      B. Thiết bị âm thanh
      C. Bộ xử lý đồ họa ← màu xanh
      D. Thiết bị mạng
    `;
    const questions = parseTextContent(rawText);
    expect(questions.length).toBe(1);
    expect(questions[0].correct).toBe(2); // C is correct
  });

  test("Should parse multiple questions in a single stream", () => {
    const rawText = `
      Câu 1: Câu hỏi thứ nhất?
      A. Sai
      B. Đúng 🟩
      
      Câu 2: Câu hỏi thứ hai?
      A. Đúng 🟩
      B. Sai
    `;
    const questions = parseTextContent(rawText);
    expect(questions.length).toBe(2);
    expect(questions[0].question).toBe("Câu hỏi thứ nhất?");
    expect(questions[0].correct).toBe(1);
    expect(questions[1].question).toBe("Câu hỏi thứ hai?");
    expect(questions[1].correct).toBe(0);
  });
});
