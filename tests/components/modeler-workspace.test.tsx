import { render, screen } from '@testing-library/react'
import { ModelerWorkspace } from '@/modeler/view/workspace/modeler-workspace'

describe('ModelerWorkspace', () => {
  it('renders the canvas host and project panels', () => {
    render(
      <ModelerWorkspace
        projectId="proj_1"
        initialProject={{
          project: { id: 'proj_1', name: 'Sales' },
          model: { tables: [], relationships: [] },
        }}
      />,
    )

    expect(screen.getByTestId('modeler-canvas')).toBeInTheDocument()
    expect(screen.getByText(/sales/i)).toBeInTheDocument()
  })
})
