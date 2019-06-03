// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueAnalytics from 'vue-analytics'
import VueAsyncComputed from 'vue-async-computed'
import VueLineClamp from 'vue-line-clamp'
import App from './App'
import router from './router'
import store from './store'
import VueApollo from 'vue-apollo'
import AppsyncClient from 'aws-appsync'
import Amplify, * as AmplifyModules from 'aws-amplify'
import { AmplifyPlugin } from 'aws-amplify-vue'
import awsmobile from '../aws-exports'

const oauth = {
  domain: 'disco.auth.us-east-2.amazoncognito.com',
  scope: ['email', 'profile', 'openid'],
  redirectSignIn: 'http://localhost:8080/demo/',
  redirectSignOut: 'http://localhost:8080/demo/',
  responseType: 'code' // or token
}
Amplify.configure(awsmobile)
AmplifyModules.Auth.configure({ oauth })
Vue.use(AmplifyPlugin, AmplifyModules)

const appsyncConfig = {
  url: awsmobile.aws_appsync_graphqlEndpoint,
  region: awsmobile.aws_project_region,
  auth: {
    type: awsmobile.aws_appsync_authenticationType,
    jwtToken: async () => {
      const session = await AmplifyModules.Auth.currentSession()
      return session.getIdToken().getJwtToken()
    }
  },
  disableOffline: false,
  cacheOptions: {
    dataIdFromObject: obj => {
      if (obj.id) {
        return obj.id
      }
      if (obj.userId && obj.collId && obj.artId) {
        return `user-${obj.userId}-coll-${obj.collId}-art-${obj.artId}`
      }
      if (obj.userId && obj.collId) {
        return `user-${obj.userId}-coll-${obj.collId}`
      }
      if (obj.referenceId && obj.citedById) {
        return `reference-${obj.referenceId}-citedBy-${obj.citedById}`
      }
    }
  }
}
const appsyncOptions = {
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network'
    }
  }
}
const appsyncClient = new AppsyncClient(appsyncConfig, appsyncOptions)
const appsyncProvider = new VueApollo({ defaultClient: appsyncClient })
Vue.use(VueApollo)

Vue.use(VueLineClamp, { importCss: true })
Vue.use(VueAsyncComputed)

Vue.use(VueAnalytics, {
  id: 'UA-131008086-1',
  router,
  autoTracking: {
    exception: true
  },
  debug: {
    sendHitTask: process.env.NODE_ENV === 'production'
  },
  command: {
    event (category, action, label, value) {
      this.$ga.event(category, action, label, value)
    }
  }
})
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  provide: appsyncProvider.provide(),
  template: '<App/>'
})
