import { useState, useEffect } from 'react'
import { api } from '../api/client'

interface UserItem {
  id: number
  nickname: string
  name: string
  email: string
  created_at: string
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

export default function Users() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/users?page=1&limit=100')
        setUsers(data?.data ?? data ?? [])
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <div className="page-hd">
        <h2>Usuários <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--og)' }}>— bônus ✦</span></h2>
      </div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Nickname</th><th>Nome</th><th>E-mail</th><th>Criado em</th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--t3)' }}>Carregando…</td></tr>
              : users.length === 0
                ? <tr className="empty-row"><td colSpan={5}>Nenhum usuário encontrado.</td></tr>
                : users.map(u => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--t3)', fontSize: 12 }}>{u.id}</td>
                    <td><span className="mono">{u.nickname}</span></td>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ color: 'var(--t2)' }}>{u.email}</td>
                    <td style={{ color: 'var(--t3)', fontSize: 12 }}>{fmtDate(u.created_at)}</td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
