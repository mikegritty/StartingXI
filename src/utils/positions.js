// Standard football pitch ratio: 105m long x 68m wide
const PITCH_ASPECT_RATIO = 105 / 68  // ~1.544 (length/width)

/**
 * Convert normalized [0,1] coords to pixel coords on the stage.
 * @param {number} nx - normalized x (0=left, 1=right)
 * @param {number} ny - normalized y (0=top, 1=bottom)
 * @param {{ x: number, y: number, width: number, height: number }} pitchRect
 * @returns {{ px: number, py: number }}
 */
export function normToPixel(nx, ny, pitchRect) {
  return {
    px: pitchRect.x + nx * pitchRect.width,
    py: pitchRect.y + ny * pitchRect.height,
  }
}

/**
 * Convert pixel coords (stage-absolute) to normalized [0,1] coords.
 * @param {number} px - stage-absolute x in pixels
 * @param {number} py - stage-absolute y in pixels
 * @param {{ x: number, y: number, width: number, height: number }} pitchRect
 * @returns {{ nx: number, ny: number }}
 */
export function pixelToNorm(px, py, pitchRect) {
  return {
    nx: (px - pitchRect.x) / pitchRect.width,
    ny: (py - pitchRect.y) / pitchRect.height,
  }
}

/**
 * Clamp a normalized value to [0, 1].
 * @param {number} n
 * @returns {number}
 */
export function clampNorm(n) {
  return Math.max(0, Math.min(1, n))
}

/**
 * Compute the pitch rect (pixel coordinates of the pitch area) from stage dimensions.
 * Maintains the standard football pitch aspect ratio.
 * @param {number} stageWidth
 * @param {number} stageHeight
 * @param {number} padding - padding on each side in pixels
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function getPitchRect(stageWidth, stageHeight, padding = 40) {
  // The pitch is displayed vertically (portrait): height > width
  // So height maps to pitch length (105m), width maps to pitch width (68m)
  // aspectRatio here is height/width = 105/68
  const aspectRatio = PITCH_ASPECT_RATIO

  let pitchWidth = stageWidth - padding * 2
  let pitchHeight = pitchWidth * aspectRatio

  if (pitchHeight > stageHeight - padding * 2) {
    pitchHeight = stageHeight - padding * 2
    pitchWidth = pitchHeight / aspectRatio
  }

  const x = (stageWidth - pitchWidth) / 2
  const y = (stageHeight - pitchHeight) / 2

  return { x, y, width: pitchWidth, height: pitchHeight }
}
