import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="home-page">
      <h1>Data Modeler</h1>
      <p>Design tables, relationships, and PostgreSQL DDL in the browser.</p>
      <Link href="/projects/new">Create project</Link>
    </main>
  )
}
