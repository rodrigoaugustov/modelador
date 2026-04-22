'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type ProjectListItem = {
  id: string
  name: string
  description: string | null
  updated_at: string | null
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase()
}

function formatSavedAt(value: string | null) {
  if (!value) {
    return 'Projeto salvo'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

export function ProjectPicker({ projects }: { projects: ProjectListItem[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? '')

  const filteredProjects = useMemo(() => {
    const search = normalizeSearchValue(query)

    if (!search) {
      return projects
    }

    return projects.filter((project) => {
      const haystack = [project.name, project.description, project.updated_at]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(search)
    })
  }, [projects, query])

  const canOpenSelectedProject =
    !!selectedProjectId && filteredProjects.some((project) => project.id === selectedProjectId)

  return (
    <section className="project-picker" aria-label="Saved projects picker">
      <label className="project-picker__search">
        <span className="project-picker__label">Buscar projeto</span>
        <input
          aria-label="Buscar projeto"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Digite nome, descricao ou data"
        />
      </label>
      <label className="project-picker__select">
        <span className="project-picker__label">Projetos salvos</span>
        <select
          aria-label="Projetos salvos"
          value={selectedProjectId}
          size={Math.min(Math.max(filteredProjects.length, 4), 10)}
          onChange={(event) => setSelectedProjectId(event.target.value)}
        >
          {filteredProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name} · {formatSavedAt(project.updated_at)}
            </option>
          ))}
        </select>
      </label>
      <div className="home-page__actions">
        <button
          type="button"
          className="home-page__action-button"
          disabled={!canOpenSelectedProject}
          onClick={() => {
            if (canOpenSelectedProject) {
              router.push(`/projects/${selectedProjectId}`)
            }
          }}
        >
          Abrir projeto
        </button>
      </div>
    </section>
  )
}
