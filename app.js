const dayButtons = document.getElementById("dayButtons");
const classButtons = document.getElementById("classButtons");
const lessonsContainer = document.getElementById("lessons");
const themeToggle = document.getElementById("themeToggle");
const classModal = document.getElementById("classModal");
const openClassModalBtn = document.getElementById("openClassModal");
const closeClassModalBtn = document.getElementById("closeClassModal");
const activeClassLabel = document.getElementById("activeClassLabel");

let scheduleData = [];
let activeClass = "";
let activeDay = "";

const dayOrder = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

function setTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("scheduleTheme", theme);
  if (themeToggle) {
    themeToggle.textContent = theme === "light" ? "Тема: Светлая" : "Тема: Темная";
  }
}

function parseSchedule(xmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  const classNodes = Array.from(xmlDoc.getElementsByTagName("class"));

  const buildDays = (root) =>
    Array.from(root.getElementsByTagName("day")).map((day) => {
      const name = day.getAttribute("name") || "";
      const lessons = Array.from(day.getElementsByTagName("lesson")).map(
        (lesson, idx) => ({
          index: lesson.getAttribute("index") || String(idx + 1),
          start: lesson.getAttribute("start") || "",
          end: lesson.getAttribute("end") || "",
          name: lesson.textContent?.trim() || "Без названия",
        })
      );

      return { name, lessons };
    });

  if (classNodes.length === 0) {
    scheduleData = [{ name: "8А", days: buildDays(xmlDoc) }];
    return;
  }

  scheduleData = classNodes.map((classNode) => ({
    name: classNode.getAttribute("name") || "Класс",
    days: buildDays(classNode),
  }));
}

function getActiveClass() {
  if (!activeClass && scheduleData.length > 0) {
    return null;
  }
  return scheduleData.find((item) => item.name === activeClass) || null;
}

function openClassModal() {
  if (!classModal) return;
  classModal.classList.add("is-open");
  classModal.setAttribute("aria-hidden", "false");
}

function closeClassModal() {
  if (!classModal) return;
  classModal.classList.remove("is-open");
  classModal.setAttribute("aria-hidden", "true");
}

function updateActiveClassLabel() {
  if (activeClassLabel) {
    activeClassLabel.textContent = activeClass || "—";
  }
}

function renderClassButtons() {
  if (!classButtons) {
    renderDayButtons();
    return;
  }

  classButtons.innerHTML = "";

  scheduleData.forEach((classItem) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "class-btn";
    btn.textContent = classItem.name;
    btn.dataset.class = classItem.name;
    btn.addEventListener("click", () => selectClass(classItem.name));
    classButtons.appendChild(btn);
  });

  updateActiveClassLabel();

  if (!activeClass && scheduleData.length > 0) {
    openClassModal();
  }
}

function renderDayButtons() {
  dayButtons.innerHTML = "";

  const active = getActiveClass();
  if (!active) {
    lessonsContainer.innerHTML = "<p>Выберите класс, чтобы увидеть расписание.</p>";
    return;
  }
  const days = active ? active.days : [];
  const byName = new Map(days.map((day) => [day.name, day]));
  const orderedDays = dayOrder.filter((day) => byName.has(day));

  orderedDays.forEach((dayName) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day-btn";
    btn.textContent = dayName;
    btn.dataset.day = dayName;
    btn.addEventListener("click", () => selectDay(dayName));
    dayButtons.appendChild(btn);
  });

  if (!activeDay && orderedDays.length > 0) {
    selectDay(orderedDays[0]);
  }
}

function renderLessons(dayName) {
  lessonsContainer.innerHTML = "";
  const active = getActiveClass();
  const day = active ? active.days.find((item) => item.name === dayName) : null;
  const lessons = day ? day.lessons : [];

  if (lessons.length === 0) {
    lessonsContainer.innerHTML = "<p>В этот день уроков нет.</p>";
    return;
  }

  const orderedLessons = lessons
    .slice()
    .sort((a, b) => Number(a.index) - Number(b.index));

  orderedLessons.forEach((lesson, idx) => {
    const card = document.createElement("article");
    card.className = "lesson-card";
    card.style.animationDelay = `${idx * 40}ms`;
    card.innerHTML = `
      <div class="lesson-card__index">Урок ${lesson.index}</div>
      <div class="lesson-card__name">${lesson.name}</div>
      <div class="lesson-card__time">${lesson.start} — ${lesson.end}</div>
    `;
    lessonsContainer.appendChild(card);
  });
}

function selectClass(className) {
  activeClass = className;
  activeDay = "";
  document.querySelectorAll(".class-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.class === className);
  });
  updateActiveClassLabel();
  closeClassModal();
  renderDayButtons();
}

function selectDay(dayName) {
  activeDay = dayName;
  document.querySelectorAll(".day-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.day === dayName);
  });
  renderLessons(dayName);
}

function initTheme() {
  const saved = localStorage.getItem("scheduleTheme");
  setTheme(saved || "dark");

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.body.getAttribute("data-theme") || "dark";
      setTheme(current === "dark" ? "light" : "dark");
    });
  }
}

async function init() {
  initTheme();

  if (openClassModalBtn) {
    openClassModalBtn.addEventListener("click", openClassModal);
  }

  if (closeClassModalBtn) {
    closeClassModalBtn.addEventListener("click", closeClassModal);
  }

  if (classModal) {
    classModal.addEventListener("click", (event) => {
      const target = event.target;
      if (target && target.hasAttribute("data-modal-close")) {
        closeClassModal();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeClassModal();
      }
    });
  }

  try {
    const response = await fetch("lessons.xml");
    if (!response.ok) throw new Error("Не удалось загрузить XML");
    const xmlText = await response.text();
    parseSchedule(xmlText);
    renderClassButtons();
  } catch (error) {
    lessonsContainer.innerHTML =
      "<p>Не удалось загрузить расписание. Проверьте файл lessons.xml.</p>";
    console.error(error);
  }
}

init();
