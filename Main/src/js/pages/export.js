// Initialize global variables
window.allTimetables = [];
window.selectedTimetables = new Set();

// Initialize the page
function initializePage() {
    // Add event listeners to export buttons
    document.querySelectorAll('.export-button').forEach(button => {
        button.addEventListener('click', handleExport);
    });

    // Add event listeners for selection buttons
    document.getElementById('selectAllBtn').addEventListener('click', selectAllTimetables);
    document.getElementById('deselectAllBtn').addEventListener('click', deselectAllTimetables);

    // Wait for authentication before loading timetables
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            loadTimetables();
        } else {
            document.getElementById('timetableGrid').innerHTML = `
                <div class="no-timetables">
                    <i class="fas fa-user-slash"></i>
                    <h3>Please log in to view your timetables</h3>
                    <a href="login.html" class="btn btn-primary mt-3">Login</a>
                </div>
            `;
        }
    });
}

// Load timetables from Firebase
async function loadTimetables() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User not authenticated');

        const db = firebase.database();
        const snapshot = await db.ref(`timetables/${user.uid}`).orderByChild('timestamp').once('value');
        const timetableGrid = document.getElementById('timetableGrid');
        
        window.allTimetables = [];
        window.selectedTimetables = new Set(); // Reinitialize to ensure it exists
        
        snapshot.forEach(childSnapshot => {
            window.allTimetables.unshift({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        if (window.allTimetables.length === 0) {
            timetableGrid.innerHTML = `
                <div class="no-timetables">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No Timetables Found</h3>
                    <p>Create a timetable first to export it</p>
                    <a href="department-timetable.html" class="btn btn-primary mt-3">Create Timetable</a>
                </div>
            `;
            return;
        }

        // Render timetable cards
        timetableGrid.innerHTML = window.allTimetables.map(timetable => {
            const departments = timetable.departments;
            const firstDept = departments[0];
            const title = departments.length > 1 
                ? `${firstDept.name} and ${departments.length - 1} more`
                : firstDept.name;

            return `
                <div class="timetable-card" data-id="${timetable.id}">
                    <div class="card-header">
                        <input type="checkbox" class="timetable-checkbox" data-id="${timetable.id}">
                        <h4 class="card-title">${title}</h4>
                    </div>
                    <div class="card-info">
                        <span><i class="fas fa-calendar"></i> Created: ${new Date(timetable.timestamp).toLocaleDateString()}</span>
                        <span><i class="fas fa-building"></i> Departments: ${departments.length}</span>
                        <span><i class="fas fa-book"></i> Total Courses: ${departments.reduce((total, dept) => total + (dept.courses ? dept.courses.length : 0), 0)}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners to checkboxes
        document.querySelectorAll('.timetable-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', handleTimetableSelection);
        });

        // Add event listeners to cards
        document.querySelectorAll('.timetable-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    const checkbox = card.querySelector('.timetable-checkbox');
                    checkbox.checked = !checkbox.checked;
                    handleTimetableSelection({ target: checkbox });
                }
            });
        });

    } catch (error) {
        console.error('Error loading timetables:', error);
        showError('Failed to load timetables');
    }
}

// Handle timetable selection
function handleTimetableSelection(event) {
    const checkbox = event.target;
    const timetableId = checkbox.dataset.id;
    const card = checkbox.closest('.timetable-card');

    console.log('Timetable selection:', {
        id: timetableId,
        checked: checkbox.checked,
        currentSelected: Array.from(window.selectedTimetables)
    });

    if (checkbox.checked) {
        window.selectedTimetables.add(timetableId);
        card.classList.add('selected');
    } else {
        window.selectedTimetables.delete(timetableId);
        card.classList.remove('selected');
    }

    console.log('Updated selected timetables:', Array.from(window.selectedTimetables));
    updateExportButtonsState();
}

// Select all timetables
function selectAllTimetables() {
    document.querySelectorAll('.timetable-checkbox').forEach(checkbox => {
        checkbox.checked = true;
        const card = checkbox.closest('.timetable-card');
        card.classList.add('selected');
        window.selectedTimetables.add(checkbox.dataset.id);
    });
    updateExportButtonsState();
}

// Deselect all timetables
function deselectAllTimetables() {
    document.querySelectorAll('.timetable-checkbox').forEach(checkbox => {
        checkbox.checked = false;
        const card = checkbox.closest('.timetable-card');
        card.classList.remove('selected');
        window.selectedTimetables.delete(checkbox.dataset.id);
    });
    updateExportButtonsState();
}

// Update export buttons state
function updateExportButtonsState() {
    const hasSelected = window.selectedTimetables.size > 0;
    document.querySelectorAll('.export-button').forEach(button => {
        button.disabled = !hasSelected;
    });
}

// Handle export button clicks
async function handleExport(event) {
    const button = event.currentTarget;
    const format = button.dataset.format;
    const card = button.closest('.export-card');

    console.log('Export clicked:', {
        format: format,
        selectedTimetables: Array.from(window.selectedTimetables)
    });

    try {
        // Check if any timetables are selected
        if (window.selectedTimetables.size === 0) {
            console.error('No timetables selected');
            throw new Error('Please select at least one timetable to export');
        }

        // Show loading state
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner"></span> Exporting...';

        // Get export settings
        const settings = getExportSettings(format);

        // Filter selected timetables
        const timetableData = window.allTimetables.filter(t => window.selectedTimetables.has(t.id));
        console.log('Filtered timetable data:', timetableData);

        if (!timetableData.length) {
            console.error('No timetable data found after filtering');
            throw new Error('No timetable data found');
        }

        // Perform export based on format
        switch (format) {
            case 'pdf':
                await exportToPDF(timetableData, settings);
                break;
            case 'excel':
                await exportToExcel(timetableData, settings);
                break;
            case 'image':
                await exportToImage(timetableData, settings);
                break;
        }

        // Show success message
        showSuccessMessage(card, `Successfully exported ${window.selectedTimetables.size} timetable(s) as ${format.toUpperCase()}`);
    } catch (error) {
        console.error('Export error:', error);
        showError(error.message);
    } finally {
        // Reset button state
        button.disabled = false;
        button.innerHTML = `
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export as ${format.toUpperCase()}
        `;
    }
}

// Get export settings based on format
function getExportSettings(format) {
    const settings = {};

    switch (format) {
        case 'pdf':
            settings.pageSize = document.getElementById('pdfPageSize').value;
            settings.orientation = document.getElementById('pdfOrientation').value;
            break;
        case 'excel':
            settings.version = document.getElementById('excelVersion').value;
            settings.sheetName = document.getElementById('excelSheetName').value || 'Timetable';
            break;
        case 'image':
            settings.format = document.getElementById('imageFormat').value;
            settings.quality = document.getElementById('imageQuality').value;
            break;
    }

    return settings;
}

// Export to PDF
async function exportToPDF(timetableData, settings) {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: settings.orientation,
            unit: 'mm',
            format: settings.pageSize
        });

        doc.setFontSize(20);
        doc.text('Timetable Export', 14, 20);
        let yOffset = 30;

        timetableData.forEach((timetable, index) => {
            if (yOffset > 250) {
                doc.addPage();
                yOffset = 20;
            }

            doc.setFontSize(16);
            const firstDept = timetable.departments[0];
            const title = timetable.departments.length > 1 
                ? `${firstDept.name} and ${timetable.departments.length - 1} more`
                : firstDept.name;
            doc.text(title, 14, yOffset);
            yOffset += 10;

            doc.setFontSize(12);
            Object.entries(timetable.data).forEach(([deptProgram, schedule]) => {
                if (yOffset > 250) {
                    doc.addPage();
                    yOffset = 20;
                }

                doc.text(deptProgram, 14, yOffset);
                yOffset += 7;

                const tableData = createTableData(schedule);
                doc.autoTable({
                    startY: yOffset,
                    head: [['Time', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']],
                    body: tableData,
                    theme: 'grid',
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [74, 144, 226] }
                });
                yOffset = doc.lastAutoTable.finalY + 10;
            });
        });

        doc.save('timetable-export.pdf');
    } catch (error) {
        console.error('PDF export error:', error);
        throw new Error('Failed to export PDF: ' + error.message);
    }
}

// Export to Excel
async function exportToExcel(timetableData, settings) {
    try {
        const workbook = window.XLSX.utils.book_new();
        
        timetableData.forEach((timetable, index) => {
            Object.entries(timetable.data).forEach(([deptProgram, schedule], deptIndex) => {
                const tableData = createTableData(schedule);
                const worksheet = window.XLSX.utils.aoa_to_sheet([
                    [deptProgram],
                    ['Time', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                    ...tableData
                ]);
                window.XLSX.utils.book_append_sheet(
                    workbook,
                    worksheet,
                    `${settings.sheetName}${index + 1}-${deptIndex + 1}`
                );
            });
        });

        window.XLSX.writeFile(workbook, 'timetable-export.xlsx');
    } catch (error) {
        console.error('Excel export error:', error);
        throw new Error('Failed to export Excel: ' + error.message);
    }
}

// Export to Image
async function exportToImage(timetableData, settings) {
    try {
        const container = document.createElement('div');
        container.style.padding = '20px';
        container.style.background = 'white';
        document.body.appendChild(container);

        timetableData.forEach((timetable, index) => {
            const timetableDiv = document.createElement('div');
            timetableDiv.style.marginBottom = '40px';

            Object.entries(timetable.data).forEach(([deptProgram, schedule]) => {
                const tableData = createTableData(schedule);
                const table = createTableElement(deptProgram, tableData);
                timetableDiv.appendChild(table);
            });

            container.appendChild(timetableDiv);
        });

        const canvas = await window.html2canvas(container, {
            scale: settings.quality === 'high' ? 2 : settings.quality === 'medium' ? 1.5 : 1,
            backgroundColor: 'white'
        });

        const image = canvas.toDataURL(`image/${settings.format}`);
        const link = document.createElement('a');
        link.href = image;
        link.download = `timetable-export.${settings.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        document.body.removeChild(container);
    } catch (error) {
        console.error('Image export error:', error);
        throw new Error('Failed to export image: ' + error.message);
    }
}

// Create table data for export
function createTableData(schedule) {
    if (!schedule) return [];
    
    const timeSlots = [...new Set(schedule.map(item => item.time))].sort();
    return timeSlots.map(time => {
        const row = [time];
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].forEach(day => {
            const classes = schedule.filter(item => 
                item.time === time && 
                item.day.toLowerCase() === day
            );
            
            if (classes.length > 0) {
                row.push(classes.map(cls => 
                    `${cls.code} - ${cls.name}\nRoom: ${cls.room}\nTeacher: ${cls.teacher}`
                ).join('\n\n'));
            } else {
                row.push('');
            }
        });
        return row;
    });
}

// Create table element for image export
function createTableElement(title, tableData) {
    const container = document.createElement('div');
    container.style.marginBottom = '20px';

    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    titleElement.style.marginBottom = '10px';
    container.appendChild(titleElement);

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginBottom = '20px';

    // Add header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th style="border: 1px solid #dee2e6; padding: 8px;">Time</th>
            <th style="border: 1px solid #dee2e6; padding: 8px;">Monday</th>
            <th style="border: 1px solid #dee2e6; padding: 8px;">Tuesday</th>
            <th style="border: 1px solid #dee2e6; padding: 8px;">Wednesday</th>
            <th style="border: 1px solid #dee2e6; padding: 8px;">Thursday</th>
            <th style="border: 1px solid #dee2e6; padding: 8px;">Friday</th>
            <th style="border: 1px solid #dee2e6; padding: 8px;">Saturday</th>
        </tr>
    `;
    table.appendChild(thead);

    // Add body
    const tbody = document.createElement('tbody');
    tableData.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.style.border = '1px solid #dee2e6';
            td.style.padding = '8px';
            td.style.whiteSpace = 'pre-line';
            td.textContent = cell;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    container.appendChild(table);
    return container;
}

// Show success message
function showSuccessMessage(card, message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        background-color: #d4edda;
        color: #155724;
        padding: 0.75rem;
        border-radius: 4px;
        margin-top: 1rem;
        text-align: center;
        font-size: 0.9rem;
    `;
    successDiv.textContent = message;

    // Remove any existing success message
    const existingMessage = card.querySelector('.success-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    card.appendChild(successDiv);

    // Remove message after 3 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Define showError and hideError locally
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
    errorDiv.style.zIndex = '1050';
    errorDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}
function hideError() {
    document.querySelectorAll('.alert-danger').forEach(el => el.remove());
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage); 