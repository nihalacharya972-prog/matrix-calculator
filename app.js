// --- State Management ---
const state = {
  matrices: [
    {
      id: "mat_A",
      name: "A",
      rows: 2,
      cols: 2,
      data: [
        [4, 7],
        [2, 6]
      ]
    },
    {
      id: "mat_B",
      name: "B",
      rows: 2,
      cols: 2,
      data: [
        [1, 0],
        [3, 5]
      ]
    }
  ]
};

// --- DOM Selectors ---
const matricesContainer = document.getElementById("matricesContainer");
const opMatrixA = document.getElementById("opMatrixA");
const opMatrixB = document.getElementById("opMatrixB");
const resultContent = document.getElementById("resultContent");
const clearResultBtn = document.getElementById("clearResultBtn");

// Modal Selectors
const addMatrixBtn = document.getElementById("addMatrixBtn");
const matrixModal = document.getElementById("matrixModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const confirmCreateBtn = document.getElementById("confirmCreateBtn");
const modalMatrixName = document.getElementById("modalMatrixName");
const modalRows = document.getElementById("modalRows");
const modalCols = document.getElementById("modalCols");
const modalPrefill = document.getElementById("modalPrefill");

// --- Initialization ---
function init() {
  renderMatrices();
  updateSelectOptions();
  setupEventListeners();
}

// --- Render Matrices in Grid ---
function renderMatrices() {
  matricesContainer.innerHTML = "";

  state.matrices.forEach((mat) => {
    const card = document.createElement("div");
    card.className = "matrix-card";
    card.id = `card_${mat.id}`;

    // Compute Properties
    const det = mat.rows === mat.cols ? calculateDeterminant(mat.data) : null;
    const isSquare = mat.rows === mat.cols;
    const isSymm = isSquare ? checkSymmetric(mat.data) : false;
    const isDiag = isSquare ? checkDiagonal(mat.data) : false;
    const trace = isSquare ? calculateTrace(mat.data) : null;

    card.innerHTML = `
      <div class="card-top">
        <div class="card-title">
          <h4>Matrix ${mat.name}</h4>
          <span class="dim-tag">${mat.rows} &times; ${mat.cols}</span>
        </div>
        <div class="matrix-actions-top">
          <button class="btn-icon" onclick="deleteMatrix('${mat.id}')" title="Delete Matrix">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>

      <!-- Live Dimension Modifier -->
      <div class="size-picker">
        <span>Rows:</span>
        <select onchange="updateDimensions('${mat.id}', this.value, ${mat.cols})">
          ${[1, 2, 3, 4, 5].map(r => `<option value="${r}" ${r === mat.rows ? "selected" : ""}>${r}</option>`).join("")}
        </select>
        <span>Cols:</span>
        <select onchange="updateDimensions('${mat.id}', ${mat.rows}, this.value)">
          ${[1, 2, 3, 4, 5].map(c => `<option value="${c}" ${c === mat.cols ? "selected" : ""}>${c}</option>`).join("")}
        </select>
      </div>

      <!-- Matrix Inputs -->
      <div class="matrix-box-wrapper">
        <div class="matrix-bracket-left"></div>
        <div class="matrix-table" style="grid-template-columns: repeat(${mat.cols}, 1fr)">
          ${mat.data.map((row, r) => 
            row.map((val, c) => `
              <input 
                type="number" 
                class="matrix-cell-input" 
                value="${val}" 
                oninput="updateCell('${mat.id}', ${r},${c}, this.value)"
              />
            `).join("")
          ).join("")}
        </div>
        <div class="matrix-bracket-right"></div>
      </div>

      <!-- Quick Presets -->
      <div class="matrix-quick-presets">
        <button class="preset-chip" onclick="applyPreset('${mat.id}', 'zeros')">Zeros</button>
        <button class="preset-chip" onclick="applyPreset('${mat.id}', 'identity')">Identity</button>
        <button class="preset-chip" onclick="applyPreset('${mat.id}', 'random')">Random</button>
      </div>

      <!-- Properties & Telemetry -->
      <div class="card-properties">
        <div class="prop-pill">
          <span>Determinant |A|:</span>
          <strong>${det !== null ? round(det) : "N/A (Non-Square)"}</strong>
        </div>
        <div class="prop-pill">
          <span>Trace tr(A):</span>
          <strong>${trace !== null ? round(trace) : "N/A"}</strong>
        </div>
        <div class="prop-tags">
          ${isSquare ? '<span class="tag">Square</span>' : ""}
          ${isSymm ? '<span class="tag">Symmetric</span>' : ""}
          ${isDiag ? '<span class="tag">Diagonal</span>' : ""}
          ${det === 0 && isSquare ? '<span class="tag">Singular</span>' : ""}
        </div>
      </div>
    `;

    matricesContainer.appendChild(card);
  });
}

// --- Sync Select Dropdowns ---
function updateSelectOptions() {
  const currentA = opMatrixA.value;
  const currentB = opMatrixB.value;

  opMatrixA.innerHTML = "";
  opMatrixB.innerHTML = "";

  state.matrices.forEach((mat) => {
    opMatrixA.innerHTML += `<option value="${mat.id}">Matrix ${mat.name} (${mat.rows}×${mat.cols})</option>`;
    opMatrixB.innerHTML += `<option value="${mat.id}">Matrix ${mat.name} (${mat.rows}×${mat.cols})</option>`;
  });

  if (currentA && state.matrices.some(m => m.id === currentA)) opMatrixA.value = currentA;
  if (currentB && state.matrices.some(m => m.id === currentB)) opMatrixB.value = currentB;
  if (!currentB && state.matrices.length > 1) opMatrixB.selectedIndex = 1;
}

// --- Cell & Dimension Modifiers ---
window.updateCell = function(matrixId, r, c, val) {
  const mat = state.matrices.find(m => m.id === matrixId);
  if (!mat) return;
  mat.data[r][c] = parseFloat(val) || 0;
  // Re-render properties badge for this card without redrawing entire DOM to keep focus
  fastUpdateProperties(mat);
};

window.updateDimensions = function(matrixId, newRows, newCols) {
  newRows = parseInt(newRows);
  newCols = parseInt(newCols);
  const mat = state.matrices.find(m => m.id === matrixId);
  if (!mat) return;

  const newData = [];
  for (let r = 0; r < newRows; r++) {
    const row = [];
    for (let c = 0; c < newCols; c++) {
      row.push(mat.data[r] && mat.data[r][c] !== undefined ? mat.data[r][c] : 0);
    }
    newData.push(row);
  }
  mat.rows = newRows;
  mat.cols = newCols;
  mat.data = newData;
  renderMatrices();
  updateSelectOptions();
};

window.applyPreset = function(matrixId, type) {
  const mat = state.matrices.find(m => m.id === matrixId);
  if (!mat) return;

  for (let r = 0; r < mat.rows; r++) {
    for (let c = 0; c < mat.cols; c++) {
      if (type === "zeros") mat.data[r][c] = 0;
      else if (type === "identity") mat.data[r][c] = r === c ? 1 : 0;
      else if (type === "random") mat.data[r][c] = Math.floor(Math.random() * 9) + 1;
    }
  }
  renderMatrices();
};

window.deleteMatrix = function(matrixId) {
  if (state.matrices.length <= 1) {
    alert("You need at least one matrix.");
    return;
  }
  state.matrices = state.matrices.filter(m => m.id !== matrixId);
  renderMatrices();
  updateSelectOptions();
};

function fastUpdateProperties(mat) {
  const card = document.getElementById(`card_${mat.id}`);
  if (!card) return;
  const det = mat.rows === mat.cols ? calculateDeterminant(mat.data) : null;
  const trace = mat.rows === mat.cols ? calculateTrace(mat.data) : null;
  const propPills = card.querySelectorAll(".prop-pill strong");
  if (propPills.length >= 2) {
    propPills[0].innerText = det !== null ? round(det) : "N/A (Non-Square)";
    propPills[1].innerText = trace !== null ? round(trace) : "N/A";
  }
}

// --- Matrix Mathematical Operations ---
function setupEventListeners() {
  document.querySelectorAll(".op-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const op = btn.dataset.op;
      executeOperation(op);
    });
  });

  clearResultBtn.addEventListener("click", () => {
    resultContent.innerHTML = `
      <div class="empty-result">
        <i class="fa-solid fa-circle-nodes"></i>
        <p>Select matrices & click an operation to compute</p>
      </div>
    `;
  });

  // Modal Listeners
  addMatrixBtn.addEventListener("click", () => {
    // Generate next alphabetical letter
    const usedNames = state.matrices.map(m => m.name);
    const nextChar = String.fromCharCode(65 + state.matrices.length);
    modalMatrixName.value = usedNames.includes(nextChar) ? "X" : nextChar;
    matrixModal.classList.remove("hidden");
  });

  closeModalBtn.addEventListener("click", () => matrixModal.classList.add("hidden"));
  cancelModalBtn.addEventListener("click", () => matrixModal.classList.add("hidden"));

  confirmCreateBtn.addEventListener("click", () => {
    const name = modalMatrixName.value.trim().toUpperCase() || "M";
    const rows = parseInt(modalRows.value);
    const cols = parseInt(modalCols.value);
    const prefill = modalPrefill.value;

    const data = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        if (prefill === "zeros") row.push(0);
        else if (prefill === "identity") row.push(r === c ? 1 : 0);
        else if (prefill === "random") row.push(Math.floor(Math.random() * 9) + 1);
      }
      data.push(row);
    }

    state.matrices.push({
      id: `mat_${Date.now()}`,
      name: name,
      rows: rows,
      cols: cols,
      data: data
    });

    matrixModal.classList.add("hidden");
    renderMatrices();
    updateSelectOptions();
  });
}

