import { auth } from './firebase-config.js';
import { showError, hideError } from './ui-utils.js';

// Sample template data (replace with Firebase data later)
const sampleTemplates = [
    {
        id: 'template1',
        title: 'Standard University',
        type: 'university',
        timeSlots: 6,
        workingDays: 'Mon - Fri',
        breakSlots: '1 (Lunch)',
        schedule: ['9:00', '10:30', '12:00', '2:00', '3:30']
    },
    {
        id: 'template2',
        title: 'CS Department',
        type: 'department',
        timeSlots: 4,
        workingDays: 'Mon - Thu',
        breakSlots: '1 (Mid-day)',
        schedule: ['8:30', '10:00', '11:30', '1:30', '3:00']
    },
    {
        id: 'template3',
        title: 'Evening Program',
        type: 'university',
        timeSlots: 3,
        workingDays: 'Mon - Fri',
        breakSlots: 'None',
        schedule: ['4:00', '5:30', '7:00', '8:30']
    }
];

// DOM Elements
let typeFilter, searchFilter, templatesGrid;

// Initialize the page
function initializePage() {
    // Get DOM elements
    typeFilter = document.getElementById('typeFilter');
    searchFilter = document.getElementById('searchFilter');
    templatesGrid = document.querySelector('.templates-grid');

    // Add event listeners
    typeFilter.addEventListener('change', filterTemplates);
    searchFilter.addEventListener('input', filterTemplates);
    document.querySelector('.create-template-btn').addEventListener('click', createTemplate);

    // Add event listeners for template actions
    document.addEventListener('click', handleActionClick);

    // Initial render
    renderTemplates(sampleTemplates);
}

// Filter templates based on selected filters
function filterTemplates() {
    const typeValue = typeFilter.value;
    const searchValue = searchFilter.value.toLowerCase();

    const filteredTemplates = sampleTemplates.filter(template => {
        const matchesType = typeValue === 'all' || template.type === typeValue;
        const matchesSearch = template.title.toLowerCase().includes(searchValue);

        return matchesType && matchesSearch;
    });

    renderTemplates(filteredTemplates);
}

// Render templates in the grid
function renderTemplates(templates) {
    if (templates.length === 0) {
        templatesGrid.innerHTML = `
            <div class="empty-state">
                <h3>No templates found</h3>
                <p>Try adjusting your filters or create a new template.</p>
                <button class="create-template-btn">Create New Template</button>
            </div>
        `;
        return;
    }

    templatesGrid.innerHTML = templates.map(template => `
        <div class="template-card" data-id="${template.id}">
            <div class="template-header">
                <h3 class="template-title">${template.title}</h3>
                <span class="template-type type-${template.type}">${template.type}</span>
            </div>
            <div class="template-info">
                <div class="info-item">
                    <span class="info-label">Time Slots</span>
                    <span class="info-value">${template.timeSlots} per day</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Working Days</span>
                    <span class="info-value">${template.workingDays}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Break Slots</span>
                    <span class="info-value">${template.breakSlots}</span>
                </div>
            </div>
            <div class="template-preview">
                <div class="preview-grid">
                    ${template.schedule.map(time => `
                        <div class="preview-cell">${time}</div>
                    `).join('')}
                    ${template.schedule.length < 5 ? '<div class="preview-cell"></div>'.repeat(5 - template.schedule.length) : ''}
                </div>
            </div>
            <div class="template-actions">
                <button class="action-button use-btn" data-action="use">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                    Use Template
                </button>
                <button class="action-button edit-btn" data-action="edit">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Edit
                </button>
                <button class="action-button delete-btn" data-action="delete">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Handle action button clicks
function handleActionClick(event) {
    const button = event.target.closest('.action-button');
    if (!button) return;

    const action = button.dataset.action;
    const templateCard = button.closest('.template-card');
    const templateId = templateCard.dataset.id;

    switch (action) {
        case 'use':
            useTemplate(templateId);
            break;
        case 'edit':
            editTemplate(templateId);
            break;
        case 'delete':
            deleteTemplate(templateId);
            break;
    }
}

// Create new template
function createTemplate() {
    // Redirect to template creation page
    window.location.href = 'create-template.html';
}

// Use template
function useTemplate(templateId) {
    const template = sampleTemplates.find(t => t.id === templateId);
    if (!template) return;

    // Redirect to timetable creation with template
    window.location.href = `${template.type}-timetable.html?template=${templateId}`;
}

// Edit template
function editTemplate(templateId) {
    const template = sampleTemplates.find(t => t.id === templateId);
    if (!template) return;

    // Redirect to template editing page
    window.location.href = `edit-template.html?id=${templateId}`;
}

// Delete template
function deleteTemplate(templateId) {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
        return;
    }

    // Remove from sample data (replace with Firebase delete later)
    const index = sampleTemplates.findIndex(t => t.id === templateId);
    if (index !== -1) {
        sampleTemplates.splice(index, 1);
        filterTemplates();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage); 