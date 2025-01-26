document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('loginBtn').addEventListener('click', login);
});

let userId;
let role;
const api = 'http://localhost/tms_project/api/api.php';

function login() {
    const id = document.getElementById('id').value;
    const password = document.getElementById('password').value;

    fetch(api, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            action: 'login',
            id: id,
            password: password,
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if (data.success) {
            if (data.role != 'fired') {
                userId = data.userId;
                role = data.role;
                document.getElementById('auth').style.display = 'none';
                document.getElementById('mainUI').style.display = 'block';
                document.getElementById('sidebar').style.display = 'block';
                document.getElementById('sidebar').classList.add('d-flex');
                document.getElementById('toggleButton').style.display = 'block';
                document.getElementById('sidebaritems').style.display = 'block';
                showId();
                if (data.role === 'manager') {
                    document.getElementById('createPanelbtn').style.display = 'block';
                    document.getElementById('viewPanelbtn').style.display = 'block';
                    document.getElementById('workerPanelbtn').style.display = 'block';
                    document.getElementById('personalArchivePanelbtn').style.display = 'block';
                    document.getElementById('archivePanelbtn').style.display = 'block';
                    document.getElementById('userManagementPanelbtn').style.display = 'block';
                    loadDepartments("active");
                    loadDepartments("archive");
                    loadDepartments("user");
                    loadDepartments("userManagement");
                } else if (data.role === 'worker') {
                    document.getElementById('workerPanelbtn').style.display = 'block';
                    document.getElementById('personalArchivePanelbtn').style.display = 'block';
                }
            }
            else {
                logout();
            }
        } else {
            document.getElementById('authMessage').innerText = data.message;
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function logout() {
    fetch(`${api}?action=logout`)
        .then(response => response.json())
        .then(result => {
            console.info(result);
            userId = null;
            role = null;

            document.getElementById('mainUI').style.display = 'none';
            document.getElementById('sidebar').classList.remove('d-flex');
            document.getElementById('sidebar').style.display = 'none';

            document.getElementById('auth').style.display = 'block';
            document.getElementById('authMessage').innerText = '';

            document.getElementById('id').value = '';
            document.getElementById('password').value = '';

            document.getElementById('workerPanelbtn').style.display = 'none';
            document.getElementById('createPanelbtn').style.display = 'none';
            document.getElementById('viewPanelbtn').style.display = 'none';
            document.getElementById('personalArchivePanelbtn').style.display = 'none';
            document.getElementById('archivePanelbtn').style.display = 'none';

            document.getElementById('userList').innerHTML = '';
            document.getElementById('taskList').innerHTML = '';
            document.getElementById('archiveTaskList').innerHTML = '';
            document.getElementById('workerTaskList').innerHTML = '';
            document.getElementById('personalArchiveTaskList').innerHTML = '';
        })
        .catch(error => {
            console.error('Error during logout:', error);
        });
}

function createUser () {
    const name = document.getElementById('newUserName').value;
    const lastName = document.getElementById('newUserLastName').value;
    const role = document.getElementById('newUserRole').value;
    const password = document.getElementById('newUserPassword').value;
    const department = document.getElementById('newUserDepartment').value;

    fetch(api, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            action: 'createUser',
            name: name,
            last_name: lastName,
            role: role,
            password: password,
            department: department,
        }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.success ? 'User is created' : data.message);
    });
}

function loadUsers() {
    fetch(`${api}?action=getUsers`)
        .then(response => response.json())
        .then(users => {
            const userList = document.getElementById('userList');
            userList.innerHTML = "";
            users.forEach(user => {
                userList.innerHTML += `<p>ID: ${user.id} | Name: ${user.name} | Last name: ${user.last_name} - ${user.role} | ${user.department} </p>`;
            });
        }); 
}

function cardTask(task, panel) {
    return `
    <div class="card mb-3">
        <div class="card-header" id="heading${sanitizeTaskName(task.name)}">
            <h5 class="mb-0">
                <button class="btn btn-link" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${sanitizeTaskName(task.name)}" aria-expanded="true" aria-controls="collapse${sanitizeTaskName(task.name)}">
                    ${task.name}
                </button>
            </h5>
        </div>
        <div id="collapse${sanitizeTaskName(task.name)}" class="collapse" aria-labelledby="heading${sanitizeTaskName(task.name)}">
            <div class="card-body">
                <div class="mb-5">
                    <textarea class="form-control mb-3" readonly>${task.description}</textarea>
                    <h6>Comments:</h6>
                    <ul>
                        ${task.comments ? formatComments(task.comments) : "<li>No comments available</li>"}
                    </ul>
                    ${createFileDownloadAccordion(task.id)}
                    ${taskFunctions(task, panel)}
                </div>
            </div>
        </div>
    </div>
    `;
}

