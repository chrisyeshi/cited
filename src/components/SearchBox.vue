<template>
  <v-layout>
    <v-flex>
      <div data-flip-key="search-box-text-field">
        <v-text-field
          :flat="flat"
          :solo="!$store.state.isVisPaneVisible"
          :append-icon="$store.state.isVisPaneVisible ? 'search' : ''"
          @click:append="$emit('onSearch', text)"
          hide-details clearable
          autofocus
          v-model="text"
          @keyup.enter="$emit('onSearch', text)">
        </v-text-field>
      </div>
    </v-flex>
    <v-btn v-if="!$store.state.isVisPaneVisible"
      :depressed="flat"
      color="primary ma-0 pa-0"
      data-flip-key="search-box-button"
      style="min-width: 48px; width: 48px; height: 48px;"
      @click="$emit('onSearch', text)">
      <v-icon>search</v-icon>
    </v-btn>
  </v-layout>
</template>

<script>
export default {
  name: 'SearchBox',
  props: {
    flat: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    text: {
      get () {
        return this.$store.state.searchText
      },
      set (value) {
        this.$store.commit('setState', { searchText: value })
      }
    }
  },
  methods: {
    trace (value) {
      console.log(value)
      return value
    }
  }
}
</script>

<style scoped>
</style>
