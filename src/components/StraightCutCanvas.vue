<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <h2 class="text-xs uppercase tracking-widest text-gray-400 font-semibold">
        Straight Tube — <span class="text-indigo-400">Sequential Cut Plan</span>
      </h2>

      <span v-if="isValid" class="ml-auto text-gray-400 text-sm">
        Total tube length: <span class="text-indigo-400">{{ fmtVal(totals.totalCenterline) }} {{ unit }}</span>
      </span>
  
    </div>
    <div
      ref="containerRef"
      class="relative w-full h-37.5 sm:h-55 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden"
    >
      <canvas ref="canvasRef" style="display:block; height:100%;"></canvas>
      <div v-if="!isValid" class="absolute inset-0 flex items-center justify-center text-gray-600 text-sm pointer-events-none">
        Enter valid inputs to see cut plan
      </div>
    </div>
    <!-- Quick-reference strip -->
    <div v-if="isValid && segments.length" class="flex flex-wrap gap-x-8 gap-y-1 text-xs text-gray-500 pl-1">
      <span>
        <span class="text-orange-400 font-semibold">Outer (long)</span>
        = {{ fmtVal(segments[0].L_outer) }} {{ unit }}
      </span>
      <span>
        <span class="text-sky-400 font-semibold">Inner (short)</span>
        = {{ fmtVal(segments[0].L_inner) }} {{ unit }}
      </span>
      <span>
        <span class="text-indigo-400 font-semibold">Centerline</span>
        = {{ fmtVal(segments[0].L_center) }} {{ unit }}
      </span>
      <span>
        <span class="text-red-400 font-semibold">Cut angle φ</span>
        = {{ phi.toFixed(2) }}°
      </span>
      <span>
        <span class="text-violet-400 font-semibold">Offset Δ</span>
        = {{ fmtVal(segments[0].delta) }} {{ unit }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useUnitFormat } from '../composables/useUnitFormat'

const props = defineProps({
  segments: { type: Array, default: () => [] },
  totals: { type: Object, default: null },
  D: { type: Number, default: 0 },
  phi: { type: Number, default: 0 },
  isValid: { type: Boolean, default: false },
  unit: { type: String, default: 'mm' },
})

const canvasRef = ref(null)
const containerRef = ref(null)
let resizeObserver = null

const { fmt: fmtVal } = useUnitFormat(() => props.unit)

/**
 * Computes the x-coordinate of each cut on the BOTTOM edge (outer curve side)
 * and on the TOP edge (inner curve side) of the tube rectangle.
 *
 * Convention:
 *   - Bottom = outer bend side (longer side of each segment)
 *   - Top    = inner bend side (shorter side)
 *
 * For even segment index (i%2===0): outer at bottom → bottom span = L_outer, top span = L_inner
 * For odd segment index  (i%2===1): outer at top   → bottom span = L_inner, top span = L_outer
 *
 * Cut 0 starts at x_b=0, x_t=Δ (the first cut leans right: top offset by Δ to the right).
 *
 * Returns array of { xb, xt } for cuts 0 .. n (inclusive).
 */
