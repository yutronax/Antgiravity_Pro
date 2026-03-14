import './style.css'

document.querySelector('#app').innerHTML = `
  <div class="card">
    <div class="status-badge">RALPH WIGGUM LOOP ACTIVE</div>
    <h1>Autonomous Excellence</h1>
    <p class="subtitle">I'm helping! Ralph is now in control of the विकास (development) cycle.</p>
    <div id="dynamic-content">
      <p>Initializing autonomous modules...</p>
    </div>
  </div>
`

// Simulate Ralph's "thinking" or progress
setTimeout(() => {
  const content = document.querySelector('#dynamic-content');
  content.style.opacity = '0';
  setTimeout(() => {
    content.innerHTML = `
      <p style="color: #38bdf8; font-weight: 500;">Environment: SECURE</p>
      <p style="color: #38bdf8; font-weight: 500;">Autonomy: ENABLED</p>
      <p style="color: #818cf8; font-weight: 500;">Next Step: Architecture Design</p>
    `;
    content.style.transition = 'opacity 0.5s ease';
    content.style.opacity = '1';
  }, 500);
}, 2000);
