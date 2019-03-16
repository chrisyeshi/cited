import Vue from 'vue'

export default function (tag) {
  return Vue.extend({
    template: `
      <${tag} v-bind="$attrs" @scroll="onScroll"><slot></slot></${tag}>
    `,
    props: {
      bottomOffset: {
        type: Number,
        default: 0
      },
      isAtBottom: Boolean
    },
    data () {
      return {
        bottomEpsilon: 2
      }
    },
    methods: {
      onScroll (event) {
        const target = event.target
        const scrollPos = target.scrollHeight - target.scrollTop
        const bottomLimit = this.bottomOffset + this.bottomEpsilon
        const isAtBottom = scrollPos <= target.offsetHeight + bottomLimit
        this.$emit('update:isAtBottom', isAtBottom)
        if (isAtBottom) {
          this.$emit('scroll-at-bottom', event)
        }
      }
    }
  })
}
