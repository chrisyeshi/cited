import _ from 'lodash'

export default {
  data: () => ({
    isHovering: false
  }),
  methods: {
    onMouseEnter (event, el) {
      this.isHovering = true
      this.$store.commit('parseVis/set', {
        temporaryArticleIds:
          _.union(this.$store.state.temporaryArticleIds, [ this.artId ]),
        hoveringArticleId: this.artId
      })
    },
    onMouseLeave (event) {
      this.isHovering = false
      this.$store.commit('parseVis/set', {
        temporaryArticleIds:
          _.without(this.$store.state.temporaryArticleIds, [ this.artId ]),
        hoveringArticleId: null
      })
    }
  }
}
