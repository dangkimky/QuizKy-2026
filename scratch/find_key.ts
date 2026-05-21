import * as fs from "fs";
import * as path from "path";
import * as mammoth from "mammoth";

async function main() {
  const filePath = path.join(__dirname, "../dl/cnxhkh-300-cau-hoi-on-tap-chu-nghia-xa-hoi-khoa-hoc.docx");
  const logPath = path.join(__dirname, "find_key_result.txt");
  
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(logPath, "Không tìm thấy file!");
    return;
  }

  const buffer = fs.readFileSync(filePath);
  try {
    const { value: html } = await mammoth.convertToHtml({ buffer });
    let output = "";
    
    output += "--- KIỂM TRA BẢNG ĐÁP ÁN Ở CUỐI FILE ---\n\n";
    
    // Tìm các từ khóa đáp án ở cuối file
    const lastPart = html.substring(Math.max(0, html.length - 15000));
    output += "15000 ký tự cuối cùng của tài liệu:\n";
    output += lastPart + "\n\n";
    
    // Tìm các thẻ <table> trong HTML
    const tableMatches = html.match(/<table[^>]*>.*?<\/table>/gi) || [];
    output += `Số lượng bảng <table> tìm thấy trong tài liệu: ${tableMatches.length}\n`;
    tableMatches.forEach((table, idx) => {
      output += `BẢNG ${idx + 1} (Độ dài: ${table.length} ký tự):\n`;
      output += table.substring(0, 1000) + "... [RÚT GỌN]\n\n";
    });

    fs.writeFileSync(logPath, output);
    console.log("Đã tìm kiếm xong, xem log tại:", logPath);
  } catch (error: any) {
    fs.writeFileSync(logPath, "Lỗi: " + error.message);
  }
}

main();
