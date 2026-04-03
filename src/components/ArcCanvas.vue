<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <h2 class="text-xs uppercase tracking-widest text-gray-400 font-semibold">Final Preview — <span class="text-indigo-400">Assembled &amp; Welded</span></h2>
      <span v-if="isValid" class="text-xs text-indigo-400">{{ phi.toFixed(2) }}° cut angle · {{ n }} segments</span>
    </div>
    <div ref="containerRef" class="relative w-full h-[220px] sm:h-[360px] bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      <canvas ref="canvasRef" class="absolute inset-0"></canvas>
      <div v-if="!isValid" class="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
        Enter valid inputs to see visualization
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  R: { type: Number, required: true },
  D: { type: Number, required: true },
  theta: { type: Number, required: true },
  n: { type: Number, required: true },
  phi: { type: Number, default: 0 },
  isValid: { type: Boolean, default: false },
})

const canvasRef = ref(null)
const containerRef = ref(null)
let resizeObserver = null

/**
 * Compute the 4 corner points of each flat polygon segment.
 * Each segment is a quadrilateral with straight (chord) sides — no arcs.
 *
 *  innerStart ── innerEnd
 *  |                    |
 *  outerStart ─────── outerEnd
 *
 * Angles are measured from the -Y axis (top), sweeping symmetrically.
 */
