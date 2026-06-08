const ENDPOINTS = [
  { method: 'POST', path: '/auth/login', desc: 'Autenticação JWT — retorna access_token', tag: 'auth' },
  { method: 'GET', path: '/vehicles', desc: 'Listar todos os veículos (cache Redis)', tag: 'vehicles' },
  { method: 'POST', path: '/vehicles', desc: 'Cadastrar novo veículo', tag: 'vehicles' },
  { method: 'GET', path: '/vehicles/:id', desc: 'Buscar veículo por ID', tag: 'vehicles' },
  { method: 'PATCH', path: '/vehicles/:id', desc: 'Atualizar veículo', tag: 'vehicles' },
  { method: 'DELETE', path: '/vehicles/:id', desc: 'Remover veículo', tag: 'vehicles' },
  { method: 'GET', path: '/models', desc: 'Listar modelos', tag: 'models' },
  { method: 'POST', path: '/models', desc: 'Criar modelo', tag: 'models' },
  { method: 'GET', path: '/models/:id', desc: 'Buscar modelo por ID', tag: 'models' },
  { method: 'PATCH', path: '/models/:id', desc: 'Atualizar modelo', tag: 'models' },
  { method: 'DELETE', path: '/models/:id', desc: 'Remover modelo', tag: 'models' },
  { method: 'GET', path: '/brands', desc: 'Listar marcas (bônus)', tag: 'brands' },
  { method: 'POST', path: '/brands', desc: 'Criar marca (bônus)', tag: 'brands' },
  { method: 'PATCH', path: '/brands/:id', desc: 'Atualizar marca (bônus)', tag: 'brands' },
  { method: 'DELETE', path: '/brands/:id', desc: 'Remover marca (bônus)', tag: 'brands' },
  { method: 'GET', path: '/users', desc: 'Listar usuários (bônus)', tag: 'users' },
  { method: 'POST', path: '/users', desc: 'Criar usuário (bônus)', tag: 'users' },
  { method: 'PATCH', path: '/users/:id', desc: 'Atualizar usuário (bônus)', tag: 'users' },
  { method: 'DELETE', path: '/users/:id', desc: 'Remover usuário (bônus)', tag: 'users' },
]

const METHOD_C: Record<string, string> = {
  GET: '#1D6FA4',
  POST: '#1A7A4A',
  PATCH: '#C17824',
  PUT: '#C17824',
  DELETE: '#C0392B',
}

export default function ApiDocs() {
  return (
    <div>
      <div className="page-hd" style={{ marginBottom: 16 }}>
        <div>
          <h2>Endpoints da API</h2>
          <div className="breadcrumb" style={{ marginTop: 2 }}>NestJS REST · JWT obrigatório em todas as rotas</div>
        </div>
        <span className="tag-nest">NestJS 10+</span>
      </div>
      <div style={{ marginBottom: 16 }}>
        <a
          href="http://localhost:3000/api/docs"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--y)', fontWeight: 700, fontSize: 13 }}
        >
          Abrir Swagger UI →
        </a>
      </div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr><th>Método</th><th>Endpoint</th><th>Descrição</th><th>Módulo</th></tr>
          </thead>
          <tbody>
            {ENDPOINTS.map((e, i) => (
              <tr key={i}>
                <td>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: METHOD_C[e.method] ?? '#888' }}>
                    {e.method}
                  </span>
                </td>
                <td><span className="mono">{e.path}</span></td>
                <td style={{ color: 'var(--t2)', fontSize: 13 }}>{e.desc}</td>
                <td><span className="badge inactive">{e.tag}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
