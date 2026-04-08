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

const CATEGORIAS: Record<string, string> = {
  "Alimentos preparados": "bg-orange-800 text-orange-200",
  "Panadería":            "bg-yellow-800 text-yellow-200",
  "Postres":              "bg-pink-800 text-pink-200",
  "Frutas":               "bg-green-800 text-green-200",
  "Carnes":               "bg-red-800 text-red-200",
  "Mariscos":             "bg-blue-800 text-blue-200",
  "Bebidas":              "bg-cyan-800 text-cyan-200",
  "Granos":               "bg-amber-800 text-amber-200",
  "Lácteos":              "bg-slate-600 text-slate-200",
  "Condimentos":          "bg-purple-800 text-purple-200",
  "Vegetales":            "bg-lime-800 text-lime-200",
};

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState("");

  useEffect(() => {
    supabase
      .from("productos")
      .select("*")
      .order("id", { ascending: true })
      .then(({ data }) => {
        if (data) setProductos(data);
        setLoading(false);
      });
  }, []);

  const filtrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Productos</h1>
        <span className="text-slate-400 text-sm">{productos.length} registros</span>
      </div>

      <input
        className="w-full bg-slate-800 border border-slate-600 text-white rounded-md px-4 py-2 text-sm mb-4 focus:outline-none focus:border-green-500"
        placeholder="Buscar por nombre o categoria..."
        value={buscar}
        onChange={(e) => setBuscar(e.target.value)}
      />

      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Categoria</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-right">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Sin resultados.</td></tr>
            ) : (
              filtrados.map((p) => (
                <tr key={p.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-3 text-slate-400">{p.id}</td>
                  <td className="px-4 py-3 text-white font-medium">{p.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${CATEGORIAS[p.categoria] ?? "bg-slate-700 text-slate-300"}`}>
                      {p.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-green-400 font-mono">
                    S/ {parseFloat(String(p.precio)).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-mono text-sm ${p.stock < 50 ? "text-red-400" : "text-slate-300"}`}>
                      {p.stock} <span className="text-slate-500 text-xs">{p.unidad}</span>
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
