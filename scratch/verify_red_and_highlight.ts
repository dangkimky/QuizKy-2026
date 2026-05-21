import * as fs from "fs";
import * as path from "path";

async function main() {
  const xmlPath = path.join(__dirname, "extracted/word/document.xml");
  const logPath = path.join(__dirname, "color_scan_result.txt");
  
  if (!fs.existsSync(xmlPath)) {
    fs.writeFileSync(logPath, "Không tìm thấy file document.xml!");
    return;
  }

  const xml = fs.readFileSync(xmlPath, "utf-8");
  let output = "";
  
  output += "--- QUÉT TOÀN BỘ FILE XML ĐỂ KIỂM TRA ĐÁP ÁN ĐÚNG ---\n\n";

  // Lấy danh sách w:p
  const matches = xml.match(/<w:p\b[^>]*>.*?<\/w:p>/gi) || [];
  output += `Tổng số thẻ w:p: ${matches.length}\n`;

  // Parse toàn bộ w:p thành cấu trúc Paragraphs
  const paragraphs: { text: string; hasHighlight: boolean; hasRedColor: boolean; rawXml: string }[] = [];
  
  for (let i = 0; i < matches.length; i++) {
    const pXml = matches[i];
    let pText = "";
    let hasHighlight = false;
    let hasRedColor = false;
    
    const rMatches = pXml.match(/<w:r\b[^>]*>.*?<\/w:r>/gi) || [];
    for (const rXml of rMatches) {
      const tMatch = rXml.match(/<w:t\b[^>]*>(.*?)<\/w:t>/i);
      const text = tMatch ? tMatch[1] : "";
      
      // Check highlight (cyan hoặc green)
      if (rXml.includes("<w:highlight")) {
        hasHighlight = true;
      }
      
      // Check red color (FF0000)
      // Chú ý: w:color w:val="FF0000"
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
        hasRedColor,
        rawXml: pXml
      });
    }
  }

  output += `Tổng số đoạn văn có chữ: ${paragraphs.length}\n\n`;

  // Nhóm các đoạn văn thành các câu trắc nghiệm
  // Mỗi câu hỏi bắt đầu bằng "Câu <số>"
  interface QuizQuestion {
    num: number;
    questionText: string;
    options: { text: string; isCorrect: boolean; hasRed: boolean; hasHl: boolean }[];
  }
  
  const quizzes: QuizQuestion[] = [];
  let currentQuiz: QuizQuestion | null = null;

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    
    // Phát hiện câu hỏi mới
    const qMatch = p.text.match(/^Câu\s*(\d+)/i);
    if (qMatch) {
      if (currentQuiz) {
        quizzes.push(currentQuiz);
      }
      currentQuiz = {
        num: parseInt(qMatch[1], 10),
        questionText: p.text,
        options: []
      };
      continue;
    }

    // Nếu không phải câu hỏi, xem có phải là lựa chọn hoặc nội dung khác
    if (currentQuiz) {
      // Đề bài trắc nghiệm thường có 4 lựa chọn liền kề sau câu hỏi
      // Kiểm tra xem có phải là text quảng cáo hay tiêu đề chương không
      if (p.text.toUpperCase().includes("CHƯƠNG") || p.text.includes("studocu")) {
        // Bỏ qua tiêu đề chương hoặc text quảng cáo
        continue;
      }
      
      // Nếu là lựa chọn
      // Một đáp án được coi là đúng nếu:
      // - Nếu ở các câu nhỏ (< 68): check hasRedColor
      // - Nếu ở các câu lớn (>= 68): check hasHighlight
      // Để tổng quát, ta ghi nhận cả hai
      currentQuiz.options.push({
        text: p.text,
        isCorrect: false, // sẽ gán sau
        hasRed: p.hasRedColor,
        hasHl: p.hasHighlight
      });
    }
  }
  
  if (currentQuiz) {
    quizzes.push(currentQuiz);
  }

  output += `Tổng số câu hỏi trắc nghiệm ghép được: ${quizzes.length}\n\n`;

  // Thống kê phân tích đáp án đúng
  output += "--- CHI TIẾT 10 CÂU HỎI ĐẦU TIÊN ---\n";
  for (let i = 0; i < Math.min(10, quizzes.length); i++) {
    const q = quizzes[i];
    output += `\nCâu ${q.num}: ${q.questionText}\n`;
    q.options.forEach((opt, idx) => {
      const redMarker = opt.hasRed ? " [RED]" : "";
      const hlMarker = opt.hasHl ? " [HIGHLIGHT]" : "";
      output += `  ${String.fromCharCode(65 + idx)}. ${opt.text}${redMarker}${hlMarker}\n`;
    });
  }

  output += "\n--- CHI TIẾT 10 CÂU HỎI TỪ CÂU 68 ---\n";
  const start68Idx = quizzes.findIndex(q => q.num === 68);
  if (start68Idx !== -1) {
    for (let i = start68Idx; i < Math.min(start68Idx + 10, quizzes.length); i++) {
      const q = quizzes[i];
      output += `\nCâu ${q.num}: ${q.questionText}\n`;
      q.options.forEach((opt, idx) => {
        const redMarker = opt.hasRed ? " [RED]" : "";
        const hlMarker = opt.hasHl ? " [HIGHLIGHT]" : "";
        output += `  ${String.fromCharCode(65 + idx)}. ${opt.text}${redMarker}${hlMarker}\n`;
      });
    }
  }

  // Thống kê số lượng câu hỏi có đáp án được đánh dấu
  let countRed = 0;
  let countHl = 0;
  let countNone = 0;
  quizzes.forEach(q => {
    const hasRed = q.options.some(o => o.hasRed);
    const hasHl = q.options.some(o => o.hasHl);
    if (hasRed) countRed++;
    else if (hasHl) countHl++;
    else countNone++;
  });
  
  output += `\n--- THỐNG KÊ TOÀN BỘ ---\n`;
  output += `- Số câu hỏi có đáp án bôi đỏ: ${countRed}\n`;
  output += `- Số câu hỏi có đáp án highlight: ${countHl}\n`;
  output += `- Số câu hỏi không có đánh dấu nào: ${countNone}\n`;

  fs.writeFileSync(logPath, output);
  console.log("Đã quét xong màu sắc, xem log tại:", logPath);
}

main();