function segmentPolygon(cx, cy, R_inner, R_outer, startAngle, endAngle, scale) {
  const cos0 = Math.cos(startAngle), sin0 = Math.sin(startAngle)
  const cos1 = Math.cos(endAngle),   sin1 = Math.sin(endAngle)
  return {
    innerStart: { x: cx + cos0 * R_inner * scale, y: cy + sin0 * R_inner * scale },
    outerStart: { x: cx + cos0 * R_outer * scale, y: cy + sin0 * R_outer * scale },
    outerEnd:   { x: cx + cos1 * R_outer * scale, y: cy + sin1 * R_outer * scale },
    innerEnd:   { x: cx + cos1 * R_inner * scale, y: cy + sin1 * R_inner * scale },
  }
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  ctx.clearRect(0, 0, W, H)
  if (!props.isValid) return

  const { R, D, theta, n } = props
  const theta_rad = (theta * Math.PI) / 180
  const segAngleRad = theta_rad / n

  const R_outer = R + D / 2
  const R_inner = R - D / 2

  // --- Determine scale to fit canvas ---
  // Bounding box of the drawn sector (from apex at top to inner-arc tips at bottom):
  //   drawnHeight = R_outer - R_inner * cos(halfAngle)
  //   drawnWidth  = 2 * R_outer * sin(halfAngle)
  const halfAngle = theta_rad / 2
  const drawnH = R_outer - R_inner * Math.cos(halfAngle)
  const drawnW = 2 * R_outer * Math.sin(halfAngle)

  const PADDING = 52
  const scaleX = (W - PADDING * 2) / Math.max(drawnW, 1)
  const scaleY = (H - PADDING * 2) / Math.max(drawnH, 1)
  const scale = Math.min(scaleX, scaleY, 6)

  // cx,cy = center of curvature (can be outside canvas — that's fine).
  // Apex of outer arc sits at (cx, cy - R_outer*scale).
  // We want the apex at y = PADDING from top.
  const cx = W / 2
  const cy = PADDING + R_outer * scale

  // Segment fill colors
  const even = { fill: 'rgba(99,102,241,0.22)', stroke: '#818cf8' }
  const odd  = { fill: 'rgba(56,189,248,0.12)', stroke: '#38bdf8' }

  // Pre-compute all segment polygons
  const polys = []
  for (let i = 0; i < n; i++) {
    const startAngle = -Math.PI / 2 - halfAngle + i * segAngleRad
    const endAngle   = startAngle + segAngleRad
    polys.push(segmentPolygon(cx, cy, R_inner, R_outer, startAngle, endAngle, scale))
  }

  // --- Draw filled segments ---
  for (let i = 0; i < n; i++) {
    const { innerStart, outerStart, outerEnd, innerEnd } = polys[i]
    const col = i % 2 === 0 ? even : odd

    ctx.beginPath()
    ctx.moveTo(outerStart.x, outerStart.y)
    ctx.lineTo(outerEnd.x,   outerEnd.y)
    ctx.lineTo(innerEnd.x,   innerEnd.y)
    ctx.lineTo(innerStart.x, innerStart.y)
    ctx.closePath()
    ctx.fillStyle = col.fill
    ctx.fill()

    // Inner and outer chord edges
    ctx.beginPath()
    ctx.moveTo(outerStart.x, outerStart.y)
    ctx.lineTo(outerEnd.x, outerEnd.y)
    ctx.strokeStyle = col.stroke
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(innerStart.x, innerStart.y)
    ctx.lineTo(innerEnd.x, innerEnd.y)
    ctx.strokeStyle = col.stroke
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  // --- Draw cut lines (joint faces, in red) ---
  for (let i = 0; i <= n; i++) {
    const angle = -Math.PI / 2 - halfAngle + i * segAngleRad
    const cos = Math.cos(angle), sin = Math.sin(angle)
    const x1 = cx + cos * R_inner * scale
    const y1 = cy + sin * R_inner * scale
    const x2 = cx + cos * R_outer * scale
    const y2 = cy + sin * R_outer * scale

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = '#f87171'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  // --- Centerline (dashed, connecting midpoints of inner chord) ---
  ctx.setLineDash([Math.max(3, 4 * scale / 2), Math.max(3, 3 * scale / 2)])
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = 0; i <= n; i++) {
    const angle = -Math.PI / 2 - halfAngle + i * segAngleRad
    const x = cx + Math.cos(angle) * R * scale
    const y = cy + Math.sin(angle) * R * scale
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.setLineDash([])

  // --- Annotations ---
  const FONT = Math.max(10, Math.round(11 * Math.min(scale, 1.4)))
  ctx.font = `${FONT}px monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Bend angle label — arc indicator line outside the outer chord boundary
  const labelAngle = -Math.PI / 2  // midpoint of bend
  const labelR = R_outer * scale + 22
  ctx.fillStyle = '#94a3b8'
  ctx.fillText(`${theta}°`, cx + Math.cos(labelAngle) * labelR, cy + Math.sin(labelAngle) * labelR)

  // Small angle indicator at leftmost cut
  const leftAngle = -Math.PI / 2 - halfAngle
  const rightAngle = leftAngle + segAngleRad
  const arcR = R_inner * scale * 0.45
  ctx.beginPath()
  ctx.arc(cx + Math.cos(leftAngle) * R * scale,
          cy + Math.sin(leftAngle) * R * scale,
          arcR * 0.4, leftAngle, rightAngle)
  ctx.strokeStyle = '#6366f1'
  ctx.lineWidth = 1
  ctx.stroke()

  // R label on the center-most cut line
  const midCutAngle = -Math.PI / 2
  const rx = cx + Math.cos(midCutAngle) * R * scale * 0.5
  const ry = cy + Math.sin(midCutAngle) * R * scale * 0.5
  ctx.fillStyle = '#475569'
  ctx.fillText(`R${R.toFixed(0)}`, rx, ry - FONT)

  // OD label at the left outer end
  const leftOuterX = cx + Math.cos(leftAngle) * R_outer * scale
  const leftOuterY = cy + Math.sin(leftAngle) * R_outer * scale
  const leftInnerX = cx + Math.cos(leftAngle) * R_inner * scale
  const leftInnerY = cy + Math.sin(leftAngle) * R_inner * scale
  ctx.fillStyle = '#64748b'
  const odMidX = (leftOuterX + leftInnerX) / 2
  const odMidY = (leftOuterY + leftInnerY) / 2
  const odNormX = Math.cos(leftAngle - Math.PI / 2) * 16
  const odNormY = Math.sin(leftAngle - Math.PI / 2) * 16
  ctx.fillText(`OD${D.toFixed(0)}`, odMidX + odNormX, odMidY + odNormY)

  ctx.textBaseline = 'alphabetic'
}

function updateSize() {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return
  canvas.width = container.clientWidth
  canvas.height = container.clientHeight
  draw()
}

onMounted(() => {
  resizeObserver = new ResizeObserver(() => { nextTick(updateSize) })
  resizeObserver.observe(containerRef.value)
  nextTick(updateSize)
})

onUnmounted(() => { resizeObserver?.disconnect() })

watch(
  () => [props.R, props.D, props.theta, props.n, props.phi, props.isValid],
  () => { nextTick(draw) }
)
</script>

