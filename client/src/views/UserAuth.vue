<template>
  <v-app>
    <v-content>
      <v-container fluid fill-height>
        <v-row align="center" justify="center">
          <v-col cols=12 sm=8 md=4>
            <v-card>
              <v-card-title>
                <span class="headline">User Sign in</span>
              </v-card-title>
              <v-card-text>
                <v-container grid-list-md>
                  <v-row>
                    <v-col cols=12>
                      <v-text-field
                        label="Email*" v-model="email" required outlined>
                      </v-text-field>
                    </v-col>
                    <v-col cols=12>
                      <v-text-field label="Password*" v-model="password"
                        type="password" required outlined>
                      </v-text-field>
                    </v-col>
                    <v-col cols=12>
                      <div id="firebaseui-auth-container"></div>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import * as firebase from 'firebase/app'
import 'firebase/auth'
import * as firebaseui from 'firebaseui'
import '../../node_modules/firebaseui/dist/firebaseui.css'

export default {
  data: () => ({
    email: null,
    password: null
  }),
  created () {
    if (this.$route.params.action === 'signout') {
      this.$log.info('signout')
      firebase.auth().signOut()
    }
  },
  mounted () {
    let ui = new firebaseui.auth.AuthUI(firebase.auth())
    let redirectURL = this.$route.query.redirect
    this.$log.info(redirectURL, firebase.auth().currentUser)
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
          this.$log.info(redirectUrl)
          return true
        },
        uiShown: function () {
          this.$log.info('uiShown')
        },
        signInFailure: function (error) {
          this.$log.info(error)
        }
      }
    })
  },
  methods: {
  }
}
</script>
