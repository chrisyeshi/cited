import _ from 'lodash'
import getSampleCollection from './getsamplecollection.js'
import getVisCardSideColor from './getviscardsidecolor.js'

export default {
  computed: {
    collReferenceColor () {
      const isInColl = (coll, artId) => {
        return _.find(_.property('articles')(coll), art => art.artId === artId)
      }
      const nInCollReferences =
        _.sumBy(
          this.references, art => isInColl(this.mixColl, art.artId) ? 1 : 0)
      return getVisCardSideColor(nInCollReferences)
    },
    collCitedByColor () {
      const nInCollCitedBys = _.sumBy(this.collArts, collArt => {
        const isReferencingThisArt =
          _.find(
            collArt.references.articles, refArt => refArt.artId === this.artId)
        return isReferencingThisArt ? 1 : 0
      })
      return getVisCardSideColor(nInCollCitedBys)
    },
    firstAuthorSurname () {
      return _.property('authors[0].surname')(this.mixArt)
    },
    label () {
      return `${this.firstAuthorSurname} ${this.year}`
    },
    nCitedBys () {
      return _.property('nCitedBys')(this.mixArt)
    },
    nCitedByText () {
      return `Cited by ${_.property('nCitedBys')(this.mixArt)}`
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
  },
  asyncComputed: {
    async mixArt () {
      if (this.userId === 'sample') {
        const coll = await getSampleCollection(this.collId)
        const art = {
          ..._.find(coll.articles, art => art.artId === this.artId),
          references: { articles: [] }
        }
        _.forEach(coll.relations, relation => {
          if (relation.citedById === art.artId) {
            art.references.articles.push({
              artId: relation.referenceId
            })
          }
        })
        return art
      }
      throw new Error(
        'no backend at the moment in pvarticleinfomixin.js:mixArt')
    },
    async mixColl () {
      if (this.userId === 'sample') {
        const coll = await getSampleCollection(this.collId)
        const arts = _.map(coll.articles, art => ({
          ...art,
          references: { articles: [] }
        }))
        const artsMap =
          Object.assign({}, ..._.map(arts, art => ({ [art.artId]: art })))
        _.forEach(coll.relations, relation => {
          artsMap[relation.citedById].references.articles.push({
            artId: relation.referenceId
          })
        })
        return { articles: arts }
      }
      throw new Error('no backend yet at pvarticleinfomixin.js:mixColl')
    }
  }
}
