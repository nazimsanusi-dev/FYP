import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const rowsPerPage = 10;
let currentPage = 1;
let reports = [];
let filters = { district: null, wasteType: null, location: null, status: null, issue: null, time: 'All' };

async function fetchReports() {
    try {
        const residentsSnapshot = await getDocs(collection(db, 'residents'));
        reports = []; // Clear the reports array before fetching new data

        for (const residentDoc of residentsSnapshot.docs) {
            const reportsQuery = query(
                collection(db, 'residents', residentDoc.id, 'reports'),
                orderBy('timestamp', 'desc')
            );
            const reportsSnapshot = await getDocs(reportsQuery);

            reportsSnapshot.forEach(doc => {
                const report = doc.data();
                reports.push({
                    id_report: doc.id || "N/A",
                    id_report_short: report.id_report || "N/A",
                    id_user: report.id_user || "N/A",
                    issue: report.issue || "N/A",
                    location: report.location || `(${report.latitude}, ${report.longitude})`,
                    district: report.district || "N/A",
                    wasteType: report.wasteType || "N/A",
                    timestamp: report.timestamp.toDate().toLocaleString(),
                    status: report.status || "Pending",
                    collectiontime: report.collectionTime || "N/A",
                    weight: report.weightwaste || "-",
                });
            });
        }

        renderTable();
        renderPagination();
        populateFilters();
    } catch (error) {
        console.error("Error fetching reports:", error);
    }
}

function applyFilters() {
    const filteredReports = reports.filter(report => {
        const reportDate = new Date(report.timestamp);

        // Time-based filtering
        const now = new Date();
        let include = true;

        if (filters.time === 'Today') {
            include = reportDate.toDateString() === now.toDateString();
        } else if (filters.time === 'Yesterday') {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            include = reportDate.toDateString() === yesterday.toDateString();
        } else if (filters.time === 'Weekly') {
            const oneWeekAgo = new Date(now);
            oneWeekAgo.setDate(now.getDate() - 7);
            include = reportDate >= oneWeekAgo && reportDate <= now;
        } else if (filters.time === 'Monthly') {
            const oneMonthAgo = new Date(now);
            oneMonthAgo.setMonth(now.getMonth() - 1);
            include = reportDate >= oneMonthAgo && reportDate <= now;
        }

        return include &&
            (!filters.district || report.district === filters.district) &&
            (!filters.wasteType || report.wasteType === filters.wasteType) &&
            (!filters.location || report.location === filters.location) &&
            (!filters.status || report.status === filters.status) &&
            (!filters.issue || report.issue === filters.issue);
    });
    return filteredReports;
}


