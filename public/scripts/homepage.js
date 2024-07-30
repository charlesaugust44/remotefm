
const socket = io();
const directory = "<%= directory %>";

socket.on('update-progress', (data) => {
    const output = document.getElementById('updateOutput');
    output.value += data + "\n";
    output.scrollTop = output.scrollHeight;  // Automatically scroll to the bottom
});

socket.on('update-complete', (data) => {
    const output = document.getElementById('updateOutput');
    output.value += data + "\n";
    output.scrollTop = output.scrollHeight;  // Automatically scroll to the bottom
});

function viewMetadata(filename, button) {
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
    fetch(`/metadata?path=${filename}`)
        .then(response => response.json())
        .then(data => {
            button.disabled = false;
            button.innerHTML = 'Metadata';
            const titleInput = document.getElementById('metadataTitle');
            const editButton = document.getElementById('editTitleButton');
            const saveButton = document.getElementById('saveTitleButton');
            const progressContainer = document.getElementById('progressContainer');
            const metaFilename = document.getElementById('metadata-filename');

            titleInput.value = data.title;
            metaFilename.innerText = data.filename;
            titleInput.dataset.filename = filename; // Store filename in a data attribute
            editButton.style.display = 'block';
            saveButton.style.display = 'none';
            progressContainer.style.display = 'none';
            $('#metadataModal').modal('show');
        })
        .catch(error => {
            button.disabled = false;
            button.innerHTML = 'Metadata';
            console.error('Error:', error);
        });
}


function startEditingTitle() {
    const titleInput = document.getElementById('metadataTitle');
    const editButton = document.getElementById('editTitleButton');
    const saveButton = document.getElementById('saveTitleButton');

    titleInput.readOnly = false;
    editButton.style.display = 'none';
    saveButton.style.display = 'block';
}

function saveTitle() {
    const titleInput = document.getElementById('metadataTitle');
    const saveButton = document.getElementById('saveTitleButton');
    const progressContainer = document.getElementById('progressContainer');
    const progressStatus = document.getElementById('progressStatus');

    saveButton.disabled = true;
    progressContainer.style.display = 'block';
    progressStatus.textContent = 'Starting...';

    fetch('/metadata', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            filepath: titleInput.dataset.filename, // Get filename from data attribute
            title: titleInput.value
        }).toString()
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Title updated successfully');
                $('#metadataModal').modal('hide');
            } else {
                alert('Failed to update title');
            }
        })
        .catch(error => {
            alert('Error updating title');
            console.error('Error:', error);
        })
        .finally(() => {
            saveButton.disabled = false;
        });
}


// Handle progress updates from the server
socket.on('update-progress', (data) => {
    const progressStatus = document.getElementById('progressStatus');
    progressStatus.textContent = data;
});

function runUpdate(dryRun) {
    // Show the modal
    $('#updateModal').modal('show');

    // Clear the previous output
    const output = document.getElementById('updateOutput');
    output.value = '';

    fetch(`/update?dry=${dryRun}`, { method: 'POST' })
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
}

function showRenameModal(filename) {
    $('#newFileName').val(filename);
    $('#oldFileName').val(filename);
    $('#renameModal').modal('show');
    
    let inputElement = document.getElementById("newFileName");
    const length = inputElement.value.length;
    inputElement.setSelectionRange(length, length);
    inputElement.focus();
}

$('#renameForm').on('submit', function (e) {
    e.preventDefault();
    fetch('/move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(new FormData(this)).toString()
    })
        .then(response => response.text())
        .then(() => location.reload())
        .catch(error => console.error('Error:', error));
});

function showMoveModal(filename) {
    fetch(`/folders?path=${encodeURIComponent(directory)}`)
        .then(response => response.json())
        .then(folders => {
            const folderList = document.getElementById('folderList');
            const currentPath = document.getElementById('currentPath');
            folderList.innerHTML = '';  // Clear previous entries
            folders.forEach(folder => {
                const li = document.createElement('li');
                li.classList.add('list-group-item');
                li.textContent = folder;
                li.onclick = () => {
                    // Update move destination
                    document.getElementById('moveDestination').value = path.join(directory, folder);
                    showMoveModal(filename);
                };
                folderList.appendChild(li);
            });
            currentPath.textContent = `Current Path: ${directory}`;
            $('#moveModal').modal('show');
        })
        .catch(error => console.error('Error:', error));
}

function fetchFolders(currentPath) {
    fetch(`/folders?path=${encodeURIComponent(currentPath)}`)
        .then(response => response.json())
        .then(data => {
            const folderList = document.getElementById('folderList');
            folderList.innerHTML = '';
            document.getElementById('currentPath').innerText = `Current Path: ${currentPath}`;
            data.forEach(folder => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = folder;
                li.onclick = () => fetchFolders(path.join(currentPath, folder));
                folderList.appendChild(li);
            });
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = '..';
            li.onclick = () => fetchFolders(path.dirname(currentPath));
            folderList.appendChild(li);
            $('#moveDestination').val(currentPath);
        });
}

$('#moveForm').on('submit', function (e) {
    e.preventDefault();
    fetch('/move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(new FormData(this)).toString()
    })
        .then(response => response.text())
        .then(() => location.reload())
        .catch(error => console.error('Error:', error));
});

function getFileIcon(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return 'bi-file-earmark-image';
        case 'mp4':
        case 'mkv':
        case 'webm':
            return 'bi-file-earmark-play';
        case 'txt':
        case 'md':
        case 'json':
        case 'xml':
            return 'bi-file-earmark-text';
        default:
            return 'bi-file-earmark';
    }
}