import { PrismaClient } from "../node_modules/@prisma/client-sqlite";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:../prisma/dev.db"
    }
  }
});

async function main() {
  console.log("Bắt đầu đọc dữ liệu từ SQLite...");
  
  const backupData: any = {
    quizzes: [],
    players: [],
    pets: [],
    achievements: [],
    history: []
  };

  // 1. Quizzes
  try {
    const quizzes = await prisma.quiz.findMany();
    console.log(`Đã đọc ${quizzes.length} đề trắc nghiệm (Quiz).`);
    backupData.quizzes = quizzes;
  } catch (error) {
    console.warn("⚠️ Bảng Quiz không tồn tại hoặc lỗi khi đọc:", error instanceof Error ? error.message : error);
  }

  // 2. Players
  try {
    const players = await prisma.player.findMany();
    console.log(`Đã đọc ${players.length} người chơi (Player).`);
    backupData.players = players;
  } catch (error) {
    console.warn("⚠️ Bảng Player không tồn tại hoặc lỗi khi đọc:", error instanceof Error ? error.message : error);
  }

  // 3. Pets
  try {
    const pets = await prisma.pet.findMany();
    console.log(`Đã đọc ${pets.length} thú cưng (Pet).`);
    backupData.pets = pets;
  } catch (error) {
    console.warn("⚠️ Bảng Pet không tồn tại hoặc lỗi khi đọc:", error instanceof Error ? error.message : error);
  }

  // 4. Achievements
  try {
    const achievements = await prisma.achievement.findMany();
    console.log(`Đã đọc ${achievements.length} thành tựu (Achievement).`);
    backupData.achievements = achievements;
  } catch (error) {
    console.warn("⚠️ Bảng Achievement không tồn tại hoặc lỗi khi đọc:", error instanceof Error ? error.message : error);
  }

  // 5. History
  try {
    const history = await prisma.historyRecord.findMany();
    console.log(`Đã đọc ${history.length} lịch sử chơi (HistoryRecord).`);
    backupData.history = history;
  } catch (error) {
    console.warn("⚠️ Bảng HistoryRecord không tồn tại hoặc lỗi khi đọc:", error instanceof Error ? error.message : error);
  }

  try {
    const backupDir = __dirname;
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupPath = path.join(backupDir, "db_backup.json");
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), "utf-8");
    
    console.log(`\n=========================================`);
    console.log(`SAO LƯU THÀNH CÔNG!`);
    console.log(`Đề trắc nghiệm đã lưu: ${backupData.quizzes.length}`);
    console.log(`Người chơi đã lưu: ${backupData.players.length}`);
    console.log(`Thú cưng đã lưu: ${backupData.pets.length}`);
    console.log(`Thành tựu đã lưu: ${backupData.achievements.length}`);
    console.log(`Lịch sử đã lưu: ${backupData.history.length}`);
    console.log(`Tệp sao lưu được lưu trữ tại: ${backupPath}`);
    console.log(`=========================================`);
  } catch (error) {
    console.error("Lỗi trong quá trình lưu file backup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
