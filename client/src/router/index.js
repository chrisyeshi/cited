import Vue from 'vue'
import Vuetify from 'vuetify'
import Router from 'vue-router'
import LandingPage from '@/components/LandingPage'
import NotFound from '@/components/NotFound'
import Resource from 'vue-resource'
import 'vuetify/dist/vuetify.min.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import { onUserSignIn } from '@/Firebase/auth'
import UserAuth from '@/components/UserAuth'
import PvHomeView from '@/components/PvHomeView.vue'

const Contail = () => import('@/components/Contail')
const Kanban = () => import('@/components/Kanban')
const Smooth = () => import('@/components/Smooth')
const UserPage = () => import('@/pages/User')
const PvCollectionView = () => import('@/components/PvCollectionView.vue')
const PvDrawerCollectionView =
  () => import('@/components/PvDrawerCollectionView')
const PvDrawerCollectionList =
  () => import('@/components/PvDrawerCollectionList')
const PvDrawerArticleView = () => import('@/components/PvDrawerArticleView.vue')
const PvDrawerRelativeListView =
  () => import('@/components/PvDrawerRelativeListView.vue')

Vue.use(Router)
Vue.use(Resource)
Vue.use(Vuetify)

let router = new Router({
  mode: 'history',
  base: process.env.BASE_URL || '/',
  routes: [
    { path: '/alpha', component: Smooth },
    { path: '/alpha/search/:routeSearchText', component: Smooth, props: true },
    { path: '/alpha/refobj/:refObjId', component: Smooth, props: true },
    { path: '/alpha/collection/:collId', component: Smooth, props: true },
    {
      path: '/alpha/search/:routeSearchText/collection/:collId',
      component: Smooth,
      props: true
    },
    {
      path: '/alpha/refobj/:refObjId/collection/:collId',
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
    { path: '/landing', component: LandingPage },
    { path: '/', component: PvHomeView },
    {
      path: '/coll/:collId',
      component: PvCollectionView,
      props: true,
      children: [
        { path: '', component: PvDrawerCollectionView },
        { path: 'list', component: PvDrawerCollectionList },
        { path: ':artId', component: PvDrawerArticleView },
        {
          path: ':artId/:relationProp',
          component: PvDrawerRelativeListView,
          props: true
        }
      ]
    },
    // { path: '/art/:artId', component: PvArtView },
    {
      path: '/auth/:action',
      name: 'UserAuth',
      component: UserAuth
    },
    {
      path: '/user',
      name: 'UserPage',
      component: UserPage,
      meta: {
        requireAuth: true
      }
    },
    { path: '*', component: NotFound }
  ]
})

router.beforeEach((to, from, next) => {
  const requireAuth = to.matched.some(path => path.meta.requireAuth)
  onUserSignIn(user => {
    if (!user && requireAuth) {
      next('/auth/signin?redirect=' + to.path)
    } else {
      next()
    }
  })
})

export default router
