type Rect = { x: number; y: number; width: number; height: number }

function collides(left: Rect, right: Rect) {
  return !(
    left.x + left.width <= right.x ||
    right.x + right.width <= left.x ||
    left.y + left.height <= right.y ||
    right.y + right.height <= left.y
  )
}

export class TableCollisionGuard {
  resolve(input: { moving: Rect; occupied: Rect[] }) {
    const origin = { x: input.moving.x, y: input.moving.y }

    if (!input.occupied.some((rect) => collides(input.moving, rect))) {
      return origin
    }

    const attempts = [
      { x: origin.x + 32, y: origin.y + 32 },
      { x: origin.x + 48, y: origin.y },
      { x: origin.x, y: origin.y + 48 },
      { x: origin.x + 64, y: origin.y + 32 },
      { x: origin.x + 32, y: origin.y + 64 },
      { x: origin.x + 80, y: origin.y + 48 },
    ]

    for (const position of attempts) {
      const nextRect = {
        ...input.moving,
        x: position.x,
        y: position.y,
      }

      if (!input.occupied.some((rect) => collides(nextRect, rect))) {
        return position
      }
    }

    return attempts[0]
  }
}
