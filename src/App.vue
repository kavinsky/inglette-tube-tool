<template>
  <div class="min-h-screen bg-gray-950 text-gray-100 font-mono flex flex-col">

    <!-- Header -->
    <header class="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
      <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
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
        <div class="flex items-center gap-3">
          <span class="hidden sm:inline text-xs text-amber-500/70" title="This tool has been VibeCoded — verify results before fabrication. Use at your own risk.">⚠ This tool has been VibeCoded · use at your own risk</span>
          <span class="hidden lg:inline text-xs text-gray-600">All internal values in mm &amp; degrees</span>
          <!-- Hamburger: visible on mobile only -->
          <button
            @click="sidebarOpen = !sidebarOpen"
            class="lg:hidden flex flex-col justify-center gap-1.5 w-8 h-8 p-1.5 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
            :aria-label="sidebarOpen ? 'Hide inputs' : 'Show inputs'"
          >
            <span class="block h-px w-full bg-current rounded" />
            <span class="block h-px w-full bg-current rounded" />
            <span class="block h-px w-full bg-current rounded" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main layout -->
    <main class="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6 w-full flex-1">

      <!-- Left sidebar: inputs (hidden on mobile until toggle) -->
      <div :class="[sidebarOpen ? 'block' : 'hidden', 'lg:block', 'shrink-0']">
        <InputPanel
          :modelValue="inputs"
          @update:modelValue="v => Object.assign(inputs, v)"
          v-model:unit="unit"
          :error="validationError"
        />
      </div>

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

    <!-- Bottom disclaimer + formula reference -->
    <footer class="border-t border-gray-800 mt-auto text-xs font-mono">

      <!-- Formula reference -->
      <div class="border-b border-gray-800/60 bg-gray-900/40">
        <div class="max-w-screen-2xl mx-auto px-6 py-5">
          <h2 class="text-gray-400 font-semibold mb-3 tracking-wide uppercase text-[10px]">Geometry Reference — Pie-Cut Tube Bend</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-10 gap-y-4 text-gray-500">

            <div>
              <p class="text-gray-400 mb-1">Cut angle per joint (φ)</p>
              <p class="text-indigo-400/80 bg-gray-950/60 px-2 py-1 rounded">φ = θ / (2 × n)</p>
              <p class="mt-1 text-gray-600">Each cut face is tilted φ degrees from a square cut. Two mating faces together recover the full bend increment θ/n.</p>
            </div>

            <div>
              <p class="text-gray-400 mb-1">Segment arc lengths</p>
              <p class="text-indigo-400/80 bg-gray-950/60 px-2 py-1 rounded">L = R × (θ_rad / n)</p>
              <p class="text-indigo-400/80 bg-gray-950/60 px-2 py-1 rounded mt-1">L_outer = (R + D/2) × (θ_rad / n)</p>
              <p class="text-indigo-400/80 bg-gray-950/60 px-2 py-1 rounded mt-1">L_inner = (R − D/2) × (θ_rad / n)</p>
              <p class="mt-1 text-gray-600">Arc length along the centerline, outer wall, and inner wall of each segment.</p>
            </div>

            <div>
              <p class="text-gray-400 mb-1">Long / short side offset (Δ)</p>
              <p class="text-indigo-400/80 bg-gray-950/60 px-2 py-1 rounded">Δ = (D/2) × tan(φ)</p>
              <p class="text-indigo-400/80 bg-gray-950/60 px-2 py-1 rounded mt-1">Long side = L_center + Δ</p>
              <p class="text-indigo-400/80 bg-gray-950/60 px-2 py-1 rounded mt-1">Short side = L_center − Δ</p>
              <p class="mt-1 text-gray-600">The angled cut produces a trapezoidal cross-section. Δ is the half-difference between the two parallel faces.</p>
            </div>

            <div>
              <p class="text-gray-400 mb-1">Inputs</p>
              <ul class="text-gray-600 space-y-0.5">
                <li><span class="text-gray-500">R</span> — Centerline bend radius (mm)</li>
                <li><span class="text-gray-500">D</span> — Tube outer diameter (mm)</li>
                <li><span class="text-gray-500">t</span> — Wall thickness (mm)</li>
                <li><span class="text-gray-500">θ</span> — Total bend angle (degrees)</li>
                <li><span class="text-gray-500">n</span> — Number of cut segments (≥ 2)</li>
              </ul>
            </div>

            <div>
              <p class="text-gray-400 mb-1">Constraints</p>
              <ul class="text-gray-600 space-y-0.5">
                <li>R &gt; D/2 — prevents negative inner radius</li>
                <li>t &lt; D/2 — wall must be thinner than tube radius</li>
                <li>0° &lt; θ ≤ 180°</li>
                <li>n ≥ 2, integer</li>
              </ul>
            </div>

            <div>
              <p class="text-gray-400 mb-1">Number of cuts</p>
              <p class="text-indigo-400/80 bg-gray-950/60 px-2 py-1 rounded">cuts = n + 1</p>
              <p class="mt-1 text-gray-600">Two end cuts plus (n − 1) internal cuts. Each internal cut produces the mating angled faces of two adjacent segments.</p>
            </div>

          </div>
        </div>
      </div>

      <!-- Legal disclaimer -->
      <div class="border-b border-gray-800/60 bg-gray-950">
        <div class="max-w-screen-2xl mx-auto px-6 py-4 text-gray-600 leading-relaxed">
          <p class="text-gray-500 font-semibold mb-1">Disclaimer</p>
          <p>
            This tool was developed with the assistance of artificial intelligence and is provided for informational and reference purposes only.
            While the underlying geometry and formulas follow standard pie-cut fabrication practice, no warranty — express or implied — is made
            regarding the accuracy, completeness, or fitness for a particular purpose of the results produced.
            All dimensions, angles, and cut lengths must be independently verified by a qualified professional before use in fabrication.
            The authors accept no liability for any loss, injury, or damage arising from reliance on this tool.
            <strong class="text-gray-500">Use at your own risk.</strong>
          </p>
        </div>
      </div>

      <!-- MIT License -->
      <div class="bg-gray-950">
        <div class="max-w-screen-2xl mx-auto px-6 py-4 text-gray-600 leading-relaxed">
          <p class="text-gray-500 font-semibold mb-2">MIT License</p>
          <p class="mb-2">Copyright &copy; 2026 Inglette Tool Contributors</p>
          <p class="mb-2">
            Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
            documentation files (the "Software"), to deal in the Software without restriction, including without limitation
            the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
            and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
          </p>
          <p class="mb-2">
            The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
          </p>
          <p class="text-gray-700 uppercase tracking-wide text-[10px] leading-relaxed">
            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
            THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
            AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
            CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
            DEALINGS IN THE SOFTWARE.
          </p>
        </div>
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
const sidebarOpen = ref(false)

// Wrap reactive inputs as individual refs for the composable
import { toRef } from 'vue'

const R = toRef(inputs, 'R')
const D = toRef(inputs, 'D')
const t = toRef(inputs, 't')
const theta = toRef(inputs, 'theta')
const n = toRef(inputs, 'n')

const { validationError, isValid, phi, segments, totals } = usePieCut(R, D, t, theta, n)
</script>
