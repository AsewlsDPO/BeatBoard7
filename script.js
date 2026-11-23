const defaultProjects = [
    { id: 1, name: "DARKNESS", bpm: 145, key: "D# minor", status: "In Progress", favorite: true },
    { id: 2, name: "NIGHT DRIVE", bpm: 140, key: "F minor", status: "Idea", favorite: false },
    { id: 3, name: "UNTITLED", bpm: 132, key: "C minor", status: "Idea", favorite: false },
    { id: 4, name: "AFTERLIFE", bpm: 150, key: "A minor", status: "Finished", favorite: true }
];

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
        console.error("Ошибка загрузки:", error);
        return fallback;
    }
}

let projects = loadData("bb-projects", defaultProjects);
let ideas = loadData("bb-ideas", []);
let activities = loadData("bb-activities", []);
let currentFilter = "All";
let currentPage = "home";

function saveData() {
    try {
        localStorage.setItem("bb-projects", JSON.stringify(projects));
        localStorage.setItem("bb-ideas", JSON.stringify(ideas));
        localStorage.setItem("bb-activities", JSON.stringify(activities));
    } catch (error) {
        alert("Не удалось сохранить данные браузера.");
        console.error(error);
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function addActivity(name, action) {
    activities.unshift({
        project: name,
        action,
        date: new Date().toLocaleString()
    });

    activities = activities.slice(0, 15);
}

function createWaveform() {
    let bars = "";

    for (let i = 0; i < 30; i++) {
        const height = Math.floor(Math.random() * 19) + 5;
        bars += `<span style="height:${height}px"></span>`;
    }

    return bars;
}

function projectCard(project) {
    const statusClass = project.status.replace(/\s+/g, "-");

    return `
        <article class="project-card">
            <div class="project-cover">
                <h3>${escapeHTML(project.name)}</h3>
                <div class="waveform">${createWaveform()}</div>
            </div>

            <div class="project-details">
                <div class="project-name-row">
                    <h3>${escapeHTML(project.name)}</h3>

                    <button
                        type="button"
                        class="favorite ${project.favorite ? "active" : ""}"
                        data-favorite="${project.id}"
                        title="Add to favorites">
                        ${project.favorite ? "★" : "☆"}
                    </button>
                </div>

                <p class="project-meta">
                    ${project.bpm} BPM · ${escapeHTML(project.key)}
                </p>

                <span class="status ${statusClass}">
                    ${escapeHTML(project.status)}
                </span>

                <div class="card-actions">
                    <button type="button" data-edit="${project.id}">Edit</button>
                    <button type="button" data-delete="${project.id}">Delete</button>
                </div>
            </div>
        </article>
    `;
}

function renderProjects() {
    const searchInput = document.getElementById("search-input");
    const search = searchInput.value.trim().toLowerCase();

    const filtered = projects.filter(project => {
        const matchesFilter =
            currentFilter === "All" || project.status === currentFilter;

        const matchesSearch =
            project.name.toLowerCase().includes(search) ||
            project.key.toLowerCase().includes(search) ||
            String(project.bpm).includes(search);

        return matchesFilter && matchesSearch;
    });

    const cards = filtered.length
        ? filtered.map(projectCard).join("")
        : `<div class="empty-state">No projects found.</div>`;

    document.getElementById("project-grid").innerHTML = cards;
    document.getElementById("all-projects-grid").innerHTML = cards;

    const favorites = projects.filter(project =>
        project.favorite &&
        (
            project.name.toLowerCase().includes(search) ||
            project.key.toLowerCase().includes(search) ||
            String(project.bpm).includes(search)
        )
    );

    document.getElementById("favorites-grid").innerHTML =
        favorites.length
            ? favorites.map(projectCard).join("")
            : `<div class="empty-state">No favorites yet.</div>`;

    updateStatistics();
}

function updateStatistics() {
    document.getElementById("project-count").textContent =
        `${projects.length} projects`;

    document.getElementById("ideas-count").textContent = ideas.length;

    document.getElementById("progress-count").textContent =
        projects.filter(p => p.status === "In Progress").length;

    document.getElementById("finished-count").textContent =
        projects.filter(p => p.status === "Finished").length;
}

function renderActivities() {
    const container = document.getElementById("activity-list");

    container.innerHTML = activities.length
        ? activities.map(activity => `
            <div class="activity-item">
                <span class="activity-dot"></span>
                <strong>${escapeHTML(activity.project)}</strong>
                <span>${escapeHTML(activity.action)}</span>
            </div>
        `).join("")
        : `<div class="empty-state">No recent activity.</div>`;
}

function renderIdeas() {
    const container = document.getElementById("ideas-list");

    container.innerHTML = ideas.length
        ? ideas.map((idea, index) => `
            <div class="idea-item">
                <span>${escapeHTML(idea)}</span>
                <button type="button" data-delete-idea="${index}">×</button>
            </div>
        `).join("")
        : `<div class="empty-state">No ideas yet.</div>`;
}

function renderAll() {
    renderProjects();
    renderActivities();
    renderIdeas();
}

// ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ

function showPage(page) {
    const target = document.getElementById(`${page}-page`);

    if (!target) return;

    currentPage = page;

    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active");
    });

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });

    target.classList.add("active");

    const titles = {
        home: "Good evening, Snowy",
        projects: "Your projects",
        ideas: "Your ideas",
        favorites: "Your favorites"
    };

    document.getElementById("page-title").textContent = titles[page] || "BeatBoard";
}

