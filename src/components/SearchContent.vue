<template>
  <v-layout column v-resize="onResize" style="height: calc(100vh - 200px); overflow: auto;">
    <v-container
      fluid :pb-0="!$store.state.isVisPaneVisible"
      :py-2="$store.state.isVisPaneVisible" style="flex-basis: auto;">
      <v-layout row align-center>
        <v-flex :offset-md2="!$store.state.isVisPaneVisible" class="px-2">
          <h4>
            <span>
              {{ $store.state.searchLabel.text }}
            </span>
            <a v-if="!isSearchLabelRefObjArray">
              {{ $store.state.searchLabel.refObj.title }}
            </a>
            <span v-else>
              <template
                v-for="(refObj, index) in $store.state.searchLabel.refObj">
                <a :key="`title-${index}`">
                  {{ refObj.title }}
                </a>
                <span :key="`and-${index}`"
                  v-if="index < $store.state.searchLabel.refObj.length - 1">
                  and
                </span>
              </template>
            </span>
          </h4>
        </v-flex>
        <v-icon v-if="isFilterIconVisible" @click="isManualShowFilter = !isManualShowFilter">filter_list</v-icon>
      </v-layout>
    </v-container>
    <v-divider v-if="!$store.state.isVisPaneVisible" class="my-2"></v-divider>
    <v-container fluid class="py-0">
      <v-layout row wrap>
        <v-flex v-if="isFilterVisible" xs12 md2 class="pr-2 mb-4">
          <v-radio-group v-model="timeFilter" hide-details class="ma-0 pt-2">
            <v-radio label="Any time" value="anyTime"></v-radio>
            <v-radio label="Since 2018" value="since2018"></v-radio>
            <v-radio label="Since 2017" value="since2017"></v-radio>
            <v-radio label="Since 2016" value="since2016"></v-radio>
            <v-radio label="Custom ..." value="custom"></v-radio>
          </v-radio-group>
          <v-divider class="my-2"></v-divider>
          <v-radio-group v-model="sortBy" hide-details class="ma-0 pa-0">
            <v-radio label="Sort by relevance" value="relevance">
            </v-radio>
            <v-radio label="Sort by date" value="date"></v-radio>
          </v-radio-group>
          <v-divider class="my-2"></v-divider>
          <v-checkbox hide-details class="mt-2 pt-0" label="include papers"
            v-model="includePapers">
          </v-checkbox>
          <v-checkbox hide-details class="mt-2 pt-0" label="include websites"
            v-model="includeWebsites">
          </v-checkbox>
        </v-flex>
        <v-flex :md10="!$store.state.isVisPaneVisible" class="px-2">
          <slot></slot>
        </v-flex>
      </v-layout>
    </v-container>
  </v-layout>
</template>

<script>
import _ from 'lodash'

export default {
  name: 'SearchContent',
  data () {
    return {
      windowSize: { width: 0, height: 0 },
      isManualShowFilter: false,
      timeFilter: 'anyTime',
      sortBy: 'relevance',
      includePapers: true,
      includeWebsites: true
    }
  },
  computed: {
    isFilterVisible () {
      if (this.$store.state.isVisPaneVisible) {
        return false
      }
      if (this.windowSize.width >= 960) {
        return true
      }
      return this.isManualShowFilter
    },
    isFilterIconVisible () {
      if (this.$store.state.isVisPaneVisible) {
        return true
      }
      return this.windowSize.width < 960
    },
    isSearchLabelRefObjArray () {
      return _.isArray(this.$store.state.searchLabel.refObj)
    }
  },
  mounted () {
    this.onResize()
  },
  methods: {
    onResize () {
      this.windowSize = { width: window.innerWidth, height: window.innerHeight }
    },
    trace (value) {
      console.log(value)
      return value
    }
  }
}
</script>

<style scoped>
</style>
