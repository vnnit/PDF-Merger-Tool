// State
let filesState = [];
let nextId = 1;

// Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const emptyNotice = document.getElementById('emptyNotice');
const controlsBar = document.getElementById('controlsBar');
const mergeCard = document.getElementById('mergeCard');
const fileCountText = document.getElementById('fileCountText');
const btnAddMore = document.getElementById('btnAddMore');
const btnClearAll = document.getElementById('btnClearAll');
const btnMerge = document.getElementById('btnMerge');
const outputFileName = document.getElementById('outputFileName');
const progressWrapper = document.getElementById('progressWrapper');
const progressBarFill = document.getElementById('progressBarFill');
const progressStatusText = document.getElementById('progressStatusText');
const progressPercentText = document.getElementById('progressPercentText');

// Format file size
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Drag & Drop events on DropZone
['dragenter', 'dragover'].forEach(eventName => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
  });
});

dropZone.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  const files = dt.files;
  if (files && files.length > 0) {
    handleFilesSelected(files);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files.length > 0) {
    handleFilesSelected(e.target.files);
    fileInput.value = ''; // Reset for re-selection
  }
});

btnAddMore.addEventListener('click', () => {
  fileInput.click();
});

btnClearAll.addEventListener('click', () => {
  if (filesState.length === 0) return;
  if (confirm('Bạn có chắc muốn xóa tất cả các file đã chọn?')) {
    filesState = [];
    renderFileList();
  }
});

// Render thumbnail of page 1 using pdf.js
async function generateThumbnail(arrayBuffer) {
  if (!window.pdfjsLib) return null;
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.3 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (err) {
    console.warn('Cannot generate thumbnail:', err);
    return null;
  }
}

// Parse selected files
async function handleFilesSelected(fileListObj) {
  const validFiles = Array.from(fileListObj).filter(f => 
    f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf'
  );

  if (validFiles.length === 0) {
    alert('Vui lòng chọn các file có định dạng PDF!');
    return;
  }

  for (const file of validFiles) {
    const currentId = nextId++;
    const item = {
      id: currentId,
      file: file,
      name: file.name,
      size: file.size,
      pageCount: '...',
      pageRange: '',
      thumbUrl: null,
      buffer: null
    };

    filesState.push(item);
    renderFileList();

    // Process PDF metadata asynchronously in background
    (async () => {
      try {
        const buffer = await file.arrayBuffer();
        item.buffer = buffer;
        
        // Load with pdf-lib to get actual page count
        const pdfDoc = await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
        item.pageCount = pdfDoc.getPageCount();

        // Generate thumbnail
        const thumb = await generateThumbnail(buffer);
        if (thumb) {
          item.thumbUrl = thumb;
        }
      } catch (err) {
        console.error('Lỗi đọc file:', file.name, err);
        item.pageCount = 'Lỗi / Khóa';
      }
      renderFileList();
    })();
  }
}

