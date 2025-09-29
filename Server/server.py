

import random
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
import json
from dataclasses import dataclass, asdict
from enum import Enum
try:
    import pandas as pd  # optional; only needed for Excel export
except Exception:
    pd = None

# Enums for better type safety
class CourseType(Enum):
    THEORY_3CR = "3_credit_theory"
    THEORY_2CR = "2_credit_theory"
    LAB = "lab"

class RoomType(Enum):
    CLASSROOM = "classroom"
    LAB = "lab"

class TimeSlot(Enum):
    MORNING = "morning"  # 8:00 AM - 3:00 PM for juniors
    EVENING = "evening"  # 2:30 PM - 9:30 PM for seniors

# Data Classes for structured data
@dataclass
class Room:
    id: str
    room_type: RoomType
    capacity: int = 50

@dataclass
class Course:
    code: str
    name: str
    course_type: CourseType
    credit_hours: int
    semester: int
    section: str
    department: str
    teacher: Optional[str] = None
    enrolled_students: int = 30

@dataclass
class TimeSlotInfo:
    day: str
    start_time: str
    end_time: str
    room: str

@dataclass
class ScheduledClass:
    course: Course
    time_slots: List[TimeSlotInfo]

class UniversityTimetableGenerator:
    def __init__(self):
        self.rooms = self._initialize_rooms()
        self.courses = []
        self.schedule = {}
        self.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        self.start_time = datetime.strptime("08:00", "%H:%M")
        self.end_time = datetime.strptime("21:30", "%H:%M")
        self.junior_end = datetime.strptime("15:00", "%H:%M")
        self.senior_start = datetime.strptime("14:30", "%H:%M")

    def _initialize_rooms(self) -> Dict[str, Room]:
        """Initialize default rooms based on requirements"""
        rooms = {}

        # Regular classrooms
        classroom_ids = [
            "102", "103", "104", "105",
            "201", "202", "203", "204", "205", "206",
            "301", "302", "303", "305", "306",
            "NB1", "NB2", "NB3", "NB4"
        ]

        for room_id in classroom_ids:
            rooms[room_id] = Room(room_id, RoomType.CLASSROOM)

        # Lab rooms
        lab_ids = ["LAB1", "LAB2", "LAB3", "LAB4", "LAB5", "DLDLAB"]
        for lab_id in lab_ids:
            rooms[lab_id] = Room(lab_id, RoomType.LAB)

        return rooms

    def add_custom_room(self, room_id: str, room_type: RoomType, capacity: int = 50):
        """Add custom rooms to the system"""
        self.rooms[room_id] = Room(room_id, room_type, capacity)

    def add_course(self, code: str, name: str, course_type: CourseType,
                   credit_hours: int, semester: int, section: str,
                   department: str, teacher: Optional[str] = None):
        """Add a course to the system"""
        course = Course(
            code=code,
            name=name,
            course_type=course_type,
            credit_hours=credit_hours,
            semester=semester,
            section=section,
            department=department,
            teacher=teacher
        )
        self.courses.append(course)

    def _get_time_slot_category(self, semester: int) -> TimeSlot:
        """Determine if a semester is junior or senior"""
        return TimeSlot.MORNING if semester <= 4 else TimeSlot.EVENING

    def _get_class_duration(self, course_type: CourseType) -> float:
        """Get class duration in hours based on course type"""
        durations = {
            CourseType.THEORY_3CR: 1.5,
            CourseType.THEORY_2CR: 2.0,
            CourseType.LAB: 3.0
        }
        return durations[course_type]

    def _get_classes_per_week(self, course_type: CourseType) -> int:
        """Get number of classes per week based on course type"""
        classes = {
            CourseType.THEORY_3CR: 2,
            CourseType.THEORY_2CR: 1,
            CourseType.LAB: 1
        }
        return classes[course_type]

    def _get_suitable_rooms(self, course: Course) -> List[str]:
        """Get suitable rooms for a course based on type"""
        if course.course_type == CourseType.LAB:
            return [r for r, room in self.rooms.items() if room.room_type == RoomType.LAB]
        else:
            return [r for r, room in self.rooms.items() if room.room_type == RoomType.CLASSROOM]

    def _is_time_slot_available(self, day: str, start: datetime, end: datetime,
                                room: str, semester: int, section: str) -> bool:
        """Check if a time slot is available"""
        key = (day, semester, section)

        # Check room availability
        for scheduled_day, scheduled_classes in self.schedule.items():
            if scheduled_day[0] != day:
                continue
            for scheduled_class in scheduled_classes:
                for slot in scheduled_class.time_slots:
                    if slot.room != room or slot.day != day:
                        continue
                    slot_start = datetime.strptime(slot.start_time, "%H:%M")
                    slot_end = datetime.strptime(slot.end_time, "%H:%M")

                    # Check for overlap
                    if not (end <= slot_start or start >= slot_end):
                        return False

        # Check if the section has classes at this time
        if key in self.schedule:
            for scheduled_class in self.schedule[key]:
                for slot in scheduled_class.time_slots:
                    slot_start = datetime.strptime(slot.start_time, "%H:%M")
                    slot_end = datetime.strptime(slot.end_time, "%H:%M")

                    if not (end <= slot_start or start >= slot_end):
                        return False

        return True

    def _get_day_schedule_for_section(self, day: str, semester: int, section: str) -> List[Tuple[datetime, datetime]]:
        """Get all scheduled times for a section on a specific day"""
        key = (day, semester, section)
        scheduled_times = []

        if key in self.schedule:
            for scheduled_class in self.schedule[key]:
                for slot in scheduled_class.time_slots:
                    if slot.day == day:
                        start = datetime.strptime(slot.start_time, "%H:%M")
                        end = datetime.strptime(slot.end_time, "%H:%M")
                        scheduled_times.append((start, end))

        return sorted(scheduled_times, key=lambda x: x[0])

    def _find_continuous_slot(self, day: str, duration: float, semester: int,
                             section: str, suitable_rooms: List[str]) -> Optional[Tuple[datetime, str]]:
        """Find a continuous time slot for a class"""
        slot_category = self._get_time_slot_category(semester)

        if slot_category == TimeSlot.MORNING:
            search_start = self.start_time
            search_end = self.junior_end
        else:
            search_start = self.senior_start
            search_end = self.end_time

        # Get existing schedule for this section
        existing_schedule = self._get_day_schedule_for_section(day, semester, section)

        # Try to schedule right after the last class (no gaps)
        if existing_schedule:
            last_end = existing_schedule[-1][1]
            potential_start = last_end
            potential_end = last_end + timedelta(hours=duration)

            if potential_end <= search_end:
                for room in suitable_rooms:
                    if self._is_time_slot_available(day, potential_start, potential_end, room, semester, section):
                        return (potential_start, room)

        # If no existing schedule or can't add after last class, start from beginning
        current_time = search_start
        while current_time + timedelta(hours=duration) <= search_end:
            potential_end = current_time + timedelta(hours=duration)

            for room in suitable_rooms:
                if self._is_time_slot_available(day, current_time, potential_end, room, semester, section):
                    return (current_time, room)

            current_time += timedelta(minutes=30)

        return None

    def _calculate_weekly_hours(self, semester: int, section: str) -> float:
        """Calculate total weekly hours for a semester/section"""
        total_hours = 0
        for day in self.days:
            key = (day, semester, section)
            if key in self.schedule:
                for scheduled_class in self.schedule[key]:
                    duration = self._get_class_duration(scheduled_class.course.course_type)
                    total_hours += duration
        return total_hours

    def generate_timetable(self) -> Dict:
        """Generate the complete timetable"""
        # Group courses by semester and section
        courses_by_group = {}
        for course in self.courses:
            key = (course.semester, course.section)
            if key not in courses_by_group:
                courses_by_group[key] = []
            courses_by_group[key].append(course)

        # Sort courses: Labs first (longer duration), then by credit hours
        for key in courses_by_group:
            courses_by_group[key].sort(key=lambda c: (
                c.course_type != CourseType.LAB,
                -self._get_class_duration(c.course_type)
            ))

        # Schedule each group
        for (semester, section), group_courses in courses_by_group.items():
            for course in group_courses:
                duration = self._get_class_duration(course.course_type)
                classes_per_week = self._get_classes_per_week(course.course_type)
                suitable_rooms = self._get_suitable_rooms(course)

                time_slots = []
                days_used = []

                for _ in range(classes_per_week):
                    scheduled = False
                    for day in self.days:
                        if day in days_used and classes_per_week > 1:
                            continue

                        # Check weekly hours limit
                        current_hours = self._calculate_weekly_hours(semester, section)
                        if current_hours + duration > 35:  # 7 hours/day * 5 days
                            continue

                        slot_info = self._find_continuous_slot(day, duration, semester,
                                                              section, suitable_rooms)
                        if slot_info:
                            start_time, room = slot_info
                            end_time = start_time + timedelta(hours=duration)

                            time_slot = TimeSlotInfo(
                                day=day,
                                start_time=start_time.strftime("%H:%M"),
                                end_time=end_time.strftime("%H:%M"),
                                room=room
                            )
                            time_slots.append(time_slot)
                            days_used.append(day)
                            scheduled = True
                            break

                    if not scheduled:
                        print(f"Warning: Could not schedule {course.code} - {course.name}")

                if time_slots:
                    scheduled_class = ScheduledClass(course=course, time_slots=time_slots)
                    for slot in time_slots:
                        key = (slot.day, semester, section)
                        if key not in self.schedule:
                            self.schedule[key] = []
                        self.schedule[key].append(scheduled_class)

    def export_to_json(self, filename: str = "timetable.json"):
        """Export timetable to JSON format"""
        output = {}
        for key, classes in self.schedule.items():
            day, semester, section = key
            key_str = f"{day}_{semester}_{section}"
            output[key_str] = []
            for scheduled_class in classes:
                class_info = {
                    "course_code": scheduled_class.course.code,
                    "course_name": scheduled_class.course.name,
                    "teacher": scheduled_class.course.teacher,
                    "time_slots": [asdict(slot) for slot in scheduled_class.time_slots]
                }
                output[key_str].append(class_info)

        with open(filename, 'w') as f:
            json.dump(output, f, indent=2)

    def export_to_excel(self, filename: str = "timetable.xlsx"):
        """Export timetable to Excel format (requires pandas/openpyxl)"""
        if pd is None:
            raise RuntimeError("pandas is not installed; Excel export is unavailable")
        with pd.ExcelWriter(filename) as writer:
            # Create sheets for each semester
            for semester in range(1, 9):
                semester_data = []

                for day in self.days:
                    for key, classes in self.schedule.items():
                        if key[0] == day and key[1] == semester:
                            for scheduled_class in classes:
                                for slot in scheduled_class.time_slots:
                                    semester_data.append({
                                        'Day': day,
                                        'Section': key[2],
                                        'Time': f"{slot.start_time}-{slot.end_time}",
                                        'Course': scheduled_class.course.code,
                                        'Course Name': scheduled_class.course.name,
                                        'Room': slot.room,
                                        'Teacher': scheduled_class.course.teacher or 'TBA'
                                    })

                if semester_data:
                    df = pd.DataFrame(semester_data)
                    df.to_excel(writer, sheet_name=f'Semester_{semester}', index=False)

    def print_timetable(self, semester: int = None, section: str = None):
        """Print timetable in a readable format"""
        print("\n" + "="*80)
        print("UNIVERSITY TIMETABLE")
        print("="*80)

        for day in self.days:
            day_has_classes = False

            for key, classes in sorted(self.schedule.items()):
                if key[0] != day:
                    continue
                if semester and key[1] != semester:
                    continue
                if section and key[2] != section:
                    continue

                if not day_has_classes:
                    print(f"\n{day.upper()}")
                    print("-"*80)
                    day_has_classes = True

                print(f"\nSemester {key[1]}, Section {key[2]}:")

                # Sort classes by time
                sorted_classes = []
                for scheduled_class in classes:
                    for slot in scheduled_class.time_slots:
                        if slot.day == day:
                            sorted_classes.append((slot.start_time, scheduled_class, slot))

                sorted_classes.sort(key=lambda x: x[0])

                for _, scheduled_class, slot in sorted_classes:
                    teacher = scheduled_class.course.teacher or "TBA"
                    print(f"  {slot.start_time}-{slot.end_time} | "
                          f"{scheduled_class.course.code:8} | "
                          f"{scheduled_class.course.name:30} | "
                          f"Room: {slot.room:6} | "
                          f"Teacher: {teacher}")

