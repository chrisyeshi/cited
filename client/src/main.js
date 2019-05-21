// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueAnalytics from 'vue-analytics'
import VueAsyncComputed from 'vue-async-computed'
import VueLineClamp from 'vue-line-clamp'
import App from './App'
import router from './router'
import store from './store'
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
  template: '<App/>'
})