function computeCutPositions(L_outer, L_inner, n) {
  const delta = (L_outer - L_inner) / 2  // half-difference = cut face offset per side
  const cuts = []
  let xb = 0
  let xt = delta

  cuts.push({ xb, xt })

  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) {
      // Even segment: outer (long) at bottom, inner (short) at top
      xb += L_outer
      xt += L_inner
    } else {
      // Odd segment: inner (short) at bottom, outer (long) at top
      xb += L_inner
      xt += L_outer
    }
    cuts.push({ xb, xt })
  }

  return { cuts, delta }
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  // Always sync canvas dimensions to the container so content never overflows
  const container = containerRef.value
  if (container) {
    canvas.width  = container.clientWidth
    canvas.height = container.clientHeight
  }
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  ctx.clearRect(0, 0, W, H)
  if (!props.isValid || !props.segments.length) return

  const { D, segments } = props
  const n = segments.length
  const { L_outer, L_inner, L_center } = segments[0]

  const { cuts } = computeCutPositions(L_outer, L_inner, n)

  // Total tube footprint in mm
  const totalBottom = cuts[n].xb       // rightmost bottom endpoint
  const totalTop    = cuts[n].xt       // rightmost top endpoint (< totalBottom normally)
  const maxX = Math.max(totalBottom, totalTop, cuts[0].xt)

  // --- Scale to fit ---
  const PADDING_X = 40
  const PADDING_Y = 50   // room for labels above and below
  const scaleX = (W - PADDING_X * 2) / Math.max(maxX, 1)
  const availH = H - PADDING_Y * 2
  const scaleY = availH / Math.max(D, 1)
  const scale  = Math.min(scaleX, scaleY, 8)

  // Tube position in canvas
  const tubeTop    = PADDING_Y
  const tubeBottom = PADDING_Y + D * scale
  const ox         = PADDING_X   // x origin offset

  // Scaled cut positions
  const sc = cuts.map(c => ({ xb: ox + c.xb * scale, xt: ox + c.xt * scale }))

  // --- Draw segment fills (alternating) ---
  const evenFill = 'rgba(99,102,241,0.18)'
  const oddFill  = 'rgba(56,189,248,0.10)'

  for (let i = 0; i < n; i++) {
    const c0 = sc[i], c1 = sc[i + 1]
    // Trapezoid: bottom-left, bottom-right, top-right, top-left
    ctx.beginPath()
    ctx.moveTo(c0.xb, tubeBottom)
    ctx.lineTo(c1.xb, tubeBottom)
    ctx.lineTo(c1.xt, tubeTop)
    ctx.lineTo(c0.xt, tubeTop)
    ctx.closePath()
    ctx.fillStyle = i % 2 === 0 ? evenFill : oddFill
    ctx.fill()
  }

  // --- Tube outline (top and bottom edges) ---
  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 1.5

  // Bottom edge
  ctx.beginPath()
  ctx.moveTo(sc[0].xb, tubeBottom)
  ctx.lineTo(sc[n].xb, tubeBottom)
  ctx.stroke()

  // Top edge
  ctx.beginPath()
  ctx.moveTo(sc[0].xt, tubeTop)
  ctx.lineTo(sc[n].xt, tubeTop)
  ctx.stroke()

  // Tube end caps
  ctx.beginPath()
  ctx.moveTo(sc[0].xb, tubeBottom)
  ctx.lineTo(sc[0].xt, tubeTop)
  ctx.strokeStyle = '#f87171'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(sc[n].xb, tubeBottom)
  ctx.lineTo(sc[n].xt, tubeTop)
  ctx.strokeStyle = '#f87171'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Interior cut lines
  for (let i = 1; i < n; i++) {
    ctx.beginPath()
    ctx.moveTo(sc[i].xb, tubeBottom)
    ctx.lineTo(sc[i].xt, tubeTop)
    ctx.strokeStyle = '#f87171'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  // --- Centerline (dashed) ---
  const tubeMid = (tubeTop + tubeBottom) / 2
  const centerDash = Math.max(6, 8 * scale / 3)
  ctx.setLineDash([centerDash, centerDash * 0.6])
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(Math.min(sc[0].xb, sc[0].xt) - 4, tubeMid)
  ctx.lineTo(Math.max(sc[n].xb, sc[n].xt) + 4, tubeMid)
  ctx.stroke()
  ctx.setLineDash([])

  // --- Labels ---
  const FONT_SM = 10
  const FONT_MD = 11
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < n; i++) {
    const c0 = sc[i], c1 = sc[i + 1]
    const isEven = i % 2 === 0

    // Bottom midpoint
    const bottomMidX = (c0.xb + c1.xb) / 2
    // Top midpoint
    const topMidX = (c0.xt + c1.xt) / 2

    // Determine which side is longer (outer) for this segment in the straight view
    const outerLen = isEven ? L_outer : L_inner   // actual outer arc length
    const innerLen = isEven ? L_inner : L_outer   // actual inner arc length

    // Bottom edge label (outer side = longer side in this alternating layout)
    ctx.font = `bold ${FONT_MD}px monospace`
    ctx.fillStyle = '#fb923c'  // orange = outer
    ctx.fillText(fmtVal(outerLen), bottomMidX, tubeBottom + 16)

    // Top edge label
    ctx.fillStyle = '#38bdf8'  // sky = inner
    ctx.fillText(fmtVal(innerLen), topMidX, tubeTop - 16)

    // Center label (L_center)
    ctx.font = `${FONT_SM}px monospace`
    ctx.fillStyle = '#6366f1'
    ctx.fillText(fmtVal(L_center), (bottomMidX + topMidX) / 2, tubeMid)

    // Segment number
    ctx.fillStyle = '#374151'
    ctx.font = `bold ${FONT_SM}px monospace`
    ctx.fillText(`#${i + 1}`, (bottomMidX + topMidX) / 2, tubeTop - 32)
  }

  // Cut angle annotation on each cut line
  for (let i = 0; i <= n; i++) {
    const { xb, xt } = sc[i]
    const isEndCut = i === 0 || i === n
    const midX = (xb + xt) / 2
    const midY = (tubeTop + tubeBottom) / 2
    ctx.font = `${FONT_SM}px monospace`
    const leanRight = xt > xb
    const labelX = midX + (leanRight ? 10 : -10)
    ctx.fillStyle = isEndCut ? '#6b7280' : '#d97706'
    ctx.fillText('φ', labelX, midY)
  }

  // --- Tube height dimension (left side) ---
  const yTop = tubeTop, yBot = tubeBottom
  const arrowX = Math.min(sc[0].xb, sc[0].xt) - 12
  drawVerticalDimension(ctx, arrowX, yTop, yBot, `D=${fmtVal(D)}`, '#94a3b8')

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
}

/**
 * Draw a vertical dimension arrow with label.
 */
function drawVerticalDimension(ctx, x, y1, y2, label, color) {
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.fillStyle = color
  ctx.font = '10px monospace'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'

  // Line
  ctx.beginPath()
  ctx.moveTo(x, y1)
  ctx.lineTo(x, y2)
  ctx.stroke()

  // Arrows
  const hw = 4
  ctx.beginPath()
  ctx.moveTo(x, y1)
  ctx.lineTo(x - hw, y1 + hw); ctx.moveTo(x, y1); ctx.lineTo(x + hw, y1 + hw)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x, y2)
  ctx.lineTo(x - hw, y2 - hw); ctx.moveTo(x, y2); ctx.lineTo(x + hw, y2 - hw)
  ctx.stroke()

  // Label
  ctx.fillText(label, x - 2, (y1 + y2) / 2)
}

function updateSize() {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return
  canvas.height = container.clientHeight
  canvas.width  = container.clientWidth
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
