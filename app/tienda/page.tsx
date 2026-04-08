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

const CAT_EMOJI: Record<string, string> = {
  "Lija Agua-Seco": "💧",
  "Lija Fierro":    "🔩",
  "Lija Agua":      "🌊",
  "Lija Microfina": "✨",
  "Lija Madera":    "🪵",
  "Lija 3M":        "🔵",
};

const CAT_COLOR: Record<string, string> = {
  "Lija Agua-Seco": "bg-blue-900/60 text-blue-300 border-blue-700",
  "Lija Fierro":    "bg-orange-900/60 text-orange-300 border-orange-700",
  "Lija Agua":      "bg-cyan-900/60 text-cyan-300 border-cyan-700",
  "Lija Microfina": "bg-purple-900/60 text-purple-300 border-purple-700",
  "Lija Madera":    "bg-amber-900/60 text-amber-300 border-amber-700",
  "Lija 3M":        "bg-red-900/60 text-red-300 border-red-700",
};

function granoDe(nombre: string) {
  const m = nombre.match(/GR\.(\d+)|P(\d+)\s/);
  return m ? `G${m[1] || m[2]}` : "";
}

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
      .order("nombre")
      .then(({ data }) => { if (data) setProductos(data); });
  }, []);

  const categorias = ["Todas", ...Array.from(new Set(productos.map((p) => p.categoria)))];

  const filtrados = productos.filter((p) => {
    const q = buscar.toLowerCase();
    return (
      (p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q)) &&
      (categoriaFiltro === "Todas" || p.categoria === categoriaFiltro)
    );
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
      prev.map((i) => i.id === id ? { ...i, cantidad: i.cantidad + delta } : i)
          .filter((i) => i.cantidad > 0)
    );
  }

  const totalCarrito = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const totalItems   = carrito.reduce((s, i) => s + i.cantidad, 0);

  async function confirmarCompra() {
    if (!cliente.trim()) { setMsgCompra("Ingresa el nombre del cliente."); return; }
    setComprando(true);
    const { error } = await supabase.from("ventas").insert({
      cliente: cliente.trim(),
      total: totalCarrito,
      fecha: new Date().toISOString(),
    });
    if (error) {
      setMsgCompra("Error: " + error.message);
    } else {
      setMsgCompra("✅ Venta registrada.");
      setCarrito([]);
      setCliente("");
      setTimeout(() => { setMsgCompra(""); setCarritoAbierto(false); }, 2000);
    }
    setComprando(false);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Ferretería — Catálogo de Lijas</h1>
          <p className="text-slate-400 text-sm mt-1">{filtrados.length} productos</p>
        </div>
        <button
          onClick={() => setCarritoAbierto(true)}
          className="relative bg-orange-700 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          🛒 Cotización
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Buscador */}
      <input
        className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-2 text-sm mb-3 focus:outline-none focus:border-orange-500"
        placeholder="Buscar por nombre o grano (ej: GR.120, Fierro, Agua...)"
        value={buscar}
        onChange={(e) => setBuscar(e.target.value)}
      />

      {/* Filtros de categoría */}
      <div className="flex gap-2 flex-wrap mb-5">
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaFiltro(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              categoriaFiltro === cat
                ? "bg-orange-700 border-orange-600 text-white"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {cat === "Todas" ? "🔧 Todas" : `${CAT_EMOJI[cat] ?? "📦"} ${cat}`}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtrados.map((p) => {
          const enCarrito = carrito.find((i) => i.id === p.id);
          const sinStock  = p.stock === 0;
          const grano     = granoDe(p.nombre);
          return (
            <div
              key={p.id}
              className="bg-slate-800 rounded-xl p-3 flex flex-col gap-2 border border-slate-700 hover:border-slate-500 transition-colors"
            >
              {/* Icono + grano */}
              <div className="text-3xl text-center py-3 bg-slate-900 rounded-lg relative">
                {CAT_EMOJI[p.categoria] ?? "📦"}
                {grano && (
                  <span className="absolute top-1 right-1 text-xs font-bold text-slate-400 font-mono">
                    {grano}
                  </span>
                )}
              </div>

              {/* Nombre */}
              <p className="text-white text-xs font-medium leading-tight line-clamp-2" title={p.nombre}>
                {p.nombre}
              </p>

              {/* Categoria */}
              <span className={`text-xs px-1.5 py-0.5 rounded border w-fit ${CAT_COLOR[p.categoria] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
                {p.categoria}
              </span>

              {/* Precio y stock */}
              <div className="mt-auto">
                <p className="text-orange-400 font-bold text-base">S/ {parseFloat(String(p.precio)).toFixed(2)}</p>
                <p className={`text-xs ${sinStock ? "text-red-400" : p.stock < 50 ? "text-yellow-400" : "text-slate-400"}`}>
                  {sinStock ? "Sin stock" : `Stock: ${p.stock} ${p.unidad}`}
                </p>
              </div>

              {/* Botón */}
              {sinStock ? (
                <button disabled className="w-full py-1.5 rounded-lg bg-slate-700 text-slate-500 text-xs cursor-not-allowed">Sin stock</button>
              ) : enCarrito ? (
                <div className="flex items-center justify-between bg-slate-900 rounded-lg px-2 py-1">
                  <button onClick={() => cambiarCantidad(p.id, -1)} className="text-white text-base px-1 hover:text-red-400">−</button>
                  <span className="text-white text-sm font-bold">{enCarrito.cantidad}</span>
                  <button onClick={() => cambiarCantidad(p.id, +1)} className="text-white text-base px-1 hover:text-green-400">+</button>
                </div>
              ) : (
                <button
                  onClick={() => agregarAlCarrito(p)}
                  className="w-full py-1.5 rounded-lg bg-orange-700 hover:bg-orange-600 text-white text-xs transition-colors"
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
              <h2 className="text-white font-bold text-lg">🛒 Cotización</h2>
              <button onClick={() => setCarritoAbierto(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {carrito.length === 0 ? (
                <p className="text-slate-500 text-center mt-10">Sin productos agregados.</p>
              ) : (
                carrito.map((item) => (
                  <div key={item.id} className="bg-slate-800 rounded-lg p-3 flex items-start gap-3">
                    <span className="text-xl mt-0.5">{CAT_EMOJI[item.categoria] ?? "📦"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium leading-tight">{item.nombre}</p>
                      <p className="text-orange-400 text-xs mt-1">
                        {item.cantidad} {item.unidad} × S/ {item.precio.toFixed(2)} = <b>S/ {(item.precio * item.cantidad).toFixed(2)}</b>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => cambiarCantidad(item.id, -1)} className="text-slate-400 hover:text-red-400 w-5 h-5 flex items-center justify-center">−</button>
                      <span className="text-white text-sm w-5 text-center">{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(item.id, +1)} className="text-slate-400 hover:text-green-400 w-5 h-5 flex items-center justify-center">+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {carrito.length > 0 && (
              <div className="p-4 border-t border-slate-700 flex flex-col gap-3">
                <div className="text-slate-400 text-xs">{totalItems} paquete(s) seleccionados</div>
                <div className="flex justify-between text-white font-bold text-lg">
                  <span>Total</span>
                  <span className="text-orange-400">S/ {totalCarrito.toFixed(2)}</span>
                </div>
                <input
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
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
                  className="w-full py-3 bg-orange-700 hover:bg-orange-600 disabled:bg-slate-600 text-white font-bold rounded-lg transition-colors"
                >
                  {comprando ? "Registrando..." : "Confirmar venta"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
