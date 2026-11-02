import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { calculateTitrationPH } from '../../utils/scienceMath.ts';

interface AcidBaseSimulationProps {
  initialAcidVol?: number;
}

export const AcidBaseSimulation: React.FC<AcidBaseSimulationProps> = ({
  initialAcidVol = 25,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [acidVol] = useState(initialAcidVol); // 25ml HCl 0.1M
  const [baseAdded, setBaseAdded] = useState(10); // ml NaOH 0.1M
  const [isDripping, setIsDripping] = useState(false);

  const { ph, colorHex, label } = calculateTitrationPH(acidVol, 0.1, baseAdded, 0.1);

  const liquidMeshRef = useRef<THREE.Mesh | null>(null);
  const liquidMatRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const dropletRef = useRef<THREE.Mesh | null>(null);

  // Auto-dripping interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isDripping) {
      interval = setInterval(() => {
        setBaseAdded((prev) => {
          if (prev >= 45) {
            setIsDripping(false);
            return prev;
          }
          return Math.round((prev + 0.5) * 10) / 10;
        });
      }, 400);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDripping]);

  // Update 3D liquid height & color
  useEffect(() => {
    if (liquidMatRef.current) {
      liquidMatRef.current.color = new THREE.Color(colorHex);
      liquidMatRef.current.attenuationColor = new THREE.Color(colorHex);
    }
    if (liquidMeshRef.current) {
      // Total volume in ml (from 25 to 70 ml)
      const totalVol = acidVol + baseAdded;
      const scaleY = Math.min(2.0, (totalVol / 35));
      liquidMeshRef.current.scale.set(1, scaleY, 1);
      liquidMeshRef.current.position.y = -0.7 + (scaleY * 0.35);
    }
  }, [baseAdded, colorHex, acidVol]);

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
    scene.background = new THREE.Color(0x0a1628);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 3.5, 7.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.target.set(0, 0.5, 0);

    // Studio Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.2);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    // Lab Bench
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(7, 0.3, 4.5),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
    );
    bench.position.y = -1.2;
    scene.add(bench);

    // Retort Stand (Base + Rod + Clamp)
    const standMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
    const standBase = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 2.2), standMat);
    standBase.position.set(-1.2, -1.0, 0);
    scene.add(standBase);

    const standRod = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.2, 16), standMat);
    standRod.position.set(-1.8, 1.0, -0.6);
    scene.add(standRod);

    const clampArm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.08), standMat);
    clampArm.position.set(-1.1, 2.0, 0);
    scene.add(clampArm);

    // Graduated Burette Tube
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      clearcoat: 1.0,
      ior: 1.5,
    });
    const burette = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 24), glassMat);
    burette.position.set(0, 2.4, 0);
    scene.add(burette);

    // Liquid column in Burette (NaOH solution)
    const buretteLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 2.6, 24),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.5 })
    );
    buretteLiquid.position.set(0, 2.5, 0);
    scene.add(buretteLiquid);

    // Burette Stopcock valve
    const valve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284c7 })
    );
    valve.position.set(0, 0.9, 0);
    valve.rotation.z = Math.PI / 2;
    scene.add(valve);

    // Falling Droplet
    const droplet = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    droplet.position.set(0, 0.7, 0);
    scene.add(droplet);
    dropletRef.current = droplet;

    // Erlenmeyer Flask (Conical Flask)
    const flaskGroup = new THREE.Group();
    flaskGroup.position.set(0, -0.7, 0);
    scene.add(flaskGroup);

    const flaskBody = new THREE.Mesh(
      new THREE.ConeGeometry(1.1, 1.4, 32, 1, true),
      glassMat
    );
    flaskBody.position.y = 0.4;
    flaskGroup.add(flaskBody);

    const flaskNeck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.7, 24, 1, true),
      glassMat
    );
    flaskNeck.position.y = 1.45;
    flaskGroup.add(flaskNeck);

    // Liquid in Flask
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(colorHex),
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
    });
    liquidMatRef.current = liquidMat;

    const liquidMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.95, 0.7, 24),
      liquidMat
    );
    liquidMesh.position.y = 0.2;
    flaskGroup.add(liquidMesh);
    liquidMeshRef.current = liquidMesh;

    // Magnetic Stirrer base below flask
    const stirrer = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 0.3, 32),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
    );
    stirrer.position.set(0, -0.9, 0);
    scene.add(stirrer);

    let frameId = 0;
    let dropProgress = 0;

    function tick() {
      // Animate droplet falling into flask
      if (dropletRef.current) {
        dropProgress = (dropProgress + 0.05) % 1;
        dropletRef.current.position.y = 0.7 - dropProgress * 0.9;
      }

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
        <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40">
          Chuẩn độ Axit - Bazơ & Thang đo pH
        </span>
        <div className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-900/80 text-white border border-slate-700 backdrop-blur-md">
          {label}
        </div>
      </div>

      {/* Top Right Live pH Meter Readout */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 bg-slate-900/90 p-3 rounded-2xl border border-slate-700/80 backdrop-blur-md shadow-2xl min-w-[190px]">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-700 pb-1">
          <span>Máy đo pH điện tử</span>
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorHex }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-300 text-xs font-medium">Chỉ số pH:</span>
          <span className="font-mono font-bold text-2xl" style={{ color: colorHex }}>
            {ph.toFixed(2)}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-1 flex justify-between">
          <span>NaOH nhỏ vào:</span>
          <span className="font-mono text-white font-bold">{baseAdded.toFixed(1)} ml</span>
        </div>
        <div className="text-[11px] text-slate-400 flex justify-between">
          <span>HCl ban đầu:</span>
          <span className="font-mono text-white">{acidVol} ml</span>
        </div>
      </div>

      {/* Main 3D Canvas */}
      <div ref={mountRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Bottom Control Dock */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-[94%] max-w-3xl">
        <div className="bg-slate-900/95 border border-slate-700/90 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBaseAdded((prev) => Math.min(45, Math.round((prev + 1) * 10) / 10))}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition shadow-md shadow-teal-600/30"
              >
                💧 Nhỏ 1.0 ml NaOH
              </button>
              <button
                type="button"
                onClick={() => setIsDripping(!isDripping)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  isDripping
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                }`}
              >
                {isDripping ? '⏸ Dừng nhỏ' : '▶ Nhỏ tự động'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBaseAdded(0);
                  setIsDripping(false);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition"
              >
                🔄 Rửa cốc
              </button>
            </div>

            {/* Titration Slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Khóa Buret NaOH:</span>
              <input
                type="range"
                min="0"
                max="45"
                step="0.5"
                value={baseAdded}
                onChange={(e) => setBaseAdded(parseFloat(e.target.value))}
                className="w-32 sm:w-44 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
              <span className="text-xs text-teal-400 font-mono w-12">{baseAdded} ml</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
