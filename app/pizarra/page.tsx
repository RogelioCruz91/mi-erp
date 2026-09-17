"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

const CollaborativeCanvas = dynamic(
  () => import("@/components/CollaborativeCanvas"),
  { ssr: false, loading: () => (
    <div className="flex-1 flex items-center justify-center text-slate-400">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">🎨</div>
        <p>Cargando pizarra...</p>
      </div>
    </div>
  )}
);

const SALAS = ["sala-principal", "diseño", "ingenieria", "ventas"];

export default function Pizarra() {
  const [sala, setSala] = useState("sala-principal");
  const [salaActiva, setSalaActiva] = useState("sala-principal");

  function entrar() { setSalaActiva(sala); }

  return (
    <div className="flex flex-col h-full -m-8">
      {/* Selector de sala */}
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 border-b border-slate-700 shrink-0">
        <span className="text-slate-400 text-xs">Sala:</span>
        <select
          className="bg-slate-800 border border-slate-600 text-white text-xs rounded px-2 py-1 focus:outline-none"
          value={sala}
          onChange={(e) => setSala(e.target.value)}
        >
          {SALAS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          className="bg-slate-800 border border-slate-600 text-white text-xs rounded px-2 py-1 w-36 focus:outline-none focus:border-orange-500"
          placeholder="o escribe una sala..."
          value={sala}
          onChange={(e) => setSala(e.target.value)}
        />
        <button
          onClick={entrar}
          className="bg-orange-700 hover:bg-orange-600 text-white text-xs px-3 py-1 rounded transition-colors"
        >
          Entrar
        </button>
        {salaActiva !== sala && (
          <span className="text-yellow-400 text-xs">↑ Haz clic en Entrar para cambiar de sala</span>
        )}
      </div>

      {/* Canvas ocupa todo lo restante */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <CollaborativeCanvas key={salaActiva} room={salaActiva} />
      </div>
    </div>
  );
}
