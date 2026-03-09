"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const REFRESH_MS = 5 * 60 * 1000;

interface Job {
  id: string; title: string; company: string;
  location: string; url: string; posted: string;
  source: string; remote: boolean;
}
interface Meta {
  total: number; scanned: number; timestamp: string;
  lookback_mins: number;
  sources: { greenhouse: number; lever: number; ashby: number; workday: number };
}

const ROLE_COLORS: Record<string, string> = {
  "power bi": "#f7b731", "bi developer": "#f7b731", "bi analyst": "#f7b731",
  "business intelligence": "#f7b731",
  "data engineer": "#ff6b6b", "etl": "#ff6b6b",
  "analytics engineer": "#26de81",
  "financial analyst": "#45aaf2",
  "business analyst": "#a55eea", "business operations": "#a55eea",
  "data analyst": "#00d4aa", "reporting analyst": "#00d4aa",
  "senior analyst": "#00d4aa", "sr. analyst": "#00d4aa",
  "compliance": "#fd9644",
  "data steward": "#fd9644", "data infrastructure": "#58a6ff",
};

function roleColor(title = "") {
  const t = title.toLowerCase();
  for (const [k, v] of Object.entries(ROLE_COLORS)) if (t.includes(k)) return v;
  return "#7f8ea3";
}

const SOURCE_META: Record<string, [string, string]> = {
  greenhouse: ["GH", "#3ddc84"],
  lever:      ["LV", "#00b4d8"],
  ashby:      ["AB", "#ff85c2"],
  workday:    ["WD", "#e8a838"],
};

