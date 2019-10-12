<template>
  <pv-app-bar>
    <v-text-field
      outlined single-line hide-details class="mx-6" v-model="searchTerm"
      placeholder="Semantic Scholar Paper ID" />
  </pv-app-bar>
</template>

<script>
import PvAppBar from '@/components/PvAppBar.vue'

export default {
  name: 'SaSearchAppBar',
  components: { PvAppBar },
  data: () => ({
    searchTerm: ''
  }),
  methods: {
  }
}
</script>

