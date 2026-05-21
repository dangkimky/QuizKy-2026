import * as fs from "fs";
import * as path from "path";
import * as mammoth from "mammoth";

async function main() {
  const filePath = path.join(__dirname, "../dl/cnxhkh-300-cau-hoi-on-tap-chu-nghia-xa-hoi-khoa-hoc.docx");
  const logPath = path.join(__dirname, "inspect_result.txt");
  
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(logPath, "Không tìm thấy file!");
    return;
  }

  const buffer = fs.readFileSync(filePath);
  try {
    const { value: html } = await mammoth.convertToHtml({ buffer });
    let output = "";
    output += `Đã chuyển đổi sang HTML thành công. Độ dài chuỗi HTML: ${html.length}\n`;
    output += "\n--- 4000 KÝ TỰ ĐẦU TIÊN CỦA HTML THÔ ---\n";
    output += html.substring(0, 4000) + "\n";
    
    output += "\n--- 4000 KÝ TỰ CUỐI CÙNG CỦA HTML THÔ ---\n";
    output += html.substring(Math.max(0, html.length - 4000)) + "\n";
    
    fs.writeFileSync(logPath, output);
    console.log("Đã ghi log thành công vào:", logPath);
  } catch (error: any) {
    fs.writeFileSync(logPath, "Lỗi: " + error.message);
  }
}

main();
