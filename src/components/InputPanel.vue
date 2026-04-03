<template>
  <aside class="flex flex-col gap-6 p-5 bg-gray-900 border border-gray-700 rounded-xl w-full lg:min-w-65">

    <!-- Unit Toggle -->
    <div class="flex items-center justify-between">
      <span class="text-xs uppercase tracking-widest text-gray-400 font-semibold">Units</span>
      <div class="flex rounded-lg border border-gray-600 overflow-hidden text-sm font-semibold">
        <button
          :class="unit === 'mm' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
          class="px-3 py-1 transition-colors"
          @click="$emit('update:unit', 'mm')"
        >mm</button>
        <button
          :class="unit === 'in' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
          class="px-3 py-1 transition-colors"
          @click="$emit('update:unit', 'in')"
        >in</button>
      </div>
    </div>

    <div class="border-t border-gray-700"></div>

    <!-- Inputs -->
    <div class="flex flex-col gap-4">

      <InputField
        label="Bend Radius"
        :unit="unit"
        :value="toDisplay(modelValue.R)"
        :min="0"
        :step="unit === 'mm' ? 1 : 0.05"
        @update="v => emit('update:modelValue', { ...modelValue, R: fromDisplay(v) })"
      />

      <InputField
        label="Tube O.D."
        :unit="unit"
        :value="toDisplay(modelValue.D)"
        :min="0"
        :step="unit === 'mm' ? 0.5 : 0.01"
        @update="v => emit('update:modelValue', { ...modelValue, D: fromDisplay(v) })"
      />

      <InputField
        label="Wall Thickness"
        :unit="unit"
        :value="toDisplay(modelValue.t)"
        :min="0"
        :step="unit === 'mm' ? 0.1 : 0.005"
        @update="v => emit('update:modelValue', { ...modelValue, t: fromDisplay(v) })"
      />

      <!-- Bend Angle — always in degrees -->
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-400 uppercase tracking-wider">Bend Angle</label>
        <div class="flex items-center gap-2">
          <input
            type="number"
            :value="modelValue.theta"
            min="1"
            max="180"
            step="1"
            class="input-field"
            @input="e => { const v = Number(e.target.value); if (!isNaN(v) && v > 0) emit('update:modelValue', { ...modelValue, theta: clamp(v, 1, 180) }) }"
          />
          <span class="text-gray-400 text-sm w-6">°</span>
        </div>
      </div>

      <!-- Segments — integer only -->
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-400 uppercase tracking-wider">Segments</label>
        <div class="flex items-center gap-2">
          <input
            type="number"
            :value="modelValue.n"
            min="2"
            max="36"
            step="1"
            class="input-field"
            @input="e => { const v = Math.round(Number(e.target.value)); if (!isNaN(v) && v >= 2) emit('update:modelValue', { ...modelValue, n: clamp(v, 2, 36) }) }"
          />
          <span class="text-gray-400 text-sm w-6">pcs</span>
        </div>
      </div>

    </div>

    <!-- Validation Error -->
    <div
      v-if="error"
      class="flex items-start gap-2 bg-red-950 border border-red-700 rounded-lg p-3 text-red-300 text-xs leading-relaxed"
    >
      <svg class="w-4 h-4 mt-0.5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      {{ error }}
    </div>

  </aside>
</template>

<script setup>
import { defineComponent, h } from 'vue'
import { useUnitFormat } from '../composables/useUnitFormat'

const props = defineProps({
  modelValue: { type: Object, required: true },
  unit: { type: String, default: 'mm' },
  error: { type: String, default: null },
})
const emit = defineEmits(['update:modelValue', 'update:unit'])

const { toDisplay, fromDisplay } = useUnitFormat(() => props.unit)
const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

// Inline sub-component for consistent field layout
const InputField = defineComponent({
  props: {
    label: { type: String, default: '' },
    unit: { type: String, default: 'mm' },
    value: { type: Number, default: 0 },
    min: { type: Number, default: 0 },
    step: { type: Number, default: 1 },
  },
  emits: ['update'],
  setup(p, { emit: emitField }) {
    return () => h('div', { class: 'flex flex-col gap-1' }, [
      h('label', { class: 'text-xs text-gray-400 uppercase tracking-wider' }, p.label),
      h('div', { class: 'flex items-center gap-2' }, [
        h('input', {
          type: 'number',
          value: p.value,
          min: p.min,
          step: p.step,
          class: 'input-field',
          onInput: (e) => emitField('update', Number(e.target.value)),
        }),
        h('span', { class: 'text-gray-400 text-sm w-6' }, p.unit),
      ]),
    ])
  },
})
</script>

