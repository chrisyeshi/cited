import _ from 'lodash'
import { mapState } from 'vuex'
import getVisCardSideColor from './getviscardsidecolor.js'

export default {
  computed: {
    ...mapState('parseVis', [ 'currCollId', 'currColl', 'currVisGraph' ]),
    collReferenceColor () {
      const nInCollReferences =
        _.size(this.currVisGraph.getInGraphReferenceIds(this.mixArtHash))
      return getVisCardSideColor(nInCollReferences)
    },
    collCitedByColor () {
      const nInCollCitedBys =
        _.size(this.currVisGraph.getInGraphCitedByIds(this.mixArtHash))
      return getVisCardSideColor(nInCollCitedBys)
    },
    firstAuthorSurname () {
      return _.property('firstAuthor.surname')(this.mixArt) ||
        _.property('authors[0].surname')(this.mixArt)
    },
    label () {
      return `${this.firstAuthorSurname} ${this.year}`
    },
    mixArt () {
      return this.art
    },
    mixArtHash () {
      return this.mixArt.artHash
    },
    mixColl () {
      return this.currColl
    },
    mixVisGraph () {
      return this.currVisGraph
    },
    nCitedBy () {
      return _.property('nCitedBys')(this.mixArt) ||
        _.property('nCitedBy')(this.mixArt)
    },
    nCitedBys () {
      return this.nCitedBy
    },
    nCitedByText () {
      return _.isNil(this.nCitedBy) ? null : `Cited by ${this.nCitedBy}`
    },
    title () {
      return _.property('title')(this.mixArt)
    },
    abstract () {
      return _.property('abstract')(this.mixArt)
    },
    venue () {
      return _.property('venue.name')(this.mixArt) ||
        _.property('venues[0].name')(this.mixArt)
    },
    year () {
      return _.toNumber(_.property('year')(this.mixArt))
    },
    collArts () {
      return _.property('articles')(this.mixColl)
    },
    nReferences () {
      return _.property('nReferences')(this.mixArt)
    },
    references () {
      return _.property('references.articles')(this.mixArt)
    }
  }
}
