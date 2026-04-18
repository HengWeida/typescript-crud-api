(function() {
const API_BASE = 'http://127.0.0.1:4000';
let currentUser = null;
const STORAGE_KEY = 'ipt_demo_v1';
let editingIndex = -1;

function toggleForm(pagePrefix, showForm) {
    document.getElementById(`${pagePrefix}-list-view`).style.display = showForm ? 'none' : 'block';
    document.getElementById(`${pagePrefix}-form-view`).style.display = showForm ? 'block' : 'none';
}

function handleRouting() {
    const hash = window.location.hash || '#/';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    if (hash === '#/') showPage('page-home');
    else if (hash === '#/register') showPage('page-register');
    else if (hash === '#/verify-email') showPage('page-verify-email');
    else if (hash === '#/login') showPage('page-login');
    else if (hash === '#/profile') checkAuth('page-profile', renderProfile);
    else if (hash === '#/employees') checkAdmin('page-employees', renderEmployeesTable);
    else if (hash === '#/departments') checkAdmin('page-departments', renderDepartmentsList);
    else if (hash === '#/accounts') checkAdmin('page-accounts', renderAccountsTable);
    else if (hash === '#/my-requests') checkAuth('page-my-requests', renderRequestsTable);
}

async function handleRegister(e) {
    e.preventDefault();

    const email = document.getElementById('reg-email').value;
    const userData = {
        title: "Mr./Ms.", // The TS model requires a 'title'
        firstName: document.getElementById('reg-fname').value, // Changed key
        lastName: document.getElementById('reg-lname').value,  // Changed key
        email: email,
        password: document.getElementById('reg-pass').value,
        confirmPassword: document.getElementById('reg-pass').value, // TS model requires this
        role: 'User' // TS model uses capitalized 'User'
    };

    try {
        const response = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            alert("Registration successful! Please login.");
            window.location.hash = '#/login';
        } else {
            alert("Registration failed: " + (data.message || 'Unknown error'));
        }
    } catch (err) {
        alert("Connection error: Is your TypeScript server running on port 4000?");
    }
}

function openProfileModal() {
    if (!currentUser) return;
    document.getElementById('edit-prof-fname').value = currentUser.firstName;
    document.getElementById('edit-prof-lname').value = currentUser.lastName;
    document.getElementById('edit-prof-email').value = currentUser.email;

    const profModalEl = document.getElementById('profileModal');
    const modal = new bootstrap.Modal(profModalEl);
    modal.show();
}

function handleUpdateProfile(e) {
    e.preventDefault();

    const newFname = document.getElementById('edit-prof-fname').value;
    const newLname = document.getElementById('edit-prof-lname').value;

    const userIndex = window.db.accounts.findIndex(acc => acc.email === currentUser.email);

    if (userIndex !== -1) {

        window.db.accounts[userIndex].firstName = newFname;
        window.db.accounts[userIndex].lastName = newLname;

        currentUser.firstName = newFname;
        currentUser.lastName = newLname;

        saveToStorage();

        renderProfile();
        
        const displayEl = document.getElementById('user-display');
        if (displayEl) displayEl.innerText = newFname;

        const modalEl = document.getElementById('profileModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
        
        alert("Profile updated successfully!");
    }
}

function renderEmployeesTable() {
 
    const tbody = document.querySelector('#employees-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (window.db.employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No employees found.</td></tr>';
        return;
    }

    window.db.employees.forEach((emp, index) => {
        const row = `
            <tr>
                <td>${emp.id}</td>
                <td>${emp.name}</td>
                <td>${emp.position}</td>
                <td>${emp.dept}</td>
                <td>${emp.hireDate || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editEmployee(${index})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee(${index})">Delete</button>
                </td>
            </tr>`;
        tbody.innerHTML += row;
    });
    toggleForm('emp', false);
}

function editEmployee(index) {
    editingIndex = index;
    const emp = window.db.employees[index];

    updateEmployeeDeptDropdown();

    document.getElementById('emp-id').value = emp.id;
    document.getElementById('emp-name').value = emp.name;
    document.getElementById('emp-pos').value = emp.position;
    document.getElementById('emp-hire-date').value = emp.hireDate || '';
    document.getElementById('emp-dept').value = emp.dept;
    
    toggleForm('emp', true);
}
function saveEmployee(e) {

    if (e) e.preventDefault(); 

    const empId = document.getElementById('emp-id').value;
    const empName = document.getElementById('emp-name').value;
    const empPos = document.getElementById('emp-pos').value;
    const empDept = document.getElementById('emp-dept').value;
    const empHire = document.getElementById('emp-hire-date').value;


    if (!empId || !empName || !empDept) {
        alert("Please fill in ID, Name, and Department!");
        return;
    }

    const data = {
        id: empId,
        name: empName,
        position: empPos,
        dept: empDept,
        hireDate: empHire
    };


    if (editingIndex > -1) {
        window.db.employees[editingIndex] = data;
    } else {
        window.db.employees.push(data);
    }

    editingIndex = -1;
    saveToStorage(); 
    renderEmployeesTable(); 
    toggleForm('emp', false); 
}

function deleteEmployee(index) {
    if (confirm("Are you sure you want to remove this employee?")) {
        window.db.employees.splice(index, 1);
        saveToStorage();
        renderEmployeesTable();
    }
}
function updateEmployeeDeptDropdown() {
    const deptSelect = document.getElementById('emp-dept');
    if (!deptSelect) return;
    deptSelect.innerHTML = '<option value="" disabled selected>Select a Department</option>';
    window.db.departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.name;
        option.textContent = dept.name;
        deptSelect.appendChild(option);
    });
}

