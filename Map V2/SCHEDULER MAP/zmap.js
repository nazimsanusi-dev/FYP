import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
import "https://cdnjs.cloudflare.com/ajax/libs/leaflet-routing-machine/3.2.12/leaflet-routing-machine.min.js";
import {} from "https://cdnjs.cloudflare.com/ajax/libs/Turf.js/6.5.0/turf.min.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAqed2tCPX8SYXtTaMshQXHAmIzCtZ8Ikc",
    authDomain: "test-1-80c35.firebaseapp.com",
    projectId: "test-1-80c35",
    storageBucket: "test-1-80c35.appspot.com",
    messagingSenderId: "1067797969930",
    appId: "1:1067797969930:web:9ff80274b705da378d73f3",
    measurementId: "G-HM17GE0TJV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize the map
const map = L.map('map').setView([6.475468538753925, 100.26456455992034], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Global variables
let markers = [];
let waypoints = [];
let control = null;
const startPoint = [6.475468538753925, 100.26456455992034];

// Add Start Point icon
const startMarker = L.marker(startPoint, {
    icon: L.icon({
        iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    })
}).addTo(map).bindPopup("Start Point");

// Load GeoJSON files
let kangarBoundary, arauBoundary, padangBesarBoundary;

fetch('kangar.geojson')
    .then(res => res.json())
    .then(data => {
        kangarBoundary = data.features[0].geometry;
        L.geoJSON(data, { style: { color: 'red', weight: 2 } }).addTo(map);
    });

fetch('arau.geojson')
    .then(res => res.json())
    .then(data => {
        arauBoundary = data.features[0].geometry;
        L.geoJSON(data, { style: { color: 'blue', weight: 2 } }).addTo(map);
    });

fetch('pb.geojson')
    .then(res => res.json())
    .then(data => {
        padangBesarBoundary = data.features[0].geometry;
        L.geoJSON(data, { style: { color: 'green', weight: 2 } }).addTo(map);
    });

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

// Fetch and display pending reports based on the selected filter
async function fetchReports(filter = "All") {
    try {
        const residentsSnapshot = await getDocs(collection(db, 'residents')); // Fetch 'residents' collection
        const reportList = document.getElementById('reportList');
        reportList.innerHTML = ''; // Clear previous reports

        markers.forEach(marker => map.removeLayer(marker)); // Clear map markers
        markers = [];
        waypoints = [L.latLng(...startPoint)];

        const reports = [];

        // Iterate through each resident document to access 'reports' subcollection
        for (const residentDoc of residentsSnapshot.docs) {
            const reportsSnapshot = await getDocs(collection(db, 'residents', residentDoc.id, 'reports')); // Fetch 'reports' subcollection

            reportsSnapshot.forEach(doc => {
                const report = doc.data();
                if (report.status === "Pending" && 
                    typeof report.latitude === "number" && 
                    typeof report.longitude === "number") { // Ensure valid coordinates
                    report.id = report.id_report;
                    report.timestamp = report.timestamp || Date.now();
                    report.district = determineArea(report.latitude, report.longitude); // Determine district
                    reports.push(report); // Collect the report
                } else {
                    console.warn(`Skipping report ${doc.id} due to invalid coordinates.`);
                }
            });
            
        }

        // Sort reports by timestamp (latest first)
        reports.sort((a, b) => b.timestamp - a.timestamp);

        // Apply district filter if selected
        const filteredReports = filter === "All"
            ? reports
            : reports.filter(report => report.district === filter);

        // Display filtered reports on the map and in the list
        filteredReports.forEach(report => {
            const marker = L.marker([report.latitude, report.longitude]).addTo(map);
            marker.bindPopup(` ${report.wasteType} - ${report.issue} `);
            markers.push(marker);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${report.id}</td>
                <td>${report.issue}</td>
                <td>${report.location}</td>
                <td>${report.district}</td>
                <td>${report.status}</td>
                
            `;
            reportList.appendChild(row);

            waypoints.push(L.latLng(report.latitude, report.longitude)); // Add to waypoints
        });

        return filteredReports;
    } catch (error) {
        console.error("Error fetching reports:", error);
    }
}

// Optimize route
function optimizeRoute(start, reports) {
    const result = [];
    let current = { latitude: start[0], longitude: start[1] };
    const remaining = [...reports];

    while (remaining.length > 0) {
        let nearest = null;
        let shortestDistance = Infinity;

        for (const report of remaining) {
            const distance = calculateDistance(current, {
                latitude: report.latitude,
                longitude: report.longitude
            });

            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearest = report;
            }
        }

        result.push(nearest);
        current = { latitude: nearest.latitude, longitude: nearest.longitude };
        remaining.splice(remaining.indexOf(nearest), 1);
    }

    return result;
}

// Calculate distance
function calculateDistance(point1, point2) {
    const R = 6371;
    const dLat = (point2.latitude - point1.latitude) * (Math.PI / 180);
    const dLon = (point2.longitude - point1.longitude) * (Math.PI / 180);
    const lat1 = point1.latitude * (Math.PI / 180);
    const lat2 = point2.latitude * (Math.PI / 180);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Show route
async function showRoute() {
    const filter = document.getElementById('filterReports').value;

    if (filter === "All") {
        alert("Please select a specific district to generate a route.");
        return;
    }

    const reports = await fetchReports(filter);

    if (reports.length === 0) {
        alert(`No pending reports found for ${filter}.`);
        return;
    }

    if (control) map.removeControl(control);

    // Optimize reports by distance
    const optimizedReports = optimizeRoute(startPoint, reports);

    // Clear existing waypoints and markers
    waypoints = [L.latLng(...startPoint)];
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Add markers for optimized reports and build waypoints
    optimizedReports.forEach(report => {
        const marker = L.marker([report.latitude, report.longitude]).addTo(map);
        marker.bindPopup(` ${report.wasteType} - ${report.issue} `);
        markers.push(marker);
        waypoints.push(L.latLng(report.latitude, report.longitude));
    });

    // Close the loop by returning to the start point
    waypoints.push(L.latLng(...startPoint));

    // Add the route to the map
    control = L.Routing.control({
        waypoints: waypoints,
        routeWhileDragging: true
    }).addTo(map);

    // Update schedule table
    updateSchedule(optimizedReports);
}

// Update schedule based on optimized route
function updateSchedule(reports) {
    const scheduleTable = document.getElementById('reportList');
    scheduleTable.innerHTML = ''; // Clear the table

    reports.forEach((report, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${report.issue}</td>
            <td>${report.location}</td>
            <td>${report.district}</td>
            <td>${report.status}</td>
        `;
        scheduleTable.appendChild(row);
    });
}

// Event listener for Show Route button
document.getElementById('showRoute').addEventListener('click', showRoute);

// Clear route and update statuses
document.getElementById('clearRoute').addEventListener('click', async () => {
    const filter = document.getElementById('filterReports').value;
    if (filter === "All") {
        alert("Please select a specific district to clear routes and update statuses.");
        return;
    }

    if (control) map.removeControl(control);
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    waypoints = [L.latLng(...startPoint)];

    try {
        const residentsSnapshot = await getDocs(collection(db, 'residents')); // Fetch 'residents' collection

        // Iterate through each resident document
        for (const residentDoc of residentsSnapshot.docs) {
            const reportsSnapshot = await getDocs(collection(db, 'residents', residentDoc.id, 'reports')); // Fetch 'reports' subcollection

            // Update reports based on conditions
            for (const reportDoc of reportsSnapshot.docs) {
                const report = reportDoc.data();

                if (report.status === "Pending" && determineArea(report.latitude, report.longitude) === filter) {
                    const reportRef = doc(db, 'residents', residentDoc.id, 'reports', reportDoc.id);
                    await updateDoc(reportRef, { status: 'Success' });
                }
            }
        }

        document.getElementById('reportList').innerHTML = '';
        alert(`Route cleared and all pending reports for ${filter} marked as 'Success'.`);
    } catch (error) {
        console.error("Error clearing route and updating statuses:", error);
    }
});

// Event listener for dropdown changes
document.getElementById('filterReports').addEventListener('change', (event) => {
    const selectedFilter = event.target.value;
    fetchReports(selectedFilter);
});

// Initial fetch
fetchReports();
