<template>
  <v-combobox v-bind="$attrs" persistent-hint hint="New article"
    v-model="title">
  </v-combobox>
</template>

<script>
export default {
  name: 'PvArticleSelect',
  props: {
    value: Object
  },
  data () {
    return {
      title: this.value.data.title
    }
  }
}
</script>
