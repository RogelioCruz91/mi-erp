import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mi ERP",
  description: "Sistema ERP moderno con IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="w-52 bg-gray-900 text-white flex flex-col p-4 gap-2 shrink-0">
          <h2 className="text-xl font-bold mb-4 text-white">ERP</h2>
          <nav className="flex flex-col gap-1">
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded hover:bg-gray-700 transition-colors text-sm"
            >
              Dashboard
            </Link>
            <Link
              href="/clientes"
              className="px-3 py-2 rounded hover:bg-gray-700 transition-colors text-sm"
            >
              Clientes
            </Link>
            <Link
              href="/productos"
              className="px-3 py-2 rounded hover:bg-gray-700 transition-colors text-sm"
            >
              Productos
            </Link>
            <Link
              href="/ventas"
              className="px-3 py-2 rounded hover:bg-gray-700 transition-colors text-sm"
            >
              Ventas
            </Link>
          </nav>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 p-8">{children}</main>
      </body>
    </html>
  );
}
