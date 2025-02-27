// public/script.js

// Global variables
let templateImage = null;
let uploadedTemplateFile = null;
let selectedAreas = []; // {x, y, width, height, fieldName}
let canvas = document.getElementById('templateCanvas');
let ctx = canvas.getContext('2d');
let livePreviewCanvas = document.getElementById('livePreviewCanvas');
let liveCtx = livePreviewCanvas.getContext('2d');
let startX, startY, isDragging = false;
let excelData = [];

// Utility: Show a particular step and update progress bar
function showStep(stepId) {
  document.querySelectorAll('.step').forEach(step => step.style.display = 'none');
  document.getElementById(stepId).style.display = 'block';
  let progressText = '';
  let width = '';
  switch (stepId) {
    case 'step1': progressText = 'Step 1 of 4'; width = '25%'; break;
    case 'step2': progressText = 'Step 2 of 4'; width = '50%'; break;
    case 'step3': progressText = 'Step 3 of 4'; width = '75%'; break;
    case 'step4': progressText = 'Step 4 of 4'; width = '100%'; break;
  }
  document.getElementById('progressBar').innerText = progressText;
  document.getElementById('progressBar').style.width = width;
  if (stepId === 'step3') updateAreasAdjustment3();
}

// Redraw the certificate template canvas with selected areas
function redrawCanvas() {
  if (!templateImage) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(templateImage, 0, 0);
  selectedAreas.forEach(area => {
    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.rect(area.x, area.y, area.width, area.height);
    ctx.stroke();
  });
}

// Update adjustment panel in Step 3
function updateAreasAdjustment3() {
  const adjustmentDiv = document.getElementById('areasAdjustment3');
  adjustmentDiv.innerHTML = '<h5><i class="fas fa-sliders-h"></i> Adjust Selected Areas (Coordinates & Field Names)</h5>';
  selectedAreas.forEach((area, index) => {
    const div = document.createElement('div');
    div.className = "area-adjust";
    div.innerHTML = `
      <div class="form-group">
        <label>Field Name:</label>
        <input type="text" class="form-control fieldName" data-index="${index}" value="${area.fieldName || 'Field ' + (index + 1)}">
      </div>
      <div class="form-row">
        <div class="form-group col-md-3">
          <label>X:</label>
          <input type="number" class="form-control areaX" data-index="${index}" value="${area.x}">
        </div>
        <div class="form-group col-md-3">
          <label>Y:</label>
          <input type="number" class="form-control areaY" data-index="${index}" value="${area.y}">
        </div>
        <div class="form-group col-md-3">
          <label>Width:</label>
          <input type="number" class="form-control areaWidth" data-index="${index}" value="${area.width}">
        </div>
        <div class="form-group col-md-3">
          <label>Height:</label>
          <input type="number" class="form-control areaHeight" data-index="${index}" value="${area.height}">
        </div>
      </div>
    `;
    adjustmentDiv.appendChild(div);
  });
  document.querySelectorAll('.fieldName').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = e.target.getAttribute('data-index');
      selectedAreas[idx].fieldName = e.target.value;
      setupManualInputs();
      updateLivePreview();
    });
  });
  document.querySelectorAll('.areaX').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = e.target.getAttribute('data-index');
      selectedAreas[idx].x = parseInt(e.target.value, 10);
      redrawCanvas();
      updateLivePreview();
    });
  });
  document.querySelectorAll('.areaY').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = e.target.getAttribute('data-index');
      selectedAreas[idx].y = parseInt(e.target.value, 10);
      redrawCanvas();
      updateLivePreview();
    });
  });
  document.querySelectorAll('.areaWidth').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = e.target.getAttribute('data-index');
      selectedAreas[idx].width = parseInt(e.target.value, 10);
      redrawCanvas();
      updateLivePreview();
    });
  });
  document.querySelectorAll('.areaHeight').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = e.target.getAttribute('data-index');
      selectedAreas[idx].height = parseInt(e.target.value, 10);
      redrawCanvas();
      updateLivePreview();
    });
  });
}

// --- Step 1: Upload Certificate Template ---
document.getElementById('templateInput').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  uploadedTemplateFile = file;
  if (file.type === "application/pdf") {
    alert("PDF templates are not fully supported. Please upload a JPG or PNG image.");
    document.getElementById('nextToStep2').disabled = true;
    return;
  }
  const reader = new FileReader();
  reader.onload = function (event) {
    templateImage = new Image();
    templateImage.onload = function () {
      canvas.width = templateImage.width;
      canvas.height = templateImage.height;
      livePreviewCanvas.width = templateImage.width;
      livePreviewCanvas.height = templateImage.height;
      redrawCanvas();
    };
    templateImage.src = event.target.result;
    document.getElementById('nextToStep2').disabled = false;
  };
  reader.readAsDataURL(file);
});

// Update custom file input label (jQuery)
$('#templateInput').on('change', function () {
  const fileName = $(this).val().split('\\').pop();
  $(this).next('.custom-file-label').html(fileName);
});

