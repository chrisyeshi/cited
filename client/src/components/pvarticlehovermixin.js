import _ from 'lodash'

export default {
  data: () => ({
    isHovering: false
  }),
  methods: {
    onMouseEnter () {
      this.isHovering = true
      this.$store.commit('parseVis/set', {
        temporaryArticleIds:
          _.union(this.$store.state.temporaryArticleIds, [ this.artId ]),
        hoveringArticleId: this.artId
      })
    },
    onMouseLeave () {
      this.isHovering = false
      this.$store.commit('parseVis/set', {
        temporaryArticleIds:
          _.without(this.$store.state.temporaryArticleIds, [ this.artId ]),
        hoveringArticleId: null
      })
    }
  }
}
