// Validate time slot format (HH:MM)
export function validateTimeSlot(time) {
    const re = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return re.test(time);
}

// Convert time string to minutes for comparison
export function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

// Convert minutes to time string
export function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Check if two time slots overlap
export function doTimeSlotsOverlap(start1, end1, start2, end2) {
    const start1Mins = timeToMinutes(start1);
    const end1Mins = timeToMinutes(end1);
    const start2Mins = timeToMinutes(start2);
    const end2Mins = timeToMinutes(end2);
    
    return (start1Mins < end2Mins && start2Mins < end1Mins);
}

// Validate room capacity against group size
export function validateRoomCapacity(roomCapacity, groupSize) {
    return roomCapacity >= groupSize;
}

// Check if instructor is available during the time slot
export function isInstructorAvailable(instructor, day, timeSlot) {
    if (!instructor.availability) return true;
    if (!instructor.availability[day]) return true;
    
    return !instructor.availability[day].some(slot => 
        doTimeSlotsOverlap(slot.start, slot.end, timeSlot.start, timeSlot.end)
    );
}

// Check if room is available during the time slot
export function isRoomAvailable(room, day, timeSlot) {
    if (!room.schedule) return true;
    if (!room.schedule[day]) return true;
    
    return !room.schedule[day].some(slot => 
        doTimeSlotsOverlap(slot.start, slot.end, timeSlot.start, timeSlot.end)
    );
}

// Generate unique ID for timetable entries
export function generateTimetableEntryId() {
    return 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Format time slot for display
export function formatTimeSlot(start, end) {
    return `${start} - ${end}`;
}

// Calculate total duration of a time slot in minutes
export function calculateDuration(start, end) {
    return timeToMinutes(end) - timeToMinutes(start);
}

// Validate course duration matches time slot duration
export function validateCourseDuration(courseDuration, timeSlotDuration) {
    return courseDuration === timeSlotDuration;
}

// Check if a day is a working day
export function isWorkingDay(day, workingDays) {
    return workingDays.includes(day);
}

// Get next available time slot
export function getNextAvailableTimeSlot(currentSlot, duration, workingDays, slotsPerDay) {
    let [day, time] = currentSlot.split(' ');
    let currentTimeMins = timeToMinutes(time);
    
    // Move to next time slot
    currentTimeMins += duration;
    
    // If exceeds day slots, move to next day
    if (currentTimeMins >= timeToMinutes('17:00')) { // Assuming 5 PM is end of day
        const dayIndex = workingDays.indexOf(day);
        if (dayIndex < workingDays.length - 1) {
            day = workingDays[dayIndex + 1];
            currentTimeMins = timeToMinutes('09:00'); // Assuming 9 AM is start of day
        } else {
            return null; // No more slots available
        }
    }
    
    return `${day} ${minutesToTime(currentTimeMins)}`;
}

// Validate timetable constraints
export function validateTimetableConstraints(entry, timetable) {
    const {
        day,
        timeSlot,
        course,
        instructor,
        room,
        group
    } = entry;
    
    // Check instructor availability
    if (!isInstructorAvailable(instructor, day, timeSlot)) {
        return {
            valid: false,
            error: 'Instructor is not available during this time slot'
        };
    }
    
    // Check room availability
    if (!isRoomAvailable(room, day, timeSlot)) {
        return {
            valid: false,
            error: 'Room is not available during this time slot'
        };
    }
    
    // Check room capacity
    if (!validateRoomCapacity(room.capacity, group.size)) {
        return {
            valid: false,
            error: 'Room capacity is insufficient for the group size'
        };
    }
    
    // Check for instructor conflicts
    const instructorConflict = timetable.find(e => 
        e.id !== entry.id &&
        e.instructor.id === instructor.id &&
        e.day === day &&
        doTimeSlotsOverlap(e.timeSlot.start, e.timeSlot.end, timeSlot.start, timeSlot.end)
    );
    
    if (instructorConflict) {
        return {
            valid: false,
            error: 'Instructor has another class during this time slot'
        };
    }
    
    // Check for room conflicts
    const roomConflict = timetable.find(e => 
        e.id !== entry.id &&
        e.room.id === room.id &&
        e.day === day &&
        doTimeSlotsOverlap(e.timeSlot.start, e.timeSlot.end, timeSlot.start, timeSlot.end)
    );
    
    if (roomConflict) {
        return {
            valid: false,
            error: 'Room is already scheduled for another class during this time slot'
        };
    }
    
    // Check for group conflicts
    const groupConflict = timetable.find(e => 
        e.id !== entry.id &&
        e.group.id === group.id &&
        e.day === day &&
        doTimeSlotsOverlap(e.timeSlot.start, e.timeSlot.end, timeSlot.start, timeSlot.end)
    );
    
    if (groupConflict) {
        return {
            valid: false,
            error: 'Group has another class during this time slot'
        };
    }
    
    return {
        valid: true,
        error: null
    };
} 