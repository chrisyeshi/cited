import getNextLayout from './getnextlayout.js'

export default {
  methods: {
    showRelatedRefObjs (relation, refObj, isHistory = true) {
      window.flipping.read()
      const query = { search: `${relation}:${refObj.id}` }
      query.layout = getNextLayout(this.$store.getters.layout, {
        'minorsearch': [ 'home', 'search', 'refobj', 'minorrefobj' ],
        'majorsearch': [ 'collection', 'majorrefobj' ]
      })
      if (this.$store.getters.currCollectionId >= 0) {
        query.collection = this.$store.getters.currCollectionId
      }
      this.$router.push({ path: '/smooth', query: query })
      this.$nextTick(() => {
        window.flipping.flip()
      })
      if (isHistory) {
        this.$store.dispatch('pushToHistory', refObj.id)
      }
    }
  }
}
