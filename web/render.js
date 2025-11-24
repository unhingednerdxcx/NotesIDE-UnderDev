/*
document.getElementById('btn').addEventListener('click', function() {
    // brn
});
*/


document.addEventListener('DOMContentLoaded', function() {
    let zoomRate = 1;
    const modal = document.getElementById('modal');
    const modalClose = document.getElementById('modal-close');
    const modalCancel = document.getElementById('modal-cancel');
    const modalOk = document.getElementById('modal-ok');
    const modalInput = document.getElementById('modal-input');
    const modalTitle = document.getElementById('modal-title');
    let modalCallback = null;
    const contextMenu = document.getElementById('context-menu');
    const contextOpen = document.getElementById('ctx-open');
    const contextRename = document.getElementById('ctx-rename');
    const contextDelete = document.getElementById('ctx-delete');
    const contextCopyPath = document.getElementById('ctx-copy-path');
    const contextNewFile = document.getElementById('ctx-new-file');
    const contextNewFolder = document.getElementById('ctx-new-folder');
    const contextmenuNotes = document.getElementById('context-menu-notes');
    const contextMakeNote = document.getElementById('ctx-new-note');
    const contextRenameNotes = document.getElementById('ctx-rename-notes');
    const contextDeleteNotes = document.getElementById('ctx-delete-notes');
    const contextmenuDict = document.getElementById('context-menu-dict');
    const contextOpenDict = document.getElementById('ctx-open-dict');
    const contextRenameDict = document.getElementById('ctx-rename-dict');
    const contextDeleteDict = document.getElementById('ctx-delete-dict');
    const contextMakeDict = document.getElementById('ctx-new-dict');


    async function applySetting(grp, subgrp, value) {
        // all logic here
        if (grp === "appear" && subgrp === "Theme") {
            const themes = await eel.getThemes()();
            const selectedTheme = themes[value];

            if (!selectedTheme) {
                console.warn("Theme not found:", value);
                return;
            }

            // apply CSS vars
            for (const key in selectedTheme) {
                document.documentElement.style.setProperty(key, selectedTheme[key]);
            }

            return;
        }

        if (grp === "appear" && subgrp === "Fontsize") {
            document.documentElement.style.setProperty("--font-size", value + "px");
            return;
        }

        if (grp === "appear" && subgrp === "Fontfamily") {
            document.documentElement.style.setProperty("--font-family", value);
            return;
        }

        if (grp === "editor" && subgrp === "Tabsize") {
            editor.updateOptions({ tabSize: parseInt(value) });
            return;
        }

        if (grp === "editor" && subgrp === "Wordwrap") {
            editor.updateOptions({ wordWrap: value ? "on" : "off" });
            return;
        }

        if (grp === "terminal" && subgrp === "Fontsize") {
            terminal.setFontSize(parseInt(value));
            return;
        }

        if (grp === "terminal" && subgrp === "Theme") {
            applyTerminalTheme(value);
            return;
        }

        // fallback
        console.warn("No handler for:", grp, subgrp, value);
    }



    

    // == FREQ USE FUNCTIONS == //

    function log(info, other){
        eel.log('js', info, other);
    }

    window.switchTab = function(tabNumber) {
        log('Switching to tab:', tabNumber);

        const tabs = {
            1: { id: 'main-ide-content', name: 'main-ide' },
            2: { id: 'notes-content', name: 'notes' },
            3: { id: 'dictionary-content', name: 'dictionary' },
            4: { id: 'ports-content', name: 'ports' },
            5: { id: 'circuits-pcb-content', name: 'circuits-pcb' },
            6: { id: 'terminal-content', name: 'terminal' },
            7: { id: 'settings-content', name: 'settings' }
        };

        const tab = tabs[tabNumber];
        if (!tab) return log('Invalid tab number:', tabNumber);

        try {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            
            // Remove active class from all top buttons
            document.querySelectorAll('.top-tab').forEach(b => b.classList.remove('active'));
            
            // Show selected tab or initialize terminal
            const selectedTab = document.getElementById(tab.id);
            if (!selectedTab) return log('Tab not found:', tab.id);

            if (tab.id === 'terminal-content') {
                // Only re-init if not already active
                if (!selectedTab.classList.contains('active')) init_terminal();
            } else {
                selectedTab.classList.add('active');
            }

            // Activate the corresponding button
            const activeButton = document.querySelector(`[data-tab="${tab.name}"]`);
            if (activeButton) activeButton.classList.add('active');

        } catch (e) {
            log(e + '', 'while switching tabs');
        }
    };


    function showNotification(title, message) {
        const notificationBox = document.getElementById('notification-box');
        const closeBtn = document.getElementById('notification-close');
        document.getElementById('notification-title').textContent = title;
        document.getElementById('notification-message').textContent = message;
        notificationBox.classList.add('show');
        const timer = setTimeout(() => {
            notificationBox.classList.remove('show');
        }, 4000);
        closeBtn.addEventListener('click', function(){
            clearTimeout(timer);
            notificationBox.classList.remove('show');
        });
    }

    // === ON PRESSED BUTTON FUNCTIONS === //
    // Hide menu on click outside
    document.addEventListener("click", (e) => {
        if (!contextMenu.contains(e.target)) {
            contextMenu.style.display = "none";
        }
        if (!contextmenuNotes.contains(e.target)) {
            contextmenuNotes.style.display = "none";
        }
        if (!contextmenuDict.contains(e.target)) {
            contextmenuDict.style.display = "none";
        }
        /*
        e.preventDefault();
        e.stopPropagation();
        */
    });

    document.getElementById('open-folder-btn').addEventListener('click', function() {
        eel.openFolder()(function(msg){
            if (msg.success){
                path = msg.path;
                log(`Sent ${path}`, '');
                wScreen = document.getElementById('welcome-screen');
                wScreen.classList.remove('show');
                loadWorkspace(path);
            } else{
                sendNotification(false, e, 1);
            }
        });
    });

    document.getElementById('workspace-btn').addEventListener('click', function() {
            eel.openFolder()(function(msg){
            if (msg.success){
                path = msg.path;
                log(`Sent ${path}`, ''); 
                loadWorkspace(path);
            } else{
                sendNotification(false, e, 1)
            }
        });
    });

    document.getElementById('save-all-btn').addEventListener('click', function() {
        Array.from(fileTabs.children).forEach(function(file){
            if(file.dataset.type === 'file'){
                let path = file.dataset.path;
                eel.readFile(path, file.dataset.name)(function(msg){
                    if (msg.success){
                        let content = msg.content
                        eel.saveFile(content)(function(msg){
                            if (msg.success){
                                showNotification('Success', 'Saved all files successfully!');
                            } else {
                                showNotification('Fail', 'Could not save all files successfully!');
                            }
                        });
                    }
                    else{
                        showNotification('Fail', `Could not read all files due to ${msg.error}`);
                    }
                });
            }
        });
    });

    document.getElementById('settings-btn').addEventListener('click', function() {
        switchTab(7)
        log(`Switched to tab 7`, '');
    });

    document.getElementById('open-recent-btn').addEventListener('click', function() {
        // LATER
    });

    document.getElementById('refresh-files-btn').addEventListener('click', function() {
        loadEditor()
    });

    document.getElementById('new-file-btn').addEventListener('click', async function() {
        workspace = document.getElementById('workspace-name');
        const path = workspace.dataset.path;
        const fileName = await showModal('Enter file name', 'Newfile.txt');
        log('got filename:', fileName)
        eel.makeFile(path, fileName)(function(msg){
            if (msg.success){
                showNotification('Success', 'File made successfully');
                eel.listFiles(path)(function(msg){
                    if (msg.success) {
                        document.getElementById('welcome-screen').style.display = 'none';
                        document.querySelector('.app-container').style.display = 'block';
                        document.getElementById('workspace-name').textContent = path.split('/').pop() || path.split('\\').pop();
                        workspace = document.getElementById('workspace-name');
                        workspace.dataset.path = path;
                        populateFiles(msg.files);
                    } else{
                        showNotification('Fail', msg.error);
                    }
                });
            } else{
                showNotification('Fail', `Could not save file due to ${msg.message}`)
            }
        })
    });

    document.getElementById('new-folder-btn').addEventListener('click', function() {
        workspace = document.getElementById('workspace-name');
        const path = workspace.dataset.path;
        eel.makeFolder(path)(function(msg){
            if (msg.success){
                showNotification('Success', 'File made successfully');
            } else{
                showNotification('Fail', `Could not save file due to ${msg.message}`)
            }
        })
    });

    document.getElementById('run-btn').addEventListener('click', function() {
        // LATER BUT FOR NOW run(); for TERMINAL tab
    });

    document.getElementById('save-btn').addEventListener('click', function() {
        const content = editor.getValue();
        const file_path = document.getElementById('current-file-name').dataset.path;
        if (file_path) {
                eel.saveFile(content, file_path)(function(msg) {
                    if (msg.success) {
                        showNotification('Success', 'File saved successfully');
                    } else {
                        showNotification('Error', msg.message);
                    }
                });
            } else {
                // Show save as dialog
                SaveAs();
            }
    });

    document.getElementById('new-note-btn').addEventListener('click', async function() {
        const fileName = await showModal('Enter file name', 'NewNote');
        eel.newNote(fileName)(function(msg){
            if (!fileName || !fileName.trim()) {
                log('User canceled or entered empty file name', '');
                return; // don't call Python if no input
            }
            log('m', msg);
            if (msg.success){
                showNotification('Success', 'New note made succesfully!');
                eel.listNotes()(function(msg){
                    if (msg.success){
                        populateNotesList(msg.Notes)
                    } else{
                        showNotification('Fail', `Could not display notes due to ${msg.error}`)
                    }
                });
            } else{
                showNotification('Fail', `New note could not be made due to ${msg.error}`);
            }
        });
    });

    document.getElementById('save-note-btn').addEventListener('click', function() {
        const content = editor.getValue();
        const NoteName = document.getElementById('current-note-name').textContent;
        eel.saveNote(NoteName, content)(function(msg){
            if (msg.success){
                showNotification('Fail', `Could not save note due to ${msg.e}`);
            }
        });
    });

    document.getElementById('new-dictionary-btn').addEventListener('click', async function() {
        const fileName = await showModal('Enter file name', 'NewNote');
        log('filename for dict:', fileName)
        eel.newDict(fileName)(function(msg){
            log('', msg.success);
            if (!msg.success){
                showNotification('Success', 'New Dictionary made succesfully!');
            } else{
                showNotification('Fail', `New Dictionary could not be made due to ${msg.error}`);
            }
        });
    });

    document.getElementById('save-dictionary-btn').addEventListener('click', function() {
        const content = editor.getValue();
        const dictName = document.getElementById('current-dictionary-name').textContent;
        eel.saveDict(dictName, content)(function(msg){
            if (!msg.success){
                showNotification('Fail', `Could not save note due to ${msg.e}`);
            }
        });
    });

    // document.getElementById('select-file-btn').addEventListener('click', function() {
        // LATER
    // });

    document.getElementById('load-image-btn').addEventListener('click', function() {
        eel.displayPic()(async function(msg){
            if (msg.success){
                showNotification('Success', 'Loaded immage successfully');
                try {
                    const imgHolder = document.getElementById("image-preview");
                    const placeholder = document.getElementById("placeholder");

                    const img = document.createElement("img");
                    img.src = msg.img;  // your rtr/image file
                    img.alt = "Circuit Preview";

                    // Remove placeholder
                    if (placeholder) placeholder.remove();

                    // Add image
                    imgHolder.appendChild(img);
                } catch (e){
                    showNotification('Fail', `image could not be loaded due to ${e}`);
                }
            }
            else{
                showNotification('Fail', `Could not loaded immage due to ${msg.e}`);
            }
        });
    });

    document.getElementById('zoom-in-btn').addEventListener('click', function() {
        if (img_exist){
            imgBlock = document.getElementById('image');
            zoomRate += 0.2;
            if (zoomRate >= 0 && zoomRate <= 2.2){
                imgBlock.style.transform = `scale(${zoomRate})`;
            } else {
                zoomRate = 1;
            }
        }
    });

    document.getElementById('zoom-out-btn').addEventListener('click', function() {
        if (img_exist){
            imgBlock = document.getElementById('image');
            zoomRate -= 0.2;
            if (zoomRate >= 0 && zoomRate <= 2.2){
                imgBlock.style.transform = `scale(${zoomRate})`;
            } else {
                zoomRate = 1;
            }
        } 
    });

    document.getElementById('restart-terminal-btn').addEventListener('click', function() {
        // LATER but for now ResetTerminal();
    });


    document.getElementById('port-select-btn').addEventListener('click', function() {
        const portFileBtn = this;
        eel.openUploadFile()(function(msg){
            if (msg.success) {
                portFileBtn.dataset.path = msg.path;
                document.getElementById("text-file-path").placeholder = msg.path;
                log('at prts', `${msg.path} and ${portFileBtn.dataset.path}`)
            } else{
                showNotification(`Fail`, `Couldn't open file due to ${msg.e}`)
            }
        });
    });


    document.getElementById('refresh-ports-btn').addEventListener('click', function() {
        loadPorts();
    });

    document.getElementById('verbose-output').addEventListener('change', function() {
        const isChecked = this.checked;  // true or false
        this.dataset.checked = isChecked ? "True" : "False";
        log('verbose', isChecked);
    });

    document.getElementById('verify-upload').addEventListener('change', function() {
        const isChecked = this.checked;  // true or false
        this.dataset.checked = isChecked ? "True" : "False";
        log("verify-upload", isChecked);
    });


    contextOpen.addEventListener('click', function() {
        const path = contextMenu.dataset.path;
        const name = contextMenu.dataset.name;
        const type = contextMenu.dataset.type;
        
        if (type === 'file') {
            openFile(path, name);
        } else {
            // Handle folder opening if needed
        }
        contextMenu.style.display = "none";
    });

    contextRename.addEventListener('click', async function() {
        const path = contextMenu.dataset.path;
        const name = contextMenu.dataset.name;
        const type = contextMenu.dataset.type;
        
        const newName = await showModal('Enter new name', name);
        if (newName && newName.trim() !== '') {
            eel.renameFile(newName, name, path)(function(msg) {
                if (msg.success) {
                    showNotification('Success', 'Renamed successfully');
                    // Refresh the file tree
                    const workspace = document.getElementById('workspace-name');
                    loadWorkspace(workspace.dataset.path);
                } else {
                    showNotification('Error', msg.message);
                }
            });
        }
        contextMenu.style.display = "none";
    });

    contextDelete.addEventListener('click', function() {
        const path = contextMenu.dataset.path;
        const name = contextMenu.dataset.name;
        const type = contextMenu.dataset.type;
        
        if (confirm(`Are you sure you want to delete ${name}?`)) {
            eel.deleteFile(path)(function(msg) {
                if (msg.success) {
                    showNotification('Success', 'Deleted successfully');
                    const workspace = document.getElementById('workspace-name');
                    loadWorkspace(workspace.dataset.path);
                } else {
                    showNotification('Error', msg.message);
                }
            });
        }
        contextMenu.style.display = "none";
    });

    contextCopyPath.addEventListener('click', function() {
        const path = contextMenu.dataset.path;
        
        // Copy to clipboard
        navigator.clipboard.writeText(path).then(function() {
            showNotification('Success', 'Path copied to clipboard');
        }, function(err) {
            showNotification('Error', 'Could not copy path');
        });
        contextMenu.style.display = "none";
    });


    contextNewFile.addEventListener('click', function(){
        let path = contextMenu.dataset.path;
        path = path.substring(0, path.lastIndexOf('/'));
        eel.makeFile(path, 'NewFile.txt')(function(msg){
            if (!msg.success){
                showNotification('Fail', `Could not load fule due to ${msg.e}`)
            } else{
                showNotification('Success', 'Could make a new file');
                const workspace = document.getElementById('workspace-name');
                loadWorkspace(workspace.dataset.path);
            }
        });
    });

    contextNewFolder.addEventListener('click', function(){
        let path = contextMenu.dataset.path;
        path = path.substring(0, path.lastIndexOf('/'));
        eel.makeNewFolder(path)(function(msg){
            if (msg.success){
                showNotification('Success', 'Was able to load a new folder');
                const workspace = document.getElementById('workspace-name');
                loadWorkspace(workspace.dataset.path);
            } else{
                showNotification('Fail', `Was not able to load file due to ${msg.e}`)
            }
        });
    });

    contextMakeNote.addEventListener('click', function(){
        eel.newNote('NewNote')(function(msg){
            if (msg.success == false){
                showNotification('Fail', `Could not make new note due to: ${msg.e}`);
            }
            else{
                showNotification('Success', 'Renamed successfully');
                // Refresh the file tree
                loadNotes();
            }
        });
    });

    contextRenameNotes.addEventListener('click', async function(){
        const name = contextmenuNotes.dataset.name;

        const newName = await showModal('Enter new name', name);
        if (newName && newName.trim() !== '') {
            eel.renameFile(newName, 'NFOLDER', name)(function(msg) {
                if (msg.success) {
                    showNotification('Success', 'Renamed successfully');
                    // Refresh the file tree
                    loadNotes();
                } else{
                    log('', msg.message);
                    showNotification('Fail', `Could not load notes due to ${msg.message}`)
                }
            });
        }
    });

    contextDeleteNotes.addEventListener('click', function(){
        eel.deleteFile(contextmenuNotes.dataset.path)(function(msg){
            if (msg.success == true){
                showNotification('Succes', 'Was able to delete Notes');
                loadNotes();
            } else{
                showNotification('Fail', `could not delete file due to ${msg.message}`);
            }
        });
    });


    contextOpenDict.addEventListener('click', function(){
        log('', '')
    });

    contextRenameDict.addEventListener('click', async function(){
        const name = contextmenuDict.dataset.name;

        const newName = await showModal('Enter new name', name);
        if (newName && newName.trim() !== '') {
            eel.renameFile(newName, 'DFOLDER', name)(function(msg) {
                if (msg.success) {
                    showNotification('Success', 'Renamed successfully');
                    // Refresh the file tree
                    loadDict();
                } else{
                    log('', msg.message);
                    showNotification('Fail', `Could not load dictionary due to ${msg.message}`)
                }
            });
        }
    });

    contextDeleteDict.addEventListener('click', function(){
        eel.deleteFile(contextmenuDict.dataset.path)(function(msg){
            if (msg.success == true){
                showNotification('Succes', 'Was able to delete Dictionary');
                loadNotes();
            } else{
                showNotification('Fail', `could not delete file due to ${msg.message}`);
            }
        });
    });


    contextMakeDict.addEventListener('click', function(){
        eel.newDict('NewDict')(function(msg){
            if (msg.success == false){
                showNotification('Fail', `Could not make new file due to: ${msg.message}`);
            }
            else{
                showNotification('Success', 'Renamed successfully');
                loadDict();
            }
        });
    });


    document.addEventListener('keydown', function(e){
        if (e.altKey && !isNaN(e.key)) {
            switchTab(Number(e.key));
        }
    });





    // === MAIN === //
        updateTime();
        setInterval(updateTime, 1000);

    // === FUNCTIONS === //
    window.refresh = function(type){
        switch(type){
            case 'Main': loadEditor();
            case 'Note': loadNotes();
            case 'Dict': loadDict();
        }
    }
    // == EDITOR == //
    window.loadEditor = function(){
        const workspace = document.getElementById('workspace-name');
        const path = workspace.dataset.path;
        loadWorkspace(path)
    }
    function loadWorkspace(path){
        eel.listFiles(path)(function(msg){
            if (msg.success) {
                document.getElementById('welcome-screen').style.display = 'none';
                document.querySelector('.app-container').style.display = 'block';
                document.getElementById('workspace-name').textContent = path.split('/').pop() || path.split('\\').pop();
                workspace = document.getElementById('workspace-name');
                workspace.dataset.path = path;
                populateFiles(msg.files);
            } else{
                showNotification('Fail', msg.error);
            }
        });
    }


   

    function populateFiles(files) {
        const fileTree = document.getElementById('file-tree');
        fileTree.innerHTML = '';

        files.forEach(function(object){
            const li = document.createElement('li');
            li.className = 'file-tree-name';

            if (object.type === 'folder'){
                li.innerHTML = `
                <i class="fas fa-folder"></i>
                <span>${object.name}</span>
                `;
            } else {
                li.innerHTML =`
                <i class="fas fa-file"></i>
                <span>${object.name}</span>
                `;
            }

            li.dataset.path = object.path;
            li.dataset.name = object.name;
            li.dataset.type = object.type;

            li.addEventListener('click', function(){
                if (object.type === 'file'){
                    openFile(object.path, object.name);
                }
            });

            // Right-click (context menu)
            li.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();

                // Show menu at mouse position
                contextMenu.style.display = "block";
                contextMenu.style.left = `${e.pageX}px`;
                contextMenu.style.top = `${e.pageY}px`;

                // Store details for button actions
                contextMenu.dataset.path = object.path;
                contextMenu.dataset.name = object.name;
                contextMenu.dataset.type = object.type;
            });


            fileTree.appendChild(li);
        });
    }

    function openFile(path, name){
        eel.readFile(path, name)(function(msg){
            if (msg.success){
                // Wait until the editor is ready, then set its content
                window.editorReady.then(() => {
                    editor.setValue(msg.content);
                    const model = editor.getModel();
                    monaco.editor.setModelLanguage(model, msg.language);
                    document.getElementById('current-file-name').textContent = name;
                    document.getElementById('current-file-name').dataset.path = path;
                    document.getElementById('status-file').textContent = name;
                    document.getElementById('status-lang').textContent = msg.language;
                    addTab(name, path);
                });
            } else {
                showNotification('Error', msg.message);
            }
        });
    }


    
    function addTab(name, path){
        const fileTabs = document.getElementById('file-tabs');
        const fileExist = Array.from(fileTabs.children).find(function(tab) {
            return tab.dataset.path === path;
        });

        if(fileExist){
            // Activate existing tab
            document.querySelectorAll('.file-tab').forEach(function(tab){ 
                tab.classList.remove('active');
            });
            fileExist.classList.add('active');
            return; // Exit since we're using an existing tab
        }
        
        // Create new tab if it doesn't exist
        const tab = document.createElement('div');
        tab.className = 'file-tab active';
        tab.dataset.path = path;
        tab.innerHTML = `
            <span class="tab-name">${name}</span>
            <button class="close-tab-btn">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.querySelectorAll('.file-tab').forEach(t => 
            t.classList.remove('active')
        );

        tab.querySelector('.close-tab-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            fileTabs.removeChild(tab);
            
            // If this was the active tab, activate another one
            if (fileTabs.children.length > 0) {
                fileTabs.children[0].classList.add('active');
                // Load the file for the new active tab
                const newPath = fileTabs.children[0].dataset.path;
                const newName = fileTabs.children[0].querySelector('span').textContent;
                openFile(newPath, newName);
            } else {
                // No tabs left, clear editor
                editor.setValue('');
                document.getElementById('current-file-name').textContent = 'Untitled';
                document.getElementById('current-file-name').removeAttribute('data-path');
            }
        });
        
        // Add click to activate tab
        tab.addEventListener('click', function() {
            document.querySelectorAll('.file-tab').forEach(t => 
                t.classList.remove('active')
            );
            tab.classList.add('active');
            openFile(path, name);
        });
        
        fileTabs.appendChild(tab);
    }

    

    function updateTime() {
        const now = new Date();
        const hour = now.getHours().toString().padStart(2, '0');
        const min = now.getMinutes().toString().padStart(2, '0');
        const second = now.getSeconds().toString().padStart(2, '0');
        
        document.getElementById('current-time').textContent = `${hour}:${min}:${second}`;
    }



    async function showModal(title, defaultValue = '') {
        return new Promise(resolve => {
            const modalTitle = document.getElementById('modal-title');
            const modalInput = document.getElementById('modal-input');
            const modal = document.getElementById('modal');
            const modalOk = document.getElementById('modal-ok');
            const modalCancel = document.getElementById('modal-cancel');
            const modalClose = document.getElementById('modal-close');

            modalTitle.textContent = title;
            modalInput.value = defaultValue;

            // show modal
            modal.classList.add('show');
            modalInput.focus();
            modalInput.select();
            

            const okHandler = () => { resolve(modalInput.value); closeModal(); };
            const cancelHandler = () => { resolve(null); closeModal(); };
            const keyHandler = e => {
                if (e.key === 'Enter') okHandler();
                else if (e.key === 'Escape') cancelHandler();
            };

            function closeModal() {
                modal.classList.remove('show');
                modalOk.removeEventListener('click', okHandler);
                modalCancel.removeEventListener('click', cancelHandler);
                modalClose.removeEventListener('click', cancelHandler);
                modalInput.removeEventListener('keydown', keyHandler);
            }

            modalOk.addEventListener('click', okHandler);
            modalCancel.addEventListener('click', cancelHandler);
            modalClose.addEventListener('click', cancelHandler);
            modalInput.addEventListener('keydown', keyHandler);
        });
    }



    // == NOTES == //

    window.loadNotes = function(){
        eel.listNotes()(function(msg){
            if (msg.success){
                populateNotesList(msg.Notes)
            } else{
                showNotification('Fail', `Could not display notes due to ${msg.error}`)
            }
        });
    }

    function populateNotesList(notes){
        const NotesList = document.getElementById('notes-list');
        NotesList.innerHTML = '';

        notes.forEach(function(note){
            const li = document.createElement('li');
            li.className = 'note-name';
            li.innerHTML = `
            <i class="fas fa-sticky-note"></i>
            <span>${note.name}</span>
            `;

            li.dataset.path = note.path;
            li.dataset.name = note.name;

            li.addEventListener('click', function(){
                openNote(note.path, note.name);
            });

            li.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();

                // Show the Notes context menu
                contextmenuNotes.style.display = "block";
                contextmenuNotes.style.left = `${e.pageX}px`;
                contextmenuNotes.style.top = `${e.pageY}px`;

                // Store details for button actions
                contextmenuNotes.dataset.path = note.path;
                contextmenuNotes.dataset.name = note.name;
            });


            NotesList.appendChild(li);
        });
    }

    function openNote(path, name){
        eel.readFile(path, name)(function(msg){
            if (msg.success){
                noteEditor.setValue(msg.content);
                document.getElementById('current-note-name').textContent = name;
            } else{
                showNotification('Fail', `error while trying to load note due to ${msg.error}`);
            }
        });
    }

    // == DICTIOANRY == //

    window.loadDict = function(){
        eel.listDict()(function(msg){
            if (msg.success){
                populateDictList(msg.Dict)
            } else{
                showNotification('Fail', `Could not display notes due to ${msg.error}`)
            }
        });
    }

    function populateDictList(dicts) {
        const dictList = document.getElementById('dictionary-list');
        dictList.innerHTML = '';

        dicts.forEach(function(dict) {
            const li = document.createElement('li');
            li.className = 'dict-name';

            li.innerHTML = `
                <i class="fas fa-book-open"></i>
                <span>${dict.name}</span>
            `;

            li.dataset.path = dict.path;
            li.dataset.name = dict.name;

            li.addEventListener('click', function() {
                openDict(dict.path, dict.name);
            });

            li.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();

                // Show the Dictionary context menu
                contextmenuDict.style.display = "block";
                contextmenuDict.style.left = `${e.pageX}px`;
                contextmenuDict.style.top = `${e.pageY}px`;

                // Store details for button actions
                contextmenuDict.dataset.path = dict.path;
                contextmenuDict.dataset.name = dict.name;
            });

            dictList.appendChild(li);
        });
    }

    function openDict(path, name){
        eel.readFile(path, name)(function(msg){
            if (msg.success){
                dictEditor.setValue(msg.content);
                document.getElementById('current-dictionary-name').textContent = name;
            } else{
                showNotification('Fail', `error while trying to load note due to ${msg.error}`);
            }
        });
    }
    // == TERMINAL == //
    let term; // make term global so other functions can access it

    window.init_terminal = function() {
        term = new Terminal();
        term.open(document.getElementById('terminal'));
        term.write('Hello from embedded terminal!\r\n');

        let commandBuffer = '';

        term.onKey(e => {
            const key = e.key;

            if (key === '\r') { // Enter pressed
                const cmd = commandBuffer.trim();
                eel.execute_command(cmd); // call Python function
                term.write('\r\n'); // new line
                commandBuffer = ''; // reset buffer
            } else if (key === '\u007F') { // Backspace
                if (commandBuffer.length > 0) {
                    commandBuffer = commandBuffer.slice(0, -1);
                    term.write('\b \b');
                }
            } else {
                commandBuffer += key;
                term.write(key);
            }
        });
    }

    // Function to receive output from Python
    function outputTerminal(data) {
        term.write(data);
    }

    window.term_output = outputTerminal;
    // == Ports == //

    window.loadPorts = function() {
        const selectionPort = document.getElementById('serial-port-select');
        eel.getPorts()(function(msg){
            if (msg.success){
                ports = msg.ports;
                ports.forEach(function(port){
                    const option = document.createElement("option");
                    option.value = port;
                    option.textContent = port;
                    selectionPort.appendChild(option);
                    option.addEventListener("change", function(){
                        select.dataset.selectedPort = select.value;
                        log('ports', select.dataset.selectedPort);
                    });
                });

                
            }
        });
    }

    // == Setting == //

    window.switchSetting = function(tabNumber) {
        log('Switching to settings tab:', tabNumber);

        const settingsTabs = {
            1: { id: 'appearance-settings', name: 'appearance' },
            2: { id: 'editor-settings', name: 'editor' },
            3: { id: 'terminal-settings', name: 'terminal' },
            4: { id: 'application-settings', name: 'application' },
            5: { id: 'keybindings-settings', name: 'keybindings' }
        };

        const tab = settingsTabs[tabNumber];
        if (!tab) return log('Invalid settings tab number:', tabNumber);

        try {
            // Hide all settings panels
            document.querySelectorAll('.settings-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            
            // Remove active class from all settings category buttons
            document.querySelectorAll('.settings-category').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected settings panel
            const selectedPanel = document.getElementById(tab.id);
            if (!selectedPanel) return log('Settings panel not found:', tab.id);

            selectedPanel.classList.add('active');

            // Activate the corresponding settings category button
            const activeButton = document.querySelector(`[onclick="switchSetting(${tabNumber})"]`);
            if (activeButton) activeButton.classList.add('active');

        } catch (e) {
            log(e + '', 'while switching settings tabs');
        }
    }

    window.set = async function(grp, subgrp, value){
        log('from js', `${grp}, ${subgrp} ${value}`)
        eel.jsonmanager('s', grp, subgrp, value)(function(msg){
            if (msg.success !== true){
                showNotification('Fail', `could not load file due to ${msg.e}`)
            }
        });
        await applySetting(grp, subgrp, value);
    }
});
