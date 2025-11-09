/* main.js — comportamiento global y demo de Teachable Machine */

/* ===== navegación: marca el link activo según la url ===== */
document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.main-nav .nav-link');
  links.forEach(a => {
    if (location.pathname.endsWith(a.getAttribute('href'))) {
      a.classList.add('active');
    }
  });
});

/* ===== Teachable Machine integration ===== */
(async function() {
  if (!location.pathname.endsWith('clasificacion-inteligente.html') &&
      !location.pathname.endsWith('/clasificacion-inteligente.html')) return;

  const MODEL_JSON = './model/model.json';
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const webcamArea = document.getElementById('webcamArea');
  const labelContainer = document.getElementById('label-container');
  const errorBox = document.getElementById('errorBox');

  let model = null;
  let webcam = null;
  let running = false;

  function showError(msg){
    if(errorBox) {
      errorBox.style.display = 'block';
      errorBox.innerText = msg;
    }
  }

  function hideError(){
    if(errorBox) {
      errorBox.style.display = 'none';
      errorBox.innerText = '';
    }
  }

  function supportsCamera(){
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  async function loadModel(){
    try {
      hideError();
      labelContainer.innerText = 'Cargando modelo...';
      model = await tmImage.load(MODEL_JSON, MODEL_JSON.replace('model.json','metadata.json'));
      labelContainer.innerText = 'Modelo cargado. Presiona "Abrir cámara".';
    } catch(err) {
      console.error('Error cargando modelo:', err);
      showError('No se pudo cargar el modelo. Verifica model.json y metadata.json.');
    }
  }

  async function startWebcam() {
    hideError();
    if(!supportsCamera()) {
      showError('Tu navegador no soporta cámara. Usa Chrome, Edge o Firefox con Live Server.');
      return;
    }

    try {
      webcam = new tmImage.Webcam(320, 320, true);
      await webcam.setup();
      await webcam.play();
      webcamArea.innerHTML = '';
      webcamArea.appendChild(webcam.canvas);
      labelContainer.innerText = 'Cámara activa. Listo para detectar.';
      running = true;
      window.requestAnimationFrame(loop);
    } catch(err) {
      console.error('Error al abrir cámara:', err);
      showError('No se pudo abrir la cámara. Revisa permisos y prueba otro navegador.');
    }
  }

  function stopWebcam() {
    running = false;
    try { if(webcam) webcam.stop(); } catch(e) {}
    webcamArea.innerHTML = '';
    labelContainer.innerText = 'Cámara detenida.';
  }

  async function loop() {
    if(!running || !webcam) return;
    webcam.update();

    // ==== PREDICCIÓN ====
    if(model){
      try {
        const prediction = await model.predict(webcam.canvas);
        prediction.sort((a,b) => b.probability - a.probability);
        const top = prediction[0];
        labelContainer.innerText = `${top.className} detectado • ${(top.probability*100).toFixed(1)}%`;
      } catch(err) {
        console.error('Predict error:', err);
      }
    }

    window.requestAnimationFrame(loop);
  }

  // botones
  startBtn.addEventListener('click', async () => {
    if(!model) await loadModel();
    await startWebcam();
  });

  stopBtn.addEventListener('click', () => stopWebcam());
})();
