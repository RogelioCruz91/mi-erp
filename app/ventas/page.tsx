"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gamnenyakraafruvbkin.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbW5lbnlha3JhYWZydXZia2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzU4NDQsImV4cCI6MjA4NTU1MTg0NH0.UpolMRzWNfd4hqBeYvnTrrvDu1C1rmrNXKvnO82y_OQ";

type Venta = {
  id: number;
  cliente: string;
  total: number;
  fecha: string;
  _tipo?: "nueva" | "actualizada";
};

function ahoraLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function Ventas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cliente, setCliente] = useState("");
  const [total, setTotal] = useState("");
  const [fecha, setFecha] = useState(ahoraLocal);
  const [msg, setMsg] = useState<{ texto: string; tipo: "ok" | "error" } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [estado, setEstado] = useState("conectando...");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientRef = useRef(createClient(SUPABASE_URL, SUPABASE_KEY));

  function mostrarMsg(texto: string, tipo: "ok" | "error") {
    setMsg({ texto, tipo });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMsg(null), 3000);
  }

  async function guardarVenta() {
    if (!cliente.trim() || !total || isNaN(parseFloat(total)) || !fecha) {
      mostrarMsg("Completa todos los campos.", "error");
      return;
    }
    setGuardando(true);
    const { error } = await clientRef.current
      .from("ventas")
      .insert({ cliente: cliente.trim(), total: parseFloat(total), fecha });

    if (error) {
      mostrarMsg("Error: " + error.message, "error");
    } else {
      mostrarMsg("Venta guardada correctamente.", "ok");
      setCliente("");
      setTotal("");
    }
    setGuardando(false);
  }

  useEffect(() => {
    const db = clientRef.current;

    // Carga inicial
    db.from("ventas")
      .select("*")
      .order("id", { ascending: false })
      .then(({ data }) => { if (data) setVentas(data); });

    // Realtime
    const channel = db
      .channel("ventas-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ventas" },
        (payload) => {
          const nueva = payload.new as Venta;
          setVentas((prev) => [{ ...nueva, _tipo: "nueva" }, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ventas" },
        (payload) => {
          const actualizada = payload.new as Venta;
          setVentas((prev) =>
            prev.map((v) =>
              v.id === actualizada.id ? { ...actualizada, _tipo: "actualizada" } : v
            )
          );
        }
      )
      .subscribe((status) => {
        setEstado(status);
      });

    return () => { db.removeChannel(channel); };
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Ventas en tiempo real</h1>
        <span className={`text-xs px-2 py-1 rounded-full font-mono ${
          estado === "SUBSCRIBED"
            ? "bg-green-800 text-green-300"
            : "bg-yellow-800 text-yellow-300"
        }`}>
          {estado}
        </span>
      </div>

      {/* Formulario */}
      <div className="bg-slate-800 p-5 rounded-xl mb-8 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Cliente</label>
          <input
            className="bg-slate-900 border border-slate-600 text-white rounded-md px-3 py-2 text-sm w-48 focus:outline-none focus:border-green-500"
            placeholder="Nombre del cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Total (S/)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="bg-slate-900 border border-slate-600 text-white rounded-md px-3 py-2 text-sm w-32 focus:outline-none focus:border-green-500"
            placeholder="0.00"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Fecha</label>
          <input
            type="datetime-local"
            className="bg-slate-900 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <button
          onClick={guardarVenta}
          disabled={guardando}
          className="bg-green-700 hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-5 py-2 rounded-md text-sm transition-colors"
        >
          {guardando ? "Guardando..." : "+ Guardar venta"}
        </button>
        {msg && (
          <p className={`text-sm w-full ${msg.tipo === "ok" ? "text-green-400" : "text-red-400"}`}>
            {msg.texto}
          </p>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {ventas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No hay ventas registradas.
                </td>
              </tr>
            ) : (
              ventas.map((v) => (
                <tr
                  key={v.id}
                  className={`transition-colors ${
                    v._tipo === "nueva"
                      ? "bg-green-950/40"
                      : v._tipo === "actualizada"
                      ? "bg-indigo-950/40"
                      : ""
                  }`}
                >
                  <td className="px-4 py-3 text-slate-400">{v.id}</td>
                  <td className="px-4 py-3 text-white">{v.cliente}</td>
                  <td className="px-4 py-3 text-white">S/ {parseFloat(String(v.total)).toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-300">{new Date(v.fecha).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {v._tipo === "nueva" && (
                      <span className="bg-green-700 text-white text-xs px-2 py-1 rounded">Nueva</span>
                    )}
                    {v._tipo === "actualizada" && (
                      <span className="bg-amber-600 text-white text-xs px-2 py-1 rounded">Actualizada</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
