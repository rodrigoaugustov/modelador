import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

describe('HomePage', () => {
  it('renders the product heading and primary CTA', () => {
    render(<HomePage />)

    expect(screen.getByRole('heading', { name: /data modeler/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create project/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /load project/i })).toBeInTheDocument()
  })
})
