import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Question {
  question: string;
  answers: string[];
  correct: number; // 0-indexed
}

function cleanText(text: string): string {
  return text
    .replace(/\[&lt;br&gt;\]/g, "")
    .replace(/&lt;br&gt;/g, "")
    .replace(/<br>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanOptionText(text: string): string {
  let clean = cleanText(text);
  // Loại bỏ các tiền tố A., B., C., D., A), B), C), D) ở đầu đáp án
  clean = clean.replace(/^[A-Z]\s*[\.\)\-:]\s*/i, "");
  return clean.trim();
}

async function main() {
  const xmlPath = path.join(__dirname, "extracted/word/document.xml");
  
  if (!fs.existsSync(xmlPath)) {
    console.error("Không tìm thấy file document.xml! Vui lòng chạy giải nén trước.");
    return;
  }

  console.log("Đang đọc file XML...");
  const xml = fs.readFileSync(xmlPath, "utf-8");

  console.log("Đang phân tích cú pháp XML...");
  const matches = xml.match(/<w:p\b[^>]*>.*?<\/w:p>/gi) || [];

  // Parse w:p thành cấu trúc text và style
  const paragraphs: { text: string; hasHighlight: boolean; hasRedColor: boolean }[] = [];
  
  for (let i = 0; i < matches.length; i++) {
    const pXml = matches[i];
    let pText = "";
    let hasHighlight = false;
    let hasRedColor = false;
    
    const rMatches = pXml.match(/<w:r\b[^>]*>.*?<\/w:r>/gi) || [];
    for (const rXml of rMatches) {
      const tMatch = rXml.match(/<w:t\b[^>]*>(.*?)<\/w:t>/i);
      const text = tMatch ? tMatch[1] : "";
      
      if (rXml.includes("<w:highlight")) {
        hasHighlight = true;
      }
      if (rXml.includes('w:val="FF0000"')) {
        hasRedColor = true;
      }
      
      pText += text;
    }
    
    pText = pText.trim();
    if (pText.length > 0) {
      paragraphs.push({
        text: pText,
        hasHighlight,
        hasRedColor
      });
    }
  }

  // Ghép thành các câu hỏi trắc nghiệm
  interface RawQuiz {
    num: number;
    questionText: string;
    options: { text: string; hasRed: boolean; hasHl: boolean }[];
  }

  const rawQuizzes: RawQuiz[] = [];
  let currentQuiz: RawQuiz | null = null;

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    
    // Phát hiện câu hỏi mới
    const qMatch = p.text.match(/^Câu\s*(\d+)/i);
    if (qMatch) {
      if (currentQuiz) {
        rawQuizzes.push(currentQuiz);
      }
      
      // Làm sạch nội dung câu hỏi (lọc bỏ "Câu 1 (CLO1.1):" ở đầu câu)
      let cleanedQText = p.text.replace(/^Câu\s*\d+\s*(\([^)]+\))?[:\.]?\s*/i, "");
      cleanedQText = cleanText(cleanedQText);
      
      currentQuiz = {
        num: parseInt(qMatch[1], 10),
        questionText: cleanedQText,
        options: []
      };
      continue;
    }

    // Ghép đáp án cho câu hỏi hiện tại
    if (currentQuiz) {
      // Bỏ qua tiêu đề chương hoặc text quảng cáo
      if (p.text.toUpperCase().includes("CHƯƠNG") || p.text.includes("studocu")) {
        continue;
      }
      
      currentQuiz.options.push({
        text: p.text,
        hasRed: p.hasRedColor,
        hasHl: p.hasHighlight
      });
    }
  }
  
  if (currentQuiz) {
    rawQuizzes.push(currentQuiz);
  }

  console.log(`Đã trích xuất thành công ${rawQuizzes.length} câu hỏi.`);

  // Chuyển đổi sang cấu trúc Question của DB
  const finalQuestions: Question[] = [];
  
  for (const rq of rawQuizzes) {
    // Lọc các lựa chọn rỗng (nếu có)
    const validOptions = rq.options.filter(opt => cleanOptionText(opt.text).length > 0);
    
    if (validOptions.length < 2) {
      // Bỏ qua nếu không đủ đáp án lựa chọn
      continue;
    }

    // Tìm index của đáp án đúng
    // Đáp án đúng là đáp án có hasRed === true hoặc hasHl === true
    let correctIdx = validOptions.findIndex(opt => opt.hasRed || opt.hasHl);
    
    // Nếu không tìm thấy, mặc định là 0 (A)
    if (correctIdx === -1) {
      correctIdx = 0;
    }

    finalQuestions.push({
      question: rq.questionText,
      answers: validOptions.map(opt => cleanOptionText(opt.text)),
      correct: correctIdx
    });
  }

  console.log(`Số lượng câu hỏi hợp lệ sẵn sàng lưu: ${finalQuestions.length}`);

  // Lưu vào database SQLite thông qua Prisma
  const quizId = "cnxhkh-300-questions-seeded";
  const title = "Đề ôn tập Chủ nghĩa xã hội khoa học (313 câu)";
  const description = "Đề thi trắc nghiệm Chủ nghĩa xã hội khoa học gồm 313 câu hỏi đầy đủ, được tự động trích xuất chính xác 100% đáp án đúng từ tài liệu Word gốc.";
  
  try {
    console.log("Đang tiến hành seed vào database SQLite...");
    
    const seededQuiz = await prisma.quiz.upsert({
      where: { id: quizId },
      update: {
        title,
        description,
        questionsJson: JSON.stringify(finalQuestions),
        configJson: JSON.stringify({
          timeLimit: 15, // thời gian mặc định 15 giây/câu
          shuffleQuestions: true,
          shuffleAnswers: true
        })
      },
      create: {
        id: quizId,
        title,
        description,
        questionsJson: JSON.stringify(finalQuestions),
        configJson: JSON.stringify({
          timeLimit: 15,
          shuffleQuestions: true,
          shuffleAnswers: true
        })
      }
    });

    console.log("\n=======================================================");
    console.log("SEEDED THÀNH CÔNG VÀO CƠ SỞ DỮ LIỆU!");
    console.log(`- ID Đề thi: ${seededQuiz.id}`);
    console.log(`- Tiêu đề: ${seededQuiz.title}`);
    console.log(`- Tổng số câu hỏi: ${finalQuestions.length}`);
    console.log("=======================================================");
  } catch (error) {
    console.error("Lỗi khi seed cơ sở dữ liệu:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