function taskFunctions(task, panel) {
    if (task.status == "active") {
        return `
            <div class="mb-5">
                <h5>Functions: </h5>
                ${editTaskPanel(task.id,task.name,task.description,panel)}
                ${addCommentPanel(task.id)}
                ${uploadFilePanel(task.id)}
                ${archiveButton(panel,task.id,task.status)}
            </div>
        `;
    }
    else { return ""; }
}

function archiveButton(panel,taskId,taskStatus) {
    if (role == "manager" && panel == "view") {
        return `
            <button class="btn btn-primary mb-3" onclick="changeTaskStatus(${taskId},'${taskStatus}')">Archive Task</button>
        `;
    }
    else { return ""; }
}

function changeTaskStatus(taskId,taskStatus) {
    confirm_archiving = confirm("Are you sure?");
    let newTaskStatus;
    if (confirm_archiving) {
        if (taskStatus == "active") {
            newTaskStatus = "archive";
        }
        else {
            newTaskStatus = "active";
        }
        fetch(api, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'updateTaskStatus',
                task_id: taskId,
                status: newTaskStatus,
            }),
        })
        .then(response => response.json())
        .then(data => {
            alert(data.success ? 'Task status updated successfully' : data.message);
        })
        .catch(error => {
            console.error('Error updating task status:', error);
        });
    }
}

function loadArchiveTasks() {
    fetch(`${api}?action=getArchiveTasks`)
        .then(response => response.json())
        .then(tasks => {
            const taskList = document.getElementById('archiveTaskList');
            taskList.innerHTML = "";
            tasks.forEach(task => {
                taskList.innerHTML += cardTask(task);
            });
        })
        .catch(error => {
            console.error('Error with loading of tasks:', error);
        });
}

function createTask() {
    const name = document.getElementById('newTaskName').value;
    const description = document.getElementById('newTaskDescription').value;
    const workerId = document.getElementById('newTaskWorkerId').value;

    fetch(api, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            action: 'createTask',
            name: name,
            description: description,
            user_id: userId,
            worker_id: workerId
        }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.success ? 'Task is created' : data.message);
    });
}

function loadMyTasks() {
    fetch(`${api}?action=getUserTasks&worker_id=${userId}`)
        .then(response => response.json())
        .then(tasks => {
            const myTaskList = document.getElementById('workerTaskList');
            myTaskList.innerHTML = "";
            tasks.forEach(task => {
                myTaskList.innerHTML += cardTask(task, "work");
            });
        })
        .catch(error => {
            console.error('Error with loading of tasks:', error);
        });
}

function loadMyArchiveTasks() {
    fetch(`${api}?action=getUserArchiveTasks&worker_id=${userId}`)
        .then(response => response.json())
        .then(tasks => {
            const myTaskList = document.getElementById('personalArchiveTaskList');
            myTaskList.innerHTML = "";
            tasks.forEach(task => {
                myTaskList.innerHTML += cardTask(task);
            });
        })
        .catch(error => {
            console.error('Error with loading of tasks:', error);
        });
}

function formatComments(commentsJson) {
    try {
        const comments = JSON.parse(commentsJson);
        return comments.map(comment => `<li>${comment}</li>`).join('');
    } catch (error) {
        console.error('Error parsing comments:', error);
        return '<li>Error loading comments</li>';
    }
}


function updateTask(taskId) {
    const taskName = document.getElementById(`editTaskName${taskId}`).value;
    const taskDescription = document.getElementById(`editTaskDescription${taskId}`).value;

    fetch(api, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            action: 'updateTask',
            task_id: taskId,
            name: taskName,
            description: taskDescription,
        }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.success ? 'Task updated successfully' : data.message);
    })
    .catch(error => {
        console.error('Error updating task:', error);
    });
}

function showId() {
    document.getElementById('UId').innerText = "ID:";
    document.getElementById('UId').innerText += userId.toLocaleString();
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('dateTime').innerText = now.toLocaleString();
}
setInterval(updateDateTime, 1000);
updateDateTime();

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (document.getElementById('sidebaritems').style.display == "none") {
        document.getElementById('sidebaritems').style.display = 'block';
    }
    else{
        document.getElementById('sidebaritems').style.display = 'none';
    }
    sidebar.classList.toggle('collapsed');
}

