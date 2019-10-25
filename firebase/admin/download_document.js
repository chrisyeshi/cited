import admin from 'firebase-admin'
import fs from 'fs'
import os from 'os'
import path from 'path'

(async function () {
  const certPath =
    path.join(
      os.homedir(),
      '.firebase/cited-3891b-firebase-adminsdk-2g6hu-bf4cf11e29.json')
  admin.initializeApp({
    credential: admin.credential.cert(certPath)
  })
  const docPath = process.argv[2]

  const snap = await admin.firestore().doc(docPath).get()
  fs.writeFileSync(`${snap.id}.json`, JSON.stringify(snap.data(), null, 2))
})()