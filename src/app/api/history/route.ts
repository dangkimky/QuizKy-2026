import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId") || "default-player";

    const history = await prisma.historyRecord.findMany({
      where: { playerId },
      orderBy: { playedAt: "desc" },
    });
    return NextResponse.json(history);
  } catch (err: any) {
    console.error("GET history error:", err);
    return NextResponse.json({ error: "Không thể lấy lịch sử đấu" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { playerId, quizId, quizTitle, score, correctCount, totalQuestions, mode, expGained } = data;

    if (!quizId || score === undefined || correctCount === undefined) {
      return NextResponse.json({ error: "Dữ liệu lịch sử không hợp lệ" }, { status: 400 });
    }

    const record = await prisma.historyRecord.create({
      data: {
        playerId: playerId || "default-player",
        quizId,
        quizTitle: quizTitle || "Bài Trắc Nghiệm",
        score: parseFloat(score),
        correctCount: parseInt(correctCount, 10),
        totalQuestions: parseInt(totalQuestions, 10),
        mode: mode || "classic",
        expGained: parseInt(expGained, 10) || 0,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (err: any) {
    console.error("POST history error:", err);
    return NextResponse.json({ error: "Không thể lưu lịch sử đấu" }, { status: 500 });
  }
}
