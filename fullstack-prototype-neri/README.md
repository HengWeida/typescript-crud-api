Full-Stack Web App: Build-From-Scratch Activity Guide  
*Implementing a Role-Based SPA Using Only Frontend Tech*



Phase 0: Setup & Planning

Tasks:
1. Create a new folder: `fullstack-prototype-yourlastname`
2. Inside it, create an `index.html`, `style.css`, and `script.js`
3. In `index.html`, add:
   - Basic HTML5 boilerplate
   - Viewport meta tag
   - Title: “Full-Stack App (Student Build)”
   - Link to **Bootstrap 5 CSS** via CDN
   - Link your `style.css`
   - At the bottom: Bootstrap JS bundle + your `script.js`



Phase 1: Core Structure & Navigation

Build These Components:

1. **Navigation Bar**
   - Brand: “Full-Stack App (Your Full Name)”
   - Right-aligned links:
     - “Login” and “Register” (visible only when **not logged in**)
        
          
       
     - Dropdown with username, “Profile”, “My Requests”, “Logout” (visible only when **logged in**)
     - Admin-only links: “Employees”, “Accounts”, “Departments” (use `.role-admin` class)



2. **Page Sections** (`<section>` inside `<main>`)
   - Home
	
   - Register
	
   - Verify Email
	

   - Login
	
   - Profile
	
   - Employees (admin)
	
   - Departments (admin)
	
   - Accounts (admin)
	
   - Requests
	
	

	
3. **CSS Rules** (in `style.css`):
   css
   .page { display: none; }
   .page.active { display: block; }
   body.not-authenticated .role-logged-in { display: none; }
   body.authenticated .role-logged-out { display: none; }
   .role-admin { display: none; }
   body.is-admin .role-admin { display: block; }

4. **Initial Body Class**: `<body class="not-authenticated">`



Phase 2: Client-Side Routing

Implement:

- A global variable: `let currentUser = null;`
- A function `navigateTo(hash)` that updates `window.location.hash`
- A function `handleRouting()` that:
  - Reads current hash (e.g., `#/login`)
  - Hides all `.page` elements
  - Shows the matching page (e.g., `login-page`)
  - Redirects unauthenticated users away from protected routes (`#/profile`, etc.)
  - Blocks non-admins from admin routes
- Add `hashchange` event listener to call `handleRouting()`
- On page load, set hash to `#/` if empty

> 💡 Test: Type `#/register` in URL → Register form appears.



Phase 3: Authentication System

Build Step-by-Step:

A. **Registration**
- Form with: First Name, Last Name, Email, Password (min 6 chars)
- On submit:
  - Check if email already exists
  - If not, save new account to `window.db.accounts` with `{ verified: false }`
  - Store email in `localStorage.unverified_email`
  - Navigate to `#/verify-email`

B. **Email Verification (Simulated)**
- Show message: “Verification sent to [email]”
- Button: “✅ Simulate Email Verification”
  - Finds account by `unverified_email`
  - Sets `verified: true`
  - Saves to storage
  - Navigates to login

C. **Login**
- Form: Email + Password
- On submit:
  - Find account with matching email, password, and `verified: true`
  - If found:
    - Save `auth_token = email` in `localStorage`
    - Call `setAuthState(true, user)`
    - Navigate to profile
  - Else: show error

D. **Auth State Management**
- Function `setAuthState(isAuth, user)`:
  - Updates `currentUser`
  - Toggles `body.authenticated` / `not-authenticated`
  - If admin, adds `body.is-admin`

E. **Logout**
- Clear `auth_token` from `localStorage`
- Call `setAuthState(false)`
- Navigate to home



Phase 4: Data Persistence with localStorage

Implement:
- `STORAGE_KEY = 'ipt_demo_v1'`
- `loadFromStorage()`:
  - Parses `localStorage[STORAGE_KEY]`
  - If missing/corrupt, seeds with:
    - One admin account (`admin@example.com`, `Password123!`, `verified: true`)
    - Two departments: Engineering, HR
- `saveToStorage()`: stringifies `window.db` and saves
- Call `loadFromStorage()` on init
- After any data change (create/update/delete), call `saveToStorage()`



Phase 5: Profile Page

Build:
- `renderProfile()` function:
  - Displays user’s name, email, role
  - Shows “Edit Profile” button (can just show alert for now)
- Call this function when navigating to `#/profile`



Phase 6: Admin Features (CRUD)

For Each Admin Section:

A. **Accounts**
- Table: Name, Email, Role, Verified (/—), Actions (Edit, Reset PW, Delete)
- “+ Add Account” opens form (First, Last, Email, Password, Role dropdown, Verified checkbox)
- Edit: pre-fill form
- Reset Password: prompt for new password (min 6 chars)
- Delete: confirm + prevent self-deletion

B. **Departments**
- Table: Name, Description, Actions
- “+ Add Department” → alert (“Not implemented” is OK for now)
- Render list from `window.db.departments`

C. **Employees**
- Table: ID, User (email), Position, Dept (name), Actions
- “+ Add Employee” form:
  - Employee ID (text)
  - User Email (must match existing account)
  - Position
  - Department (dropdown populated from departments)
  - Hire Date
- On save: link to user ID and dept ID

> Use helper functions like `renderAccountsList()`, `renderEmployeesTable()`



Phase 7: User Requests

Implement:
- “My Requests” page shows only requests where `employeeEmail === currentUser.email`
- “+ New Request” opens modal with:
  - Type dropdown (Equipment, Leave, Resources)
  - Dynamic item fields (name + qty), with “+” to add more, “×” to remove
- On submit:
  - Validate at least one item
  - Save request with: `type`, `items[]`, `status: "Pending"`, `date`, `employeeEmail`
- Display requests in a table with status badges (Pending=warning, Approved=success, Rejected=danger)



Phase 8: Testing & Polish

Test Scenarios:
1. Register → verify → login → view profile
2. Log in as admin → create new user → log out → log in as new user
3. Submit a request → see it in “My Requests”
4. Refresh browser → data persists
5. Try accessing `#/employees` as regular user → blocked

Add UX Improvements:
- Toast notifications (`showToast(message, type)`)
- Form validation feedback
- Loading states (optional)
- Responsive layout (Bootstrap helps!)



Final Challenge (Optional)

> **Refactor for Maintainability**  
> - Move all DOM rendering into separate functions  
> - Replace inline event handlers with `addEventListener`  
> - Create a simple “router” object to map routes to renderers  



Deliverable

By the end, you should have a **fully working single-file app** (`index.html`) that matches the behavior of the prototype—but written entirely by you.

> **Success Criteria**: All features work without errors, data persists across refreshes, and UI respects roles.



Happy coding!  
This hands-on build will deeply prepare you for connecting this frontend to a real backend (Node.js + Express + MySQL) next.
