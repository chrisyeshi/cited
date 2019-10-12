const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const _ = require('lodash');
const convertArticle = require('./convertarticle')
const createCollection = require('./createCollection')
const semanticScholar = require('./semanticscholar')

exports.createUserDoc = functions.auth.user().onCreate(async user => {
  return admin.firestore().collection('users').doc(user.uid).set({
    claims: {}
  });
});

exports.deleteUserDoc = functions.auth.user().onDelete(async user => {
  const snapshot = await admin.firestore().doc(`users/${user.uid}`).get();
  const userDoc = snapshot.data();
  return admin.firestore().collection('users').doc(user.uid).delete();
});

exports.onUserDocUpdate =
  functions.firestore.document('users/{userId}').onUpdate(
    (change, context) => {
  const after = change.after.data();
  const before = change.before.data();
  if (_.isEqual(after.claims, before.claims)) {
    return change;
  }
  return admin.auth().setCustomUserClaims(
    context.params.userId, after.claims);
});

exports.onCollectionDocWrite =
  functions.firestore.document('collections/{collId}').onWrite(
    async (change, context) => {
  if (!change.after.exists) {
    // delete event
    return admin.firestore().doc(`collMetas/${context.params.collId}`).delete()
  }
  // create or update event
  const after = change.after.data();
  return admin.firestore().doc(`collMetas/${context.params.collId}`).set({
    title: after.title,
    description: _.truncate(after.description, { length: 280 }),
    nArticle: _.size(after.articles),
    nEditor: _.size(after.editors),
    owner: after.owner
  })
})

exports.onArticleDocWrite =
  functions.firestore.document('articles/{artHash}').onWrite(
    async (change, context) => {
  if (!change.after.exists) {
    //delete event
    return admin.firestore().doc(`artMetas/${context.params.artHash}`).delete()
  }
  // create or update event
  const after = change.after.data()
  return admin.firestore().doc(`artMetas/${context.params.artHash}`).set({
    title: after.title,
    abstract: _.truncate(after.abstract, { length: 280 }),
    firstAuthor: _.first(after.authors),
    year: after.year,
    venue: after.venue,
    nReference: after.nReference || after.nReferences,
    nCitedBy: after.nCitedBy || after.nCitedBys
  })
})

exports.fetchSemanticScholar = functions.https.onCall(async (ssId, context) => {
  const ssData = await semanticScholar.query({ semanticScholar: ssId })
  const ssArt = semanticScholar.from(ssArt)
  const ssReferences =
      await Promise.all(_.map(ssArt.references, async reference => {
    return semanticScholar.from(semanticScholar.query(reference.externs))
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
