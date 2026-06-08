import { useState, useEffect, useCallback } from 'react'
import Login from './pages/Login'
import Layout from './pages/Layout'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import Models from './pages/Models'
import Brands from './pages/Brands'
import Users from './pages/Users'
import ApiDocs from './pages/ApiDocs'

export type Page = 'dashboard' | 'vehicles' | 'models' | 'brands' | 'users' | 'api'
export type ToastType = 'ok' | 'er' | 'info'
export interface Toast { id: number; msg: string; type: ToastType }

export default function App() {
  const [logged, setLogged] = useState(() => !!localStorage.getItem('jwt_token'))
  const [page, setPage] = useState<Page>(() => (localStorage.getItem('fleet_page') as Page) || 'dashboard')
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => { localStorage.setItem('fleet_page', page) }, [page])

  const toast = useCallback((msg: string, type: ToastType = 'info') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  const logout = () => {
    localStorage.removeItem('jwt_token')
    setLogged(false)
  }

  if (!logged) return <Login onLogin={() => { setLogged(true); toast('Bem-vindo! JWT gerado.', 'ok') }} toast={toast} />

  const pages: Record<Page, JSX.Element> = {
    dashboard: <Dashboard toast={toast} />,
    vehicles: <Vehicles toast={toast} />,
    models: <Models toast={toast} />,
    brands: <Brands toast={toast} />,
    users: <Users />,
    api: <ApiDocs />,
  }

  return (
    <Layout page={page} setPage={setPage} onLogout={logout} toasts={toasts}>
      {pages[page]}
    </Layout>
  )
}