function toggleElement(button) {
    const cardBody = button.closest('.card-body');
    const collapse = cardBody.previousElementSibling;

    if (collapse.classList.contains('show')) {
        collapse.classList.remove('show');
    } else {
        collapse.classList.add('show');
    }
}

function sanitizeTaskName(taskName) {
    return taskName.replace(/[^a-zA-Zа-яА-Я0-9_]+/g, '_');
}

function createFileDownloadAccordion(taskId) {
    return `
        <div class="accordion mb-3" id="accordionDownloadFile">
            <div class="card">
                <div class="card-header" id="headingDownloadFile">
                    <h5 class="mb-0">
                        <button class="btn btn-link" type="button" data-bs-toggle="collapse" data-bs-target="#collapseDownloadFile" aria-expanded="true" aria-controls="collapseDownloadFile" onclick="loadFileList(${taskId})">
                            Download Files
                        </button>
                    </h5>
                </div>
                <div id="collapseDownloadFile" class="collapse" aria-labelledby="headingDownloadFile" data-bs-parent="#accordionDownloadFile">
                    <div class="card-body">
                        <ul id="fileList${taskId}" class="list-group"></ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showPanel(panel) {
    document.getElementById(panel).style.display = 'block';
}

function hidePanel(panel) {
    document.getElementById(panel).style.display = 'none';
}

function loadFileList(taskId) {
    if (!taskId) {
        console.error('Task ID is required to load file list.');
        return;
    }

    const url = `${api}?action=getFileList&taskId=${taskId}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const fileList = document.getElementById(`fileList${taskId}`);
            fileList.innerHTML = '';

            if (data.success && data.files) {
                data.files.forEach(file => {
                    const listItem = document.createElement('li');
                    listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                    listItem.innerHTML = `
                        ${file.name}
                        <button class="btn btn-primary btn-sm" onclick="downloadFile('${file.path}')">Download</button>
                    `;
                    fileList.appendChild(listItem);
                });
            } else {
                const messageItem = document.createElement('li');
                messageItem.className = 'list-group-item text-danger';
                messageItem.textContent = data.message || 'No files found.';
                fileList.appendChild(messageItem);
            }
        })
        .catch(error => {
            console.error('Error loading file list:', error);
        });
}

function addComment(taskId) {
    const comment = document.getElementById(`commentText${taskId}`).value;

    fetch(api, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            action: 'addComment',
            task_id: taskId,
            comment: comment,
        }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.success ? 'Comment added successfully' : data.message);
    })
    .catch(error => {
        console.error('Error adding comment:', error);
    });
}

function downloadFile(filePath) {
    const link = document.createElement('a');
    link.href = filePath;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function uploadFile(taskId) {
    const fileInput = document.getElementById(`fileUpload${taskId}`);

    if (!fileInput.files.length) {
        alert('Please select a file to upload.');
        return;
    }

    const file = fileInput.files[0];

    const maxFileSize = 100 * 1024 * 1024;
    if (file.size > maxFileSize) {
        alert('File size exceeds 100 MB. Please select a smaller file.');
        return;
    }

    const formData = new FormData();
    formData.append('action', 'uploadFile');
    formData.append('task_id', taskId);
    formData.append('file', file);

    fetch(api, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('File uploaded successfully');
        } else {
            alert('Upload failed: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error uploading file:', error);
        alert('An error occurred while uploading the file. Please try again.');
    })
}

function editTaskPanel(taskId,taskName,taskDescription,panel) {
    if (role == "manager" && panel == "view"){
        return `
        <div class="card mb-3">
            <div class="card-header" id="headingOneEditPanel${taskId}">
                <h5 class="mb-0">
                    <button class="btn btn-link" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOneEditPanel${taskId}" aria-expanded="true" aria-controls="collapseOneEditPanel${taskId}">
                        Edit task
                    </button>
                </h5>
            </div>
            <div id="collapseOneEditPanel${taskId}" class="collapse aria-labelledby="headingOneEditPanel${taskId}">
                <div class="card-body">
                    <input type="text" id="editTaskName${taskId}" class="form-control" placeholder="New Task Name" value="${taskName}">
                    <textarea id="editTaskDescription${taskId}" class="form-control mb-3" placeholder="New Description">${taskDescription}</textarea>
                    <button class="btn btn-primary mb-3" onclick="updateTask(${taskId})">Update Task</button>
                </div>
            </div>
        </div>
    `;
    }
    else { return ""; }
}

