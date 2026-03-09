"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import React from "react";

const REFRESH_MS = 5 * 60 * 1000;

interface Job {
  id: string; title: string; company: string;
  location: string; url: string; posted: string;
  source: string; remote: boolean;
}
interface ApiMeta {
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

function roleColor(title: string): string {
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

const US_REGIONS: Record<string, string[]> = {
  "Northeast":  ["new york","boston","philadelphia","newark","hartford","providence","albany","buffalo","pittsburgh","baltimore","washington","dc","maine","vermont","new hampshire","connecticut","rhode island","massachusetts","pennsylvania","new jersey","maryland","delaware"],
  "Southeast":  ["atlanta","miami","orlando","tampa","charlotte","raleigh","nashville","memphis","new orleans","richmond","virginia beach","jacksonville","birmingham","louisville","lexington","florida","georgia","north carolina","south carolina","tennessee","alabama","mississippi","louisiana","arkansas","virginia","west virginia","kentucky"],
  "Midwest":    ["chicago","detroit","minneapolis","columbus","cleveland","indianapolis","kansas city","milwaukee","st. louis","cincinnati","omaha","des moines","ohio","michigan","illinois","indiana","minnesota","wisconsin","iowa","missouri","kansas","nebraska","south dakota","north dakota"],
  "Southwest":  ["dallas","houston","austin","san antonio","phoenix","denver","albuquerque","el paso","fort worth","oklahoma city","texas","arizona","colorado","new mexico","oklahoma","nevada","utah"],
  "West":       ["los angeles","san francisco","seattle","portland","san diego","sacramento","las vegas","san jose","fresno","long beach","anaheim","riverside","california","washington","oregon","idaho","montana","wyoming","alaska","hawaii"],
};

function getRegion(location: string): string {
  const l = location.toLowerCase();
  for (const [region, keywords] of Object.entries(US_REGIONS)) {
    if (keywords.some(k => l.includes(k))) return region;
  }
  if (l.includes("remote")) return "Remote";
  return "Other US";
}

function timeAgo(d: string): string {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function dotStyle(live: boolean, err: boolean): React.CSSProperties {
  const color = err ? "#ff6b6b" : live ? "#e3b341" : "#3fb950";
  return { width:9, height:9, borderRadius:"50%", flexShrink:0,
           background:color, boxShadow:`0 0 12px ${color}`,
           animation: live ? "blink .6s infinite" : "none" };
}
function btnStyle(active: boolean, accent = "#3fb950"): React.CSSProperties {
  return { background: active ? `${accent}18` : "transparent",
           border: `1px solid ${active ? accent : "#21262d"}`,
           color: active ? accent : "#484f58",
           padding:"5px 11px", borderRadius:4, cursor:"pointer",
           fontSize:10, fontFamily:"inherit", letterSpacing:.8, textTransform:"uppercase" };
}
function cardStyle(isNew: boolean): React.CSSProperties {
  return { background: isNew ? "#0c1a10" : "#0d1117",
           border: `1px solid ${isNew ? "#3fb95030" : "#161b22"}`,
           borderRadius:7, padding:"13px 16px", marginBottom:7,
           display:"flex", alignItems:"flex-start", gap:13,
           transition:"background .15s",
           animation: isNew ? "slideIn .35s ease" : "none",
           cursor:"default" };
}

const ROLE_FILTERS = [
  ["all","All Roles"], ["analyst","Analyst"], ["engineer","Engineer"],
  ["bi","BI / Power BI"], ["financial","Financial"], ["operations","Operations"],
];
const LOC_FILTERS = [
  ["all","🇺🇸 All US"], ["remote","🌐 Remote"], ["northeast","Northeast"],
  ["southeast","Southeast"], ["midwest","Midwest"], ["southwest","Southwest"],
  ["west","West"],
];
const SRC_FILTERS = [
  ["all_src","All Sources"], ["greenhouse","Greenhouse"],
  ["lever","Lever"], ["ashby","Ashby"], ["workday","Workday"],
];

export default function Page() {
  const [jobs, setJobs]           = useState<Job[]>([]);
  const [meta, setMeta]           = useState<ApiMeta | null>(null);
  const [loading, setLoading]     = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [countdown, setCd]        = useState(REFRESH_MS / 1000);
  const [newIds, setNewIds]       = useState(new Set<string>());
  const [roleFilter, setRoleFilter] = useState("all");
  const [locFilter, setLocFilter]   = useState("all");
  const [srcFilter, setSrcFilter]   = useState("all_src");
  const [search, setSearch]       = useState("");
  const [error, setError]         = useState<string | null>(null);
  const seenUrls = useRef(new Set<string>());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const runFetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/jobs");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json() as { jobs: Job[]; meta: ApiMeta };
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cdRef.current) clearInterval(cdRef.current);
    };
  }, [runFetch]);

  const filtered = jobs.filter(j => {
    const s = search.toLowerCase();
    const ms = !s || j.title.toLowerCase().includes(s) || j.company.toLowerCase().includes(s);
    const t = j.title.toLowerCase();
    const region = getRegion(j.location);

    const mRole =
      roleFilter === "all"        ? true :
      roleFilter === "analyst"    ? t.includes("analyst") :
      roleFilter === "engineer"   ? t.includes("engineer") :
      roleFilter === "bi"         ? (t.includes("bi") || t.includes("power bi") || t.includes("business intel")) :
      roleFilter === "financial"  ? t.includes("financial") :
      roleFilter === "operations" ? t.includes("operations") : true;

    const mLoc =
      locFilter === "all"       ? true :
      locFilter === "remote"    ? j.remote :
      locFilter === "northeast" ? region === "Northeast" :
      locFilter === "southeast" ? region === "Southeast" :
      locFilter === "midwest"   ? region === "Midwest" :
      locFilter === "southwest" ? region === "Southwest" :
      locFilter === "west"      ? region === "West" : true;

    const mSrc =
      srcFilter === "all_src"     ? true :
      srcFilter === "greenhouse"  ? j.source === "greenhouse" :
      srcFilter === "lever"       ? j.source === "lever" :
      srcFilter === "ashby"       ? j.source === "ashby" :
      srcFilter === "workday"     ? j.source === "workday" : true;

    return ms && mRole && mLoc && mSrc;
  });

  const mins = String(Math.floor(countdown / 60)).padStart(2, "0");
  const secs = String(countdown % 60).padStart(2, "0");
  const R = 22, circ = 2 * Math.PI * R;
  const pct = ((REFRESH_MS / 1000 - countdown) / (REFRESH_MS / 1000)) * 100;

  return (
    <div style={{ fontFamily:"'DM Mono','Fira Code',monospace", background:"#05080f", minHeight:"100vh", color:"#c9d1d9" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:#05080f}
        ::-webkit-scrollbar-thumb{background:#21262d;border-radius:2px}
        ::placeholder{color:#30363d}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background:"linear-gradient(180deg,#0d1117,#080c14)", borderBottom:"1px solid #161b22",
                    padding:"16px 24px 12px", position:"sticky", top:0, zIndex:50 }}>

        {/* Row 1: Title + Stats */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={dotStyle(loading, !!error)} />
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:"#f0f6fc", letterSpacing:-0.5 }}>
                VASANTH / JOB RADAR
              </span>
              <span style={{ fontSize:9, padding:"2px 8px", letterSpacing:1.2,
                             background:"#3fb95018", border:"1px solid #3fb95040", color:"#3fb950", borderRadius:3 }}>LIVE</span>
            </div>
            <div style={{ fontSize:10, color:"#30363d", marginTop:3 }}>
              🇺🇸 United States only · No API key · Greenhouse · Lever · Ashby · Workday · Last 30 min · {meta?.scanned ?? "..."} companies
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            {([
              [filtered.length, "#3fb950", "MATCHED"],
              [newIds.size,     "#e3b341", "NEW"],
              [meta?.scanned ?? 0, "#58a6ff", "SOURCES"],
            ] as [number,string,string][]).map(([n,c,l]) => (
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:24, fontWeight:700, color:c, lineHeight:1 }}>{n}</div>
                <div style={{ fontSize:9, color:"#30363d", letterSpacing:1 }}>{l}</div>
              </div>
            ))}

            <div style={{ position:"relative", width:52, height:52 }}>
              <svg width={52} height={52} style={{ transform:"rotate(-90deg)", position:"absolute" }}>
                <circle cx={26} cy={26} r={R} fill="none" stroke="#161b22" strokeWidth={3}/>
                <circle cx={26} cy={26} r={R} fill="none" stroke="#3fb950" strokeWidth={3}
                  strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
                  style={{ transition:"stroke-dashoffset 1s linear" }}/>
              </svg>
              <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
                            justifyContent:"center", fontSize:10, color:"#8b949e", fontWeight:600 }}>
                {mins}:{secs}
              </div>
            </div>

            <button onClick={runFetch} disabled={loading} style={{
              background: loading ? "transparent" : "#3fb95018",
              border:`1px solid ${loading ? "#21262d" : "#3fb95050"}`,
              color: loading ? "#30363d" : "#3fb950",
              padding:"7px 13px", borderRadius:6, cursor:loading?"not-allowed":"pointer",
              fontSize:11, fontFamily:"inherit", letterSpacing:1,
            }}>
              {loading ? "SCANNING…" : "↻ SCAN"}
            </button>
          </div>
        </div>

        {/* Row 2: Search */}
        <div style={{ marginTop:10, display:"flex", gap:7, alignItems:"center", flexWrap:"wrap" }}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="search title or company…"
            style={{ background:"#0d1117", border:"1px solid #21262d", color:"#c9d1d9",
                     padding:"6px 12px", borderRadius:5, fontSize:11, fontFamily:"inherit",
                     width:200, outline:"none" }}/>
          {lastFetch && <span style={{ fontSize:9, color:"#21262d", marginLeft:"auto" }}>
            last scan {lastFetch.toLocaleTimeString()}
          </span>}
        </div>

        {/* Row 3: Role filters */}
        <div style={{ marginTop:8, display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ fontSize:9, color:"#30363d", letterSpacing:1, marginRight:4 }}>ROLE</span>
          {ROLE_FILTERS.map(([v,l]) => (
            <button key={v} onClick={()=>setRoleFilter(v)} style={btnStyle(roleFilter===v,"#00d4aa")}>{l}</button>
          ))}
        </div>

        {/* Row 4: Location filters */}
        <div style={{ marginTop:6, display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ fontSize:9, color:"#30363d", letterSpacing:1, marginRight:4 }}>LOCATION</span>
          {LOC_FILTERS.map(([v,l]) => (
            <button key={v} onClick={()=>setLocFilter(v)} style={btnStyle(locFilter===v,"#58a6ff")}>{l}</button>
          ))}
        </div>

        {/* Row 5: Source filters */}
        <div style={{ marginTop:6, display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ fontSize:9, color:"#30363d", letterSpacing:1, marginRight:4 }}>SOURCE</span>
          {SRC_FILTERS.map(([v,l]) => (
            <button key={v} onClick={()=>setSrcFilter(v)} style={btnStyle(srcFilter===v,"#e8a838")}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── SOURCE BAR ── */}
      {meta && (
        <div style={{ display:"flex", padding:"0 24px", borderBottom:"1px solid #0d1117", background:"#080c14", overflowX:"auto" }}>
          {(Object.entries(meta.sources) as [string,number][]).map(([src,count]) => {
            const [,color] = SOURCE_META[src] || ["?","#6b7280"];
            return (
              <div key={src} style={{ padding:"7px 16px", borderRight:"1px solid #0d1117",
                                      display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:color, boxShadow:`0 0 5px ${color}` }}/>
                <span style={{ fontSize:9, color:"#484f58" }}>{src.charAt(0).toUpperCase()+src.slice(1)}</span>
                <span style={{ fontSize:13, fontWeight:700, color }}>{count}</span>
              </div>
            );
          })}
          {(["Northeast","Southeast","Midwest","Southwest","West","Remote"] as string[]).map(region => {
            const count = jobs.filter(j => getRegion(j.location) === region).length;
            if (!count) return null;
            return (
              <div key={region} style={{ padding:"7px 14px", borderRight:"1px solid #0d1117",
                                         display:"flex", alignItems:"center", gap:7, flexShrink:0 }}>
                <span style={{ fontSize:9, color:"#30363d" }}>{region}</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#58a6ff" }}>{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── BODY ── */}
      <div style={{ padding:"14px 24px", maxWidth:1000, margin:"0 auto" }}>

        {error && (
          <div style={{ background:"#ff6b6b12", border:"1px solid #ff6b6b33", borderRadius:6,
                        padding:"10px 14px", marginBottom:12, fontSize:11, color:"#ff6b6b" }}>
            ⚠ {error} — retrying next cycle
          </div>
        )}

        {loading && jobs.length === 0 && (
          <div style={{ textAlign:"center", padding:"80px 20px" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:11, color:"#3fb950", letterSpacing:3, marginBottom:12 }}>
              SCANNING {meta?.scanned ?? "300+"} COMPANIES
            </div>
            <div style={{ fontSize:10, color:"#30363d" }}>Greenhouse · Lever · Ashby · Workday</div>
          </div>
        )}

        {!loading && filtered.length === 0 && lastFetch && (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"#30363d" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, marginBottom:8 }}>
              NO MATCHING JOBS IN LAST 30 MINUTES
            </div>
            <div style={{ fontSize:10 }}>
              {jobs.length > 0
                ? `${jobs.length} total jobs — try different filters`
                : `Scanned ${meta?.scanned ?? "all"} companies. Auto-refresh in ${mins}:${secs}.`}
            </div>
          </div>
        )}

        {filtered.map((job, i) => {
          const isNew = newIds.has(job.id);
          const rc = roleColor(job.title);
          const [srcLbl, srcColor] = SOURCE_META[job.source] || ["?","#6b7280"];
          const region = getRegion(job.location);

          return (
            <div key={job.id} style={{ ...cardStyle(isNew), borderLeft:`3px solid ${rc}` }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = isNew ? "#0f2015" : "#111822"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isNew ? "#0c1a10" : "#0d1117"; }}
            >
              <div style={{ fontSize:10, color:"#21262d", minWidth:26, paddingTop:2, textAlign:"right" }}>{i+1}</div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:8, flexWrap:"wrap" }}>
                  <a href={job.url} target="_blank" rel="noopener noreferrer" style={{
                    color:"#e6edf3", textDecoration:"none", fontSize:13, fontWeight:600,
                    lineHeight:1.35, flex:1, minWidth:180, transition:"color .15s",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = rc; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#e6edf3"; }}
                  >{job.title}</a>
                  {isNew && <span style={{ fontSize:8, padding:"2px 7px", background:"#3fb950", color:"#05080f",
                                           borderRadius:3, fontWeight:700, letterSpacing:1.2, flexShrink:0 }}>NEW</span>}
                </div>
                <div style={{ display:"flex", gap:8, marginTop:5, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:11, color:"#8b949e", fontWeight:500 }}>{job.company}</span>
                  <span style={{ fontSize:10, color:"#21262d" }}>·</span>
                  <span style={{ fontSize:10, color:"#484f58" }}>
                    {job.remote ? "🌐 Remote" : "📍 "+job.location}
                  </span>
                  {region !== "Other US" && !job.remote && (
                    <>
                      <span style={{ fontSize:10, color:"#21262d" }}>·</span>
                      <span style={{ fontSize:9, padding:"1px 6px", background:"#58a6ff15",
                                     border:"1px solid #58a6ff30", color:"#58a6ff", borderRadius:3 }}>
                        {region}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5, flexShrink:0 }}>
                <span style={{ fontSize:9, padding:"2px 7px", fontWeight:700,
                               background:`${srcColor}18`, border:`1px solid ${srcColor}35`,
                               color:srcColor, borderRadius:4 }}>{srcLbl}</span>
                <span style={{ fontSize:9, color:"#30363d" }}>{timeAgo(job.posted)}</span>
                <a href={job.url} target="_blank" rel="noopener noreferrer" style={{
                  fontSize:9, color:rc, textDecoration:"none", letterSpacing:.8,
                  border:`1px solid ${rc}35`, padding:"3px 9px", borderRadius:4, background:`${rc}10`,
                }}>APPLY →</a>
              </div>
            </div>
          );
        })}

        {lastFetch && (
          <div style={{ textAlign:"center", padding:"20px 0 28px", fontSize:10, color:"#21262d", letterSpacing:1 }}>
            {filtered.length} JOBS · {meta?.scanned} COMPANIES · NEXT SCAN {mins}:{secs} · 🇺🇸 US ONLY
          </div>
        )}
      </div>
    </div>
  );
}
