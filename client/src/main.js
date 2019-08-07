// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueAnalytics from 'vue-analytics'
import VueAsyncComputed from 'vue-async-computed'
import VueLineClamp from 'vue-line-clamp'
import App from './App'
import router from './router'
import store from './store'
// import * as firebase from 'firebase/app'
// import { firebaseConfig } from '../config/firebase.conf'
// firebase.initializeApp(firebaseConfig)

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
