<template>
  <v-layout>
    <v-flex>
      <div data-flip-key="search-box-text-field">
        <v-text-field
          :flat="flat"
          :solo="solo"
          :append-icon="!solo ? 'search' : ''"
          @click:append="$emit('onSearch', text)"
          hide-details clearable
          autofocus
          v-model="text"
          @keyup.enter="$emit('onSearch', text)">
        </v-text-field>
      </div>
    </v-flex>
    <v-btn v-if="solo"
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
import _ from 'lodash'

export default {
  name: 'SearchBox',
  props: {
    flat: {
      type: Boolean,
      default: false
    },
    solo: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return { userText: null }
  },
  computed: {
    text: {
      get () {
        return _.isNil(this.userText)
          ? this.$store.state.searchText
          : this.userText
      },
      set (value) {
        this.userText = value
      }
    }
  },
  methods: {
    trace (value) {
      console.log(value)
      return value
    },
    onSearch () {
      this.$emit('onSearch', this.text)
      this.userText = null
    }
  }
}
</script>

<style scoped>
</style>
