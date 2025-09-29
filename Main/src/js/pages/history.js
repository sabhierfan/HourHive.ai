// DOM Elements
let typeFilter, semesterFilter, searchFilter, timetableList;
let allTimetables = [];

// Initialize the page
function initializePage() {
    // Get DOM elements
    typeFilter = document.getElementById('typeFilter');
    semesterFilter = document.getElementById('semesterFilter');
    searchFilter = document.getElementById('searchFilter');
    timetableList = document.querySelector('.timetable-list');

    // Add event listeners
    typeFilter.addEventListener('change', filterTimetables);
    semesterFilter.addEventListener('change', filterTimetables);
    searchFilter.addEventListener('input', filterTimetables);

    // Add event listeners to action buttons
    document.addEventListener('click', handleActionClick);

    // Load timetables from Firebase
    loadTimetablesFromFirebase();
}

// Load timetables from Firebase
async function loadTimetablesFromFirebase() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            showError('User not authenticated');
            return;
        }

        const db = firebase.database();
        const timetablesRef = db.ref(`timetables/${user.uid}`);
        
        // Listen for changes in the timetables
        timetablesRef.on('value', (snapshot) => {
            allTimetables = [];
            snapshot.forEach((childSnapshot) => {
                const timetable = {
                    id: childSnapshot.key,
                    ...childSnapshot.val(),
                    timestamp: new Date(childSnapshot.val().timestamp)
                };
                allTimetables.push(timetable);
            });
            
            // Sort timetables by timestamp (newest first)
            allTimetables.sort((a, b) => b.timestamp - a.timestamp);
            
            // Update filters based on available data
            updateFilters();
            
            // Initial render
            filterTimetables();
        });
    } catch (error) {
        console.error('Error loading timetables:', error);
        showError('Failed to load timetables');
    }
}

// Update filter options based on available data
function updateFilters() {
    // Get unique semesters
    const semesters = [...new Set(allTimetables.map(t => t.data.departments[0].semester))];
    
    // Update semester filter
    semesterFilter.innerHTML = '<option value="all">All Semesters</option>';
    semesters.forEach(semester => {
        semesterFilter.innerHTML += `<option value="${semester}">${ordinalSemester(semester)}</option>`;
    });
}

// Convert semester number to ordinal form
function ordinalSemester(semester) {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const suffix = (semester % 10 <= 3 && semester % 10 >= 1) ? suffixes[semester % 10] : suffixes[0];
    return `${semester}${suffix} Semester`;
}

// Filter timetables based on selected filters
function filterTimetables() {
    const typeValue = typeFilter.value;
    const semesterValue = semesterFilter.value;
    const searchValue = searchFilter.value.toLowerCase();

    const filteredTimetables = allTimetables.filter(timetable => {
        const matchesType = typeValue === 'all' || (timetable.data.departments && timetable.data.departments.some(dept => dept.program.toLowerCase().includes(typeValue)));
        const matchesSemester = semesterValue === 'all' || (timetable.data.departments && timetable.data.departments.some(dept => dept.semester.toString() === semesterValue));
        const matchesSearch = JSON.stringify(timetable.data).toLowerCase().includes(searchValue);

        return matchesType && matchesSemester && matchesSearch;
    });

    renderTimetables(filteredTimetables);
}

// Render timetables in the list
function renderTimetables(timetables) {
    if (timetables.length === 0) {
        timetableList.innerHTML = `
            <div class="empty-state">
                <h3>No timetables found</h3>
                <p>Try adjusting your filters or create a new timetable.</p>
                <a href="department-timetable.html" class="create-new-btn">Create New Timetable</a>
            </div>
        `;
        return;
    }

    timetableList.innerHTML = timetables.map(timetable => {
        const departments = timetable.data.departments;
        const firstDept = departments[0];
        const title = departments.length > 1 
            ? `${firstDept.name} and ${departments.length - 1} more`
            : firstDept.name;

        return `
            <div class="timetable-card" data-id="${timetable.id}">
                <div class="timetable-header">
                    <h3 class="timetable-title">${title}</h3>
                    <span class="timetable-type type-department">Department</span>
                </div>
                <div class="timetable-info">
                    <div class="info-item">
                        <span class="info-label">Created By</span>
                        <span class="info-value">${firebase.auth().currentUser.email}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Created On</span>
                        <span class="info-value">${formatDate(timetable.timestamp)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Departments</span>
                        <span class="info-value">${departments.length}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Courses</span>
                        <span class="info-value">${departments.reduce((total, dept) => total + dept.courses.length, 0)}</span>
                    </div>
                </div>
                <div class="timetable-actions">
                    <button class="action-button view-btn" data-action="view">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="action-button edit-btn" data-action="edit">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-button delete-btn" data-action="delete">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Handle action button clicks
async function handleActionClick(event) {
    const button = event.target.closest('.action-button');
    if (!button) return;

    const action = button.dataset.action;
    const timetableCard = button.closest('.timetable-card');
    const timetableId = timetableCard.dataset.id;

    switch (action) {
        case 'view':
            viewTimetable(timetableId);
            break;
        case 'edit':
            editTimetable(timetableId);
            break;
        case 'delete':
            await deleteTimetable(timetableId);
            break;
    }
}

// View timetable
function viewTimetable(timetableId) {
    const timetable = allTimetables.find(t => t.id === timetableId);
    if (!timetable) return;

    // Open in a new window
    const timetableWindow = window.open('', '_blank');
    displayTimetable(timetable.data, timetableWindow);
}

// Edit timetable
function editTimetable(timetableId) {
    const timetable = allTimetables.find(t => t.id === timetableId);
    if (!timetable) return;

    // Store timetable data in sessionStorage for editing
    sessionStorage.setItem('editTimetable', JSON.stringify(timetable.data));
    window.location.href = `department-timetable.html?edit=${timetableId}`;
}

// Delete timetable
async function deleteTimetable(timetableId) {
    if (!confirm('Are you sure you want to delete this timetable? This action cannot be undone.')) {
        return;
    }

    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User not authenticated');

        const db = firebase.database();
        await db.ref(`timetables/${user.uid}/${timetableId}`).remove();
        showError('Timetable deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting timetable:', error);
        showError('Failed to delete timetable');
    }
}

// Format date for display
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Function to show error message
function showError(message, type = 'error') {
    const errorDiv = document.createElement('div');
    errorDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    errorDiv.style.zIndex = '1050';
    errorDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage); 