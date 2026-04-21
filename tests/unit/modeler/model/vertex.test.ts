import { describe, expect, it } from 'vitest'
import { Vertex } from '@/modeler/model/vertex'

describe('Vertex', () => {
  it('stores vertex coordinates', () => {
    const vertex = new Vertex(10, 20)

    expect(vertex.x).toBe(10)
    expect(vertex.y).toBe(20)
  })
})
