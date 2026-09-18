const STORAGE_KEY = 'focus-list.tasks.v1';

const form = document.querySelector('#todo-form');
const input = document.querySelector('#todo-input');
const list = document.querySelector('#todo-list');
const emptyState = document.querySelector('#empty-state');
const count = document.querySelector('#task-count');
const clearCompleted = document.querySelector('#clear-completed');
const filterButtons = [...document.querySelectorAll('.filter')];

let tasks = loadTasks();
let activeFilter = 'all';

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(task => task && typeof task.text === 'string') : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function visibleTasks() {
  if (activeFilter === 'active') return tasks.filter(task => !task.completed);
  if (activeFilter === 'completed') return tasks.filter(task => task.completed);
  return tasks;
}

function render() {
  const visible = visibleTasks();
  list.innerHTML = visible.map(task => `
    <li class="todo-item${task.completed ? ' completed' : ''}" data-id="${task.id}">
      <label class="task-label">
        <input class="task-checkbox" type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark ${escapeHtml(task.text)} as complete">
        <span>${escapeHtml(task.text)}</span>
      </label>
      <button class="delete-task" type="button" aria-label="Delete ${escapeHtml(task.text)}">×</button>
    </li>
  `).join('');

  const remaining = tasks.filter(task => !task.completed).length;
  count.textContent = `${remaining} ${remaining === 1 ? 'task' : 'tasks'} left`;
  emptyState.hidden = visible.length > 0;
  clearCompleted.disabled = !tasks.some(task => task.completed);
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  tasks.unshift({ id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, text, completed: false });
  saveTasks();
  render();
  form.reset();
  input.focus();
});

list.addEventListener('change', event => {
  if (!event.target.matches('.task-checkbox')) return;
  const item = event.target.closest('.todo-item');
  const task = tasks.find(candidate => candidate.id === item.dataset.id);
  if (!task) return;
  task.completed = event.target.checked;
  saveTasks();
  render();
});

list.addEventListener('click', event => {
  const button = event.target.closest('.delete-task');
  if (!button) return;
  const item = button.closest('.todo-item');
  tasks = tasks.filter(task => task.id !== item.dataset.id);
  saveTasks();
  render();
});

filterButtons.forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  filterButtons.forEach(filter => filter.classList.toggle('active', filter === button));
  render();
}));

clearCompleted.addEventListener('click', () => {
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  render();
});

render();
