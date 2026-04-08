document.querySelector('nav > span:first-child')
  .addEventListener('click', () => {
    document.querySelector('nav').classList.toggle('nav-open');
  });
const dialogueBox = document.querySelector('.income-dailogue-box');
const addBtn = document.querySelector('.add-income-btn');
const cancelBtn = document.getElementById('cancel-btn');

addBtn.addEventListener('click', () => dialogueBox.classList.add('open'));
cancelBtn.addEventListener('click', () => dialogueBox.classList.remove('open'));

// Close on backdrop click
dialogueBox.addEventListener('click', (e) => {
  if (e.target === dialogueBox) dialogueBox.classList.remove('open');
});