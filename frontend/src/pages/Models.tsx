import { useState, useEffect, FormEvent } from 'react'
import { api } from '../api/client'

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

interface BrandItem { id: number; name: string }
interface ModelItem { id: number; name: string; brand_id?: number; brand?: BrandItem; created_at: string; created_by?: string }

const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

interface Props {
  toast: (msg: string, type?: 'ok' | 'er' | 'info') => void
}

interface ModalState { type: 'add' | 'edit' | 'del'; data?: ModelItem }

export default function Models({ toast }: Props) {
  const [models, setModels] = useState<ModelItem[]>([])
  const [brands, setBrands] = useState<BrandItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalState | null>(null)
  const [form, setForm] = useState<{ name: string; brand_id: string | number }>({ name: '', brand_id: '' })
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [mRes, bRes] = await Promise.all([
        api.get('/models?page=1&limit=100'),
        api.get('/brands?page=1&limit=100'),
      ])
      setModels(mRes.data?.data ?? mRes.data ?? [])
      setBrands(bRes.data?.data ?? bRes.data ?? [])
    } catch {
      toast('Erro ao carregar modelos.', 'er')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const errsNew: Record<string, string> = {}
    if (!form.name) errsNew.name = 'Nome obrigatório'
    setErrs(errsNew)
    if (Object.keys(errsNew).length) return
    setSaving(true)
    try {
      const payload: Record<string, any> = { name: form.name }
      if (form.brand_id) payload.brand_id = Number(form.brand_id)
      if (modal?.type === 'add') {
        await api.post('/models', payload)
        toast('Modelo criado!', 'ok')
      } else if (modal?.data) {
        await api.patch(`/models/${modal.data.id}`, payload)
        toast('Modelo atualizado.', 'ok')
      }
      setModal(null)
      load()
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao salvar.'
      toast(Array.isArray(msg) ? msg.join(', ') : msg, 'er')
    } finally {
      setSaving(false)
    }
  }

  const del = async () => {
    if (!modal?.data) return
    setSaving(true)
    try {
      await api.delete(`/models/${modal.data.id}`)
      toast('Modelo removido.', 'info')
      setModal(null)
      load()
    } catch (err: any) {
      toast(err?.response?.data?.message ?? 'Erro ao remover.', 'er')
    } finally {
      setSaving(false)
    }
  }

  const filtered = search ? models.filter(m => m.name.toLowerCase().includes(search.toLowerCase())) : models

  const getBrandName = (m: ModelItem) => m.brand?.name ?? brands.find(b => b.id === Number(m.brand_id))?.name ?? '—'

  return (
    <div>
      <div className="page-hd">
        <h2>Modelos <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--t2)' }}>— CRUD obrigatório</span></h2>
        <button className="btn-add" onClick={() => { setForm({ name: '', brand_id: brands[0]?.id ?? '' }); setErrs({}); setModal({ type: 'add' }) }}>
          <Ico n="plus" s={14} />Novo Modelo
        </button>
      </div>

      <div className="filters">
        <div className="search-wrap">
          <Ico n="search" s={14} />
          <input placeholder="Buscar modelo…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="tbl-wrap">
        <table>
          <thead><tr><th>#</th><th>Nome</th><th>Marca</th><th>Criado em</th><th></th></tr></thead>
          <tbody>
            {loading
              ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--t3)' }}>Carregando…</td></tr>
              : filtered.length === 0
                ? <tr className="empty-row"><td colSpan={5}>Nenhum modelo encontrado.</td></tr>
                : filtered.map(m => (
                  <tr key={m.id}>
                    <td style={{ color: 'var(--t3)', fontSize: 12 }}>{m.id}</td>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td>{getBrandName(m)}</td>
                    <td style={{ color: 'var(--t3)', fontSize: 12 }}>{fmtDate(m.created_at)}</td>
                    <td>
                      <div className="tbl-actions">
                        <button className="btn-icon btn-edit" onClick={() => { setForm({ name: m.name, brand_id: m.brand_id ?? m.brand?.id ?? '' }); setErrs({}); setModal({ type: 'edit', data: m }) }}><Ico n="pencil" s={13} /></button>
                        <button className="btn-icon btn-del" onClick={() => setModal({ type: 'del', data: m })}><Ico n="trash" s={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <div className="modal-ov" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box">
            <div className="modal-hd">
              <h3>{modal.type === 'add' ? 'Novo Modelo' : 'Editar Modelo'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}><Ico n="x" s={14} /></button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="m-fg">
                  <label>Nome *</label>
                  <input value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrs(p => ({ ...p, name: '' })) }} />
                  {errs.name && <div className="err">{errs.name}</div>}
                </div>
                <div className="m-fg">
                  <label>Marca</label>
                  <select value={form.brand_id} onChange={e => setForm(p => ({ ...p, brand_id: e.target.value }))}>
                    <option value="">Selecionar…</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
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
              <h3>Remover Modelo</h3>
              <button className="modal-close" onClick={() => setModal(null)}><Ico n="x" s={14} /></button>
            </div>
            <div className="modal-body">
              <div className="delete-confirm"><p>Remover o modelo <strong>{modal.data?.name}</strong>?</p></div>
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
