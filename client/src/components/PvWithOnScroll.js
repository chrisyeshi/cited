import Vue from 'vue'

export default function (scrollTarget) {
  return Vue.component('with-on-scroll', {
    template: `<div v-scroll:${scrollTarget}="onScroll"><slot></slot></div>`,
    props: {
      bottomOffset: {
        type: Number,
        default: 0
      }
    },
    methods: {
      onScroll (event) {
        this.$emit('scroll', event)
        const target = event.target
        const scrollPos = target.scrollHeight - target.scrollTop
        const isAtBottom = scrollPos <= target.offsetHeight + this.bottomOffset
        if (isAtBottom) {
          this.$emit('scroll-at-bottom', event)
        }
      }
    }
  })
}
