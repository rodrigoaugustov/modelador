import { describe, expect, it } from 'vitest'
import { validateProjectModel } from '@/server/validation/model-validator'

describe('validateProjectModel', () => {
  it('reports a missing table name', () => {
    const result = validateProjectModel({
      model: {
        tables: [{ id: 'table_1', logicalName: '', physicalName: null, attributes: [] }],
        relationships: [],
      },
    })

    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('Table name is required')
  })

  it('rejects duplicate table names', () => {
    const result = validateProjectModel({
      model: {
        tables: [
          { id: 'table_users_1', logicalName: 'users', physicalName: 'users', attributes: [] },
          { id: 'table_users_2', logicalName: 'users', physicalName: 'users', attributes: [] },
        ],
        relationships: [],
      },
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Duplicate table name users')
  })
})
