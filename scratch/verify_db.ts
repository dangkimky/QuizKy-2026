import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const quizzes = await prisma.quiz.findMany({
      select: {
        id: true,
        title: true,
      }
    });
    console.log("Tìm thấy các đề thi trong database:");
    console.log(JSON.stringify(quizzes, null, 2));

    const specificQuiz = await prisma.quiz.findUnique({
      where: { id: "cnxhkh-300-questions-seeded" }
    });
    if (specificQuiz) {
      const q = JSON.parse(specificQuiz.questionsJson);
      console.log(`Đề thi "cnxhkh-300-questions-seeded" TỒN TẠI!`);
      console.log(`- Số lượng câu hỏi: ${q.length}`);
      console.log(`- 3 câu đầu tiên:`, JSON.stringify(q.slice(0, 3), null, 2));
    } else {
      console.log(`Đề thi "cnxhkh-300-questions-seeded" KHÔNG tồn tại.`);
    }
  } catch (err) {
    console.error("Lỗi:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
