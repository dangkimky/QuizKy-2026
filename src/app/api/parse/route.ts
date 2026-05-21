import { NextRequest, NextResponse } from "next/server";
import { parseTextContent, parseExcel } from "@/lib/parser";
import * as mammoth from "mammoth";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Không tìm thấy file tải lên" }, { status: 400 });
    }

    const fileType = file.name.split(".").pop()?.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
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
      // PDF Parsing fallback:
      // Since parsing binary PDF relies on pdfjs worker, we can parse standard PDF text in Node
      // using standard string search or simple text extraction, or if complex we offer a highly tolerant mock
      // that reads printable characters to capture quiz questions.
      // Let's implement a direct text-stream extractor for PDF which doesn't crash on node environment!
      try {
        const textContent = extractPdfTextSimple(buffer);
        questions = parseTextContent(textContent);
      } catch (pdfErr) {
        // Fallback sample questions if PDF fails completely
        return NextResponse.json({ error: "Định dạng PDF quá phức tạp. Vui lòng chuyển sang DOCX hoặc TXT để AI đọc chính xác 100%." }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Định dạng file không hỗ trợ" }, { status: 400 });
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy câu hỏi hợp lệ trong file. Vui lòng kiểm tra lại định dạng." }, { status: 400 });
    }

    return NextResponse.json({ questions });
  } catch (err: any) {
    console.error("API Parser error:", err);
    return NextResponse.json({ error: err.message || "Lỗi xử lý file." }, { status: 500 });
  }
}

/**
 * Simple binary PDF text extractor to avoid pdfjs-dist dependency issues in node env
 */
function extractPdfTextSimple(buffer: Buffer): string {
  const str = buffer.toString("binary");
  let text = "";
  
  // Find PDF text block commands: BT (Begin Text) to ET (End Text)
  // or strings inside parentheses ( ... ) Tj or [ ... ] TJ
  const regex = /\(([^)]+)\)\s*(Tj|TJ)/g;
  let match;
  while ((match = regex.exec(str)) !== null) {
    const raw = match[1];
    // Filter printable characters and common vietnamese decodes
    const clean = raw.replace(/\\([0-7]{3})/g, (m, octal) => {
      return String.fromCharCode(parseInt(octal, 8));
    }).replace(/\\r/g, "\n").replace(/\\n/g, "\n").replace(/\\/g, "");
    text += clean + " ";
  }

  // If simple extractor fails to find BT/ET blocks, fall back to regex printable lines
  if (text.length < 50) {
    const printableLines = str.split("\n")
      .map(line => line.replace(/[^ -~]/g, "").trim())
      .filter(line => line.length > 5 && (line.includes("A.") || line.includes("B.") || line.includes("Câu")));
    text = printableLines.join("\n");
  }

  return text;
}
