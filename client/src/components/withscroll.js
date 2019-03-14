import Vue from 'vue'

export default function (tag) {
  return Vue.extend({
    template: `<${tag} @scroll="onScroll"><slot></slot></${tag}>`,
    props: {
      bottomOffset: {
        type: Number,
        default: 0
      },
      isAtBottom: Number
    },
    methods: {
      onScroll (event) {
        const target = event.target
        const scrollPos = target.scrollHeight - target.scrollTop
        const isAtBottom = scrollPos <= target.offsetHeight + this.bottomOffset
        this.$emit('update:isAtBottom', isAtBottom)
        if (isAtBottom) {
          this.$emit('scroll-at-bottom', event)
        }
      }
    }
  })
}
