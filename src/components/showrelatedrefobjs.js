export default {
  methods: {
    showRelatedRefObjs (relation, refObj, isHistory = true) {
      window.flipping.read()
      const query = { search: `${relation}:${refObj.id}` }
      const layout = this.$store.getters.layout
      query.layout =
        layout === 'home' || layout === 'search'
          ? 'minor'
          : layout === 'collection'
            ? 'major'
            : layout
      if (this.$store.getters.currCollectionId >= 0) {
        query.collection = this.$store.getters.currCollectionId
      }
      this.$router.push({ path: '/smooth', query: query })
      this.$nextTick(() => {
        window.flipping.flip()
      })
      this.$store.commit('insertToHistory', refObj)
    }
  }
}