// Render the UI list
function renderFileList() {
  const hasFiles = filesState.length > 0;
  emptyNotice.style.display = hasFiles ? 'none' : 'block';
  controlsBar.style.display = hasFiles ? 'flex' : 'none';
  mergeCard.style.display = hasFiles ? 'block' : 'none';
  fileCountText.textContent = `${filesState.length} file đã chọn`;

  // Remove existing items except emptyNotice
  const items = fileList.querySelectorAll('.file-item');
  items.forEach(el => el.remove());

  filesState.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'file-item';
    li.dataset.id = item.id;

    // Drag handle
    const handle = document.createElement('div');
    handle.className = 'drag-handle';
    handle.title = 'Kéo để đổi thứ tự';
    handle.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
        <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
        <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
      </svg>
    `;

    // Index
    const idxEl = document.createElement('div');
    idxEl.className = 'file-index';
    idxEl.textContent = `#${index + 1}`;

    // Thumbnail
    const thumbBox = document.createElement('div');
    thumbBox.className = 'file-thumb-container';
    if (item.thumbUrl) {
      const img = document.createElement('img');
      img.src = item.thumbUrl;
      img.className = 'file-thumb-canvas';
      img.alt = 'Preview';
      thumbBox.appendChild(img);
    } else {
      thumbBox.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      `;
    }

    // Info
    const info = document.createElement('div');
    info.className = 'file-info';
    info.innerHTML = `
      <div class="file-name" title="${item.name}">${item.name}</div>
      <div class="file-meta">
        <span class="meta-tag">${formatBytes(item.size)}</span>
        <span class="meta-tag">${typeof item.pageCount === 'number' ? item.pageCount + ' trang' : item.pageCount}</span>
      </div>
    `;

    // Page Range selector
    const pageSelector = document.createElement('div');
    pageSelector.className = 'file-page-selector';
    pageSelector.innerHTML = `
      <label>Trang:</label>
      <input type="text" class="file-page-input" placeholder="Tất cả (vd: 1-3, 5)" value="${item.pageRange}" title="Để trống nếu muốn lấy tất cả các trang, hoặc nhập khoảng trang (ví dụ: 1-3, 5)">
    `;
    const pageInput = pageSelector.querySelector('input');
    pageInput.addEventListener('change', (e) => {
      item.pageRange = e.target.value.trim();
    });

    // Actions
    const actions = document.createElement('div');
    actions.className = 'file-actions';

    // Move Up
    const btnUp = document.createElement('button');
    btnUp.className = 'icon-btn';
    btnUp.title = 'Di chuyển lên';
    btnUp.disabled = index === 0;
    btnUp.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
    btnUp.addEventListener('click', () => moveItem(index, index - 1));

    // Move Down
    const btnDown = document.createElement('button');
    btnDown.className = 'icon-btn';
    btnDown.title = 'Di chuyển xuống';
    btnDown.disabled = index === filesState.length - 1;
    btnDown.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    btnDown.addEventListener('click', () => moveItem(index, index + 1));

    // Delete
    const btnDelete = document.createElement('button');
    btnDelete.className = 'icon-btn delete-btn';
    btnDelete.title = 'Xóa file này';
    btnDelete.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
    btnDelete.addEventListener('click', () => removeItem(item.id));

    actions.appendChild(btnUp);
    actions.appendChild(btnDown);
    actions.appendChild(btnDelete);

    li.appendChild(handle);
    li.appendChild(idxEl);
    li.appendChild(thumbBox);
    li.appendChild(info);
    li.appendChild(pageSelector);
    li.appendChild(actions);

    fileList.appendChild(li);
  });
}

// Move item position
function moveItem(fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= filesState.length) return;
  const item = filesState.splice(fromIndex, 1)[0];
  filesState.splice(toIndex, 0, item);
  renderFileList();
}

// Remove item
function removeItem(id) {
  filesState = filesState.filter(item => item.id !== id);
  renderFileList();
}

// Init SortableJS for drag and drop reordering
if (window.Sortable) {
  Sortable.create(fileList, {
    handle: '.drag-handle',
    animation: 200,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: (evt) => {
      const movedItem = filesState.splice(evt.oldIndex, 1)[0];
      filesState.splice(evt.newIndex, 0, movedItem);
      renderFileList();
    }
  });
}

// Parse page range string (e.g. "1-3, 5, 7-10") into 0-based indices array
function parsePageRanges(rangeStr, totalPages) {
  if (!rangeStr || !rangeStr.trim()) {
    // Return all pages
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const result = new Set();
  const parts = rangeStr.split(/[,;\s]+/);

  for (const part of parts) {
    if (!part) continue;
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          result.add(p - 1); // 0-based
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        result.add(p - 1);
      }
    }
  }

  const indices = Array.from(result).sort((a, b) => a - b);
  return indices.length > 0 ? indices : Array.from({ length: totalPages }, (_, i) => i);
}

// Merge PDFs
btnMerge.addEventListener('click', async () => {
  if (filesState.length === 0) {
    alert('Vui lòng thêm ít nhất 1 file PDF để ghép!');
    return;
  }

  btnMerge.disabled = true;
  progressWrapper.style.display = 'block';
  progressBarFill.style.width = '0%';
  progressStatusText.textContent = 'Bắt đầu quá trình ghép...';
  progressPercentText.textContent = '0%';

  try {
    const { PDFDocument } = PDFLib;
    const mergedPdf = await PDFDocument.create();
    const totalFiles = filesState.length;

    for (let i = 0; i < totalFiles; i++) {
      const item = filesState[i];
      const percent = Math.round(((i) / totalFiles) * 85);
      progressBarFill.style.width = `${percent}%`;
      progressPercentText.textContent = `${percent}%`;
      progressStatusText.textContent = `Đang xử lý: ${item.name} (${i + 1}/${totalFiles})...`;

      let buffer = item.buffer;
      if (!buffer) {
        buffer = await item.file.arrayBuffer();
      }

      const srcPdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const totalPages = srcPdf.getPageCount();
      const pageIndices = parsePageRanges(item.pageRange, totalPages);

      const copiedPages = await mergedPdf.copyPages(srcPdf, pageIndices);
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    progressBarFill.style.width = '90%';
    progressPercentText.textContent = '90%';
    progressStatusText.textContent = 'Đang đóng gói file PDF hoàn chỉnh...';

    const mergedBytes = await mergedPdf.save();

    progressBarFill.style.width = '100%';
    progressPercentText.textContent = '100%';
    progressStatusText.textContent = 'Ghép hoàn tất! Đang tải xuống...';

    // Trigger download
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    let fileName = outputFileName.value.trim() || 'merged_document.pdf';
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      fileName += '.pdf';
    }
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      progressStatusText.textContent = 'Thành công! File đã được tải về máy của bạn.';
    }, 500);

  } catch (error) {
    console.error('Lỗi khi ghép file:', error);
    alert('Đã xảy ra lỗi khi ghép file: ' + error.message);
    progressStatusText.textContent = 'Đã xảy ra lỗi khi ghép file!';
  } finally {
    btnMerge.disabled = false;
  }
});
