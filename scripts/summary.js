let userName;
/**
 * Initializes the startup process by loading the summary.
 */
async function initSummary() {
    await includeHTML();
    await loadRemote();
    await tasksForSummary();
    await urgentTask();
    getTimeandGreets();
}

function clearUsers(){
    users.splice('1', 8)
}

/**
 * Count the tasks.
 */
async function tasksForSummary() {
    let countTodo = tasks.filter(task => task.section === 'taskCategoryToDo').length;
    let countProgress = tasks.filter(task => task.section === 'taskCategoryInProgress').length;
    let countFeedback = tasks.filter(task => task.section === 'taskCategoryAwaitFeedback').length;
    let countDone = tasks.filter(task => task.section === 'taskCategoryDone').length;
    document.getElementById('amountBoard').innerHTML = tasks.length;
    document.getElementById('amountTodo').innerHTML = countTodo;
    document.getElementById('amountProgress').innerHTML = countProgress;
    document.getElementById('amountFeedback').innerHTML = countFeedback;
    document.getElementById('amountDone').innerHTML = countDone;
}

/**
 * Filter the urgent tasks and displays the next deadline due.
 */
async function urgentTask() {
    let countUrgentTasks = tasks.filter(task => task.priority === 'urgent').length;
    document.getElementById('amountUrgent').innerHTML = countUrgentTasks;
    let urgentTasks = tasks.filter(task => task.priority === 'urgent' && task.date);
    urgentTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (urgentTasks.length > 0) {
        let nextDueDate = new Date(urgentTasks[0].date);
        let formattedDate = nextDueDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        document.getElementById('date').innerHTML = formattedDate;
    } else {
        document.getElementById('date').innerHTML = '';
    }
}

/**
 * Redirects to the board.
 */
function openBoard() {
    window.location.href = `board.html?name=${userName}`;
}

/**
 * Generates a personalized greeting message based on the current time of day.
 */
function getTimeandGreets() {
    const urlParams = new URLSearchParams(window.location.search);
    userName = urlParams.get('name');
    const greetingTextElement = document.getElementById('greetingText');
    const userElement = document.getElementById('user');
    let today = new Date();
    let currentHour = today.getHours();
    let greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good day' : 'Good evening';
    if (userName === null || userName === '') {
        userElement.textContent = 'Guest';
        greetingTextElement.textContent = greeting + ',';
        greetingTextElement.style.color = 'black';
    } else {
        userElement.textContent = userName;
        greetingTextElement.textContent = greeting + ',';
    }
    setNameToHrefs(userName);
};

