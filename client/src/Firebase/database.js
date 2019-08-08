import _ from 'lodash'
import { Database } from '../Firebase'
import { getUser } from './auth'

export const Collections = {
  add (collection) {
    const user = getUser()
    return Database.collection('collections').add({
      ...collection,
      owner: user.uid
    })
  },

  get (collectionId) {
    return Database.doc(`collections/${collectionId}`).get().then(snapshot => {
      if (snapshot.exists) {
        return snapshot.data()
      }
      throw new Error(`"${collectionId}" not found in collections.`)
    })
  },

  list () {
    const user = getUser()
    return Database.collection('collMetas')
      .where('owner', '==', user.uid).get()
  }
}

export const users = {
  getCollections () {
    return Collections.list().then(querySnapshot => {
      return _.map(querySnapshot.docs, collSnapshot => ({
        collId: collSnapshot.id,
        ...collSnapshot.data()
      }))
    })
  }
}
