import * as fs from "fs";
import * as path from "path";
import * as mammoth from "mammoth";

async function main() {
  const filePath = path.join(__dirname, "../dl/cnxhkh-300-cau-hoi-on-tap-chu-nghia-xa-hoi-khoa-hoc.docx");
  const logPath = path.join(__dirname, "inspect_options_result.txt");
  
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(logPath, "Không tìm thấy file!");
    return;
  }

  const buffer = fs.readFileSync(filePath);
  try {
    const { value: html } = await mammoth.convertToHtml({ buffer });
    let output = "";
    
    output += "--- CHI TIẾT HTML 10 CÂU HỎI ĐẦU TIÊN ---\n\n";
    
    // Tách các câu hỏi bằng thẻ <p> hoặc <ol>
    // Một câu trắc nghiệm điển hình gồm có:
    // <p>Câu 1: ...</p><ol><li>A</li><li>B</li><li>C</li><li>D</li></ol>
    // Hãy tìm các cặp <p> và <ol>
    const regex = /<p>(Câu\s*\d+.*?)<\/p>\s*<ol>(.*?)<\/ol>/gi;
    let match;
    let count = 0;
    while ((match = regex.exec(html)) !== null && count < 15) {
      count++;
      output += `CÂU ${count}:\n`;
      output += `  [QUESTION HTML]: <p>${match[1]}</p>\n`;
      output += `  [OPTIONS HTML]:\n`;
      
      const liMatches = match[2].match(/<li>.*?<\/li>/gi) || [];
      liMatches.forEach((li, idx) => {
        output += `    Option ${idx + 1} (${String.fromCharCode(65 + idx)}): ${li}\n`;
      });
      output += `----------------------------------------\n\n`;
    }

    // Nếu regex trên không khớp (ví dụ không có <ol> ngay sau <p>), hãy thử in một đoạn HTML liên tục chứa 5 câu đầu
    if (count === 0) {
      output += "\n--- KHÔNG KHỚP REGEX MẪU. IN 5000 KÝ TỰ ĐẦU TIÊN TRONG MỤC BÀI TẬP CỦA HỆ THỐNG ---\n";
      const startIdx = html.indexOf("Câu 1");
      if (startIdx !== -1) {
        output += html.substring(startIdx, startIdx + 8000);
      } else {
        output += html.substring(0, 8000);
      }
    }
    
    fs.writeFileSync(logPath, output);
    console.log("Đã ghi kết quả vào:", logPath);
  } catch (error: any) {
    fs.writeFileSync(logPath, "Lỗi: " + error.message);
  }
}

main();
