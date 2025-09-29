from flask import Flask, request, jsonify
from flask_cors import CORS

from server import UniversityTimetableGenerator, CourseType, RoomType


app = Flask(__name__)
CORS(app)


def parse_course_type(type_str: str, credit_hours: int) -> CourseType:
    if type_str:
        normalized = type_str.strip().upper()
        if normalized == "LAB":
            return CourseType.LAB
        if normalized in ("THEORY", "THEORY_3", "THEORY_3CR"):
            return CourseType.THEORY_3CR
        if normalized in ("THEORY_2", "THEORY_2CR"):
            return CourseType.THEORY_2CR

    # Fallback based on credit hours
    if credit_hours == 3:
        return CourseType.THEORY_3CR
    if credit_hours == 2:
        return CourseType.THEORY_2CR
    # default to 3CR theory
    return CourseType.THEORY_3CR


@app.route("/api/health", methods=["GET"])
def health() -> tuple:
    return jsonify({"status": "ok"}), 200


@app.route("/api/generate-timetable", methods=["POST"])
def generate_timetable():
    try:
        payload = request.get_json(force=True)
    except Exception:
        return jsonify({"error": "Invalid JSON"}), 400

    try:
        # Expected payload structure:
        # {
        #   rooms: { general: [str], labs: [str], nb: [str] },
        #   departments: [
        #     { name, program, semester(int), section(str), workingDays: [str], courses: [ { code,name,creditHours(int),teacher,type } ] }
        #   ]
        # }

        generator = UniversityTimetableGenerator()

        # Override days based on union of workingDays if provided
        all_days = set()
        for dept in payload.get("departments", []):
            for d in dept.get("workingDays", []):
                all_days.add(d.capitalize())
        if all_days:
            # Map to title case to match internal comparison (e.g., "Monday")
            generator.days = [
                day for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
                if day in all_days
            ]

        # Override rooms
        rooms_obj = payload.get("rooms", {})
        general_rooms = rooms_obj.get("general", []) + rooms_obj.get("nb", [])
        lab_rooms = rooms_obj.get("labs", [])

        # Reset and add custom rooms only if user provided any rooms
        if general_rooms or lab_rooms:
            generator.rooms = {}
            for r in general_rooms:
                if isinstance(r, str) and r.strip():
                    generator.add_custom_room(r.strip(), RoomType.CLASSROOM)
            for r in lab_rooms:
                if isinstance(r, str) and r.strip():
                    generator.add_custom_room(r.strip(), RoomType.LAB)

        # Keep a mapping to reconstruct program in response
        group_to_program = {}

        for dept in payload.get("departments", []):
            department_name = dept.get("name") or "Department"
            program_name = dept.get("program") or "Program"
            semester = int(dept.get("semester"))
            section = str(dept.get("section"))

            group_to_program[(semester, section, department_name)] = program_name

            for course in dept.get("courses", []):
                code = course.get("code", "")
                name = course.get("name", "")
                credit_hours = int(course.get("creditHours", 3))
                teacher = course.get("teacher")
                ctype = parse_course_type(course.get("type"), credit_hours)

                generator.add_course(
                    code=code,
                    name=name,
                    course_type=ctype,
                    credit_hours=credit_hours,
                    semester=semester,
                    section=section,
                    department=department_name,
                    teacher=teacher,
                )

        # Generate schedule
        generator.generate_timetable()

        # Build response to match frontend expectations
        result = {}
        for key, classes in generator.schedule.items():
            day, semester, section = key

            # We may have multiple departments for same semester/section; choose department from each class
            for scheduled_class in classes:
                dept_name = scheduled_class.course.department
                program_name = group_to_program.get((semester, section, dept_name), "Program")
                program_key = f"{dept_name} - {program_name} - Semester {semester} - Section {section}"

                if program_key not in result:
                    result[program_key] = []

                for slot in scheduled_class.time_slots:
                    if slot.day != day:
                        continue
                    result[program_key].append({
                        "time": f"{slot.start_time}-{slot.end_time}",
                        "day": day.lower(),
                        "code": scheduled_class.course.code,
                        "name": scheduled_class.course.name,
                        "room": slot.room,
                        "teacher": scheduled_class.course.teacher or "TBA",
                    })

        # Sort each schedule by time then day for consistency
        def time_key(item):
            try:
                hh, mm = item["time"].split("-")[0].split(":")
                return (int(hh), int(mm), item["day"]) 
            except Exception:
                return (0, 0, item.get("day", "monday"))

        for k in result.keys():
            result[k] = sorted(result[k], key=time_key)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Default dev server on port 5001
    app.run(host="0.0.0.0", port=5001, debug=True)


