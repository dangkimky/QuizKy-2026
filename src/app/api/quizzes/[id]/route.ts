import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.quiz.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Đã xóa đề trắc nghiệm thành công" });
  } catch (err: any) {
    console.error("DELETE quiz error:", err);
    return NextResponse.json({ error: "Không thể xóa đề trắc nghiệm. Vui lòng kiểm tra lại ID." }, { status: 500 });
  }
}
