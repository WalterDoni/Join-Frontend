let currentDraggedElement;
let allTasks = [];
let short = [];
let iconNameColor = [];
let searchTaskArray = [];
let editAssignedToNamesShorts = {
    names: [],
    colors: [],
};

let hideDropDownMenu = true;

let tasksBackend = [];
let subtasksBackend = [];
let backendIdSelectedTask = 999;


async function init() {

    await loadContacts();
    await getContactsBackend();
    await getSubtasksBackend();
    await getTasksBackend();
    await setMinDate();
    await includeHTML();
    await loadCategorys();
    await loadTasksForBoard();
    await renderTasks();
    await addNameToHref();
    await getUserBackend();

}

/**
 * Load data from the remote storage and push it into the allTasks array, for some specific values, which are necessary for the board.
 *  @param {object} remoteTask --> Variable for the tasks values.
 *  @param {array} allTasks -> global array
 */
function loadTasksForBoard() {
    allTasks = [];
    for (let i = 0; i < tasksBackend[0].length; i++) {
        let task = tasksBackend[0][i];
        getAssignedShortAndColor(task, short, iconNameColor);
        let remoteTask = taskData(task, i);
        allTasks.push(remoteTask);
        short = [];
        iconNameColor = [];
    }
}

/**
 * Check every name in the array "contacts" and return the variable i which is needed for function processAssignedName().
 */
function findIndexByName(name) {
    for (let i = 0; i < contactsBackend[0].length; i++) {
        if (contactsBackend[0][i].name === name) {
            return i;
        }
    }
    return -1;
}

/**
 * If findIndexByName() returns not -1 the color and short will be pushed into the both arrays
 */
function processAssignedName(name, short, iconNameColor, contacts) {
    let index = findIndexByName(name, contactsBackend[0]);
    if (index !== -1) {
        short.push(contactsBackend[0][index].short);
        iconNameColor.push(contacts[index].iconColor);
    }
}

/**
 * Retrieves assigned short names and icon colors based on task assignments.
 */
function getAssignedShortAndColor(task, short, iconNameColor) {
    let assignedNames = task.assignedTo;
    if (assignedNames.length === 1) {
        if (assignedNames[0] === "Myself" && short.length < 1) {
            short.push("M");
            iconNameColor.push("#04B404");
        } else {
            processAssignedName(assignedNames[0], short, iconNameColor, contacts);
        }
    } else {
        if (assignedNames[0] === "Myself" && short.length < 1) {
            short.push("M");
            iconNameColor.push("#04B404");
        }
        for (let i = 0; i < assignedNames.length; i++) {
            processAssignedName(assignedNames[i], short, iconNameColor, contacts);
        }
    }
}

/**
 * Place the task at the right section on the board.
 * @param {string} categoryName - The name of the category.
 * @param {object[]} tasks - An array of task objects to be rendered.
 */
function renderCategory(categoryName, tasks) {
    let containerId = `taskCategory${categoryName}`;
    let container = document.getElementById(containerId);
    container.innerHTML = '';
    if (tasks.length > 0) {
        for (let i = 0; i < tasks.length; i++) {
            let task = tasks[i];
            let counter = 0;
            container.innerHTML += createdTaskHTML(task, i);
            let assignedMemberElement = document.getElementById(`createdTaskAssignedMember${task.id}`);
            for (let m = 0; m < tasksBackend[0][i]['assignedTo'].length; m++) {
                contactsBackend[0].forEach(contact => {
                    if (contact.name == tasksBackend[0][i]['assignedTo'][m])
                        assignedMemberElement.innerHTML += `<span class="memberIcon" style="background-color: ${contact.iconColor}">${contact.short}</span>`
                });
            }
            document.getElementById(`rightPrio${task.id}`).innerHTML = checkPriority(task);
            counter = checkSubtaskProgress(task, counter);
            document.getElementById(`progressCounter${task.id}`).innerHTML = `${counter}/${task.subtask.length}`;
            let barPercentLength = checkProgressBar(task, counter);
            document.getElementById(`progressBar${task.id}`).style.width = barPercentLength;
        }
    } else {
        container.innerHTML = `<div class="noTask"> No task in "${categoryName}"</div>`;
    }
}

