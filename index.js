const gf = require('geofire')
const admin = require('firebase-admin')

const serviceAccountWuash = require("D:/Wuash/keys/wuash-dev-firebase-adminsdk-z4sqd-5c45f408d9.json")
const serviceAccountWuashers = require("D:/Wuash/keys/wuashers-dev-firebase-adminsdk-62ycn-de896c66c9.json")

const wuashApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccountWuash),
  databaseURL: "https://wuash-dev.firebaseio.com"
});

const wuashersApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccountWuashers),
    databaseURL: "https://wuashers-dev.firebaseio.com"
}, 'wuashers')

const orderStatuses = {
    FINDING: 'FINDING',
    ACCEPTED: 'ACCEPTED',
    STARTED: 'STARTED',
    CANCELLED: 'CANCELLED'
}

const wuasherStatuses = {
    OFFLINE: null,
    ONLINE: 1,
    IN_SERVICE: 2,
    RESPONDING: 3,
}

let searchingOrders = wuashApp.firestore()
    .collectionGroup('orders')
    .where('status', '==', orderStatuses.FINDING)

let availableWuashersRef = wuashersApp.database().ref('/available_wuashers')
let geoFire = new gf.GeoFire(availableWuashersRef)

let wuasherStatusRef = wuashersApp.database().ref('/wuasher_statuses')

/**
 * Time in milliseconds that the Wuashers Geoquery listener will run for
 * @type {number}
 */
const wuasherTrackerTime = 10000

console.log("Server has been started!")
console.log("listening for collection group orders with status FINDING...")
console.log("")

searchingOrders.onSnapshot(orderSnap => {
    orderSnap.docChanges().forEach(docSnap => {
        if (docSnap.type === 'added') {
            // matchOrderWithWuasher(docSnap.doc.data())
            const orderInfo = docSnap.doc.data()

            let geoQuery = geoFire.query({
                center: [orderInfo.address.lat, orderInfo.address.lng],
                radius: 300
            })

            const wuashersQueueArray = []
            let isTrackerListening = true

            const onWuasherAvailable = geoQuery.on("key_entered", (wuasherUID, location, distance) => {
                wuasherStatusRef.child(wuasherUID).once('value', snap => {
                    const wuasherStatus = snap.val()

                    switch(wuasherStatus) {
                        case wuasherStatuses.ONLINE:
                            wuashersQueueArray.push(wuasherUID)
                            break
                        case wuasherStatuses.RESPONDING:
                        case wuasherStatuses.OFFLINE:
                        case wuasherStatuses.IN_SERVICE:
                            console.log("WUASHER IN SERVICE OR OFFLINE") // todo: remove
                    }
                })
            })

            //TODO: Multiple recursive check every 10-20 seconds instead of 1 check of 40 sec, until stop 3rd time?

            setTimeout(() => {
                onWuasherAvailable.cancel()
                isTrackerListening = false

                _startRequestingWuashers(wuashersQueueArray)
            }, wuasherTrackerTime)
        }
    })
}, err => {
    console.log(`Oh no! ${err}`)
})


function _startRequestingWuashers(wuashersQueueArray) {
    console.log("Ask:")
    wuashersQueueArray.forEach((wuasherUID) => console.log("- " + wuasherUID))
}



// console.log(key + " entered query at " + location + " (" + distance + " km from center)");
//
// requestsRef.child(key).child('s').once('value', snap => {
//     const wuasherStatus = snap.val()
//
//     if (wuasherStatus === wuasherStatuses.OFFLINE || wuasherStatus === wuasherStatuses.IN_SERVICE) {
//         const response = requestWuasher()
//
//         if (response) {
//             //todo: set wuasher status IN_SERVICE (1)
//         }
//     }
// })