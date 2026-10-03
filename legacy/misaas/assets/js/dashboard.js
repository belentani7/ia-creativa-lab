(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function initOrb() {
    var canvas = document.getElementById('orb-canvas');
    if (!canvas || !window.CoreScene) return;
    var orb = new CoreScene(canvas, { count: 900, radius: 1.55, size: 7, turbulence: 0.3, mouseStrength: 0 });
    if (orb.failed) { canvas.style.display = 'none'; return; }
    orb.start();
    document.addEventListener('visibilitychange', function () {
      orb.setVisible(!document.hidden);
    });
  }

  function initCounters() {
    var nums = document.querySelectorAll('[data-count]');
    var animate = function (el) {
      var end = parseFloat(el.dataset.count);
      var dec = parseInt(el.dataset.dec || '0', 10);
      if (reduceMotion) { el.textContent = end.toFixed(dec); return; }
      var start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / 1400, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (end * eased).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    nums.forEach(animate);
  }

  function prepCanvas(canvas, height) {
    var w = canvas.clientWidth || canvas.parentElement.clientWidth;
    var h = height || canvas.clientHeight || 40;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  function drawSpark(canvas) {
    var values = canvas.dataset.spark.split(',').map(Number);
    var c = prepCanvas(canvas, 34);
    var ctx = c.ctx;
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var range = max - min || 1;
    var stepX = c.w / (values.length - 1);
    var toY = function (v) { return c.h - 4 - ((v - min) / range) * (c.h - 10); };
    var grad = ctx.createLinearGradient(0, 0, 0, c.h);
    grad.addColorStop(0, 'rgba(0,243,255,0.28)');
    grad.addColorStop(1, 'rgba(0,243,255,0)');
    ctx.beginPath();
    ctx.moveTo(0, toY(values[0]));
    for (var i = 1; i < values.length; i++) {
      var x = i * stepX;
      var prevX = (i - 1) * stepX;
      ctx.bezierCurveTo((prevX + x) / 2, toY(values[i - 1]), (prevX + x) / 2, toY(values[i]), x, toY(values[i]));
    }
    var linePath = new Path2D();
    for (var j = 0; j < values.length; j++) {
      var px = j * stepX;
      var py = toY(values[j]);
      if (j === 0) linePath.moveTo(px, py);
      else linePath.lineTo(px, py);
    }
    ctx.save();
    ctx.lineTo(c.w, c.h);
    ctx.lineTo(0, c.h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,243,255,0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke(linePath);
    var lastX = (values.length - 1) * stepX;
    var lastY = toY(values[values.length - 1]);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = 'rgba(0,243,255,0.8)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  var chartState = { dataA: [], dataB: [], progress: 0, hoverX: null, raf: null };

  function generateSeries(points, base, volatility) {
    var out = [];
    var v = base;
    for (var i = 0; i < points; i++) {
      v += (Math.random() - 0.45) * volatility;
      v = Math.max(base * 0.35, v);
      var wave = Math.sin((i / points) * Math.PI * 2.2) * base * 0.18;
      out.push(v + wave);
    }
    return out;
  }

  function drawChart() {
    var canvas = document.getElementById('chart-canvas');
    if (!canvas) return;
    var c = prepCanvas(canvas, 300);
    var ctx = c.ctx;
    var pad = { l: 44, r: 12, t: 14, b: 26 };
    var w = c.w - pad.l - pad.r;
    var h = c.h - pad.t - pad.b;
    var all = chartState.dataA.concat(chartState.dataB);
    var max = Math.max.apply(null, all) * 1.15;
    ctx.clearRect(0, 0, c.w, c.h);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.fillStyle = '#52525b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    for (var g = 0; g <= 4; g++) {
      var gy = pad.t + (h / 4) * g;
      ctx.beginPath();
      ctx.moveTo(pad.l, gy);
      ctx.lineTo(pad.l + w, gy);
      ctx.stroke();
      var label = Math.round(max - (max / 4) * g);
      ctx.fillText(String(label), pad.l - 8, gy + 3);
    }

    var toXY = function (values, i) {
      var x = pad.l + (i / (values.length - 1)) * w;
      var y = pad.t + h - (values[i] / max) * h;
      return [x, y];
    };

    var drawSeries = function (values, color, fill, visibleCount) {
      var limit = Math.max(2, Math.floor(values.length * visibleCount));
      ctx.beginPath();
      var p0 = toXY(values, 0);
      ctx.moveTo(p0[0], p0[1]);
      for (var i = 1; i < limit; i++) {
        var prev = toXY(values, i - 1);
        var cur = toXY(values, i);
        ctx.bezierCurveTo((prev[0] + cur[0]) / 2, prev[1], (prev[0] + cur[0]) / 2, cur[1], cur[0], cur[1]);
      }
      if (fill) {
        var last = toXY(values, limit - 1);
        ctx.save();
        ctx.lineTo(last[0], pad.t + h);
        ctx.lineTo(p0[0], pad.t + h);
        ctx.closePath();
        var grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + h);
        grad.addColorStop(0, fill);
        grad.addColorStop(1, 'rgba(0,243,255,0)');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
        ctx.beginPath();
        p0 = toXY(values, 0);
        ctx.moveTo(p0[0], p0[1]);
        for (var k = 1; k < limit; k++) {
          var a = toXY(values, k - 1);
          var b = toXY(values, k);
          ctx.bezierCurveTo((a[0] + b[0]) / 2, a[1], (a[0] + b[0]) / 2, b[1], b[0], b[1]);
        }
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      var lastP = toXY(values, limit - 1);
      ctx.beginPath();
      ctx.arc(lastP[0], lastP[1], 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      return lastP;
    };

    drawSeries(chartState.dataB, 'rgba(212,175,55,0.75)', null, chartState.progress);
    var lastA = drawSeries(chartState.dataA, '#00f3ff', 'rgba(0,243,255,0.22)', chartState.progress);

    ctx.fillStyle = '#52525b';
    ctx.textAlign = 'center';
    var labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
    for (var t = 0; t < labels.length; t++) {
      var tx = pad.l + (w / (labels.length - 1)) * t;
      ctx.fillText(labels[t], tx, c.h - 8);
    }

    if (chartState.hoverX !== null && chartState.hoverX >= pad.l && chartState.hoverX <= pad.l + w) {
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(chartState.hoverX, pad.t);
      ctx.lineTo(chartState.hoverX, pad.t + h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(chartState.hoverX, lastA[1], 5, 0, Math.PI * 2);
      ctx.fillStyle = '#030508';
      ctx.fill();
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function animateChart() {
    if (reduceMotion) {
      chartState.progress = 1;
      drawChart();
      return;
    }
    var start = null;
    var step = function (ts) {
      if (!start) start = ts;
      chartState.progress = Math.min((ts - start) / 900, 1);
      drawChart();
      if (chartState.progress < 1) chartState.raf = requestAnimationFrame(step);
    };
    chartState.raf = requestAnimationFrame(step);
  }

  function initChart() {
    var canvas = document.getElementById('chart-canvas');
    if (!canvas) return;
    chartState.dataA = generateSeries(24, 1600, 260);
    chartState.dataB = generateSeries(24, 900, 180);
    animateChart();
    canvas.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      chartState.hoverX = e.clientX - rect.left;
      drawChart();
    });
    canvas.addEventListener('mouseleave', function () {
      chartState.hoverX = null;
      drawChart();
    });
    document.querySelectorAll('[data-range]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-range]').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var mult = btn.dataset.range === '7d' ? 1.6 : btn.dataset.range === '30d' ? 2.4 : 1;
        chartState.dataA = generateSeries(24, 1600 * mult, 260 * mult);
        chartState.dataB = generateSeries(24, 900 * mult, 180 * mult);
        animateChart();
      });
    });
  }

  var agents = [
    { name: 'sales-01', role: 'Ventas', status: 'active', tasks: 4821, cost: '12.40€', on: true },
    { name: 'research-04', role: 'Investigación', status: 'active', tasks: 3204, cost: '9.80€', on: true },
    { name: 'ops-07', role: 'Operaciones', status: 'active', tasks: 2987, cost: '7.20€', on: true },
    { name: 'scraper-02', role: 'Datos', status: 'idle', tasks: 5510, cost: '4.10€', on: true },
    { name: 'legal-03', role: 'Cumplimiento', status: 'idle', tasks: 890, cost: '3.60€', on: false },
    { name: 'support-09', role: 'Soporte', status: 'error', tasks: 1204, cost: '5.90€', on: false }
  ];

  var agentFilter = 'all';
  var agentQuery = '';

  function renderAgents() {
    var body = document.getElementById('agentsBody');
    if (!body) return;
    var visible = agents.filter(function (a) {
      var matchStatus = agentFilter === 'all' || a.status === agentFilter;
      var matchQuery = !agentQuery || (a.name + ' ' + a.role).toLowerCase().indexOf(agentQuery) !== -1;
      return matchStatus && matchQuery;
    });
    body.innerHTML = '';
    visible.forEach(function (a) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><div class="agent-name"><span class="agent-dot ' + a.status + '"></span>' + a.name + '</div></td>' +
        '<td>' + a.role + '</td>' +
        '<td><span class="badge ' + a.status + '">' + a.status + '</span></td>' +
        '<td class="data">' + a.tasks.toLocaleString('es-ES') + '</td>' +
        '<td class="data">' + a.cost + '</td>' +
        '<td><div class="switch' + (a.on ? ' on' : '') + '" data-agent="' + a.name + '" role="switch" aria-checked="' + a.on + '" tabindex="0"></div></td>';
      body.appendChild(tr);
    });
    var count = document.getElementById('agentsCount');
    if (count) count.textContent = visible.length + ' de ' + agents.length + ' registrados';
  }

  function initAgents() {
    renderAgents();
    document.querySelectorAll('[data-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-filter]').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        agentFilter = btn.dataset.filter;
        renderAgents();
      });
    });
    document.addEventListener('click', function (e) {
      var sw = e.target.closest('.switch');
      if (!sw) return;
      var agent = agents.find(function (a) { return a.name === sw.dataset.agent; });
      if (!agent) return;
      agent.on = !agent.on;
      sw.classList.toggle('on', agent.on);
      sw.setAttribute('aria-checked', String(agent.on));
    });
    var input = document.getElementById('searchInput');
    if (input) {
      input.addEventListener('input', function () {
        agentQuery = input.value.trim().toLowerCase();
        renderAgents();
      });
    }
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (input) input.focus();
      }
    });
  }

  function initLogFeed() {
    var feed = document.getElementById('logFeed');
    if (!feed) return;
    var lines = [
      { c: 'ok', m: 'sales-01 cerró secuencia de 38 correos · 4 respuestas' },
      { c: 'info', m: 'research-04 indexando 1.204 fuentes nuevas' },
      { c: 'ok', m: 'ops-07 canary promovido · 100% tráfico estable' },
      { c: 'warn', m: 'scraper-02 backoff 4s · rate-limit upstream' },
      { c: 'ok', m: 'scraper-02 recuperado · 1.204 registros en cola' },
      { c: 'err', m: 'support-09 herramienta denegada por política RBAC' },
      { c: 'info', m: 'memoria vectorial compactada · -18% tokens' },
      { c: 'ok', m: 'legal-03 revisión completada · 0 bloqueos' },
      { c: 'info', m: 'presupuesto enjambre 63% · dentro de límites' },
      { c: 'ok', m: 'núcleo heartbeat · 1420 agentes sincronizados' }
    ];
    var index = 0;
    var max = 14;
    var push = function () {
      var item = lines[index % lines.length];
      index++;
      var now = new Date();
      var stamp = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
      var row = document.createElement('div');
      row.className = 'log-line ' + item.c;
      row.innerHTML = '<span class="t">' + stamp + '</span><span class="msg">' + item.m + '</span>';
      feed.appendChild(row);
      while (feed.children.length > max) feed.removeChild(feed.firstChild);
    };
    for (var i = 0; i < 8; i++) push();
    if (!reduceMotion) setInterval(push, 2400);
  }

  function initActivity() {
    var feed = document.getElementById('activityFeed');
    if (!feed) return;
    var items = [
      { m: 'Política zero-trust aplicada a sales-01', w: 'hace 2m' },
      { m: 'Nuevo conector MCP: stripe-billing', w: 'hace 18m' },
      { m: 'ops-07 desplegó versión v4.2 del runtime', w: 'hace 42m' },
      { m: 'Backup del núcleo completado', w: 'hace 1h' },
      { m: 'research-04 amplió cuota a 2.000 req/min', w: 'hace 3h' }
    ];
    items.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'activity-item';
      row.innerHTML = '<span class="mark"></span><span>' + item.m + '</span><span class="when">' + item.w + '</span>';
      feed.appendChild(row);
    });
  }

  function initSidebarToggle() {
    var toggle = document.getElementById('sideToggle');
    var sidebar = document.getElementById('sidebar');
    if (!toggle || !sidebar) return;
    var mq = window.matchMedia('(max-width: 1080px)');
    var apply = function () {
      toggle.style.display = mq.matches ? 'grid' : 'none';
      if (!mq.matches) sidebar.classList.remove('open');
    };
    apply();
    mq.addEventListener('change', apply);
    toggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
    });
  }

  function initResize() {
    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        drawChart();
        document.querySelectorAll('.spark').forEach(drawSpark);
      }, 150);
    });
  }

  initOrb();
  initCounters();
  document.querySelectorAll('.spark').forEach(drawSpark);
  initChart();
  initAgents();
  initLogFeed();
  initActivity();
  initSidebarToggle();
  initResize();
})();
