import Vue from 'vue'
import Router from 'vue-router'

const NotFound = () => import('@/views/NotFound')
const PvCollectionView = () => import('@/views/PvCollectionView')
const PvDrawerArticleView = () => import('@/views/PvDrawerArticleView')
const PvDrawerCollectionView = () => import('@/views/PvDrawerCollectionView')
const PvDrawerCollectionList = () => import('@/views/PvDrawerCollectionList')
const PvDrawerRelativeList = () => import('@/views/PvDrawerRelativeList')
const PvHomeView = () => import('@/views/PvHomeView')

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
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
          component: PvDrawerRelativeList,
          props: true
        }
      ]
    },
    // { path: '/art/:artId', component: PvArtView },
    { path: '*', component: NotFound }
  ]
})