/**
 * Render the tasks for the board. 
 */
function renderTasks() {
    if (searchTaskArray.length >= 1) {
        arrayToFilter = searchTaskArray;
    } else {
        arrayToFilter = allTasks;
    }
    renderCategory('ToDo', arrayToFilter.filter(t => t.section === 'taskCategoryToDo'));
    renderCategory('InProgress', arrayToFilter.filter(t => t.section === 'taskCategoryInProgress'));
    renderCategory('AwaitFeedback', arrayToFilter.filter(t => t.section === 'taskCategoryAwaitFeedback'));
    renderCategory('Done', arrayToFilter.filter(t => t.section === 'taskCategoryDone'));
}

function checkPriority(task) {
    if (task.priority == 'urgent') {
        return `<img src="../img/addtask-img/higPrio.png"></img>`
    } if (task.priority == 'medium') {
        return `<img src="../img/addtask-img/mediumPrio.png"></img>`
    } if (task.priority == 'low') {
        return `<img src="../img/addtask-img/lowPrio.png"></img>`
    }
}

function checkSubtaskProgress(task, counter) {
    for (let i = 0; i < task['subtask'].length; i++) {
        if (task['subtask'][i]['status'] == "checked") {
            counter++;
        }
    }
    return counter
}

/**
 * Calculate the current length from the progressbar, depends on how many subtask are checked in the details view
 */
function checkProgressBar(task, counter) {
    let subTaskLength = task['subtask'].length;
    let barPercentLength = ((counter / subTaskLength) * 100).toFixed(2);
    return barPercentLength + '%';
}

/**
 * It's possible to click on every single task at the board. With this function a window will Pop-Up to show more details from the task. 
 * After that, from there is possible to click on "edit" to change somethin in the selected task.
 */
function showDetailsTaskPopUp(id) {

    let showDetailsTaskPopUp = document.getElementById('editTaskPopUpWindowContent');
    showDetailsTaskPopUp.style.display = 'flex';
    showDetailsTaskPopUp.innerHTML = showDetailsTaskPopUpHTML(id);
    showNamesAndSubtasks(id);
    showDetailsPrio(id);
    if (window.innerWidth <= 800) {
        document.getElementById('content').style.display = 'none';
    }
}

/**
 * Load every Name and Subtask from the selected task.
 */
function showNamesAndSubtasks(id) {
    for (let i = 0; i < tasksBackend[0][id]['assignedTo'].length; i++) {
        document.getElementById('editPopUpName').innerHTML += `<div><span class="iconStylePopUp"style="background-color:${allTasks[id]['iconColors'][i]}">${allTasks[id]['members'][i]}</span><span style="padding-left: 10px">${tasksBackend[0][id]['assignedTo'][i]}</span</div>`;
    }
    for (let l = 0; l < tasksBackend[0][id]['subtask'].length; l++) {
        document.getElementById('editPopUpList').innerHTML += `<div id="editTaskCheckboxes" onclick="changeProgressBarFromSelectedTask(${id})"><input ${tasksBackend[0][id]['subtask'][l]['status']} id="editChecks${l}"type="checkbox">${tasksBackend[0][id]['subtask'][l]['titleFromSub']}</div>`
    }
}

/**
 * If the dropdown menu gets closed, below the "shorts" and "iconColor" will appear below the selected contact. 
 * Every selected name will be pushed into the"editAssignedToNamesShorts" array after it iterates through every possibility.
 */
function checkboxChanges() {
    let divId = document.getElementById('editAssignedToSelection');
    let labels = divId.querySelectorAll("label");
    let editAssignedToNamesShorts = { names: [], colors: [], };
    for (let i = 0; i < labels.length; i++) {
        let selected = labels[i];
        if (selected.querySelector("input").checked) {
            createIconArray(selected, editAssignedToNamesShorts);
        }
    }
    renderAssignedMembers(editAssignedToNamesShorts);
}

