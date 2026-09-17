"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { createClient } from "@supabase/supabase-js";
import "@excalidraw/excalidraw/index.css";

const supabase = createClient(
  "https://gamnenyakraafruvbkin.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbW5lbnlha3JhYWZydXZia2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzU4NDQsImV4cCI6MjA4NTU1MTg0NH0.UpolMRzWNfd4hqBeYvnTrrvDu1C1rmrNXKvnO82y_OQ"
);

const MY_ID = Math.random().toString(36).slice(2, 8).toUpperCase();
const COLORS = ["#f97316","#22c55e","#3b82f6","#a855f7","#ec4899","#eab308","#06b6d4"];
const MY_COLOR = COLORS[Math.floor(Math.random() * COLORS.length)];

type UserInfo = { id: string; color: string; name: string };

export default function CollaborativeCanvas({ room }: { room: string }) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const lastTs = useRef(0);
  const receiving = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Broadcast canvas changes (throttled 200ms)
  const broadcast = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (elements: any[]) => {
      const now = Date.now();
      if (now - lastTs.current < 200) return;
      lastTs.current = now;
      channelRef.current?.send({
        type: "broadcast",
        event: "canvas",
        payload: { userId: MY_ID, elements },
      });
    },
    []
  );

  useEffect(() => {
    const ch = supabase
      .channel(`pizarra:${room}`)
      // Receive canvas updates from other users
      .on("broadcast", { event: "canvas" }, ({ payload }) => {
        if (payload.userId === MY_ID || !api) return;
        receiving.current = true;
        api.updateScene({ elements: payload.elements });
        setTimeout(() => { receiving.current = false; }, 50);
      })
      // Presence: track connected users
      .on("presence", { event: "sync" }, () => {
        const state = ch.presenceState<UserInfo>();
        const list = Object.values(state).flat();
        setUsers(list);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        setUsers((prev) => [...prev, ...(newPresences as unknown as UserInfo[])]);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        const ids = (leftPresences as unknown as UserInfo[]).map((u) => u.id);
        setUsers((prev) => prev.filter((u) => !ids.includes(u.id)));
      })
      .subscribe(async (s) => {
        if (s === "SUBSCRIBED") {
          setStatus("connected");
          await ch.track({ id: MY_ID, color: MY_COLOR, name: `Usuario ${MY_ID}` } as UserInfo);
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
          setStatus("error");
        }
      });

    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [room, api]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = useCallback((elements: any) => {
    if (!receiving.current) broadcast(elements);
  }, [broadcast]);

  return (
    <div className="flex flex-col h-full">
      {/* Barra superior */}
      <div className="flex items-center gap-4 px-4 py-2 bg-slate-800 border-b border-slate-700 shrink-0 text-xs">
        <span className="font-semibold text-white">🎨 Pizarra: <span className="text-orange-400">{room}</span></span>
        <span className={`px-2 py-0.5 rounded-full font-mono ${
          status === "connected" ? "bg-green-900 text-green-300"
          : status === "error"   ? "bg-red-900 text-red-300"
          :                        "bg-yellow-900 text-yellow-300"
        }`}>
          {status === "connected" ? "● En línea" : status === "error" ? "✕ Error" : "◌ Conectando"}
        </span>
        <span className="text-slate-400">Tu ID: <b className="font-mono" style={{ color: MY_COLOR }}>{MY_ID}</b></span>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-slate-400 mr-1">{users.length} conectado(s):</span>
          {users.map((u) => (
            <span key={u.id} title={u.id === MY_ID ? "Tú" : `Usuario ${u.id}`}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs border-2"
              style={{ backgroundColor: u.color, borderColor: u.id === MY_ID ? "#fff" : "transparent" }}
            >
              {u.id[0]}
            </span>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <Excalidraw
          excalidrawAPI={(a) => setApi(a)}
          onChange={(elements) => handleChange(elements)}
          initialData={{
            appState: { viewBackgroundColor: "#0f172a", theme: "dark" },
          }}
          langCode="es-ES"
        >
          <MainMenu>
            <MainMenu.DefaultItems.ClearCanvas />
            <MainMenu.DefaultItems.SaveAsImage />
            <MainMenu.DefaultItems.Export />
            <MainMenu.DefaultItems.Help />
          </MainMenu>
          <WelcomeScreen>
            <WelcomeScreen.Hints.MenuHint />
            <WelcomeScreen.Hints.ToolbarHint />
            <WelcomeScreen.Center>
              <WelcomeScreen.Center.Logo />
              <WelcomeScreen.Center.Tagline>
                Pizarra colaborativa — sala: {room}
              </WelcomeScreen.Center.Tagline>
              <WelcomeScreen.Center.Menu>
                <WelcomeScreen.Center.MenuItemHelp />
              </WelcomeScreen.Center.Menu>
            </WelcomeScreen.Center>
          </WelcomeScreen>
        </Excalidraw>
      </div>
    </div>
  );
}
