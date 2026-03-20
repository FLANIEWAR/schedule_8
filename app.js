const dayButtons = document.getElementById("dayButtons");
const lessonsContainer = document.getElementById("lessons");
const themeToggle = document.getElementById("themeToggle");

let scheduleData = [];
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
  const days = Array.from(xmlDoc.getElementsByTagName("day"));

  scheduleData = days.map((day) => {
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
}

function renderDayButtons() {
  dayButtons.innerHTML = "";

  const byName = new Map(scheduleData.map((day) => [day.name, day]));
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
  const day = scheduleData.find((item) => item.name === dayName);
  const lessons = day ? day.lessons : [];

  const normalized = Array.from({ length: 8 }, (_, idx) => {
    return lessons[idx] || {
      index: String(idx + 1),
      start: "--:--",
      end: "--:--",
      name: "Урок не задан",
    };
  });

  normalized.forEach((lesson, idx) => {
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

  try {
    const response = await fetch("lessons.xml");
    if (!response.ok) throw new Error("Не удалось загрузить XML");
    const xmlText = await response.text();
    parseSchedule(xmlText);
    renderDayButtons();
  } catch (error) {
    lessonsContainer.innerHTML =
      "<p>Не удалось загрузить расписание. Проверьте файл lessons.xml.</p>";
    console.error(error);
  }
}

init();
