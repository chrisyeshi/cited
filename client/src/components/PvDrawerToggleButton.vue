<template>
  <v-hover>
    <div v-ripple class="drawer-toggle-button" slot-scope="{ hover }"
      :class="`state-${hover ? 'hover' : 'rest'}`"
      @click="$emit('input', !value)">
      <v-icon size="1.5em">
        {{ value ? 'chevron_left' : 'chevron_right' }}
      </v-icon>
    </div>
  </v-hover>
</template>

<script>
export default {
  name: 'PvDrawerToggleButton',
  props: {
    value: Boolean
  }
}
</script>

<style scoped>
.drawer-toggle-button {
  position: absolute;
  left: 100%;
  top: 1em;
  width: 1.5em;
  height: 3.5em;
  line-height: 3.5em;
  border-radius: 0em 0.5em 0.5em 0em;
}

.state-rest {
  background: gainsboro;
  cursor: default;
}

.state-hover {
  background: grey;
  cursor: pointer;
}
</style>
