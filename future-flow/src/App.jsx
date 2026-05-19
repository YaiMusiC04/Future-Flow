import { useState, useRef, useEffect, createContext, useContext } from 'react'

function usePersisted(key, initial) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial } catch { return initial }
  })
  useEffect(() => {
    try { v == null ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(v)) } catch {}
  }, [key, v])
  return [v, setV]
}

const BeginnerCtx = createContext(false)
const useBeginner = () => useContext(BeginnerCtx)

function Tip({ children }) {
  const on = useBeginner()
  if (!on) return null
  return <div style={{ fontSize:10.5, color:'rgba(245,158,11,0.85)', marginTop:4, lineHeight:1.45, display:'flex', gap:5, alignItems:'flex-start' }}>
    <span style={{ flexShrink:0 }}>💡</span><span>{children}</span>
  </div>
}

function Gauge({ value=0, size=78, label='ÉXITO' }) {
  const safe = Math.max(0, Math.min(100, value || 0))
  const r = (size - 10) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - safe / 100)
  const color = safe >= 70 ? '#22C55E' : safe >= 50 ? '#F59E0B' : '#EF4444'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset} transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition:'stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)' }} />
      <text x={size/2} y={size/2 - 1} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize={size*0.3} fontWeight="900">{safe}</text>
      <text x={size/2} y={size/2 + size*0.22} textAnchor="middle" fill="rgba(240,240,245,0.4)" fontSize="7" fontWeight="800" letterSpacing="0.1em">{label}</text>
    </svg>
  )
}

function Donut({ data, size=140, thickness=22 }) {
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const total = data.reduce((s,d) => s + (d.value||0), 0) || 1
  const palette = ['#3B82F6','#22C55E','#F59E0B','#A855F7','#06B6D4','#EC4899','#EF4444','#84CC16']
  let acc = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={thickness} />
      {data.map((d,i) => {
        const pct = (d.value||0) / total
        if (pct <= 0) return null
        const len = c * pct - 1.5
        const start = c * acc
        acc += pct
        return (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={d.color || palette[i % palette.length]} strokeWidth={thickness} strokeLinecap="butt"
            strokeDasharray={`${len} ${c}`} strokeDashoffset={-start}
            transform={`rotate(-90 ${size/2} ${size/2})`} />
        )
      })}
    </svg>
  )
}

function PriceRange({ low, high, current, target, stop }) {
  if (low == null || high == null || current == null || high <= low) return null
  const clamp = v => Math.max(0, Math.min(100, ((v - low) / (high - low)) * 100))
  const cur = clamp(current)
  const tgt = target != null ? clamp(target) : null
  const stp = stop   != null ? clamp(stop)   : null
  return (
    <div style={{ marginTop:4 }}>
      <div style={{ position:'relative', height:8, background:'linear-gradient(90deg, rgba(34,197,94,0.55), rgba(245,158,11,0.45), rgba(239,68,68,0.55))', borderRadius:5 }}>
        {stp != null && <div title="stop loss" style={{ position:'absolute', left:`${stp}%`, top:-2, width:2, height:12, background:'#EF4444', transform:'translateX(-50%)' }} />}
        {tgt != null && <div title="objetivo" style={{ position:'absolute', left:`${tgt}%`, top:-2, width:2, height:12, background:'#22C55E', transform:'translateX(-50%)' }} />}
        <div style={{ position:'absolute', left:`${cur}%`, top:-4, transform:'translateX(-50%)', width:14, height:14, background:'#fff', borderRadius:'50%', border:'3px solid #0A0A0F', boxShadow:'0 0 0 1px rgba(255,255,255,0.6)' }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--text-mute)', marginTop:5 }}>
        <span>52-sem mín ${low?.toFixed(0)}</span>
        <span style={{ color:'var(--text-dim)' }}>actual ${current?.toFixed(2)}</span>
        <span>máx ${high?.toFixed(0)}</span>
      </div>
    </div>
  )
}

function Legend({ items }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
      {items.map((it,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:10, height:10, borderRadius:3, background:it.color, flexShrink:0 }} />
          <span style={{ fontSize:12, color:'var(--text-dim)', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{it.label}</span>
          <span style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{it.right}</span>
        </div>
      ))}
    </div>
  )
}

const fmt$   = v => v != null ? `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'
const fmtK   = v => v >= 1e6  ? `$${(v/1e6).toFixed(1)}M` : `$${(v/1e3).toFixed(0)}K`
const fmtPct = v => v != null ? `${v > 0 ? '+' : ''}${Number(v).toFixed(1)}%` : '—'

function Spinner({ size = 18, color = 'var(--blue)' }) {
  return <div style={{ width: size, height: size, border: `2px solid ${color}33`, borderTop: `2px solid ${color}`, borderRadius: '50%', animation: 'spin 0.75s linear infinite', flexShrink: 0 }} />
}

function Tag({ label, color }) {
  return <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}1A`, padding: '3px 9px', borderRadius: 6, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>{label}</span>
}

function MiniLabel({ children }) {
  return <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-mute)', marginBottom: 5 }}>{children}</div>
}

function Card({ children, style }) {
  return <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 16px', ...style }}>{children}</div>
}

function EmptyHero({ icon, title, sub, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 20px 24px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ fontSize: 44, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 7 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: 'var(--text-mute)', lineHeight: 1.65, maxWidth: 300, marginBottom: 24 }}>{sub}</div>}
      {children}
    </div>
  )
}

function LoadingState({ title, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 20px', gap: 14 }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={24} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-mute)', textAlign: 'center', maxWidth: 260, lineHeight: 1.6 }}>{sub}</div>}
    </div>
  )
}

function SuggestionList({ items, onPick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 360, margin: '0 auto' }}>
      {items.map(s => (
        <button key={s} onClick={() => onPick(s)} style={{ padding: '12px 15px', textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'var(--text-dim)', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseOver={e => { e.currentTarget.style.background='rgba(59,130,246,0.09)'; e.currentTarget.style.borderColor='rgba(59,130,246,0.28)' }}
          onMouseOut={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)' }}>
          {s}
        </button>
      ))}
    </div>
  )
}

