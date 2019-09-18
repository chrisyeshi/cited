<template>
  <v-card v-bind="$attrs">
    <v-card-text>
      <h3>{{ tagLabel(tagGroup) }}</h3>
      <v-chip-group multiple v-model="selects">
        <v-chip v-for="(tag, index) in tagGroup.children" :key="index"
          filter outlined>
          {{ tagLabel(tag) }}
        </v-chip>
      </v-chip-group>
    </v-card-text>
  </v-card>
</template>

<script>
import _ from 'lodash'

export default {
  name: 'PvDrawerTagGroup',
  props: {
    tagGroup: Object
  },
  computed: {
    selects: {
      get () {
        const array =
          _.map(
            _.map(this.tagGroup.children),
            (tag, index) => tag.selected && index)
        return _.filter(array, v => !_.isNil(v))
      },
      set (selectIndexes) {
        const tagNames =
          _.map(
            selectIndexes,
            selectIndex => _.map(this.tagGroup.children)[selectIndex].name)
        this.$emit('select', tagNames)
      }
    }
  },
  methods: {
    tagLabel (tag) {
      return tag.artHashes
        ? `${tag.name} (${tag.artHashes.length})` : `${tag.name}`
    }
  }
}
</script>
