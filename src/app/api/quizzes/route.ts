import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const quizzes = await prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    // Parse JSON lists
    const formatted = quizzes.map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      questions: JSON.parse(q.questionsJson),
      config: JSON.parse(q.configJson || "{}"),
      createdAt: q.createdAt,
    }));
    
    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error("GET quizzes error:", err);
    return NextResponse.json({ error: "Không thể lấy danh sách đề trắc nghiệm" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, title, description, questions, config } = data;

    if (!title || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: "Dữ liệu đề không hợp lệ" }, { status: 400 });
    }

    const quiz = await prisma.quiz.upsert({
      where: { id: id || crypto.randomUUID() },
      update: {
        title,
        description: description || null,
        questionsJson: JSON.stringify(questions),
        configJson: JSON.stringify(config || {}),
      },
      create: {
        id: id || crypto.randomUUID(),
        title,
        description: description || null,
        questionsJson: JSON.stringify(questions),
        configJson: JSON.stringify(config || {}),
      },
    });

    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        questions,
        config,
      }
    });
  } catch (err: any) {
    console.error("POST quiz error:", err);
    return NextResponse.json({ error: err.message || "Lỗi lưu đề trắc nghiệm" }, { status: 500 });
  }
}