/**
 * Creates the neccesary array for the box below the "assignedTo" section.
 * @param {*} selected --> Current name in label
 */
function createIconArray(selected, editAssignedToNamesShorts) {
    if (selected.textContent == 'Myself') {
        editAssignedToNamesShorts.names.push('M');
        editAssignedToNamesShorts.colors.push('#04B404');
    }
    for (let i = 0; i < contacts.length; i++) {
        let contactName = contacts[i]['name'];
        let contactColor = contacts[i]['iconColor'];
        let contactShort = contacts[i]['short'];
        if (selected.textContent == contactName) {
            editAssignedToNamesShorts.names.push(contactShort);
            editAssignedToNamesShorts.colors.push(contactColor);
        }
    }
}

function renderAssignedMembers(editAssignedToNamesShorts) {
    document.getElementById('assginedMembersEditTask').innerHTML = "";
    for (let a = 0; a < editAssignedToNamesShorts.names.length; a++) {
        document.getElementById('assginedMembersEditTask').innerHTML += `<span class="memberIcon" style="background-color:${editAssignedToNamesShorts['colors'][a]}">${editAssignedToNamesShorts['names'][a]}</span> `;
    }
}

function loadNamesFromSelectedTask(id) {
    for (let i = 0; i < tasksBackend[0][id]['assignedTo'].length; i++) {
        let name = allTasks[id]['members'][i];
        let color = allTasks[id]['iconColors'][i];
        editAssignedToNamesShorts.names.push(name);
        editAssignedToNamesShorts.colors.push(color);
        document.getElementById('assginedMembersEditTask').innerHTML += `<span class="memberIcon" style="background-color:${editAssignedToNamesShorts['colors'][i]}">${editAssignedToNamesShorts['names'][i]}</span> `;
    }
}

/**
 * Add the correct priority from the selected task to the popup-window.
 */
function showDetailsPrio(id) {
    if (tasksBackend[0][id]['priority'] == 'urgent') {
        document.getElementById('editPopUpPriority').innerHTML = '<p>urgent</p> <img src="../img/addtask-img/higPrio.png">';
        document.getElementById('editPopUpPriority').classList.add('selecturgent')
    }
    if (tasksBackend[0][id]['priority'] == 'medium') {
        document.getElementById('editPopUpPriority').innerHTML = '<p>medium</p> <img src="../img/addtask-img/mediumPrio.png">';
        document.getElementById('editPopUpPriority').classList.add('selectmedium')
    }
    if (tasksBackend[0][id]['priority'] == 'low') {
        document.getElementById('editPopUpPriority').innerHTML = '<p>low</p> <img src="../img/addtask-img/lowPrio.png">';
        document.getElementById('editPopUpPriority').classList.add('selectlow')
    }
}

/**
 * @param {object} counter -> Will show a number for every "checked" subtask. Also will change the range of the progressbar. 
 * Also after every change it get saved in the remote storage.
 */
async function changeProgressBarFromSelectedTask(id) {
    let task = tasksBackend[0][id];
    let counter = 0;
    for (let subs = 0; subs < task.subtask.length; subs++) {
        let isChecked = document.getElementById('editChecks' + subs).checked;
        if (isChecked) {
            tasksBackend[0][id].subtask[subs].status = "checked";
        } else {
            tasksBackend[0][id].subtask[subs].status = "unchecked";
        }
    }
    counter = checkSubtaskProgress(task, counter);
    barPercentLength = checkProgressBar(task, counter);
    document.getElementById('progressBar' + id).style.width = barPercentLength;
    document.getElementById('progressCounter' + id).innerHTML = counter + `/${task['subtask'].length}`;
    counter = "";
    await setTask('tasks', tasks); // <-----
}

/**
 * To change something in the chosen task, this window will pop up and load every current data into it.
 */
