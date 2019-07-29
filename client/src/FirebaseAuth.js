import * as firebase from 'firebase/app'
import 'firebase/auth'
import {firebaseConfig} from '../config/firebase.conf'
firebase.initializeApp(firebaseConfig)

export default class FirebaseAuth {
  constructor (mode = 'popup') {
    this.mode = mode
    this.auth = firebase.auth()
    this.provider = new firebase.auth.GoogleAuthProvider()
  }

  signIn () {
    let method = (this.mode === 'redirect') ? this.signInWithRedirect : this.signInWithPopup
    return this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(() => {
      return method.call(this)
    })
  }

  signInWithPopup () {
    return new Promise((resolve, reject) => {
      this.auth.signInWithPopup(this.provider).then(result => {
        resolve(result)
      }).catch(error => {
        reject(error)
      })
    })
  }

  signInWithRedirect () {
    return this.auth.signInWithRedirect(this.provider)
  }

  checkSignIn () {
    return this.auth.getRedirectResult()
  }

  signOut () {
    return this.auth.signOut()
  }

  getUser () {
    return this.auth.currentUser
  }
}
