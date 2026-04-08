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

type ItemCarrito = Producto & { cantidad: number };

const EMOJIS: Record<string, string> = {
  "Alimentos preparados": "🍱",
  "Panadería":            "🍞",
  "Postres":              "🍰",
  "Frutas":               "🍎",
  "Carnes":               "🥩",
  "Mariscos":             "🦐",
  "Bebidas":              "🥤",
  "Granos":               "🌾",
  "Lácteos":              "🥛",
  "Condimentos":          "🧂",
  "Vegetales":            "🥦",
};

const CATEGORIA_COLOR: Record<string, string> = {
  "Alimentos preparados": "bg-orange-900/50 text-orange-300 border-orange-700",
  "Panadería":            "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  "Postres":              "bg-pink-900/50 text-pink-300 border-pink-700",
  "Frutas":               "bg-green-900/50 text-green-300 border-green-700",
  "Carnes":               "bg-red-900/50 text-red-300 border-red-700",
  "Mariscos":             "bg-blue-900/50 text-blue-300 border-blue-700",
  "Bebidas":              "bg-cyan-900/50 text-cyan-300 border-cyan-700",
  "Granos":               "bg-amber-900/50 text-amber-300 border-amber-700",
  "Lácteos":              "bg-slate-700/50 text-slate-300 border-slate-600",
  "Condimentos":          "bg-purple-900/50 text-purple-300 border-purple-700",
  "Vegetales":            "bg-lime-900/50 text-lime-300 border-lime-700",
};

