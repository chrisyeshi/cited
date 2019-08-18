<template>
  <v-container>
    <v-row align="start" justify="center">
      <v-col cols=3 class="pa-1">
        <v-card flat class="pa-2">
          <v-btn color="primary" class="ma-3" @click="dialog = true">
            <v-icon left>mdi-plus</v-icon>New Collection
          </v-btn>
          <v-list rounded>
            <v-list-item v-for="(filter, i) in filters" :key="i"
              @click="filterCollection(i)" :class="{active: selected == i}">
              <v-list-item-action>
                <v-icon :class="{active: selected == i}">
                  {{ filter.icon }}
                </v-icon>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title v-text="filter.text"></v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols=9 class="pa-1">
        <v-toolbar flat dense color="#f5f5f5">
          <v-toolbar-title>Paper Collections</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-list two-line>
          <template v-for="(collection, index) in collections">
            <v-list-item
              :key="collection.title"
              ripple
              style="cursor: pointer"
              :to="collectionURL(collection)"
            >
              <v-list-item-content>
                <v-list-item-title>
                  {{ collection.title }}
                </v-list-item-title>
                <v-list-item-subtitle class="text--primary">
                  {{ collection.description }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-list-item-action-text>{{ collection.nArticle }}</v-list-item-action-text>
              </v-list-item-action>
            </v-list-item>
            <v-divider
              v-if="index + 1 < collections.length"
              :key="index"
            ></v-divider>
          </template>
        </v-list>
      </v-col>
    </v-row>
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
            v-model="newCollection.title"
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
import { Collections } from '@/firebase/database'
import * as firebase from 'firebase/app'
import 'firebase/firestore'
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
        { text: 'All Collections', icon: 'mdi-home' },
        { text: 'My Collections', icon: 'mdi-face' },
        { text: 'Shared with Me', icon: 'mdi-account-multiple' },
        { text: 'Watched', icon: 'mdi-bookmark' }
      ]
    }
  },
  created () {
    this.setDefaultsForNewCollection()
  },
  methods: {
    filterCollection (index) {
      this.selected = index
      this.$log.info(this.selected)
    },
    collectionURL (coll) {
      return '/collection/' + coll.id
    },
    createCollection () {
      this.newCollection.lastUpdated =
        firebase.firestore.FieldValue.serverTimestamp()
      Collections.add(this.newCollection).then(() => {
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
        this.$log.info(action, index)
      } else if (action === 'delete') {
        this.$log.info(action, index)
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
