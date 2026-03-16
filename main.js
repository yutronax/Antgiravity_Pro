import './style.css'

const initApp = () => {
  const app = document.querySelector('#app');
  
  // Render Layout
  app.innerHTML = `
    <nav class="nav-container" id="main-nav">
      <div class="logo text-gradient">RALPH.OS</div>
      <div class="nav-links">
        <a href="#" class="nav-link">Architecture</a>
        <a href="#" class="nav-link">Autonomy</a>
        <a href="#" class="nav-link">Quotas</a>
        <button class="btn-primary">Get API Key</button>
      </div>
    </nav>

    <main class="hero-section">
      <div class="hero-content">
        <div class="status-badge">SYSTEM STATUS: OPTIMIZED</div>
        <h1 class="text-gradient">Building the Future,<br>One Loop at a Time.</h1>
        <p class="subtitle">Experience the next generation of autonomous development. Ralph-Wiggum logic integrated with premium architectural patterns.</p>
        
        <div class="hero-actions">
          <button class="btn-primary" style="padding: 1rem 2.5rem; font-size: 1.1rem;">Launch Console</button>
          <button class="btn-secondary">View Documentation</button>
        </div>
      </div>
      
      <div class="hero-visual">
        <div class="hero-image-container">
          <img src="./hero_abstract_tech_1773525273577.png" alt="Tech Abstract" class="hero-img">
        </div>
        <div class="glass-panel floating-card">
          <div class="card-header">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <div class="card-content">
            <pre><code><span class="keyword">const</span> Ralph = {
  status: <span class="string">'autonomous'</span>,
  intelligence: <span class="number">100</span>,
  loop: <span class="keyword">true</span>
};

<span class="comment">// Executing premium build...</span>
Ralph.optimize();</code></pre>
          </div>
        </div>
      </div>
    </main>

    <section class="quota-monitor glass-panel" id="quota-panel">
      <h3>Live Quota Awareness</h3>
      <div class="quota-bars">
        <div class="quota-item">
          <div class="label">Gemini 3.1 Pro</div>
          <div class="bar-bg"><div class="bar-fill" style="width: 85%"></div></div>
        </div>
        <div class="quota-item">
          <div class="label">Claude 4.6 Thinking</div>
          <div class="bar-bg"><div class="bar-fill" style="width: 42%"></div></div>
        </div>
      </div>
    </section>
  `;

  // Interaction Logic
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('#main-nav');
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });
}

document.addEventListener('DOMContentLoaded', initApp);
// Also call immediately in case DOM is already ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initApp();
}
