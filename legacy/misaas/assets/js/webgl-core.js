(function () {
  'use strict';

  var VERT = [
    'uniform float uTime;',
    'uniform float uSize;',
    'uniform float uTurbulence;',
    'uniform vec2 uMouse;',
    'attribute float aPhase;',
    'attribute float aScale;',
    'varying float vIntensity;',
    'varying vec3 vColor;',
    'void main() {',
    '  vec3 p = position;',
    '  float t = uTime * 0.45 + aPhase * 6.28318;',
    '  float n = sin(p.x * 1.7 + t) * cos(p.y * 1.5 + t * 0.8) * sin(p.z * 1.3 + t * 0.6);',
    '  float n2 = sin(p.y * 3.1 - t * 1.3) * cos(p.z * 2.4 + t * 0.5);',
    '  p += normal * (n * uTurbulence + n2 * uTurbulence * 0.35);',
    '  p.x += uMouse.x * (1.0 - abs(normal.x)) * 0.35;',
    '  p.y += -uMouse.y * (1.0 - abs(normal.y)) * 0.35;',
    '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
    '  gl_PointSize = uSize * aScale * (1.0 / -mv.z);',
    '  gl_Position = projectionMatrix * mv;',
    '  vIntensity = clamp(0.5 + 0.5 * n + 0.25 * n2, 0.0, 1.0);',
    '  vColor = mix(vec3(0.0, 0.55, 0.75), vec3(0.85, 0.7, 0.25), vIntensity);',
    '  vColor = mix(vColor, vec3(0.0, 0.95, 1.0), smoothstep(0.55, 1.0, vIntensity));',
    '}'
  ].join('\n');

  var FRAG = [
    'varying float vIntensity;',
    'varying vec3 vColor;',
    'void main() {',
    '  float d = length(gl_PointCoord - vec2(0.5));',
    '  float alpha = smoothstep(0.5, 0.08, d);',
    '  alpha *= 0.35 + vIntensity * 0.65;',
    '  gl_FragColor = vec4(vColor, alpha);',
    '}'
  ].join('\n');

  function CoreScene(canvas, options) {
    var opts = options || {};
    this.canvas = canvas;
    this.count = opts.count || 4200;
    this.radius = opts.radius || 2.1;
    this.size = opts.size || 26;
    this.turbulence = opts.turbulence || 0.24;
    this.speed = opts.speed || 1;
    this.mouseStrength = opts.mouseStrength === undefined ? 1 : opts.mouseStrength;
    this.mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    this.visible = true;
    this.running = false;
    this.failed = false;
    this.clock = null;
    this.raf = null;
    this.onMouseMove = this.onMouseMove.bind(this);
    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);
    this.init();
  }

  CoreScene.isSupported = function () {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  };

  CoreScene.prototype.init = function () {
    if (!window.THREE || !CoreScene.isSupported()) {
      this.failed = true;
      this.canvas.classList.add('webgl-fallback');
      return;
    }
    var THREE = window.THREE;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    this.camera.position.set(0, 0, 5.4);

    var positions = new Float32Array(this.count * 3);
    var normals = new Float32Array(this.count * 3);
    var phases = new Float32Array(this.count);
    var scales = new Float32Array(this.count);
    var golden = Math.PI * (3 - Math.sqrt(5));

    for (var i = 0; i < this.count; i++) {
      var y = 1 - (i / (this.count - 1)) * 2;
      var r = Math.sqrt(Math.max(0, 1 - y * y));
      var theta = golden * i;
      var jitter = 0.92 + Math.random() * 0.16;
      var x = Math.cos(theta) * r * jitter;
      var z = Math.sin(theta) * r * jitter;
      positions[i * 3] = x * this.radius;
      positions[i * 3 + 1] = y * jitter * this.radius;
      positions[i * 3 + 2] = z * this.radius;
      normals[i * 3] = x;
      normals[i * 3 + 1] = y;
      normals[i * 3 + 2] = z;
      phases[i] = Math.random();
      scales[i] = 0.4 + Math.random() * 1.4;
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: this.size * this.renderer.getPixelRatio() },
        uTurbulence: { value: this.turbulence },
        uMouse: { value: new THREE.Vector2(0, 0) }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(geometry, this.material);
    this.scene.add(this.points);
    this.clock = new THREE.Clock();

    window.addEventListener('resize', this.resize);
    if (this.mouseStrength > 0) {
      window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    }
    this.resize();
  };

  CoreScene.prototype.onMouseMove = function (e) {
    this.mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };

  CoreScene.prototype.resize = function () {
    if (this.failed || !this.renderer) return;
    var w = this.canvas.clientWidth || 1;
    var h = this.canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  CoreScene.prototype.loop = function () {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    if (!this.visible) return;
    var t = this.clock.getElapsedTime() * this.speed;
    this.mouse.x += (this.mouse.tx - this.mouse.x) * 0.045;
    this.mouse.y += (this.mouse.ty - this.mouse.y) * 0.045;
    this.material.uniforms.uTime.value = t;
    this.material.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);
    this.points.rotation.y = t * 0.08;
    this.points.rotation.x = Math.sin(t * 0.12) * 0.12;
    this.renderer.render(this.scene, this.camera);
  };

  CoreScene.prototype.start = function () {
    if (this.failed || this.running) return;
    this.running = true;
    if (this.clock) this.clock.start();
    this.loop();
  };

  CoreScene.prototype.stop = function () {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  };

  CoreScene.prototype.setVisible = function (v) {
    this.visible = v;
  };

  window.CoreScene = CoreScene;
})();
