import _ from 'lodash'
import querySemanticScholar, { fromSemanticScholar } from
  '../../../academic_apis/semanticscholar'
import convertArticle from '../../../academic_apis/convertarticle'
import createCollection from '../../../academic_apis/createcollection'
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
admin.initializeApp()

export const createUserDoc = functions.auth.user().onCreate(async user => {
  return admin.firestore().collection('users').doc(user.uid).set({
    claims: {}
  })
})

export const deleteUserDoc = functions.auth.user().onDelete(async user => {
  const snapshot = await admin.firestore().doc(`users/${user.uid}`).get()
  const userDoc = snapshot.data()
  return admin.firestore().collection('users').doc(user.uid).delete()
})

export const onUserDocUpdate =
  functions.firestore.document('users/{userId}').onUpdate(
    (change, context) => {
  const after = change.after.data()
  const before = change.before.data()
  if (_.isEqual(after.claims, before.claims)) {
    return change
  }
  return admin.auth().setCustomUserClaims(
    context.params.userId, after.claims)
})

export const onCollectionDocWrite =
  functions.firestore.document('collections/{collId}').onWrite(
    async (change, context) => {
  if (!change.after.exists) {
    // delete event
    return admin.firestore().doc(`collMetas/${context.params.collId}`).delete()
  }
  // create or update event
  const after = change.after.data();
  return admin.firestore().doc(`collMetas/${context.params.collId}`).set(
    _.pickBy({
      title: after.title,
      description: _.truncate(after.description, { length: 280 }),
      nArticle: _.size(after.articles),
      nEditor: _.size(after.editors),
      owner: after.owner
    }))
})

export const onArticleDocWrite =
    functions.firestore.document('articles/{artHash}').onWrite(
      async (change, context) => {
  if (!change.after.exists) {
    //delete event
    return admin.firestore().doc(`artMetas/${context.params.artHash}`).delete()
  }
  // create or update event
  const after = change.after.data()
  return admin.firestore().doc(`artMetas/${context.params.artHash}`).set(
    _.pickBy({
      title: after.title,
      abstract: _.truncate(after.abstract, { length: 280 }),
      firstAuthor: _.first(after.authors),
      year: after.year,
      venue: after.venue,
      nReference: after.nReference || after.nReferences,
      nCitedBy: after.nCitedBy || after.nCitedBys
    }))
})

export const fetchArtBySsId = functions.https.onCall(async (ssId, context) => {
  const artQuery =
    admin.firestore().collection('articles')
      .where('externs.semanticScholar', '==', ssId)
  const artQuerySnap = await artQuery.get()
  if (!artQuerySnap.empty) {
    return {
      art: { ...artQuerySnap.docs[0].data(), artHash: artQuerySnap.docs[0].id }
    }
  }
  // article not in DB
  const ssData = await querySemanticScholar({ semanticScholar: ssId })
  const ssArt = fromSemanticScholar(ssData)
  const art = convertArticle(ssArt)
  // upload to DB
  await admin.firestore().doc(`articles/${art.artHash}`).set(
    _.omit(art, [ 'artHash' ]))
  return { art, ssArt }
})

export const fetchArtRefColl =
    functions.https.onCall(async (artHash, context) => {
  // check whether it already exists
  const collSnap = await admin.firestore().doc(`collections/${artHash}`).get()
  if (collSnap.exists) {
    return collSnap.data()
  }
  // create from references
  const theArtSnap = await admin.firestore().doc(`articles/${artHash}`).get()
  if (!theArtSnap.exists) {
    throw new Error(`article ${artHash} does not exist!`)
  }
  const theArt = { ...theArtSnap.data(), artHash: theArtSnap.id }
  const refArts =
    await Promise.all(_.map(theArt.referenceArtHashes, async artHash => {
      const refArtSnap =
        await admin.firestore().doc(`articles/${artHash}`).get()
      return refArtSnap.exists
        ? { ...refArtSnap.data(), artHash: refArtSnap.id }
        : null
    }))
  const coll = createCollection(refArts)
  // upload to database
  await admin.firestore().doc(`collections/${artHash}`).set(coll)
  return coll
})

export const fetchSemanticScholar =
    functions.https.onCall(async (ssId, context) => {
  const ssData = await querySemanticScholar({ semanticScholar: ssId })
  const ssArt = fromSemanticScholar(ssData)
  const ssReferences =
      await Promise.all(_.map(ssArt.references, async reference => {
    return fromSemanticScholar(await querySemanticScholar(reference.externs))
  }))
  const theArt = convertArticle(ssArt)
  const refArts = _.map(ssReferences, convertArticle)
  const coll = createCollection(refArts)

  const batch = admin.firestore().batch()
  _.forEach([ theArt, ...refArts ], art => {
    const artRef = admin.firestore().doc(`articles/${art.artHash}`)
    batch.set(artRef, art)
  })
  const collRef = admin.firestore().doc(`collections/${theArt.artHash}`)
  batch.set(collRef, coll)
  await batch.commit()

  return {
    article: theArt,
    collection: coll
  }
})
