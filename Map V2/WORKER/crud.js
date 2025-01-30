// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, updateDoc, doc } 
    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// References
const employeeForm = document.getElementById("employee-form");
const employeeTable = document.getElementById("employee-table");
const employeeCollection = collection(db, "employee");
const submitButton = document.querySelector("#employee-form button[type='submit']");

// State to store current updating ID
let updatingId = null;

// Fetch Employees
async function fetchEmployees() {
    employeeTable.innerHTML = "";
    const snapshot = await getDocs(employeeCollection);

      // Collect and sort employees alphabetically by 'name'
      const employees = [];
      snapshot.forEach(doc => {
          employees.push({ id: doc.id, ...doc.data() });
      });
  
      employees.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    let sNo = 1;
    snapshot.forEach(doc => {
        const employee = doc.data();
        const row = `
            <tr>
                <td>${sNo++}</td>
                <td>${employee.name}</td>
                <td>${employee.id}</td>
                <td>${employee.phone}</td>
                <td>${employee.workingStatus}</td>
                <td>${employee.department}</td>
                <td>${employee.address}</td>
                <td>
                    <button onclick="deleteEmployee('${doc.id}')">Delete</button>
                    <button onclick="editEmployee('${doc.id}', '${employee.name}', '${employee.id}', '${employee.phone}', '${employee.workingStatus}', '${employee.department}', '${employee.address}')">Update</button>
                </td>
            </tr>
        `;
        employeeTable.insertAdjacentHTML("beforeend", row);
    });
}

// Add or Update Employee
employeeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const employeeData = {
        name: document.getElementById("name").value,
        id: document.getElementById("id").value,
        phone: document.getElementById("phone").value,
        workingStatus: document.getElementById("working-status").value,
        department: document.getElementById("department").value,
        address: document.getElementById("address").value
    };

    if (updatingId) {
        // Update existing employee
        const employeeRef = doc(db, "employee", updatingId);
        await updateDoc(employeeRef, employeeData);
        updatingId = null; // Reset updating state
        submitButton.textContent = "Add Employee"; // Change button text back
    } else {
        // Add new employee
        await addDoc(employeeCollection, employeeData);
    }

    employeeForm.reset();
    fetchEmployees();
});

// Delete Employee
window.deleteEmployee = async (id) => {
    await deleteDoc(doc(db, "employee", id));
    fetchEmployees();
};

// Edit Employee (Pre-fill form for update)
window.editEmployee = (id, name, empId, phone, workingStatus, department, address) => {
    document.getElementById("name").value = name;
    document.getElementById("id").value = empId;
    document.getElementById("phone").value = phone;
    document.getElementById("working-status").value = workingStatus;
    document.getElementById("department").value = department;
    document.getElementById("address").value = address;

    updatingId = id; // Set the ID of the document being updated
    submitButton.textContent = "Update Employee"; // Change button text to "Update Employee"
};

// Initial Fetch
fetchEmployees();