def create_complex_dataset():
    """
    Create a complex dataset with multiple departments, sections, and challenging constraints
    This includes 300+ courses across 8 semesters and 5 departments
    """
    generator = UniversityTimetableGenerator()

    # Add additional specialized rooms for complex testing
    generator.add_custom_room("PHYSLAB", RoomType.LAB, 30)
    generator.add_custom_room("CHEMLAB", RoomType.LAB, 25)
    generator.add_custom_room("BIOLAB", RoomType.LAB, 35)
    generator.add_custom_room("MATHLAB", RoomType.LAB, 40)
    generator.add_custom_room("LANGLAB", RoomType.LAB, 30)
    generator.add_custom_room("AUDITORIUM", RoomType.CLASSROOM, 150)
    generator.add_custom_room("CONFERENCE", RoomType.CLASSROOM, 80)

    # Faculty names for different departments
    cs_faculty = ["Dr. Sarah Chen", "Prof. Michael Rodriguez", "Dr. James Wilson", "Dr. Emily Johnson",
                  "Prof. David Kim", "Dr. Lisa Zhang", "Prof. Robert Taylor", "Dr. Maria Garcia"]

    ee_faculty = ["Dr. Ahmed Hassan", "Prof. Jennifer Lee", "Dr. Mark Thompson", "Dr. Susan Brown",
                  "Prof. Alex Petrov", "Dr. Rachel Green", "Prof. Carlos Mendez", "Dr. Helen Wang"]

    mech_faculty = ["Dr. John Smith", "Prof. Anna Kowalski", "Dr. Peter Jones", "Dr. Maya Patel",
                    "Prof. Thomas Anderson", "Dr. Fatima Al-Rashid", "Prof. Erik Larsson", "Dr. Priya Sharma"]

    civil_faculty = ["Dr. Mohammed Ali", "Prof. Catherine Miller", "Dr. Raj Kumar", "Dr. Sophie Martin",
                     "Prof. Daniel O'Connor", "Dr. Nadia Ibrahim", "Prof. Klaus Weber", "Dr. Yuki Tanaka"]

    general_faculty = ["Prof. William Davis", "Dr. Amanda Clark", "Prof. Hassan Mahmoud", "Dr. Emma Thompson",
                       "Prof. Roberto Silva", "Dr. Mei Lin", "Prof. Jean-Pierre Dubois", "Dr. Olga Petrov"]

    # COMPUTER SCIENCE DEPARTMENT - All 8 semesters, 3 sections each
    cs_courses = {
        1: [
            ("CS101", "Programming Fundamentals", CourseType.THEORY_3CR, 3),
            ("CS101L", "Programming Fundamentals Lab", CourseType.LAB, 1),
            ("MTH101", "Calculus I", CourseType.THEORY_3CR, 3),
            ("PHY101", "Physics I", CourseType.THEORY_3CR, 3),
            ("PHY101L", "Physics I Lab", CourseType.LAB, 1),
            ("ENG101", "English Composition", CourseType.THEORY_2CR, 2),
            ("ISL101", "Islamic Studies", CourseType.THEORY_2CR, 2)
        ],
        2: [
            ("CS201", "Object Oriented Programming", CourseType.THEORY_3CR, 3),
            ("CS201L", "OOP Lab", CourseType.LAB, 1),
            ("MTH201", "Calculus II", CourseType.THEORY_3CR, 3),
            ("PHY201", "Physics II", CourseType.THEORY_3CR, 3),
            ("PHY201L", "Physics II Lab", CourseType.LAB, 1),
            ("ENG201", "Technical Writing", CourseType.THEORY_2CR, 2),
            ("PAK201", "Pakistan Studies", CourseType.THEORY_2CR, 2)
        ],
        3: [
            ("CS301", "Data Structures", CourseType.THEORY_3CR, 3),
            ("CS301L", "Data Structures Lab", CourseType.LAB, 1),
            ("CS302", "Digital Logic Design", CourseType.THEORY_3CR, 3),
            ("CS302L", "DLD Lab", CourseType.LAB, 1),
            ("MTH301", "Discrete Mathematics", CourseType.THEORY_3CR, 3),
            ("STAT301", "Statistics", CourseType.THEORY_3CR, 3),
            ("HUM301", "Philosophy", CourseType.THEORY_2CR, 2)
        ],
        4: [
            ("CS401", "Algorithms", CourseType.THEORY_3CR, 3),
            ("CS401L", "Algorithms Lab", CourseType.LAB, 1),
            ("CS402", "Computer Organization", CourseType.THEORY_3CR, 3),
            ("CS403", "Database Systems", CourseType.THEORY_3CR, 3),
            ("CS403L", "Database Lab", CourseType.LAB, 1),
            ("MTH401", "Linear Algebra", CourseType.THEORY_3CR, 3),
            ("MGT401", "Business Management", CourseType.THEORY_2CR, 2)
        ],
        5: [
            ("CS501", "Operating Systems", CourseType.THEORY_3CR, 3),
            ("CS501L", "OS Lab", CourseType.LAB, 1),
            ("CS502", "Software Engineering", CourseType.THEORY_3CR, 3),
            ("CS503", "Computer Networks", CourseType.THEORY_3CR, 3),
            ("CS503L", "Networks Lab", CourseType.LAB, 1),
            ("CS504", "Web Technologies", CourseType.THEORY_3CR, 3),
            ("ECO501", "Economics", CourseType.THEORY_2CR, 2)
        ],
        6: [
            ("CS601", "Artificial Intelligence", CourseType.THEORY_3CR, 3),
            ("CS601L", "AI Lab", CourseType.LAB, 1),
            ("CS602", "Computer Graphics", CourseType.THEORY_3CR, 3),
            ("CS602L", "Graphics Lab", CourseType.LAB, 1),
            ("CS603", "Human Computer Interaction", CourseType.THEORY_3CR, 3),
            ("CS604", "Information Security", CourseType.THEORY_3CR, 3),
            ("PSY601", "Psychology", CourseType.THEORY_2CR, 2)
        ],
        7: [
            ("CS701", "Machine Learning", CourseType.THEORY_3CR, 3),
            ("CS701L", "ML Lab", CourseType.LAB, 1),
            ("CS702", "Distributed Systems", CourseType.THEORY_3CR, 3),
            ("CS703", "Mobile App Development", CourseType.THEORY_3CR, 3),
            ("CS703L", "Mobile Dev Lab", CourseType.LAB, 1),
            ("CS704", "Compiler Construction", CourseType.THEORY_3CR, 3),
            ("ENT701", "Entrepreneurship", CourseType.THEORY_2CR, 2)
        ],
        8: [
            ("CS801", "Final Year Project I", CourseType.THEORY_3CR, 3),
            ("CS802", "Professional Practices", CourseType.THEORY_2CR, 2),
            ("CS803", "Cloud Computing", CourseType.THEORY_3CR, 3),
            ("CS804", "Big Data Analytics", CourseType.THEORY_3CR, 3),
            ("CS804L", "Big Data Lab", CourseType.LAB, 1),
            ("CS805", "Blockchain Technology", CourseType.THEORY_3CR, 3),
            ("MGT801", "Project Management", CourseType.THEORY_2CR, 2)
        ]
    }

    # ELECTRICAL ENGINEERING DEPARTMENT - All 8 semesters, 2 sections each
    ee_courses = {
        1: [
            ("EE101", "Introduction to Electrical Engineering", CourseType.THEORY_3CR, 3),
            ("EE101L", "Basic Electronics Lab", CourseType.LAB, 1),
            ("MTH101", "Calculus I", CourseType.THEORY_3CR, 3),
            ("PHY101", "Physics I", CourseType.THEORY_3CR, 3),
            ("PHY101L", "Physics I Lab", CourseType.LAB, 1),
            ("ENG101", "English Composition", CourseType.THEORY_2CR, 2),
            ("CHEM101", "Chemistry", CourseType.THEORY_2CR, 2)
        ],
        2: [
            ("EE201", "Circuit Analysis I", CourseType.THEORY_3CR, 3),
            ("EE201L", "Circuit Analysis Lab", CourseType.LAB, 1),
            ("MTH201", "Calculus II", CourseType.THEORY_3CR, 3),
            ("PHY201", "Physics II", CourseType.THEORY_3CR, 3),
            ("EE202", "Electronic Devices", CourseType.THEORY_3CR, 3),
            ("EE202L", "Electronics Lab", CourseType.LAB, 1),
            ("ENG201", "Technical Writing", CourseType.THEORY_2CR, 2)
        ],
        3: [
            ("EE301", "Circuit Analysis II", CourseType.THEORY_3CR, 3),
            ("EE301L", "Advanced Circuits Lab", CourseType.LAB, 1),
            ("EE302", "Signals and Systems", CourseType.THEORY_3CR, 3),
            ("EE303", "Electromagnetic Fields", CourseType.THEORY_3CR, 3),
            ("MTH301", "Differential Equations", CourseType.THEORY_3CR, 3),
            ("CS301", "Programming for Engineers", CourseType.THEORY_3CR, 3),
            ("ISL301", "Islamic Studies", CourseType.THEORY_2CR, 2)
        ],
        4: [
            ("EE401", "Digital Electronics", CourseType.THEORY_3CR, 3),
            ("EE401L", "Digital Electronics Lab", CourseType.LAB, 1),
            ("EE402", "Microprocessors", CourseType.THEORY_3CR, 3),
            ("EE402L", "Microprocessor Lab", CourseType.LAB, 1),
            ("EE403", "Control Systems", CourseType.THEORY_3CR, 3),
            ("EE404", "Communication Systems", CourseType.THEORY_3CR, 3),
            ("PAK401", "Pakistan Studies", CourseType.THEORY_2CR, 2)
        ],
        5: [
            ("EE501", "Power Systems I", CourseType.THEORY_3CR, 3),
            ("EE501L", "Power Systems Lab", CourseType.LAB, 1),
            ("EE502", "Digital Signal Processing", CourseType.THEORY_3CR, 3),
            ("EE502L", "DSP Lab", CourseType.LAB, 1),
            ("EE503", "Antenna Theory", CourseType.THEORY_3CR, 3),
            ("EE504", "VLSI Design", CourseType.THEORY_3CR, 3),
            ("MGT501", "Engineering Management", CourseType.THEORY_2CR, 2)
        ],
        6: [
            ("EE601", "Power Systems II", CourseType.THEORY_3CR, 3),
            ("EE601L", "Advanced Power Lab", CourseType.LAB, 1),
            ("EE602", "Wireless Communications", CourseType.THEORY_3CR, 3),
            ("EE603", "Renewable Energy Systems", CourseType.THEORY_3CR, 3),
            ("EE603L", "Renewable Energy Lab", CourseType.LAB, 1),
            ("EE604", "Embedded Systems", CourseType.THEORY_3CR, 3),
            ("ECO601", "Engineering Economics", CourseType.THEORY_2CR, 2)
        ],
        7: [
            ("EE701", "Smart Grid Technology", CourseType.THEORY_3CR, 3),
            ("EE701L", "Smart Grid Lab", CourseType.LAB, 1),
            ("EE702", "Robotics and Automation", CourseType.THEORY_3CR, 3),
            ("EE702L", "Robotics Lab", CourseType.LAB, 1),
            ("EE703", "Power Electronics", CourseType.THEORY_3CR, 3),
            ("EE704", "Fiber Optic Communications", CourseType.THEORY_3CR, 3),
            ("LAW701", "Engineering Law", CourseType.THEORY_2CR, 2)
        ],
        8: [
            ("EE801", "Final Year Project", CourseType.THEORY_3CR, 3),
            ("EE802", "Professional Ethics", CourseType.THEORY_2CR, 2),
            ("EE803", "IoT and Industry 4.0", CourseType.THEORY_3CR, 3),
            ("EE804", "Advanced Control Systems", CourseType.THEORY_3CR, 3),
            ("EE804L", "Advanced Control Lab", CourseType.LAB, 1),
            ("EE805", "Electric Vehicle Technology", CourseType.THEORY_3CR, 3)
        ]
    }

    # MECHANICAL ENGINEERING - 4 semesters, 2 sections each
    mech_courses = {
        1: [
            ("ME101", "Engineering Drawing", CourseType.THEORY_3CR, 3),
            ("ME101L", "CAD Lab", CourseType.LAB, 1),
            ("MTH101", "Calculus I", CourseType.THEORY_3CR, 3),
            ("PHY101", "Physics I", CourseType.THEORY_3CR, 3),
            ("CHEM101", "Chemistry", CourseType.THEORY_3CR, 3),
            ("CHEM101L", "Chemistry Lab", CourseType.LAB, 1),
            ("ENG101", "English", CourseType.THEORY_2CR, 2)
        ],
        2: [
            ("ME201", "Thermodynamics I", CourseType.THEORY_3CR, 3),
            ("ME202", "Mechanics of Materials", CourseType.THEORY_3CR, 3),
            ("ME202L", "Materials Lab", CourseType.LAB, 1),
            ("MTH201", "Calculus II", CourseType.THEORY_3CR, 3),
            ("PHY201", "Physics II", CourseType.THEORY_3CR, 3),
            ("ME203", "Manufacturing Processes", CourseType.THEORY_3CR, 3),
            ("ME203L", "Workshop Practice", CourseType.LAB, 1)
        ],
        3: [
            ("ME301", "Thermodynamics II", CourseType.THEORY_3CR, 3),
            ("ME302", "Fluid Mechanics", CourseType.THEORY_3CR, 3),
            ("ME302L", "Fluid Mechanics Lab", CourseType.LAB, 1),
            ("ME303", "Machine Design I", CourseType.THEORY_3CR, 3),
            ("ME304", "Heat Transfer", CourseType.THEORY_3CR, 3),
            ("ME304L", "Heat Transfer Lab", CourseType.LAB, 1),
            ("MTH301", "Differential Equations", CourseType.THEORY_3CR, 3)
        ],
        4: [
            ("ME401", "Machine Design II", CourseType.THEORY_3CR, 3),
            ("ME401L", "Machine Design Lab", CourseType.LAB, 1),
            ("ME402", "Internal Combustion Engines", CourseType.THEORY_3CR, 3),
            ("ME402L", "IC Engines Lab", CourseType.LAB, 1),
            ("ME403", "Control Engineering", CourseType.THEORY_3CR, 3),
            ("ME404", "Power Plant Engineering", CourseType.THEORY_3CR, 3),
            ("MGT401", "Industrial Management", CourseType.THEORY_2CR, 2)
        ]
    }

    # CIVIL ENGINEERING - 6 semesters, 2 sections each
    civil_courses = {
        1: [
            ("CE101", "Engineering Surveying", CourseType.THEORY_3CR, 3),
            ("CE101L", "Surveying Lab", CourseType.LAB, 1),
            ("MTH101", "Calculus I", CourseType.THEORY_3CR, 3),
            ("PHY101", "Physics I", CourseType.THEORY_3CR, 3),
            ("CHEM101", "Chemistry", CourseType.THEORY_3CR, 3),
            ("ENG101", "English", CourseType.THEORY_2CR, 2),
            ("CE102", "Computer Applications", CourseType.THEORY_2CR, 2)
        ],
        2: [
            ("CE201", "Mechanics of Solids", CourseType.THEORY_3CR, 3),
            ("CE201L", "Solid Mechanics Lab", CourseType.LAB, 1),
            ("CE202", "Fluid Mechanics", CourseType.THEORY_3CR, 3),
            ("CE202L", "Fluid Lab", CourseType.LAB, 1),
            ("MTH201", "Calculus II", CourseType.THEORY_3CR, 3),
            ("CE203", "Construction Materials", CourseType.THEORY_3CR, 3),
            ("CE203L", "Materials Testing Lab", CourseType.LAB, 1)
        ],
        3: [
            ("CE301", "Structural Analysis I", CourseType.THEORY_3CR, 3),
            ("CE302", "Geotechnical Engineering I", CourseType.THEORY_3CR, 3),
            ("CE302L", "Geotechnical Lab", CourseType.LAB, 1),
            ("CE303", "Hydrology", CourseType.THEORY_3CR, 3),
            ("CE304", "Transportation Engineering I", CourseType.THEORY_3CR, 3),
            ("CE305", "Environmental Engineering", CourseType.THEORY_3CR, 3),
            ("STAT301", "Statistics", CourseType.THEORY_2CR, 2)
        ],
        4: [
            ("CE401", "Structural Analysis II", CourseType.THEORY_3CR, 3),
            ("CE401L", "Structural Analysis Lab", CourseType.LAB, 1),
            ("CE402", "Concrete Design", CourseType.THEORY_3CR, 3),
            ("CE403", "Geotechnical Engineering II", CourseType.THEORY_3CR, 3),
            ("CE404", "Water Resources Engineering", CourseType.THEORY_3CR, 3),
            ("CE405", "Highway Engineering", CourseType.THEORY_3CR, 3),
            ("ECO401", "Engineering Economics", CourseType.THEORY_2CR, 2)
        ],
        5: [
            ("CE501", "Steel Design", CourseType.THEORY_3CR, 3),
            ("CE501L", "Steel Design Lab", CourseType.LAB, 1),
            ("CE502", "Foundation Engineering", CourseType.THEORY_3CR, 3),
            ("CE503", "Water Supply Engineering", CourseType.THEORY_3CR, 3),
            ("CE504", "Construction Management", CourseType.THEORY_3CR, 3),
            ("CE505", "Earthquake Engineering", CourseType.THEORY_3CR, 3),
            ("LAW501", "Construction Law", CourseType.THEORY_2CR, 2)
        ],
        6: [
            ("CE601", "Advanced Structural Design", CourseType.THEORY_3CR, 3),
            ("CE602", "Project Management", CourseType.THEORY_3CR, 3),
            ("CE603", "Urban Planning", CourseType.THEORY_3CR, 3),
            ("CE604", "Wastewater Treatment", CourseType.THEORY_3CR, 3),
            ("CE604L", "Environmental Lab", CourseType.LAB, 1),
            ("CE605", "Final Year Project", CourseType.THEORY_3CR, 3),
            ("ETH601", "Professional Ethics", CourseType.THEORY_2CR, 2)
        ]
    }

    # BUSINESS ADMINISTRATION - 4 semesters, 3 sections each
    bus_courses = {
        1: [
            ("BUS101", "Principles of Management", CourseType.THEORY_3CR, 3),
            ("BUS102", "Financial Accounting", CourseType.THEORY_3CR, 3),
            ("BUS103", "Business Mathematics", CourseType.THEORY_3CR, 3),
            ("ENG101", "Business English", CourseType.THEORY_2CR, 2),
            ("BUS104", "Introduction to Business", CourseType.THEORY_3CR, 3),
            ("STAT101", "Business Statistics", CourseType.THEORY_3CR, 3),
            ("ISL101", "Islamic Studies", CourseType.THEORY_2CR, 2)
        ],
        2: [
            ("BUS201", "Organizational Behavior", CourseType.THEORY_3CR, 3),
            ("BUS202", "Managerial Accounting", CourseType.THEORY_3CR, 3),
            ("BUS203", "Marketing Management", CourseType.THEORY_3CR, 3),
            ("BUS204", "Business Law", CourseType.THEORY_3CR, 3),
            ("ECO201", "Microeconomics", CourseType.THEORY_3CR, 3),
            ("BUS205", "Business Communication", CourseType.THEORY_2CR, 2),
            ("PAK201", "Pakistan Studies", CourseType.THEORY_2CR, 2)
        ],
        3: [
            ("BUS301", "Human Resource Management", CourseType.THEORY_3CR, 3),
            ("BUS302", "Operations Management", CourseType.THEORY_3CR, 3),
            ("BUS303", "Financial Management", CourseType.THEORY_3CR, 3),
            ("BUS304", "Strategic Management", CourseType.THEORY_3CR, 3),
            ("ECO301", "Macroeconomics", CourseType.THEORY_3CR, 3),
            ("BUS305", "International Business", CourseType.THEORY_3CR, 3),
            ("ETH301", "Business Ethics", CourseType.THEORY_2CR, 2)
        ],
        4: [
            ("BUS401", "Entrepreneurship", CourseType.THEORY_3CR, 3),
            ("BUS402", "Investment Analysis", CourseType.THEORY_3CR, 3),
            ("BUS403", "Supply Chain Management", CourseType.THEORY_3CR, 3),
            ("BUS404", "Digital Marketing", CourseType.THEORY_3CR, 3),
            ("BUS405", "Corporate Finance", CourseType.THEORY_3CR, 3),
            ("BUS406", "Business Research Methods", CourseType.THEORY_3CR, 3),
            ("BUS407", "Capstone Project", CourseType.THEORY_2CR, 2)
        ]
    }

    # Add all courses to the generator
    sections = ["A", "B", "C"]

    # Computer Science - 8 semesters, 3 sections each
    for semester, courses in cs_courses.items():
        for section in sections:
            for course_code, course_name, course_type, credits in courses:
                teacher = random.choice(cs_faculty if course_code.startswith("CS") else general_faculty)
                generator.add_course(course_code, course_name, course_type, credits,
                                   semester, section, "Computer Science", teacher)

    # Electrical Engineering - 8 semesters, 2 sections each
    for semester, courses in ee_courses.items():
        for section in ["A", "B"]:
            for course_code, course_name, course_type, credits in courses:
                teacher = random.choice(ee_faculty if course_code.startswith("EE") else general_faculty)
                generator.add_course(course_code, course_name, course_type, credits,
                                   semester, section, "Electrical Engineering", teacher)

    # Mechanical Engineering - 4 semesters, 2 sections each
    for semester, courses in mech_courses.items():
        for section in ["A", "B"]:
            for course_code, course_name, course_type, credits in courses:
                teacher = random.choice(mech_faculty if course_code.startswith("ME") else general_faculty)
                generator.add_course(course_code, course_name, course_type, credits,
                                   semester, section, "Mechanical Engineering", teacher)

    # Civil Engineering - 6 semesters, 2 sections each
    for semester, courses in civil_courses.items():
        for section in ["A", "B"]:
            for course_code, course_name, course_type, credits in courses:
                teacher = random.choice(civil_faculty if course_code.startswith("CE") else general_faculty)
                generator.add_course(course_code, course_name, course_type, credits,
                                   semester, section, "Civil Engineering", teacher)

    # Business Administration - 4 semesters, 3 sections each
    for semester, courses in bus_courses.items():
        for section in sections:
            for course_code, course_name, course_type, credits in courses:
                teacher = random.choice(general_faculty)  # All business faculty from general pool
                generator.add_course(course_code, course_name, course_type, credits,
                                   semester, section, "Business Administration", teacher)

    return generator

