import * as fs from "fs";
import * as path from "path";

// Đơn giản hóa việc đọc và phân tích cấu trúc XML
// Chúng ta sẽ parse XML theo kiểu duyệt các thẻ w:p (paragraph)
async function main() {
  const xmlPath = path.join(__dirname, "extracted/word/document.xml");
  const logPath = path.join(__dirname, "verify_highlight_result.txt");
  
  if (!fs.existsSync(xmlPath)) {
    fs.writeFileSync(logPath, "Không tìm thấy file document.xml!");
    return;
  }

  const xml = fs.readFileSync(xmlPath, "utf-8");
  let output = "";
  
  output += "--- KIỂM TRA HỆ THỐNG HIGHLIGHT XÁC ĐỊNH ĐÁP ÁN ĐÚNG ---\n\n";

  // Biểu thức chính quy tìm các đoạn văn <w:p>...</w:p>
  const pRegex = /<w:pPr>.*?<\/w:pPr>(.*?)<\/w:p>/gi;
  let pMatch;
  
  // Dùng regex tìm nội dung chữ và highlight trong mỗi w:p
  // w:r chứa run, w:t chứa text
  let paragraphs: { text: string; hasHighlight: boolean; highlightVal: string }[] = [];
  
  const matches = xml.match(/<w:p\b[^>]*>.*?<\/w:p>/gi) || [];
  output += `Tổng số đoạn văn <w:p> tìm thấy: ${matches.length}\n\n`;

  let printedCount = 0;
  for (let i = 0; i < matches.length; i++) {
    const pXml = matches[i];
    
    // Ghép text trong w:p
    let pText = "";
    let hasHighlight = false;
    let highlightVal = "";
    
    const rMatches = pXml.match(/<w:r\b[^>]*>.*?<\/w:r>/gi) || [];
    for (const rXml of rMatches) {
      // Lấy text
      const tMatch = rXml.match(/<w:t\b[^>]*>(.*?)<\/w:t>/i);
      const text = tMatch ? tMatch[1] : "";
      
      // Kiểm tra highlight
      const hMatch = rXml.match(/<w:highlight\s+w:val=\"([^\"]+)\"/i);
      if (hMatch) {
        hasHighlight = true;
        highlightVal = hMatch[1];
      }
      pText += text;
    }
    
    pText = pText.trim();
    if (pText.length > 0) {
      paragraphs.push({ text: pText, hasHighlight, highlightVal });
    }
  }

  // In thử 100 đoạn văn đầu tiên để xem sự phân bố của câu hỏi và đáp án highlight
  output += "Duyệt qua 150 đoạn văn đầu tiên chứa nội dung:\n";
  let count = 0;
  for (const p of paragraphs) {
    if (p.text.toLowerCase().includes("câu") || p.hasHighlight || count < 100) {
      count++;
      if (count > 150) break;
      const hlMarker = p.hasHighlight ? ` [HIGHLIGHT: ${p.highlightVal}]` : "";
      output += `[P ${count}]: ${p.text}${hlMarker}\n`;
    }
  }

  fs.writeFileSync(logPath, output);
  console.log("Đã kiểm tra highlight, xem kết quả tại:", logPath);
}

main();
