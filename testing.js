const admin = require('firebase-admin')
// admin.initializeApp()

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://wuash-dev.firebaseio.com'
  });

const db = admin.firestore()

let doc = db.collection('testers').doc('test1')

let observer = doc.onSnapshot(docSnapshot => {
  console.log(`Received doc snapshot: ${docSnapshot}`)
  console.log(docSnapshot.data())
  // ...
}, err => {
  console.log(`Encountered error: ${err}`)
})