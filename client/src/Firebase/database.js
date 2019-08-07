import { Database } from '../Firebase'
import { getUser } from './auth'

export const Collections = {
  add (collection) {
    let user = getUser()
    let newCollection = Database.collection('users').doc(user.uid).collection('collections').doc()
    return newCollection.set(collection)
      .then(() => {
        let uid = user.uid
        let name = user.name
        let email = user.email
        let role = 'Owner'
        collection.users = [{uid, name, email, role}]
        return Database.collection('collections').doc(newCollection.id).set(collection)
      })
  },

  get (collectionId) {
    return new Promise((resolve, reject) => {
      Database.collection('collections').doc(collectionId).get().then(doc => {
        if (doc.exists) {
          resolve(doc.data())
        } else {
          reject(Error(`"${collectionId}" not found in collections.`))
        }
      })
    })
  },

  list () {
    let user = getUser()
    return Database.collection('collections').where('owner.email', '==', user.email).get()
  }
}

export const users = {
  register () {
    let user = getUser()
    return Database.collection('users').doc(user.uid).set(user)
  },

  getCollections () {
    let user = getUser()
    return new Promise((resolve, reject) => {
      Database.collection('users').doc(user.uid).collection('collections').get().then(res => {
        let collections = []
        res.forEach(r => {
          let coll = r.data()
          coll.id = r.id
          collections.push(coll)
        })
        resolve(collections)
      })
    })
  }
}
