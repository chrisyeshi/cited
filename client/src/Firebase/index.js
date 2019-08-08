import * as firebase from 'firebase/app'
import {firebaseConfig} from '../../config/firebase.conf'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/storage'
firebase.initializeApp(firebaseConfig)

export const Auth = firebase.auth()
export const Database = firebase.firestore()
export const Storage = firebase.storage()

export const AuthProviders = {
  email: firebase.auth.EmailAuthProvider.PROVIDER_ID,
  google: firebase.auth.GoogleAuthProvider.PROVIDER_ID
}
