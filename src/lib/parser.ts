import * as mammoth from "mammoth";
import * as XLSX from "xlsx";

export interface Question {
  question: string;
  answers: string[];
  correct: number; // 0-indexed
}

/**
 * Clean options by removing prefix (e.g., "A. ", "🟩 B. ", "C. (correct)")
 */
function cleanOptionText(text: string): { text: string; isCorrect: boolean } {
  let isCorrect = false;
  let clean = text.trim();

  // Detect emojis or markers signifying correctness
  const correctMarkers = ["✓", "*", "🟩", "[x]", "(x)", "correct", "đúng", "← màu xanh", "←"];
  for (const marker of correctMarkers) {
    if (clean.toLowerCase().includes(marker)) {
      isCorrect = true;
      // Remove marker
      clean = clean.replace(new RegExp(`\\s*${escapeRegExp(marker)}\\s*`, "gi"), "");
    }
  }

  // Remove A., B., C., D. or A), B), C), D) prefixes
  clean = clean.replace(/^[A-Z]\s*[\.\)\-:]\s*/i, "");

  return { text: clean.trim(), isCorrect };
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Text parsing algorithm (Handles TXT, DOCX, and PDF text)
 */
export function parseTextContent(text: string): Question[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const questions: Question[] = [];

  let currentQuestion: string | null = null;
  let currentAnswers: string[] = [];
  let correctIndex: number = -1;
  let lastOptionIndex = -1;

  const commitQuestion = () => {
    if (currentQuestion && currentAnswers.length >= 2) {
      // If we haven't found a correct index from inline markers, check if correctIndex was set otherwise default to 0
      const finalCorrect = correctIndex !== -1 ? correctIndex : 0;
      questions.push({
        question: currentQuestion,
        answers: currentAnswers.map(ans => cleanOptionText(ans).text),
        correct: finalCorrect,
      });
    }
    currentQuestion = null;
    currentAnswers = [];
    correctIndex = -1;
    lastOptionIndex = -1;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect new question (e.g., "Câu 1:", "Question 1:", "1.")
    const isNewQuestionStart = /^(câu|question|quiz)\s*\d+\s*[:\.]/i.test(line) || /^\d+\s*[\.\:\-]\s+[A-ZÀ-Ỹ]/i.test(line);

    if (isNewQuestionStart) {
      commitQuestion();
      // Remove "Câu 1:" prefix
      currentQuestion = line.replace(/^(câu|question|quiz)\s*\d+\s*[:\.]\s*/i, "").trim();
      continue;
    }

    // Detect answers (e.g., "A.", "B.", "🟩 C.", "D.")
    const optionMatch = line.match(/^([A-Z])\s*[\.\)\-:]\s*(.*)/i) || line.match(/^(🟩|✓|\*)\s*([A-Z])\s*[\.\)\-:]\s*(.*)/i);
    if (optionMatch) {
      if (!currentQuestion) {
        // If option appears before a question is formally started, we might treat previous lines as question
        if (questions.length === 0 && currentAnswers.length === 0) {
          currentQuestion = "Câu hỏi trắc nghiệm";
        } else {
          continue;
        }
      }

      // Check if it has a correct marker
      const cleanInfo = cleanOptionText(line);
      currentAnswers.push(cleanInfo.text);
      lastOptionIndex = currentAnswers.length - 1;

      if (cleanInfo.isCorrect) {
        correctIndex = lastOptionIndex;
      }
      continue;
    }

    // Detect stand-alone Answer indicator: "Đáp án: C", "Answer: C", "Correct: A"
    const ansMatch = line.match(/^(đáp án|answer|correct|key)\s*[:\-]\s*([A-D])/i);
    if (ansMatch) {
      const letter = ansMatch[2].toUpperCase();
      const code = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      correctIndex = code;
      continue;
    }

    // If it is inside options block, but doesn't start with option letter, it might be additional description or a plain question text
    if (!currentQuestion) {
      currentQuestion = line;
    } else if (currentAnswers.length === 0) {
      // Append to question text
      currentQuestion += " " + line;
    } else {
      // Append to the last option or it's an answer indicator
      if (line.toLowerCase().startsWith("đáp án") || line.toLowerCase().startsWith("answer")) {
        const letter = line.replace(/^(đáp án|answer|correct)\s*[:\-]?\s*/i, "").trim().toUpperCase();
        if (letter.length === 1 && letter >= "A" && letter <= "Z") {
          correctIndex = letter.charCodeAt(0) - 65;
        }
      } else if (lastOptionIndex !== -1) {
        currentAnswers[lastOptionIndex] += " " + line;
      }
    }
  }

  // Commit the final question
  commitQuestion();

  return questions;
}

