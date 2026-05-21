import * as fs from "fs";
import * as path from "path";

async function main() {
  const xmlPath = path.join(__dirname, "extracted/word/document.xml");
  const logPath = path.join(__dirname, "xml_red_inspect.txt");
  
  if (!fs.existsSync(xmlPath)) {
    fs.writeFileSync(logPath, "Không tìm thấy file document.xml!");
    return;
  }

  const xml = fs.readFileSync(xmlPath, "utf-8");
  let output = "";
  
  // 1. Tìm kiếm thẻ color đỏ đầu tiên
  const colorTarget = "FF0000";
  const colorIdx = xml.indexOf(`w:val="${colorTarget}"`);
  output += `Vị trí đầu tiên của mã màu đỏ ${colorTarget}: ${colorIdx}\n`;
  if (colorIdx !== -1) {
    const snippet = xml.substring(Math.max(0, colorIdx - 1000), colorIdx + 1500);
    output += "\n--- XML SNIPPET XUNG QUANH MÀU ĐỎ ---\n";
    output += snippet + "\n\n";
  }

  // 2. Tìm kiếm thẻ highlight đầu tiên
  const highlightTarget = "cyan";
  const highlightIdx = xml.indexOf(`w:val="${highlightTarget}"`);
  output += `Vị trí đầu tiên của highlight ${highlightTarget}: ${highlightIdx}\n`;
  if (highlightIdx !== -1) {
    const snippet = xml.substring(Math.max(0, highlightIdx - 1000), highlightIdx + 1500);
    output += "\n--- XML SNIPPET XUNG QUANH HIGHLIGHT CYAN ---\n";
    output += snippet + "\n\n";
  }

  // 3. Tìm kiếm thẻ highlight green đầu tiên
  const highlightGreenTarget = "green";
  const highlightGreenIdx = xml.indexOf(`w:val="${highlightGreenTarget}"`);
  output += `Vị trí đầu tiên của highlight ${highlightGreenTarget}: ${highlightGreenIdx}\n`;
  if (highlightGreenIdx !== -1) {
    const snippet = xml.substring(Math.max(0, highlightGreenIdx - 1000), highlightGreenIdx + 1500);
    output += "\n--- XML SNIPPET XUNG QUANH HIGHLIGHT GREEN ---\n";
    output += snippet + "\n\n";
  }

  fs.writeFileSync(logPath, output);
  console.log("Đã ghi log kiểm tra màu đỏ vào:", logPath);
}

main();