function SelectedTaskEditWindow(id, backendId) {
    backendIdSelectedTask = backendId
    let content = document.getElementById('editSelectedTask');
    content.innerHTML = "";
    content.innerHTML = selectedTaskHTML(id);
    selectedPriority = tasksBackend[0][id]['priority'];
    document.getElementById('editSelect' + tasksBackend[0][id]['priority']).classList.add('select' + tasksBackend[0][id]['priority']);
    editopenAssignedToSelection();
    editCheckSelectedContacts(id);
    loadNamesFromSelectedTask(id);
    document.getElementById('editSelectedTask').style.display = 'flex';
    if (window.innerWidth <= 800) {
        document.getElementById('content').style.display = 'none';
    }
}

/**
 * Every possible contact will show up and can be selected.
 */
function editopenAssignedToSelection() {
    let assignedToSelectionBox = document.getElementById('editAssignedToSelection');
    assignedToSelectionBox.innerHTML = editassignedToBoxHTML();
    assignedToSelectionBox.innerHTML += `<label onclick="doNotCloseTheBoxOrReloadThePage(event)" id="editAssignedlabel" class="d-none" ><div id="editAssignedName0" >Myself</div><span><input id="editCheckboxAssignedTo0" type="checkbox"></span></label>`
    contactsBackend[0].forEach((contact, index) => {
        assignedToSelectionBox.innerHTML += editGetContactsFromContactListHTML(contact, index);
    })
    editToggleVisability();
}

function editassignedToBoxHTML() {
    return `<div onclick="editToggleVisability(); doNotCloseWhenClickedInsightContainer(event); checkboxChanges()"><p>Select contacts to assign</p><img src="../img/addtask-img/arrow_drop_down.png"></div>`;

}

function editToggleVisability() {
    document.getElementById('editAssignedlabel').classList.toggle('d-none');
    document.getElementById('assginedMembersEditTask').classList.toggle('d-none');
    contactsBackend[0].forEach((contact, index) => {
        document.getElementById('editAssignedlabel' + index).classList.toggle('d-none');
    });
}

function hideAssignedToDropDownMenu() {
    let dropdown = document.getElementById('editAssignedlabel');
    let includesDnone = dropdown.classList.contains('d-none');
    if (!includesDnone) {
        hideDropDownMenu = true;
    } else {
        hideDropDownMenu = false;
    }
    if (hideDropDownMenu) {
        document.getElementById('editAssignedlabel').classList.add('d-none');
        document.getElementById('assginedMembersEditTask').classList.remove('d-none');
        checkboxChanges();
    }
}

/**
 * 
 * @param {object} selectedPriority - get the value depends of the selected prio (urgent,medium or low)
 * If the object has a value, it will remove the highlight from the selected priority and change it to the new one.
 */
function editHighlightPriority(prio) {
    if (selectedPriority) {
        let priority = 'editSelect' + selectedPriority;
        document.getElementById(priority).classList.remove('select' + selectedPriority)
    }
    selectedPriority = prio;
    let priority = 'editSelect' + prio;
    document.getElementById(priority).classList.add('select' + selectedPriority);
}

/**
 * Iterate through the chosen tasks selected contacts. If the contact is in the array it will check the boxes, when the window get opened.
 */
function editCheckSelectedContacts(id) {
    if (tasksBackend[0][id]['assignedTo'][0] == "Myself") {
        document.getElementById('editCheckboxAssignedTo0').checked = true;
    }
    for (let checked = 0; checked < tasksBackend[0][id]['assignedTo'].length; checked++) {
        for (let checkTheNames = 0; checkTheNames < contactsBackend[0].length + 1; checkTheNames++) {
            if (tasksBackend[0][id]['assignedTo'][checked] == document.getElementById('editAssignedName' + checkTheNames).innerHTML) {
                document.getElementById('editCheckboxAssignedTo' + checkTheNames).checked = true;
            }
        }
    }
}

/**
 * When opened the value from the selected task will show in the fields. After submit by pressing on ok, it will take the current value and push it in the current task.
 * So its possible to change some values in the task, without to create a new one and delete the current one. 
 */