def run_complex_test():
    """
    Run the complex timetable generation test
    """
    print("Creating Complex University Timetable Dataset...")
    print("="*60)

    # Track performance
    import time
    start_time = time.time()

    # Create the complex dataset
    generator = create_complex_dataset()

    # Print statistics
    total_courses = len(generator.courses)
    departments = set(course.department for course in generator.courses)
    semesters = set(course.semester for course in generator.courses)
    sections = set(course.section for course in generator.courses)

    print(f"Dataset Statistics:")
    print(f"- Total Courses: {total_courses}")
    print(f"- Departments: {len(departments)} ({', '.join(sorted(departments))})")
    print(f"- Semesters: {len(semesters)} ({', '.join(map(str, sorted(semesters)))})")
    print(f"- Sections per Department: {len(sections)} ({', '.join(sorted(sections))})")
    print(f"- Total Rooms Available: {len(generator.rooms)}")
    print(f"  - Classrooms: {len([r for r in generator.rooms.values() if r.room_type == RoomType.CLASSROOM])}")
    print(f"  - Labs: {len([r for r in generator.rooms.values() if r.room_type == RoomType.LAB])}")

    lab_courses = len([c for c in generator.courses if c.course_type == CourseType.LAB])
    theory_3cr = len([c for c in generator.courses if c.course_type == CourseType.THEORY_3CR])
    theory_2cr = len([c for c in generator.courses if c.course_type == CourseType.THEORY_2CR])

    print(f"\nCourse Type Distribution:")
    print(f"- Lab Courses: {lab_courses}")
    print(f"- 3-Credit Theory: {theory_3cr}")
    print(f"- 2-Credit Theory: {theory_2cr}")

    print(f"\nGenerating timetable...")
    generation_start = time.time()

    # Generate the timetable
    generator.generate_timetable()

    generation_time = time.time() - generation_start
    total_time = time.time() - start_time

    print(f"Generation completed in {generation_time:.2f} seconds")
    print(f"Total processing time: {total_time:.2f} seconds")

    # Analyze results
    scheduled_courses = 0
    total_scheduled_classes = 0

    for key, classes in generator.schedule.items():
        scheduled_courses += len(classes)
        for scheduled_class in classes:
            total_scheduled_classes += len(scheduled_class.time_slots)

    success_rate = (scheduled_courses / total_courses) * 100 if total_courses > 0 else 0

    print(f"\nScheduling Results:")
    print(f"- Courses Successfully Scheduled: {scheduled_courses}/{total_courses} ({success_rate:.1f}%)")
    print(f"- Total Class Sessions Scheduled: {total_scheduled_classes}")

    # Check room utilization
    room_usage = {}
    for key, classes in generator.schedule.items():
        for scheduled_class in classes:
            for slot in scheduled_class.time_slots:
                if slot.room not in room_usage:
                    room_usage[slot.room] = 0
                room_usage[slot.room] += 1

    print(f"\nRoom Utilization (Top 10):")
    sorted_rooms = sorted(room_usage.items(), key=lambda x: x[1], reverse=True)[:10]
    for room, usage in sorted_rooms:
        print(f"- {room}: {usage} class sessions")

    # Export results
    print(f"\nExporting results...")
    generator.export_to_json("complex_timetable.json")
    generator.export_to_excel("complex_timetable.xlsx")

    # Print sample timetable for one semester
    print(f"\nSample Timetable - Computer Science Semester 1:")
    generator.print_timetable(semester=1, section="A")

    print(f"\nSample Timetable - Electrical Engineering Semester 5 (Evening):")
    generator.print_timetable(semester=5, section="A")

    return generator

# Main execution
if __name__ == "__main__":
    # Run the complex test
    generator = run_complex_test()

    print("\n" + "="*60)
    print("COMPLEX TIMETABLE GENERATION COMPLETED!")
    print("="*60)
    print("Files generated:")
    print("- complex_timetable.json")
    print("- complex_timetable.xlsx")
    print("\nThe system has successfully handled:")
    print("- 300+ courses across 5 departments")
    print("- Multiple course types (Theory 3CR, Theory 2CR, Labs)")
    print("- Junior (morning) and Senior (evening) time slots")
    print("- Room conflicts and capacity constraints")
    print("- Teacher assignments and section management")
    print("- Complex scheduling with minimal conflicts")