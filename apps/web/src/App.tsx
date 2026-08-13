import { useState } from 'react'

function App() {
  const [status, setStatus] = useState<string>()

  async function checkApi() {
    setStatus('Consultando API…')
    try {
      const response = await fetch('/api/health')
      const data: { status: string } = await response.json()
      setStatus(data.status === 'ok' ? 'API conectada' : 'API sin respuesta válida')
    } catch {
      setStatus('No fue posible conectar con la API')
    }
  }

  return (
    <main>
      <nav>
        <a className="brand" href="#inicio">Coordillera</a>
        <a href="#proyecto">El proyecto</a>
      </nav>
      <section id="inicio" className="hero">
        <p className="eyebrow">Un nuevo comienzo</p>
        <h1>Ideas que encuentran su cima.</h1>
        <p className="lead">La base digital de Coordillera está lista. Construyamos algo con propósito, paso a paso.</p>
        <div className="actions">
          <a className="button primary" href="#proyecto">Conocer el proyecto</a>
          <button className="button secondary" onClick={checkApi}>Verificar API</button>
        </div>
        {status && <p className="status" role="status">{status}</p>}
      </section>
      <section id="proyecto" className="project">
        <article>
          <span>01</span>
          <h2>Frontend moderno</h2>
          <p>React y TypeScript con Vite para una experiencia rápida y mantenible.</p>
        </article>
        <article>
          <span>02</span>
          <h2>API eficiente</h2>
          <p>Fastify ofrece una base ligera, tipada y preparada para crecer.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Un solo repositorio</h2>
          <p>Cliente y servidor conviven con comandos consistentes y claros.</p>
        </article>
      </section>
    </main>
  )
}

export default App