function addCommentPanel(taskId) {
    if (role == "manager" || role == "worker"){
        return `
        <div class="card mb-3">
            <div class="card-header" id="headingOneCommentPanel${taskId}">
                <h5 class="mb-0">
                    <button class="btn btn-link" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOneCommentPanel${taskId}" aria-expanded="true" aria-controls="collapseOneCommentPanel${taskId}">
                        Add comment
                    </button>
                </h5>
            </div>
            <div id="collapseOneCommentPanel${taskId}" class="collapse" aria-labelledby="headingOneCommentPanel${taskId}">
                <div class="card-body">
                    <textarea id="commentText${taskId}" class="form-control mb-3" placeholder="Comment"></textarea>
                    <button class="btn btn-primary mb-3" onclick="addComment(${taskId})">Add Comment</button>
                </div>
            </div>
        </div>
    `;
    }
    else { return ""; }
}

function uploadFilePanel(taskId) {
    if (role == "manager" || role == "worker"){
        return `
        <div class="card mb-3">
            <div class="card-header" id="headingOneUploadPanel${taskId}">
                <h5 class="mb-0">
                    <button class="btn btn-link" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOneUploadPanel${taskId}" aria-expanded="true" aria-controls="collapseOneUploadPanel${taskId}">
                        Upload File
                    </button>
                </h5>
            </div>
            <div id="collapseOneUploadPanel${taskId}" class="collapse" aria-labelledby="headingOneUploadPanel${taskId}">
                <div class="card-body">
                    <input type="file" id="fileUpload${taskId}" class="form-control mb-3">
                    <button class="btn btn-primary mb-3" onclick="uploadFile(${taskId})">Upload File</button>
                </div>
            </div>
        </div>
    `;
    }
    else { return ""; }
}

function loadDepartments(select) {
    let selectedDepartment;
    switch (select) {
        case "archive":
            selectedDepartment = 'archiveDepartmentSelect';
            break;
        case "active":
            selectedDepartment = 'departmentSelect';
            break;
        case "user":
            selectedDepartment = 'userDepartmentSelect';
            break;
        case "userManagement":
            selectedDepartment = 'managementDepartmentSelect';
            break;
    }
    fetch(`${api}?action=getDepartments`)
        .then(response => response.json())
        .then(departments => {
            const departmentSelect = document.getElementById(selectedDepartment);
            departmentSelect.innerHTML = '<option value="">Select Department</option>';
            departments.forEach(department => {
                departmentSelect.innerHTML += `<option value="${department.department}">${department.department}</option>`;
            });
        });
}

function loadWorkersByDepartment(status) {
    let selectDepartment, selectWorker;
    if (status == "archive") {
        selectDepartment = 'archiveDepartmentSelect';
        selectWorker = 'archiveWorkerSelect';
    }
    else {
        selectDepartment = 'departmentSelect';
        selectWorker = 'workerSelect';
    }
    const department = document.getElementById(selectDepartment).value;
    if (department) {
        fetch(`${api}?action=getWorkersByDepartment&department=${department}`)
            .then(response => response.json())
            .then(workers => {
                const workerSelect = document.getElementById(selectWorker);
                workerSelect.innerHTML = '<option value="">Select Worker</option>';
                workers.forEach(worker => {
                    workerSelect.innerHTML += `<option value="${worker.id}">${worker.name} ${worker.last_name}</option>`;
                });
            });
    } else {
        document.getElementById(selectWorker).innerHTML = '<option value="">Select Worker</option>';
    }
}

