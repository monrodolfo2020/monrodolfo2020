/* ==========================================================================
   PID Extractor — Frontend logic (vanilla JS, no frameworks)
   ========================================================================== */

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // State IDs
  // -------------------------------------------------------------------------
  const STATES = ['upload', 'processing', 'results', 'error'];

  // -------------------------------------------------------------------------
  // DOM refs
  // -------------------------------------------------------------------------
  const stateEls = {};
  STATES.forEach(s => { stateEls[s] = document.getElementById('state-' + s); });

  const dropZone       = document.getElementById('drop-zone');
  const fileInput      = document.getElementById('file-input');
  const fileNameDisplay = document.getElementById('file-name-display');
  const extractBtn     = document.getElementById('extract-btn');
  const uploadForm     = document.getElementById('upload-form');

  const resultTotal    = document.getElementById('result-total');
  const resultPages    = document.getElementById('result-pages');
  const resultPids     = document.getElementById('result-pids');
  const resultTitles   = document.getElementById('result-titles');
  const lowConfWarn    = document.getElementById('low-conf-warning');
  const lowConfText    = document.getElementById('low-conf-text');
  const typeBadges     = document.getElementById('type-badges');
  const downloadBtn    = document.getElementById('download-btn');
  const resetBtn       = document.getElementById('reset-btn');

  const errorMessage   = document.getElementById('error-message');
  const retryBtn       = document.getElementById('retry-btn');

  // -------------------------------------------------------------------------
  // State machine
  // -------------------------------------------------------------------------
  function showState(name) {
    STATES.forEach(s => {
      stateEls[s].classList.toggle('active', s === name);
    });
  }

  // -------------------------------------------------------------------------
  // File handling
  // -------------------------------------------------------------------------
  let selectedFile = null;
  let currentJobId = null;

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function setFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showError('Only PDF files are accepted. Please select a .pdf file.');
      return;
    }
    selectedFile = file;
    fileNameDisplay.textContent = file.name + ' (' + formatBytes(file.size) + ')';
    dropZone.classList.add('has-file');
    extractBtn.disabled = false;
  }

  // File input change
  fileInput.addEventListener('change', function () {
    if (fileInput.files && fileInput.files[0]) {
      setFile(fileInput.files[0]);
    }
  });

  // Drag-and-drop
  dropZone.addEventListener('dragover', function (e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', function (e) {
    if (!dropZone.contains(e.relatedTarget)) {
      dropZone.classList.remove('dragover');
    }
  });

  dropZone.addEventListener('drop', function (e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer && e.dataTransfer.files;
    if (files && files[0]) {
      setFile(files[0]);
    }
  });

  // Keyboard accessibility for the drop zone label
  dropZone.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  // -------------------------------------------------------------------------
  // Form submit → upload
  // -------------------------------------------------------------------------
  uploadForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!selectedFile) return;

    showState('processing');

    const formData = new FormData();
    formData.append('pid_file', selectedFile);

    fetch('/api/pid/upload', {
      method: 'POST',
      body: formData,
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { status: response.status, data: data };
        });
      })
      .then(function (result) {
        const data = result.data;
        if (data.success) {
          currentJobId = data.job_id;
          showResults(data.summary);
        } else {
          showError(data.error || 'An unknown error occurred.');
        }
      })
      .catch(function (err) {
        showError('Network error: ' + (err.message || 'Could not reach the server.'));
      });
  });

  // -------------------------------------------------------------------------
  // Show results
  // -------------------------------------------------------------------------
  function showResults(summary) {
    resultTotal.textContent  = summary.total_instruments;
    resultPages.textContent  = summary.total_pages;
    resultPids.textContent   = summary.pid_numbers && summary.pid_numbers.length
      ? summary.pid_numbers.join(', ')
      : '—';
    resultTitles.textContent = summary.system_titles && summary.system_titles.length
      ? summary.system_titles.join(', ')
      : '—';

    // Low confidence warning
    if (summary.low_confidence_count > 0) {
      lowConfText.textContent =
        summary.low_confidence_count +
        ' instrument' + (summary.low_confidence_count > 1 ? 's' : '') +
        ' require manual verification';
      lowConfWarn.hidden = false;
    } else {
      lowConfWarn.hidden = true;
    }

    // Type badges — build from warnings/notes if available, else skip
    typeBadges.innerHTML = '';
    if (summary.instrument_types) {
      buildTypeBadges(summary.instrument_types);
    }

    showState('results');
  }

  function buildTypeBadges(typesObj) {
    // typesObj: { "Pressure": 12, "Temperature": 8, ... }
    const entries = Object.entries(typesObj).sort((a, b) => b[1] - a[1]);
    entries.forEach(function ([name, count]) {
      const badge = document.createElement('span');
      badge.className = 'type-badge';
      badge.innerHTML =
        name + ' <span class="badge-count">' + count + '</span>';
      typeBadges.appendChild(badge);
    });
  }

  // -------------------------------------------------------------------------
  // Download
  // -------------------------------------------------------------------------
  downloadBtn.addEventListener('click', function () {
    if (!currentJobId) return;
    window.location.href = '/api/pid/download/' + currentJobId;
  });

  // -------------------------------------------------------------------------
  // Reset
  // -------------------------------------------------------------------------
  function resetToUpload() {
    selectedFile  = null;
    currentJobId  = null;
    fileInput.value = '';
    fileNameDisplay.textContent = '';
    dropZone.classList.remove('has-file', 'dragover');
    extractBtn.disabled = true;
    typeBadges.innerHTML = '';
    showState('upload');
  }

  resetBtn.addEventListener('click', resetToUpload);
  retryBtn.addEventListener('click', resetToUpload);

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------
  function showError(message) {
    errorMessage.textContent = message;
    showState('error');
  }

})();