function executeOperation(op) {
  const matA = state.matrices.find(m => m.id === opMatrixA.value);
  const matB = state.matrices.find(m => m.id === opMatrixB.value);

  if (!matA) return;

  try {
    switch (op) {
      case "add": {
        if (matA.rows !== matB.rows || matA.cols !== matB.cols) {
          throw new Error(`Dimension mismatch: Matrices must have same size (${matA.rows}×${matA.cols} vs ${matB.rows}×${matB.cols})`);
        }
        const res = matA.data.map((row, r) => row.map((val, c) => val + matB.data[r][c]));
        renderMatrixResult(`${matA.name} + ${matB.name}`, res);
        break;
      }
      case "subtract": {
        if (matA.rows !== matB.rows || matA.cols !== matB.cols) {
          throw new Error(`Dimension mismatch: Matrices must have same size (${matA.rows}×${matA.cols} vs ${matB.rows}×${matB.cols})`);
        }
        const res = matA.data.map((row, r) => row.map((val, c) => val - matB.data[r][c]));
        renderMatrixResult(`${matA.name} &minus; ${matB.name}`, res);
        break;
      }
      case "multiply": {
        if (matA.cols !== matB.rows) {
          throw new Error(`Cannot multiply: Columns of ${matA.name} (${matA.cols}) must equal Rows of ${matB.name} (${matB.rows})`);
        }
        const res = multiplyMatrices(matA.data, matB.data);
        renderMatrixResult(`${matA.name} &times; ${matB.name}`, res);
        break;
      }
      case "transpose": {
        const res = transposeMatrix(matA.data);
        renderMatrixResult(`${matA.name}<sup>T</sup>`, res);
        break;
      }
      case "determinant": {
        if (matA.rows !== matA.cols) {
          throw new Error("Determinant is only defined for square matrices (N × N)");
        }
        const det = calculateDeterminant(matA.data);
        renderScalarResult(`det(${matA.name})`, round(det));
        break;
      }
      case "inverse": {
        if (matA.rows !== matA.cols) {
          throw new Error("Inverse is only defined for square matrices (N × N)");
        }
        const det = calculateDeterminant(matA.data);
        if (Math.abs(det) < 1e-9) {
          throw new Error(`Matrix ${matA.name} is singular (det = 0); Inverse does not exist.`);
        }
        const inv = invertMatrix(matA.data, det);
        renderMatrixResult(`${matA.name}<sup>&minus;1</sup>`, inv);
        break;
      }
      case "adjoint": {
        if (matA.rows !== matA.cols) {
          throw new Error("Adjoint is only defined for square matrices (N × N)");
        }
        const adj = adjointMatrix(matA.data);
        renderMatrixResult(`adj(${matA.name})`, adj);
        break;
      }
    }
  } catch (err) {
    resultContent.innerHTML = `<div class="error-msg"><i class="fa-solid fa-triangle-exclamation"></i> ${err.message}</div>`;
  }
}

