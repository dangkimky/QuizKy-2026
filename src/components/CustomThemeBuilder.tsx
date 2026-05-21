"use client";

import React, { useState, useEffect } from "react";
import { useGameStore, UITheme, ParticleType, ThemeConfig } from "@/store/gameStore";
import { Paintbrush, Download, Upload, Sliders, Type, Play, Sparkles, Settings } from "lucide-react";

export default function CustomThemeBuilder() {
  const themeConfig = useGameStore(state => state.themeConfig);
  const customThemes = useGameStore(state => state.customThemes);
  const updateThemeConfig = useGameStore(state => state.updateThemeConfig);
  const saveCustomTheme = useGameStore(state => state.saveCustomTheme);

  const [activeTab, setActiveTab] = useState<"preset" | "colors" | "background" | "animations" | "scale" | "font">("preset");
  const [googleFontInput, setGoogleFontInput] = useState("");
  const [customBgUrl, setCustomBgUrl] = useState("");
  const [videoBgUrl, setVideoBgUrl] = useState("");

  // Inject Google Font link dynamically when font changes
  useEffect(() => {
    if (themeConfig.fontFamily && !themeConfig.fontFamily.includes("sans-serif") && !themeConfig.fontFamily.includes("monospace") && !themeConfig.fontFamily.includes("serif")) {
      const cleanFontName = themeConfig.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
      const linkId = `google-font-${cleanFontName.toLowerCase().replace(/\s+/g, "-")}`;
      
      if (!document.getElementById(linkId)) {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${cleanFontName.replace(/\s+/g, "+")}:wght@400;700;900&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [themeConfig.fontFamily]);

  const handlePresetSelect = (themeName: UITheme) => {
    updateThemeConfig({ theme: themeName });
  };

  const handleColorChange = (key: keyof ThemeConfig, val: string) => {
    updateThemeConfig({ [key]: val });
  };

  const handleParticleSelect = (p: ParticleType) => {
    updateThemeConfig({ particles: p });
  };

  const handleScaleSelect = (scale: number) => {
    updateThemeConfig({ uiScale: scale });
  };

  const applyGoogleFont = () => {
    if (!googleFontInput.trim()) return;
    const fontStr = `"${googleFontInput.trim()}", sans-serif`;
    updateThemeConfig({ fontFamily: fontStr });
  };

  const handleBgUrlApply = () => {
    if (customBgUrl.trim()) {
      updateThemeConfig({ background: `url(${customBgUrl.trim()}) center/cover no-repeat` });
    }
  };

  const handleVideoBgApply = () => {
    if (videoBgUrl.trim()) {
      updateThemeConfig({ background: "video", panelBg: "rgba(10, 10, 15, 0.75)" }); // Video path will be rendered in background element
      localStorage.setItem("quizverse_video_bg", videoBgUrl.trim());
      // Refresh to capture
      window.dispatchEvent(new Event("video-bg-updated"));
    }
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        updateThemeConfig({ background: `url(${event.target.result}) center/cover no-repeat` });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        updateThemeConfig({ background: "video", panelBg: "rgba(10, 10, 15, 0.75)" });
        localStorage.setItem("quizverse_video_bg", event.target.result as string);
        window.dispatchEvent(new Event("video-bg-updated"));
      }
    };
    reader.readAsDataURL(file);
  };

  const exportConfig = () => {
    const configData = {
      theme: themeConfig.theme,
      font: themeConfig.fontFamily,
      background: themeConfig.background,
      panelBg: themeConfig.panelBg,
      buttonBg: themeConfig.buttonBg,
      buttonHoverBg: themeConfig.buttonHoverBg,
      textPrimary: themeConfig.textPrimary,
      textSecondary: themeConfig.textSecondary,
      borderColor: themeConfig.borderColor,
      glowColor: themeConfig.glowColor,
      particles: themeConfig.particles,
      uiScale: themeConfig.uiScale,
      videoBg: localStorage.getItem("quizverse_video_bg") || "",
      pet: localStorage.getItem("quizverse_player") ? JSON.parse(localStorage.getItem("quizverse_player")!).activePet : "none",
    };

    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz_config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        updateThemeConfig({
          theme: data.theme || "custom",
          fontFamily: data.font || themeConfig.fontFamily,
          background: data.background || themeConfig.background,
          panelBg: data.panelBg || themeConfig.panelBg,
          buttonBg: data.buttonBg || themeConfig.buttonBg,
          buttonHoverBg: data.buttonHoverBg || themeConfig.buttonHoverBg,
          textPrimary: data.textPrimary || themeConfig.textPrimary,
          textSecondary: data.textSecondary || themeConfig.textSecondary,
          borderColor: data.borderColor || themeConfig.borderColor,
          glowColor: data.glowColor || themeConfig.glowColor,
          particles: data.particles || themeConfig.particles,
          uiScale: data.uiScale || themeConfig.uiScale,
        });

        if (data.videoBg) {
          localStorage.setItem("quizverse_video_bg", data.videoBg);
          window.dispatchEvent(new Event("video-bg-updated"));
        }

        alert("Đã nhập cấu hình giao diện quiz_config.json thành công!");
      } catch (err) {
        alert("File cấu hình JSON không hợp lệ.");
      }
    };
    reader.readAsText(file);
  };

  const presets: { id: UITheme; label: string; icon: string }[] = [
    { id: "cyberpunk", label: "Cyberpunk", icon: "🌃" },
    { id: "fantasy", label: "Fantasy", icon: "🔮" },
    { id: "anime", label: "Anime Pastel", icon: "🌸" },
    { id: "pixel", label: "Retro Pixel", icon: "👾" },
    { id: "neon", label: "Green Neon", icon: "🟩" },
    { id: "dark", label: "Tối Thượng", icon: "🖤" },
    { id: "light", label: "Trong Suốt Light", icon: "⬜" },
  ];

  return (
    <div className="w-full bg-slate-950/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-lg">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Paintbrush className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100">Bàn Chỉnh Sửa Giao Diện & Cấu Hình</h3>
            <p className="text-xs text-slate-400">Thiết kế phong cách game theo sở thích của bạn</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportConfig}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            XUẤT CONFIG
          </button>
          
          <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 transition-all cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            NHẬP CONFIG
            <input type="file" className="hidden" accept=".json" onChange={importConfig} />
          </label>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 min-h-[300px]">
        {/* Navigation Tabs */}
        <div className="flex md:flex-col gap-1 overflow-x-auto md:w-48 shrink-0 border-r border-slate-800/60 pr-4">
          <button
            onClick={() => setActiveTab("preset")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold w-full transition-all text-left whitespace-nowrap ${
              activeTab === "preset" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-900"
            }`}
          >
            <Sparkles className="w-4 h-4" /> Presets Theme
          </button>
          <button
            onClick={() => setActiveTab("colors")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold w-full transition-all text-left whitespace-nowrap ${
              activeTab === "colors" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-900"
            }`}
          >
            <Paintbrush className="w-4 h-4" /> Màu Sắc UI
          </button>
          <button
            onClick={() => setActiveTab("font")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold w-full transition-all text-left whitespace-nowrap ${
              activeTab === "font" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-900"
            }`}
          >
            <Type className="w-4 h-4" /> Kiểu Chữ (Font)
          </button>
          <button
            onClick={() => setActiveTab("background")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold w-full transition-all text-left whitespace-nowrap ${
              activeTab === "background" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-900"
            }`}
          >
            <Play className="w-4 h-4" /> Hình/Video Nền
          </button>
          <button
            onClick={() => setActiveTab("animations")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold w-full transition-all text-left whitespace-nowrap ${
              activeTab === "animations" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-900"
            }`}
          >
            <Settings className="w-4 h-4" /> Hiệu Ứng Bay Lượn
          </button>
          <button
            onClick={() => setActiveTab("scale")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold w-full transition-all text-left whitespace-nowrap ${
              activeTab === "scale" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-900"
            }`}
          >
            <Sliders className="w-4 h-4" /> Tỷ Lệ UI Scale
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 min-w-0">
          {/* Tab: Presets */}
          {activeTab === "preset" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {presets.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p.id)}
                  className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center border transition-all duration-300 relative group cursor-pointer ${
                    themeConfig.theme === p.id
                      ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
                      : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{p.icon}</span>
                  <span className="text-xs font-extrabold text-slate-200">{p.label}</span>
                  {themeConfig.theme === p.id && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Tab: Colors */}
          {activeTab === "colors" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">
                  Màu Nền Panel
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={themeConfig.panelBg.startsWith("#") ? themeConfig.panelBg : "#101018"}
                    onChange={e => handleColorChange("panelBg", e.target.value)}
                    className="w-10 h-9 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={themeConfig.panelBg}
                    onChange={e => handleColorChange("panelBg", e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">
                  Màu Nút Bấm
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={themeConfig.buttonBg.startsWith("#") ? themeConfig.buttonBg : "#4f46e5"}
                    onChange={e => handleColorChange("buttonBg", e.target.value)}
                    className="w-10 h-9 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={themeConfig.buttonBg}
                    onChange={e => handleColorChange("buttonBg", e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">
                  Chữ Tiêu Đề
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={themeConfig.textPrimary.startsWith("#") ? themeConfig.textPrimary : "#ffffff"}
                    onChange={e => handleColorChange("textPrimary", e.target.value)}
                    className="w-10 h-9 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={themeConfig.textPrimary}
                    onChange={e => handleColorChange("textPrimary", e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">
                  Đường Viền Panel
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={themeConfig.borderColor.startsWith("#") ? themeConfig.borderColor : "#333333"}
                    onChange={e => handleColorChange("borderColor", e.target.value)}
                    className="w-10 h-9 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={themeConfig.borderColor}
                    onChange={e => handleColorChange("borderColor", e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Font */}
          {activeTab === "font" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">
                  Nhập Google Font Cần Import
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={googleFontInput}
                    onChange={e => setGoogleFontInput(e.target.value)}
                    placeholder="Ví dụ: Orbitron, Inter, Outfit, Cinzel"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  />
                  <button
                    onClick={applyGoogleFont}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                  >
                    Áp Dụng
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                  Mẹo: Nhập tên chuẩn của bất kỳ phông chữ nào từ Google Fonts (ví dụ: "Press Start 2P" cho Pixel Art). Hệ thống sẽ tự động fetch và load phông chữ đó.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-900">
                <span className="text-[10px] text-slate-500 font-bold block mb-1">PREVIEW PHÔNG CHỮ:</span>
                <span
                  style={{ fontFamily: themeConfig.fontFamily }}
                  className="text-base font-extrabold text-slate-100 block transition-all"
                >
                  QuizVerse Builder - Nền Tảng Trắc Nghiệm Game Hóa 2026
                </span>
                <span className="text-xs text-slate-400 block mt-1 font-mono">
                  Phông hiện tại: {themeConfig.fontFamily}
                </span>
              </div>
            </div>
          )}

          {/* Tab: Background */}
          {activeTab === "background" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">
                    Hình Nền URL (PNG, JPG, GIF)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customBgUrl}
                      onChange={e => setCustomBgUrl(e.target.value)}
                      placeholder="https://example.com/bg.png"
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                    />
                    <button
                      onClick={handleBgUrlApply}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                    >
                      OK
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">
                    Video Nền URL (MP4)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={videoBgUrl}
                      onChange={e => setVideoBgUrl(e.target.value)}
                      placeholder="https://example.com/bg.mp4"
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                    />
                    <button
                      onClick={handleVideoBgApply}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">
                    Tải Ảnh Nền Từ Máy
                  </label>
                  <label className="flex items-center justify-center p-3 border border-slate-800 bg-slate-900/60 rounded-xl cursor-pointer hover:border-slate-600 text-xs text-slate-300 font-bold transition-all text-center">
                    CHỌN ẢNH (PNG/JPG/WEBP/GIF)
                    <input type="file" accept="image/*" className="hidden" onChange={handleBgImageUpload} />
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">
                    Tải Video Nền Từ Máy
                  </label>
                  <label className="flex items-center justify-center p-3 border border-slate-800 bg-slate-900/60 rounded-xl cursor-pointer hover:border-slate-600 text-xs text-slate-300 font-bold transition-all text-center">
                    CHỌN VIDEO (MP4)
                    <input type="file" accept="video/mp4" className="hidden" onChange={handleVideoUpload} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Animations */}
          {activeTab === "animations" && (
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-3">
                Chọn Hiệu Ứng Bầu Trời / Bay Lượn
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["none", "sparkles", "snow", "fire", "sakura", "rain"].map(p => (
                  <button
                    key={p}
                    onClick={() => handleParticleSelect(p as ParticleType)}
                    className={`p-3 rounded-xl border text-xs font-extrabold capitalize cursor-pointer transition-all ${
                      themeConfig.particles === p
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                        : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {p === "none"
                      ? "Tắt Hiệu Ứng"
                      : p === "sparkles"
                      ? "Lấp Lánh Sparkles"
                      : p === "snow"
                      ? "Tuyết Rơi"
                      : p === "fire"
                      ? "Tàn Lửa Bốc Lên"
                      : p === "sakura"
                      ? "Hoa Anh Đào Bay"
                      : "Mưa Bay Rơi"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Scale */}
          {activeTab === "scale" && (
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-3">
                Độ Phóng To/Thu Nhỏ Giao Diện UI
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[50, 75, 100, 125, 150, 200].map(s => (
                  <button
                    key={s}
                    onClick={() => handleScaleSelect(s)}
                    className={`p-3 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                      themeConfig.uiScale === s
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                        : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {s}%
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Hỗ trợ co dãn tỷ lệ giao diện tối ưu hóa cho màn hình từ điện thoại mini tới màn hình PC Gaming 4K cực nét.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
