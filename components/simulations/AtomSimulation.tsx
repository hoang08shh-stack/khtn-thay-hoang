import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { getElectronShells } from '../../utils/scienceMath.ts';

interface AtomSimulationProps {
  protons?: number;
  neutrons?: number;
  speedMultiplier?: number;
  elementPreset?: string;
  onElementChange?: (element: { name: string; symbol: string; p: number; n: number }) => void;
}

const PRESET_ELEMENTS = [
  { name: 'Hydrogen', symbol: 'H', p: 1, n: 0 },
  { name: 'Helium', symbol: 'He', p: 2, n: 2 },
  { name: 'Carbon', symbol: 'C', p: 6, n: 6 },
  { name: 'Oxygen', symbol: 'O', p: 8, n: 8 },
  { name: 'Sodium', symbol: 'Na', p: 11, n: 12 },
  { name: 'Chlorine', symbol: 'Cl', p: 17, n: 18 },
];

export const AtomSimulation: React.FC<AtomSimulationProps> = ({
  protons = 6,
  neutrons = 6,
  speedMultiplier = 1,
  elementPreset = 'C',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeElement, setActiveElement] = useState(elementPreset);
  const [pCount, setPCount] = useState(protons);
  const [nCount, setNCount] = useState(neutrons);
  const [speed, setSpeed] = useState(speedMultiplier);
  const [isPaused, setIsPaused] = useState(false);
  const [showRings, setShowRings] = useState(true);

  // Mutable refs for animation loop
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const showRingsRef = useRef(showRings);
  showRingsRef.current = showRings;

  const electronsGroupRef = useRef<THREE.Group | null>(null);
  const nucleusGroupRef = useRef<THREE.Group | null>(null);
  const ringsGroupRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const electronShells = getElectronShells(pCount);

  // Update element preset
  const selectElement = (el: typeof PRESET_ELEMENTS[0]) => {
    setActiveElement(el.symbol);
    setPCount(el.p);
    setNCount(el.n);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Detect software WebGL
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
    scene.background = new THREE.Color(0x071527); // Dark navy space
    scene.fog = new THREE.FogExp2(0x071527, 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 5, 12);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 25;
    controls.minDistance = 3;

    // Lights
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.2);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const pointLight = new THREE.PointLight(0x0d9488, 3.0, 10);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(16, 16, 0x1e3a5f, 0x0f233d);
    gridHelper.position.y = -3.5;
    scene.add(gridHelper);

    // Groups
    const nucleusGroup = new THREE.Group();
    scene.add(nucleusGroup);
    nucleusGroupRef.current = nucleusGroup;

    const ringsGroup = new THREE.Group();
    scene.add(ringsGroup);
    ringsGroupRef.current = ringsGroup;

    const electronsGroup = new THREE.Group();
    scene.add(electronsGroup);
    electronsGroupRef.current = electronsGroup;

    // Helper to generate nucleus and electron shells
    const buildAtom = (p: number, n: number) => {
      while (nucleusGroup.children.length > 0) nucleusGroup.remove(nucleusGroup.children[0]);
      while (electronsGroup.children.length > 0) electronsGroup.remove(electronsGroup.children[0]);
      while (ringsGroup.children.length > 0) ringsGroup.remove(ringsGroup.children[0]);

      const protonGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const protonMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.25,
        metalness: 0.2,
        emissive: 0x7f1d1d,
        emissiveIntensity: 0.3,
      });

      const neutronGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const neutronMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.4,
        metalness: 0.1,
      });

      const electronGeo = new THREE.SphereGeometry(0.14, 16, 16);
      const electronMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 0.8,
        roughness: 0.1,
        metalness: 0.8,
      });

      const totalNucleons = p + n;
      const radius = Math.max(0.35, Math.pow(totalNucleons, 1 / 3) * 0.28);

      for (let i = 0; i < totalNucleons; i++) {
        const isProton = i < p;
        const mesh = new THREE.Mesh(isProton ? protonGeo : neutronGeo, isProton ? protonMat : neutronMat);
        const phi = Math.acos(1 - (2 * (i + 0.5)) / totalNucleons);
        const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
        const r = radius * (0.4 + 0.6 * Math.cbrt((i + 1) / totalNucleons));
        mesh.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
        nucleusGroup.add(mesh);
      }

      const shells = getElectronShells(p);
      const shellRadii = [2.0, 3.4, 4.8, 6.2];

      shells.forEach((electronsInShell, shellIdx) => {
        const shellR = shellRadii[shellIdx] || 2.0 + shellIdx * 1.4;
        const ringGeo = new THREE.TorusGeometry(shellR, 0.02, 12, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x0284c7,
          transparent: true,
          opacity: 0.35,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2 + (shellIdx * 0.25);
        ringMesh.rotation.y = shellIdx * 0.3;
        ringsGroup.add(ringMesh);

        const shellGroup = new THREE.Group();
        shellGroup.rotation.x = ringMesh.rotation.x;
        shellGroup.rotation.y = ringMesh.rotation.y;

        for (let j = 0; j < electronsInShell; j++) {
          const angle = (2 * Math.PI * j) / electronsInShell;
          const eMesh = new THREE.Mesh(electronGeo, electronMat);
          eMesh.position.set(shellR * Math.cos(angle), shellR * Math.sin(angle), 0);
          shellGroup.add(eMesh);
        }
        electronsGroup.add(shellGroup);
      });
    };

    // Initial build
    buildAtom(pCount, nCount);

    // Animation loop variables
    let frameId = 0;
    let clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = clock.getDelta();

      if (!isPausedRef.current) {
        const currentSpeed = speedRef.current;
        nucleusGroup.rotation.y += delta * 0.4 * currentSpeed;
        nucleusGroup.rotation.x += delta * 0.2 * currentSpeed;

        electronsGroup.children.forEach((shellGroup, index) => {
          const dir = index % 2 === 0 ? 1 : -1;
          shellGroup.rotation.y += delta * (1.8 / (index + 1)) * currentSpeed * dir;
          shellGroup.rotation.z += delta * 0.3 * currentSpeed;
        });
      }

      ringsGroup.visible = showRingsRef.current;

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
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
      clearTimeout(frameId);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Rebuild Nucleus & Electrons on subsequent prop/state changes
  useEffect(() => {
    const nucleusGroup = nucleusGroupRef.current;
    const electronsGroup = electronsGroupRef.current;
    const ringsGroup = ringsGroupRef.current;
    if (!nucleusGroup || !electronsGroup || !ringsGroup) return;

    while (nucleusGroup.children.length > 0) nucleusGroup.remove(nucleusGroup.children[0]);
    while (electronsGroup.children.length > 0) electronsGroup.remove(electronsGroup.children[0]);
    while (ringsGroup.children.length > 0) ringsGroup.remove(ringsGroup.children[0]);

    const protonGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const protonMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.25,
      metalness: 0.2,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.3,
    });

    const neutronGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const neutronMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.4,
      metalness: 0.1,
    });

    const electronGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const electronMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.8,
    });

    const totalNucleons = pCount + nCount;
    const radius = Math.max(0.35, Math.pow(totalNucleons, 1 / 3) * 0.28);

    for (let i = 0; i < totalNucleons; i++) {
      const isProton = i < pCount;
      const mesh = new THREE.Mesh(isProton ? protonGeo : neutronGeo, isProton ? protonMat : neutronMat);
      const phi = Math.acos(1 - (2 * (i + 0.5)) / totalNucleons);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      const r = radius * (0.4 + 0.6 * Math.cbrt((i + 1) / totalNucleons));
      mesh.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
      nucleusGroup.add(mesh);
    }

    const shells = getElectronShells(pCount);
    const shellRadii = [2.0, 3.4, 4.8, 6.2];

    shells.forEach((electronsInShell, shellIdx) => {
      const shellR = shellRadii[shellIdx] || 2.0 + shellIdx * 1.4;
      const ringGeo = new THREE.TorusGeometry(shellR, 0.02, 12, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.35,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2 + (shellIdx * 0.25);
      ringMesh.rotation.y = shellIdx * 0.3;
      ringsGroup.add(ringMesh);

      const shellGroup = new THREE.Group();
      shellGroup.rotation.x = ringMesh.rotation.x;
      shellGroup.rotation.y = ringMesh.rotation.y;

      for (let j = 0; j < electronsInShell; j++) {
        const angle = (2 * Math.PI * j) / electronsInShell;
        const eMesh = new THREE.Mesh(electronGeo, electronMat);
        eMesh.position.set(shellR * Math.cos(angle), shellR * Math.sin(angle), 0);
        shellGroup.add(eMesh);
      }
      electronsGroup.add(shellGroup);
    });
  }, [pCount, nCount]);

  return (
    <div className="relative w-full h-full min-h-[460px] flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
      {/* Top Left Spec Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40">
          Mô hình Rutherford - Bohr
        </span>
        <div className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-900/80 text-white border border-slate-700/80 backdrop-blur-md">
          Nguyên tố: <strong className="text-teal-400 font-bold">{activeElement}</strong> (Z = {pCount})
        </div>
      </div>

      {/* Top Right Element Preset Quick Selector */}
      <div className="absolute top-4 right-4 z-10 flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/80 backdrop-blur-md">
        {PRESET_ELEMENTS.map((el) => (
          <button
            key={el.symbol}
            onClick={() => selectElement(el)}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              activeElement === el.symbol
                ? 'bg-teal-500 text-white shadow-md shadow-teal-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {el.symbol}
          </button>
        ))}
      </div>

      {/* Main 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Unified Ergonomic Collapsible Bottom Control Dock */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-[94%] max-w-3xl">
        <div className="bg-slate-900/95 border border-slate-700/90 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Stats summary */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-slate-300">Proton (+):</span>
                <strong className="text-white font-mono">{pCount}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-slate-300">Neutron (0):</span>
                <strong className="text-white font-mono">{nCount}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="text-slate-300">Electron (-):</span>
                <strong className="text-white font-mono">{pCount}</strong>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-teal-400 font-mono">
                Lớp: [{electronShells.join(', ')}]
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRings}
                  onChange={(e) => setShowRings(e.target.checked)}
                  className="rounded border-slate-600 text-teal-500 focus:ring-teal-400"
                />
                Quỹ đạo
              </label>

              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition"
              >
                {isPaused ? '▶ Tiếp tục' : '⏸ Tạm dừng'}
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Tốc độ:</span>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.2"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
                <span className="text-xs text-teal-400 font-mono w-6">{speed.toFixed(1)}x</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
