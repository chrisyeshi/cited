import _ from 'lodash'
import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'

const db = firebase.firestore()

function getUser () {
  return {
    ...firebase.auth().currentUser,
    get name () { return this.displayName },
    get photo () { return this.photoURL }
  }
}

export const Collections = {
  add (collection) {
    const user = getUser()
    return db.collection('collections').add({
      ...collection,
      owner: user.uid
    })
  },

  get (collectionId) {
    return db.doc(`collections/${collectionId}`).get().then(snapshot => {
      if (snapshot.exists) {
        return snapshot.data()
      }
      throw new Error(`"${collectionId}" not found in collections.`)
    })
  },

  list () {
    const user = getUser()
    return db.collection('collMetas')
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
