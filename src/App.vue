<template>
  <div class="min-h-screen bg-gray-950 text-gray-100 font-mono flex flex-col">

    <!-- Header -->
    <header class="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
      <div class="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- Icon -->
          <svg class="w-7 h-7 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="3" />
            <path stroke-linecap="round" d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9" />
            <path stroke-linecap="round" d="M12 3v4M3 12H7M12 21v-4M21 12h-4" />
          </svg>
          <div>
            <h1 class="text-base font-bold tracking-tight text-gray-100">Inglette Tool</h1>
            <p class="text-xs text-gray-500 leading-none mt-0.5">Pie-Cut Steel Tube Calculator</p>
          </div>
        </div>
        <div class="text-xs text-gray-600">All internal values in mm &amp; degrees</div>
      </div>
    </header>

    <!-- Main layout -->
    <main class="max-w-screen-2xl mx-auto px-6 py-6 flex gap-6 w-full flex-1">

      <!-- Left sidebar: inputs -->
      <InputPanel
        :modelValue="inputs"
        @update:modelValue="v => Object.assign(inputs, v)"
        v-model:unit="unit"
        :error="validationError"
        class="shrink-0"
      />

      <!-- Right content -->
      <div class="flex flex-col gap-6 flex-1 min-w-0">

        <!-- Two canvases side-by-side on wide screens -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <StraightCutCanvas
            :segments="segments"
            :totals="totals"
            :D="inputs.D"
            :phi="phi"
            :is-valid="isValid"
            :unit="unit"
          />
          <CutTemplateCanvas
            :segments="segments"
            :D="inputs.D"
            :phi="phi"
            :is-valid="isValid"
            :unit="unit"
          />
        </div>

        <!-- Final Preview: assembled & welded bend -->
        <ArcCanvas
          :R="inputs.R"
          :D="inputs.D"
          :theta="inputs.theta"
          :n="inputs.n"
          :phi="phi"
          :is-valid="isValid"
        />

        <!-- Results table -->
        <ResultsTable
          :segments="segments"
          :totals="totals"
          :phi="phi"
          :theta="inputs.theta"
          :n="inputs.n"
          :unit="unit"
        />

      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-800 mt-auto">
      <div class="max-w-screen-2xl mx-auto px-6 py-3 text-xs text-gray-700">
        Pie-cut geometry · All calculations follow: φ = θ / (2n) · L = R × θ_rad / n · Δ = (D/2) × tan(φ)
      </div>
    </footer>

  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { usePieCut } from './composables/usePieCut.js'
import InputPanel from './components/InputPanel.vue'
import ArcCanvas from './components/ArcCanvas.vue'
import CutTemplateCanvas from './components/CutTemplateCanvas.vue'
import ResultsTable from './components/ResultsTable.vue'
import StraightCutCanvas from './components/StraightCutCanvas.vue'

// All internal values in mm and degrees
const inputs = reactive({
  R: 100,   // mm – bend centerline radius
  D: 50,    // mm – tube outer diameter
  t: 3,     // mm – wall thickness
  theta: 90, // degrees – total bend angle
  n: 4,     // integer – number of segments
})

const unit = ref('mm')

// Wrap reactive inputs as individual refs for the composable
import { toRef } from 'vue'

const R = toRef(inputs, 'R')
const D = toRef(inputs, 'D')
const t = toRef(inputs, 't')
const theta = toRef(inputs, 'theta')
const n = toRef(inputs, 'n')

const { validationError, isValid, phi, segments, totals } = usePieCut(R, D, t, theta, n)
</script>
