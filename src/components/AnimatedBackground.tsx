"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  pulsePhase: number;
}

interface Connection {
  from: number;
  to: number;
  progress: number;
  speed: number;
  active: boolean;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let nodes: Node[] = [];
    let connections: Connection[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initNodes();
    };

    const initNodes = () => {
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 22000), 40);
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2.5 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        pulsePhase: Math.random() * Math.PI * 2,
      }));

      connections = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (Math.random() < 0.25) {
            connections.push({ from: i, to: j, progress: Math.random(), speed: Math.random() * 0.003 + 0.001, active: Math.random() < 0.5 });
          }
        }
      }
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x * canvas.width;
      const my = mouseRef.current.y * canvas.height;

      nodes.forEach((node, i) => {
        // Subtle mouse repulsion
        const dx = node.x - mx;
        const dy = node.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          node.vx += (dx / dist) * 0.02;
          node.vy += (dy / dist) * 0.02;
        }

        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.99;
        node.vy *= 0.99;

        if (node.x < 0) { node.x = canvas.width; }
        if (node.x > canvas.width) { node.x = 0; }
        if (node.y < 0) { node.y = canvas.height; }
        if (node.y > canvas.height) { node.y = 0; }

        const pulse = Math.sin(t * 0.001 + node.pulsePhase) * 0.3 + 0.7;
        const r = node.radius * pulse;

        // Outer glow
        const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 8);
        grd.addColorStop(0, `rgba(168, 85, 247, ${node.opacity * 0.5 * pulse})`);
        grd.addColorStop(1, "rgba(168, 85, 247, 0)");
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 8, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Node core
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(192, 132, 252, ${node.opacity * pulse})`;
        ctx.fill();
      });

      connections.forEach((conn) => {
        const a = nodes[conn.from];
        const b = nodes[conn.to];
        if (!a || !b) return;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 200;

        if (dist > maxDist) return;

        const alpha = (1 - dist / maxDist) * 0.2;

        // Static connection line
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(124, 58, 237, ${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Animated particle along line
        if (conn.active) {
          conn.progress += conn.speed;
          if (conn.progress > 1) {
            conn.progress = 0;
            conn.active = Math.random() < 0.7;
          }

          const px = a.x + dx * conn.progress;
          const py = a.y + dy * conn.progress;
          const pg = ctx.createRadialGradient(px, py, 0, px, py, 6);
          pg.addColorStop(0, `rgba(216, 180, 254, ${alpha * 4})`);
          pg.addColorStop(1, "rgba(216, 180, 254, 0)");
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fillStyle = pg;
          ctx.fill();
        } else if (Math.random() < 0.003) {
          conn.active = true;
        }
      });

      frameRef.current = requestAnimationFrame(draw);
    };

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouse);
    resize();
    frameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <>
      {/* Canvas particle network */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Aurora blob 1 — top left */}
      <div
        className="fixed pointer-events-none"
        style={{
          zIndex: 0,
          top: "-15%",
          left: "-10%",
          width: "60vw",
          height: "60vw",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, oklch(0.55 0.22 285 / 0.22) 0%, transparent 70%)",
          animation: "aurora-1 18s ease-in-out infinite",
          filter: "blur(40px)",
        }}
      />

      {/* Aurora blob 2 — bottom right */}
      <div
        className="fixed pointer-events-none"
        style={{
          zIndex: 0,
          bottom: "-20%",
          right: "-10%",
          width: "55vw",
          height: "55vw",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, oklch(0.5 0.23 305 / 0.18) 0%, transparent 70%)",
          animation: "aurora-2 22s ease-in-out infinite",
          filter: "blur(50px)",
        }}
      />

      {/* Aurora blob 3 — center subtle */}
      <div
        className="fixed pointer-events-none"
        style={{
          zIndex: 0,
          top: "30%",
          left: "35%",
          width: "40vw",
          height: "40vw",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, oklch(0.45 0.18 260 / 0.12) 0%, transparent 70%)",
          animation: "aurora-3 28s ease-in-out infinite",
          filter: "blur(60px)",
        }}
      />

      {/* Dot grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          backgroundImage: "radial-gradient(oklch(1 0 0 / 0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        }}
      />
    </>
  );
}
