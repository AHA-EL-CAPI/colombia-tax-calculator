"use client";

import React from "react";

interface DependientesInputProps {
  value: number;
  onChange: (n: number) => void;
}

export function DependientesInput({ value, onChange }: DependientesInputProps) {
  const MAX = 4;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:"0.75rem", fontWeight:700, color:"var(--text-secondary)",
        letterSpacing:"0.04em", textTransform:"uppercase" }}>
        Dependientes (Arts. 387 y 336)
      </label>
      {/* Hidden input exposes stepper value to Playwright / form APIs */}
      <input
        type="number"
        id="num-dependientes"
        name="num-dependientes"
        value={value}
        readOnly
        style={{ display: "none" }}
      />
      <div style={{ display:"flex", alignItems:"center", gap:0,
        background:"var(--bg-card)", border:"1.5px solid var(--border-color)",
        borderRadius:10, overflow:"hidden", width:"fit-content" }}>
        <button
          data-testid="btn-sub-dep"
          aria-label="Reducir dependientes"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          style={{ padding:"10px 16px", background:"transparent", border:"none",
            cursor: value===0?"not-allowed":"pointer",
            fontSize:"1.1rem", fontWeight:700, color: value===0?"var(--text-muted)":"var(--text-secondary)",
            transition:"color 0.15s" }}>−</button>
        <div style={{ minWidth:48, textAlign:"center",
          fontFamily:"JetBrains Mono, monospace", fontSize:"1rem", fontWeight:700,
          color:"var(--text-primary)", padding:"0 4px",
          borderLeft:"1px solid var(--border-color)",
          borderRight:"1px solid var(--border-color)" }}>
          {value}
        </div>
        <button
          data-testid="btn-add-dep"
          aria-label="Aumentar dependientes"
          onClick={() => onChange(Math.min(MAX, value + 1))}
          disabled={value === MAX}
          style={{ padding:"10px 16px", background:"transparent", border:"none",
            cursor: value===MAX?"not-allowed":"pointer",
            fontSize:"1.1rem", fontWeight:700, color: value===MAX?"var(--text-muted)":"#34d399",
            transition:"color 0.15s" }}>+</button>
      </div>
      <div style={{ fontSize:"0.68rem", color:"var(--text-muted)", lineHeight:1.5 }}>
        {value === 0
          ? "Sin beneficio por dependientes"
          : <>Art. 387: 10% bruto (≤32 UVT/mes) · Art. 336: {value}×72 UVT/año</>}
      </div>
    </div>
  );
}
