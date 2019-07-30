<template>
  <v-content>
    <v-container grid-list-lg>
      <v-layout row wrap>
        <v-flex md6>
          <pv-drawer-sample-collection-list>
          </pv-drawer-sample-collection-list>
        </v-flex>
      </v-layout>
    </v-container>
  </v-content>
</template>

<script>
import PvDrawerSampleCollectionList from '@/components/PvDrawerSampleCollectionList.vue'

export default {
  name: 'PvHomeCollectionList',
  components: { PvDrawerSampleCollectionList }
}
</script>
