<template>
  <v-content>
    <v-container grid-list-lg>
      <v-row>
        <v-col cols=12 md=6>
          <pv-drawer-all-collection-list />
        </v-col>
        <v-col cols=12 md=6>
          <v-progress-circular v-if="isSignedIn === null" indeterminate
            class="ma-4" style="width: 100%;">
          </v-progress-circular>
          <pv-drawer-my-collection-list v-else-if="isSignedIn === true">
          </pv-drawer-my-collection-list>
          <v-list v-else>
            <v-subheader>My Collections</v-subheader>
            <v-btn text small color="primary" @click="signIn">
              Login to view/save user collections
            </v-btn>
          </v-list>
        </v-col>
      </v-row>
    </v-container>
  </v-content>
</template>

<script>
import AuthMixin from '@/components/authmixin.js'
import PvDrawerAllCollectionList
  from '@/components/PvDrawerAllCollectionList.vue'
import PvDrawerMyCollectionList from '@/components/PvDrawerMyCollectionList.vue'

export default {
  name: 'PvHomeCollectionList',
  components: { PvDrawerMyCollectionList, PvDrawerAllCollectionList },
  mixins: [ AuthMixin ]
}
</script>
