// Global variables
let editor = document.getElementById('editor');
let saveTimeout;
let lastSaveTime = new Date();

// Page management variables
let currentPageIndex = 0;
let pages = [editor]; // Initialize with the existing editor as the first page

// Initialize editor
document.addEventListener('DOMContentLoaded', function() {
    updateWordCount();
    updateLastEdited();
    
    // Auto-save functionality
    // Event listener for the current editor (page)
    editor.addEventListener('input', function() {
        updateWordCount();
        updateSaveStatus('Saving...');
        
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            autoSave();
        }, 2000);
    });

    // Update formatting buttons based on selection
    document.addEventListener('selectionchange', updateFormattingButtons);
    
    // Load saved content
    loadDocument();
    updatePageIndicator(); // Update page indicator on load
});

// Command execution
function execCommand(command, value = null) {
    document.execCommand(command, false, value);
    editor.focus();
    updateFormattingButtons();
}

// Toggle formatting
function toggleFormat(command) {
    execCommand(command);
    updateFormattingButtons();
}

// Update formatting button states
function updateFormattingButtons() {
    const commands = ['bold', 'italic', 'underline', 'strikeThrough'];
    commands.forEach(command => {
        const btn = document.getElementById(command + 'Btn');
        if (btn) {
            if (document.queryCommandState(command)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
}

// Font management
function changeFont(fontFamily) {
    execCommand('fontName', fontFamily);
}

function toggleFontSizeDropdown() {
    const dropdown = document.getElementById('fontSizeDropdown');
    dropdown.classList.toggle('show');
}

function changeFontSize(size) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = size;
        
        try {
            range.surroundContents(span);
        } catch (e) {
            span.appendChild(range.extractContents());
            range.insertNode(span);
        }
        
        selection.removeAllRanges();
    }
    
    document.getElementById('currentFontSize').textContent = size;
    document.getElementById('fontSizeDropdown').classList.remove('show');
    editor.focus();
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.font-size-dropdown')) {
        document.getElementById('fontSizeDropdown').classList.remove('show');
    }
});

// Panel management
function showPanel(panelId) {
    closeAllPanels();
    document.getElementById('overlay').classList.add('active');
    document.getElementById(panelId).classList.add('active');
}

function closeAllPanels() {
    document.getElementById('overlay').classList.remove('active');
    document.querySelectorAll('.floating-panel').forEach(panel => {
        panel.classList.remove('active');
    });
}

// Link insertion
function insertLink() {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    if (selectedText) {
        document.getElementById('linkText').value = selectedText;
    }
    
    showPanel('linkPanel');
}

function createLink() {
    const text = document.getElementById('linkText').value;
    const url = document.getElementById('linkUrl').value;
    
    if (text && url) {
        const link = `<a href="${url}" target="_blank">${text}</a>`;
        execCommand('insertHTML', link);
        closeAllPanels();
        
        // Clear form
        document.getElementById('linkText').value = '';
        document.getElementById('linkUrl').value = '';
    }
}

// Image insertion
function insertImage() {
    showPanel('imagePanel');
}

function createImage() {
    const url = document.getElementById('imageUrl').value;
    const alt = document.getElementById('imageAlt').value;
    
    if (url) {
        const img = `<img src="${url}" alt="${alt}" style="max-width: 100%; height: auto; margin: 10px 0;">`;
        execCommand('insertHTML', img);
        closeAllPanels();
        
        // Clear form
        document.getElementById('imageUrl').value = '';
        document.getElementById('imageAlt').value = '';
    }
}

// Table insertion
function insertTable() {
    showPanel('tablePanel');
}

function createTable() {
    const rows = parseInt(document.getElementById('tableRows').value);
    const cols = parseInt(document.getElementById('tableCols').value);
    
    let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
    
    for (let i = 0; i < rows; i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < cols; j++) {
            tableHTML += '<td style="border: 1px solid #ddd; padding: 8px; min-width: 100px; min-height: 30px;">&nbsp;</td>';
        }
        tableHTML += '</tr>';
    }
    
    tableHTML += '</table>';
    
    execCommand('insertHTML', tableHTML);
    closeAllPanels();
}

// Page management functions
function addPage() {
    // Save current page content before adding a new one
    pages[currentPageIndex].innerHTML = editor.innerHTML;

    const newPage = document.createElement('div');
    newPage.className = 'page';
    newPage.contentEditable = true;
    newPage.innerHTML = '<p><br></p>'; // Add a blank paragraph for immediate typing
    document.getElementById('pageContainer').appendChild(newPage);
    pages.push(newPage);
    switchPage(pages.length - 1);
    autoSave(); // Save after adding a page
}

function deletePage() {
    if (pages.length > 1) {
        if (confirm('Are you sure you want to delete this page?')) {
            const pageToDelete = pages[currentPageIndex];
            pageToDelete.remove();
            pages.splice(currentPageIndex, 1);
            if (currentPageIndex >= pages.length) {
                currentPageIndex = pages.length - 1;
            }
            switchPage(currentPageIndex);
            autoSave(); // Save after deleting a page
        }
    } else {
        alert('Cannot delete the last page.');
    }
}

function switchPage(index) {
    if (index < 0 || index >= pages.length) {
        console.error('Invalid page index:', index);
        return;
    }

    // Save current page content before switching
    if (editor) { // Check if editor is defined (it might not be on initial load)
        pages[currentPageIndex].innerHTML = editor.innerHTML;
    }

    // Deactivate current page
    if (pages[currentPageIndex]) {
        pages[currentPageIndex].classList.remove('active');
    }

    currentPageIndex = index;
    editor = pages[currentPageIndex]; // Update the global editor reference
    
    // Activate new page
    if (editor) {
        editor.classList.add('active');
        editor.focus();
    }
    
    updatePageIndicator();
    updateWordCount();
}

