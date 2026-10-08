from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
from pathlib import Path
import re

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "students.db"
FRONTEND_DIR = BASE_DIR / "frontend"

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
CORS(app)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                roll_no TEXT NOT NULL UNIQUE,
                class_name TEXT NOT NULL,
                marks REAL NOT NULL CHECK(marks >= 0 AND marks <= 100),
                contact TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

def validate_student(data):
    required = ["name", "roll_no", "class_name", "marks", "contact"]
    for field in required:
        if field not in data or str(data[field]).strip() == "":
            return f"{field.replace('_', ' ').title()} is required."

    name = str(data["name"]).strip()
    roll_no = str(data["roll_no"]).strip()
    class_name = str(data["class_name"]).strip()
    contact = str(data["contact"]).strip()

    try:
        marks = float(data["marks"])
    except (ValueError, TypeError):
        return "Marks must be a number."

    if len(name) < 2 or len(name) > 80:
        return "Name must be between 2 and 80 characters."
    if len(roll_no) > 30:
        return "Roll number is too long."
    if len(class_name) > 40:
        return "Class is too long."
    if marks < 0 or marks > 100:
        return "Marks must be between 0 and 100."
    if not re.fullmatch(r"[0-9+\-\s()]{7,20}", contact):
        return "Enter a valid contact number."

    return None

@app.get("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.get("/api/students")
def list_students():
    search = request.args.get("search", "").strip()
    with get_db() as conn:
        if search:
            rows = conn.execute("""
                SELECT * FROM students
                WHERE name LIKE ? OR roll_no LIKE ? OR class_name LIKE ?
                ORDER BY id DESC
            """, (f"%{search}%", f"%{search}%", f"%{search}%")).fetchall()
        else:
            rows = conn.execute("SELECT * FROM students ORDER BY id DESC").fetchall()
    return jsonify([dict(row) for row in rows])

@app.get("/api/students/<int:student_id>")
def get_student(student_id):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    if not row:
        return jsonify({"error": "Student not found."}), 404
    return jsonify(dict(row))

@app.post("/api/students")
def add_student():
    data = request.get_json(silent=True) or {}
    error = validate_student(data)
    if error:
        return jsonify({"error": error}), 400

    try:
        with get_db() as conn:
            cursor = conn.execute("""
                INSERT INTO students (name, roll_no, class_name, marks, contact)
                VALUES (?, ?, ?, ?, ?)
            """, (
                str(data["name"]).strip(),
                str(data["roll_no"]).strip(),
                str(data["class_name"]).strip(),
                float(data["marks"]),
                str(data["contact"]).strip()
            ))
            conn.commit()
            row = conn.execute("SELECT * FROM students WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return jsonify(dict(row)), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Roll number already exists."}), 409

@app.put("/api/students/<int:student_id>")
def update_student(student_id):
    data = request.get_json(silent=True) or {}
    error = validate_student(data)
    if error:
        return jsonify({"error": error}), 400

    try:
        with get_db() as conn:
            exists = conn.execute("SELECT id FROM students WHERE id = ?", (student_id,)).fetchone()
            if not exists:
                return jsonify({"error": "Student not found."}), 404

            conn.execute("""
                UPDATE students
                SET name = ?, roll_no = ?, class_name = ?, marks = ?, contact = ?
                WHERE id = ?
            """, (
                str(data["name"]).strip(),
                str(data["roll_no"]).strip(),
                str(data["class_name"]).strip(),
                float(data["marks"]),
                str(data["contact"]).strip(),
                student_id
            ))
            conn.commit()
            row = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
        return jsonify(dict(row))
    except sqlite3.IntegrityError:
        return jsonify({"error": "Roll number already exists."}), 409

@app.delete("/api/students/<int:student_id>")
def delete_student(student_id):
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM students WHERE id = ?", (student_id,))
        conn.commit()
    if cursor.rowcount == 0:
        return jsonify({"error": "Student not found."}), 404
    return jsonify({"message": "Student deleted successfully."})

if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="127.0.0.1", port=5000)
