<template>
  <v-app>
    <v-content>
      <v-container
        fluid
        fill-height
      >
        <v-layout
          align-center
          justify-center
        >
          <v-flex xs12 sm8 md4>
            <v-card>
              <v-card-title>
                <span class="headline">User Sign in</span>
              </v-card-title>
              <v-card-text>
                <v-container grid-list-md>
                  <v-layout wrap>
                    <v-flex xs12>
                      <v-text-field label="Email*" v-model="email" required outline></v-text-field>
                    </v-flex>
                    <v-flex xs12>
                      <v-text-field label="Password*" v-model="password" type="password" required outline></v-text-field>
                    </v-flex>
                    <v-flex xs12>
                      <div id="firebaseui-auth-container"></div>
                    </v-flex>
                  </v-layout>
                </v-container>
              </v-card-text>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import { signOut } from '@/Firebase/auth'
import * as firebase from 'firebase/app'
import * as firebaseui from 'firebaseui'
import '../../node_modules/firebaseui/dist/firebaseui.css'

export default {
  data: () => ({
    email: null,
    password: null
  }),
  created () {
    if (this.$route.params.action === 'signout') {
      console.log('signout')
      signOut()
    }
  },
  mounted () {
    let ui = new firebaseui.auth.AuthUI(firebase.auth())
    let redirectURL = this.$route.query.redirect
    console.log(redirectURL, firebase.auth().currentUser)
    ui.start('#firebaseui-auth-container', {
      signInOptions: [
        {
          provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
          requireDisplayName: false
        },
        // List of OAuth providers supported.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID
      ],
      signInSuccessUrl: redirectURL,
      callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
          console.log(redirectUrl)
          return true
        },
        uiShown: function () {
          console.log('uiShown')
        },
        signInFailure: function (error) {
          console.log(error)
        }
      }
    })
  },
  methods: {
  }
}
</script>
