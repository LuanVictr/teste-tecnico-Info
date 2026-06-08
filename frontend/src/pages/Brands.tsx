import { useState, useEffect, FormEvent } from 'react'
import { api } from '../api/client'

const Ico = ({ n, s = 16 }: { n: string; s?: number }) => {
  const P: Record<string, JSX.Element> = {
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    pencil: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></>,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  }
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {P[n]}
    </svg>
  )
}

interface BrandItem { id: number; name: string; created_at: string }

const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

interface Props {
  toast: (msg: string, type?: 'ok' | 'er' | 'info') => void
}

interface ModalState { type: 'add' | 'edit' | 'del'; data?: BrandItem }

export default function Brands({ toast }: Props) {
  const [brands, setBrands] = useState<BrandItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [form, setForm] = useState({ name: '' })
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/brands?page=1&limit=200')
      setBrands(data?.data ?? data ?? [])
    } catch {
      toast('Erro ao carregar marcas.', 'er')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name) { setErr('Nome obrigatório'); return }
    setSaving(true)
    try {
      if (modal?.type === 'add') {
        await api.post('/brands', { name: form.name })
        toast('Marca criada!', 'ok')
      } else if (modal?.data) {
        await api.patch(`/brands/${modal.data.id}`, { name: form.name })
        toast('Marca atualizada.', 'ok')
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
      await api.delete(`/brands/${modal.data.id}`)
      toast('Marca removida.', 'info')
      setModal(null)
      load()
    } catch (err: any) {
      toast(err?.response?.data?.message ?? 'Erro ao remover.', 'er')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-hd">
        <h2>Marcas <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--og)' }}>— bônus ✦</span></h2>
        <button className="btn-add" onClick={() => { setForm({ name: '' }); setErr(''); setModal({ type: 'add' }) }}>
          <Ico n="plus" s={14} />Nova Marca
        </button>
      </div>

      <div className="tbl-wrap">
        <table>
          <thead><tr><th>#</th><th>Nome</th><th>Criado em</th><th></th></tr></thead>
          <tbody>
            {loading
              ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--t3)' }}>Carregando…</td></tr>
              : brands.length === 0
                ? <tr className="empty-row"><td colSpan={4}>Nenhuma marca encontrada.</td></tr>
                : brands.map(b => (
                  <tr key={b.id}>
                    <td style={{ color: 'var(--t3)', fontSize: 12 }}>{b.id}</td>
                    <td style={{ fontWeight: 600 }}>{b.name}</td>
                    <td style={{ color: 'var(--t3)', fontSize: 12 }}>{fmtDate(b.created_at)}</td>
                    <td>
                      <div className="tbl-actions">
                        <button className="btn-icon btn-edit" onClick={() => { setForm({ name: b.name }); setErr(''); setModal({ type: 'edit', data: b }) }}><Ico n="pencil" s={13} /></button>
                        <button className="btn-icon btn-del" onClick={() => setModal({ type: 'del', data: b })}><Ico n="trash" s={13} /></button>
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
              <h3>{modal.type === 'add' ? 'Nova Marca' : 'Editar Marca'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}><Ico n="x" s={14} /></button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="m-fg">
                  <label>Nome *</label>
                  <input value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErr('') }} />
                  {err && <div className="err">{err}</div>}
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
              <h3>Remover Marca</h3>
              <button className="modal-close" onClick={() => setModal(null)}><Ico n="x" s={14} /></button>
            </div>
            <div className="modal-body">
              <div className="delete-confirm"><p>Remover a marca <strong>{modal.data?.name}</strong>?</p></div>
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
