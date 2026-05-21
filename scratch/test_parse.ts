import * as fs from "fs";
import * as path from "path";
import { parseDocx } from "../src/lib/parser";

async function main() {
  const filePath = path.join(__dirname, "../dl/cnxhkh-300-cau-hoi-on-tap-chu-nghia-xa-hoi-khoa-hoc.docx");
  const logPath = path.join(__dirname, "test_parse_result.txt");
  
  let output = "";
  output += `Đang đọc file: ${filePath}\n`;
  
  if (!fs.existsSync(filePath)) {
    output += "Không tìm thấy file!\n";
    fs.writeFileSync(logPath, output);
    return;
  }

  const buffer = fs.readFileSync(filePath);
  try {
    const questions = await parseDocx(buffer);
    output += "Đã parse thành công!\n";
    output += `Tổng số câu hỏi tìm thấy: ${questions.length}\n`;
    
    output += "\n--- IN THỬ 10 CÂU HỎI ĐẦU TIÊN ---\n";
    for (let i = 0; i < Math.min(10, questions.length); i++) {
      output += `\nCâu ${i + 1}: ${questions[i].question}\n`;
      questions[i].answers.forEach((ans, idx) => {
        const marker = idx === questions[i].correct ? " [ĐÚNG]" : "";
        output += `  ${String.fromCharCode(65 + idx)}. ${ans}${marker}\n`;
      });
    }

    output += "\n--- IN THỬ 10 CÂU HỎI CUỐI CÙNG ---\n";
    for (let i = Math.max(0, questions.length - 10); i < questions.length; i++) {
      output += `\nCâu ${i + 1}: ${questions[i].question}\n`;
      questions[i].answers.forEach((ans, idx) => {
        const marker = idx === questions[i].correct ? " [ĐÚNG]" : "";
        output += `  ${String.fromCharCode(65 + idx)}. ${ans}${marker}\n`;
      });
    }
  } catch (error: any) {
    output += `Lỗi khi parse file: ${error.message}\n`;
  }
  
  fs.writeFileSync(logPath, output);
  console.log("Đã ghi log thành công vào:", logPath);
}

main();
