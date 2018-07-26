import Vue from 'vue'
import Router from 'vue-router'
// import HelloWorld from '@/components/HelloWorld'
import Kanban from '@/components/Kanban'
import Contail from '@/components/Contail'
import Resource from 'vue-resource'

Vue.use(Router)
Vue.use(Resource)

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
