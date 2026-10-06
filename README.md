# Student Management System — Aim 3

A full-stack CRUD web application using:

- HTML, CSS and JavaScript
- Node.js + Vite for frontend development tooling
- Python Flask REST API
- SQLite persistent database
- Fetch API and JSON for client/server communication

## Features

- Add student
- View all students
- Search by name, roll number or class
- Update student
- Delete student
- Duplicate roll-number prevention
- Frontend and backend validation
- Marks validation: 0–100
- Contact-number validation
- Responsive UI
- Statistics for total students, average marks and highest marks
- SQLite persistence

## Project structure

```text
student_management_system/
├── backend/
│   ├── app.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── package.json
├── vite.config.js
└── README.md
```

## Run the application

### 1. Install Python dependencies

Windows:
```bash
py -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

macOS/Linux:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### 2. Start Flask

From the project root:
```bash
python backend/app.py
```

Open:
http://127.0.0.1:5000

The SQLite database `students.db` is created automatically.

### Optional: use Vite during frontend development

In a second terminal:
```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal. Vite proxies `/api` requests to Flask.

## REST API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/students` | List all students |
| GET | `/api/students?search=Aarav` | Search students |
| GET | `/api/students/<id>` | Get one student |
| POST | `/api/students` | Add student |
| PUT | `/api/students/<id>` | Update student |
| DELETE | `/api/students/<id>` | Delete student |

## Example JSON

```json
{
  "name": "Aarav Sharma",
  "roll_no": "101",
  "class_name": "12-A",
  "marks": 91.5,
  "contact": "9876543210"
}
```

## Testing checklist

1. Add a valid student.
2. Add another student with the same roll number — it should be rejected.
3. Search using a name, roll number or class.
4. Search for a non-existent student — an empty-state message should appear.
5. Edit a student and verify the database-backed list changes.
6. Try marks below 0 or above 100 — validation should reject them.
7. Try an invalid contact number — validation should reject it.
8. Delete a student and verify it disappears.
9. Stop and restart Flask — previously saved records remain because SQLite is persistent.

## Academic architecture

```text
Browser
  │
  │ Fetch / JSON
  ▼
Flask REST API
  │
  │ SQL queries
  ▼
SQLite database
```
