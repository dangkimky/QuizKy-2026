import * as fs from "fs";
import * as path from "path";

async function main() {
  const xmlPath = path.join(__dirname, "extracted/word/document.xml");
  const logPath = path.join(__dirname, "xml_analysis.txt");
  
  if (!fs.existsSync(xmlPath)) {
    fs.writeFileSync(logPath, "Không tìm thấy file document.xml!");
    return;
  }

  // Đọc file XML (vì dung lượng lớn, ta chỉ cần phân tích khoảng 200,000 ký tự đầu để tìm mẫu)
  const xml = fs.readFileSync(xmlPath, "utf-8");
  let output = "";
  output += `Độ dài toàn bộ XML: ${xml.length} ký tự\n\n`;
  
  output += "--- PHÂN TÍCH CÁC THẺ MÀU SẮC / ĐỊNH DẠNG ĐẶC BIỆT TRONG XML ---\n";
  
  // Tìm các kiểu định dạng phổ biến trong XML của Word
  // 1. Thẻ màu sắc: <w:color w:val="XXXXXX"/>
  const colors = Array.from(xml.matchAll(/<w:color\s+w:val=\"([^\"]+)\"/g)).map(m => m[1]);
  const uniqueColors = Array.from(new Set(colors));
  output += `Các mã màu được sử dụng trong file: ${JSON.stringify(uniqueColors)}\n`;
  
  // Thống kê tần suất màu
  const colorCounts: Record<string, number> = {};
  colors.forEach(c => { colorCounts[c] = (colorCounts[c] || 0) + 1; });
  output += `Tần suất mã màu: ${JSON.stringify(colorCounts)}\n\n`;

  // 2. Thẻ gạch chân: <w:u w:val="..."/>
  const underlines = xml.match(/<w:u[^>]*>/g) || [];
  output += `Số lượng thẻ gạch chân <w:u> tìm thấy: ${underlines.length}\n`;
  
  // 3. Thẻ highlight: <w:highlight w:val="..."/>
  const highlights = Array.from(xml.matchAll(/<w:highlight\s+w:val=\"([^\"]+)\"/g)).map(m => m[1]);
  output += `Các màu highlight được sử dụng: ${JSON.stringify(Array.from(new Set(highlights)))}\n`;
  output += `Số lượng highlight: ${highlights.length}\n\n`;

  // 4. In ra một đoạn XML chứa câu 1 và câu 2 để quan sát cấu trúc thẻ w:p, w:r, w:t
  output += "--- IN ĐOẠN XML CHỨA CÂU 24 VÀ CÁC ĐÁP ÁN ĐỂ XEM ĐỊNH DẠNG ---\n";
  // Tìm vị trí của "Câu 24"
  const targetText = "Phạm trù nào được coi là cơ bản nhất";
  const startIdx = xml.indexOf(targetText);
  if (startIdx !== -1) {
    // Trích xuất khoảng 15000 ký tự xung quanh vị trí này
    const snippet = xml.substring(Math.max(0, startIdx - 1000), startIdx + 15000);
    output += snippet;
  } else {
    output += "Không tìm thấy nội dung mẫu trong XML!\n";
  }

  fs.writeFileSync(logPath, output);
  console.log("Đã ghi phân tích XML vào:", logPath);
}

main();
