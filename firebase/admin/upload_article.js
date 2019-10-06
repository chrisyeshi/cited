import _ from 'lodash'
import admin from 'firebase-admin'
import os from 'os'
import path from 'path'
import uploadArticle from './uploadarticle.js'

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
  const inputArt = require(filePath)
  await uploadArticle(inputArt).catch(err => console.log(err))
})()
