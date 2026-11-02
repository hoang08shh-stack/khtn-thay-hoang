import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const PLANETS = [
  { name: 'Thủy tinh (Mercury)', viName: 'Thủy tinh', r: 0.18, dist: 2.2, speed: 4.1, color: 0x94a3b8 },
  { name: 'Kim tinh (Venus)', viName: 'Kim tinh', r: 0.28, dist: 3.2, speed: 1.6, color: 0xf59e0b },
  { name: 'Trái Đất (Earth)', viName: 'Trái Đất', r: 0.32, dist: 4.4, speed: 1.0, color: 0x38bdf8, hasMoon: true },
  { name: 'Hỏa tinh (Mars)', viName: 'Hỏa tinh', r: 0.22, dist: 5.6, speed: 0.53, color: 0xef4444 },
  { name: 'Mộc tinh (Jupiter)', viName: 'Mộc tinh', r: 0.75, dist: 7.4, speed: 0.2, color: 0xd97706 },
  { name: 'Thổ tinh (Saturn)', viName: 'Thổ tinh', r: 0.62, dist: 9.6, speed: 0.12, color: 0xfde047, hasRings: true },
  { name: 'Thiên Vương tinh (Uranus)', viName: 'Thiên Vương', r: 0.44, dist: 11.8, speed: 0.08, color: 0x06b6d4 },
  { name: 'Hải Vương tinh (Neptune)', viName: 'Hải Vương', r: 0.42, dist: 13.8, speed: 0.05, color: 0x2563eb },
];

export const SolarSystemSimulation: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [selectedPlanet, setSelectedPlanet] = useState<string>('Trái Đất');
  const [showOrbits, setShowOrbits] = useState(true);

  const speedRef = useRef(speedMultiplier);
  speedRef.current = speedMultiplier;
  const showOrbitsRef = useRef(showOrbits);
  showOrbitsRef.current = showOrbits;

  const orbitsGroupRef = useRef<THREE.Group | null>(null);
  const planetsGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712); // Deep universe black

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 14, 18);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.maxDistance = 40;
    controls.minDistance = 4;

    // Distant background starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 350;
    const starCoords = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starCoords[i] = (Math.random() - 0.5) * 80;
      starCoords[i + 1] = (Math.random() - 0.5) * 80;
      starCoords[i + 2] = (Math.random() - 0.5) * 80;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Sun at center
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), sunMat);
    scene.add(sun);

    // Sun light source
    const sunLight = new THREE.PointLight(0xffedd5, 4.0, 50, 0.2);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x334155, 0.6);
    scene.add(ambientLight);

    // Orbit paths group
    const orbitsGroup = new THREE.Group();
    scene.add(orbitsGroup);
    orbitsGroupRef.current = orbitsGroup;

    // Planets group
    const planetsGroup = new THREE.Group();
    scene.add(planetsGroup);
    planetsGroupRef.current = planetsGroup;

    // Build planets and orbit rings
    const planetMeshes: { group: THREE.Group; dist: number; speed: number; mesh: THREE.Mesh }[] = [];

    PLANETS.forEach((planet) => {
      // Orbit path
      const orbitGeo = new THREE.RingGeometry(planet.dist - 0.02, planet.dist + 0.02, 64);
      const orbitMat = new THREE.MeshBasicMaterial({
        color: 0x334155,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      });
      const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
      orbitRing.rotation.x = Math.PI / 2;
      orbitsGroup.add(orbitRing);

      // Planet Pivot
      const pivot = new THREE.Group();
      planetsGroup.add(pivot);

      const pMat = new THREE.MeshStandardMaterial({
        color: planet.color,
        roughness: 0.6,
      });
      const pMesh = new THREE.Mesh(new THREE.SphereGeometry(planet.r, 24, 24), pMat);
      pMesh.position.x = planet.dist;
      pivot.add(pMesh);

      // Saturn Rings
      if (planet.hasRings) {
        const ringGeo = new THREE.RingGeometry(planet.r * 1.4, planet.r * 2.3, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xfef08a,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.3;
        pMesh.add(ring);
      }

      // Earth Moon
      if (planet.hasMoon) {
        const moon = new THREE.Mesh(
          new THREE.SphereGeometry(planet.r * 0.28, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0xd1d5db })
        );
        moon.position.x = planet.r * 1.8;
        pMesh.add(moon);
      }

      planetMeshes.push({ group: pivot, dist: planet.dist, speed: planet.speed, mesh: pMesh });
    });

    let frameId = 0;
    const clock = new THREE.Clock();

    function tick() {
      const delta = clock.getDelta();
      const currentSpeed = speedRef.current;

      sun.rotation.y += delta * 0.3 * currentSpeed;

      planetMeshes.forEach((p) => {
        p.group.rotation.y += delta * (p.speed * 0.6) * currentSpeed;
        p.mesh.rotation.y += delta * 1.5 * currentSpeed;
      });

      orbitsGroup.visible = showOrbitsRef.current;

      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    }
    tick();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[460px] flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
      {/* Top Header Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40">
          Mô hình Hệ Mặt Trời 3D
        </span>
        <div className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-900/80 text-white border border-slate-700 backdrop-blur-md">
          Hành tinh đang chọn: <strong className="text-purple-400 font-bold">{selectedPlanet}</strong>
        </div>
      </div>

      {/* Main 3D Canvas */}
      <div ref={mountRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Unified Bottom Control Dock */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-[94%] max-w-3xl">
        <div className="bg-slate-900/95 border border-slate-700/90 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Planets Quick selector */}
            <div className="flex flex-wrap items-center gap-1">
              {PLANETS.map((p) => (
                <button
                  key={p.viName}
                  onClick={() => setSelectedPlanet(p.name)}
                  className={`px-2 py-1 text-xs font-medium rounded-lg transition ${
                    selectedPlanet.includes(p.viName)
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {p.viName}
                </button>
              ))}
            </div>

            {/* Orbit & Speed */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOrbits}
                  onChange={(e) => setShowOrbits(e.target.checked)}
                  className="rounded border-slate-600 text-purple-500 focus:ring-purple-400"
                />
                Vòng quỹ đạo
              </label>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Tốc độ:</span>
                <input
                  type="range"
                  min="0.2"
                  max="4.0"
                  step="0.2"
                  value={speedMultiplier}
                  onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                  className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
                <span className="text-xs text-purple-400 font-mono w-6">{speedMultiplier}x</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
