import 'fake-indexeddb/auto'

import { describe, expect, it } from 'vitest'
import { createProjectLocalStore } from '@/lib/local/indexeddb-project-store'

describe('indexeddb project store', () => {
  it('writes and reads the latest local snapshot', async () => {
    const store = createProjectLocalStore('test-db')
    await store.save('proj_1', { version: 2 })

    const snapshot = await store.get('proj_1')

    expect(snapshot).toEqual({ version: 2 })
  })
})
