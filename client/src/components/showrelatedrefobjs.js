export default {
  methods: {
    async showRelatedRefObjs (relation, refObj, isHistory = true) {
      if (isHistory) {
        await this.$store.dispatch('pushToHistory', refObj.id)
      }
      window.flipping.read()
      const searchText = `${relation}:${refObj.id}`
      if (this.$store.getters.currCollectionId) {
        const collId = this.$store.getters.currCollectionId
        this.$router.push(`/smooth/search/${searchText}/collection/${collId}`)
      } else {
        this.$router.push(`/smooth/search/${searchText}`)
      }
      this.$nextTick(() => {
        window.flipping.flip()
      })
    }
  }
}
