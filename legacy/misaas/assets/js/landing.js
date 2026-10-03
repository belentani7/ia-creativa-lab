(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initCore() {
    var canvas = document.getElementById('core-canvas');
    if (!canvas || !window.CoreScene) return;
    var scene = new CoreScene(canvas, { count: 4600, radius: 2.15, size: 9, turbulence: 0.26 });
    if (scene.failed) { canvas.style.display = 'none'; return; }
    scene.start();
    document.addEventListener('visibilitychange', function () {
      scene.setVisible(!document.hidden);
    });
  }

  function initReveals() {
    var items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  function initCounters() {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;
    var animate = function (el) {
      var end = parseFloat(el.dataset.count);
      var dec = parseInt(el.dataset.dec || '0', 10);
      if (reduceMotion) { el.textContent = end.toFixed(dec); return; }
      var start = null;
      var dur = 1600;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (end * eased).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { nums.forEach(animate); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  }

  function initScramble() {
    var el = document.querySelector('[data-scramble]');
    if (!el || reduceMotion) return;
    var target = el.dataset.scramble;
    var chars = '!<>-_\\/[]{}—=+*^?#________';
    var frame = 0;
    var total = target.length * 2;
    var tick = function () {
      var out = '';
      for (var i = 0; i < target.length; i++) {
        if (target[i] === ' ') { out += ' '; continue; }
        out += i < frame / 2 ? target[i] : chars[Math.floor(Math.random() * chars.length)];
      }
      el.textContent = out;
      frame++;
      if (frame <= total) setTimeout(tick, 28);
      else el.textContent = target;
    };
    setTimeout(tick, 300);
  }

  function initTerminal() {
    var body = document.getElementById('terminalBody');
    if (!body) return;
    var lines = [
      { c: 'cmd', m: 'swarm deploy --agents 12 --policy zero-trust' },
      { c: 'ok', m: 'núcleo en línea · 12/12 agentes registrados' },
      { c: 'info', m: 'agente[sales-01] tarea#4821 → prospección 240 cuentas' },
      { c: 'ok', m: 'agente[sales-01] 38 respuestas cualificadas · coste 0.42€' },
      { c: 'info', m: 'agente[research-04] informe competitivo 32 páginas' },
      { c: 'warn', m: 'agente[scraper-02] rate-limit detectado · backoff 4s' },
      { c: 'ok', m: 'agente[scraper-02] reintento exitoso · 1.204 registros' },
      { c: 'info', m: 'agente[ops-07] despliegue canary 10% tráfico' },
      { c: 'ok', m: 'agente[ops-07] canary estable · promovido a 100%' },
      { c: 'err', m: 'agente[legal-03] herramienta denegada por política' },
      { c: 'ok', m: 'agente[legal-03] ruta alternativa aprobada por supervisor' },
      { c: 'info', m: 'presupuesto del enjambre 63% consumido · 41% restante' },
      { c: 'ok', m: 'ciclo completado · 2.418 tareas · 0 incidentes críticos' }
    ];
    var index = 0;
    var max = 10;
    var push = function () {
      var item = lines[index % lines.length];
      index++;
      var now = new Date();
      var stamp = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
      var row = document.createElement('div');
      row.className = 'terminal-line';
      row.innerHTML = '<span class="t">' + stamp + '</span><span class="' + item.c + '">' + item.m + '</span>';
      body.appendChild(row);
      while (body.children.length > max) body.removeChild(body.firstChild);
    };
    for (var i = 0; i < 6; i++) push();
    if (!reduceMotion) setInterval(push, 1900);
  }

  function initNav() {
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    if (nav) {
      var onScroll = function () {
        nav.classList.toggle('scrolled', window.scrollY > 40);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        links.classList.toggle('open');
      });
      links.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') links.classList.remove('open');
      });
    }
  }

  function initMagnetic() {
    if (reduceMotion || window.matchMedia('(pointer: coarse)').matches) return;
    document.querySelectorAll('.btn-primary').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18;
        var y = (e.clientY - r.top - r.height / 2) * 0.18;
        btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  initCore();
  initReveals();
  initCounters();
  initScramble();
  initTerminal();
  initNav();
  initMagnetic();
})();
