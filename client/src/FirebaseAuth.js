export default function FirebaseAuth (firebase) {
  let provider = new firebase.auth.GoogleAuthProvider()

  return {
    signIn () {
      let method = (this.mode === 'redirect') ? this.signInWithRedirect : this.signInWithPopup
      return firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(() => {
        return method.call(this)
      })
    },

    signInWithPopup () {
      return new Promise((resolve, reject) => {
        firebase.auth().signInWithPopup(provider).then(result => {
          resolve(result)
        }).catch(error => {
          reject(error)
        })
      })
    },

    signInWithRedirect () {
      return firebase.auth().signInWithRedirect(this.provider)
    },

    getRedirectResult () {
      return firebase.auth().getRedirectResult()
    },

    signOut () {
      return firebase.auth().signOut()
    },

    getUser () {
      return firebase.auth().currentUser
    }
  }
}
