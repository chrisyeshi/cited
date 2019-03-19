import Vue from 'vue'
import Vuetify from 'vuetify'
import Router from 'vue-router'
import LandingPage from '@/components/LandingPage'
import NotFound from '@/components/NotFound'
import Resource from 'vue-resource'
import 'vuetify/dist/vuetify.min.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'

const Contail = () => import('@/components/Contail')
const Kanban = () => import('@/components/Kanban')
const PaperSight = () => import('@/components/PaperSight/PaperSight')
const ParseVis = () => import('@/components/ParseVis')
const Smooth = () => import('@/components/Smooth')

Vue.use(Router)
Vue.use(Resource)
Vue.use(Vuetify)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL || '/',
  routes: [
    { path: '/', component: LandingPage },
    { path: '/demo', component: Smooth },
    { path: '/demo/search/:routeSearchText', component: Smooth, props: true },
    { path: '/demo/refobj/:refObjId', component: Smooth, props: true },
    { path: '/demo/collection/:collId', component: Smooth, props: true },
    {
      path: '/demo/search/:routeSearchText/collection/:collId',
      component: Smooth,
      props: true
    },
    {
      path: '/demo/refobj/:refObjId/collection/:collId',
      component: Smooth,
      props: true
    },
    {
      path: '/tour/:currTourStep?',
      component: Smooth,
      props: (route) => ({
        isTour: true,
        currTourStep: parseInt(route.params.currTourStep) || 0
      })
    },
    { path: '/kanban', component: Kanban },
    { path: '/contail', component: Contail },
    { path: '/papersight', component: PaperSight },
    { path: '/parsevis/:input?', component: ParseVis, props: true },
    { path: '*', component: NotFound }
  ]
})
