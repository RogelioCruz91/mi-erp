"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://gamnenyakraafruvbkin.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbW5lbnlha3JhYWZydXZia2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzU4NDQsImV4cCI6MjA4NTU1MTg0NH0.UpolMRzWNfd4hqBeYvnTrrvDu1C1rmrNXKvnO82y_OQ"
);

type Producto = {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  unidad: string;
};

const CAT_COLOR: Record<string, string> = {
  "Lija Agua-Seco": "bg-blue-900/60 text-blue-300",
  "Lija Fierro":    "bg-orange-900/60 text-orange-300",
  "Lija Agua":      "bg-cyan-900/60 text-cyan-300",
  "Lija Microfina": "bg-purple-900/60 text-purple-300",
  "Lija Madera":    "bg-amber-900/60 text-amber-300",
  "Lija 3M":        "bg-red-900/60 text-red-300",
};

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState("");

  useEffect(() => {
    supabase
      .from("productos")
      .select("*")
      .order("categoria")
      .order("nombre")
      .then(({ data }) => {
        if (data) setProductos(data);
        setLoading(false);
      });
  }, []);

  const filtrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
    p.categoria.toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Productos</h1>
        <span className="text-slate-400 text-sm">{productos.length} registros</span>
      </div>

      <input
        className="w-full bg-slate-800 border border-slate-600 text-white rounded-md px-4 py-2 text-sm mb-4 focus:outline-none focus:border-orange-500"
        placeholder="Buscar por nombre, grano o categoria..."
        value={buscar}
        onChange={(e) => setBuscar(e.target.value)}
      />

      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
              <th className="px-4 py-3 text-left">Cod.</th>
              <th className="px-4 py-3 text-left">Descripcion</th>
              <th className="px-4 py-3 text-left">Categoria</th>
              <th className="px-4 py-3 text-left">Present.</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-right">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Sin resultados.</td></tr>
            ) : (
              filtrados.map((p) => (
                <tr key={p.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{String(p.id).padStart(6, "0")}</td>
                  <td className="px-4 py-2.5 text-white text-xs">{p.nombre}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded ${CAT_COLOR[p.categoria] ?? "bg-slate-700 text-slate-300"}`}>
                      {p.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs font-mono">{p.unidad}</td>
                  <td className="px-4 py-2.5 text-right text-orange-400 font-mono text-xs">
                    S/ {parseFloat(String(p.precio)).toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`font-mono text-xs ${p.stock < 50 ? "text-yellow-400" : "text-slate-300"}`}>
                      {p.stock}
                    </span>
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
