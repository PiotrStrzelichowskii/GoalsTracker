
function saveGoalsToLocalStorage() {
  localStorage.setItem('goals', JSON.stringify(goals));
}

function loadGoalsFromLocalStorage() {
  const storedGoals = localStorage.getItem('goals');
  if (storedGoals) {
      console.log('Loaded goals from localStorage:', JSON.parse(storedGoals)); // Debug
      return JSON.parse(storedGoals);
  }
  return {
      easy: [],
      medium: [],
      hard: []
  };
}

const goals = loadGoalsFromLocalStorage();
let draggedCategory = null;
let draggedIndex = null;

function renderGoals() {
  console.log('Rendering goals...'); // Debug
  document.getElementById('easy-list').innerHTML = '';
  document.getElementById('medium-list').innerHTML = '';
  document.getElementById('hard-list').innerHTML = '';

  const countgoals = {
      completed: 0,
      inProgress: 0,
      total: 0
  };

  for (let category in goals) {
      const list = document.getElementById(`${category}-list`);
      if (!list) {
          console.error(`Element ${category}-list not found in DOM!`); // Debug
          continue;
      }

      goals[category].forEach((goalObj, index) => {
          const li = document.createElement('li');
          li.draggable = true;
          li.setAttribute('ondragstart', `dragStart(event, '${category}', ${index})`);
          li.setAttribute('ondragover', `dragOver(event, '${category}', ${index})`);
          li.setAttribute('ondragleave', `dragLeave(event, '${category}', ${index})`);
          li.setAttribute('ondrop', `drop(event, '${category}', ${index})`);

          const goalText = document.createElement('span');
          goalText.textContent = goalObj.goal;
          goalText.title = "Double click to edit";
          goalText.ondblclick = () => startEditing(goalText, category, index);

          if (goalObj.completed) {
              li.classList.add('completed');
              countgoals.completed++;
          } else if (goalObj.inProgress) {
              li.classList.add('in-progress');
              countgoals.inProgress++;
          }

          countgoals.total++;

          const btnGroup = document.createElement('div');
          btnGroup.classList.add('btn-group');

          const doneButton = document.createElement('button');
          doneButton.classList.add('done');
          doneButton.innerHTML = `<img src="done.svg" width="16" height="16">`;
          doneButton.onclick = () => toggleComplete(doneButton, category, index);

          const inProgressButton = document.createElement('button');
          inProgressButton.classList.add('in-progress');
          inProgressButton.innerHTML = `<img src="inprogress.svg" width="20" height="20">`;
          inProgressButton.onclick = () => toggleInProgress(inProgressButton, category, index);

          const deleteButton = document.createElement('button');
          deleteButton.classList.add('delete');
          deleteButton.innerHTML = `<img src="delete.svg" width="16" height="16">`;
          deleteButton.onclick = () => deleteGoal(category, index);

          btnGroup.appendChild(doneButton);
          btnGroup.appendChild(inProgressButton);
          btnGroup.appendChild(deleteButton);

          li.appendChild(goalText);
          li.appendChild(btnGroup);
          list.appendChild(li);

          if (goalObj.completed) {
              doneButton.classList.add('disabled');
              doneButton.disabled = true;
              inProgressButton.classList.add('disabled');
              inProgressButton.disabled = true;
          } else if (goalObj.inProgress) {
              inProgressButton.classList.add('active');
              doneButton.classList.remove('disabled');
              doneButton.disabled = false;
          } else {
              doneButton.classList.remove('disabled');
              doneButton.disabled = false;
              inProgressButton.classList.remove('disabled');
              inProgressButton.disabled = false;
          }
      });
  }

  console.log('Ukończone cele:', countgoals.completed);
  console.log('Cele w trakcie:', countgoals.inProgress);
  console.log('Łączna liczba celów:', countgoals.total);

  // Obliczanie pozostałych celów
      const remaining = countgoals.total - (countgoals.completed + countgoals.inProgress);

  // Tworzenie lub aktualizacja wykresu
  const ctx = document.getElementById('goalChart').getContext('2d');

  // Jeśli wykres już istnieje, zniszcz go przed utworzeniem nowego
  if (window.goalChart && typeof window.goalChart.destroy === 'function') {
      window.goalChart.destroy();
  }

  window.goalChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
          datasets: [{
              data: [countgoals.inProgress, countgoals.completed, remaining],
              backgroundColor: ['#FFA500', '#4CAF50', '#E0E0E0'],
              borderWidth: 0,
              borderRadius: 20
          }]
      },
      options: {
          cutout: '90%',
          responsive: true,
          plugins: {
              legend: {
                  display: false
              },
              tooltip: {
                  enabled: false
              }
          }
      }
  });

  // Aktualizacja tekstu w środku wykresu
  document.getElementById('chartCenterText').innerText = `${countgoals.completed}/${countgoals.total}`;
}
  
      function startEditing(goalText, category, index) {
      // Sprawdź, czy cel jest ukończony
      if (goals[category][index].completed) {
          alert('Nie można edytować ukończonego celu!');
          return; // Zakończ funkcję, jeśli cel jest ukończony
      }

      const input = document.createElement('input');
      input.type = 'text';
      input.value = goalText.textContent;
      input.style.backgroundColor = '#2c2c2c';
      input.style.color = '#e0e0e0';
      input.style.border = '2px solid';
      input.style.outline = 'none';
      input.style.borderColor = '#45a049';
      input.style.borderRadius = '8px';
      input.style.padding = '5px';
      input.style.fontSize = '1rem';
      input.style.width = '50%';

      input.addEventListener('blur', () => saveEdit(input, goalText, category, index));
      input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
              saveEdit(input, goalText, category, index);
          }
      });

      goalText.parentElement.replaceChild(input, goalText);
      input.focus();
  }
  
  function saveEdit(input, goalText, category, index) {
      goals[category][index].goal = input.value.trim();
      goalText.textContent = input.value.trim();
      input.parentElement.replaceChild(goalText, input);
  
      saveGoalsToLocalStorage();
      renderGoals();
  }
  
  function addGoal() {
      const inputElement = document.getElementById('goal-input');
      const categoryElement = document.getElementById('goal-category');
      
      const newGoal = inputElement.value.trim();
      const category = categoryElement.value;
  
      if (!newGoal) {
          alert('Please enter a goal!');
          return;
      }
  
      goals[category].push({ goal: newGoal, completed: false, inProgress: false });
      inputElement.value = ''; 
  
      saveGoalsToLocalStorage();
      renderGoals();
  }
  
  document.getElementById('goal-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
          addGoal();
      }
  });
  
  function dragStart(event, category, index) {
      draggedCategory = category;
      draggedIndex = index;
      event.dataTransfer.effectAllowed = 'move';
  }
  
  function dragOver(event, category, index) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
  
      const list = document.getElementById(`${category}-list`);
      const items = list.children;
      if (items[index]) {
          items[index].classList.add('drag-over');
      }
  }
  
  function dragLeave(event, category, index) {
      const list = document.getElementById(`${category}-list`);
      const items = list.children;
      if (items[index]) {
          items[index].classList.remove('drag-over');
      }
  }
  
  function drop(event, targetCategory, targetIndex) {
      event.preventDefault();
  
      if (draggedCategory === null || draggedIndex === null) return;
  
      const draggedGoal = goals[draggedCategory][draggedIndex];
      goals[draggedCategory].splice(draggedIndex, 1);
  
      if (targetIndex >= goals[targetCategory].length) {
          goals[targetCategory].push(draggedGoal);
      } else {
          goals[targetCategory].splice(targetIndex, 0, draggedGoal);
      }
  
      draggedCategory = null;
      draggedIndex = null;
  
      saveGoalsToLocalStorage();
      renderGoals();
  }
  
  function toggleComplete(button, category, index) {
      const list = document.getElementById(`${category}-list`);
      const item = list.children[index];
  
      goals[category][index].completed = true;
      goals[category][index].inProgress = false;  // Jeśli cel jest zakończony, to nie jest już w trakcie realizacji
      item.classList.add('completed');
      item.classList.remove('in-progress');
  
      const doneButton = item.querySelector('.done');
      const inProgressButton = item.querySelector('.in-progress');
  
      doneButton.classList.add('disabled');
      doneButton.disabled = true;
      inProgressButton.classList.add('disabled');
      inProgressButton.disabled = true;
  
      saveGoalsToLocalStorage();
      renderGoals();
  }
  
  function toggleInProgress(button, category, index) {
      const list = document.getElementById(`${category}-list`);
      const item = list.children[index];
  
      // Zmieniamy status inProgress
      goals[category][index].inProgress = !goals[category][index].inProgress;
  
      if (goals[category][index].inProgress) {
          // Jeśli cel jest w trakcie realizacji, usuwamy klasę 'completed' i dodajemy 'in-progress'
          item.classList.remove('completed');
          item.classList.add('in-progress');
      } else {
          // Jeśli cel nie jest w trakcie realizacji, sprawdzamy, czy jest zakończony
          if (goals[category][index].completed) {
              // Jeśli jest zakończony, dodajemy 'completed'
              item.classList.add('completed');
              item.classList.remove('in-progress');
          } else {
              // Jeśli nie jest ani zakończony, ani w trakcie realizacji, przywracamy kolor szary
              item.classList.remove('completed');
              item.classList.remove('in-progress');
          }
      }
  
      saveGoalsToLocalStorage();
      renderGoals();
  }
  
  
  function deleteGoal(category, index) {
      goals[category].splice(index, 1);
      saveGoalsToLocalStorage();
      renderGoals();
  }
  
  renderGoals();
  
