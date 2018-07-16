<template>
  <span>
    <span v-for="idAndLabel in idAndLabels" v-bind:key="idAndLabel.id">
      <input type="radio" v-bind:id="idAndLabel.id" v-bind:name="name" v-bind:value="idAndLabel.id" v-model="selectedId">
      <label v-bind:for="idAndLabel.id">{{ idAndLabel.label }}</label>
    </span>
  </span>
</template>

<script>
export default {
  name: 'RadioGroup',
  props: {
    name: String,
    ids: Array,
    labels: Array,
    value: String
  },
  computed: {
    idAndLabels: function () {
      const ret = []
      for (let i = 0; i < this.ids.length; ++i) {
        ret[i] = {
          id: this.ids[i],
          label: this.labels[i]
        }
      }
      return ret
    },
    selectedId: {
      get: function () {
        return this.value
      },
      set: function (value) {
        this.$emit('input', value)
      }
    }
  }
}
</script>