document.getElementById('nextToStep2').addEventListener('click', function () {
  showStep('step2');
});

// --- Step 2: Define Editable Areas (with coordinate scaling) ---
canvas.addEventListener('mousedown', function (e) {
  if (!templateImage) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  startX = (e.clientX - rect.left) * scaleX;
  startY = (e.clientY - rect.top) * scaleY;
  isDragging = true;
});

canvas.addEventListener('mousemove', function (e) {
  if (!isDragging) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const currentX = (e.clientX - rect.left) * scaleX;
  const currentY = (e.clientY - rect.top) * scaleY;
  redrawCanvas();
  ctx.beginPath();
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  const width = currentX - startX;
  const height = currentY - startY;
  ctx.rect(startX, startY, width, height);
  ctx.stroke();
});

canvas.addEventListener('mouseup', function (e) {
  if (!isDragging) return;
  isDragging = false;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const endX = (e.clientX - rect.left) * scaleX;
  const endY = (e.clientY - rect.top) * scaleY;
  const area = {
    x: startX,
    y: startY,
    width: endX - startX,
    height: endY - startY,
    fieldName: 'Field ' + (selectedAreas.length + 1)
  };
  selectedAreas.push(area);
  redrawCanvas();
});

document.getElementById('prevToStep1').addEventListener('click', function () {
  showStep('step1');
});
document.getElementById('clearSelections').addEventListener('click', function () {
  selectedAreas = [];
  redrawCanvas();
});
document.getElementById('nextToStep3').addEventListener('click', function () {
  if (selectedAreas.length === 0) {
    alert("Please select at least one area on the template.");
    return;
  }
  showStep('step3');
  setupManualInputs();
  updateLivePreview();
});

// --- Step 3: Input Data and Live Preview ---
document.getElementsByName('dataMode').forEach(radio => {
  radio.addEventListener('change', function (e) {
    if (e.target.value === 'manual') {
      document.getElementById('manualEntry').style.display = 'block';
      document.getElementById('excelEntry').style.display = 'none';
      setupManualInputs();
      updateLivePreview();
    } else {
      document.getElementById('manualEntry').style.display = 'none';
      document.getElementById('excelEntry').style.display = 'block';
    }
  });
});

function setupManualInputs() {
  const container = document.getElementById('manualInputsContainer');
  container.innerHTML = "";
  selectedAreas.forEach((area, index) => {
    const labelName = area.fieldName || ('Field ' + (index + 1));
    const div = document.createElement('div');
    div.className = "form-group";
    div.innerHTML = `<label>Text for ${labelName}:</label>
      <input type="text" class="form-control areaText" data-index="${index}" placeholder="Enter text">`;
    container.appendChild(div);
  });
  document.querySelectorAll('.areaText').forEach(input => {
    input.addEventListener('input', updateLivePreview);
  });
  document.getElementById('fontSize').addEventListener('input', updateLivePreview);
  document.getElementById('fontColor').addEventListener('input', updateLivePreview);
  document.getElementById('fontFamily').addEventListener('change', updateLivePreview);
}

// Update custom file input label for Excel
$('#excelInput').on('change', function () {
  const fileName = $(this).val().split('\\').pop();
  $(this).next('.custom-file-label').html(fileName);
});

document.getElementById('excelInput').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    let html = '<table class="table table-bordered"><thead><tr>';
    excelData[0].forEach(cell => {
      html += '<th>' + cell + '</th>';
    });
    html += '</tr></thead><tbody>';
    for (let i = 1; i < excelData.length; i++) {
      html += '<tr>';
      excelData[i].forEach(cell => {
        html += '<td>' + cell + '</td>';
      });
      html += '</tr>';
    }
    html += '</tbody></table>';
    document.getElementById('excelDataPreview').innerHTML = html;
  };
  reader.readAsArrayBuffer(file);
});

function updateLivePreview() {
  if (!templateImage) return;
  liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
  liveCtx.drawImage(templateImage, 0, 0);
  const fontSize = document.getElementById('fontSize').value || 30;
  const fontColor = document.getElementById('fontColor').value || "#000000";
  const fontFamily = document.getElementById('fontFamily').value || "Arial";
  liveCtx.font = fontSize + "px " + fontFamily;
  liveCtx.fillStyle = fontColor;
  const inputs = document.querySelectorAll('.areaText');
  inputs.forEach((input, index) => {
    const text = input.value;
    const area = selectedAreas[index];
    if (!area) return;
    const textX = area.x + 10;
    const textY = area.y + (area.height / 2);
    liveCtx.fillText(text, textX, textY);
  });
}

document.getElementById('prevToStep2').addEventListener('click', function () {
  showStep('step2');
});
document.getElementById('goToStep4').addEventListener('click', function () {
  showStep('step4');
  generateCertificates();
});

