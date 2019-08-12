<template>
  <div>
    <pv-drawer-all-collection-list />
    <v-divider></v-divider>
    <v-progress-circular v-if="isSignedIn === null" indeterminate
      class="ma-4" style="width: 100%">
    </v-progress-circular>
    <pv-drawer-my-collection-list v-else-if="isSignedIn === true">
    </pv-drawer-my-collection-list>
    <v-container v-else class="text-xs-center">
      <v-btn flat small color="primary" @click="signIn">
        Sign In
      </v-btn>
    </v-container>
  </div>
</template>

<script>
import AuthMixin from '@/components/authmixin.js'
import PvDrawerAllCollectionList
  from '@/components/PvDrawerAllCollectionList.vue'
import PvDrawerMyCollectionList from '@/components/PvDrawerMyCollectionList.vue'

export default {
  name: 'PvDrawerCollectionList',
  components: { PvDrawerAllCollectionList, PvDrawerMyCollectionList },
  mixins: [ AuthMixin ]
}
</script>
