"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  "https://gamnenyakraafruvbkin.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbW5lbnlha3JhYWZydXZia2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzU4NDQsImV4cCI6MjA4NTU1MTg0NH0.UpolMRzWNfd4hqBeYvnTrrvDu1C1rmrNXKvnO82y_OQ"
);

type Venta = { id: number; cliente: string; total: number; fecha: string };
type Producto = { id: number; nombre: string; stock: number; unidad: string };

const CAT_COLOR: Record<string, string> = {
  "Lija Agua-Seco": "bg-blue-900/60 text-blue-300",
  "Lija Fierro":    "bg-orange-900/60 text-orange-300",
  "Lija Agua":      "bg-cyan-900/60 text-cyan-300",
  "Lija Microfina": "bg-purple-900/60 text-purple-300",
  "Lija Madera":    "bg-amber-900/60 text-amber-300",
  "Lija 3M":        "bg-red-900/60 text-red-300",
};

function fmt(n: number) {
  return n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Dashboard() {
  const [ventas, setVentas]           = useState<Venta[]>([]);
  const [stockBajo, setStockBajo]     = useState<(Producto & { categoria: string })[]>([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalProductos, setTotalProductos] = useState(0);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    async function cargar() {
      const [
        { data: venData },
        { data: prodData },
        { count: cliCount },
        { count: prodCount },
      ] = await Promise.all([
        supabase.from("ventas").select("*").order("id", { ascending: false }).limit(5),
        supabase.from("productos").select("id,nombre,stock,unidad,categoria").lt("stock", 50).order("stock").limit(6),
        supabase.from("clientes").select("*", { count: "exact", head: true }),
        supabase.from("productos").select("*", { count: "exact", head: true }),
      ]);
      if (venData)  setVentas(venData);
      if (prodData) setStockBajo(prodData as (Producto & { categoria: string })[]);
      setTotalClientes(cliCount ?? 0);
      setTotalProductos(prodCount ?? 0);
      setLoading(false);
    }
    cargar();
  }, []);

  const totalVentas   = ventas.reduce((s, v) => s + Number(v.total), 0);
  const ventaMax      = ventas.length ? Math.max(...ventas.map((v) => Number(v.total))) : 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Ferretería — resumen general</p>
        </div>
        <span className="text-slate-500 text-xs">{new Date().toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {[
          { label: "Clientes",  value: loading ? "—" : totalClientes,           sub: "registrados",        icon: "👥", color: "text-blue-400" },
          { label: "Productos", value: loading ? "—" : totalProductos,           sub: "en catálogo",        icon: "📦", color: "text-orange-400" },
          { label: "Ventas",    value: loading ? "—" : ventas.length,            sub: "últimas registradas", icon: "💰", color: "text-green-400" },
          { label: "Stock bajo",value: loading ? "—" : stockBajo.length,         sub: "< 50 unidades",      icon: "⚠️", color: "text-yellow-400" },
        ].map((k) => (
          <div key={k.label} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide">{k.label}</p>
                <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
                <p className="text-slate-500 text-xs mt-1">{k.sub}</p>
              </div>
              <span className="text-2xl">{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Ultimas ventas con barras */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <h2 className="font-semibold text-sm">Últimas ventas</h2>
            <Link href="/ventas" className="text-xs text-orange-400 hover:underline">Ver todas →</Link>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {loading ? (
              <p className="text-slate-500 text-sm text-center py-4">Cargando...</p>
            ) : ventas.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Sin ventas aún.</p>
            ) : ventas.map((v) => (
              <div key={v.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-medium truncate max-w-[60%]">{v.cliente}</span>
                  <span className="text-orange-400 font-mono font-bold">S/ {fmt(Number(v.total))}</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-600 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (Number(v.total) / ventaMax) * 100)}%` }}
                  />
                </div>
                <p className="text-slate-500 text-xs">{new Date(v.fecha).toLocaleDateString("es-PE")}</p>
              </div>
            ))}
          </div>
          {ventas.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-700 flex justify-between text-xs text-slate-400">
              <span>Total mostrado</span>
              <span className="text-orange-400 font-bold">S/ {fmt(totalVentas)}</span>
            </div>
          )}
        </div>

        {/* Stock bajo */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <h2 className="font-semibold text-sm">⚠️ Stock bajo</h2>
            <Link href="/productos" className="text-xs text-orange-400 hover:underline">Ver productos →</Link>
          </div>
          <div className="p-4 flex flex-col gap-2">
            {loading ? (
              <p className="text-slate-500 text-sm text-center py-4">Cargando...</p>
            ) : stockBajo.length === 0 ? (
              <p className="text-green-400 text-sm text-center py-4">Todo el stock está OK.</p>
            ) : stockBajo.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-white text-xs truncate">{p.nombre}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded mt-0.5 inline-block ${CAT_COLOR[p.categoria] ?? "bg-slate-700 text-slate-300"}`}>
                    {p.categoria}
                  </span>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className={`font-bold text-sm font-mono ${p.stock < 30 ? "text-red-400" : "text-yellow-400"}`}>{p.stock}</p>
                  <p className="text-slate-500 text-xs">{p.unidad}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/tienda",   icon: "🛒", label: "Ir a Tienda",    color: "hover:border-orange-600" },
          { href: "/ventas",   icon: "💰", label: "Ver Ventas",     color: "hover:border-green-600"  },
          { href: "/clientes", icon: "👥", label: "Ver Clientes",   color: "hover:border-blue-600"   },
          { href: "/productos",icon: "📦", label: "Ver Productos",  color: "hover:border-purple-600" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`bg-slate-800 border border-slate-700 ${a.color} rounded-xl p-4 flex items-center gap-3 transition-colors group`}
          >
            <span className="text-2xl">{a.icon}</span>
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
