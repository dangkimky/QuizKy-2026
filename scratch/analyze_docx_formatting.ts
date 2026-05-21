import * as fs from "fs";
import * as path from "path";
import * as mammoth from "mammoth";

async function main() {
  const filePath = path.join(__dirname, "../dl/cnxhkh-300-cau-hoi-on-tap-chu-nghia-xa-hoi-khoa-hoc.docx");
  const logPath = path.join(__dirname, "format_analysis.txt");
  
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(logPath, "Không tìm thấy file!");
    return;
  }

  const buffer = fs.readFileSync(filePath);
  try {
    const { value: html } = await mammoth.convertToHtml({ buffer });
    let output = "";
    
    output += "--- PHÂN TÍCH ĐỊNH DẠNG CỦA CÁC ĐOẠN ĐÁP ÁN TRONG HTML ---\n\n";
    
    // Tìm các thẻ strong/b trong HTML
    const strongMatches = html.match(/<strong[^>]*>.*?<\/strong>/gi) || [];
    output += `Số lượng thẻ <strong> tìm thấy: ${strongMatches.length}\n`;
    output += "Mẫu 20 thẻ <strong> đầu tiên:\n";
    strongMatches.slice(0, 40).forEach((m, i) => {
      output += `  ${i + 1}: ${m}\n`;
    });

    const emMatches = html.match(/<em[^>]*>.*?<\/em>/gi) || [];
    output += `\nSố lượng thẻ <em> tìm thấy: ${emMatches.length}\n`;
    output += "Mẫu 20 thẻ <em> đầu tiên:\n";
    emMatches.slice(0, 20).forEach((m, i) => {
      output += `  ${i + 1}: ${m}\n`;
    });

    // In thử HTML của 5 câu hỏi đầu tiên đầy đủ cả <p> và <ol>
    output += "\n--- CHI TIẾT 5 CÂU HỎI ĐẦU TIÊN TRONG HTML THÔ ---\n";
    // Tách bằng thẻ <p>
    const pParts = html.split(/<p>/gi);
    let count = 0;
    for (let i = 0; i < pParts.length; i++) {
      const part = pParts[i];
      if (part.toLowerCase().includes("câu") && count < 5) {
        count++;
        output += `\n[ĐOẠN ${count}]:\n<p>${part.substring(0, 1500)}\n----------------------------------------\n`;
      }
    }

    fs.writeFileSync(logPath, output);
    console.log("Đã ghi phân tích định dạng vào:", logPath);
  } catch (error: any) {
    fs.writeFileSync(logPath, "Lỗi: " + error.message);
  }
}

main();
