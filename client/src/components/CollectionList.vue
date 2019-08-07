<template>
  <v-container
    fluid
    fill-height
  >
    <v-layout row align-top justify-center>
      <v-flex xs3 class="pa-1">
        <v-card
          flat class="pa-2"
        >
          <v-btn color="primary" class="ma-3" @click="dialog = true">
            <v-icon>add</v-icon> New Collection
          </v-btn>
          <v-list rounded>
              <v-list-tile
                v-for="(filter, i) in filters"
                :key="i"
                @click="filterCollection(i)"
                v-bind:class="{active: selected == i}"
              >
                <v-list-tile-action>
                  <v-icon :class="{active: selected == i}" v-text="filter.icon"></v-icon>
                </v-list-tile-action>
                <v-list-tile-content>
                  <v-list-tile-title v-text="filter.text"></v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>

          </v-list>
        </v-card>
      </v-flex>
      <v-flex xs9 class="pa-1">
        <v-toolbar flat dense>
          <v-toolbar-title>Paper Collections</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-card flat>
          <v-list>
            <template v-for="(collection, index) in collections">
              <v-list-tile
                :key="collection.name"
                avatar
                ripple
                style="cursor: pointer"
                :to="collectionURL(collection)"
              >
                <v-list-tile-content>
                  <v-list-tile-title>
                    {{ collection.name }}
                  </v-list-tile-title>
                  <v-list-tile-sub-title class="text--primary">{{ collection.description }}</v-list-tile-sub-title>
                </v-list-tile-content>
                <v-list-tile-action>
                  <v-list-tile-action-text>{{ collection.nArticle }}</v-list-tile-action-text>
                </v-list-tile-action>
              </v-list-tile>
              <v-divider
                v-if="index + 1 < collections.length"
                :key="index"
              ></v-divider>
            </template>
          </v-list>
        </v-card>
      </v-flex>
    </v-layout>
    <v-dialog
      persistent
      v-model="dialog"
      max-width="60%"
    >
      <v-card>
        <v-card-title class="headline">Create new collection</v-card-title>
          <v-card-text>
          <v-text-field
            label="Name"
            v-model="newCollection.name"
          ></v-text-field>
          <v-text-field
            label="Discription"
            box
            v-model="newCollection.description"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="green darken-1"
            flat="flat"
            @click="createCollection()"
          >
            Create
          </v-btn>
          <v-btn
            flat="flat"
            @click="dialog = false"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { Collections } from '@/Firebase/database'
export default {
  name: 'CollectionList',
  data () {
    return {
      dialog: false,
      collections: [],
      newCollection: null,
      actions: [
        'edit', 'delete'
      ],
      selected: 0,
      filters: [
        { text: 'All Collections', icon: 'home' },
        { text: 'My Collections', icon: 'face' },
        { text: 'Shared with Me', icon: 'people' },
        { text: 'Watched', icon: 'bookmark' }
      ]
    }
  },
  created () {
    this.setDefaultsForNewCollection()
  },
  methods: {
    filterCollection (index) {
      this.selected = index
      console.log(this.selected)
    },
    collectionURL (coll) {
      return '/collection/' + coll.id
    },
    createCollection () {
      this.newCollection.lastUpdated = new Date()
      Collections.add(this.newCollection).then((c) => {
        this.collections.push(Object.assign({}, this.newCollection))
        this.setDefaultsForNewCollection()
        this.dialog = false
      })
    },
    setDefaultsForNewCollection () {
      this.newCollection = {
        name: null,
        description: null,
        nArticle: 0,
        public: false
      }
    },
    commitAction (action, index) {
      if (action === 'edit') {

      } else if (action === 'delete') {

      }
    }
  }
}
</script>

<style scoped>
.active {
  color: rgb(21, 146, 196);
}
</style>