/**
 * Parse DOCX file using Mammoth HTML parsing to preserve strong/highlight tags
 */
export async function parseDocx(buffer: Buffer): Promise<Question[]> {
  try {
    const { value: html } = await mammoth.convertToHtml({ buffer });
    
    // We can use a simple HTML parser here or extract markers from the text.
    // Mammoth puts bold items in <strong> or <b> tags.
    // Let's replace <strong>Option</strong> with a special marker like [CORRECT] Option
    let parsedHtml = html
      .replace(/<strong>\s*([A-D]\s*[\.\)\-:])\s*(.*?)<\/strong>/gi, "$1 [CORRECT] $2")
      .replace(/<b>\s*([A-D]\s*[\.\)\-:])\s*(.*?)<\/b>/gi, "$1 [CORRECT] $2")
      .replace(/<strong>\s*(.*?)\s*<\/strong>/gi, "[STRONG]$1[/STRONG]"); // general strong markers

    // Remove other HTML tags to get raw text
    const cleanText = parsedHtml.replace(/<[^>]*>/g, "\n");
    
    // Parse using standard text parser but also capturing the [CORRECT] indicator
    const questions = parseTextContent(cleanText);
    
    // If the standard parser didn't catch the correct option, let's look for [STRONG] elements or other clues
    return questions;
  } catch (error) {
    console.error("Docx parsing error:", error);
    throw new Error("Không thể phân tích file Word. Vui lòng kiểm tra định dạng.");
  }
}

/**
 * Parse Excel (XLSX, XLS) or CSV file using SheetJS
 */
export function parseExcel(buffer: Buffer): Question[] {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON array of arrays
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const questions: Question[] = [];

    // Header checking: row 0 might be headers like ["Question", "A", "B", "C", "D", "Correct"]
    let startIndex = 0;
    if (data.length > 0) {
      const firstRow = data[0].map(c => String(c).toLowerCase());
      if (firstRow.includes("question") || firstRow.includes("câu hỏi")) {
        startIndex = 1;
      }
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 3) continue;

      const questionText = String(row[0] || "").trim();
      if (!questionText) continue;

      // Extract options: columns 1 to 4 (or up to length - 2)
      const options: string[] = [];
      let correctVal: any = null;

      // Let's assume standard format: Column 0: Question, Col 1-4: Options, Col 5: Correct option (index 0-based or letter A-D)
      if (row.length >= 6) {
        options.push(String(row[1] || "").trim());
        options.push(String(row[2] || "").trim());
        options.push(String(row[3] || "").trim());
        options.push(String(row[4] || "").trim());
        correctVal = row[5];
      } else {
        // Dynamic options: all columns except first and last
        for (let j = 1; j < row.length - 1; j++) {
          if (row[j] !== undefined && row[j] !== null) {
            options.push(String(row[j]).trim());
          }
        }
        correctVal = row[row.length - 1];
      }

      // Resolve correct answer index
      let correctIndex = 0;
      if (correctVal !== undefined && correctVal !== null) {
        const valStr = String(correctVal).trim().toUpperCase();
        if (valStr.length === 1 && valStr >= "A" && valStr <= "Z") {
          correctIndex = valStr.charCodeAt(0) - 65;
        } else {
          const parsedNum = parseInt(valStr, 10);
          if (!isNaN(parsedNum)) {
            // Check if it's 1-based or 0-based
            correctIndex = parsedNum >= 1 && parsedNum <= options.length ? parsedNum - 1 : parsedNum;
          } else {
            // Find option text match
            const idx = options.findIndex(opt => opt.toLowerCase() === valStr.toLowerCase());
            if (idx !== -1) {
              correctIndex = idx;
            }
          }
        }
      }

      // Safe bounds
      if (correctIndex < 0 || correctIndex >= options.length) {
        correctIndex = 0;
      }

      questions.push({
        question: questionText,
        answers: options.filter(o => o.length > 0),
        correct: correctIndex,
      });
    }

    return questions;
  } catch (error) {
    console.error("Excel parsing error:", error);
    throw new Error("Không thể phân tích file Excel/CSV. Vui lòng kiểm tra định dạng.");
  }
}