function toggleForm(pagePrefix, showForm) {
    if (pagePrefix === 'emp' && showForm) {
        updateEmployeeDeptDropdown();
    }
    document.getElementById(`${pagePrefix}-list-view`).style.display = showForm ? 'none' : 'block';
    document.getElementById(`${pagePrefix}-form-view`).style.display = showForm ? 'block' : 'none';
}

window.db = { accounts: [], departments: [], employees: [], requests: [] };

function getAuthHeader() {
    const token = sessionStorage.getItem('authToken');
    // If we have a token, return the Authorization header; otherwise return empty object
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function fetchUserProfile() {
    const token = sessionStorage.getItem('authToken');
    if (!token) return null;

    try {
        // Updated to the correct TypeScript endpoint
        const response = await fetch(`${API_BASE}/users/current`, { 
            method: 'GET',
            headers: getAuthHeader() 
        });

        if (response.ok) {
            return await response.json();
        } else {
            sessionStorage.removeItem('authToken');
            return null;
        }
    } catch (err) {
        return null;
    }
}

// Change to "async" so we can await the profile fetch
async function init() {
    // 1. First, try to sync the database from the server
    await loadFromStorage();

    // 2. Check if there is an authToken in session storage
    const token = sessionStorage.getItem('authToken');
    
    if (token) {
        console.log("Token found, verifying session with server...");
        // Call the helper function you added earlier
        const user = await fetchUserProfile();
        
        if (user) {
            // Server confirmed the token is valid! Restore UI.
            setAuthState(true, user);
        } else {
            // Token was invalid or expired (fetchUserProfile already cleared it)
            setAuthState(false);
        }
    } else {
        // No token, ensure UI is in "logged out" state
        setAuthState(false);
    }

    // 3. Setup routing listeners
    window.addEventListener('hashchange', handleRouting);
    
    // Default to Home if no hash exists
    if (!window.location.hash) window.location.hash = '#/';
    
    // Run the router for the current hash
    handleRouting();
}

async function renderAccountsTable() {
    const tbody = document.getElementById('accounts-table-body');
    if (!tbody) return;

    try {
        const response = await fetch(`${API_BASE}/users`, {
            headers: getAuthHeader()
        });
        const users = await response.json();

        tbody.innerHTML = '';
        users.forEach((acc, index) => {
            tbody.innerHTML += `
                <tr>
                    <td>${acc.firstName} ${acc.lastName}</td>
                    <td>${acc.email}</td>
                    <td>${acc.role}</td>
                    <td>✅</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteAccount(${acc.id})">Delete</button>
                    </td>
                </tr>`;
        });
    } catch (err) {
        console.error("Failed to load accounts from TypeScript API", err);
    }
}

function editAccount(index) {
    editingIndex = index;
    const acc = window.db.accounts[index];
    document.getElementById('acc-fname').value = acc.fname;
    document.getElementById('acc-lname').value = acc.lname;
    document.getElementById('acc-email').value = acc.email;
    document.getElementById('acc-role').value = acc.role;
    document.getElementById('acc-verified').checked = acc.verified;
    toggleForm('acc', true);
}

function deleteAccount(index) {
    if (window.db.accounts[index].email === currentUser.email) {
        return alert("You cannot delete yourself!");
    }
    if (confirm("Are you sure you want to delete this account?")) {
        window.db.accounts.splice(index, 1);
        saveToStorage();
        renderAccountsTable();
    }
}
function saveAccount(e) {
    if (e) e.preventDefault();
    
    const data = {
        fname: document.getElementById('acc-fname').value,
        lname: document.getElementById('acc-lname').value,
        email: document.getElementById('acc-email').value,
        role: document.getElementById('acc-role').value,
        verified: document.getElementById('acc-verified').checked,
        password: window.db.accounts[editingIndex].password
    };

    window.db.accounts[editingIndex] = data;
    saveToStorage();
    renderAccountsTable();
    toggleForm('acc', false);
}

function renderRequestsTable() {
    const tbody = document.getElementById('requests-table-body');
    if (!tbody) return;


    const isAdmin = currentUser.role === 'admin';
    const reqsToShow = isAdmin ? window.db.requests : window.db.requests.filter(r => r.employeeEmail === currentUser.email);

    tbody.innerHTML = reqsToShow.length ? '' : '<tr><td colspan="5" class="text-center">You have no request for now.</td></tr>';

    reqsToShow.forEach((req, index) => {
        let badgeClass = req.status === 'Approved' ? 'bg-success' : (req.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark');

        tbody.innerHTML += `
            <tr>
                <td>${req.date}</td>
                <td>${isAdmin ? `<strong>${req.employeeEmail}</strong>` : req.type}</td>
                <td>${req.itemCount}</td>
                <td><span class="badge ${badgeClass}">${req.status}</span></td>
                <td>
                    ${isAdmin && req.status === 'Pending' ? 
                        `<button class="btn btn-sm btn-outline-success" onclick="updateRequestStatus(${index}, 'Approved')">Approve</button>
                         <button class="btn btn-sm btn-outline-danger" onclick="updateRequestStatus(${index}, 'Rejected')">Reject</button>` 
                        : `<button class="btn btn-sm btn-outline-danger" onclick="deleteRequest(${index})">Delete</button>`
                    }
                </td>
            </tr>`;
    });
}

function createNewRequest() {
    const type = prompt("Request Type (e.g., Equipment, Leave, Resources):");
    const qty = prompt("How many items/days?");
    
    if (type && qty) {
        const newReq = {
            date: new Date().toLocaleDateString(),
            type: type,
            itemCount: qty,
            status: 'Pending',
            employeeEmail: currentUser.email
        };

        window.db.requests.push(newReq);
        saveToStorage();
        renderRequestsTable();
    }
}

function showPage(id) { 
    const el = document.getElementById(id);
    if (el) el.classList.add('active'); 
}

async function loadFromStorage() {
    /**const token = sessionStorage.getItem('authToken');
    if (!token) return; // Don't fetch if not logged in

    try {
        const response = await fetch('http://localhost:4000/api/database', {
            method: 'GET',
            headers: getAuthHeader() // This sends the Bearer token
        });

        if (response.ok) {
            const data = await response.json();
            window.db = data; // Populates the global database
            console.log("Database synced from server.");
        }
    } catch (err) {
        console.error("Could not sync with server database.", err);
    }**/

    console.log("loadFromStorage is currently disabled.");
    return;
}

async function saveToStorage() {
    /**
    try {
        await fetch('http://localhost:4000/api/database/update', {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(window.db) // Send the whole updated object
        });
        console.log("System data synced to server successfully.");
    } catch (err) {
        alert("Sync error: Could not save changes to the server.");
    }
        */
    console.log("saveToStorage is currently disabled.");
    return;
}

function simulateVerification() {
    const email = localStorage.getItem('unverified_email');
    
    // 1. We don't necessarily need to find them in window.db anymore 
    // because the Server handles the user list now.
    
    // 2. Just confirm the 'simulation' is done
    alert(`Email verified for ${email}! You can now log in.`);
    
    // 3. Cleanup the temporary storage
    localStorage.removeItem('unverified_email');
    
    // 4. Move to Login
    window.location.hash = '#/login';
}

async function handleLogin(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('login-email').value;
    const passwordInput = document.getElementById('login-pass').value;

    try {
        // Pointing to the new TypeScript endpoint: /users/authenticate
        const response = await fetch(`${API_BASE}/users/authenticate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: emailInput, 
                password: passwordInput 
            })
        });

        const data = await response.json();

        if (response.ok) {
            // TypeScript returns the token and user info in the root of the response
            sessionStorage.setItem('authToken', data.token);
            
            // Sync UI state
            setAuthState(true, data); 
            
            window.location.hash = '#/profile';
            alert("Login successful!");
        } else {
            alert('Login failed: ' + (data.message || 'Invalid credentials'));
        }
    } catch (err) {
        alert('TypeScript server is not running on port 4000');
    }
}

function setAuthState(isAuth, user = null, token = null) {
    currentUser = isAuth ? user : null;
    const body = document.body;

    if (isAuth && user) {
        // 1. Store the JWT token and user info for session persistence
        if (token) sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('currentUser', JSON.stringify(user));

        // 2. Update UI Classes
        body.classList.remove('not-authenticated');
        body.classList.add('authenticated');
        
        // 3. Handle Role-Based UI
        if (user.role === 'admin') {
            body.classList.add('is-admin');
        } else {
            body.classList.remove('is-admin');
        }

        // 4. Update Header Display
        const displayEl = document.getElementById('user-display');
        if (displayEl) displayEl.innerText = user.firstName || user.email; 
    } else {
        // 5. Cleanup: Wipe everything on logout or failed auth
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('currentUser');
        
        body.classList.add('not-authenticated');
        body.classList.remove('authenticated', 'is-admin');
        
        const displayEl = document.getElementById('user-display');
        if (displayEl) displayEl.innerText = '';
    }
}

function logout() {
    // 1. Clear ALL sensitive data from sessionStorage
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    
    // 2. Clear the current user object from the script's memory
    currentUser = null;

    // 3. Reset the UI State
    const body = document.body;
    body.classList.add('not-authenticated');
    body.classList.remove('authenticated', 'is-admin');

    // 4. Clear the name display in the header
    const displayEl = document.getElementById('user-display');
    if (displayEl) displayEl.innerText = '';

    // 5. Redirect to the login page
    window.location.hash = '#/login';
    
    console.log("Session cleared. User logged out.");
}

function handleAddDepartment() {
    const name = prompt("Enter Department Name:");
    
    if (name === null || name.trim() === "") {
        return; 
    }
    const description = prompt(`Enter description for ${name}:`);

    if (description === null) {
        return;
    }
    window.db.departments.push({
        name: name.trim(),
        description: description.trim()
    });
    saveToStorage();
    renderDepartmentsList();
}

function deleteDepartment(index) {
    if (confirm("Delete this department?")) {
        window.db.departments.splice(index, 1);
        saveToStorage();
        renderDepartmentsList();
    }
}

function editDepartment(index) {
    const dept = window.db.departments[index];
    const newName = prompt("New Department Name:", dept.name);
    const newDesc = prompt("New Description:", dept.description);

    if (newName) dept.name = newName;
    if (newDesc) dept.description = newDesc;

    saveToStorage();
    renderDepartmentsList();
}

function handleEditDepartment(index) {
    const dept = window.db.departments[index];
    const newName = prompt("Edit Department Name:", dept.name);
    if (newName === null || newName.trim() === "") {
        return; 
    }
    const newDesc = prompt("Edit Description:", dept.description);
    if (newDesc === null) {
        return;
    }
    window.db.departments[index] = {
        name: newName.trim(),
        description: newDesc.trim()
    };
    saveToStorage();
    renderDepartmentsList();
}

function checkAuth(id, callback) {
    if (!currentUser) return window.location.hash = '#/login';
    showPage(id);
    if (callback) callback();
}

function checkAdmin(id, callback) {
    if (!currentUser || currentUser.role !== 'admin') return window.location.hash = '#/';
    showPage(id);
    if (callback) callback();
}

function renderProfile() {
    document.getElementById('prof-name').innerText = currentUser.firstName + " " + currentUser.lastName;
    document.getElementById('prof-email').innerText = currentUser.email;
    document.getElementById('prof-role').innerText = currentUser.role;
}

function updateRequestStatus(index, newStatus) {
    window.db.requests[index].status = newStatus;
    saveToStorage();
    renderRequestsTable();
}

function deleteRequest(index) {
    if(confirm("Delete this request?")) {
        window.db.requests.splice(index, 1);
        saveToStorage();
        renderRequestsTable();
    }
}

// Expose only the functions the HTML needs to call
    window.handleLogin = handleLogin;
    window.handleRegister = handleRegister;
    window.logout = logout;
    window.toggleForm = toggleForm;
    window.saveEmployee = saveEmployee;
    window.saveAccount = saveAccount;
    window.editEmployee = editEmployee;
    window.deleteEmployee = deleteEmployee;
    window.editAccount = editAccount;
    window.deleteAccount = deleteAccount;
    window.openProfileModal = openProfileModal;
    window.handleUpdateProfile = handleUpdateProfile;
    window.createNewRequest = createNewRequest;
    window.updateRequestStatus = updateRequestStatus;
    window.deleteRequest = deleteRequest;

init();
})();