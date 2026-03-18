const DECAY_FACTOR = 0.95
const MIN_WEIGHT = 0.01

export const applyRelevanceDecay = (currentWeight: number, daysElapsed: number): number => {
  const decayed = currentWeight * Math.pow(DECAY_FACTOR, daysElapsed)
  return Math.max(decayed, MIN_WEIGHT)
}
