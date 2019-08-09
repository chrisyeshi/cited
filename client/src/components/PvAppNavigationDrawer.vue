<template>
  <v-navigation-drawer app stateless clipped :width="drawerWidth"
    v-model="isDrawerOpenComputed" style="overflow: visible;">
    <pv-drawer-toggle-button v-model="isDrawerOpenComputed" />
    <router-view style="height: 100%; overflow: auto;" />
  </v-navigation-drawer>
</template>

<script>
import { mapState } from 'vuex'
import PvDrawerToggleButton from '@/components/PvDrawerToggleButton.vue'

export default {
  name: 'PvAppNavigationDrawer',
  components: { PvDrawerToggleButton },
  computed: {
    ...mapState('parseVis', [ 'isDrawerOpen' ]),
    drawerWidth () {
      return this.$vuetify.breakpoint.xs ? undefined : 450
    },
    isDrawerOpenComputed: {
      set (isDrawerOpen) {
        this.$store.commit('parseVis/set', { isDrawerOpen })
      },
      get () {
        return this.isDrawerOpen
      }
    }
  }
}
</script>
