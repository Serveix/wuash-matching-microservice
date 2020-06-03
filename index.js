const admin = require('firebase-admin')
var serviceAccount = require("D:/Wuash/keys/wuash-dev-firebase-adminsdk-z4sqd-5c45f408d9.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://wuash-dev.firebaseio.com"
});


let searchingOrders = admin.firestore().collectionGroup('orders').where('status', '==', 'SEARCHING')

searchingOrders.onSnapshot(orderSnap => {
    console.log(orderSnap)
}, err => {
    console.log(`Oh mierda no: ${err}`)
})