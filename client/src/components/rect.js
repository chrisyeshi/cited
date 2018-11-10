export function create ({ left, top, width, height }) {
  return {
    left: left,
    top: top,
    width: width,
    height: height,
    get right () {
      return this.left + this.width
    },
    get center () {
      return {
        x: this.left + this.width / 2,
        y: this.top + this.height / 2
      }
    }
  }
}