function BottomInput({ value, onChange, onSubmit, placeholder, busy, accentColor = 'var(--blue)' }) {
  return (
    <div style={{ padding: '10px 14px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', gap: 8 }}>
      <input value={value} onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onSubmit() } }}
        placeholder={placeholder} disabled={busy}
        style={{ flex: 1, padding: '11px 13px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font)' }}
        onFocus={e => e.target.style.borderColor = `${accentColor}77`}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      />
      <button onClick={onSubmit} disabled={!value.trim() || busy} style={{ width: 42, height: 42, flexShrink: 0, background: value.trim() && !busy ? accentColor : 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 11, cursor: value.trim() && !busy ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
        {busy ? <Spinner size={16} /> : <svg width="16" height="16" fill="none" stroke={value.trim() ? '#fff' : 'rgba(255,255,255,0.3)'} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>}
      </button>
    </div>
  )
}

function ProbBar({ value }) {
  const color = value >= 70 ? 'var(--green)' : value >= 50 ? 'var(--amber)' : 'var(--red)'
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <MiniLabel>PROBABILIDAD DE ÉXITO</MiniLabel>
        <span style={{ fontSize: 14, fontWeight: 800, color }}>{value}%</span>
      </div>
      <div style={{ height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3, transition: 'width 1.2s cubic-bezier(.16,1,.3,1)' }} />
      </div>
    </div>
  )
}

const ACTION_HELP = {
  COMPRAR:   'La IA cree que la acción tiene buenas chances de subir. Riesgo más bajo.',
  ESPECULAR: 'Hay oportunidad pero también más riesgo. Solo invierte lo que estés dispuesto a perder.',
  OBSERVAR:  'Todavía no es momento de comprar. Espera mejor señal.',
}