function nextPage() {
    if (currentPageIndex < pages.length - 1) {
        switchPage(currentPageIndex + 1);
    }
}

function prevPage() {
    if (currentPageIndex > 0) {
        switchPage(currentPageIndex - 1);
    }
}

function updatePageIndicator() {
    document.getElementById('pageIndicator').textContent = `${currentPageIndex + 1} / ${pages.length}`;
    document.getElementById('currentPage').textContent = currentPageIndex + 1;
    document.getElementById('totalPages').textContent = pages.length;
}

// Word and character count
function updateWordCount() {
    // Ensure editor is correctly set to the current page
    const currentEditor = pages[currentPageIndex];
    if (!currentEditor) {
        document.getElementById('wordCount').textContent = 0;
        document.getElementById('charCount').textContent = 0;
        return;
    }
    const text = currentEditor.innerText || currentEditor.textContent || '';
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const characters = text.length;
    
    document.getElementById('wordCount').textContent = words.length;
    document.getElementById('charCount').textContent = characters;
}

// Save functionality
function autoSave() {
    const title = document.getElementById('docTitle').value;
    // Ensure current page content is saved before mapping
    pages[currentPageIndex].innerHTML = editor.innerHTML;
    const pagesContent = pages.map(page => page.innerHTML);
    
    // Save to localStorage
    localStorage.setItem('docuEditContent', JSON.stringify(pagesContent));
    localStorage.setItem('docuEditTitle', title);
    
    lastSaveTime = new Date();
    updateSaveStatus('All changes saved');
    updateLastEdited();
}

function loadDocument() {
    const savedTitle = localStorage.getItem('docuEditTitle');
    if (savedTitle) {
        document.getElementById('docTitle').value = savedTitle;
    }

    const savedContent = localStorage.getItem('docuEditContent');
    if (savedContent) {
        const pagesContent = JSON.parse(savedContent);
        const pageContainer = document.getElementById('pageContainer');
        pageContainer.innerHTML = ''; // Clear existing content

        pages = []; // Reset pages array
        pagesContent.forEach((content, index) => {
            const newPage = document.createElement('div');
            newPage.className = 'page';
            newPage.contentEditable = true;
            newPage.innerHTML = content;
            pageContainer.appendChild(newPage);
            pages.push(newPage);
        });
        // Ensure the first page is active and editor points to it
        if (pages.length > 0) {
            switchPage(0);
        } else {
            // If no saved content, create a default first page
            const defaultPage = document.createElement('div');
            defaultPage.className = 'page';
            defaultPage.contentEditable = true;
            defaultPage.innerHTML = '<h1>Welcome to DocuEdit</h1><p>Start typing your document here.</p>';
            document.getElementById('pageContainer').appendChild(defaultPage);
            pages.push(defaultPage);
            switchPage(0);
        }
    } else {
        // If no saved content at all, ensure the initial editor is set up as the first page
        const initialEditor = document.getElementById('editor');
        if (initialEditor && pages.length === 0) { // Only add if not already added
            pages.push(initialEditor);
            initialEditor.classList.add('active');
        } else if (pages.length > 0) {
            // If pages array already has content (e.g., from initial HTML), activate the first one
            switchPage(0);
        }
    }
    updateWordCount();
}


function updateSaveStatus(status) {
    document.getElementById('saveStatus').textContent = status;
}

function updateLastEdited() {
    const now = new Date();
    const diff = now - lastSaveTime;
    
    let timeText;
    if (diff < 60000) {
        timeText = 'Just now';
    } else if (diff < 3600000) {
        timeText = Math.floor(diff / 60000) + ' minutes ago';
    } else {
        timeText = Math.floor(diff / 3600000) + ' hours ago';
    }
    
    document.getElementById('lastEdited').textContent = timeText;
}

// Share functionality
function shareDocument() {
    showPanel('sharePanel');
}

function sendShare() {
    const emails = document.getElementById('shareEmails').value;
    
    if (emails) {
        // Simulate sharing
        alert('Document shared successfully with: ' + emails);
        closeAllPanels();
        document.getElementById('shareEmails').value = '';
    }
}

// Export functionality
function exportDocument() {
    const title = document.getElementById('docTitle').value || 'Document';
    
    // Combine content from all pages for export
    const allContent = pages.map(page => page.innerHTML).join('<div style="page-break-after: always;"></div>');

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                table { border-collapse: collapse; width: 100%; margin: 10px 0; }
                td { border: 1px solid #ddd; padding: 8px; }
                .page { min-height: 800px; padding: 20px; border: 1px solid #eee; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            ${allContent}
        </body>
        </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = title + '.html';
    a.click();
    URL.revokeObjectURL(url);
}

// Print functionality
function printDocument() {
    window.print();
}

// Update last edited time periodically
setInterval(updateLastEdited, 60000);

// Auto-save title changes
document.getElementById('docTitle').addEventListener('input', function() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        autoSave();
    }, 1000);
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'b':
                e.preventDefault();
                toggleFormat('bold');
                break;
            case 'i':
                e.preventDefault();
                toggleFormat('italic');
                break;
            case 'u':
                e.preventDefault();
                toggleFormat('underline');
                break;
            case 's':
                e.preventDefault();
                autoSave();
                break;
            case 'p':
                e.preventDefault();
                printDocument();
                break;
        }
    }
});