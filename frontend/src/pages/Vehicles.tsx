import { useState, useEffect, FormEvent } from 'react'
import { api } from '../api/client'

/* ── ICONS ─────────────────────────────────────────────── */
const Ico = ({ n, s = 16 }: { n: string; s?: number }) => {
  const P: Record<string, JSX.Element> = {
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    pencil: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></>,
    search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  }
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {P[n]}
    </svg>
  )
}

interface ModelItem { id: number; name: string }
interface VehicleItem {
  id: number
  license_plate: string
  chassis: string
  renavam: string
  year: number
  model_id: number
  model?: ModelItem
  created_at: string
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')
const PER = 10

interface Props {
  toast: (msg: string, type?: 'ok' | 'er' | 'info') => void
}

interface ModalState { type: 'add' | 'edit' | 'del'; data?: VehicleItem }

export default function Vehicles({ toast }: Props) {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([])
  const [models, setModels] = useState<ModelItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [modelFilter, setModelFilter] = useState('')
  const [modal, setModal] = useState<ModalState | null>(null)
  const [form, setForm] = useState<Partial<VehicleItem>>({})
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const loadVehicles = async (pg = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pg), limit: String(PER) })
      if (modelFilter) params.set('modelId', modelFilter)
      const { data } = await api.get(`/vehicles?${params}`)
      const items: VehicleItem[] = data?.data ?? data ?? []
      setVehicles(items)
      setTotal(data?.meta?.total ?? items.length)
    } catch {
      toast('Erro ao carregar veículos.', 'er')
    } finally {
      setLoading(false)
    }
  }

  const loadModels = async () => {
    try {
      const { data } = await api.get('/models?page=1&limit=100')
      setModels(data?.data ?? data ?? [])
    } catch { /* ignore */ }
  }

  useEffect(() => { loadModels() }, [])
  useEffect(() => { loadVehicles(page) }, [page, modelFilter])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.license_plate) e.license_plate = 'Campo obrigatório'
    if (!form.chassis || form.chassis.length !== 17) e.chassis = 'Chassi deve ter 17 caracteres'
    if (!form.renavam || form.renavam.length !== 11) e.renavam = 'RENAVAM deve ter 11 dígitos'
    if (!form.year || Number(form.year) < 1900 || Number(form.year) > 2099) e.year = 'Ano inválido'
    if (!form.model_id) e.model_id = 'Selecione um modelo'
    setErrs(e)
    return Object.keys(e).length === 0
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        license_plate: form.license_plate,
        chassis: form.chassis,
        renavam: form.renavam,
        year: Number(form.year),
        model_id: Number(form.model_id),
      }
      if (modal?.type === 'add') {
        await api.post('/vehicles', payload)
        toast('Veículo criado com sucesso!', 'ok')
      } else {
        await api.patch(`/vehicles/${form.id}`, payload)
        toast('Veículo atualizado.', 'ok')
      }
      setModal(null)
      loadVehicles(page)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao salvar veículo.'
      toast(Array.isArray(msg) ? msg.join(', ') : msg, 'er')
    } finally {
      setSaving(false)
    }
  }

  const del = async () => {
    if (!modal?.data) return
    setSaving(true)
    try {
      await api.delete(`/vehicles/${modal.data.id}`)
      toast('Veículo removido.', 'info')
      setModal(null)
      const newPage = vehicles.length === 1 && page > 1 ? page - 1 : page
      setPage(newPage)
      loadVehicles(newPage)
    } catch (err: any) {
      toast(err?.response?.data?.message ?? 'Erro ao remover.', 'er')
    } finally {
      setSaving(false)
    }
  }

  const openAdd = () => {
    setForm({ license_plate: '', chassis: '', renavam: '', year: new Date().getFullYear(), model_id: models[0]?.id })
    setErrs({})
    setModal({ type: 'add' })
  }

  const openEdit = (v: VehicleItem) => {
    setForm({ ...v, model_id: v.model_id ?? (v.model as any)?.id })
    setErrs({})
    setModal({ type: 'edit', data: v })
  }

  const pages = Math.ceil(total / PER) || 1
  const filteredLocal = search
    ? vehicles.filter(v => v.license_plate.toLowerCase().includes(search.toLowerCase()))
    : vehicles

  return (
    <div>
      <div className="page-hd">
        <div>
          <h2>Veículos</h2>
          <div className="breadcrumb" style={{ marginTop: 2 }}>{total} registros</div>
        </div>
        <button className="btn-add" onClick={openAdd}><Ico n="plus" s={14} />Novo Veículo</button>
      </div>

      <div className="filters">
        <div className="search-wrap">
          <Ico n="search" s={14} />
          <input placeholder="Buscar por placa…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-sel" value={modelFilter} onChange={e => { setModelFilter(e.target.value); setPage(1) }}>
          <option value="">Todos os modelos</option>
          {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Placa</th><th>Chassi</th><th>RENAVAM</th><th>Ano</th><th>Modelo</th><th>Criado</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--t3)' }}>Carregando…</td></tr>
              : filteredLocal.length === 0
                ? <tr className="empty-row"><td colSpan={8}>Nenhum veículo encontrado.</td></tr>
                : filteredLocal.map(v => {
                  const modelName = v.model?.name ?? models.find(m => m.id === Number(v.model_id))?.name ?? '—'
                  return (
                    <tr key={v.id}>
                      <td style={{ color: 'var(--t3)', fontSize: 12 }}>{v.id}</td>
                      <td><span className="mono">{v.license_plate}</span></td>
                      <td><span className="mono">{v.chassis}</span></td>
                      <td><span className="mono">{v.renavam}</span></td>
                      <td>{v.year}</td>
                      <td>{modelName}</td>
                      <td style={{ color: 'var(--t3)', fontSize: 12 }}>{fmtDate(v.created_at)}</td>
                      <td>
                        <div className="tbl-actions">
                          <button className="btn-icon btn-edit" onClick={() => openEdit(v)}><Ico n="pencil" s={13} /></button>
                          <button className="btn-icon btn-del" onClick={() => setModal({ type: 'del', data: v })}><Ico n="trash" s={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
        <div className="pager">
          <span>Página {page} de {pages} · {total} registros</span>
          <div className="pager-btns">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Anterior</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= pages}>Próximo →</button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <div className="modal-ov" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box">
            <div className="modal-hd">
              <h3>{modal.type === 'add' ? 'Novo Veículo' : 'Editar Veículo'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}><Ico n="x" s={14} /></button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="m-row">
                  <div className="m-fg">
                    <label>Placa *</label>
                    <input value={form.license_plate ?? ''} onChange={e => { setForm(p => ({ ...p, license_plate: e.target.value })); setErrs(p => ({ ...p, license_plate: '' })) }} placeholder="ABC1D23" />
                    {errs.license_plate && <div className="err">{errs.license_plate}</div>}
                  </div>
                  <div className="m-fg">
                    <label>Ano *</label>
                    <input type="number" value={form.year ?? ''} onChange={e => { setForm(p => ({ ...p, year: Number(e.target.value) })); setErrs(p => ({ ...p, year: '' })) }} placeholder="2023" />
                    {errs.year && <div className="err">{errs.year}</div>}
                  </div>
                </div>
                <div className="m-fg">
                  <label>Chassi * (17 caracteres)</label>
                  <input value={form.chassis ?? ''} maxLength={17} onChange={e => { setForm(p => ({ ...p, chassis: e.target.value })); setErrs(p => ({ ...p, chassis: '' })) }} placeholder="9BWZZZ377VT004251" />
                  {errs.chassis && <div className="err">{errs.chassis}</div>}
                </div>
                <div className="m-fg">
                  <label>RENAVAM * (11 dígitos)</label>
                  <input value={form.renavam ?? ''} maxLength={11} onChange={e => { setForm(p => ({ ...p, renavam: e.target.value })); setErrs(p => ({ ...p, renavam: '' })) }} placeholder="12345678901" />
                  {errs.renavam && <div className="err">{errs.renavam}</div>}
                </div>
                <div className="m-fg">
                  <label>Modelo *</label>
                  <select value={form.model_id ?? ''} onChange={e => { setForm(p => ({ ...p, model_id: Number(e.target.value) })); setErrs(p => ({ ...p, model_id: '' })) }}>
                    <option value="">Selecionar…</option>
                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  {errs.model_id && <div className="err">{errs.model_id}</div>}
                </div>
              </div>
              <div className="modal-ft">
                <button type="button" className="btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal?.type === 'del' && (
        <div className="modal-ov" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box">
            <div className="modal-hd">
              <h3>Remover Veículo</h3>
              <button className="modal-close" onClick={() => setModal(null)}><Ico n="x" s={14} /></button>
            </div>
            <div className="modal-body">
              <div className="delete-confirm">
                <p>Tem certeza que deseja remover o veículo <strong>{modal.data?.license_plate}</strong>? Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <div className="modal-ft">
              <button className="btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn-save" style={{ background: 'var(--er)' }} onClick={del} disabled={saving}>{saving ? 'Removendo…' : 'Remover'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
