import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase Client ─────────────────────────────────────────────────────────
const SUPABASE_URL = "https://afvhvhnzmrcykpqlmqnr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_b5qxLBFPNW64wwYfCuoalA_oAUo3Viu";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// ── Constants ────────────────────────────────────────────────────────────────
const SEVERITY_ORDER = { High: 0, Medium: 1, Low: 2 };
const STATUS_OPTIONS = ["pending", "approved", "rejected"];

const SEV_COLOR = {
  High: { bg: "#fff1f2", text: "#dc2626", border: "#fecaca", dot: "#ef4444", pill: "#fee2e2", pillText: "#b91c1c" },
  Medium: { bg: "#fffbeb", text: "#d97706", border: "#fde68a", dot: "#f59e0b", pill: "#fef3c7", pillText: "#b45309" },
  Low: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0", dot: "#22c55e", pill: "#dcfce7", pillText: "#15803d" },
};

const STATUS_COLOR = {
  pending: { bg: "#fffbeb", text: "#d97706", border: "#fde68a", icon: "◐" },
  approved: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0", icon: "✓" },
  rejected: { bg: "#fff1f2", text: "#dc2626", border: "#fecaca", icon: "✕" },
};

const TYPE_ICON = { Road: "⬡", Bridge: "⊟", "Public Building": "⊞" };
const TYPE_LABEL = { Road: "Road", Bridge: "Bridge", "Public Building": "Bldg" };

const getSeverity = (score) => {
  if (score >= 9) return "High";
  if (score >= 4) return "Medium";
  return "Low";
};

