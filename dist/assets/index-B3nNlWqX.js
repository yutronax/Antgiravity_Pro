(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))n(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const i of t.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&n(i)}).observe(document,{childList:!0,subtree:!0});function s(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function n(e){if(e.ep)return;e.ep=!0;const t=s(e);fetch(e.href,t)}})();document.querySelector("#app").innerHTML=`
  <div class="card">
    <div class="status-badge">RALPH WIGGUM LOOP ACTIVE</div>
    <h1>Autonomous Excellence</h1>
    <p class="subtitle">I'm helping! Ralph is now in control of the विकास (development) cycle.</p>
    <div id="dynamic-content">
      <p>Initializing autonomous modules...</p>
    </div>
  </div>
`;setTimeout(()=>{const o=document.querySelector("#dynamic-content");o.style.opacity="0",setTimeout(()=>{o.innerHTML=`
      <p style="color: #38bdf8; font-weight: 500;">Environment: SECURE</p>
      <p style="color: #38bdf8; font-weight: 500;">Autonomy: ENABLED</p>
      <p style="color: #818cf8; font-weight: 500;">Next Step: Architecture Design</p>
    `,o.style.transition="opacity 0.5s ease",o.style.opacity="1"},500)},2e3);
