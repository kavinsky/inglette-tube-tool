<template>
  <div class="flex flex-col gap-3">
    <h2 class="text-xs uppercase tracking-widest text-gray-400 font-semibold">Segment Dimensions</h2>

    <div class="overflow-x-auto rounded-xl border border-gray-700">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-800 text-gray-400 text-xs uppercase tracking-wider">
            <th class="px-4 py-3 text-left">#</th>
            <th class="px-4 py-3 text-right">L outer<br/><span class="text-gray-600 normal-case">{{ unit }}</span></th>
            <th class="px-4 py-3 text-right">L inner<br/><span class="text-gray-600 normal-case">{{ unit }}</span></th>
            <th class="px-4 py-3 text-right">L centerline<br/><span class="text-gray-600 normal-case">{{ unit }}</span></th>
            <th class="px-4 py-3 text-right">Cut angle φ<br/><span class="text-gray-600 normal-case">°</span></th>
            <th class="px-4 py-3 text-right">Offset Δ<br/><span class="text-gray-600 normal-case">{{ unit }}</span></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="seg in segments"
            :key="seg.index"
            class="border-t border-gray-800 hover:bg-gray-800/50 transition-colors"
          >
            <td class="px-4 py-2.5 text-gray-500 font-mono">{{ seg.index }}</td>
            <td class="px-4 py-2.5 text-right font-mono text-orange-400">{{ fmt(seg.L_outer) }}</td>
            <td class="px-4 py-2.5 text-right font-mono text-sky-400">{{ fmt(seg.L_inner) }}</td>
            <td class="px-4 py-2.5 text-right font-mono text-gray-200">{{ fmt(seg.L_center) }}</td>
            <td class="px-4 py-2.5 text-right font-mono text-indigo-400">{{ phi.toFixed(2) }}°</td>
            <td class="px-4 py-2.5 text-right font-mono text-violet-400">{{ fmt(seg.delta) }}</td>
          </tr>

          <!-- Totals row -->
          <tr v-if="totals" class="border-t-2 border-gray-600 bg-gray-800/60 font-semibold">
            <td class="px-4 py-3 text-gray-400 text-xs uppercase tracking-wider">Total</td>
            <td class="px-4 py-3 text-right font-mono text-orange-300">{{ fmt(totals.totalOuter) }}</td>
            <td class="px-4 py-3 text-right font-mono text-sky-300">{{ fmt(totals.totalInner) }}</td>
            <td class="px-4 py-3 text-right font-mono text-gray-100">{{ fmt(totals.totalCenterline) }}</td>
            <td class="px-4 py-3 text-right text-gray-500">—</td>
            <td class="px-4 py-3 text-right text-gray-500">—</td>
          </tr>
        </tbody>
      </table>

      <!-- Empty state -->
      <div v-if="!segments.length" class="py-10 text-center text-gray-600 text-sm">
        Enter valid inputs to calculate dimensions
      </div>
    </div>

    <!-- Summary pills -->
    <div v-if="totals" class="flex flex-wrap gap-3 pt-1">
      <div class="flex flex-col bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 gap-0.5">
        <span class="text-xs text-gray-500 uppercase tracking-wider">Total cuts</span>
        <span class="text-sm font-semibold font-mono text-gray-100">{{ totals.numberOfCuts }}</span>
      </div>
      <div class="flex flex-col bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 gap-0.5">
        <span class="text-xs text-gray-500 uppercase tracking-wider">Tube length needed</span>
        <span class="text-sm font-semibold font-mono text-gray-100">{{ fmt(totals.totalCenterline) }} {{ unit }}</span>
      </div>
      <div class="flex flex-col bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 gap-0.5">
        <span class="text-xs text-gray-500 uppercase tracking-wider">Cut angle φ</span>
        <span class="text-sm font-semibold font-mono text-gray-100">{{ phi.toFixed(2) }}°</span>
      </div>
      <div class="flex flex-col bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 gap-0.5">
        <span class="text-xs text-gray-500 uppercase tracking-wider">Per-segment angle</span>
        <span class="text-sm font-semibold font-mono text-gray-100">{{ segAngle.toFixed(2) }}°</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const MM_PER_IN = 25.4

const props = defineProps({
  segments: { type: Array, default: () => [] },
  totals: { type: Object, default: null },
  phi: { type: Number, default: 0 },
  theta: { type: Number, default: 0 },
  n: { type: Number, default: 0 },
  unit: { type: String, default: 'mm' },
})

const fmt = (v) => {
  if (props.unit === 'in') return (v / MM_PER_IN).toFixed(4)
  return v.toFixed(2)
}

const segAngle = computed(() => props.n > 0 ? props.theta / props.n : 0)
</script>

