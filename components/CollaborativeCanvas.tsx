"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { createClient } from "@supabase/supabase-js";

// Load excalidraw CSS at runtime from CDN to avoid build-time package exports issues

const supabase = createClient(
  "https://gamnenyakraafruvbkin.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbW5lbnlha3JhYWZydXZia2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzU4NDQsImV4cCI6MjA4NTU1MTg0NH0.UpolMRzWNfd4hqBeYvnTrrvDu1C1rmrNXKvnO82y_OQ"
);

const MY_ID    = Math.random().toString(36).slice(2, 8).toUpperCase();
const COLORS   = ["#f97316","#22c55e","#3b82f6","#a855f7","#ec4899","#eab308","#06b6d4","#f43f5e"];
const MY_COLOR = COLORS[Math.floor(Math.random() * COLORS.length)];

type UserInfo   = { id: string; color: string };
type CursorInfo = { xFrac: number; yFrac: number; color: string; id: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type El = any;

function mergeElements(current: El[], incoming: El[]): El[] {
  const map = new Map<string, El>(current.map((el) => [el.id, el]));
  for (const el of incoming) map.set(el.id, el);
  return Array.from(map.values());
}

export default function CollaborativeCanvas({ room }: { room: string }) {
  const [users,   setUsers]   = useState<UserInfo[]>([]);
  const [cursors, setCursors] = useState<Record<string, CursorInfo>>({});
  const [status,  setStatus]  = useState<"connecting" | "connected" | "error">("connecting");

  // Use ref for api so channel handlers don't need it as a dependency
  const apiRef       = useRef<ExcalidrawImperativeAPI | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Inject excalidraw CSS from CDN once (avoids build-time package exports resolution)
  useEffect(() => {
    const id = "excalidraw-css";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.1/dist/prod/index.css";
    document.head.appendChild(link);
  }, []);
  const channelRef  = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const receiving   = useRef(false);
  const loaded      = useRef(false);
  const lastCanvas  = useRef(0);
  const lastCursor  = useRef(0);
  const lastSave    = useRef(0);

  /* ── Persistence: save (throttled 3 s) ── */
  const saveToDb = useCallback((elements: El[]) => {
    const now = Date.now();
    if (now - lastSave.current < 3000) return;
    lastSave.current = now;
    supabase
      .from("pizarras")
      .upsert({ room, elements: elements.filter((e: El) => !e.isDeleted), updated_at: new Date().toISOString() })
      .then(({ error }) => { if (error) console.error("save error", error); });
  }, [room]);

  /* ── Realtime broadcast helpers ── */
  const sendCanvas = useCallback((elements: El[]) => {
    const now = Date.now();
    if (now - lastCanvas.current < 150) return;
    lastCanvas.current = now;
    channelRef.current?.send({
      type: "broadcast", event: "canvas",
      payload: { userId: MY_ID, elements: elements.filter((e: El) => !e.isDeleted) },
    });
  }, []);

  const sendCursor = useCallback((xFrac: number, yFrac: number) => {
    const now = Date.now();
    if (now - lastCursor.current < 40) return;
    lastCursor.current = now;
    channelRef.current?.send({
      type: "broadcast", event: "cursor",
      payload: { userId: MY_ID, color: MY_COLOR, xFrac, yFrac },
    });
  }, []);

  /* ── Supabase channel (created once per room, uses apiRef) ── */
  useEffect(() => {
    loaded.current = false;

    const ch = supabase
      .channel(`pizarra:${room}`)
      .on("broadcast", { event: "canvas" }, ({ payload }) => {
        const api = apiRef.current;
        if (payload.userId === MY_ID || !api) return;
        receiving.current = true;
        const merged = mergeElements([...api.getSceneElements()], payload.elements);
        api.updateScene({ elements: merged });
        setTimeout(() => { receiving.current = false; }, 60);
      })
      .on("broadcast", { event: "cursor" }, ({ payload }) => {
        if (payload.userId === MY_ID) return;
        setCursors((prev) => ({
          ...prev,
          [payload.userId]: { xFrac: payload.xFrac, yFrac: payload.yFrac, color: payload.color, id: payload.userId },
        }));
      })
      .on("presence", { event: "sync" }, () => {
        const state = ch.presenceState<UserInfo>();
        setUsers(Object.values(state).flat() as UserInfo[]);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        const ids = (leftPresences as unknown as UserInfo[]).map((u) => u.id);
        setUsers((prev) => prev.filter((u) => !ids.includes(u.id)));
        setCursors((prev) => { const n = { ...prev }; ids.forEach((id) => delete n[id]); return n; });
      })
      .subscribe(async (s) => {
        if (s === "SUBSCRIBED") {
          setStatus("connected");
          await ch.track({ id: MY_ID, color: MY_COLOR } as UserInfo);
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
          setStatus("error");
        }
      });

    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]); // room only — api accessed via ref

  /* ── Load from DB when api is ready ── */
  const handleApiReady = useCallback((api: ExcalidrawImperativeAPI) => {
    apiRef.current = api;
    if (loaded.current) return;
    loaded.current = true;
    supabase
      .from("pizarras")
      .select("elements")
      .eq("room", room)
      .single()
      .then(({ data, error }) => {
        if (error) { console.error("load error", error); return; }
        if (data?.elements?.length) {
          api.updateScene({ elements: data.elements });
        }
      });
  }, [room]);

  /* ── onChange: broadcast + save ── */
  const handleChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (elements: readonly any[]) => {
      if (!receiving.current) {
        const arr = [...elements];
        sendCanvas(arr);
        saveToDb(arr);
      }
    },
    [sendCanvas, saveToDb]
  );

  /* ── Cursor: listen on window to capture events even inside Excalidraw canvas ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Only track when mouse is inside the canvas container
      if (e.clientX < rect.left || e.clientX > rect.right ||
          e.clientY < rect.top  || e.clientY > rect.bottom) return;
      const xFrac = (e.clientX - rect.left) / rect.width;
      const yFrac = (e.clientY - rect.top)  / rect.height;
      sendCursor(xFrac, yFrac);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [sendCursor]);

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-4 py-2 bg-slate-800 border-b border-slate-700 shrink-0 text-xs">
        <span className="font-semibold text-white">
          🎨 Pizarra: <span className="text-orange-400">{room}</span>
        </span>
        <span className={`px-2 py-0.5 rounded-full font-mono ${
          status === "connected" ? "bg-green-900 text-green-300"
          : status === "error"   ? "bg-red-900 text-red-300"
          :                        "bg-yellow-900 text-yellow-300"
        }`}>
          {status === "connected" ? "● En línea" : status === "error" ? "✕ Error" : "◌ Conectando"}
        </span>
        <span className="text-slate-400">
          Tú: <b className="font-mono" style={{ color: MY_COLOR }}>{MY_ID}</b>
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-slate-400 mr-1">{users.length} en sala:</span>
          {users.map((u) => (
            <span
              key={u.id}
              title={u.id === MY_ID ? `${u.id} (tú)` : u.id}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 select-none"
              style={{ backgroundColor: u.color, borderColor: u.id === MY_ID ? "#fff" : "transparent" }}
            >
              {u.id[0]}
            </span>
          ))}
        </div>
      </div>

      {/* Canvas + cursor overlays */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <Excalidraw
          excalidrawAPI={handleApiReady}
          onChange={handleChange}
          initialData={{ appState: { viewBackgroundColor: "#0f172a", theme: "dark" } }}
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
              <WelcomeScreen.Center.Heading>
                Pizarra colaborativa — sala: {room}
              </WelcomeScreen.Center.Heading>
              <WelcomeScreen.Center.Menu>
                <WelcomeScreen.Center.MenuItemHelp />
              </WelcomeScreen.Center.Menu>
            </WelcomeScreen.Center>
          </WelcomeScreen>
        </Excalidraw>

        {/* Remote cursors */}
        {Object.values(cursors).map((cursor) => (
          <div
            key={cursor.id}
            className="absolute pointer-events-none z-50"
            style={{ left: `${cursor.xFrac * 100}%`, top: `${cursor.yFrac * 100}%` }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18"
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.7))" }}>
              <path
                d="M0 0 L0 14 L3.5 10.5 L6.5 17 L8.5 16 L5.5 9.5 L11 9.5 Z"
                fill={cursor.color} stroke="white" strokeWidth="1"
              />
            </svg>
            <span
              className="text-white font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap ml-1 inline-block"
              style={{ backgroundColor: cursor.color, fontSize: "10px" }}
            >
              {cursor.id}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
