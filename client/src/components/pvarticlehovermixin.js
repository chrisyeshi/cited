import _ from 'lodash'

export default function createPvArticleHoverMixin (getArtId) {
  return {
    data: () => ({
      isHovering: false
    }),
    methods: {
      onMouseEnter () {
        this.isHovering = true
        this.$store.commit('parseVis/set', {
          temporaryArticleIds:
            _.union(this.$store.state.temporaryArticleIds, [ getArtId(this) ]),
          hoveringArticleId: getArtId(this)
        })
      },
      onMouseLeave () {
        this.isHovering = false
        this.$store.commit('parseVis/set', {
          temporaryArticleIds:
            _.without(
              this.$store.state.temporaryArticleIds, [ getArtId(this) ]),
          hoveringArticleId: null
        })
      }
    }
  }
}
