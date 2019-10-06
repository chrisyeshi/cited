import _ from 'lodash'
import admin from 'firebase-admin'
import os from 'os'
import path from 'path'
import { convertArticle } from './uploadarticle.js'

(async function () {
  const certPath =
    path.join(
      os.homedir(),
      '.firebase/cited-3891b-firebase-adminsdk-2g6hu-bf4cf11e29.json')
  admin.initializeApp({
    credential: admin.credential.cert(certPath)
  })
  const db = admin.firestore()

  const filePath = path.normalize(process.argv[2])
  const inputArts = require(filePath)

  const batch = db.batch()
  _.forEach(inputArts, inputArt => {
    const artHash = inputArt.artHash
    const ref = db.doc(`articles/${artHash}`)
    batch.set(ref, convertArticle(inputArt))
  })
  await batch.commit().catch(err => console.error(err))
})()
