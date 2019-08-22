const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const _ = require('lodash');

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
    description: _.toString(after.description).slice(0, 280),
    nArticle: _.size(after.articles),
    nEditor: _.size(after.editors),
    owner: after.owner
  })
})
