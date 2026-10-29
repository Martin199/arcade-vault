"use client";

import { useRouter } from "next/navigation";
import { useRef, type MouseEvent } from "react";
import type { Game } from "@/lib/games";
import { formatScore } from "@/lib/scores";

export function GameCard({ game }: { game: Game }) {
  const router = useRouter();
  const tiltRef = useRef<HTMLDivElement>(null);
  const href = `/juegos/${game.id}`;

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translateY(-6px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg)`;
  };
  const onLeave = () => {
    const el = tiltRef.current;
    if (el) el.style.transform = "";
  };
  const open = () => router.push(href);

  const btnColor = game.color === "magenta" ? " magenta" : game.color === "yellow" ? " yellow" : "";

  return (
    <div ref={tiltRef} className="card" onMouseMove={onMove} onMouseLeave={onLeave} onClick={open}>
      <div className="cover">
        <div className={"cover-bg " + game.cover}></div>
        <div className="label">{game.cat}</div>
      </div>
      <div className="meta">
        <div className="title">{game.title}</div>
        <div className="desc">{game.short}</div>
        <div className="row">
          <div className="score-badge">
            <span>MEJOR PUNTUACIÓN</span>
            <b>{formatScore(game.best)}</b>
          </div>
          <button
            className={"btn" + btnColor}
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
          >
            JUGAR
          </button>
        </div>
      </div>
    </div>
  );
}
