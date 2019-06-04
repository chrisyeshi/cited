export default {
  methods: {
    async showRelatedRefObjs (relation, refObj, isHistory = false) {
      if (isHistory) {
        await this.$store.dispatch('pushToHistory', refObj.id)
      }
      window.flipping.read()
      const searchText = `${relation}:${refObj.id}`
      if (this.$store.getters.currCollectionId) {
        const collId = this.$store.getters.currCollectionId
        this.$router.push(`/alpha/search/${searchText}/collection/${collId}`)
      } else {
        this.$router.push(`/alpha/search/${searchText}`)
      }
      this.$nextTick(() => {
        window.flipping.flip()
      })
    }
  }
}
