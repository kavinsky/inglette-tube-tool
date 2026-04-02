<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <h2 class="text-xs uppercase tracking-widest text-gray-400 font-semibold">Cut Template — Flat Segment Profile</h2>
      <span v-if="isValid && segments.length" class="text-xs text-gray-500">
        {{ segments.length }} identical segments · φ={{ phi.toFixed(2) }}°
      </span>
    </div>

    <div
      ref="containerRef"
      class="relative w-full bg-gray-900 border border-gray-700 rounded-xl overflow-x-auto overflow-y-hidden"
      style="height: 300px;"
    >
      <canvas ref="canvasRef" style="display: block; height: 100%;" />
      <div v-if="!isValid" class="absolute inset-0 flex items-center justify-center text-gray-600 text-sm pointer-events-none">
        Enter valid inputs to see cut templates
      </div>
    </div>

    <div v-if="isValid && segments.length" class="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
      <span><span class="text-orange-400">▬</span> Outer edge (L_outer)</span>
      <span><span class="text-sky-400">▬</span> Inner edge (L_inner)</span>
      <span><span class="text-violet-400">↔</span> Gap between inner edges (2Δ = {{ fmtMm(segments[0]?.delta * 2) }} {{ unit }})</span>
      <span><span class="text-red-400">⟋</span> Cut faces (φ={{ phi.toFixed(1) }}°)</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const MM_PER_IN = 25.4

const props = defineProps({
  segments: { type: Array, default: () => [] },
  D: { type: Number, default: 0 },
  phi: { type: Number, default: 0 },
  isValid: { type: Boolean, default: false },
  unit: { type: String, default: 'mm' },
})

const canvasRef = ref(null)
const containerRef = ref(null)
let resizeObserver = null

const fmtMm = (v) => {
  if (v == null || isNaN(v)) return '0'
  return props.unit === 'in' ? (v / MM_PER_IN).toFixed(3) : v.toFixed(1)
}

