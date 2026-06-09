import { useState, FormEvent } from 'react'
import { api } from '../api/client'

interface Props {
  onLogin: () => void
  toast: (msg: string, type?: 'ok' | 'er' | 'info') => void
}

export default function Login({ onLogin, toast }: Props) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [showErrModal, setShowErrModal] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !pass) { setShowErrModal(true); return }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password: pass })
      localStorage.setItem('jwt_token', data.access_token)
      onLogin()
    } catch {
      setShowErrModal(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-left">
        <div className="ll-logo">
          <div className="ll-badge">A</div>
          <div className="ll-brand">Aivacol</div>
        </div>
        <div className="ll-hero">
          <h1>Gestão de Frota<br /><em>inteligente.</em></h1>
          <p>Plataforma completa para controle de veículos, modelos e marcas com arquitetura limpa, segurança robusta e cache Redis.</p>
        </div>
        <div className="ll-chips">
          {['NestJS 10+', 'JWT Auth', 'Redis Cache', 'SQL Server', 'TypeORM', 'Jest Tests'].map(c => (
            <div key={c} className="ll-chip"><span></span>{c}</div>
          ))}
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Entrar na plataforma</h2>
          <p>Use as credenciais do seed para acessar.</p>
          <form onSubmit={submit}>
            <div className="form-group">
              <label>E-mail</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="aivacol@aivacol.com" autoFocus />
            </div>
            <div className="form-group">
              <label>Senha</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="aivacol@123" />
            </div>
            <br />
            <button className="btn-primary" type="submit">{loading ? 'Autenticando…' : 'Entrar'}</button>
          </form>
          <div className="login-hint">
            <strong>Seed:</strong> <strong>aivacol@aivacol.com</strong> / <strong>aivacol@123</strong>
          </div>
        </div>
      </div>

      {showErrModal && (
        <div className="modal-ov" onClick={() => setShowErrModal(false)}>
          <div className="modal-box" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-hd" style={{ borderColor: 'var(--erb)' }}>
              <h3 style={{ color: 'var(--er)' }}>Credencial inválida</h3>
              <button className="modal-close" onClick={() => setShowErrModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.6 }}>
                E-mail ou senha incorretos.<br />
                Verifique as credenciais e tente novamente.
              </p>
              <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--bd2)', borderRadius: 8, fontSize: 13 }}>
                <strong>Credenciais de acesso:</strong><br />
                <span style={{ color: 'var(--t2)' }}>E-mail:</span> <code>aivacol@aivacol.com</code><br />
                <span style={{ color: 'var(--t2)' }}>Senha:</span> <code>aivacol@123</code>
              </div>
            </div>
            <div className="modal-ft">
              <button className="btn-save" onClick={() => setShowErrModal(false)}>Tentar novamente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
