import Vue from 'vue'
import Vuetify from 'vuetify'
import Router from 'vue-router'
// import HelloWorld from '@/components/HelloWorld'
import Kanban from '@/components/Kanban'
import Contail from '@/components/Contail'
import Resource from 'vue-resource'
import 'vuetify/dist/vuetify.min.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'

Vue.use(Router)
Vue.use(Resource)
Vue.use(Vuetify)

export default new Router({
  routes: [
    {
      path: '/kanban',
      // name: 'Kanban',
      component: Kanban
    },
    {
      path: '/contail',
      // name: 'Contail',
      component: Contail
    }
  ]
})
