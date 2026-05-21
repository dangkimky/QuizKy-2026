import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId") || "default-player";

    let player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    // If player profile doesn't exist, create a default one
    if (!player) {
      player = await prisma.player.create({
        data: {
          id: playerId,
          name: playerId === "default-player" ? "QuizMaster" : "Đấu Sĩ Mới",
          level: 1,
          exp: 0,
          activePet: "none",
          activeTheme: "cyberpunk",
        },
      });
    }

    return NextResponse.json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
        level: player.level,
        exp: player.exp,
        activePet: player.activePet,
        activeTheme: player.activeTheme,
        // Parse the advanced stats if available
        stats: player.statsJson ? JSON.parse(player.statsJson) : null
      }
    });
  } catch (err: any) {
    console.error("GET player error:", err);
    return NextResponse.json({ error: "Không thể tải thông tin người chơi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { playerId, name, level, exp, activePet, activeTheme, statsJson } = data;

    const targetId = playerId || "default-player";

    const player = await prisma.player.upsert({
      where: { id: targetId },
      update: {
        name: name || undefined,
        level: level !== undefined ? parseInt(level, 10) : undefined,
        exp: exp !== undefined ? parseInt(exp, 10) : undefined,
        activePet: activePet || undefined,
        activeTheme: activeTheme || undefined,
        statsJson: statsJson || undefined,
      },
      create: {
        id: targetId,
        name: name || "QuizMaster",
        level: level !== undefined ? parseInt(level, 10) : 1,
        exp: exp !== undefined ? parseInt(exp, 10) : 0,
        activePet: activePet || "none",
        activeTheme: activeTheme || "cyberpunk",
        statsJson: statsJson || null,
      },
    });

    return NextResponse.json({ success: true, player });
  } catch (err: any) {
    console.error("POST player error:", err);
    return NextResponse.json({ error: "Không thể lưu thông tin người chơi" }, { status: 500 });
  }
}