// --- Render Operations Result UI ---
function renderMatrixResult(title, mat) {
  const rows = mat.length;
  const cols = mat[0].length;

  resultContent.innerHTML = `
    <div class="result-output">
      <span class="result-formula">${title} (${rows}&times;${cols})</span>
      <div class="matrix-box-wrapper">
        <div class="matrix-bracket-left"></div>
        <div class="result-display-grid" style="grid-template-columns: repeat(${cols}, 1fr)">
          ${mat.map(row => 
            row.map(val => `<div class="result-display-cell">${round(val)}</div>`).join("")
          ).join("")}
        </div>
        <div class="matrix-bracket-right"></div>
      </div>
    </div>
  `;
}

function renderScalarResult(title, val) {
  resultContent.innerHTML = `
    <div class="result-output">
      <span class="result-formula">${title}</span>
      <div class="result-scalar">${val}</div>
    </div>
  `;
}

// --- Linear Algebra Math Helpers ---
function multiplyMatrices(A, B) {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  const result = Array.from({ length: rowsA }, () => Array(colsB).fill(0));

  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      for (let k = 0; k < colsA; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return result;
}

function transposeMatrix(A) {
  return A[0].map((_, colIdx) => A.map(row => row[colIdx]));
}

function calculateDeterminant(M) {
  const n = M.length;
  if (n === 1) return M[0][0];
  if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];

  let det = 0;
  for (let col = 0; col < n; col++) {
    const minor = M.slice(1).map(row => row.filter((_, j) => j !== col));
    const sign = col % 2 === 0 ? 1 : -1;
    det += sign * M[0][col] * calculateDeterminant(minor);
  }
  return det;
}

