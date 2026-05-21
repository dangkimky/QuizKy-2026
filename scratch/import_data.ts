import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

// Initialize the main Prisma Client configured for PostgreSQL
const prisma = new PrismaClient();

async function main() {
  console.log("====================================================");
  console.log("🚀 BẮT ĐẦU IMPORT DỮ LIỆU SAO LƯU VÀO POSTGRESQL CLOUD...");
  console.log("====================================================");

  const backupPath = path.join(__dirname, "db_backup.json");

  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Không tìm thấy tệp sao lưu tại: ${backupPath}`);
    console.error("Vui lòng đảm bảo rằng bạn đã chạy script export dữ liệu trước đó.");
    return;
  }

  try {
    const rawData = fs.readFileSync(backupPath, "utf-8");
    const backupData = JSON.parse(rawData);

    console.log(`📂 Đọc thành công file backup:`);
    console.log(`- Đề trắc nghiệm sẵn sàng: ${backupData.quizzes?.length || 0}`);
    console.log(`- Thông tin người chơi sẵn sàng: ${backupData.players?.length || 0}`);
    console.log(`- Thú cưng sẵn sàng: ${backupData.pets?.length || 0}`);
    console.log(`- Thành tựu sẵn sàng: ${backupData.achievements?.length || 0}`);

    // 1. Import Quizzes
    if (backupData.quizzes && backupData.quizzes.length > 0) {
      console.log("\n📝 Đang import các Đề trắc nghiệm...");
      let quizCount = 0;
      for (const quiz of backupData.quizzes) {
        await prisma.quiz.upsert({
          where: { id: quiz.id },
          update: {
            title: quiz.title,
            description: quiz.description,
            questionsJson: quiz.questionsJson,
            configJson: quiz.configJson,
            createdAt: new Date(quiz.createdAt),
          },
          create: {
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            questionsJson: quiz.questionsJson,
            configJson: quiz.configJson,
            createdAt: new Date(quiz.createdAt),
          },
        });
        quizCount++;
      }
      console.log(`✅ Đã import thành công ${quizCount} đề trắc nghiệm!`);
    }

    // 2. Import Players
    if (backupData.players && backupData.players.length > 0) {
      console.log("\n🎮 Đang import thông tin người chơi...");
      let playerCount = 0;
      for (const player of backupData.players) {
        // Fallback for statsJson in case it was missing in SQLite schema
        await prisma.player.upsert({
          where: { id: player.id },
          update: {
            name: player.name,
            level: player.level,
            exp: player.exp,
            activePet: player.activePet,
            activeTheme: player.activeTheme,
            statsJson: player.statsJson || null,
          },
          create: {
            id: player.id,
            name: player.name,
            level: player.level,
            exp: player.exp,
            activePet: player.activePet,
            activeTheme: player.activeTheme,
            statsJson: player.statsJson || null,
          },
        });
        playerCount++;
      }
      console.log(`✅ Đã import thành công ${playerCount} hồ sơ người chơi!`);
    }

    // 3. Import Pets
    if (backupData.pets && backupData.pets.length > 0) {
      console.log("\n🐾 Đang import danh sách thú cưng...");
      let petCount = 0;
      for (const pet of backupData.pets) {
        await prisma.pet.upsert({
          where: { id: pet.id },
          update: {
            name: pet.name,
            description: pet.description,
            buffType: pet.buffType,
            buffMultiplier: pet.buffMultiplier,
            sprite: pet.sprite,
            unlocked: pet.unlocked,
          },
          create: {
            id: pet.id,
            name: pet.name,
            description: pet.description,
            buffType: pet.buffType,
            buffMultiplier: pet.buffMultiplier,
            sprite: pet.sprite,
            unlocked: pet.unlocked,
          },
        });
        petCount++;
      }
      console.log(`✅ Đã import thành công ${petCount} thú cưng!`);
    }

    // 4. Import Achievements
    if (backupData.achievements && backupData.achievements.length > 0) {
      console.log("\n🏆 Đang import các thành tựu...");
      let achievementCount = 0;
      for (const ach of backupData.achievements) {
        await prisma.achievement.upsert({
          where: { id: ach.id },
          update: {
            title: ach.title,
            description: ach.description,
            icon: ach.icon,
            unlockedAt: ach.unlockedAt ? new Date(ach.unlockedAt) : null,
          },
          create: {
            id: ach.id,
            title: ach.title,
            description: ach.description,
            icon: ach.icon,
            unlockedAt: ach.unlockedAt ? new Date(ach.unlockedAt) : null,
          },
        });
        achievementCount++;
      }
      console.log(`✅ Đã import thành công ${achievementCount} thành tựu!`);
    }

    console.log("\n====================================================");
    console.log("🎉 QUÁ TRÌNH IMPORT DỮ LIỆU ĐÃ HOÀN TẤT THÀNH CÔNG!");
    console.log("Database PostgreSQL Cloud hiện đã chứa đầy đủ dữ liệu game của bạn.");
    console.log("====================================================");

  } catch (error) {
    console.error("❌ Lỗi trong quá trình import dữ liệu:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