export default function Tienda() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [buscar, setBuscar] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [comprando, setComprando] = useState(false);
  const [msgCompra, setMsgCompra] = useState("");
  const [cliente, setCliente] = useState("");

  useEffect(() => {
    supabase
      .from("productos")
      .select("*")
      .order("categoria")
      .then(({ data }) => { if (data) setProductos(data); });
  }, []);

  const categorias = ["Todas", ...Array.from(new Set(productos.map((p) => p.categoria)))];

  const filtrados = productos.filter((p) => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(buscar.toLowerCase());
    const coincideCategoria = categoriaFiltro === "Todas" || p.categoria === categoriaFiltro;
    return coincideBusqueda && coincideCategoria;
  });

  function agregarAlCarrito(p: Producto) {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.id === p.id);
      if (existe) return prev.map((i) => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { ...p, cantidad: 1 }];
    });
  }

  function cambiarCantidad(id: number, delta: number) {
    setCarrito((prev) =>
      prev
        .map((i) => i.id === id ? { ...i, cantidad: i.cantidad + delta } : i)
        .filter((i) => i.cantidad > 0)
    );
  }

  const totalCarrito = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const totalItems   = carrito.reduce((s, i) => s + i.cantidad, 0);

  async function confirmarCompra() {
    if (!cliente.trim()) { setMsgCompra("Ingresa el nombre del cliente."); return; }
    if (carrito.length === 0) return;
    setComprando(true);
    const { error } = await supabase.from("ventas").insert({
      cliente: cliente.trim(),
      total: totalCarrito,
      fecha: new Date().toISOString(),
    });
    if (error) {
      setMsgCompra("Error al registrar: " + error.message);
    } else {
      setMsgCompra("✅ Venta registrada correctamente.");
      setCarrito([]);
      setCliente("");
      setTimeout(() => { setMsgCompra(""); setCarritoAbierto(false); }, 2000);
    }
    setComprando(false);
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tienda</h1>
          <p className="text-slate-400 text-sm mt-1">{filtrados.length} productos disponibles</p>
        </div>
        <button
          onClick={() => setCarritoAbierto(true)}
          className="relative bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          🛒 Carrito
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          className="flex-1 min-w-48 bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-green-500"
          placeholder="Buscar producto..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaFiltro(cat)}
              className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                categoriaFiltro === cat
                  ? "bg-green-700 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {cat === "Todas" ? "Todas" : `${EMOJIS[cat] ?? ""} ${cat}`}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtrados.map((p) => {
          const enCarrito = carrito.find((i) => i.id === p.id);
          const sinStock = p.stock === 0;
          return (
            <div
              key={p.id}
              className="bg-slate-800 rounded-xl p-4 flex flex-col gap-3 border border-slate-700 hover:border-slate-500 transition-colors"
            >
              {/* Emoji grande */}
              <div className="text-5xl text-center py-4 bg-slate-900 rounded-lg">
                {EMOJIS[p.categoria] ?? "📦"}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm leading-tight mb-1">{p.nombre}</h3>
                <span className={`text-xs px-2 py-0.5 rounded border ${CATEGORIA_COLOR[p.categoria] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
                  {p.categoria}
                </span>
              </div>

              {/* Precio y stock */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-green-400 font-bold text-lg">S/ {parseFloat(String(p.precio)).toFixed(2)}</p>
                  <p className={`text-xs ${sinStock ? "text-red-400" : p.stock < 50 ? "text-yellow-400" : "text-slate-400"}`}>
                    {sinStock ? "Sin stock" : `${p.stock} ${p.unidad} disponibles`}
                  </p>
                </div>
              </div>

              {/* Botón agregar */}
              {sinStock ? (
                <button disabled className="w-full py-2 rounded-lg bg-slate-700 text-slate-500 text-sm cursor-not-allowed">
                  Sin stock
                </button>
              ) : enCarrito ? (
                <div className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-1">
                  <button onClick={() => cambiarCantidad(p.id, -1)} className="text-white text-lg px-2 hover:text-red-400">−</button>
                  <span className="text-white font-bold">{enCarrito.cantidad}</span>
                  <button onClick={() => cambiarCantidad(p.id, +1)} className="text-white text-lg px-2 hover:text-green-400">+</button>
                </div>
              ) : (
                <button
                  onClick={() => agregarAlCarrito(p)}
                  className="w-full py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm transition-colors"
                >
                  + Agregar
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Panel carrito */}
      {carritoAbierto && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setCarritoAbierto(false)} />
          <div className="w-96 bg-slate-900 border-l border-slate-700 flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-white font-bold text-lg">🛒 Carrito</h2>
              <button onClick={() => setCarritoAbierto(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {carrito.length === 0 ? (
                <p className="text-slate-500 text-center mt-10">El carrito está vacío.</p>
              ) : (
                carrito.map((item) => (
                  <div key={item.id} className="bg-slate-800 rounded-lg p-3 flex items-center gap-3">
                    <span className="text-2xl">{EMOJIS[item.categoria] ?? "📦"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.nombre}</p>
                      <p className="text-green-400 text-xs">S/ {(item.precio * item.cantidad).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => cambiarCantidad(item.id, -1)} className="text-slate-400 hover:text-red-400 w-6 h-6 flex items-center justify-center">−</button>
                      <span className="text-white text-sm w-4 text-center">{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(item.id, +1)} className="text-slate-400 hover:text-green-400 w-6 h-6 flex items-center justify-center">+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {carrito.length > 0 && (
              <div className="p-4 border-t border-slate-700 flex flex-col gap-3">
                <div className="flex justify-between text-white font-bold text-lg">
                  <span>Total</span>
                  <span className="text-green-400">S/ {totalCarrito.toFixed(2)}</span>
                </div>
                <input
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  placeholder="Nombre del cliente..."
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                />
                {msgCompra && (
                  <p className={`text-sm ${msgCompra.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>{msgCompra}</p>
                )}
                <button
                  onClick={confirmarCompra}
                  disabled={comprando}
                  className="w-full py-3 bg-green-700 hover:bg-green-600 disabled:bg-slate-600 text-white font-bold rounded-lg transition-colors"
                >
                  {comprando ? "Registrando..." : "Confirmar compra"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
