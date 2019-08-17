import Vue from 'vue'
import VueAnalytics from 'vue-analytics'
import VueAsyncComputed from 'vue-async-computed'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify';
import * as firebase from 'firebase/app'

firebase.initializeApp({
  apiKey: 'AIzaSyDd_ilM5YG9lBjCiXUx9r71fUrkW-lFSbg',
  authDomain: 'cited-3891b.firebaseapp.com',
  databaseURL: 'https://cited-3891b.firebaseio.com',
  projectId: 'cited-3891b',
  storageBucket: '',
  messagingSenderId: '1079857398647',
  appId: '1:1079857398647:web:597796944284dd62'
})

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

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
