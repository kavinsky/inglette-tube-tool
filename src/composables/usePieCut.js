import { computed } from 'vue'

/**
 * Pie-cut geometry composable.
 * All inputs must be reactive refs in mm and degrees.
 *
 * @param {Ref<number>} R     - Centerline bend radius (mm)
 * @param {Ref<number>} D     - Tube outer diameter (mm)
 * @param {Ref<number>} t     - Wall thickness (mm)
 * @param {Ref<number>} theta - Total bend angle (degrees)
 * @param {Ref<number>} n     - Number of segments
 */
export function usePieCut(R, D, t, theta, n) {
  const validationError = computed(() => {
    if (!R.value || R.value <= 0) return 'Bend radius must be greater than 0.'
    if (!D.value || D.value <= 0) return 'Tube OD must be greater than 0.'
    if (!t.value || t.value <= 0) return 'Wall thickness must be greater than 0.'
    if (t.value >= D.value / 2) return 'Wall thickness must be less than tube radius (OD/2).'
    if (R.value <= D.value / 2) return 'Bend radius must be greater than tube radius (OD/2) to avoid negative inner radius.'
    if (!theta.value || theta.value <= 0 || theta.value > 180) return 'Bend angle must be between 0° and 180°.'
    if (!n.value || n.value < 2 || !Number.isInteger(n.value)) return 'Segments must be a whole number ≥ 2.'
    return null
  })

  const isValid = computed(() => validationError.value === null)

  /**
   * Cut angle from perpendicular per joint (degrees).
   * Each cut face is tilted by φ from a square cut.
   * φ = θ / (2 * n)
   */
  const phi = computed(() => {
    if (!isValid.value) return 0
    return theta.value / (2 * n.value)
  })

  /**
   * Per-segment arc lengths and offset.
   * L_outer  = (R + D/2) * (theta_rad / n)
   * L_inner  = (R - D/2) * (theta_rad / n)
   * L_center = R * (theta_rad / n)
   * delta    = (D / 2) * tan(phi_rad)   — difference between long/short side
   */
  const segments = computed(() => {
    if (!isValid.value) return []

    const theta_rad = (theta.value * Math.PI) / 180
    const phi_rad = (phi.value * Math.PI) / 180
    const segAngleRad = theta_rad / n.value

    const R_outer = R.value + D.value / 2
    const R_inner = R.value - D.value / 2

    const L_outer = R_outer * segAngleRad
    const L_inner = R_inner * segAngleRad
    const L_center = R.value * segAngleRad
    const delta = (D.value / 2) * Math.tan(phi_rad)

    // All segments are geometrically identical for a uniform bend
    const seg = {
      L_outer,
      L_inner,
      L_center,
      delta,
      // The trapezoid side lengths (along tube axis):
      // longest side (outer of bend) = L_center + delta
      // shortest side (inner of bend) = L_center - delta
      sideOuter: L_center + delta,
      sideInner: L_center - delta,
    }

    return Array.from({ length: n.value }, (_, i) => ({ ...seg, index: i + 1 }))
  })

  const totals = computed(() => {
    if (!isValid.value || segments.value.length === 0) return null
    const seg = segments.value[0]
    return {
      totalCenterline: seg.L_center * n.value,
      totalOuter: seg.L_outer * n.value,
      totalInner: seg.L_inner * n.value,
      numberOfCuts: n.value + 1, // 2 end cuts + (n-1) internal cuts
    }
  })

  /**
   * Notch-bend specific geometry.
   * In notch-bend mode the tube is NOT fully cut — a V-notch is removed from
   * the outer-bend side only, leaving the inner wall intact as a bending hinge.
   *
   * notchDepth       = D − t          (cut from outer face to just inside inner wall)
   * notchHalfAngle   = φ (same as full-cut)
   * notchWidthOuter  = 2 × notchDepth × tan(φ)   (full V opening at outer surface)
   * notchSpacing     = L_outer per segment         (distances between notch centers)
   *
   * The removed wedge cross-section is an isoceles triangle:
   *   base = notchWidthOuter, height = notchDepth
   */
  const notch = computed(() => {
    if (!isValid.value) return null
    const phi_rad = (phi.value * Math.PI) / 180
    const notchDepth = D.value - t.value
    const notchWidthOuter = 2 * notchDepth * Math.tan(phi_rad)
    return {
      depth: notchDepth,
      widthOuter: notchWidthOuter,
      phi: phi.value,
    }
  })

  return {
    validationError,
    isValid,
    phi,
    segments,
    totals,
    notch,
  }
}
