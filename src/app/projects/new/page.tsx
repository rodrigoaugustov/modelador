'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })

    const body = await response.json()
    router.push(`/projects/${body.project.id}`)
  }

  return (
    <main>
      <h1>Create project</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="project-name">Project name</label>
        <input id="project-name" name="name" value={name} onChange={(event) => setName(event.target.value)} />
        <button type="submit">Create</button>
      </form>
    </main>
  )
}
