// // Import required Firebase modules
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// // Firebase configuration
// const firebaseConfig = {
//     apiKey: "AIzaSyAqed2tCPX8SYXtTaMshQXHAmIzCtZ8Ikc",
//     authDomain: "test-1-80c35.firebaseapp.com",
//     databaseURL: "https://test-1-80c35-default-rtdb.asia-southeast1.firebasedatabase.app",
//     projectId: "test-1-80c35",
//     storageBucket: "test-1-80c35.appspot.com",
//     messagingSenderId: "1067797969930",
//     appId: "1:1067797969930:web:9ff80274b705da378d73f3",
//     measurementId: "G-HM17GE0TJV"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

// // Submit report to Firestore
// document.getElementById('reportForm').addEventListener('submit', async function (e) {
//     e.preventDefault();

//     const locationInput = document.getElementById('location').value.split(',');
//     const issue = document.getElementById('issue').value;

//     // Validate the input
//     if (locationInput.length !== 2) {
//         alert("Please provide a valid latitude and longitude.");
//         return;
//     }

//     const latitude = parseFloat(locationInput[0]);
//     const longitude = parseFloat(locationInput[1]);

//     if (isNaN(latitude) || isNaN(longitude)) {
//         alert("Invalid coordinates provided.");
//         return;
//     }

//     // Create the report object
//     const report = {
//         latitude,
//         longitude,
//         issue,
//         status: 'Pending',
//         timestamp: new Date()
//     };

//     try {
//         // Add the report to the Firestore collection
//         await addDoc(collection(db, 'reports'), report);
//         alert('Report submitted successfully!');
//         document.getElementById('reportForm').reset();
//     } catch (error) {
//         console.error('Error adding document: ', error);
//         alert('Error submitting report: ' + error.message);
//     }
// });

// Import required Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {} from "https://cdn.jsdelivr.net/npm/@turf/turf/turf.min.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAqed2tCPX8SYXtTaMshQXHAmIzCtZ8Ikc",
    authDomain: "test-1-80c35.firebaseapp.com",
    databaseURL: "https://test-1-80c35-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "test-1-80c35",
    storageBucket: "test-1-80c35.appspot.com",
    messagingSenderId: "1067797969930",
    appId: "1:1067797969930:web:9ff80274b705da378d73f3",
    measurementId: "G-HM17GE0TJV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Load GeoJSON files
let kangarBoundary, arauBoundary, padangBesarBoundary;

async function loadGeoJSON() {
    const kangarResponse = await fetch('kangar.geojson');
    const arauResponse = await fetch('arau.geojson');
    const padangBesarResponse = await fetch('pb.geojson');

    kangarBoundary = (await kangarResponse.json()).features[0].geometry;
    arauBoundary = (await arauResponse.json()).features[0].geometry;
    padangBesarBoundary = (await padangBesarResponse.json()).features[0].geometry;
}

// Function to determine area
function determineArea(lat, lng) {
    const point = turf.point([lng, lat]);

    if (turf.booleanPointInPolygon(point, arauBoundary)) {
        return 'Arau';
    } else if (turf.booleanPointInPolygon(point, kangarBoundary)) {
        return 'Kangar';
    } else if (turf.booleanPointInPolygon(point, padangBesarBoundary)) {
        return 'Padang Besar';
    } else {
        return 'Unknown Area';
    }
}

// Submit report to Firestore
document.getElementById('reportForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const locationInput = document.getElementById('location').value.split(',');
    const issue = document.getElementById('issue').value;

    // Validate the input
    if (locationInput.length !== 2) {
        alert("Please provide a valid latitude and longitude.");
        return;
    }

    const latitude = parseFloat(locationInput[0]);
    const longitude = parseFloat(locationInput[1]);

    if (isNaN(latitude) || isNaN(longitude)) {
        alert("Invalid coordinates provided.");
        return;
    }

    const area = determineArea(latitude, longitude);

    // Create the report object
    const report = {
        latitude,
        longitude,
        issue,
        area,
        status: 'Pending',
        timestamp: new Date()
    };

    try {
        // Add the report to the Firestore collection
        await addDoc(collection(db, 'reports'), report);
        alert('Report submitted successfully!');
        document.getElementById('reportForm').reset();
    } catch (error) {
        console.error('Error adding document: ', error);
        alert('Error submitting report: ' + error.message);
    }
});

// Load GeoJSON data on page load
loadGeoJSON();
