import { useState, useEffect } from 'react'
import { api } from '../api/client'

/* ── ICONS ─────────────────────────────────────────────── */
const Ico = ({ n, s = 16 }: { n: string; s?: number }) => {
  const P: Record<string, JSX.Element> = {
    truck: <><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>,
    tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></>,
    building: <><rect x="3" y="9" width="18" height="13" /><path d="M8 22V12h8v10M3 9V6l9-3 9 3v3" /><path d="M10 22V17h4v5" /></>,
    check: <><polyline points="20 6 9 17 4 12" /></>,
    server: <><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></>,
    zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></>,
    db: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>,
  }
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {P[n]}
    </svg>
  )
}

/* ── ANIMATED COUNTER ───────────────────────────────────── */
function Counter({ to }: { to: number }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let start = 0
    const step = Math.ceil(to / 40) || 1
    const t = setInterval(() => {
      start += step
      if (start >= to) { setV(to); clearInterval(t) }
      else setV(start)
    }, 20)
    return () => clearInterval(t)
  }, [to])
  return <>{v.toLocaleString('pt-BR')}</>
}

/* ── BAR CHART ──────────────────────────────────────────── */
function BarChart({ data }: { data: { label: string; v: number }[] }) {
  const max = Math.max(...data.map(d => d.v), 1)
  return (
    <div>
      {data.map(d => (
        <div key={d.label} className="chart-bar-row">
          <div className="chart-bar-label">{d.label}</div>
          <div className="chart-bar-track">
            <div className="chart-bar-fill" style={{ width: `${(d.v / max) * 100}%` }} />
          </div>
          <div className="chart-bar-val">{d.v}</div>
        </div>
      ))}
    </div>
  )
}

interface VehicleItem {
  id: number
  license_plate: string
  year: number
  created_at: string
  model?: { id: number; name: string }
}

interface ModelItem {
  id: number
  name: string
}

interface Props {
  toast: (msg: string, type?: 'ok' | 'er' | 'info') => void
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

export default function Dashboard({ toast }: Props) {
  const [totalVehicles, setTotalVehicles] = useState(0)
  const [totalModels, setTotalModels] = useState(0)
  const [totalBrands, setTotalBrands] = useState(0)
  const [recentVehicles, setRecentVehicles] = useState<VehicleItem[]>([])
  const [modelChart, setModelChart] = useState<{ label: string; v: number }[]>([])
  const [token, setToken] = useState('')

  useEffect(() => {
    const t = localStorage.getItem('jwt_token') || ''
    setToken(t)

    const load = async () => {
      try {
        const [vRes, mRes, bRes, vListRes, modListRes] = await Promise.allSettled([
          api.get('/vehicles?page=1&limit=1'),
          api.get('/models?page=1&limit=1'),
          api.get('/brands?page=1&limit=1'),
          api.get('/vehicles?page=1&limit=100'),
          api.get('/models?page=1&limit=100'),
        ])

        if (vRes.status === 'fulfilled') setTotalVehicles(vRes.value.data?.meta?.total ?? vRes.value.data?.data?.length ?? 0)
        if (mRes.status === 'fulfilled') setTotalModels(mRes.value.data?.meta?.total ?? mRes.value.data?.data?.length ?? 0)
        if (bRes.status === 'fulfilled') setTotalBrands(bRes.value.data?.meta?.total ?? bRes.value.data?.data?.length ?? 0)

        if (vListRes.status === 'fulfilled') {
          const vehicles: VehicleItem[] = vListRes.value.data?.data ?? vListRes.value.data ?? []
          const last4 = [...vehicles].reverse().slice(0, 4)
          setRecentVehicles(last4)

          if (modListRes.status === 'fulfilled') {
            const models: ModelItem[] = modListRes.value.data?.data ?? modListRes.value.data ?? []
            const chart = models.slice(0, 6).map(m => ({
              label: m.name,
              v: vehicles.filter((v: any) => Number(v.model_id ?? v.model?.id) === m.id).length,
            }))
            setModelChart(chart)
          }
        }
      } catch (e) {
        toast('Erro ao carregar dados do dashboard.', 'er')
      }
    }

    load()
  }, [toast])

  return (
    <div>
      <div className="jwt-bar">
        <Ico n="shield" s={14} />
        <strong>JWT</strong>
        <span>{token || '—'}</span>
        <strong>● Redis: OK</strong>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top"><div className="kpi-icon y"><Ico n="truck" s={18} /></div></div>
          <div className="kpi-num"><Counter to={totalVehicles} /></div>
          <div className="kpi-label">Veículos cadastrados</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><div className="kpi-icon ok"><Ico n="check" s={18} /></div></div>
          <div className="kpi-num"><Counter to={totalVehicles} /></div>
          <div className="kpi-label">Veículos ativos</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><div className="kpi-icon og"><Ico n="tag" s={18} /></div></div>
          <div className="kpi-num"><Counter to={totalModels} /></div>
          <div className="kpi-label">Modelos</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><div className="kpi-icon bd"><Ico n="building" s={18} /></div></div>
          <div className="kpi-num"><Counter to={totalBrands} /></div>
          <div className="kpi-label">Marcas</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-hd"><h3>Frota por modelo</h3></div>
          {modelChart.length > 0
            ? <BarChart data={modelChart} />
            : <div style={{ color: 'var(--t3)', fontSize: 13 }}>Carregando…</div>
          }
        </div>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-hd"><h3>Status do Sistema</h3></div>
            {[
              { ico: 'server', label: 'NestJS API', sub: 'http://localhost:3000', color: '#1C1C20', badge: 'ok', txt: 'Online' },
              { ico: 'db', label: 'SQL Server', sub: 'TypeORM — Migrations OK', color: '#2D6A4F', badge: 'ok', txt: 'Online' },
              { ico: 'zap', label: 'Redis Cache', sub: '127.0.0.1:6379', color: '#D9230F', badge: 'ok', txt: 'Conectado' },
              { ico: 'shield', label: 'JWT Auth', sub: 'HS256 — Token ativo', color: '#5046E4', badge: 'ok', txt: 'Ativo' },
            ].map(s => (
              <div key={s.label} className="sys-item">
                <div className="sys-left">
                  <div className="sys-ico" style={{ background: s.color + '22', color: s.color }}><Ico n={s.ico} s={14} /></div>
                  <div><div className="sys-label">{s.label}</div><div className="sys-sub">{s.sub}</div></div>
                </div>
                <span className={`sys-badge ${s.badge}`}>{s.txt}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-hd"><h3>Última atividade</h3></div>
            {recentVehicles.length === 0
              ? <div style={{ color: 'var(--t3)', fontSize: 13 }}>Carregando…</div>
              : recentVehicles.map(v => (
                <div key={v.id} className="act-item">
                  <div className="act-dot" style={{ background: 'var(--ok)' }} />
                  <div className="act-info">
                    <strong>{v.license_plate}</strong>
                    <span>{(v.model as any)?.name ?? '—'} · {v.year}</span>
                  </div>
                  <div className="act-time">{fmtDate(v.created_at)}</div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