function calculateTrace(M) {
  let tr = 0;
  for (let i = 0; i < M.length; i++) tr += M[i][i];
  return tr;
}

function checkSymmetric(M) {
  for (let i = 0; i < M.length; i++) {
    for (let j = 0; j < M.length; j++) {
      if (Math.abs(M[i][j] - M[j][i]) > 1e-6) return false;
    }
  }
  return true;
}

function checkDiagonal(M) {
  for (let i = 0; i < M.length; i++) {
    for (let j = 0; j < M.length; j++) {
      if (i !== j && Math.abs(M[i][j]) > 1e-6) return false;
    }
  }
  return true;
}

function adjointMatrix(M) {
  const n = M.length;
  if (n === 1) return [[1]];

  const cofactors = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const minor = M.filter((_, i) => i !== r).map(row => row.filter((_, j) => j !== c));
      const sign = (r + c) % 2 === 0 ? 1 : -1;
      cofactors[r][c] = sign * calculateDeterminant(minor);
    }
  }
  return transposeMatrix(cofactors);
}

function invertMatrix(M, det) {
  const adj = adjointMatrix(M);
  return adj.map(row => row.map(val => val / det));
}

function round(num) {
  return Math.abs(num - Math.round(num)) < 1e-6 ? Math.round(num) : parseFloat(num.toFixed(3));
}

// Start App
init();