import Vue from 'vue'
import Router from 'vue-router'

const NotFound = () => import('@/views/NotFound')
const LandingPage = () => import('@/views/LandingPage')
const PvCollectionView = () => import('@/views/PvCollectionView')
const PvDrawerArticleView = () => import('@/views/PvDrawerArticleView')
const PvDrawerCollectionView = () => import('@/views/PvDrawerCollectionView')
const PvDrawerCollectionList = () => import('@/views/PvDrawerCollectionList')
const PvDrawerRelativeList = () => import('@/views/PvDrawerRelativeList')
const PvHomeView = () => import('@/views/PvHomeView')
const SaCollectionView = () => import('@/views/SaCollectionView')
const SaSearchView = () => import('@/views/SaSearchView')

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    { path: '/', component: PvHomeView },
    { path: '/landing', component: LandingPage },
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
          component: PvDrawerRelativeList,
          props: true
        }
      ]
    },
    // { path: '/art/:artId', component: PvArtView },
    { path: '/sa', component: SaSearchView },
    { path: '/sa/ss/:ssId', component: SaCollectionView, props: true },
    { path: '*', component: NotFound }
  ]
})
