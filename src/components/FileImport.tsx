"use client";

import React, { useState, useRef } from "react";
import { useGameStore, Question } from "@/store/gameStore";
import { Upload, FileText, CheckCircle2, AlertTriangle, Play, HelpCircle } from "lucide-react";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { parseTextContent, parseExcel } from "@/lib/parser";

export default function FileImport() {
  const importQuiz = useGameStore(state => state.importQuiz);
  const startQuiz = useGameStore(state => state.startQuiz);
  const [dragActive, setDragActive] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    id: string;
    title: string;
    totalQuestions: number;
    levels: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setIsParsing(true);
    setError(null);
    setSuccessInfo(null);

    const fileType = file.name.split(".").pop()?.toLowerCase();
    const title = file.name.replace(/\.[^/.]+$/, "");

    try {
      let questions: Question[] = [];

      if (fileType === "txt") {
        const text = await file.text();
        questions = parseTextContent(text);
      } else if (fileType === "xlsx" || fileType === "xls" || fileType === "csv") {
        const buffer = await file.arrayBuffer();
        const nodeBuffer = Buffer.from(buffer);
        questions = parseExcel(nodeBuffer);
      } else if (fileType === "docx") {
        const buffer = await file.arrayBuffer();
        const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buffer });
        
        // Preserve bold tags as indicators of correct answer by placing special marker
        const parsedHtml = html
          .replace(/<strong>\s*([A-D]\s*[\.\)\-:])\s*(.*?)<\/strong>/gi, "$1 [CORRECT] $2")
          .replace(/<b>\s*([A-D]\s*[\.\)\-:])\s*(.*?)<\/b>/gi, "$1 [CORRECT] $2")
          .replace(/<strong>\s*(.*?)\s*<\/strong>/gi, "[STRONG]$1[/STRONG]");
          
        const cleanText = parsedHtml.replace(/<[^>]*>/g, "\n");
        questions = parseTextContent(cleanText);
      } else if (fileType === "pdf") {
        // Since PDF parsing is complex client-side due to worker file setup, we send it to backend API!
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch("/api/parse", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Lỗi xử lý PDF từ máy chủ.");
        }

        const data = await response.json();
        questions = data.questions;
      } else {
        throw new Error("Định dạng file không được hỗ trợ. Vui lòng sử dụng DOCX, PDF, TXT, CSV, XLSX.");
      }

      if (!questions || questions.length === 0) {
        throw new Error("Không thể tìm thấy câu hỏi hợp lệ trong file. Vui lòng kiểm tra lại cấu trúc đề.");
      }

      // Add to store
      const quizId = importQuiz(title, questions);
      const totalQ = questions.length;
      const totalLevels = Math.max(1, Math.ceil(totalQ / 50));

      setSuccessInfo({
        id: quizId,
        title,
        totalQuestions: totalQ,
        levels: totalLevels,
      });

      // Play success audio
      try {
        new Audio("/sounds/success.mp3").play().catch(() => {});
      } catch (e) {}

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi không xác định trong quá trình phân tích file.");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 backdrop-blur-sm relative overflow-hidden group ${
          dragActive
            ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_25px_rgba(16,185,129,0.3)]"
            : "border-slate-700 bg-slate-900/40 hover:border-indigo-500 hover:bg-indigo-500/5 hover:shadow-[0_0_25px_rgba(99,102,241,0.2)]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".docx,.pdf,.txt,.csv,.xlsx,.xls"
          onChange={handleFileChange}
          disabled={isParsing}
        />

        {/* Ambient neon lines inside uploader */}
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500/20 group-hover:bg-indigo-500/40 transition-all" />
        <div className="absolute top-0 right-0 w-2 h-full bg-pink-500/20 group-hover:bg-pink-500/40 transition-all" />

        {isParsing ? (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold text-slate-300 animate-pulse">
              AI Đang Phân Tích & Giải Mã File Câu Hỏi...
            </p>
            <p className="text-xs text-slate-500 mt-1">Đang đọc đáp án, cấu trúc in đậm, màu chữ...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-200 mb-1">
              Kéo & Thả File Câu Hỏi Hoặc Nhấp Để Tải Lên
            </h3>
            <p className="text-xs text-slate-400 mb-4 max-w-sm leading-relaxed">
              Hỗ trợ file <span className="text-indigo-400 font-semibold">DOCX, PDF, TXT, CSV, XLSX</span>. AI tự động đọc đề, tìm đáp án đúng bằng chữ in đậm, highlight, màu sắc, ký hiệu...
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-[10px] text-slate-400 font-bold bg-slate-950/40 px-3 py-1.5 rounded-full border border-slate-800">
              <span>✓ Tự nhận diện đậm/nhạt</span>
              <span className="text-slate-600">•</span>
              <span>✓ Đánh dấu 🟩 hoặc ✓</span>
              <span className="text-slate-600">•</span>
              <span>✓ Đáp án: C</span>
            </div>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex gap-3 items-start text-xs text-rose-300 leading-relaxed shadow-lg">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <div>
            <div className="font-extrabold text-sm text-rose-200 mb-0.5">Không Thể Phân Tích File</div>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Success info */}
      {successInfo && (
        <div className="mt-4 p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl shadow-xl animate-fade-in relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />

          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase font-black tracking-widest text-emerald-400">
                Nhập Đề Thành Công!
              </div>
              <h4 className="font-extrabold text-sm text-slate-200 truncate mt-0.5 mb-1 font-mono">
                {successInfo.title}
              </h4>

              <div className="grid grid-cols-2 gap-3 mt-3 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                <div>
                  <div className="text-slate-500 font-semibold text-[10px]">TỔNG SỐ CÂU HỎI</div>
                  <div className="text-base font-black text-slate-100 mt-0.5">
                    {successInfo.totalQuestions} câu
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-semibold text-[10px]">SỐ MÀN CHƠI (LEVELS)</div>
                  <div className="text-base font-black text-slate-100 mt-0.5">
                    {successInfo.levels} màn <span className="text-[10px] text-slate-400 font-normal">(50 câu/màn)</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => startQuiz(successInfo.id, "classic", 1)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-[0_4px_15px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.5)] transition-all cursor-pointer transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  BẮT ĐẦU CHƠI NGAY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
