"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, 
  Mail, 
  User, 
  Gamepad2, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2,
  Sparkles,
  Loader2
} from "lucide-react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile 
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useGameStore } from "@/store/gameStore";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Custom Particle background inside the Login box
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Particle animation logic
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number; color: string }> = [];

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    // Create particles
    const colors = ["rgba(139, 92, 246, 0.4)", "rgba(236, 72, 153, 0.4)", "rgba(59, 130, 246, 0.4)"];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce borders
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Set alert messages to clear after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Sync state helper to handle successful auth
  const handleAuthSuccess = async (firebaseUser: any) => {
    try {
      setLoading(true);
      setError("");

      const userPayload = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || "QuizMaster",
        photoURL: firebaseUser.photoURL || ""
      };

      // 1. Sync Firebase User state into Zustand
      const syncUser = useGameStore.getState().syncUser;
      await syncUser(userPayload);

      setSuccess("Đăng nhập thành công! Đang chuyển hướng...");
      
      // Redirect back home after a short delay
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err: any) {
      console.error("Lỗi đồng bộ hồ sơ nhân vật:", err);
      setError("Đăng nhập thành công nhưng không thể đồng bộ tiến trình: " + err.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ Email và Mật khẩu!");
      return;
    }
    if (isRegister && !displayName) {
      setError("Vui lòng nhập Tên hiển thị của bạn!");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (isRegister) {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Set display name in profile
        await updateProfile(userCredential.user, { displayName });
        await handleAuthSuccess(userCredential.user);
      } else {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await handleAuthSuccess(userCredential.user);
      }
    } catch (err: any) {
      console.error("Email auth error:", err);
      let localizedError = "Có lỗi xảy ra, vui lòng thử lại!";
      if (err.code === "auth/invalid-credential") {
        localizedError = "Email hoặc Mật khẩu không chính xác!";
      } else if (err.code === "auth/email-already-in-use") {
        localizedError = "Địa chỉ email này đã được sử dụng!";
      } else if (err.code === "auth/weak-password") {
        localizedError = "Mật khẩu phải chứa ít nhất 6 ký tự!";
      } else if (err.code === "auth/invalid-email") {
        localizedError = "Địa chỉ email không hợp lệ!";
      }
      setError(localizedError);
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const result = await signInWithPopup(auth, googleProvider);
      await handleAuthSuccess(result.user);
    } catch (err: any) {
      console.error("Google auth error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Không thể đăng nhập bằng Google: " + err.message);
      }
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-slate-950 flex items-center justify-center overflow-hidden font-sans text-slate-100">
      {/* Background Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Futuristic Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-[35rem] h-[35rem] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] bg-pink-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Cyber Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md p-1 mx-4">
        {/* Glowing border outline */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-sm opacity-60" />
        
        {/* Content container */}
        <div className="relative bg-slate-900/85 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 flex flex-col shadow-2xl">
          
          {/* Logo Heading */}
          <div className="flex flex-col items-center text-center mb-8">
            <motion.div 
              initial={{ scale: 0.8, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg border border-indigo-400/30 text-3xl mb-4"
            >
              🪐
            </motion.div>
            
            <h1 className="text-2xl font-black font-mono tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-slate-100 to-pink-200">
              QuizVerse Builder
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              {isRegister ? "Đăng Ký Hồ Sơ Nhân Vật" : "Xác Thực Hành Trình Game"}
            </p>
          </div>

          {/* Toast Messages */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-start gap-2.5 text-xs text-rose-300"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-300"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Standard Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            
            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">
                  Tên hiển thị nhân vật
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450">
                    <User className="w-4 h-4 text-slate-500" />
                  </span>
                  <input
                    type="text"
                    placeholder="Nhập tên đấu sĩ trắc nghiệm..."
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-2xl text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">
                Địa chỉ Email
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450">
                  <Mail className="w-4 h-4 text-slate-500" />
                </span>
                <input
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-2xl text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">
                Mật khẩu bí mật
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450">
                  <Lock className="w-4 h-4 text-slate-500" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-2xl text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Auth Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-2xl font-bold font-mono tracking-wide text-xs bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border border-indigo-400/20 shadow-[0_0_15px_rgba(139,92,246,0.25)]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Gamepad2 className="w-4 h-4" />
                  <span>{isRegister ? "BẮT ĐẦU KHỞI TẠO" : "XÁC NHẬN VÀ CHƠI"}</span>
                </>
              )}
            </button>
          </form>

          {/* Separator */}
          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative px-3 text-[10px] font-bold text-slate-600 uppercase bg-slate-900/90 font-mono tracking-widest">
              Hoặc Đăng Nhập Nhanh
            </span>
          </div>

          {/* Social Auth Providers */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            type="button"
            className="w-full py-2.5 px-4 rounded-2xl font-bold font-mono text-xs text-slate-350 bg-slate-950 border border-slate-800 hover:bg-slate-900 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>LIÊN KẾT TÀI KHOẢN GOOGLE</span>
              </>
            )}
          </button>

          {/* Footer Navigation */}
          <div className="mt-6 flex flex-col items-center justify-center gap-3 text-xs">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="text-slate-400 hover:text-indigo-400 font-medium transition-colors cursor-pointer"
            >
              {isRegister ? "Đã có tài khoản? Đăng nhập ngay" : "Chưa có tài khoản đấu sĩ? Tạo mới ngay"}
            </button>

            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-300 font-bold transition-colors cursor-pointer uppercase tracking-wider text-[10px] font-mono mt-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Chơi với tư cách khách (Guest)</span>
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
