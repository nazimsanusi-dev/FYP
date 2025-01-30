let reports = [];
let currentPage = 1;
const rowsPerPage = 5;

async function fetchReports() {
    const querySnapshot = await getDocs(collection(db, 'reports'));
    reports = [];
    querySnapshot.forEach(doc => {
        const report = doc.data();
        if (report.status === "Pending") {
            reports.push({
                id: doc.id,
                issue: report.issue,
                location: `(${report.latitude}, ${report.longitude})`,
                status: report.status
            });
        }
    });
    renderTable();
    renderPagination();
}

function renderTable() {
    const reportList = document.getElementById('reportList');
    reportList.innerHTML = '';

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedReports = reports.slice(start, end);

    paginatedReports.forEach(report => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${report.id}</td>
            <td>${report.issue}</td>
            <td>${report.location}</td>
            <td>${report.status}</td>
        `;
        reportList.appendChild(row);
    });
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    const totalPages = Math.ceil(reports.length / rowsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageLink = document.createElement('a');
        pageLink.href = '#';
        pageLink.innerText = i;
        pageLink.className = i === currentPage ? 'active' : '';
        pageLink.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            renderTable();
            renderPagination();
        });
        pagination.appendChild(pageLink);
    }
}

// Fetch reports on page load
fetchReports();
