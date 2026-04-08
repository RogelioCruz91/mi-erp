"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/clientes",  icon: "👥", label: "Clientes"  },
  { href: "/productos", icon: "📦", label: "Productos" },
  { href: "/ventas",    icon: "💰", label: "Ventas"    },
  { href: "/tienda",    icon: "🛒", label: "Tienda"    },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`bg-gray-900 text-white flex flex-col shrink-0 transition-all duration-300 ${
        collapsed ? "w-14" : "w-52"
      }`}
    >
      {/* Header */}
      <div className={`flex items-center border-b border-gray-700 h-14 px-3 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && <span className="font-bold text-lg tracking-wide">ERP</span>}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
          title={collapsed ? "Expandir" : "Contraer"}
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {NAV.map(({ href, icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-colors text-sm ${
                active
                  ? "bg-orange-700 text-white"
                  : "text-gray-400 hover:bg-gray-700 hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <span className="text-lg shrink-0">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-gray-700">
          <p className="text-xs text-gray-500">Ferretería ERP v1.0</p>
        </div>
      )}
    </aside>
  );
}