function loadFilteredTasks() {
    const department = document.getElementById('departmentSelect').value;
    const workerId = document.getElementById('workerSelect').value;

    let url = `${api}?action=getFilteredTasks`;

    if (department) {
        url += `&department=${encodeURIComponent(department).replace(/[^a-zA-Z0-9_]+/g, '_')}`;
    }
    if (workerId) {
        url += `&worker_id=${workerId}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(tasks => {
            const taskList = document.getElementById('taskList');
            taskList.innerHTML = "";
            tasks.forEach(task => {
                taskList.innerHTML += cardTask(task, "view");
            });
        })
        .catch(error => {
            console.error('Error loading filtered tasks:', error);
        });
}

function loadArchiveFilteredTasks() {
    const department = document.getElementById('archiveDepartmentSelect').value;
    const workerId = document.getElementById('archiveWorkerSelect').value;

    let url = `${api}?action=getArchiveFilteredTasks`;

    if (department) {
        url += `&department=${encodeURIComponent(department).replace(/[^a-zA-Zа-яА-Я0-9_]+/g, '_')}`;
    }
    if (workerId) {
        url += `&worker_id=${workerId}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(tasks => {
            const taskList = document.getElementById('archiveTaskList');
            taskList.innerHTML = "";
            tasks.forEach(task => {
                taskList.innerHTML += cardTask(task, "archive");
            });
        })
        .catch(error => {
            console.error('Error loading filtered tasks:', error);
        });
}

function loadRoles(select) {
    const roles = ['admin', 'manager', 'worker', 'fired'];
    const userRoleSelect = document.getElementById(select);
    userRoleSelect.innerHTML = '<option value="">Select Role</option>';
    roles.forEach(role => {
        userRoleSelect.innerHTML += `<option value="${role}">${role.charAt(0).toUpperCase() + role.slice(1)}</option>`;
    });
}

function loadFilteredUsers() {
    const department = document.getElementById('userDepartmentSelect').value;
    const role = document.getElementById('userRoleSelect').value;

    let url = `${api}?action=getFilteredUsers`;

    if (department) {
        url += `&department=${encodeURIComponent(department)}`;
    }
    if (role) {
        url += `&role=${encodeURIComponent(role)}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(users => {
            const userList = document.getElementById('userList');
            userList.innerHTML = "";
            users.forEach(user => {
                userList.innerHTML += `<p>ID: ${user.id} | Name: ${user.name} | Last name: ${user.last_name} - ${user.role} | ${user.department} </p>`;
            });
        })
        .catch(error => {
            console.error('Error loading filtered users:', error);
        });
}

function updateTaskCount() {
    fetch(`${api}?action=getUserTasks&worker_id=${userId}`)
        .then(response => response.json())
        .then(tasks => {
            const activeTasks = tasks.length;
            const taskCountElement = document.getElementById('taskCount');
            taskCountElement.innerText = activeTasks;
            taskCountElement.style.display = activeTasks > 0 ? 'inline' : 'none';
        })
        .catch(error => {
            console.error('Error fetching tasks:', error);
        });
}
setInterval(updateTaskCount, 1000);
updateTaskCount();

function loadFilteredManagementUsers() {
    const department = document.getElementById('managementDepartmentSelect').value;
    const role = document.getElementById('managementRoleSelect').value;

    let url = `${api}?action=getFilteredUsers`;

    if (department) {
        url += `&department=${encodeURIComponent(department)}`;
    }
    if (role) {
        url += `&role=${encodeURIComponent(role)}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(users => {
            const managementUserList = document.getElementById('managementUserList');
            managementUserList.innerHTML = "";
            users.forEach(user => {
                managementUserList.innerHTML += `
                    <div id="user-${user.id}">
                        <p>ID: ${user.id} | Name: ${user.name} | Last name: ${user.last_name} - ${user.role} | ${user.department} 
                        <button class="btn btn-danger btn-sm" onclick="fireUser (${user.id})">Fire</button>
                        </p>
                    </div>
                `;
            });
        })
        .catch(error => {
            console.error('Error loading filtered management users:', error);
        });
}

function fireUser(userId) {
    const confirmationDiv = document.createElement('div');
    confirmationDiv.innerHTML = `
        <p>Are you sure you want to fire this user?</p>
        <button class="btn btn-danger btn-sm" onclick="confirmFireUser(${userId}, this)">Yes</button>
        <button class="btn btn-secondary btn-sm" onclick="cancelFireUser(this)">No</button>
    `;
    confirmationDiv.className = "confirmation-div";
    const userDiv = document.getElementById(`user-${userId}`);
    userDiv.appendChild(confirmationDiv);
}

function confirmFireUser (userId, button) {
    fetch(api, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            action: 'updateUserRole',
            user_id: userId,
            role: 'fired'
        }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.success ? 'User access revoked successfully' : data.message);
        loadFilteredManagementUsers();
    })
    .catch(error => {
        console.error('Error firing user:', error);
    });

    const confirmationDiv = button.parentElement;
    confirmationDiv.remove();
}

function cancelFireUser(button) {
    const confirmationDiv = button.parentElement;
    confirmationDiv.remove();
}
