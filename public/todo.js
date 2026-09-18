const STORAGE_KEY = 'focus-list.todos.v1';
let todos = loadTodos();
let currentFilter = 'all';

const form = document.querySelector('#todo-form');
const input = document.querySelector('#todo-input');
const list = document.querySelector('#todo-list');
const emptyState = document.querySelector('#empty-state');
const count = document.querySelector('#task-count');

function loadTodos() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((todo) => todo && typeof todo.text === 'string') : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function visibleTodos() {
  if (currentFilter === 'active') return todos.filter((todo) => !todo.completed);
  if (currentFilter === 'completed') return todos.filter((todo) => todo.completed);
  return todos;
}

function render() {
  const visible = visibleTodos();
  list.replaceChildren();
  emptyState.hidden = visible.length > 0;
  count.textContent = `${todos.filter((todo) => !todo.completed).length} active`;

  visible.forEach((todo) => {
    const item = document.createElement('li');
    item.className = `todo-item${todo.completed ? ' completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `Mark ${todo.text} as complete`);
    checkbox.addEventListener('change', () => {
      todo.completed = checkbox.checked;
      saveTodos();
      render();
    });

    const text = document.createElement('span');
    text.textContent = todo.text;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Delete ${todo.text}`);
    remove.addEventListener('click', () => {
      todos = todos.filter((candidate) => candidate.id !== todo.id);
      saveTodos();
      render();
    });

    item.append(checkbox, text, remove);
    list.append(item);
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  todos.unshift({ id: crypto.randomUUID(), text, completed: false });
  saveTodos();
  input.value = '';
  render();
  input.focus();
});

document.querySelectorAll('.filter').forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    document.querySelectorAll('.filter').forEach((item) => item.classList.toggle('active', item === button));
    render();
  });
});

document.querySelector('#clear-completed').addEventListener('click', () => {
  todos = todos.filter((todo) => !todo.completed);
  saveTodos();
  render();
});

render();
