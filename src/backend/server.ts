import express from "express";
import cors from "cors";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import { parseTextContent, parseExcel } from "../lib/parser";
import mammoth from "mammoth";

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Multer upload destination config (in memory)
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

console.log("⚡ Khoi tao Express QuizVerse Backend Server...");

// 1. Parse File Route (DOCX, PDF, XLSX, TXT)
app.post("/api/parse", upload.single("file"), async (req: any, res: any) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Không tìm thấy file tải lên" });
    }

    const fileType = file.originalname.split(".").pop()?.toLowerCase();
    const buffer = file.buffer;
    let questions: any[] = [];

    if (fileType === "txt") {
      const text = buffer.toString("utf-8");
      questions = parseTextContent(text);
    } else if (fileType === "xlsx" || fileType === "xls" || fileType === "csv") {
      questions = parseExcel(buffer);
    } else if (fileType === "docx") {
      const { value: html } = await mammoth.convertToHtml({ buffer });
      const parsedHtml = html
        .replace(/<strong>\s*([A-D]\s*[\.\)\-:])\s*(.*?)<\/strong>/gi, "$1 [CORRECT] $2")
        .replace(/<b>\s*([A-D]\s*[\.\)\-:])\s*(.*?)<\/b>/gi, "$1 [CORRECT] $2")
        .replace(/<strong>\s*(.*?)\s*<\/strong>/gi, "[STRONG]$1[/STRONG]");
      
      const cleanText = parsedHtml.replace(/<[^>]*>/g, "\n");
      questions = parseTextContent(cleanText);
    } else if (fileType === "pdf") {
      try {
        const textContent = extractPdfTextSimple(buffer);
        questions = parseTextContent(textContent);
      } catch (pdfErr) {
        return res.status(400).json({ error: "Định dạng PDF quá phức tạp. Vui lòng chuyển sang DOCX hoặc TXT để AI đọc chính xác 100%." });
      }
    } else {
      return res.status(400).json({ error: "Định dạng file không hỗ trợ" });
    }

    if (!questions || questions.length === 0) {
      return res.status(400).json({ error: "Không tìm thấy câu hỏi hợp lệ trong file. Vui lòng kiểm tra lại cấu trúc đề." });
    }

    return res.json({ questions });
  } catch (err: any) {
    console.error("Express parse error:", err);
    return res.status(500).json({ error: err.message || "Lỗi xử lý file." });
  }
});

// Simple PDF text parser utility
function extractPdfTextSimple(buffer: Buffer): string {
  const str = buffer.toString("binary");
  let text = "";
  const regex = /\(([^)]+)\)\s*(Tj|TJ)/g;
  let match;
  while ((match = regex.exec(str)) !== null) {
    const raw = match[1];
    const clean = raw.replace(/\\([0-7]{3})/g, (m, octal) => {
      return String.fromCharCode(parseInt(octal, 8));
    }).replace(/\\r/g, "\n").replace(/\\n/g, "\n").replace(/\\/g, "");
    text += clean + " ";
  }

  if (text.length < 50) {
    const printableLines = str.split("\n")
      .map(line => line.replace(/[^ -~]/g, "").trim())
      .filter(line => line.length > 5 && (line.includes("A.") || line.includes("B.") || line.includes("Câu")));
    text = printableLines.join("\n");
  }

  return text;
}

// 2. Quizzes CRUD Routes
app.get("/api/quizzes", async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    const formatted = quizzes.map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      questions: JSON.parse(q.questionsJson),
      config: JSON.parse(q.configJson || "{}"),
      createdAt: q.createdAt,
    }));
    
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Không thể lấy danh sách đề" });
  }
});

app.post("/api/quizzes", async (req, res) => {
  try {
    const { id, title, description, questions, config } = req.body;
    if (!title || !questions) {
      return res.status(400).json({ error: "Dữ liệu đề không hợp lệ" });
    }

    const quiz = await prisma.quiz.upsert({
      where: { id: id || crypto.randomUUID() },
      update: {
        title,
        description,
        questionsJson: JSON.stringify(questions),
        configJson: JSON.stringify(config || {}),
      },
      create: {
        id: id || crypto.randomUUID(),
        title,
        description,
        questionsJson: JSON.stringify(questions),
        configJson: JSON.stringify(config || {}),
      },
    });

    res.json({ success: true, quiz });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Lỗi lưu đề" });
  }
});

app.delete("/api/quizzes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.quiz.delete({ where: { id } });
    res.json({ success: true, message: "Đã xóa đề thành công" });
  } catch (err) {
    res.status(500).json({ error: "Không thể xóa đề" });
  }
});

// 3. Player Stats Routes
app.get("/api/player", async (req, res) => {
  try {
    let player = await prisma.player.findUnique({ where: { id: "default-player" } });
    if (!player) {
      player = await prisma.player.create({
        data: {
          id: "default-player",
          name: "QuizMaster",
          level: 1,
          exp: 0,
          activePet: "none",
          activeTheme: "cyberpunk",
        },
      });
    }
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: "Không thể lấy thông tin người chơi" });
  }
});

app.post("/api/player", async (req, res) => {
  try {
    const { name, level, exp, activePet, activeTheme } = req.body;
    const player = await prisma.player.upsert({
      where: { id: "default-player" },
      update: {
        name,
        level: level ? parseInt(level, 10) : undefined,
        exp: exp ? parseInt(exp, 10) : undefined,
        activePet,
        activeTheme,
      },
      create: {
        id: "default-player",
        name: name || "QuizMaster",
        level: level ? parseInt(level, 10) : 1,
        exp: exp ? parseInt(exp, 10) : 0,
        activePet: activePet || "none",
        activeTheme: activeTheme || "cyberpunk",
      },
    });
    res.json({ success: true, player });
  } catch (err) {
    res.status(500).json({ error: "Không thể lưu thông tin người chơi" });
  }
});

// 4. Game Play History Routes
app.get("/api/history", async (req, res) => {
  try {
    const history = await prisma.historyRecord.findMany({ orderBy: { playedAt: "desc" } });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Không thể lấy lịch sử đấu" });
  }
});

app.post("/api/history", async (req, res) => {
  try {
    const { quizId, quizTitle, score, correctCount, totalQuestions, mode, expGained } = req.body;
    const record = await prisma.historyRecord.create({
      data: {
        quizId,
        quizTitle,
        score: parseFloat(score),
        correctCount: parseInt(correctCount, 10),
        totalQuestions: parseInt(totalQuestions, 10),
        mode,
        expGained: parseInt(expGained, 10),
      },
    });
    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ error: "Không thể lưu lịch sử đấu" });
  }
});

// Run Express app
app.listen(port, () => {
  console.log(`🚀 Express QuizVerse server dang chay tren port http://localhost:${port}`);
});