async function saveChangesInTask(id) {
    let title = document.getElementById('editTaskTitle').value;
    let description = document.getElementById('editTaskDescription').value;
    let date = document.getElementById('editTaskDate').value;
    if (prioIsSelected()) {
        priority = selectedPriority;
    }
    await editGetTheAssignedNames();
    assignedTo = assignedToNames;
    await updateTaskBackend(title, description, date, priority, assignedTo);
    closeSelectedTaskEditWindow();
    await loadTasksForBoard();
    await init();
}

/**
 * Iterate through every label. If there is a checked checkbox, it will push the name into 
 * * @param {object} assignedToNames. After that it will get pushed in the array tasks.
 */
function editGetTheAssignedNames() {
    let divId = document.getElementById('editAssignedToSelection');
    let labels = divId.querySelectorAll("label");
    assignedToNames = [];
    for (let i = 0; i < labels.length; i++) {
        let selected = labels[i];
        if (selected.querySelector("input").checked) {
            assignedToNames.push(selected.textContent)
        }
    }
}

/**
 * this function searches tasks based on input value
 */
function searchTask() {
    const input = document.getElementById("input").value;
    searchTaskArray = [];
    for (let i = 0; i < tasksBackend[0].length; i++) {
        const task = allTasks[i];
        if (
            task.title.toLowerCase().includes(input.toLowerCase()) ||
            task.description.toLowerCase().includes(input.toLowerCase())
        ) {
            searchTaskArray.push(task);
            renderTasks();
        }
    }
}

/**
 * @param {*} id --> Selected Task.
 * @param {*} section --> One of the four sections on the board.
 * @param {*} move --> At the responsive sight there are two buttons on every task. By klicking on them they can be moved "up" or "down"
 */
function klickOnArrowToMoveTask(id, section, move) {
    let taskCategorys = ['taskCategoryToDo', 'taskCategoryInProgress', 'taskCategoryAwaitFeedback', 'taskCategoryDone'];
    if ((section == taskCategorys[0] || section == taskCategorys[1] || section == taskCategorys[2]) && move == 'down') {
        let currentSectionIndex = taskCategorys.indexOf(section);
        if (currentSectionIndex < taskCategorys.length - 1) {
            allTasks[id]['section'] = taskCategorys[currentSectionIndex + 1];
        }
    }
    if ((section == taskCategorys[1] || section == taskCategorys[2] || section == taskCategorys[3]) && move == 'up') {
        let currentSectionIndex = taskCategorys.indexOf(section);
        if (currentSectionIndex <= taskCategorys.length - 1) {
            allTasks[id]['section'] = taskCategorys[currentSectionIndex - 1];
        }
    }
    renderTasks();
}

//----Drag- and dropfunctions---//

function startDragging(id) {
    currentDraggedElement = id;
}

async function dragToOtherCategory(section) {
    document.getElementById(section).classList.remove('drag-area-highlight');
    await updateTaskBackendCategory(section, currentDraggedElement)
    init();
}

//----Helpfunctions---//

function closeSelectedTaskEditWindow() {
    document.getElementById('editSelectedTask').style.display = 'none';
    document.getElementById('content').style.display = 'unset';
}

function togglePopUpTask(param) {
    document.getElementById('addTaskPopUpWindowContent').style.display = param;
}

function highlight(id) {
    document.getElementById(id).classList.add('drag-area-highlight');
}

function removeHighlight(id) {
    document.getElementById(id).classList.remove('drag-area-highlight');
}

function closeEditTaskPopUp() {
    document.getElementById('editTaskPopUpWindowContent').style.display = 'none';
    document.getElementById('content').style.display = 'unset';
}

function allowDrop(ev) {
    ev.preventDefault();
}

function showTaskDelete() {
    document.getElementById('taskDelete').style.display = "flex";
}

function closeTaskDelete() {
    document.getElementById('taskDelete').style.display = "none";
}

async function deleteSelectedTask(id) {
    document.getElementById('taskDelete').style.display = "none";
    await deleteTaskBackend(id)
    closeEditTaskPopUp();
    init();
    
}