function timeAgo(d: string) {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

const FILTERS = [
  ["all","All"], ["remote","Remote"], ["analyst","Analyst"],
  ["engineer","Engineer"], ["bi","BI / Power BI"], ["financial","Financial"],
  ["workday","Workday"], ["greenhouse","Greenhouse"],
  ["lever","Lever"], ["ashby","Ashby"],
];

export default function Page() {
  const [jobs, setJobs]         = useState<Job[]>([]);
  const [meta, setMeta]         = useState<Meta | null>(null);
  const [loading, setLoading]   = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [countdown, setCd]      = useState(REFRESH_MS / 1000);
  const [newIds, setNewIds]     = useState(new Set<string>());
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [error, setError]       = useState<string | null>(null);
  const seenUrls = useRef(new Set<string>());
  const timerRef = useRef<NodeJS.Timeout>();
  const cdRef    = useRef<NodeJS.Timeout>();

  const runFetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/jobs");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json() as { jobs: Job[]; meta: Meta };
      const fresh = new Set<string>();
      data.jobs.forEach(j => { if (!seenUrls.current.has(j.url)) fresh.add(j.id); });
      data.jobs.forEach(j => seenUrls.current.add(j.url));
      setNewIds(fresh);
      setJobs(data.jobs);
      setMeta(data.meta);
      setLastFetch(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fetch failed");
    }
    setLoading(false);
    setCd(REFRESH_MS / 1000);
  }, []);

  useEffect(() => {
    runFetch();
    timerRef.current = setInterval(runFetch, REFRESH_MS);
    cdRef.current    = setInterval(() => setCd(c => c > 0 ? c - 1 : REFRESH_MS / 1000), 1000);
    return () => { clearInterval(timerRef.current); clearInterval(cdRef.current); };
  }, [runFetch]);

  const filtered = jobs.filter(j => {
    const s = search.toLowerCase();
    const ms = !s || j.title.toLowerCase().includes(s) || j.company.toLowerCase().includes(s);
    const t = j.title.toLowerCase();
    const mf =
      filter === "all"        ? true :
      filter === "remote"     ? j.remote :
      filter === "analyst"    ? t.includes("analyst") :
      filter === "engineer"   ? t.includes("engineer") :
      filter === "bi"         ? (t.includes("bi") || t.includes("power bi") || t.includes("business intel")) :
      filter === "financial"  ? t.includes("financial") :
      filter === "workday"    ? j.source === "workday" :
      filter === "greenhouse" ? j.source === "greenhouse" :
      filter === "lever"      ? j.source === "lever" :
      filter === "ashby"      ? j.source === "ashby" : true;
    return ms && mf;
  });

  const mins = String(Math.floor(countdown / 60)).padStart(2, "0");
  const secs = String(countdown % 60).padStart(2, "0");
  const R = 22, circ = 2 * Math.PI * R;
  const pct = ((REFRESH_MS / 1000 - countdown) / (REFRESH_MS / 1000)) * 100;

  const S: Record<string, React.CSSProperties> = {
    wrap: { fontFamily: "'DM Mono',monospace", background: "#05080f", minHeight: "100vh", color: "#c9d1d9" },
    header: { background: "linear-gradient(180deg,#0d1117,#080c14)", borderBottom: "1px solid #161b22",
               padding: "18px 24px 14px", position: "sticky", top: 0, zIndex: 50 },
    titleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const },
    dot: (live: boolean, err: boolean): React.CSSProperties => ({
      width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
      background: err ? "#ff6b6b" : live ? "#e3b341" : "#3fb950",
      boxShadow: `0 0 12px ${err ? "#ff6b6b" : live ? "#e3b341" : "#3fb950"}`,
      animation: live ? "blink .6s infinite" : "none",
    }),
    badge: { fontSize: 9, padding: "2px 8px", letterSpacing: 1.2,
             background: "#3fb95018", border: "1px solid #3fb95040", color: "#3fb950", borderRadius: 3 },
    subtext: { fontSize: 10, color: "#30363d", marginTop: 3 },
    statNum: (color: string): React.CSSProperties => ({ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }),
    statLbl: { fontSize: 9, color: "#30363d", letterSpacing: 1 },
    btn: (active: boolean): React.CSSProperties => ({
      background: active ? "#3fb95018" : "transparent",
      border: `1px solid ${active ? "#3fb950" : "#21262d"}`,
      color: active ? "#3fb950" : "#484f58",
      padding: "5px 11px", borderRadius: 4, cursor: "pointer",
      fontSize: 10, fontFamily: "inherit", letterSpacing: .8, textTransform: "uppercase",
    }),
    input: { background: "#0d1117", border: "1px solid #21262d", color: "#c9d1d9",
             padding: "6px 12px", borderRadius: 5, fontSize: 11, fontFamily: "inherit",
             width: 190, outline: "none" },
    card: (isNew: boolean): React.CSSProperties => ({
      background: isNew ? "#0c1a10" : "#0d1117",
      border: `1px solid ${isNew ? "#3fb95030" : "#161b22"}`,
      borderRadius: 7, padding: "13px 16px", marginBottom: 7,
      display: "flex", alignItems: "flex-start", gap: 13,
      transition: "background .15s",
      animation: isNew ? "slideIn .35s ease" : "none",
      cursor: "default",
    }),
  };

  return (
    <div style={S.wrap}>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:#05080f}
        ::-webkit-scrollbar-thumb{background:#21262d;border-radius:2px}
        ::placeholder{color:#30363d}
        a:hover{opacity:.85}
      `}</style>

      {/* ── HEADER ── */}
      <div style={S.header}>
        <div style={S.titleRow}>
          {/* Left: branding */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
              <div style={S.dot(loading, !!error)} />
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize: 17, fontWeight: 800,
                             color: "#f0f6fc", letterSpacing: -0.5 }}>
                VASANTH / JOB RADAR
              </span>
              <span style={S.badge}>LIVE</span>
            </div>
            <div style={S.subtext}>
              No API key · No Apify · Greenhouse · Lever · Ashby · Workday · Last 30 min ·{" "}
              {meta ? `${meta.scanned} companies` : "loading..."}
            </div>
          </div>

          {/* Right: stats + timer */}
          <div style={{ display:"flex", alignItems:"center", gap: 18 }}>
            {[
              [filtered.length, "#3fb950", "MATCHED"],
              [newIds.size,     "#e3b341", "NEW"],
              [meta?.scanned ?? 0, "#58a6ff", "SOURCES"],
            ].map(([n, c, l]) => (
              <div key={String(l)} style={{ textAlign:"center" }}>
                <div style={S.statNum(String(c))}>{n}</div>
                <div style={S.statLbl}>{l}</div>
              </div>
            ))}

            {/* Countdown ring */}
            <div style={{ position:"relative", width: 54, height: 54 }}>
              <svg width={54} height={54} style={{ transform:"rotate(-90deg)", position:"absolute" }}>
                <circle cx={27} cy={27} r={R} fill="none" stroke="#161b22" strokeWidth={3}/>
                <circle cx={27} cy={27} r={R} fill="none" stroke="#3fb950" strokeWidth={3}
                  strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
                  style={{ transition:"stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
                            justifyContent:"center", fontSize: 10, color:"#8b949e", fontWeight: 600 }}>
                {mins}:{secs}
              </div>
            </div>

            <button onClick={runFetch} disabled={loading} style={{
              background: loading ? "transparent" : "#3fb95018",
              border: `1px solid ${loading ? "#21262d" : "#3fb95050"}`,
              color: loading ? "#30363d" : "#3fb950",
              padding: "8px 14px", borderRadius: 6, cursor: loading ? "not-allowed" : "pointer",
              fontSize: 11, fontFamily: "inherit", letterSpacing: 1,
            }}>
              {loading ? "SCANNING…" : "↻ SCAN NOW"}
            </button>
          </div>
        </div>

        {/* Search + filters */}
        <div style={{ marginTop: 12, display:"flex", gap: 7, flexWrap:"wrap", alignItems:"center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="search title or company…" style={S.input as React.CSSProperties} />
          {FILTERS.map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} style={S.btn(filter === v)}>{l}</button>
          ))}
          {lastFetch && (
            <span style={{ fontSize: 9, color: "#21262d", marginLeft: "auto" }}>
              last scan {lastFetch.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* ── SOURCE BAR ── */}
      {meta && (
        <div style={{ display:"flex", gap: 0, padding:"0 24px",
                      borderBottom:"1px solid #0d1117", background:"#080c14" }}>
          {(Object.entries(meta.sources) as [string, number][]).map(([src, count]) => {
            const [lbl, color] = SOURCE_META[src] || [src, "#6b7280"];
            return (
              <div key={src} style={{ padding:"8px 18px", borderRight:"1px solid #0d1117",
                                      display:"flex", alignItems:"center", gap: 8 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:color,
                               boxShadow:`0 0 6px ${color}` }}/>
                <span style={{ fontSize:10, color:"#484f58" }}>{src.charAt(0).toUpperCase()+src.slice(1)}</span>
                <span style={{ fontSize:13, fontWeight:700, color }}>{count}</span>
              </div>
            );
          })}
          <div style={{ padding:"8px 18px", display:"flex", alignItems:"center", gap: 8 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#e3b341",
                           boxShadow:"0 0 6px #e3b341" }}/>
            <span style={{ fontSize:10, color:"#484f58" }}>Remote</span>
            <span style={{ fontSize:13, fontWeight:700, color:"#e3b341" }}>
              {jobs.filter(j=>j.remote).length}
            </span>
          </div>
        </div>
      )}

      {/* ── BODY ── */}
      <div style={{ padding:"14px 24px", maxWidth: 1000, margin:"0 auto" }}>

        {error && (
          <div style={{ background:"#ff6b6b12", border:"1px solid #ff6b6b33", borderRadius:6,
                        padding:"10px 14px", marginBottom:12, fontSize:11, color:"#ff6b6b" }}>
            ⚠ {error} — retrying next cycle
          </div>
        )}

        {loading && jobs.length === 0 && (
          <div style={{ textAlign:"center", padding:"80px 20px" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:11, color:"#3fb950",
                           letterSpacing:3, marginBottom:16 }}>
              SCANNING COMPANIES DIRECTLY
            </div>
            <div style={{ fontSize:10, color:"#30363d" }}>
              Greenhouse · Lever · Ashby · Workday — no intermediary
            </div>
          </div>
        )}

        {!loading && filtered.length === 0 && lastFetch && (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"#30363d" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, marginBottom:8 }}>
              NO JOBS IN LAST 30 MINUTES
            </div>
            <div style={{ fontSize:10 }}>
              {jobs.length > 0
                ? `${jobs.length} jobs exist but don't match this filter. Try "All".`
                : `Scanned ${meta?.scanned ?? "all"} companies. Next auto-scan in ${mins}:${secs}.`}
            </div>
          </div>
        )}

        {filtered.map((job, i) => {
          const isNew = newIds.has(job.id);
          const rc = roleColor(job.title);
          const [srcLbl, srcColor] = SOURCE_META[job.source] || ["?", "#6b7280"];

          return (
            <div key={job.id} style={{ ...S.card(isNew), borderLeft: `3px solid ${rc}` }}
              onMouseEnter={e => (e.currentTarget.style.background = isNew ? "#0f2015" : "#111822")}
              onMouseLeave={e => (e.currentTarget.style.background = isNew ? "#0c1a10" : "#0d1117")}
            >
              <div style={{ fontSize:10, color:"#21262d", minWidth:26, paddingTop:2, textAlign:"right" }}>
                {i + 1}
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:8, flexWrap:"wrap" }}>
                  <a href={job.url} target="_blank" rel="noopener noreferrer" style={{
                    color:"#e6edf3", textDecoration:"none", fontSize:13, fontWeight:600,
                    lineHeight:1.35, flex:1, minWidth:180, transition:"color .15s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.color = rc)}
                    onMouseLeave={e => (e.currentTarget.style.color = "#e6edf3")}
                  >{job.title}</a>
                  {isNew && (
                    <span style={{ fontSize:8, padding:"2px 7px", background:"#3fb950",
                                   color:"#05080f", borderRadius:3, fontWeight:700,
                                   letterSpacing:1.2, flexShrink:0 }}>NEW</span>
                  )}
                </div>
                <div style={{ display:"flex", gap:10, marginTop:5, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:11, color:"#8b949e", fontWeight:500 }}>{job.company}</span>
                  <span style={{ fontSize:10, color:"#21262d" }}>·</span>
                  <span style={{ fontSize:10, color:"#484f58" }}>
                    {job.remote ? "🌐 Remote" : "📍 " + job.location}
                  </span>
                </div>
              </div>

              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5, flexShrink:0 }}>
                <span style={{ fontSize:9, padding:"2px 7px", fontWeight:700,
                               background:srcColor+"18", border:`1px solid ${srcColor}35`,
                               color:srcColor, borderRadius:4, letterSpacing:.5 }}>
                  {srcLbl}
                </span>
                <span style={{ fontSize:9, color:"#30363d" }}>{timeAgo(job.posted)}</span>
                <a href={job.url} target="_blank" rel="noopener noreferrer" style={{
                  fontSize:9, color:rc, textDecoration:"none", letterSpacing:.8,
                  border:`1px solid ${rc}35`, padding:"3px 9px", borderRadius:4,
                  background:rc+"10",
                }}>APPLY →</a>
              </div>
            </div>
          );
        })}

        {lastFetch && jobs.length > 0 && (
          <div style={{ textAlign:"center", padding:"20px 0 28px",
                        fontSize:10, color:"#21262d", letterSpacing:1 }}>
            {filtered.length} JOBS · {meta?.scanned} COMPANIES SCANNED DIRECTLY ·
            NEXT SCAN {mins}:{secs}
            <br/>
            <span style={{ fontSize:9, color:"#161b22" }}>
              GREENHOUSE · LEVER · ASHBY · WORKDAY — ZERO INTERMEDIARY — 100% FREE
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
