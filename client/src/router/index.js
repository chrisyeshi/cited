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

const Contail = () => import('@/components/Contail')
const Kanban = () => import('@/components/Kanban')
const ParseVis = () => import('@/components/ParseVis')
const Smooth = () => import('@/components/Smooth')
const UserPage = () => import('@/pages/User')

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
    { path: '/landing', component: LandingPage, meta: { requireAuth: true } },
    {
      path: '/',
      name: 'parsevis',
      component: ParseVis,
      props: (route) => ({
        inputUserId: route.query.user || route.query.userId,
        inputCollId:
          route.query.coll || route.query.collId ||
          route.query.collection || route.query.collectionId,
        inputArtId:
          route.query.art || route.query.artId ||
          route.query.article || route.query.articleId
      })
    },
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
