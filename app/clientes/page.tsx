"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://gamnenyakraafruvbkin.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbW5lbnlha3JhYWZydXZia2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzU4NDQsImV4cCI6MjA4NTU1MTg0NH0.UpolMRzWNfd4hqBeYvnTrrvDu1C1rmrNXKvnO82y_OQ"
);

type Cliente = {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  ciudad: string;
};

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState("");

  useEffect(() => {
    supabase
      .from("clientes")
      .select("*")
      .order("id", { ascending: true })
      .then(({ data }) => {
        if (data) setClientes(data);
        setLoading(false);
      });
  }, []);

  const filtrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
    c.ciudad?.toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <span className="text-slate-400 text-sm">{clientes.length} registros</span>
      </div>

      <input
        className="w-full bg-slate-800 border border-slate-600 text-white rounded-md px-4 py-2 text-sm mb-4 focus:outline-none focus:border-green-500"
        placeholder="Buscar por nombre o ciudad..."
        value={buscar}
        onChange={(e) => setBuscar(e.target.value)}
      />

      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Telefono</th>
              <th className="px-4 py-3 text-left">Ciudad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Sin resultados.</td></tr>
            ) : (
              filtrados.map((c) => (
                <tr key={c.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-3 text-slate-400">{c.id}</td>
                  <td className="px-4 py-3 text-white font-medium">{c.nombre}</td>
                  <td className="px-4 py-3 text-slate-300">{c.email ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-300">{c.telefono ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded">{c.ciudad ?? "-"}</span>
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
