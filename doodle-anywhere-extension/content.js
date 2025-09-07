// content.js - Main doodle functionality that runs on web pages

let doodleInstance = null;
let isDoodleActive = false;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    switch (request.action) {
      case 'START_DOODLE':
        if (!isDoodleActive) {
          initializeDoodle();
          sendResponse({success: true});
        } else {
          sendResponse({success: false, message: 'Doodle already active'});
        }
        break;
        
      case 'STOP_DOODLE':
        if (isDoodleActive) {
          closeDoodle();
          sendResponse({success: true});
        } else {
          sendResponse({success: false, message: 'Doodle not active'});
        }
        break;
        
      case 'CHECK_STATUS':
        sendResponse({isActive: isDoodleActive});
        break;
        
      default:
        sendResponse({success: false, message: 'Unknown action'});
    }
  } catch (error) {
    console.error('Doodle extension error:', error);
    sendResponse({success: false, message: error.message});
  }
  
  return true; // Keep the message channel open for async response
});

function initializeDoodle() {
  if (document.getElementById('doodleCanvas')) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'doodleCanvas';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = Math.max(document.documentElement.scrollHeight, window.innerHeight) + 'px';
  canvas.style.zIndex = '999999';
  canvas.style.pointerEvents = 'auto';
  canvas.style.cursor = 'crosshair';
  canvas.width = window.innerWidth;
  canvas.height = Math.max(document.documentElement.scrollHeight, window.innerHeight);
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let currentColor = '#ff0000';
  let currentSize = 3;
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = currentSize;
  ctx.lineCap = 'round';

  let drawing = false;
  let drawingEnabled = true;

  let strokes = [];
  let undone = [];
  let currentStroke = [];

  function getAbsolutePosition(e) {
    return { x: e.clientX + window.scrollX, y: e.clientY + window.scrollY };
  }

  function redrawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    for (const stroke of strokes) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.beginPath();
      for (let i = 0; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
  }

  const startDraw = (e) => {
    if (!drawingEnabled) return;
    drawing = true;
    const pos = getAbsolutePosition(e);
    currentStroke = { points: [pos], color: currentColor, size: currentSize };
  };

  const draw = (e) => {
    if (!drawing || !drawingEnabled) return;
    const point = getAbsolutePosition(e);
    currentStroke.points.push(point);
    ctx.beginPath();
    const len = currentStroke.points.length;
    if (len > 1) {
      ctx.moveTo(currentStroke.points[len - 2].x, currentStroke.points[len - 2].y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  };

  const stopDraw = () => {
    if (drawing && currentStroke.points && currentStroke.points.length > 0) {
      strokes.push(currentStroke);
      undone = [];
    }
    drawing = false;
    currentStroke = {};
  };

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);

  // 🔧 Compact Control Panel
  const controlPanel = document.createElement('div');
  controlPanel.id = 'doodleControlPanel';
  controlPanel.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 1000001;
    background: rgba(30,30,30,0.9);
    color: white;
    padding: 6px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 11px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    min-width: 120px;
    max-height: 70vh;
    overflow-y: auto;
  `;
  document.body.appendChild(controlPanel);

  const title = document.createElement('div');
  title.textContent = '🎨 Doodle';
  title.style.cssText = 'font-size: 13px; font-weight: bold; margin-bottom: 6px; text-align: center;';
  controlPanel.appendChild(title);

  // Colors
  const colorContainer = document.createElement('div');
  colorContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px;';
  ['#ff0000','#00ff00','#0000ff','#000000','#ffffff'].forEach(color => {
    const btn = document.createElement('button');
    btn.style.cssText = `
      width: 16px; height: 16px;
      border: 2px solid ${color===currentColor?'#fff':'rgba(255,255,255,0.3)'};
      border-radius: 50%;
      background:${color}; cursor:pointer;
    `;
    btn.onclick = () => {
      currentColor = color;
      ctx.strokeStyle = currentColor;
      colorContainer.querySelectorAll('button').forEach(b => b.style.border='2px solid rgba(255,255,255,0.3)');
      btn.style.border='2px solid #fff';
    };
    colorContainer.appendChild(btn);
  });
  controlPanel.appendChild(colorContainer);

  // Brush size
  const sizeSlider = document.createElement('input');
  sizeSlider.type='range'; sizeSlider.min='1'; sizeSlider.max='20'; sizeSlider.value=currentSize;
  sizeSlider.style.cssText='width:100%;';
  sizeSlider.oninput = e => { currentSize=parseInt(e.target.value); ctx.lineWidth=currentSize; };
  controlPanel.appendChild(sizeSlider);

  // Button helper
  function createButton(label,onClick){
    const btn=document.createElement('button');
    btn.textContent=label;
    btn.style.cssText=`
      padding:4px 6px; margin-top:4px;
      font-size:11px; border:none; border-radius:4px;
      background:#444; color:#fff; cursor:pointer; width:100%;
    `;
    btn.onclick=onClick;
    return btn;
  }

  controlPanel.appendChild(createButton('↶ Undo',()=>{if(strokes.length){undone.push(strokes.pop());redrawAll();}}));
  controlPanel.appendChild(createButton('↷ Redo',()=>{if(undone.length){strokes.push(undone.pop());redrawAll();}}));
  controlPanel.appendChild(createButton('🗑️ Clear',()=>{if(confirm('Clear all doodles?')){strokes=[];undone=[];ctx.clearRect(0,0,canvas.width,canvas.height);}}));
  controlPanel.appendChild(createButton('❌ Close',closeDoodle));

  // Handlers
  const keyHandler = e => {
    if(e.ctrlKey && e.key==='z'){ if(strokes.length){undone.push(strokes.pop());redrawAll();} e.preventDefault();}
    if(e.ctrlKey && e.key==='y'){ if(undone.length){strokes.push(undone.pop());redrawAll();} e.preventDefault();}
  };
  const resizeHandler = () => {
    canvas.width = window.innerWidth;
    canvas.height = Math.max(document.documentElement.scrollHeight, window.innerHeight);
    redrawAll();
  };
  window.addEventListener('keydown', keyHandler);
  window.addEventListener('resize', resizeHandler);

  doodleInstance = { canvas, controlPanel, keyHandler, resizeHandler };
  isDoodleActive = true;
}

function closeDoodle() {
  if (!isDoodleActive || !doodleInstance) return;
  if (doodleInstance.canvas) doodleInstance.canvas.remove();
  if (doodleInstance.controlPanel) doodleInstance.controlPanel.remove();
  window.removeEventListener('keydown', doodleInstance.keyHandler);
  window.removeEventListener('resize', doodleInstance.resizeHandler);
  doodleInstance=null; isDoodleActive=false;
}
