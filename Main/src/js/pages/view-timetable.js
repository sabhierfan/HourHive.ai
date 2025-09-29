import { auth } from './firebase-config.js';
import { showError, hideError } from './ui-utils.js';

// Sample timetable data (replace with Firebase data later)
const sampleTimetable = {
    id: 'tt1',
    title: 'University Timetable - Fall 2023',
    type: 'university',
    createdBy: 'admin@zab.edu.pk',
    createdAt: '2023-08-15',
    modifiedAt: '2023-08-20',
    status: 'Published',
    semester: 'fall2023',
    schedule: [
        {
            day: 'Monday',
            timeSlot: '9:00 - 10:30',
            course: {
                code: 'CS101',
                name: 'Introduction to Programming',
                type: 'Theory'
            },
            instructor: 'Dr. John Smith',
            room: 'Room 101'
        },
        {
            day: 'Monday',
            timeSlot: '1:00 - 2:30',
            course: {
                code: 'CS103',
                name: 'Database Systems',
                type: 'Lab'
            },
            instructor: 'Dr. John Smith',
            room: 'Lab 101'
        },
        {
            day: 'Tuesday',
            timeSlot: '10:45 - 12:15',
            course: {
                code: 'CS102',
                name: 'Object-Oriented Programming',
                type: 'Theory'
            },
            instructor: 'Dr. John Smith',
            room: 'Room 103'
        },
        {
            day: 'Tuesday',
            timeSlot: '2:45 - 4:15',
            course: {
                code: 'CS104',
                name: 'Software Engineering',
                type: 'Theory'
            },
            instructor: 'Dr. John Smith',
            room: 'Room 105'
        },
        {
            day: 'Wednesday',
            timeSlot: '9:00 - 10:30',
            course: {
                code: 'CS201',
                name: 'Data Structures',
                type: 'Theory'
            },
            instructor: 'Dr. Jane Doe',
            room: 'Room 102'
        },
        {
            day: 'Wednesday',
            timeSlot: '1:00 - 2:30',
            course: {
                code: 'CS203',
                name: 'Web Development',
                type: 'Lab'
            },
            instructor: 'Dr. Jane Doe',
            room: 'Lab 102'
        },
        {
            day: 'Thursday',
            timeSlot: '10:45 - 12:15',
            course: {
                code: 'CS202',
                name: 'Algorithms',
                type: 'Theory'
            },
            instructor: 'Dr. Jane Doe',
            room: 'Room 104'
        },
        {
            day: 'Friday',
            timeSlot: '2:45 - 4:15',
            course: {
                code: 'CS204',
                name: 'Artificial Intelligence',
                type: 'Theory'
            },
            instructor: 'Dr. Jane Doe',
            room: 'Room 106'
        }
    ]
};

// DOM Elements
let viewTitle, timetableInfo, timetableGrid;

// Initialize the page
function initializePage() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const timetableId = urlParams.get('id');

    // Get DOM elements
    viewTitle = document.querySelector('.view-title');
    timetableInfo = document.querySelector('.timetable-info');
    timetableGrid = document.querySelector('.timetable-table tbody');

    // Add event listeners
    document.querySelector('.edit-btn').addEventListener('click', handleEdit);
    document.querySelector('.print-btn').addEventListener('click', handlePrint);
    document.querySelector('.export-btn').addEventListener('click', handleExport);

    // Load timetable data
    loadTimetable(timetableId);
}

// Load timetable data
function loadTimetable(timetableId) {
    // In a real app, fetch from Firebase
    // For now, use sample data
    const timetable = sampleTimetable;

    // Update page title
    document.title = `${timetable.title} - HourHive.ai`;
    viewTitle.textContent = timetable.title;

    // Update timetable info
    updateTimetableInfo(timetable);

    // Render timetable grid
    renderTimetableGrid(timetable);
}

// Update timetable information
function updateTimetableInfo(timetable) {
    const infoItems = timetableInfo.querySelectorAll('.info-item');
    
    infoItems[0].querySelector('.info-value').textContent = timetable.createdBy;
    infoItems[1].querySelector('.info-value').textContent = formatDate(timetable.createdAt);
    infoItems[2].querySelector('.info-value').textContent = formatDate(timetable.modifiedAt);
    infoItems[3].querySelector('.info-value').textContent = timetable.status;
}

// Render timetable grid
function renderTimetableGrid(timetable) {
    // Group schedule by time slot
    const timeSlots = [...new Set(timetable.schedule.map(item => item.timeSlot))].sort();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Create rows for each time slot
    const rows = timeSlots.map(timeSlot => {
        const row = document.createElement('tr');
        
        // Add time slot cell
        const timeCell = document.createElement('td');
        timeCell.className = 'time-slot';
        timeCell.textContent = timeSlot;
        row.appendChild(timeCell);

        // Add cells for each day
        days.forEach(day => {
            const cell = document.createElement('td');
            const scheduleItem = timetable.schedule.find(item => 
                item.day === day && item.timeSlot === timeSlot
            );

            if (scheduleItem) {
                cell.innerHTML = `
                    <div class="course-cell" style="background: ${getCourseTypeColor(scheduleItem.course.type)}">
                        <div class="course-code">${scheduleItem.course.code}</div>
                        <div class="course-name">${scheduleItem.course.name}</div>
                        <div class="instructor">${scheduleItem.instructor}</div>
                        <div class="room">${scheduleItem.room}</div>
                    </div>
                `;
            }

            row.appendChild(cell);
        });

        return row;
    });

    // Clear and update table body
    timetableGrid.innerHTML = '';
    rows.forEach(row => timetableGrid.appendChild(row));
}

// Get color for course type
function getCourseTypeColor(type) {
    switch (type.toLowerCase()) {
        case 'theory':
            return '#e3f2fd';
        case 'lab':
            return '#f3e5f5';
        case 'hybrid':
            return '#e8f5e9';
        default:
            return '#e3f2fd';
    }
}

// Handle edit button click
function handleEdit() {
    const urlParams = new URLSearchParams(window.location.search);
    const timetableId = urlParams.get('id');
    window.location.href = `university-timetable.html?id=${timetableId}`;
}

// Handle print button click
function handlePrint() {
    window.print();
}

// Handle export button click
function handleExport() {
    // In a real app, implement export functionality
    alert('Export functionality will be implemented soon.');
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage); 