// --- Step 4: Preview and Download ---
function generateCertificates() {
  const previewArea = document.getElementById('previewArea');
  previewArea.innerHTML = "";
  const selectedMode = document.querySelector('input[name="dataMode"]:checked').value;
  if (selectedMode === 'manual') {
    const inputs = document.querySelectorAll('.areaText');
    let certificate = { texts: [] };
    inputs.forEach(input => {
      certificate.texts.push(input.value);
    });
    createCertificatePreview(certificate, previewArea);
  } else {
    if (excelData.length < 2) {
      alert("Excel file does not contain data.");
      return;
    }
    let headers = excelData[0];
    for (let i = 1; i < excelData.length; i++) {
      let row = excelData[i];
      let texts = [];
      selectedAreas.forEach(area => {
        let colIndex = headers.indexOf(area.fieldName);
        let cellVal = colIndex >= 0 ? row[colIndex] : "";
        texts.push(cellVal);
      });
      let certificate = { texts: texts };
      createCertificatePreview(certificate, previewArea);
    }
  }
}

function createCertificatePreview(certificate, container) {
  let tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  let tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(templateImage, 0, 0);
  const fontSize = document.getElementById('fontSize').value || 30;
  const fontColor = document.getElementById('fontColor').value || "#000000";
  const fontFamily = document.getElementById('fontFamily').value || "Arial";
  tempCtx.font = fontSize + "px " + fontFamily;
  tempCtx.fillStyle = fontColor;
  certificate.texts.forEach((text, index) => {
    const area = selectedAreas[index];
    if (!area) return;
    const textX = area.x + 10;
    const textY = area.y + (area.height / 2);
    tempCtx.fillText(text, textX, textY);
  });
  let img = document.createElement('img');
  img.src = tempCanvas.toDataURL("image/png");
  img.className = "img-fluid";
  container.appendChild(img);
  certificate.canvasData = tempCanvas;
}

document.getElementById('prevToStep3').addEventListener('click', function () {
  showStep('step3');
});

// Download as PDF using jsPDF (downloads the first certificate)
document.getElementById('downloadPDF').addEventListener('click', function () {
  const { jsPDF } = window.jspdf;
  let doc = new jsPDF({
    orientation: templateImage.width > templateImage.height ? "landscape" : "portrait",
    unit: "px",
    format: [templateImage.width, templateImage.height]
  });
  const firstImg = document.querySelector('#previewArea img');
  if (firstImg) {
    let dataUrl = firstImg.src;
    doc.addImage(dataUrl, 'PNG', 0, 0, templateImage.width, templateImage.height);
    doc.save("certificate.pdf");
  } else {
    alert("No certificate available for download.");
  }
});

// Download as JPG (downloads the first certificate)
document.getElementById('downloadJPG').addEventListener('click', function () {
  const firstImg = document.querySelector('#previewArea img');
  if (firstImg) {
    let dataUrl = firstImg.src;
    let link = document.createElement('a');
    link.href = dataUrl;
    link.download = "certificate.jpg";
    link.click();
  } else {
    alert("No certificate available for download.");
  }
});

// Download All Certificates as ZIP using JSZip and FileSaver
function downloadZip() {
  let zip = new JSZip();
  let imgElements = document.querySelectorAll('#previewArea img');
  if (imgElements.length === 0) {
    alert("No certificates available for download.");
    return;
  }
  imgElements.forEach((img, index) => {
    let base64Data = img.src.split('base64,')[1];
    zip.file("certificate_" + (index + 1) + ".png", base64Data, { base64: true });
  });
  zip.generateAsync({ type: "blob" })
    .then(function (content) {
      saveAs(content, "certificates.zip");
    });
}

document.getElementById('downloadZip').addEventListener('click', function () {
  downloadZip();
});

// Email sending functionality
function sendCertificateByEmail(recipientEmail, certificateData) {
  fetch('/send-certificate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: recipientEmail,
      certificateData: certificateData,
      filename: 'certificate.png'
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert("Error sending email: " + data.error);
      } else {
        alert("Email sent successfully!");
      }
    })
    .catch(err => console.error("Error:", err));
}

document.getElementById('sendEmail').addEventListener('click', function () {
  const recipientEmail = document.getElementById('recipientEmail').value;
  if (!recipientEmail) {
    alert("Please enter a recipient email.");
    return;
  }
  const firstImg = document.querySelector('#previewArea img');
  if (firstImg) {
    sendCertificateByEmail(recipientEmail, firstImg.src);
  } else {
    alert("No certificate available to send.");
  }
});

// Go Back to Home
document.getElementById('goHome').addEventListener('click', function () {
  templateImage = null;
  uploadedTemplateFile = null;
  selectedAreas = [];
  excelData = [];
  document.getElementById('templateInput').value = "";
  document.getElementById('excelInput').value = "";
  document.getElementById('excelDataPreview').innerHTML = "";
  document.getElementById('manualInputsContainer').innerHTML = "";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  liveCtx.clearRect(0, 0, livePreviewCanvas.width, livePreviewCanvas.height);
  showStep('step1');
  document.getElementById('progressBar').innerText = 'Step 1 of 4';
  document.getElementById('progressBar').style.width = '25%';
});