function doNotCloseWhenClickedInsightContainer(event) {
    event.stopPropagation();
}



//--------------------------------Django-Backend------------------//


async function getSubtasksBackend() {
    subtasksBackend = [];
    const url = "http://127.0.0.1:8000/tasks/subtasks/";
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Token" + localStorage.getItem('loggedInUserToken'),
            }
        });
        const data = await response.json();
        const formattedData = data.map((subtask) => ({
            id: subtask.id,
            titleFromSub: subtask.titleFromSub,
            status: subtask.status
        }));
        subtasksBackend.push(formattedData)
        return data;
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error)
    }
}

async function getTasksBackend() {
    tasksBackend = [];
    const url = "http://127.0.0.1:8000/tasks/";
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Token " + localStorage.getItem('loggedInUserToken'),
            },
        });
        const data = await response.json();
        const formattedData = data.map((task) => ({
            category: task.category,
            categoryColor: task.categoryColor,
            description: task.description,
            id: task.id,
            date: task.date,
            assignedTo: task.assignedTo,
            priority: task.priority,
            section: task.section,
            subtask: task.subtask,
            title: task.title,
            author: task.author
        }));
        tasksBackend.push(formattedData);
        convertAssignedToIdsToStrings();
        convertSubtaskIdToStrings();
        return data;
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
    }
}

async function updateTaskBackend(title, description, date, priority, assignedTo) {
    assignedTo = await convertAssignedToStringsToIDs(assignedTo);
    const url = `http://127.0.0.1:8000/tasks/${backendIdSelectedTask}/`;
    try {
        await fetch(url, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Token " + localStorage.getItem('loggedInUserToken'),
            },
            body: JSON.stringify({
                "title": title,
                "description": description,
                "date": date,
                "priority": priority,
                "assignedTo": assignedTo
            })
        });
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

async function updateTaskBackendCategory(section, currentDraggedElement) {
    let id = tasksBackend[0][currentDraggedElement]['id']
    const url = `http://127.0.0.1:8000/tasks/${id}/`;
    try {
        await fetch(url, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Token " + localStorage.getItem('loggedInUserToken'),
            },
            body: JSON.stringify({
               "section":section,
            })
        });
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

async function deleteTaskBackend(id){
    const url = `http://127.0.0.1:8000/tasks/delete/${id}/`;
    try {
        await fetch(url , {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Token " + localStorage.getItem('loggedInUserToken'),
            }
        });
    } catch (error) {
        console.error('Error:', error);
    }
}


async function convertAssignedToStringsToIDs(assignedTo) { 
    let idArray = [];
    assignedTo.forEach(string => {
        contactsBackend[0].forEach(contact => {
            if (string == contact['author']['name']) {
                if (!idArray.includes(contact['author']['id'])) {
                    idArray.push(contact['author']['id'])
                }
            }
        });
    });
    return idArray;
}


function convertAssignedToIdsToStrings() {
    for (let i = 0; i < tasksBackend[0].length; i++) {
        let assignedToArray = [];
        tasksBackend[0][i]['assignedTo'].forEach(assignedTo => {
            contactsBackend[0].forEach(contact => {
                if (assignedTo == contact['author']['id']) {
                    if (!assignedToArray.includes(contact['author']['name'])) {
                        assignedToArray.push(contact['author']['name']);
                    }
                }
            });
        });
        tasksBackend[0][i]['assignedTo'] = assignedToArray;
    }
}

function convertSubtaskIdToStrings() {
    for (let i = 0; i < tasksBackend[0].length; i++) {
        let assignedToArray = [];
        tasksBackend[0][i]['subtask'].forEach(assignedTo => {
            subtasksBackend[0].forEach(subtask => {
                if (assignedTo == subtask['id']) {
                    if (!assignedToArray.includes(subtask['titleFromSub'])) {
                        assignedToArray.push({
                            titleFromSub: subtask['titleFromSub'],
                            status: subtask['status']
                        });
                    }
                }
            });
        });
        tasksBackend[0][i]['subtask'] = assignedToArray;
    }
}
