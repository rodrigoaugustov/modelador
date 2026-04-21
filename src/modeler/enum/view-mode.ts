export const ViewMode = {
  Logical: 'logical',
  Physical: 'physical',
} as const

export type ViewMode = (typeof ViewMode)[keyof typeof ViewMode]
