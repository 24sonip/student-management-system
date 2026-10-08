const API = "/api/students";

const form = document.getElementById("studentForm");
const studentId = document.getElementById("studentId");
const nameInput = document.getElementById("name");
const rollNoInput = document.getElementById("rollNo");
const classInput = document.getElementById("className");
const marksInput = document.getElementById("marks");
const contactInput = document.getElementById("contact");
const tableBody = document.getElementById("studentTableBody");
const emptyState = document.getElementById("emptyState");
const message = document.getElementById("message");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const submitBtn = document.getElementById("submitBtn");
const formTitle = document.getElementById("formTitle");
const cancelEditBtn = document.getElementById("cancelEditBtn");

let students = [];

function showMessage(text, type = "") {
  message.textContent = text;
  message.className = `message ${type}`;
  if (text) setTimeout(() => {
    message.textContent = "";
    message.className = "message";
  }, 3500);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function updateStats() {
  const count = students.length;
  const avg = count ? students.reduce((sum, s) => sum + Number(s.marks), 0) / count : 0;
  const high = count ? Math.max(...students.map(s => Number(s.marks))) : 0;
  document.getElementById("totalCount").textContent = count;
  document.getElementById("avgMarks").textContent = avg.toFixed(1);
  document.getElementById("highMarks").textContent = high.toFixed(1);
}

function renderStudents() {
  tableBody.innerHTML = "";
  emptyState.classList.toggle("hidden", students.length !== 0);

  students.forEach(student => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${escapeHtml(student.name)}</strong></td>
      <td>${escapeHtml(student.roll_no)}</td>
      <td>${escapeHtml(student.class_name)}</td>
      <td>${Number(student.marks).toFixed(2)}</td>
      <td>${escapeHtml(student.contact)}</td>
      <td>
        <div class="actions">
          <button class="secondary" onclick="editStudent(${student.id})">Edit</button>
          <button class="danger" onclick="deleteStudent(${student.id})">Delete</button>
        </div>
      </td>`;
    tableBody.appendChild(row);
  });
  updateStats();
}

async function loadStudents() {
  try {
    const search = encodeURIComponent(searchInput.value.trim());
    const response = await fetch(`${API}?search=${search}`);
    if (!response.ok) throw new Error("Unable to load student records.");
    students = await response.json();
    renderStudents();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

function getFormData() {
  return {
    name: nameInput.value.trim(),
    roll_no: rollNoInput.value.trim(),
    class_name: classInput.value.trim(),
    marks: marksInput.value,
    contact: contactInput.value.trim()
  };
}

function validateClient(data) {
  if (!data.name || !data.roll_no || !data.class_name || !data.marks || !data.contact)
    return "Please fill in all fields.";
  if (Number(data.marks) < 0 || Number(data.marks) > 100)
    return "Marks must be between 0 and 100.";
  if (!/^[0-9+\-\s()]{7,20}$/.test(data.contact))
    return "Enter a valid contact number.";
  return "";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = getFormData();
  const validationError = validateClient(data);
  if (validationError) return showMessage(validationError, "error");

  const id = studentId.value;
  const method = id ? "PUT" : "POST";
  const url = id ? `${API}/${id}` : API;

  submitBtn.disabled = true;
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Operation failed.");

    showMessage(id ? "Student updated successfully." : "Student added successfully.", "success");
    resetForm();
    await loadStudents();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    submitBtn.disabled = false;
  }
});

window.editStudent = function(id) {
  const student = students.find(s => s.id === id);
  if (!student) return;

  studentId.value = student.id;
  nameInput.value = student.name;
  rollNoInput.value = student.roll_no;
  classInput.value = student.class_name;
  marksInput.value = student.marks;
  contactInput.value = student.contact;

  formTitle.textContent = "Edit Student";
  submitBtn.textContent = "Update Student";
  cancelEditBtn.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.deleteStudent = async function(id) {
  const student = students.find(s => s.id === id);
  if (!student || !confirm(`Delete ${student.name}'s record?`)) return;

  try {
    const response = await fetch(`${API}/${id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Delete failed.");
    showMessage("Student deleted successfully.", "success");
    await loadStudents();
  } catch (error) {
    showMessage(error.message, "error");
  }
};

function resetForm() {
  form.reset();
  studentId.value = "";
  formTitle.textContent = "Add New Student";
  submitBtn.textContent = "Add Student";
  cancelEditBtn.classList.add("hidden");
}

cancelEditBtn.addEventListener("click", resetForm);

let searchTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadStudents, 250);
});

clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  loadStudents();
});

loadStudents();
