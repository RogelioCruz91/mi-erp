"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { createClient } from "@supabase/supabase-js";
import "@excalidraw/excalidraw/dist/prod/index.css";

const supabase = createClient(
  "https://gamnenyakraafruvbkin.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbW5lbnlha3JhYWZydXZia2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzU4NDQsImV4cCI6MjA4NTU1MTg0NH0.UpolMRzWNfd4hqBeYvnTrrvDu1C1rmrNXKvnO82y_OQ"
);

const MY_ID    = Math.random().toString(36).slice(2, 8).toUpperCase();
const COLORS   = ["#f97316","#22c55e","#3b82f6","#a855f7","#ec4899","#eab308","#06b6d4","#f43f5e"];
const MY_COLOR = COLORS[Math.floor(Math.random() * COLORS.length)];

type UserInfo   = { id: string; color: string };
type CursorInfo = { x: number; y: number; color: string; id: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type El = any;

// Merge incoming elements by ID so nothing gets erased
function mergeElements(current: El[], incoming: El[]): El[] {
  const map = new Map<string, El>(current.map((el) => [el.id, el]));
  for (const el of incoming) map.set(el.id, el);
  return Array.from(map.values());
}

export default function CollaborativeCanvas({ room }: { room: string }) {
  const [api,     setApi]     = useState<ExcalidrawImperativeAPI | null>(null);
  const [users,   setUsers]   = useState<UserInfo[]>([]);
  const [cursors, setCursors] = useState<Record<string, CursorInfo>>({});
  const [status,  setStatus]  = useState<"connecting" | "connected" | "error">("connecting");

  const channelRef   = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const receiving    = useRef(false);
  const lastCanvas   = useRef(0);
  const lastCursor   = useRef(0);
  // Track appState scroll/zoom to convert scene ↔ viewport coords
  const appStateRef  = useRef({ scrollX: 0, scrollY: 0, zoom: 1 });
  const containerRef = useRef<HTMLDivElement>(null);

  /* ---------- broadcast helpers ---------- */
  const sendCanvas = useCallback((elements: El[]) => {
    const now = Date.now();
    if (now - lastCanvas.current < 150) return;
    lastCanvas.current = now;
    channelRef.current?.send({
      type: "broadcast", event: "canvas",
      payload: { userId: MY_ID, elements: elements.filter((e: El) => !e.isDeleted) },
    });
  }, []);

  const sendCursor = useCallback((sceneX: number, sceneY: number) => {
    const now = Date.now();
    if (now - lastCursor.current < 33) return; // ~30 fps
    lastCursor.current = now;
    channelRef.current?.send({
      type: "broadcast", event: "cursor",
      payload: { userId: MY_ID, color: MY_COLOR, x: sceneX, y: sceneY },
    });
  }, []);

  /* ---------- Supabase channel ---------- */
  useEffect(() => {
    const ch = supabase
      .channel(`pizarra:${room}`)
      // Canvas sync — MERGE, never replace
      .on("broadcast", { event: "canvas" }, ({ payload }) => {
        if (payload.userId === MY_ID || !api) return;
        receiving.current = true;
        const merged = mergeElements([...api.getSceneElements()], payload.elements);
        api.updateScene({ elements: merged });
        setTimeout(() => { receiving.current = false; }, 60);
      })
      // Cursor positions
      .on("broadcast", { event: "cursor" }, ({ payload }) => {
        if (payload.userId === MY_ID) return;
        setCursors((prev) => ({
          ...prev,
          [payload.userId]: { x: payload.x, y: payload.y, color: payload.color, id: payload.userId },
        }));
      })
      // Presence
      .on("presence", { event: "sync" }, () => {
        const state = ch.presenceState<UserInfo>();
        setUsers(Object.values(state).flat() as UserInfo[]);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        setUsers((prev) => [...prev, ...(newPresences as unknown as UserInfo[])]);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        const ids = (leftPresences as unknown as UserInfo[]).map((u) => u.id);
        setUsers((prev) => prev.filter((u) => !ids.includes(u.id)));
        // Remove cursor of users who left
        setCursors((prev) => {
          const next = { ...prev };
          ids.forEach((id) => delete next[id]);
          return next;
        });
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
  }, [room, api]);

  /* ---------- Excalidraw callbacks ---------- */
  const handleChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (elements: readonly any[], appState: { scrollX: number; scrollY: number; zoom: { value: number } }) => {
      appStateRef.current = {
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
        zoom: appState.zoom.value,
      };
      if (!receiving.current) sendCanvas([...elements]);
    },
    [sendCanvas]
  );

  const handlePointerUpdate = useCallback(
    (payload: { pointer: { x: number; y: number } }) => {
      sendCursor(payload.pointer.x, payload.pointer.y);
    },
    [sendCursor]
  );

  /* ---------- scene → viewport conversion ---------- */
  function toViewport(sceneX: number, sceneY: number) {
    const { scrollX, scrollY, zoom } = appStateRef.current;
    // Excalidraw formula: viewport = scene * zoom + scroll
    return { x: sceneX * zoom + scrollX, y: sceneY * zoom + scrollY };
  }

  /* ---------- render ---------- */
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
        {/* User avatars */}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-slate-400 mr-1">{users.length} en sala:</span>
          {users.map((u) => (
            <span
              key={u.id}
              title={u.id === MY_ID ? `${u.id} (tú)` : u.id}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 select-none"
              style={{
                backgroundColor: u.color,
                borderColor: u.id === MY_ID ? "#fff" : "transparent",
              }}
            >
              {u.id[0]}
            </span>
          ))}
        </div>
      </div>

      {/* Canvas + cursor overlays */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <Excalidraw
          excalidrawAPI={(a) => setApi(a)}
          onChange={handleChange}
          onPointerUpdate={handlePointerUpdate}
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

        {/* Remote cursors overlay */}
        {Object.values(cursors).map((cursor) => {
          const vp = toViewport(cursor.x, cursor.y);
          return (
            <div
              key={cursor.id}
              className="absolute pointer-events-none z-50 transition-transform duration-75"
              style={{ left: vp.x, top: vp.y }}
            >
              {/* Cursor SVG */}
              <svg
                width="18" height="18"
                viewBox="0 0 18 18"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" }}
              >
                <path
                  d="M0 0 L0 14 L3.5 10.5 L6.5 17 L8.5 16 L5.5 9.5 L11 9.5 Z"
                  fill={cursor.color}
                  stroke="white"
                  strokeWidth="1"
                />
              </svg>
              {/* Name badge */}
              <span
                className="text-white text-xs font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap ml-2 -mt-1 inline-block"
                style={{ backgroundColor: cursor.color, fontSize: "10px" }}
              >
                {cursor.id}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
