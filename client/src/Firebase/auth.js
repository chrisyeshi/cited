import {Auth, AuthProviders} from '@/Firebase/index'

export function fetchUserInfo (firebaseUser) {
  return {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName,
    email: firebaseUser.email,
    photo: firebaseUser.photoURL,
    isNew: firebaseUser.metadata.lastSignInTime === firebaseUser.metadata.creationTime
  }
}

export function signIn (providerName) {
  let provider = AuthProviders[providerName] || AuthProviders.google
  return Auth.signInWithRedirect(provider)
}

export function signOut () {
  return Auth.signOut()
}

export function getUser () {
  return fetchUserInfo(Auth.currentUser)
}

export function onUserSignIn (callback) {
  return Auth.onAuthStateChanged(user => {
    let authUser = null
    if (user) {
      authUser = fetchUserInfo(user)
    }
    callback(authUser)
  })
}