// ── Global Styles Injection ──────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; min-height: 100%; }
  body { background: #f8fafc; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes pulse    { 0%,100%{opacity:1; transform:scale(1)} 50%{opacity:0.7; transform:scale(0.97)} }
  @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes slideUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

  input, button, select { font-family: inherit; }
  table { border-collapse: collapse; width: 100%; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

  .btn-primary {
    background: linear-gradient(135deg, #2563eb, #3b82f6);
    border: none; border-radius: 10px; color: #fff;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px;
    padding: 11px 20px; cursor: pointer;
    box-shadow: 0 2px 8px rgba(37,99,235,0.25), inset 0 1px 0 rgba(255,255,255,0.2);
    transition: all 0.18s ease;
    letter-spacing: 0.2px;
  }
  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #1d4ed8, #2563eb);
    box-shadow: 0 4px 16px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
    transform: translateY(-1px);
  }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .btn-ghost {
    background: #fff; border: 1px solid #e2e8f0;
    border-radius: 9px; color: #64748b;
    font-family: 'Syne', sans-serif; font-weight: 600; font-size: 12px;
    padding: 8px 14px; cursor: pointer; transition: all 0.15s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .btn-ghost:hover { background: #f8fafc; color: #334155; border-color: #cbd5e1; }

  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }

  .table-row-hover:hover { background: #f8fafc !important; }

  .tag {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.3px;
    font-family: 'Syne', sans-serif;
  }

  .filter-select {
    padding: 8px 12px; border-radius: 9px;
    background: #fff; border: 1px solid #e2e8f0;
    color: #64748b; font-size: 12px; font-family: 'Syne', sans-serif;
    cursor: pointer; outline: none; appearance: none;
    transition: border-color 0.15s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }
  .filter-select:focus { border-color: #93c5fd; }
  .filter-select option { background: #fff; color: #334155; }

  .search-input {
    flex: 1 1 220px; padding: 10px 16px 10px 42px;
    border: 1px solid #e2e8f0; border-radius: 10px;
    background: #fff; color: #1e293b; font-size: 13px;
    outline: none; transition: border-color 0.15s, box-shadow 0.15s;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }
  .search-input::placeholder { color: #94a3b8; }
  .search-input:focus { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

  .tab-btn {
    padding: 7px 16px; border-radius: 8px; border: none;
    font-family: 'Syne', sans-serif; font-weight: 600; font-size: 12px;
    cursor: pointer; transition: all 0.15s; letter-spacing: 0.3px;
  }

  .status-tab {
    padding: 6px 14px; border-radius: 7px; border: none;
    font-family: 'Syne', sans-serif; font-weight: 600; font-size: 11px;
    cursor: pointer; transition: all 0.15s; letter-spacing: 0.4px; text-transform: uppercase;
  }
`;

// ════════════════════════════════════════════════════════════════════════════
// STAT CARD
// ════════════════════════════════════════════════════════════════════════════
function StatCard({ label, value, icon, accent, sub }) {
  return (
    <div className="card" style={{
      padding: "22px 24px",
      position: "relative", overflow: "hidden",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${accent}20`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      {/* Top accent line */}
      <div style={{ position: "absolute", top: 0, left: 24, right: 24, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)`, borderRadius: "0 0 4px 4px" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: 1.2, textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 18, opacity: 0.6 }}>{icon}</div>
      </div>

      <div style={{ fontSize: 34, fontWeight: 800, color: "#0f172a", lineHeight: 1, letterSpacing: -1, fontFamily: "'Syne', sans-serif" }}>{value}</div>

      {sub && (
        <div style={{ fontSize: 11, color: accent, marginTop: 8, fontWeight: 600, letterSpacing: 0.3 }}>{sub}</div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// REPORT DETAIL MODAL
// ════════════════════════════════════════════════════════════════════════════
function ReportModal({ report, onClose, onStatusChange }) {
  const [newStatus, setNewStatus] = useState(report.status);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sev = getSeverity(report.score);
  const sevC = SEV_COLOR[sev];
  const statusC = STATUS_COLOR[report.status] || STATUS_COLOR.pending;

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("reports")
      .update({ status: newStatus })
      .eq("id", report.id);
    setSaving(false);
    if (error) {
      alert("Failed to update: " + error.message);
    } else {
      setSaved(true);
      onStatusChange(report.id, newStatus);
      setTimeout(() => { setSaved(false); onClose(); }, 1000);
    }
  };

  const checks = report.checks;
  const checkedItems = Array.isArray(checks)
    ? checks
    : checks && typeof checks === "object"
      ? Object.entries(checks).filter(([, v]) => v).map(([k]) => k)
      : [];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, backdropFilter: "blur(6px)",
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 20, width: "100%", maxWidth: 620,
        maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
        animation: "fadeUp 0.22s ease both",
        fontFamily: "'Syne', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 26px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
          background: "#fafbfc",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: sevC.pill, border: `1px solid ${sevC.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, color: sevC.text,
            }}>{TYPE_ICON[report.type]}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", letterSpacing: -0.3 }}>{report.type} Damage Report</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 0.5 }}>
                #{report.id?.slice(0, 8).toUpperCase()}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="tag" style={{ background: sevC.pill, color: sevC.pillText, border: `1px solid ${sevC.border}` }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: sevC.dot, display: "inline-block" }} />
              {sev} Severity
            </span>
            <button onClick={onClose} style={{
              background: "#f1f5f9", border: "1px solid #e2e8f0",
              borderRadius: 9, width: 34, height: 34, cursor: "pointer",
              color: "#64748b", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fecaca"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
            >✕</button>
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "24px 26px" }}>

          {/* Score + Status row */}
          <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
            <div style={{
              flex: 1, minWidth: 140, padding: "14px 18px", borderRadius: 12,
              background: "#f8fafc", border: "1px solid #e2e8f0",
            }}>
              <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Priority Score</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: sevC.text, lineHeight: 1 }}>{report.score}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>out of 12 points</div>
            </div>
            <div style={{
              flex: 1, minWidth: 140, padding: "14px 18px", borderRadius: 12,
              background: statusC.bg, border: `1px solid ${statusC.border}`,
            }}>
              <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Current Status</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: statusC.text, lineHeight: 1, textTransform: "capitalize" }}>
                {statusC.icon} {report.status}
              </div>
            </div>
            <div style={{
              flex: 1, minWidth: 140, padding: "14px 18px", borderRadius: 12,
              background: "#f8fafc", border: "1px solid #e2e8f0",
            }}>
              <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Submitted</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>{report.created_at?.slice(0, 10)}</div>
              {report.respondent && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>by {report.respondent}</div>}
            </div>
          </div>

          {/* Location */}
          <div style={{ marginBottom: 16, padding: "16px 18px", background: "#eff6ff", borderRadius: 12, border: "1px solid #bfdbfe" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#3b82f6", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Location</div>
            {report.place_name && (
              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14, marginBottom: 5 }}>📍 {report.place_name}</div>
            )}
            <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'IBM Plex Mono', monospace", marginBottom: 10 }}>
              {Number(report.lat).toFixed(5)}° N, {Number(report.lng).toFixed(5)}° E
            </div>
            <a
              href={`https://www.google.com/maps?q=${report.lat},${report.lng}`}
              target="_blank" rel="noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 12, color: "#2563eb", fontWeight: 600, textDecoration: "none",
                padding: "6px 12px", background: "#dbeafe", borderRadius: 8,
                border: "1px solid #bfdbfe",
                transition: "all 0.15s",
              }}
            >
              ↗ View on Google Maps
            </a>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Description</div>
            <div style={{
              fontSize: 13, color: "#475569", lineHeight: 1.75,
              background: "#f8fafc", padding: "14px 16px", borderRadius: 11,
              border: "1px solid #e2e8f0",
              fontFamily: "'Inter', sans-serif", fontWeight: 400,
            }}>
              {report.description || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No description provided.</span>}
            </div>
          </div>

          {/* Checklist */}
          {checkedItems.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
                Damage Checklist <span style={{ color: "#cbd5e1", fontWeight: 400 }}>({checkedItems.length} flagged)</span>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 11, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                {checkedItems.map((item, i) => (
                  <div key={item} style={{
                    padding: "10px 16px", fontSize: 13, color: "#475569",
                    borderBottom: i < checkedItems.length - 1 ? "1px solid #f1f5f9" : "none",
                    display: "flex", alignItems: "center", gap: 10,
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: 6, background: "#dcfce7",
                      border: "1px solid #bbf7d0", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 10, color: "#16a34a", fontWeight: 700, flexShrink: 0,
                    }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo */}
          {report.photo_url && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Attached Photo</div>
              <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                <img
                  src={report.photo_url} alt="Report"
                  style={{ width: "100%", maxHeight: 260, objectFit: "cover", cursor: "pointer", display: "block" }}
                  onClick={() => window.open(report.photo_url, "_blank")}
                />
                <div style={{
                  position: "absolute", bottom: 10, right: 10,
                  background: "rgba(255,255,255,0.9)", borderRadius: 7, padding: "5px 10px",
                  fontSize: 11, color: "#475569", backdropFilter: "blur(4px)",
                  border: "1px solid #e2e8f0",
                }}>↗ Full size</div>
              </div>
            </div>
          )}

          {/* Status Change */}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 20, marginTop: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Update Verification Status</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {STATUS_OPTIONS.map((s) => {
                const sc = STATUS_COLOR[s];
                const active = newStatus === s;
                return (
                  <button key={s} onClick={() => setNewStatus(s)} style={{
                    flex: 1, padding: "11px 8px", borderRadius: 11, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s",
                    border: `1.5px solid ${active ? sc.border : "#e2e8f0"}`,
                    background: active ? sc.bg : "#f8fafc",
                    color: active ? sc.text : "#94a3b8",
                    fontFamily: "'Syne', sans-serif",
                  }}>
                    {sc.icon} {s}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleSave}
              disabled={saving || saved || newStatus === report.status}
              className="btn-primary"
              style={{
                width: "100%", padding: "13px",
                background: saved
                  ? "linear-gradient(135deg, #16a34a, #22c55e)"
                  : (saving || newStatus === report.status)
                    ? "#f1f5f9"
                    : undefined,
                color: (saving || newStatus === report.status) && !saved ? "#94a3b8" : undefined,
                boxShadow: (saving || newStatus === report.status) && !saved ? "none" : undefined,
                borderRadius: 11,
              }}
            >
              {saved ? "✓ Status Updated!" : saving ? "Saving…" : newStatus === report.status ? "No Changes" : `Save — Mark as "${newStatus}"`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// REPORT TABLE ROW
// ════════════════════════════════════════════════════════════════════════════
function ReportRow({ report, onSelect }) {
  const sev = getSeverity(report.score);
  const sevC = SEV_COLOR[sev];
  const statusC = STATUS_COLOR[report.status] || STATUS_COLOR.pending;

  return (
    <tr
      className="table-row-hover"
      onClick={() => onSelect(report)}
      style={{ cursor: "pointer", borderBottom: "1px solid #f1f5f9", transition: "background 0.12s" }}
    >
      <td style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: sevC.pill, border: `1px solid ${sevC.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, color: sevC.text, flexShrink: 0,
          }}>{TYPE_ICON[report.type]}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", fontFamily: "'Syne', sans-serif" }}>{report.type}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'IBM Plex Mono', monospace", marginTop: 1 }}>
              #{report.id?.slice(0, 8).toUpperCase()}
            </div>
          </div>
        </div>
      </td>
      <td style={{ padding: "14px 18px" }}>
        <div style={{ fontSize: 12, color: "#475569", maxWidth: 190, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif" }}>
          {report.place_name || `${Number(report.lat).toFixed(4)}°N, ${Number(report.lng).toFixed(4)}°E`}
        </div>
      </td>
      <td style={{ padding: "14px 18px" }}>
        <span className="tag" style={{ background: sevC.pill, color: sevC.pillText, border: `1px solid ${sevC.border}` }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: sevC.dot, display: "inline-block" }} />
          {sev}
        </span>
      </td>
      <td style={{ padding: "14px 18px", textAlign: "center" }}>
        <span style={{ fontWeight: 800, fontSize: 14, color: sevC.text, fontFamily: "'IBM Plex Mono', monospace" }}>{report.score}</span>
        <span style={{ color: "#94a3b8", fontSize: 10, marginLeft: 2 }}>pt</span>
      </td>
      <td style={{ padding: "14px 18px" }}>
        <span className="tag" style={{ background: statusC.bg, color: statusC.text, border: `1px solid ${statusC.border}`, textTransform: "capitalize" }}>
          {statusC.icon} {report.status}
        </span>
      </td>
      <td style={{ padding: "14px 18px" }}>
        <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'IBM Plex Mono', monospace" }}>{report.created_at?.slice(0, 10)}</div>
      </td>
      <td style={{ padding: "14px 18px" }}>
        {report.photo_url
          ? <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><span style={{ fontSize: 12 }}>◉</span> Yes</span>
          : <span style={{ fontSize: 11, color: "#cbd5e1" }}>—</span>}
      </td>
      <td style={{ padding: "14px 18px" }}>
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(report); }}
          style={{
            padding: "6px 14px", borderRadius: 8,
            border: "1px solid #bfdbfe",
            background: "#eff6ff", color: "#2563eb",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            transition: "all 0.15s", fontFamily: "'Syne', sans-serif",
            letterSpacing: 0.2,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.borderColor = "#93c5fd"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; }}
        >
          Review →
        </button>
      </td>
    </tr>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sevFilter, setSevFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("reports");
  const [sortBy, setSortBy] = useState("severity");

  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      showToast("Failed to load reports.", "error");
    } else {
      setReports(data || []);
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  useEffect(() => {
    const channel = supabase
      .channel("reports-admin-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reports" }, () => {
        fetchReports();
        showToast("New report submitted — list refreshed.", "info");
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "reports" }, (payload) => {
        setReports((prev) => prev.map((r) => r.id === payload.new.id ? { ...r, ...payload.new } : r));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchReports, showToast]);

  const handleStatusChange = (id, newStatus) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r));
    const msg = newStatus === "approved" ? "Report approved and published." : newStatus === "rejected" ? "Report rejected." : "Report set to pending.";
    showToast(msg, newStatus === "approved" ? "success" : newStatus === "rejected" ? "error" : "info");
  };

  const total = reports.length;
  const pending = reports.filter((r) => r.status === "pending").length;
  const approved = reports.filter((r) => r.status === "approved").length;
  const rejected = reports.filter((r) => r.status === "rejected").length;
  const highSev = reports.filter((r) => r.status === "approved" && getSeverity(r.score) === "High").length;

  const filtered = reports
    .filter((r) => statusFilter === "all" ? true : r.status === statusFilter)
    .filter((r) => typeFilter === "All" ? true : r.type === typeFilter)
    .filter((r) => sevFilter === "All" ? true : getSeverity(r.score) === sevFilter)
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.type?.toLowerCase().includes(q) ||
        r.place_name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.respondent?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "severity") return SEVERITY_ORDER[getSeverity(a.score)] - SEVERITY_ORDER[getSeverity(b.score)];
      if (sortBy === "score") return b.score - a.score;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const byType = ["Road", "Bridge", "Public Building"].map((t) => ({
    type: t,
    total: reports.filter((r) => r.type === t).length,
    approved: reports.filter((r) => r.type === t && r.status === "approved").length,
    high: reports.filter((r) => r.type === t && getSeverity(r.score) === "High").length,
  }));

  const bySeverity = ["High", "Medium", "Low"].map((s) => ({
    sev: s,
    total: reports.filter((r) => getSeverity(r.score) === s).length,
  }));
  const maxSevCount = Math.max(...bySeverity.map((b) => b.total), 1);

  const priorityList = reports
    .filter((r) => r.status === "approved")
    .sort((a, b) =>
      SEVERITY_ORDER[getSeverity(a.score)] - SEVERITY_ORDER[getSeverity(b.score)] || b.score - a.score
    );

  const toastColors = {
    success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a", icon: "✓" },
    error: { bg: "#fff1f2", border: "#fecaca", text: "#dc2626", icon: "✕" },
    info: { bg: "#eff6ff", border: "#bfdbfe", text: "#2563eb", icon: "◉" },
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Syne', sans-serif", color: "#0f172a" }}>
      <style>{GLOBAL_STYLES}</style>

      {/* ── Top Bar ── */}
      <header style={{
        background: "rgba(255,255,255,0.95)",
        borderBottom: "1px solid #e2e8f0",
        padding: "0 28px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 200,
        backdropFilter: "blur(12px)",
        gap: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
          }}>⊞</div>
          <div>
            <span style={{ color: "#0f172a", fontWeight: 800, fontSize: 15, letterSpacing: -0.5 }}>CVIMAP</span>
            <span style={{ color: "#94a3b8", fontSize: 12, marginLeft: 8, fontWeight: 400 }}>Admin Panel</span>
          </div>
          <div style={{
            marginLeft: 4, padding: "2px 9px", borderRadius: 6,
            background: "#eff6ff", border: "1px solid #bfdbfe",
            fontSize: 10, color: "#2563eb", fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase",
          }}>LGU</div>
        </div>

        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Tab switcher */}
          <div style={{ display: "flex", gap: 2, background: "#f1f5f9", borderRadius: 10, padding: 3, border: "1px solid #e2e8f0" }}>
            {[["reports", "Reports"], ["analytics", "Analytics"]].map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className="tab-btn" style={{
                background: activeTab === tab ? "#fff" : "transparent",
                color: activeTab === tab ? "#2563eb" : "#94a3b8",
                border: activeTab === tab ? "1px solid #bfdbfe" : "1px solid transparent",
                boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}>{label}</button>
            ))}
          </div>

          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s ease infinite" }} />
            <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, letterSpacing: 0.5 }}>Live</span>
          </div>

          {pending > 0 && (
            <div style={{
              background: "#fff7ed", color: "#d97706",
              border: "1px solid #fde68a",
              fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 8,
              animation: "pulse 2.5s ease infinite", letterSpacing: 0.4,
            }}>
              {pending} Pending
            </div>
          )}

          <button onClick={fetchReports} className="btn-ghost">↻ Refresh</button>
        </div>
      </header>

      <main style={{ padding: "24px 28px", maxWidth: 1440, margin: "0 auto" }}>

        {/* ── Stat Cards ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12, marginBottom: 24, animation: "fadeUp 0.4s ease both",
        }}>
          <StatCard label="Total Reports" value={total} icon="◈" accent="#3b82f6" />
          <StatCard label="Pending Review" value={pending} icon="◐" accent="#f59e0b" sub={pending > 0 ? "Action required" : "All clear"} />
          <StatCard label="Approved" value={approved} icon="◉" accent="#22c55e" sub="Visible on public map" />
          <StatCard label="Rejected" value={rejected} icon="◎" accent="#ef4444" />
          <StatCard label="High Severity" value={highSev} icon="⬡" accent="#ef4444" sub="Approved reports" />
        </div>

        {/* ════ REPORTS TAB ════ */}
        {activeTab === "reports" && (
          <div style={{ animation: "fadeUp 0.3s ease both" }}>

            {/* Filter bar */}
            <div className="card" style={{ padding: "14px 18px", marginBottom: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>

              {/* Search */}
              <div style={{ position: "relative", flex: "1 1 220px" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14 }}>⌕</span>
                <input
                  className="search-input"
                  style={{ width: "100%" }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by location, type, description, respondent…"
                />
              </div>

              {/* Status tabs */}
              <div style={{ display: "flex", gap: 2, background: "#f1f5f9", borderRadius: 9, padding: 3, border: "1px solid #e2e8f0" }}>
                {[["all", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]].map(([val, label]) => (
                  <button key={val} onClick={() => setStatusFilter(val)} className="status-tab" style={{
                    background: statusFilter === val ? "#fff" : "transparent",
                    color: statusFilter === val ? "#2563eb" : "#94a3b8",
                    border: statusFilter === val ? "1px solid #bfdbfe" : "1px solid transparent",
                    boxShadow: statusFilter === val ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  }}>{label}</button>
                ))}
              </div>

              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="filter-select">
                <option value="All">All Types</option>
                <option value="Road">Road</option>
                <option value="Bridge">Bridge</option>
                <option value="Public Building">Public Building</option>
              </select>

              <select value={sevFilter} onChange={(e) => setSevFilter(e.target.value)} className="filter-select">
                <option value="All">All Severities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
                <option value="severity">Sort: Severity</option>
                <option value="score">Sort: Score</option>
                <option value="date">Sort: Newest</option>
              </select>

              <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", fontFamily: "'IBM Plex Mono', monospace" }}>
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Table */}
            <div className="card" style={{ overflow: "hidden" }}>
              {loading ? (
                <div style={{ padding: 64, textAlign: "center", color: "#94a3b8" }}>
                  <div style={{ animation: "spin 0.8s linear infinite", display: "inline-block", fontSize: 30, marginBottom: 14 }}>⟳</div>
                  <p style={{ fontSize: 13, fontFamily: "'Inter', sans-serif" }}>Loading reports…</p>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 64, textAlign: "center", color: "#94a3b8" }}>
                  <div style={{ fontSize: 44, marginBottom: 14, opacity: 0.4 }}>◈</div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>No reports found</p>
                  <p style={{ fontSize: 13, fontFamily: "'Inter', sans-serif" }}>Try adjusting your filters or search query.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        {["Type", "Location", "Severity", "Score", "Status", "Submitted", "Photo", "Action"].map((h) => (
                          <th key={h} style={{
                            padding: "11px 18px", textAlign: "left",
                            fontSize: 9, fontWeight: 700, letterSpacing: 1.8,
                            color: "#94a3b8", textTransform: "uppercase", whiteSpace: "nowrap",
                            fontFamily: "'Syne', sans-serif",
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <ReportRow key={r.id} report={r} onSelect={setSelectedReport} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pending nudge */}
            {pending > 0 && statusFilter === "pending" && filtered.length > 0 && (
              <div style={{
                marginTop: 12, padding: "13px 18px",
                background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12,
                fontSize: 13, color: "#d97706", fontWeight: 500, fontFamily: "'Inter', sans-serif",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 16 }}>◐</span>
                <span><strong>{pending}</strong> report{pending !== 1 ? "s are" : " is"} awaiting verification. Click any row to open the review panel.</span>
              </div>
            )}
          </div>
        )}

        {/* ════ ANALYTICS TAB ════ */}
        {activeTab === "analytics" && (
          <div style={{ animation: "fadeUp 0.3s ease both", display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>

            {/* Reports by Type */}
            <div className="card" style={{ padding: 26 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#334155", marginBottom: 4, letterSpacing: 0.2 }}>Reports by Infrastructure Type</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 24, fontFamily: "'Inter', sans-serif" }}>Distribution across all submitted reports</div>
              {byType.map((t) => (
                <div key={t.type} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#334155", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                      <span style={{
                        width: 26, height: 26, borderRadius: 7, background: "#eff6ff",
                        border: "1px solid #bfdbfe", display: "inline-flex",
                        alignItems: "center", justifyContent: "center", fontSize: 13, color: "#2563eb",
                      }}>{TYPE_ICON[t.type]}</span>
                      {t.type}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'IBM Plex Mono', monospace" }}>
                      {t.approved}/{t.total} approved
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 10,
                      background: "linear-gradient(90deg, #2563eb, #60a5fa)",
                      width: total > 0 ? `${(t.total / total) * 100}%` : "0%",
                      transition: "width 0.8s ease",
                    }} />
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                    {t.high > 0 && <span style={{ fontSize: 10, color: "#dc2626", fontWeight: 600 }}>⬡ {t.high} high severity</span>}
                    <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'IBM Plex Mono', monospace" }}>
                      {Math.round(total ? (t.total / total) * 100 : 0)}% of total
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Severity Breakdown */}
            <div className="card" style={{ padding: 26 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#334155", marginBottom: 4 }}>Severity Distribution</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 24, fontFamily: "'Inter', sans-serif" }}>All submitted reports</div>
              {bySeverity.map((b) => {
                const sevC = SEV_COLOR[b.sev];
                return (
                  <div key={b.sev} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <div style={{ width: 64, fontSize: 12, fontWeight: 700, color: sevC.text }}>{b.sev}</div>
                    <div style={{ flex: 1, height: 32, background: "#f8fafc", borderRadius: 8, overflow: "hidden", border: `1px solid ${sevC.border}` }}>
                      <div style={{
                        height: "100%", borderRadius: 7,
                        background: `linear-gradient(90deg, ${sevC.dot}88, ${sevC.dot}cc)`,
                        width: `${(b.total / maxSevCount) * 100}%`,
                        transition: "width 0.8s ease",
                        display: "flex", alignItems: "center", paddingLeft: 12,
                      }}>
                        {b.total > 0 && <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{b.total}</span>}
                      </div>
                    </div>
                    <div style={{ width: 32, fontSize: 12, color: "#94a3b8", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>
                      {b.total}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Overview */}
            <div className="card" style={{ padding: 26 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#334155", marginBottom: 24 }}>Verification Status</div>
              {[
                { label: "Pending", count: pending, s: "pending" },
                { label: "Approved", count: approved, s: "approved" },
                { label: "Rejected", count: rejected, s: "rejected" },
              ].map(({ label, count, s }) => {
                const sc = STATUS_COLOR[s];
                return (
                  <div key={label} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 18px", borderRadius: 12, background: sc.bg,
                    border: `1px solid ${sc.border}`, marginBottom: 10, cursor: "pointer",
                    transition: "transform 0.1s, opacity 0.1s",
                  }}
                    onClick={() => { setStatusFilter(s); setActiveTab("reports"); }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateX(4px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateX(0)")}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: sc.text, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{sc.icon}</span> {label}
                    </span>
                    <span style={{ fontSize: 26, fontWeight: 800, color: sc.text, fontFamily: "'IBM Plex Mono', monospace" }}>{count}</span>
                  </div>
                );
              })}
              <div style={{ marginTop: 16, padding: "16px 18px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600 }}>Approval Rate</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: -1, marginBottom: 10 }}>
                  {total > 0 ? Math.round((approved / total) * 100) : 0}%
                </div>
                <div style={{ height: 6, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 10,
                    background: "linear-gradient(90deg, #16a34a, #4ade80)",
                    width: total > 0 ? `${(approved / total) * 100}%` : "0%",
                    transition: "width 0.8s ease",
                  }} />
                </div>
              </div>
            </div>

            {/* Priority List — full width */}
            <div className="card" style={{ padding: 26, gridColumn: "1 / -1" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", letterSpacing: -0.3 }}>LGU Priority List</div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400, fontFamily: "'Inter', sans-serif" }}>Approved reports · sorted by severity then score</div>
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 22, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
                Use this prioritized list to determine which infrastructure issues require immediate attention. High-severity items represent the most urgent repair needs.
              </div>

              {priorityList.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
                  No approved reports yet. Approve reports from the Reports tab to populate this list.
                </div>
              ) : (
                priorityList.map((r, i) => {
                  const sev = getSeverity(r.score);
                  const sevC = SEV_COLOR[sev];
                  const isTop3 = i < 3;
                  return (
                    <div key={r.id} style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                      borderRadius: 12, marginBottom: 8, cursor: "pointer",
                      border: `1px solid ${isTop3 ? sevC.border : "#f1f5f9"}`,
                      background: isTop3 ? sevC.pill : "#fafafa",
                      transition: "transform 0.15s, box-shadow 0.15s",
                    }}
                      onClick={() => setSelectedReport(r)}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      {/* Rank badge */}
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                        background: i === 0 ? sevC.dot : "#f1f5f9",
                        border: `1.5px solid ${i < 3 ? sevC.border : "#e2e8f0"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 800,
                        color: i === 0 ? "white" : i < 3 ? sevC.text : "#94a3b8",
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}>#{i + 1}</div>

                      <div style={{
                        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                        background: sevC.pill, border: `1px solid ${sevC.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, color: sevC.text,
                      }}>{TYPE_ICON[r.type]}</div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", fontFamily: "'Syne', sans-serif" }}>
                          {r.place_name || `${Number(r.lat).toFixed(4)}°N, ${Number(r.lng).toFixed(4)}°E`}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif" }}>
                          {r.type} · {r.description?.slice(0, 90)}{(r.description?.length || 0) > 90 ? "…" : ""}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <span className="tag" style={{ background: sevC.pill, color: sevC.pillText, border: `1px solid ${sevC.border}` }}>{sev}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: sevC.text, fontFamily: "'IBM Plex Mono', monospace" }}>
                          {r.score}pt
                        </span>
                        <span style={{ fontSize: 11, color: "#cbd5e1", fontFamily: "'IBM Plex Mono', monospace" }}>
                          {r.created_at?.slice(0, 10)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Report Detail Modal ── */}
      {selectedReport && (
        <ReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* ── Toast ── */}
      {toast && (() => {
        const tc = toastColors[toast.type] || toastColors.info;
        return (
          <div style={{
            position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
            background: tc.bg, backdropFilter: "blur(12px)",
            border: `1px solid ${tc.border}`,
            color: tc.text, padding: "12px 22px", borderRadius: 12,
            fontSize: 13, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            zIndex: 9999, animation: "slideUp 0.2s ease", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 10, fontFamily: "'Syne', sans-serif",
          }}>
            <span>{tc.icon}</span>
            {toast.msg}
          </div>
        );
      })()}
    </div>
  );
}