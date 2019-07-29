import * as firebase from 'firebase/app'
import 'firebase/auth'
import {firebaseConfig} from '../config/firebase.conf'
firebase.initializeApp(firebaseConfig)

export default class FirebaseAuth {
  constructor () {
    this.auth = firebase.auth()
    this.provider = new firebase.auth.GoogleAuthProvider()
  }

  signIn () {
    return new Promise((resolve, reject) => {
      this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(() => {
        return this.auth.signInWithPopup(this.provider)
      }).then(result => {
        resolve(result)
      }).catch(error => {
        reject(error)
      })
    })
  }

  signOut () {
    this.auth.signOut()
  }

  getUser () {
    return this.auth.currentUser
  }
}
