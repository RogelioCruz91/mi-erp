"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Cliente = {
  id: number;
  nombre: string;
  email?: string;
  telefono?: string;
};

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("clientes").select("*");
      if (!error && data) setClientes(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Clientes</h1>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : clientes.length === 0 ? (
        <p className="text-gray-500">No hay clientes registrados.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Telefono</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{c.nombre}</td>
                  <td className="px-4 py-3">{c.email ?? "-"}</td>
                  <td className="px-4 py-3">{c.telefono ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
