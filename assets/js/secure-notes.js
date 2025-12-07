// Load notes from localStorage
function loadNotes() {
    const notes = JSON.parse(localStorage.getItem("secureNotes")) || [];
    const container = document.getElementById("notesContainer");
    container.innerHTML = "";

    notes.forEach((note, index) => {
        container.innerHTML += `
            <div class="note-card">
                <p class="mb-4">${note}</p>
                <div class="note-actions">
                    <button class="edit-btn" onclick="editNote(${index})">Edit</button>
                    <button class="delete-btn" onclick="deleteNote(${index})">Delete</button>
                </div>
            </div>
        `;
    });
}

// Add a new note
function addNote() {
    const input = document.getElementById("noteInput");
    const text = input.value.trim();

    if (text === "") {
        alert("Note cannot be empty.");
        return;
    }

    const notes = JSON.parse(localStorage.getItem("secureNotes")) || [];
    notes.push(text);
    localStorage.setItem("secureNotes", JSON.stringify(notes));

    input.value = "";
    loadNotes();
}

// Edit a note
function editNote(index) {
    const notes = JSON.parse(localStorage.getItem("secureNotes"));
    const updated = prompt("Edit your note:", notes[index]);

    if (updated !== null) {
        notes[index] = updated.trim();
        localStorage.setItem("secureNotes", JSON.stringify(notes));
        loadNotes();
    }
}

// Delete a note
function deleteNote(index) {
    const notes = JSON.parse(localStorage.getItem("secureNotes"));

    if (confirm("Are you sure you want to delete this note?")) {
        notes.splice(index, 1);
        localStorage.setItem("secureNotes", JSON.stringify(notes));
        loadNotes();
    }
}

loadNotes();
