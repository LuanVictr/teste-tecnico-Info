import { useState, FormEvent } from 'react'
import { api } from '../api/client'

interface Props {
  onLogin: () => void
  toast: (msg: string, type?: 'ok' | 'er' | 'info') => void
}

export default function Login({ onLogin, toast }: Props) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    if (!email || !pass) { setErr('Preencha todos os campos.'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password: pass })
      localStorage.setItem('jwt_token', data.access_token)
      onLogin()
    } catch {
      setErr('Credenciais inválidas.')
      toast('Credenciais inválidas.', 'er')
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
            {err && <p className="login-error">{err}</p>}
            <br />
            <button className="btn-primary" type="submit">{loading ? 'Autenticando…' : 'Entrar'}</button>
          </form>
          <div className="login-hint">
            <strong>Seed:</strong> <strong>aivacol@aivacol.com</strong> / <strong>aivacol@123</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