document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

// ФИЛЬТРЫ

document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        document.querySelectorAll(".filter").forEach(filter => {
            filter.classList.toggle("active", filter === button);
        });

        renderProjects();
    });
});

// ПОИСК

document.getElementById("search-input").addEventListener("input", () => {
    renderProjects();
});

// МОДАЛЬНОЕ ОКНО

function openProjectModal() {
    document.getElementById("project-modal").classList.add("open");
    document.getElementById("beat-name").focus();
}

function closeProjectModal() {
    document.getElementById("project-modal").classList.remove("open");
}

document.getElementById("new-project-button").addEventListener("click", openProjectModal);
document.getElementById("new-project-button-2").addEventListener("click", openProjectModal);
document.getElementById("close-modal").addEventListener("click", closeProjectModal);

document.getElementById("project-modal").addEventListener("click", event => {
    if (event.target.id === "project-modal") {
        closeProjectModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeProjectModal();
    }
});

// СОЗДАНИЕ ПРОЕКТА

document.getElementById("project-form").addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("beat-name").value.trim();
    const bpm = Number(document.getElementById("beat-bpm").value);
    const key = document.getElementById("beat-key").value;
    const status = document.getElementById("beat-status").value;

    if (!name) {
        alert("Enter a project name.");
        return;
    }

    if (!Number.isInteger(bpm) || bpm < 40 || bpm > 240) {
        alert("BPM must be between 40 and 240.");
        return;
    }

    const project = {
        id: Date.now(),
        name: name.toUpperCase(),
        bpm,
        key,
        status,
        favorite: false
    };

    projects.unshift(project);
    addActivity(project.name, "Project created");

    saveData();
    renderAll();

    event.target.reset();
    document.getElementById("beat-bpm").value = 145;

    closeProjectModal();
    showPage("projects");
});

// РЕДАКТИРОВАНИЕ ПРОЕКТА

function editProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    const name = prompt("Project name:", project.name);
    if (name === null) return;

    if (!name.trim()) {
        alert("Project name cannot be empty.");
        return;
    }

    const bpmInput = prompt("BPM (40–240):", project.bpm);
    if (bpmInput === null) return;

    const bpm = Number(bpmInput);

    if (!Number.isInteger(bpm) || bpm < 40 || bpm > 240) {
        alert("BPM must be a whole number between 40 and 240.");
        return;
    }

    const key = prompt("Key:", project.key);
    if (key === null || !key.trim()) return;

    const status = prompt(
        "Status: Idea, In Progress or Finished",
        project.status
    );

    if (status === null) return;

    if (!["Idea", "In Progress", "Finished"].includes(status)) {
        alert("Invalid status.");
        return;
    }

    project.name = name.trim().toUpperCase();
    project.bpm = bpm;
    project.key = key.trim();
    project.status = status;

    addActivity(project.name, "Project updated");
    saveData();
    renderAll();
}

// ДЕЙСТВИЯ С КАРТОЧКАМИ

document.addEventListener("click", event => {
    const favoriteButton = event.target.closest("[data-favorite]");

    if (favoriteButton) {
        const id = Number(favoriteButton.dataset.favorite);
        const project = projects.find(p => p.id === id);

        if (!project) return;

        project.favorite = !project.favorite;

        addActivity(
            project.name,
            project.favorite ? "Added to Favorites" : "Removed from Favorites"
        );

        saveData();
        renderAll();
        return;
    }

    const editButton = event.target.closest("[data-edit]");

    if (editButton) {
        editProject(Number(editButton.dataset.edit));
        return;
    }

    const deleteButton = event.target.closest("[data-delete]");

    if (deleteButton) {
        const id = Number(deleteButton.dataset.delete);
        const project = projects.find(p => p.id === id);

        if (!project) return;

        if (confirm(`Delete ${project.name}?`)) {
            projects = projects.filter(p => p.id !== id);

            addActivity(project.name, "Project deleted");
            saveData();
            renderAll();
        }
        return;
    }

    const deleteIdeaButton = event.target.closest("[data-delete-idea]");

    if (deleteIdeaButton) {
        const index = Number(deleteIdeaButton.dataset.deleteIdea);

        if (index >= 0 && index < ideas.length) {
            ideas.splice(index, 1);
            addActivity("IDEA BOARD", "Idea deleted");
            saveData();
            renderAll();
        }
    }
});

// ДОБАВЛЕНИЕ ИДЕЙ

document.getElementById("idea-form").addEventListener("submit", event => {
    event.preventDefault();

    const input = document.getElementById("idea-input");
    const idea = input.value.trim();

    if (!idea) return;

    ideas.unshift(idea);
    addActivity("IDEA BOARD", "New idea added");

    input.value = "";

    saveData();
    renderAll();
});

// ЗАПУСК

renderAll();
showPage("home");