function drawArrow(ctx, x1, y1, x2, y2, color) {
  const headLen = 5
  const angle = Math.atan2(y2 - y1, x2 - x1)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6))
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6))
  ctx.stroke()
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (!props.isValid || !props.segments.length) return

  const seg = props.segments[0]
  const n = props.segments.length
  const { L_outer, L_inner, L_center, delta } = seg
  const D = props.D

  const PADDING_X = 48
  const PADDING_TOP = 36    // segment # and inner labels above
  const PADDING_BOT = 52    // outer labels + delta arrows below
  const H = canvas.height
  const availH = H - PADDING_TOP - PADDING_BOT

  // Scale: fit D vertically, then set x-scale to max 4:1 on scale
  const scaleY = availH / Math.max(D, 1)
  // Segments placed with NO gap — total width = n * L_outer
  const totalMm = n * L_outer
  const scaleX = (canvas.width - PADDING_X * 2) / Math.max(totalMm, 1)
  const scale = Math.min(scaleX, scaleY, 5)

  const trapW_outer = L_outer * scale
  const trapW_inner = L_inner * scale
  const trapH = D * scale
  const dPx = delta * scale    // offset per side (each side of cut face)
  const gapPx = 2 * dPx         // gap between adjacent inner edges at each joint

  // Expand canvas width if segments need more room than the container
  const requiredW = Math.ceil(PADDING_X * 2 + n * trapW_outer)
  const targetW = Math.max(requiredW, containerRef.value?.clientWidth ?? 400)
  if (canvas.width !== targetW) {
    canvas.width = targetW
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const startY = PADDING_TOP    // top of trapezoid
  const FONT = 10

  // ---- Pre-compute all trapezoid corner points ----
  // Segments placed touching: startX = i * trapW_outer
  const traps = []
  for (let i = 0; i < n; i++) {
    const ox = PADDING_X + i * trapW_outer
    traps.push({
      bl: { x: ox,               y: startY + trapH },
      br: { x: ox + trapW_outer, y: startY + trapH },
      tl: { x: ox + dPx,         y: startY },
      tr: { x: ox + trapW_outer - dPx, y: startY },
    })
  }

  // ---- Draw segment fills ----
  for (let i = 0; i < n; i++) {
    const { bl, br, tl, tr } = traps[i]
    ctx.beginPath()
    ctx.moveTo(bl.x, bl.y)
    ctx.lineTo(br.x, br.y)
    ctx.lineTo(tr.x, tr.y)
    ctx.lineTo(tl.x, tl.y)
    ctx.closePath()
    ctx.fillStyle = i % 2 === 0 ? 'rgba(99,102,241,0.14)' : 'rgba(56,189,248,0.08)'
    ctx.fill()
  }

  // ---- Draw bottom (outer) edges — orange ----
  ctx.strokeStyle = '#fb923c'
  ctx.lineWidth = 2.5
  for (let i = 0; i < n; i++) {
    const { bl, br } = traps[i]
    ctx.beginPath()
    ctx.moveTo(bl.x, bl.y)
    ctx.lineTo(br.x, br.y)
    ctx.stroke()
  }

  // ---- Draw top (inner) edges — sky blue ----
  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = 2.5
  for (let i = 0; i < n; i++) {
    const { tl, tr } = traps[i]
    ctx.beginPath()
    ctx.moveTo(tl.x, tl.y)
    ctx.lineTo(tr.x, tr.y)
    ctx.stroke()
  }

  // ---- Draw cut faces — red ----
  ctx.strokeStyle = '#f87171'
  ctx.lineWidth = 1.5
  for (let i = 0; i < n; i++) {
    const { bl, tl, br, tr } = traps[i]
    ctx.beginPath(); ctx.moveTo(bl.x, bl.y); ctx.lineTo(tl.x, tl.y); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(br.x, br.y); ctx.lineTo(tr.x, tr.y); ctx.stroke()
  }

  // ---- Gap fills between inner edges (triangular void at each joint) ----
  // At each internal joint i (between seg i and seg i+1):
  //   right inner corner of seg i  = traps[i].tr
  //   left  inner corner of seg i+1 = traps[i+1].tl
  //   they share the same outer corner: traps[i].br = traps[i+1].bl
  for (let i = 0; i < n - 1; i++) {
    const { tr: rightInner, br: jointOuter } = traps[i]
    const { tl: leftInner } = traps[i + 1]

    // The triangular gap area
    ctx.beginPath()
    ctx.moveTo(jointOuter.x, jointOuter.y)
    ctx.lineTo(rightInner.x, rightInner.y)
    ctx.lineTo(leftInner.x, leftInner.y)
    ctx.closePath()
    ctx.fillStyle = 'rgba(139,92,246,0.15)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(139,92,246,0.5)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // ---- Labels ----
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${FONT}px monospace`

  for (let i = 0; i < n; i++) {
    const { bl, br, tl, tr } = traps[i]
    const outerMidX = (bl.x + br.x) / 2
    const innerMidX = (tl.x + tr.x) / 2

    // Segment number above
    ctx.fillStyle = '#374151'
    ctx.font = `bold ${FONT}px monospace`
    ctx.fillText(`#${i + 1}`, outerMidX, startY - 20)

    // L_outer below in orange
    ctx.fillStyle = '#fb923c'
    ctx.font = `${FONT}px monospace`
    ctx.fillText(`${fmtMm(L_outer)} ${props.unit}`, outerMidX, startY + trapH + 14)

    // L_inner above in sky
    ctx.fillStyle = '#38bdf8'
    ctx.fillText(`${fmtMm(L_inner)} ${props.unit}`, innerMidX, startY - 8)
  }

  // D (height) label — left side of first segment
  ctx.fillStyle = '#94a3b8'
  ctx.textAlign = 'right'
  ctx.font = `${FONT}px monospace`
  ctx.fillText(`D=${fmtMm(D)}`, PADDING_X - 4, startY + trapH / 2)

  // ---- 2Δ gap dimension arrows at each internal joint ----
  if (gapPx > 4) {
    for (let i = 0; i < n - 1; i++) {
      const { tr: rightInner } = traps[i]
      const { tl: leftInner } = traps[i + 1]

      const arrowY = startY - 20
      // Tick marks from gap edge points up to arrowY
      ctx.strokeStyle = '#7c3aed'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(rightInner.x, rightInner.y); ctx.lineTo(rightInner.x, arrowY + 4); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(leftInner.x, leftInner.y);   ctx.lineTo(leftInner.x,  arrowY + 4); ctx.stroke()

      // Double-headed arrow
      drawArrow(ctx, rightInner.x, arrowY, leftInner.x, arrowY, '#7c3aed')
      drawArrow(ctx, leftInner.x,  arrowY, rightInner.x, arrowY, '#7c3aed')

      // Label: 2Δ
      const midX = (rightInner.x + leftInner.x) / 2
      ctx.fillStyle = '#a78bfa'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `${FONT}px monospace`
      ctx.fillText(`2Δ=${fmtMm(delta * 2)}`, midX, arrowY - 8)
    }
  }

  // ---- Δ arrows at left end of first segment (per-side offset) ----
  if (dPx > 4) {
    const { bl, tl } = traps[0]
    const arrowY = startY + trapH + 32
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(bl.x, startY + trapH + 2); ctx.lineTo(bl.x, arrowY - 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(tl.x, startY - 2);         ctx.lineTo(tl.x, arrowY - 2); ctx.stroke()
    drawArrow(ctx, bl.x, arrowY, tl.x, arrowY, '#6366f1')
    drawArrow(ctx, tl.x, arrowY, bl.x, arrowY, '#6366f1')
    ctx.fillStyle = '#818cf8'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${FONT}px monospace`
    ctx.fillText(`Δ=${fmtMm(delta)}`, (bl.x + tl.x) / 2, arrowY + 10)
  }

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
}

function updateSize() {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return
  canvas.height = container.clientHeight
  canvas.width = container.clientWidth
  draw()
}

onMounted(() => {
  resizeObserver = new ResizeObserver(() => { nextTick(updateSize) })
  resizeObserver.observe(containerRef.value)
  nextTick(updateSize)
})

onUnmounted(() => { resizeObserver?.disconnect() })

watch(
  () => [props.segments, props.D, props.phi, props.isValid, props.unit],
  () => { nextTick(draw) },
  { deep: true }
)
</script>