function renderTable() {
    const reportList = document.getElementById('reportList');
    reportList.innerHTML = '';

    const filteredReports = applyFilters();
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedReports = filteredReports.slice(start, end);

    paginatedReports.forEach(report => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${report.id_report_short}</td>
            <td>${report.id_user}</td>
            <td>${report.issue}</td>
            <td>${report.location}</td>
            <td>${report.district}</td>
            <td>${report.wasteType}</td>
            <td>${report.timestamp}</td>
            <td>${report.status}</td>
            <td>${report.collectiontime}</td>
            <td>${report.weight}</td>
            <td>
                <button onclick="showDetails('${report.id_report}')">Details</button>
            </td>
        `;
        reportList.appendChild(row);
    });
}

window.closeModal = function () {
    const modal = document.getElementById('detailsModal');
    modal.style.display = 'none';
};


window.showDetails = async function (id_report) {
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = '<p>Loading...</p>'; // Show loading message

    try {
        const residentsSnapshot = await getDocs(collection(db, 'residents'));
        for (const residentDoc of residentsSnapshot.docs) {
            const reportsQuery = collection(db, 'residents', residentDoc.id, 'reports');
            const reportsSnapshot = await getDocs(reportsQuery);

            reportsSnapshot.forEach(doc => {
                if (doc.id === id_report) {
                    const report = doc.data();

                    const formatDate = (dateString) => {
                        const dateOptions = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true };
                        return new Intl.DateTimeFormat('en-US', dateOptions).format(new Date(dateString));
                    };

                    // Populate the modal with the report details and slider
                    modalContent.innerHTML = `
                        <div class="slider">
                        ${
                            report.imageUrl || report.picafterpickup
                                ? `
                                    <div class="slide">
                                        ${report.imageUrl ? `<img src="${report.imageUrl}" alt="Before Pickup" />` : ''}
                                        ${report.picafterpickup ? `<img src="${report.picafterpickup}" alt="After Pickup" />` : ''}
                                    </div>
                                `
                                : `
                                    <div class="no-update">No Update Yet</div>
                                `
                        }
                        </div>

                        <div class="description">
                            <p class="section-title">Description</p>
                            ${report.description || "No description available."}
                        </div>
                        <div class="modal-grid">
                            <div class="section">
                                <p class="section-title">Report Details</p>
                                <p><strong>ID Report:</strong> ${id_report.substring(0, 5)}</p>
                                <p><strong>ID User:</strong> ${report.id_user}</p>
                                <p><strong>Issue:</strong> ${report.issue}</p>
                                <p><strong>Status:</strong> ${report.status}</p>
                            </div>
                            <div class="section">
                                <p class="section-title">Information</p>
                                <p><strong>Location:</strong> ${report.location}</p>
                                <p><strong>District:</strong> ${report.district}</p>
                                <p><strong>Reported on :</strong> ${report.timestamp.toDate().toLocaleString()}</p>
                                <p><strong>Collect on :</strong> ${report.date_collection ? formatDate(report.date_collection) : "None"}</p>
                            </div>
                            <div class="section">
                                <p class="section-title">Waste Details</p>
                                <p><strong>Waste Type:</strong> ${report.wasteType}</p>
                                <p><strong>Weight:</strong> ${report.weightwaste || "Not provided"}</p>
                            </div>
                        </div>
                    `;

                    initializeSlider(); // Initialize slider functionality
                }
            });
        }
    } catch (error) {
        modalContent.innerHTML = '<p>Error loading details.</p>';
        console.error("Error fetching details:", error);
    }

    const modal = document.getElementById('detailsModal');
    modal.style.display = 'block';
};

function initializeSlider() {
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    updateSlider(slides, currentSlide);
}

function updateSlider(slides, currentSlide) {
    slides.forEach((slide, index) => {
        slide.style.transform = `translateX(${(index - currentSlide) * 100}%)`;
    });
}





function renderPagination() {
    const container = document.querySelector('.container');
    let pagination = document.querySelector('.pagination');

    if (pagination) pagination.remove();

    pagination = document.createElement('div');
    pagination.className = 'pagination';

    const filteredReports = applyFilters();
    const totalPages = Math.ceil(filteredReports.length / rowsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageLink = document.createElement('a');
        pageLink.innerText = i;
        pageLink.href = '#';
        pageLink.className = i === currentPage ? 'active' : '';

        pageLink.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            renderTable();
            renderPagination();
        });

        pagination.appendChild(pageLink);
    }

    container.appendChild(pagination);
}

function populateFilters() {
    const districtFilter = document.getElementById('districtFilter');
    const wasteTypeFilter = document.getElementById('wasteTypeFilter');
    const locationFilter = document.getElementById('locationFilter');
    const statusFilter = document.getElementById('statusFilter');
    const issueFilter = document.getElementById('issueFilter');

    districtFilter.addEventListener('change', (e) => {
        filters.district = e.target.value || null;
        currentPage = 1;
        renderTable();
        renderPagination();
    });

    wasteTypeFilter.addEventListener('change', (e) => {
        filters.wasteType = e.target.value || null;
        currentPage = 1;
        renderTable();
        renderPagination();
    });

    locationFilter.addEventListener('change', (e) => {
        filters.location = e.target.value || null;
        currentPage = 1;
        renderTable();
        renderPagination();
    });

    statusFilter.addEventListener('change', (e) => {
        filters.status = e.target.value || null;
        currentPage = 1;
        renderTable();
        renderPagination();
    });

    issueFilter.addEventListener('change', (e) => {
        filters.issue = e.target.value || null;
        currentPage = 1;
        renderTable();
        renderPagination();
    });

    const timeFilter = document.getElementById('timeFilter');
    timeFilter.addEventListener('change', (e) => {
        filters.time = e.target.value;
        currentPage = 1;
        renderTable();
        renderPagination();
    });

}

fetchReports();
