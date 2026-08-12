import { useMemo } from 'react'
import { cn } from '@/lib/utils'

const SIZE = 29

function hashSeed(input: string) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function isFinderArea(row: number, col: number) {
  const inBox = (r0: number, c0: number) =>
    row >= r0 && row < r0 + 8 && col >= c0 && col < c0 + 8
  return inBox(0, 0) || inBox(0, SIZE - 8) || inBox(SIZE - 8, 0)
}

/**
 * A decorative QR-style graphic. It is deliberately NOT a real QR code — the
 * demo never encodes payable data — but it is deterministic per payment so it
 * looks stable and plausible on screen.
 */
export function QrCodeGraphic({
  value,
  className,
  expired = false,
}: {
  value: string
  className?: string
  expired?: boolean
}) {
  const modules = useMemo(() => {
    let state = hashSeed(value) || 1
    const next = () => {
      state ^= state << 13
      state ^= state >>> 17
      state ^= state << 5
      return (state >>> 0) / 4294967296
    }

    const grid: boolean[][] = []
    for (let row = 0; row < SIZE; row += 1) {
      const line: boolean[] = []
      for (let col = 0; col < SIZE; col += 1) {
        line.push(isFinderArea(row, col) ? false : next() > 0.52)
      }
      grid.push(line)
    }
    return grid
  }, [value])

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={cn('size-full', expired && 'opacity-25', className)}
      role="img"
      aria-label="PromptPay QR code (demo graphic)"
      shapeRendering="crispEdges"
    >
      <rect width={SIZE} height={SIZE} fill="white" />
      <g fill="#0f172a">
        {modules.map((line, row) =>
          line.map((filled, col) =>
            filled ? <rect key={`${row}-${col}`} x={col} y={row} width={1} height={1} /> : null,
          ),
        )}

        {/* Finder patterns */}
        {[
          [0, 0],
          [0, SIZE - 7],
          [SIZE - 7, 0],
        ].map(([row, col]) => (
          <g key={`finder-${row}-${col}`}>
            <rect x={col} y={row} width={7} height={7} />
            <rect x={col + 1} y={row + 1} width={5} height={5} fill="white" />
            <rect x={col + 2} y={row + 2} width={3} height={3} />
          </g>
        ))}
      </g>
    </svg>
  )
}
