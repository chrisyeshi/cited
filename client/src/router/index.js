import Vue from 'vue'
import Vuetify from 'vuetify'
import Router from 'vue-router'
// import HelloWorld from '@/components/HelloWorld'
import Kanban from '@/components/Kanban'
import Contail from '@/components/Contail'
import Layouts from '@/components/Layouts'
import Smooth from '@/components/Smooth'
import NotFound from '@/components/NotFound'
import Resource from 'vue-resource'
import 'vuetify/dist/vuetify.min.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'

Vue.use(Router)
Vue.use(Resource)
Vue.use(Vuetify)

export default new Router({
  mode: 'history',
  routes: [
    { path: '/', component: Layouts },
    { path: '/kanban', component: Kanban },
    { path: '/contail', component: Contail },
    { path: '/smooth', component: Smooth },
    { path: '/smooth/search/:routeSearchText', component: Smooth, props: true },
    { path: '/smooth/refobj/:refObjId', component: Smooth, props: true },
    { path: '/smooth/collection/:collId', component: Smooth, props: true },
    { path: '/smooth/search/:routeSearchText/collection/:collId', component: Smooth, props: true },
    { path: '/smooth/refobj/:refObjId/collection/:collId', component: Smooth, props: true },
    {
      path: '/smooth/demo/:currTourStep?',
      component: Smooth,
      props: (route) => ({
        isTour: true,
        currTourStep: parseInt(route.params.currTourStep) || 0
      })
    },
    { path: '*', component: NotFound }
  ]
})
