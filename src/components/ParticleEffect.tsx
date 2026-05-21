"use client";

import React, { useEffect, useRef } from "react";
import { ParticleType, useGameStore } from "@/store/gameStore";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  alpha: number;
  rotation?: number;
  rotationSpeed?: number;
  char?: string; // For Matrix rain
}

export default function ParticleEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleType = useGameStore(state => state.themeConfig.particles);
  const glowColor = useGameStore(state => state.themeConfig.glowColor || "#ff007f");
  
  // New graphic config fields from the store (with safe fallbacks)
  const graphicQuality = useGameStore(state => state.themeConfig.graphicQuality || "high");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let gridOffset = 0; // For cyber_grid movement

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle limit based on graphicQuality
    const maxParticles = graphicQuality === "low" ? 10 : graphicQuality === "medium" ? 40 : 120;
    const enableShadows = graphicQuality === "high";

    const createParticle = (type: ParticleType): Particle => {
      const w = canvas.width;
      const h = canvas.height;

      switch (type) {
        case "snow":
          return {
            x: Math.random() * w,
            y: -10,
            size: Math.random() * 3 + 1,
            speedX: Math.random() * 1 - 0.5,
            speedY: Math.random() * 1.2 + 0.4,
            color: "#ffffff",
            alpha: Math.random() * 0.4 + 0.4,
          };
        case "sakura":
          return {
            x: Math.random() * w,
            y: -20,
            size: Math.random() * 5 + 3,
            speedX: Math.random() * 1.2 - 0.2,
            speedY: Math.random() * 0.8 + 0.8,
            color: `rgba(${255}, ${Math.floor(Math.random() * 40) + 160}, ${Math.floor(Math.random() * 40) + 180}, 0.6)`,
            alpha: Math.random() * 0.4 + 0.3,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: Math.random() * 0.02 - 0.01,
          };
        case "fire":
          return {
            x: Math.random() * w,
            y: h + 20,
            size: Math.random() * 4 + 2,
            speedX: Math.random() * 0.8 - 0.4,
            speedY: -(Math.random() * 1.5 + 0.8),
            color: `hsl(${Math.random() * 30 + 10}, 100%, 60%)`,
            alpha: 1,
          };
        case "sparkles":
          return {
            x: Math.random() * w,
            y: Math.random() * h,
            size: Math.random() * 2 + 1,
            speedX: Math.random() * 0.3 - 0.15,
            speedY: Math.random() * 0.3 - 0.15,
            color: glowColor,
            alpha: Math.random() * 0.2 + 0.8,
            rotation: 0,
            rotationSpeed: Math.random() * 0.03,
          };
        case "rain":
          return {
            x: Math.random() * w,
            y: -50,
            size: Math.random() * 0.8 + 0.8,
            speedX: -1.2,
            speedY: Math.random() * 4 + 6,
            color: "rgba(174, 219, 255, 0.3)",
            alpha: Math.random() * 0.4 + 0.2,
          };
        case "bubbles":
          return {
            x: Math.random() * w,
            y: h + 20,
            size: Math.random() * 8 + 4,
            speedX: Math.random() * 0.6 - 0.3,
            speedY: -(Math.random() * 1.0 + 0.5),
            color: glowColor || "rgba(100, 200, 255, 0.4)",
            alpha: Math.random() * 0.3 + 0.2,
          };
        case "matrix_rain":
          const matrixChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$+-*/=<>#@&%";
          return {
            x: Math.random() * w,
            y: -50,
            size: Math.random() * 4 + 10, // Font size
            speedX: 0,
            speedY: Math.random() * 3 + 4,
            color: "#00ff41",
            alpha: Math.random() * 0.5 + 0.4,
            char: matrixChars[Math.floor(Math.random() * matrixChars.length)],
          };
        default:
          return {
            x: 0,
            y: 0,
            size: 0,
            speedX: 0,
            speedY: 0,
            color: "transparent",
            alpha: 0,
          };
      }
    };

    // Initialize sparkles initially
    if (particleType === "sparkles" && graphicQuality !== "low") {
      const initCount = graphicQuality === "medium" ? 25 : 60;
      for (let i = 0; i < initCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speedX: Math.random() * 0.3 - 0.15,
          speedY: Math.random() * 0.3 - 0.15,
          color: glowColor,
          alpha: Math.random() * 0.2 + 0.8,
        });
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (particleType === "none" || graphicQuality === "low") {
        // Still draw grid if theme is retro_wave/matrix for static feel but no active physics
        if (particleType === "cyber_grid") {
          drawCyberGrid(0);
        }
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      // Draw Cyber Grid first if active
      if (particleType === "cyber_grid") {
        gridOffset += 0.5;
        drawCyberGrid(gridOffset);
      }

      // Spawn particles periodically
      const spawnRates: Record<ParticleType, number> = {
        none: 0,
        snow: 0.6,
        sakura: 0.3,
        fire: 0.8,
        sparkles: 0.04,
        rain: 4,
        bubbles: 0.5,
        matrix_rain: 1.5,
        cyber_grid: 0, // Handled separately
      };

      const currentSpawnRate = spawnRates[particleType] || 0;
      if (Math.random() < currentSpawnRate && particles.length < maxParticles) {
        particles.push(createParticle(particleType));
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Update physics
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
          p.rotation += p.rotationSpeed;
        }

        if (particleType === "fire") {
          p.alpha -= 0.012;
          p.size = Math.max(0.1, p.size - 0.02);
        } else if (particleType === "sparkles") {
          p.alpha -= 0.004;
        } else if (particleType === "matrix_rain") {
          // Slowly fade out
          p.alpha -= 0.003;
          // Randomly change character to make it look active
          if (Math.random() < 0.08) {
            const matrixChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$+-*/=<>#@&%";
            p.char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          }
        }

        // Out of bounds check
        const outOfBounds =
          p.y > canvas.height + 30 ||
          p.y < -60 ||
          p.x > canvas.width + 30 ||
          p.x < -30 ||
          p.alpha <= 0 ||
          p.size <= 0.1;

        if (outOfBounds) {
          if (particleType === "sparkles") {
            particles[i] = createParticle("sparkles");
          } else {
            particles.splice(i, 1);
          }
          continue;
        }

        // Draw particle
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        // Apply glow shadows only in High graphic quality
        if (enableShadows) {
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color;
        }

        if (particleType === "sakura" && p.rotation !== undefined) {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (particleType === "rain") {
          ctx.beginPath();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * 1.5, p.y + p.speedY * 1.5);
          ctx.stroke();
        } else if (particleType === "bubbles") {
          ctx.beginPath();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.stroke();

          // Highlight shine in bubble
          ctx.beginPath();
          ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
          ctx.arc(p.x - p.size / 3, p.y - p.size / 3, p.size / 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (particleType === "matrix_rain" && p.char) {
          ctx.font = `${p.size}px Courier New, monospace`;
          ctx.fillText(p.char, p.x, p.y);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    // Draw Cyber Grid background lines
    const drawCyberGrid = (offset: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.save();
      ctx.strokeStyle = glowColor || "rgba(0, 255, 255, 0.15)";
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.08;

      const spacing = 45;
      
      // Horizontal scrolling lines
      const startY = (offset % spacing);
      for (let y = startY; y < h; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Vertical stationary/scrolling lines
      for (let x = 0; x < w; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      ctx.restore();
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleType, glowColor, graphicQuality]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
