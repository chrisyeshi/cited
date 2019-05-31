import { interpolateBuPu as interpolateColor } from 'd3-scale-chromatic'

export default function getVisCardSideColor (count, darkness = 0.2) {
  const scalar = 1 - Math.exp(Math.log(1) - darkness * count)
  return interpolateColor(scalar)
}