function StockCard({ pick, idx }) {
  const actionClr = { COMPRAR:'var(--green)', ESPECULAR:'var(--amber)', OBSERVAR:'var(--text-mute)' }[pick.action] || 'var(--text-mute)'
  const riskClr   = { BAJO:'var(--green)', MEDIO:'var(--amber)', ALTO:'var(--red)' }[pick.riskLevel] || 'var(--text-mute)'
  const hasOpts   = pick.optionsPlay?.strategy && pick.optionsPlay.strategy !== 'N/A'
  const upside    = pick.target30d && pick.currentPrice ? ((pick.target30d - pick.currentPrice) / pick.currentPrice) * 100 : null
  const downside  = pick.stopLoss && pick.currentPrice ? ((pick.stopLoss - pick.currentPrice) / pick.currentPrice) * 100 : null

  return (
    <Card style={{ marginBottom: 14, animation: `fadeIn 0.35s ease ${idx * 0.1}s both`, padding:'16px 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
            <span style={{ fontSize:22, fontWeight:900, letterSpacing:'-0.5px' }}>{pick.symbol}</span>
            <Tag label={`${pick.changePercent?.toFixed(1)}% hoy`} color="var(--red)" />
          </div>
          <div style={{ fontSize:12, color:'var(--text-mute)', marginBottom:8 }}>{pick.name}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <Tag label={pick.action} color={actionClr} />
            <span style={{ fontSize:10, fontWeight:700, color:riskClr, letterSpacing:'0.04em' }}>● RIESGO {pick.riskLevel}</span>
          </div>
          <Tip>{ACTION_HELP[pick.action]}</Tip>
        </div>
        <div style={{ flexShrink:0 }}>
          <Gauge value={pick.probability} label="ÉXITO" />
        </div>
      </div>

      {pick.probabilityReason && <div style={{ fontSize:12, color:'var(--text-dim)', lineHeight:1.5, marginBottom:12, padding:'9px 11px', background:'rgba(255,255,255,0.03)', borderRadius:9 }}>{pick.probabilityReason}</div>}
      <Tip>"Probabilidad de éxito" es la confianza de la IA en que esta apuesta funcione. 70+ es alta confianza, 50-70 media, menos de 50 baja.</Tip>

      {pick.fiftyTwoWeekLow != null && pick.fiftyTwoWeekHigh != null && (
        <div style={{ marginBottom:14, marginTop:10 }}>
          <MiniLabel>POSICIÓN EN EL AÑO</MiniLabel>
          <PriceRange low={pick.fiftyTwoWeekLow} high={pick.fiftyTwoWeekHigh} current={pick.currentPrice} target={pick.target30d} stop={pick.stopLoss} />
          <Tip>El punto blanco muestra dónde está el precio dentro de su rango de los últimos 12 meses. Verde = stop loss, gris = objetivo. Cerca del mín suele ser zona de oportunidad.</Tip>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:12 }}>
        <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.22)', borderRadius:10, padding:'10px 12px' }}>
          <div style={{ fontSize:9, fontWeight:700, color:'rgba(34,197,94,0.85)', letterSpacing:'0.07em', marginBottom:3 }}>↗ OBJETIVO 30d</div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--green)' }}>{fmt$(pick.target30d)}</div>
          {upside != null && <div style={{ fontSize:11, color:'var(--green)', fontWeight:600 }}>+{upside.toFixed(1)}% potencial</div>}
          <Tip>Precio al que la IA cree que podría llegar en 30 días. No garantizado.</Tip>
        </div>
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.22)', borderRadius:10, padding:'10px 12px' }}>
          <div style={{ fontSize:9, fontWeight:700, color:'rgba(239,68,68,0.85)', letterSpacing:'0.07em', marginBottom:3 }}>↘ STOP LOSS</div>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--red)' }}>{fmt$(pick.stopLoss)}</div>
          {downside != null && <div style={{ fontSize:11, color:'var(--red)', fontWeight:600 }}>{downside.toFixed(1)}% máx pérdida</div>}
          <Tip>Precio al que deberías vender si la cosa sale mal. Limita tus pérdidas.</Tip>
        </div>
      </div>

      <div style={{ background:'var(--bg3)', borderRadius:10, padding:'9px 12px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
        <div>
          <div style={{ fontSize:9, color:'var(--text-mute)', fontWeight:700, letterSpacing:'0.06em' }}>ZONA DE COMPRA</div>
          <div style={{ fontSize:13, fontWeight:700 }}>{fmt$(pick.entryLow)} – {fmt$(pick.entryHigh)}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:9, color:'var(--text-mute)', fontWeight:700, letterSpacing:'0.06em' }}>PRECIO AHORA</div>
          <div style={{ fontSize:13, fontWeight:700 }}>{fmt$(pick.currentPrice)}</div>
        </div>
      </div>
      <Tip>"Zona de compra" es el rango de precio donde tiene más sentido entrar. Si la acción está dentro, es buen momento.</Tip>

      {(pick.revenueGrowth != null || pick.earningsGrowth != null) && (
        <div style={{ display:'flex', gap:8, marginBottom:12, marginTop:12 }}>
          {[{l:'VENTAS vs año pasado',v:pick.revenueGrowth,tip:'Cuánto más dinero está facturando la empresa que el año pasado.'},
            {l:'GANANCIAS vs año pasado',v:pick.earningsGrowth,tip:'Cuánto más dinero está ganando la empresa que el año pasado.'}].map(({l,v,tip}) =>
            v != null ? (
              <div key={l} style={{ flex:1, background:v>=0?'rgba(34,197,94,0.08)':'rgba(239,68,68,0.08)', border:`1px solid ${v>=0?'rgba(34,197,94,0.22)':'rgba(239,68,68,0.22)'}`, borderRadius:9, padding:'8px 10px' }}>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.04em', color:'var(--text-mute)', marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:14, fontWeight:800, color:v>=0?'var(--green)':'var(--red)' }}>{fmtPct(v)} {v>=0?'↑':'↓'}</div>
                <Tip>{tip}</Tip>
              </div>
            ) : null
          )}
        </div>
      )}

      <div style={{ fontSize:13, color:'var(--text-dim)', lineHeight:1.65, marginBottom:hasOpts?12:0, padding:'10px 12px', background:'rgba(255,255,255,0.02)', borderRadius:9, borderLeft:'2px solid var(--blue)' }}>{pick.reasoning}</div>

      {hasOpts && (
        <div style={{ background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:11, padding:'11px 13px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
            <span style={{ fontSize:11, fontWeight:800, color:'var(--blue)', letterSpacing:'0.04em' }}>📈 OPCIONES · {pick.optionsPlay.strategy}</span>
            <span style={{ fontSize:10, color:'var(--text-mute)' }}>~{pick.optionsPlay.daysToExpiry} días</span>
          </div>
          <Tip>Las opciones son contratos avanzados — apuestas con apalancamiento. Si no las conoces, IGNORA esta sección. Estudia primero.</Tip>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginTop:8 }}>
            <div style={{ background:'var(--bg3)', borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
              <div style={{ fontSize:8, color:'var(--text-mute)', fontWeight:700 }}>STRIKE</div>
              <div style={{ fontSize:12, fontWeight:800 }}>${pick.optionsPlay.strike}</div>
            </div>
            <div style={{ background:'var(--bg3)', borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
              <div style={{ fontSize:8, color:'var(--text-mute)', fontWeight:700 }}>PRIMA</div>
              <div style={{ fontSize:12, fontWeight:800 }}>{pick.optionsPlay.estimatedPremium}</div>
            </div>
            <div style={{ background:'rgba(34,197,94,0.12)', borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
              <div style={{ fontSize:8, color:'var(--text-mute)', fontWeight:700 }}>MAX</div>
              <div style={{ fontSize:12, fontWeight:800, color:'var(--green)' }}>+{pick.optionsPlay.maxGainPct}</div>
            </div>
          </div>
          {pick.optionsPlay.reason && <div style={{ fontSize:11, color:'var(--text-mute)', marginTop:7, lineHeight:1.5 }}>{pick.optionsPlay.reason}</div>}
        </div>
      )}
    </Card>
  )
}

const SCREENER_TIPS = [
  'Acciones abajo -5% con ingresos creciendo hoy',
  'Busca oportunidades en tecnología',
  'Las 3 mejores opciones CALL de hoy',
  'Análisis completo del mercado',
]

function ScreenerTab() {
  const [input, setInput]   = useState('')
  const [busy, setBusy]     = useState(false)
  const [result, setResult] = usePersisted('ff_screener_result', null)
  const [error, setError]   = useState(null)

  const run = async (q) => {
    const query = (q ?? input).trim()
    if (!query || busy) return
    setInput(''); setBusy(true); setResult(null); setError(null)
    try {
      const r = await fetch('/api/financial-screener', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ query }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || `Error ${r.status}`)
      setResult(d)
    } catch(e) { setError(e.message) }
    finally { setBusy(false) }
  }

  return (
    <>
      <div style={{ flex:1, overflowY:'auto', padding:'14px 14px 8px' }}>
        {!busy && !result && !error && (
          <EmptyHero icon="📊" title="Screener Inteligente" sub="Escaneo en tiempo real de +160 acciones. Siempre 3 oportunidades con probabilidad y estrategia de opciones.">
            <SuggestionList items={SCREENER_TIPS} onPick={run} />
          </EmptyHero>
        )}
        {busy && <LoadingState title="Analizando mercados…" sub="Escaneando Yahoo Finance · Filtrando candidatos · Calculando probabilidades con IA" />}
        {error && <div style={{ margin:'16px 0', padding:'12px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, fontSize:13, color:'var(--red)' }}>{error}</div>}

        {result && !busy && (
          <div style={{ animation:'fadeIn 0.3s ease' }}>
            {result.marketOverview && (
              <div style={{ background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.18)', borderRadius:13, padding:'11px 13px', marginBottom:14 }}>
                <MiniLabel>CONTEXTO DE MERCADO · {new Date(result.fetchedAt).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</MiniLabel>
                <div style={{ fontSize:13, color:'var(--text-dim)', lineHeight:1.6 }}>{result.marketOverview}</div>
                {result.scanned > 0 && <div style={{ fontSize:11, color:'var(--text-mute)', marginTop:5 }}>Escaneadas: {result.scanned} · Caídas ≥5%: {result.losersFound}</div>}
              </div>
            )}
            {result.picks?.length > 0
              ? result.picks.map((p,i) => <StockCard key={p.symbol} pick={p} idx={i} />)
              : <div style={{ textAlign:'center', padding:'28px', color:'var(--text-mute)', fontSize:13 }}>Sin acciones con ese criterio ahora. Intenta más tarde.</div>
            }
            {result.disclaimer && <div style={{ marginTop:8, padding:'9px 13px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, fontSize:11, color:'var(--text-mute)', lineHeight:1.5 }}>⚠️ {result.disclaimer}</div>}
            <button onClick={() => setResult(null)} style={{ width:'100%', marginTop:10, padding:'11px', background:'transparent', border:'1px solid var(--border)', borderRadius:12, color:'var(--text-mute)', fontSize:13, cursor:'pointer' }}>Nueva búsqueda</button>
          </div>
        )}
        <div style={{ height:16 }} />
      </div>
      <BottomInput value={input} onChange={setInput} onSubmit={() => run()} placeholder="Ej: Tecnología abajo 5% con ventas subiendo…" busy={busy} />
    </>
  )
}

function FlowRow({ f, idx }) {
  const isBull = f.type === 'CALL'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 13px', background:'var(--bg2)', border:`1px solid ${isBull?'rgba(34,197,94,0.18)':'rgba(239,68,68,0.18)'}`, borderRadius:12, marginBottom:8, animation:`fadeIn 0.25s ease ${idx*0.04}s both` }}>
      <div style={{ width:44, height:44, borderRadius:11, background:isBull?'rgba(34,197,94,0.14)':'rgba(239,68,68,0.14)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <span style={{ fontSize:8, fontWeight:800, color:isBull?'var(--green)':'var(--red)', letterSpacing:'0.05em' }}>{isBull?'SUBE':'BAJA'}</span>
        <span style={{ fontSize:13 }}>{isBull?'🟢':'🔴'}</span>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
          <span style={{ fontSize:16, fontWeight:800 }}>{f.symbol}</span>
          <span style={{ fontSize:11, color:'var(--text-mute)' }}>${f.strike} · {f.expiry}</span>
          {f.daysOut <= 7 && <Tag label="PRONTO" color="var(--amber)" />}
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:'var(--text-dim)' }}>Vol <b>{f.volume?.toLocaleString()}</b></span>
          <span style={{ fontSize:11, fontWeight:700, color:'var(--amber)' }}>{f.volOiRatio}× lo normal</span>
        </div>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{ fontSize:15, fontWeight:800, color:isBull?'var(--green)':'var(--red)' }}>{fmtK(f.notional)}</div>
        <div style={{ fontSize:9, color:'var(--text-mute)' }}>apuesta</div>
      </div>
    </div>
  )
}

function WhaleTab() {
  const [busy, setBusy]   = useState(false)
  const [data, setData]   = usePersisted('ff_whales_data', null)
  const [error, setError] = useState(null)

  const scan = async () => {
    setBusy(true); setData(null); setError(null)
    try {
      const r = await fetch('/api/options-flow', { method:'POST', headers:{'content-type':'application/json'}, body:'{}' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || `Error ${r.status}`)
      setData(d)
    } catch(e) { setError(e.message) }
    finally { setBusy(false) }
  }

  const bulls = data?.flows?.filter(f => f.type==='CALL') || []
  const bears = data?.flows?.filter(f => f.type==='PUT')  || []
  const total = data?.flows?.reduce((s,f) => s + f.notional, 0) || 0

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'14px 14px', paddingBottom:'calc(16px + env(safe-area-inset-bottom))' }}>
      {!busy && !data && !error && (
        <EmptyHero icon="🐋" title="Flujo de Ballenas" sub="Detecta apuestas institucionales analizando volumen de opciones vs. open interest. Cuanto mayor el ratio, más inusual la actividad.">
          <button onClick={scan} style={{ padding:'13px 32px', background:'var(--blue)', border:'none', borderRadius:13, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', marginBottom:10 }}>
            Escanear ahora
          </button>
          <div style={{ fontSize:11, color:'var(--text-mute)' }}>Analiza ~24 activos: SPY, QQQ, AAPL, NVDA, TSLA…</div>
        </EmptyHero>
      )}

      {busy && <LoadingState title="Escaneando flujo de opciones…" sub="Analizando volumen vs. open interest en 24 activos líquidos" />}
      {error && <div style={{ padding:'12px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, fontSize:13, color:'var(--red)' }}>{error}</div>}

      {data && !busy && (
        <>
          <Tip>Las "ballenas" son grandes inversionistas (fondos, bancos) que mueven millones. Cuando apuestan fuerte por algo, suele ser información valiosa. Si compran muchos CALLs creen que sube; muchos PUTs, que baja.</Tip>

          {data.interpretation && (
            <div style={{ background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.18)', borderRadius:13, padding:'12px 14px', marginBottom:14, marginTop:8 }}>
              <MiniLabel>QUÉ ESTÁ PASANDO · {new Date(data.fetchedAt).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</MiniLabel>
              <div style={{ fontSize:13, color:'var(--text-dim)', lineHeight:1.6 }}>{data.interpretation}</div>
              <div style={{ fontSize:11, color:'var(--text-mute)', marginTop:5 }}>Escaneados: {data.scanned} activos</div>
            </div>
          )}

          {data.flows?.length > 0 && (
            <Card style={{ marginBottom:14, padding:'14px 14px' }}>
              <MiniLabel>BALANCE DEL SENTIMIENTO</MiniLabel>
              <div style={{ display:'flex', height:34, borderRadius:9, overflow:'hidden', marginBottom:8 }}>
                <div style={{ flex:bulls.length||0.001, background:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center', minWidth:bulls.length?40:0 }}>
                  {bulls.length>0 && <span style={{ fontSize:12, fontWeight:800, color:'#fff' }}>{bulls.length} ↑</span>}
                </div>
                <div style={{ flex:bears.length||0.001, background:'var(--red)', display:'flex', alignItems:'center', justifyContent:'center', minWidth:bears.length?40:0 }}>
                  {bears.length>0 && <span style={{ fontSize:12, fontWeight:800, color:'#fff' }}>{bears.length} ↓</span>}
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                <span style={{ color:'var(--green)', fontWeight:700 }}>Apuestas a que SUBE</span>
                <span style={{ color:'var(--amber)', fontWeight:700 }}>Total ${(total/1e6).toFixed(1)}M</span>
                <span style={{ color:'var(--red)', fontWeight:700 }}>Apuestas a que BAJA</span>
              </div>
              <Tip>Cuando hay más barra verde que roja, las ballenas están optimistas. Más rojo = pesimistas. Equilibrado = incertidumbre.</Tip>
            </Card>
          )}

          <MiniLabel>LAS APUESTAS MÁS GRANDES</MiniLabel>
          <Tip>Ordenadas por dinero apostado. "×lo normal" significa cuántas veces más actividad de lo habitual hay en ese contrato.</Tip>
          <div style={{ marginTop:8 }}>
            {data.flows?.map((f,i) => <FlowRow key={`${f.symbol}-${f.type}-${f.strike}-${i}`} f={f} idx={i} />)}
          </div>

          <button onClick={() => setData(null)} style={{ width:'100%', marginTop:10, padding:'11px', background:'transparent', border:'1px solid var(--border)', borderRadius:12, color:'var(--text-mute)', fontSize:13, cursor:'pointer' }}>
            Volver a escanear
          </button>
        </>
      )}
    </div>
  )
}

const PORT_KEY = 'mktai_portfolio_v1'
const loadPort = () => { try { return JSON.parse(localStorage.getItem(PORT_KEY)) || { positions:[] } } catch { return { positions:[] } } }
const savePort = p => localStorage.setItem(PORT_KEY, JSON.stringify(p))

function PortfolioTab() {
  const fileRef                    = useRef(null)
  const [port, setPort]            = useState(loadPort)
  const [busy, setBusy]            = useState(false)
  const [error, setError]          = useState(null)
  const [showAdd, setShowAdd]      = useState(false)
  const [form, setForm]            = useState({ symbol:'', name:'', shares:'', avgCost:'' })

  const persist = p => { setPort(p); savePort(p) }

  const totalVal  = port.positions.reduce((s,p) => s + (p.currentValue || p.avgCost*p.shares || 0), 0)
  const totalCost = port.positions.reduce((s,p) => s + (p.avgCost*p.shares || 0), 0)
  const totalGL   = totalVal - totalCost

  const handleFile = file => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async e => {
      const b64 = e.target.result.split(',')[1]
      setBusy(true); setError(null)
      try {
        const r = await fetch('/api/portfolio-analyze', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ imageBase64:b64, mediaType:file.type||'image/jpeg' }) })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || `Error ${r.status}`)
        if (d.portfolio?.positions?.length) persist({ ...d.portfolio, uploadedAt: new Date().toISOString() })
        else throw new Error('No pude leer posiciones de la imagen. Intenta con una foto más clara.')
      } catch(e) { setError(e.message) }
      finally { setBusy(false) }
    }
    reader.readAsDataURL(file)
  }

  const refresh = async () => {
    if (!port.positions?.length) return
    setBusy(true)
    try {
      const r = await fetch('/api/portfolio-analyze', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ refreshOnly:true, positions:port.positions }) })
      const d = await r.json()
      if (d.positions) persist({ ...port, positions:d.positions, refreshedAt:new Date().toISOString() })
    } catch {}
    finally { setBusy(false) }
  }

  const addManual = () => {
    if (!form.symbol||!form.shares||!form.avgCost) return
    const cost = parseFloat(form.avgCost), shares = parseFloat(form.shares)
    persist({ ...port, positions:[...port.positions,{ symbol:form.symbol.toUpperCase().trim(), name:form.name||form.symbol.toUpperCase(), shares, avgCost:cost, currentPrice:cost, currentValue:shares*cost, gainLoss:0, gainLossPct:0 }] })
    setForm({ symbol:'', name:'', shares:'', avgCost:'' }); setShowAdd(false)
  }

  const remove = idx => persist({ ...port, positions:port.positions.filter((_,i)=>i!==idx) })

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'14px 14px', paddingBottom:'calc(16px + env(safe-area-inset-bottom))' }}>
      {!busy && !port.positions?.length && (
        <EmptyHero icon="💼" title="Tu Portafolio" sub="Sube una foto de tu brokerage y la IA extrae todo automáticamente, o agrega posiciones a mano.">
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
          <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:300, margin:'0 auto' }}>
            <button onClick={() => fileRef.current?.click()} style={{ padding:'13px', background:'var(--blue)', border:'none', borderRadius:13, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>
              📷 Subir foto del portafolio
            </button>
            <button onClick={() => setShowAdd(true)} style={{ padding:'12px', background:'transparent', border:'1px solid var(--border)', borderRadius:13, color:'var(--text-dim)', fontSize:13, cursor:'pointer' }}>
              + Agregar posición manual
            </button>
          </div>
        </EmptyHero>
      )}

      {busy && <LoadingState title="Analizando portafolio…" sub="Claude Vision está extrayendo tus posiciones de la imagen" />}
      {error && <div style={{ padding:'12px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, fontSize:13, color:'var(--red)', marginBottom:12 }}>{error}</div>}

      {port.positions?.length > 0 && !busy && (
        <>
          <Card style={{ marginBottom:14, padding:'16px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div>
                <div style={{ fontSize:26, fontWeight:900, letterSpacing:'-0.5px' }}>{fmt$(totalVal)}</div>
                <div style={{ fontSize:11, color:'var(--text-mute)', marginTop:2 }}>Valor total</div>
                <Tip>Cuánto valdría tu portafolio si vendieras todo ahora mismo.</Tip>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:18, fontWeight:800, color:totalGL>=0?'var(--green)':'var(--red)' }}>{totalGL>=0?'+':''}{fmt$(totalGL)}</div>
                <div style={{ fontSize:12, color:totalGL>=0?'var(--green)':'var(--red)', fontWeight:600 }}>{fmtPct(totalCost>0?(totalGL/totalCost)*100:0)}</div>
                <div style={{ fontSize:10, color:'var(--text-mute)' }}>ganancia/pérdida</div>
              </div>
            </div>

            {port.positions.length >= 2 && (() => {
              const palette = ['#3B82F6','#22C55E','#F59E0B','#A855F7','#06B6D4','#EC4899','#EF4444','#84CC16']
              const items = port.positions
                .map((p,i) => ({ label:p.symbol, value:(p.currentValue || p.avgCost*p.shares || 0), color:palette[i%palette.length] }))
                .sort((a,b) => b.value - a.value)
              const top = items.slice(0,6)
              const rest = items.slice(6)
              if (rest.length) top.push({ label:`+${rest.length} más`, value:rest.reduce((s,r)=>s+r.value,0), color:'#52525B' })
              const legend = top.map(it => ({
                ...it,
                right: `${((it.value/totalVal)*100).toFixed(0)}%`
              }))
              return (
                <div style={{ display:'flex', gap:14, alignItems:'center', padding:'8px 0 4px', borderTop:'1px solid var(--border)' }}>
                  <div style={{ flexShrink:0, position:'relative' }}>
                    <Donut data={top} size={120} thickness={20} />
                    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                      <div style={{ fontSize:9, color:'var(--text-mute)', fontWeight:700 }}>{port.positions.length}</div>
                      <div style={{ fontSize:9, color:'var(--text-mute)' }}>posiciones</div>
                    </div>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <Legend items={legend} />
                  </div>
                </div>
              )
            })()}
            <Tip>Esta gráfica muestra qué porcentaje de tu dinero está en cada acción. Tener TODO en una sola es muy arriesgado — diversificar reduce el riesgo.</Tip>

            <div style={{ display:'flex', gap:8 }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
              {[
                { l:'↻ Precios', fn:refresh },
                { l:'📷 Nueva foto', fn:()=>fileRef.current?.click() },
                { l:'+ Agregar', fn:()=>setShowAdd(s=>!s) },
              ].map(({l,fn}) => (
                <button key={l} onClick={fn} style={{ flex:1, padding:'8px 6px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text-dim)', fontSize:12, cursor:'pointer' }}>{l}</button>
              ))}
            </div>
          </Card>

          {showAdd && (
            <Card style={{ border:'1px solid rgba(59,130,246,0.25)', marginBottom:14 }}>
              <MiniLabel>NUEVA POSICIÓN</MiniLabel>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                {[{k:'symbol',pl:'Ticker (AAPL)',upper:true},{k:'name',pl:'Nombre (opcional)'},{k:'shares',pl:'Acciones',t:'number'},{k:'avgCost',pl:'Costo promedio $',t:'number'}].map(({k,pl,upper,t})=>(
                  <input key={k} value={form[k]} placeholder={pl} type={t||'text'}
                    onChange={e=>setForm(f=>({...f,[k]:upper?e.target.value.toUpperCase():e.target.value}))}
                    style={{ padding:'9px 11px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text)', fontSize:13, outline:'none', fontFamily:'var(--font)' }}
                    onFocus={e=>e.target.style.borderColor='rgba(59,130,246,0.45)'}
                    onBlur={e=>e.target.style.borderColor='var(--border)'}
                  />
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={addManual} style={{ flex:1, padding:'10px', background:'var(--blue)', border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>Agregar</button>
                <button onClick={()=>setShowAdd(false)} style={{ flex:1, padding:'10px', background:'transparent', border:'1px solid var(--border)', borderRadius:10, color:'var(--text-mute)', fontSize:13, cursor:'pointer' }}>Cancelar</button>
              </div>
            </Card>
          )}

          <MiniLabel>POSICIONES ({port.positions.length})</MiniLabel>
          {port.positions.map((p,i) => {
            const gl    = p.gainLoss ?? ((p.currentPrice-p.avgCost)*p.shares)
            const glPct = p.gainLossPct ?? (p.avgCost>0?(gl/(p.avgCost*p.shares))*100:0)
            const isUp  = gl >= 0
            return (
              <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:13, padding:'12px 13px', marginBottom:8, display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:15, fontWeight:800 }}>{p.symbol}</span>
                    {p.changeToday != null && <Tag label={fmtPct(p.changeToday)} color={p.changeToday>=0?'var(--green)':'var(--red)'} />}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-mute)', marginBottom:3 }}>{p.shares} acciones · Costo {fmt$(p.avgCost)}</div>
                  <span style={{ fontSize:12, fontWeight:700, color:isUp?'var(--green)':'var(--red)' }}>{isUp?'+':''}{fmt$(gl)} ({fmtPct(glPct)})</span>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:14, fontWeight:700 }}>{fmt$(p.currentValue||p.avgCost*p.shares)}</div>
                  <button onClick={()=>remove(i)} style={{ fontSize:10, color:'var(--red)', background:'none', border:'none', cursor:'pointer', opacity:0.6 }}>eliminar</button>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

const GOAL_TIPS = [
  'Quiero 50% de retorno en 10 años',
  'Llegar a $1,000,000 en 20 años',
  'Ingresos pasivos de $2,000/mes',
  'Proteger mi capital contra la inflación',
]

function GoalsTab() {
  const portfolio                 = loadPort()
  const [goal, setGoal]           = useState('')
  const [busy, setBusy]           = useState(false)
  const [plan, setPlan]           = usePersisted('ff_goals_plan', null)
  const [error, setError]         = useState(null)

  const go = async (g) => {
    const q = (g ?? goal).trim()
    if (!q || busy) return
    setBusy(true); setPlan(null); setError(null)
    try {
      const r = await fetch('/api/portfolio-analyze', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ goal:q, positions:portfolio.positions }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || `Error ${r.status}`)
      setPlan(d.plan)
    } catch(e) { setError(e.message) }
    finally { setBusy(false) }
  }

  const feasColor = { FACTIBLE:'var(--green)', DESAFIANTE:'var(--amber)', 'MUY AMBICIOSO':'var(--red)' }

  return (
    <>
      <div style={{ flex:1, overflowY:'auto', padding:'14px 14px 8px' }}>
        {!busy && !plan && !error && (
          <EmptyHero icon="🎯" title="Planificador de Metas" sub="Escribe tu meta de inversión y te genero un plan con probabilidades, hitos, asignación y pasos concretos.">
            <SuggestionList items={GOAL_TIPS} onPick={g => { setGoal(g); go(g) }} />
            {!portfolio.positions?.length && <div style={{ fontSize:11, color:'var(--text-mute)', marginTop:12, textAlign:'center' }}>Tip: agrega tu portafolio para planes más precisos</div>}
          </EmptyHero>
        )}

        {busy && <LoadingState title="Generando tu plan…" sub="Analizando portafolio · Calculando retornos · Diseñando hoja de ruta personalizada" />}
        {error && <div style={{ padding:'12px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, fontSize:13, color:'var(--red)', marginBottom:12 }}>{error}</div>}

        {plan && !busy && (
          <div style={{ animation:'fadeIn 0.3s ease' }}>
            <Card style={{ border:`1px solid ${feasColor[plan.feasibility]||'var(--border)'}44`, marginBottom:13 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <Tag label={plan.feasibility} color={feasColor[plan.feasibility]||'var(--text-mute)'} />
                  <div style={{ fontSize:13, color:'var(--text-dim)', marginTop:8, lineHeight:1.55 }}>{plan.goalSummary}</div>
                </div>
                <div style={{ textAlign:'center', marginLeft:14, flexShrink:0 }}>
                  <div style={{ fontSize:30, fontWeight:900, color:feasColor[plan.feasibility]||'var(--text)' }}>{plan.probability}%</div>
                  <div style={{ fontSize:9, color:'var(--text-mute)' }}>prob. éxito</div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {[{l:'ACTUAL',v:fmt$(plan.currentValue)},{l:'OBJETIVO',v:fmt$(plan.targetValue),c:'var(--green)'},{l:'RETORNO/AÑO',v:`${plan.requiredAnnualReturn?.toFixed(1)}%`}].map(({l,v,c})=>(
                  <div key={l} style={{ background:'var(--bg3)', borderRadius:9, padding:'8px 6px', textAlign:'center' }}>
                    <div style={{ fontSize:8, fontWeight:700, letterSpacing:'0.06em', color:'var(--text-mute)', marginBottom:2 }}>{l}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:c||'var(--text)' }}>{v}</div>
                  </div>
                ))}
              </div>
              {plan.monthlyContributionNeeded > 0 && (
                <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:9 }}>
                  <span style={{ fontSize:12, color:'var(--amber)' }}>💡 Para asegurar la meta: <b>{fmt$(plan.monthlyContributionNeeded)}/mes</b> adicional</span>
                </div>
              )}
              <div style={{ fontSize:12, color:'var(--text-mute)', marginTop:8, lineHeight:1.5 }}>{plan.feasibilityReason}</div>
            </Card>

            {plan.recommendedAllocation?.length > 0 && (
              <Card style={{ marginBottom:12 }}>
                <MiniLabel>CÓMO REPARTIR TU DINERO</MiniLabel>
                <Tip>Esta es la mezcla recomendada de tipos de inversión. Diversificar (no poner todo en una cosa) reduce el riesgo de perderlo todo.</Tip>
                {(() => {
                  const palette = ['#3B82F6','#22C55E','#F59E0B','#A855F7','#06B6D4','#EC4899']
                  const dData = plan.recommendedAllocation.map((a,i) => ({ label:a.type, value:a.percentage, color:palette[i%palette.length] }))
                  return (
                    <div style={{ display:'flex', gap:14, alignItems:'center', marginTop:10, marginBottom:14 }}>
                      <div style={{ flexShrink:0 }}><Donut data={dData} size={130} thickness={22} /></div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <Legend items={dData.map(d => ({ ...d, right: `${d.value}%` }))} />
                      </div>
                    </div>
                  )
                })()}
                {plan.recommendedAllocation.map((a,i) => (
                  <div key={i} style={{ marginTop:i===0?0:10, paddingTop:i===0?0:10, borderTop:i===0?'none':'1px solid var(--border)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontSize:13, fontWeight:700 }}>{a.type}</span>
                      <span style={{ fontSize:13, fontWeight:800, color:'var(--blue)' }}>{a.percentage}%</span>
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-mute)', lineHeight:1.5 }}>{a.examples?.join(' · ')}</div>
                    <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:3, lineHeight:1.5 }}>{a.reason}</div>
                  </div>
                ))}
              </Card>
            )}

            {plan.milestones?.length > 0 && (
              <Card style={{ marginBottom:12 }}>
                <MiniLabel>HITOS</MiniLabel>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {plan.milestones.map((m,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(59,130,246,0.14)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontSize:10, fontWeight:800, color:'var(--blue)' }}>{m.year}</span>
                      </div>
                      <div style={{ flex:1, height:1, background:'var(--border)' }} />
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:13, fontWeight:700 }}>{fmt$(m.expectedValue)}</div>
                        <div style={{ fontSize:10, color:'var(--green)' }}>+{m.cumulativeReturnPct?.toFixed(0)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {plan.topPicks?.length > 0 && (
              <Card style={{ marginBottom:12 }}>
                <MiniLabel>ACCIONES RECOMENDADAS</MiniLabel>
                {plan.topPicks.map((p,i) => (
                  <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:i<plan.topPicks.length-1?10:0 }}>
                    <div style={{ width:36, height:36, background:'rgba(59,130,246,0.12)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:9, fontWeight:800, color:'var(--blue)' }}>{p.symbol}</span>
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:2 }}>{p.name} <span style={{ fontSize:11, color:'var(--blue)', fontWeight:600 }}>({p.suggestedAllocationPct}%)</span></div>
                      <div style={{ fontSize:11, color:'var(--text-mute)' }}>{p.why}</div>
                    </div>
                  </div>
                ))}
              </Card>
            )}

            {plan.actionSteps?.length > 0 && (
              <Card style={{ marginBottom:12 }}>
                <MiniLabel>PLAN DE ACCIÓN</MiniLabel>
                {plan.actionSteps.map((s,i) => (
                  <div key={i} style={{ display:'flex', gap:10, marginBottom:i<plan.actionSteps.length-1?8:0 }}>
                    <div style={{ width:20, height:20, background:'rgba(34,197,94,0.14)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                      <span style={{ fontSize:9, fontWeight:800, color:'var(--green)' }}>{i+1}</span>
                    </div>
                    <span style={{ fontSize:13, color:'var(--text-dim)', lineHeight:1.6 }}>{s}</span>
                  </div>
                ))}
              </Card>
            )}

            {plan.risks?.length > 0 && (
              <div style={{ padding:'10px 13px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.18)', borderRadius:12, marginBottom:12 }}>
                <MiniLabel>RIESGOS</MiniLabel>
                {plan.risks.map((r,i) => <div key={i} style={{ fontSize:12, color:'var(--text-mute)', marginBottom:2 }}>⚠️ {r}</div>)}
              </div>
            )}

            <button onClick={() => setPlan(null)} style={{ width:'100%', padding:'11px', background:'transparent', border:'1px solid var(--border)', borderRadius:12, color:'var(--text-mute)', fontSize:13, cursor:'pointer' }}>
              Nueva meta
            </button>
          </div>
        )}
        <div style={{ height:16 }} />
      </div>
      <BottomInput value={goal} onChange={setGoal} onSubmit={() => go()} placeholder="Ej: Quiero 50% de retorno en 10 años…" busy={busy} />
    </>
  )
}

const TABS = [
  { id:'screener',  label:'Screener',   icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { id:'whales',    label:'Ballenas',   icon: '🐋' },
  { id:'portfolio', label:'Portafolio', icon: '💼' },
  { id:'goals',     label:'Metas',      icon: '🎯' },
]

export default function App() {
  const [tab, setTab]           = useState('screener')
  const [beginner, setBeginner] = usePersisted('ff_beginner', false)

  return (
    <BeginnerCtx.Provider value={beginner}>
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', background:'var(--bg)', color:'var(--text)', fontFamily:'var(--font)' }}>
      <div style={{ padding:'calc(env(safe-area-inset-top) + 12px) 16px 0', background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'rgba(59,130,246,0.14)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="17" height="17" fill="none" stroke="var(--blue)" strokeWidth="2.2" viewBox="0 0 24 24">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:800, letterSpacing:'-0.3px' }}>Future Flow</div>
            <div style={{ fontSize:10, color:'var(--text-mute)' }}>Yahoo Finance · IA Claude · Solo análisis informativo</div>
          </div>
          <button onClick={() => setBeginner(b => !b)} title={beginner?'Modo principiante: encendido':'Modo principiante: apagado'}
            style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, fontWeight:700, color:beginner?'var(--amber)':'var(--text-mute)', background:beginner?'rgba(245,158,11,0.13)':'var(--bg3)', border:`1px solid ${beginner?'rgba(245,158,11,0.35)':'var(--border)'}`, borderRadius:8, padding:'5px 9px', cursor:'pointer', transition:'all 0.15s' }}>
            🎓 {beginner?'Modo fácil ON':'Modo fácil'}
          </button>
        </div>
        <div style={{ display:'flex', gap:0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, padding:'8px 4px', display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              background:'none', border:'none', cursor:'pointer',
              fontSize:10, fontWeight:tab===t.id?700:500,
              color:tab===t.id?'var(--blue)':'var(--text-mute)',
              borderBottom:tab===t.id?'2px solid var(--blue)':'2px solid transparent',
              transition:'all 0.15s',
            }}>
              <span style={{ fontSize:14, lineHeight:1 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'5px 16px', background:'rgba(245,158,11,0.06)', borderBottom:'1px solid rgba(245,158,11,0.15)', fontSize:10, color:'rgba(245,158,11,0.8)', display:'flex', alignItems:'center', gap:5 }}>
        <span>⚠️</span> Solo análisis informativo. No es asesoría financiera. Invierte bajo tu propio riesgo.
      </div>

      <div style={{ display: tab==='screener'  ? 'flex' : 'none', flex:1, flexDirection:'column', minHeight:0 }}><ScreenerTab  /></div>
      <div style={{ display: tab==='whales'    ? 'flex' : 'none', flex:1, flexDirection:'column', minHeight:0 }}><WhaleTab     /></div>
      <div style={{ display: tab==='portfolio' ? 'flex' : 'none', flex:1, flexDirection:'column', minHeight:0 }}><PortfolioTab /></div>
      <div style={{ display: tab==='goals'     ? 'flex' : 'none', flex:1, flexDirection:'column', minHeight:0 }}><GoalsTab     /></div>
    </div>
    </BeginnerCtx.Provider>
  )
}
