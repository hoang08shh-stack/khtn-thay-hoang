import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface MicroscopeSimulationProps {
  initialMagnification?: number;
}

export const MicroscopeSimulation: React.FC<MicroscopeSimulationProps> = ({
  initialMagnification = 10,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [lensMag, setLensMag] = useState(initialMagnification); // 4x, 10x, 40x
  const [focusLevel, setFocusLevel] = useState(50); // 0-100, 50 is sharp
  const [lightLevel, setLightLevel] = useState(80);
  const [viewMode, setViewMode] = useState<'3d-scope' | 'eyepiece'>('3d-scope');
  const [activeCellPart, setActiveCellPart] = useState<string | null>(null);

  const stageGroupRef = useRef<THREE.Group | null>(null);
  const nosepieceRef = useRef<THREE.Group | null>(null);
  const focusKnobRef = useRef<THREE.Mesh | null>(null);

  // Sync focus adjustment to 3D stage height
  useEffect(() => {
    if (stageGroupRef.current) {
      // Stage shifts slightly along Y based on focus
      stageGroupRef.current.position.y = -0.5 + (focusLevel - 50) * 0.006;
    }
    if (focusKnobRef.current) {
      focusKnobRef.current.rotation.x = (focusLevel / 100) * Math.PI * 4;
    }
  }, [focusLevel]);

  // Rotate nosepiece when changing lens
  useEffect(() => {
    if (nosepieceRef.current) {
      const targetAngle = lensMag === 4 ? 0 : lensMag === 10 ? (Math.PI * 2) / 3 : (Math.PI * 4) / 3;
      nosepieceRef.current.rotation.y = targetAngle;
    }
  }, [lensMag]);

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
    scene.background = new THREE.Color(0x0a192f);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4, 5, 7);

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
    controls.target.set(0, 1.2, 0);

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.2);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(5, 10, 6);
    scene.add(dirLight);

    // Lab Table / Stand Base
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
    });
    const table = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 0.2, 32), tableMat);
    table.position.y = -1.8;
    scene.add(table);

    // --- PROCEDURAL 3D MICROSCOPE ASSEMBLY (10+ parts) ---
    const scopeGroup = new THREE.Group();
    scene.add(scopeGroup);

    // 1. Heavy Horseshoe Base
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.6,
    });
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 2.8), baseMat);
    base.position.set(0, -1.5, 0.2);
    scopeGroup.add(base);

    // 2. Curved Arm Pillar
    const armMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Science blue enamel
      roughness: 0.25,
      metalness: 0.4,
    });
    const armLower = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 2.6, 24), armMat);
    armLower.position.set(0, -0.2, -0.8);
    armLower.rotation.x = 0.15;
    scopeGroup.add(armLower);

    const armUpper = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 1.6), armMat);
    armUpper.position.set(0, 1.4, -0.2);
    scopeGroup.add(armUpper);

    // 3. Eyepiece Tube
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15,
    });
    const ocularTube = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.2, 24), chromeMat);
    ocularTube.position.set(0, 2.3, 0.2);
    ocularTube.rotation.x = -0.35;
    scopeGroup.add(ocularTube);

    // Eyepiece lens rim
    const eyepieceRim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.35, 24), baseMat);
    eyepieceRim.position.set(0, 2.8, 0.4);
    eyepieceRim.rotation.x = -0.35;
    scopeGroup.add(eyepieceRim);

    // 4. Revolving Nosepiece Turret
    const nosepiece = new THREE.Group();
    nosepiece.position.set(0, 0.9, 0.5);
    scopeGroup.add(nosepiece);
    nosepieceRef.current = nosepiece;

    const turretDisk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.2, 32), chromeMat);
    nosepiece.add(turretDisk);

    // 3 Objective Lenses (4x, 10x, 40x)
    const objLengths = [0.5, 0.75, 1.1];
    const objColors = [0xef4444, 0x10b981, 0x3b82f6]; // Red (4x), Green (10x), Blue (40x) bands
    for (let i = 0; i < 3; i++) {
      const objGroup = new THREE.Group();
      const angle = (i * Math.PI * 2) / 3;
      objGroup.position.set(0.35 * Math.sin(angle), -objLengths[i] / 2, 0.35 * Math.cos(angle));

      const objMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, objLengths[i], 16),
        chromeMat
      );
      objGroup.add(objMesh);

      // Color ring identifier
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.165, 0.165, 0.08, 16),
        new THREE.MeshStandardMaterial({ color: objColors[i], roughness: 0.3 })
      );
      ring.position.y = -objLengths[i] * 0.2;
      objGroup.add(ring);

      nosepiece.add(objGroup);
    }

    // 5. Specimen Stage (Bàn sa trượt)
    const stageGroup = new THREE.Group();
    stageGroup.position.set(0, -0.5, 0.5);
    scopeGroup.add(stageGroup);
    stageGroupRef.current = stageGroup;

    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.5,
      roughness: 0.3,
    });
    const stage = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 1.8), stageMat);
    stageGroup.add(stage);

    // Glass slide with sample spot
    const slide = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.04, 0.5),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        roughness: 0.1,
      })
    );
    slide.position.set(0, 0.08, 0);
    stageGroup.add(slide);

    // Specimen onion skin dot (purple/pink tint)
    const sample = new THREE.Mesh(
      new THREE.CircleGeometry(0.14, 16),
      new THREE.MeshBasicMaterial({ color: 0xec4899, side: THREE.DoubleSide })
    );
    sample.rotation.x = -Math.PI / 2;
    sample.position.set(0, 0.11, 0);
    stageGroup.add(sample);

    // 6. Substage Condenser & Light Source
    const condenser = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.5, 24), chromeMat);
    condenser.position.set(0, -0.9, 0.5);
    scopeGroup.add(condenser);

    const lightBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    lightBulb.position.set(0, -1.2, 0.5);
    scopeGroup.add(lightBulb);

    // 7. Focus Knobs (Coarse & Fine)
    const knobMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.7,
      roughness: 0.4,
    });
    const coarseKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 24), knobMat);
    coarseKnob.position.set(0.65, 0.2, -0.7);
    coarseKnob.rotation.z = Math.PI / 2;
    scopeGroup.add(coarseKnob);
    focusKnobRef.current = coarseKnob;

    let frameId = 0;
    function tick() {
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

  // Compute blur for eyepiece view based on focus level (sharpest at 50)
  const blurAmount = Math.abs(focusLevel - 50) * 0.18; // in px
  const totalMag = lensMag * 10; // 10x eyepiece

  return (
    <div className="relative w-full h-full min-h-[460px] flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
      {/* Top Header Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          Kính hiển vi quang học sinh học
        </span>
        <div className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-900/80 text-white border border-slate-700 backdrop-blur-md">
          Độ phóng đại: <strong className="text-emerald-400 font-bold">{totalMag}x</strong> (Thị kính 10x × Vật kính {lensMag}x)
        </div>
      </div>

      {/* Switch Mode Button */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setViewMode(viewMode === '3d-scope' ? 'eyepiece' : '3d-scope')}
          className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
        >
          {viewMode === '3d-scope' ? '🔬 Soi qua thị kính' : '🔭 Xem thân kính 3D'}
        </button>
      </div>

      {/* 3D Scope Canvas */}
      <div
        ref={mountRef}
        className={`w-full h-full flex-1 cursor-grab active:cursor-grabbing ${
          viewMode === 'eyepiece' ? 'hidden' : 'block'
        }`}
      />

      {/* Eyepiece Microscope Observation Overlay View */}
      {viewMode === 'eyepiece' && (
        <div className="relative w-full h-full flex-1 flex items-center justify-center bg-slate-900 p-4">
          <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] rounded-full border-8 border-slate-950 bg-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
            {/* Circular Iris View with Plant Cell Pattern */}
            <div
              className="w-full h-full transition-all duration-150 relative bg-emerald-950/40 flex items-center justify-center"
              style={{
                filter: `blur(${blurAmount}px) brightness(${lightLevel / 100})`,
                opacity: lightLevel > 15 ? 1 : 0.2,
              }}
            >
              {/* Plant Cells (Tế bào vảy hành) SVG illustration */}
              <svg viewBox="0 0 400 400" className="w-full h-full">
                {/* Cell Walls (Hexagonal / Rectangular grid) */}
                <g stroke="#10b981" strokeWidth="4" fill="rgba(6, 78, 59, 0.45)">
                  <polygon points="50,40 180,30 200,120 70,130" />
                  <polygon points="180,30 330,25 350,110 200,120" />
                  <polygon points="70,130 200,120 220,230 90,240" />
                  <polygon points="200,120 350,110 370,220 220,230" />
                  <polygon points="90,240 220,230 240,340 110,350" />
                  <polygon points="220,230 370,220 390,330 240,340" />
                </g>

                {/* Nuclei (Nhân tế bào) with clickable hotspots */}
                <g fill="#ec4899" opacity="0.9">
                  <circle cx="130" cy="80" r="12" />
                  <circle cx="260" cy="70" r="14" />
                  <circle cx="150" cy="180" r="15" className="animate-pulse" />
                  <circle cx="290" cy="170" r="13" />
                  <circle cx="170" cy="290" r="14" />
                </g>

                {/* Chloroplasts (Lục lạp xanh lá cây) */}
                <g fill="#22c55e" opacity="0.85">
                  <ellipse cx="110" cy="160" rx="8" ry="5" />
                  <ellipse cx="175" cy="140" rx="7" ry="4" />
                  <ellipse cx="180" cy="205" rx="8" ry="5" />
                  <ellipse cx="120" cy="210" rx="7" ry="5" />
                  <ellipse cx="250" cy="130" rx="8" ry="4" />
                  <ellipse cx="320" cy="150" rx="8" ry="5" />
                  <ellipse cx="240" cy="190" rx="7" ry="5" />
                  <ellipse cx="330" cy="195" rx="7" ry="4" />
                </g>

                {/* Vacuoles (Không bào trung tâm trong suốt) */}
                <g stroke="#34d399" strokeDasharray="3,3" fill="rgba(167, 243, 208, 0.15)">
                  <ellipse cx="145" cy="185" rx="42" ry="26" />
                  <ellipse cx="285" cy="175" rx="46" ry="28" />
                </g>

                {/* Crosshair reticle */}
                <line x1="200" y1="0" x2="200" y2="400" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <line x1="0" y1="200" x2="400" y2="200" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <circle cx="200" cy="200" r="180" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
              </svg>
            </div>

            {/* Sharpness feedback badge */}
            <div className="absolute bottom-6 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-black/60 text-white">
              {blurAmount < 0.6 ? (
                <span className="text-emerald-400 font-bold">✓ Tiêu cự rõ nét (Ốc vi cấp hoàn hảo)</span>
              ) : (
                <span className="text-amber-400">⚠ Mờ: Hãy vặn ốc vi cấp về mức 50 để lấy nét</span>
              )}
            </div>
          </div>

          {/* Cell structures legend */}
          <div className="hidden lg:flex flex-col gap-2 ml-6 text-xs text-slate-300 bg-slate-900/90 p-3.5 rounded-xl border border-slate-700">
            <div className="font-bold text-white text-sm border-b border-slate-700 pb-1">
              Cấu tạo tế bào biểu bì hành:
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-700 border border-emerald-500" />
              <span><strong>Thành tế bào (Cellulose):</strong> Khung đỡ định hình</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-pink-500" />
              <span><strong>Nhân tế bào:</strong> Chứa vật chất di truyền ADN</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span><strong>Lục lạp / Thể lạp:</strong> Bào quan sinh học</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-200/30 border border-emerald-400" />
              <span><strong>Không bào lớn:</strong> Chứa dịch tế bào & muối khoáng</span>
            </div>
          </div>
        </div>
      )}

      {/* Ergonomic Collapsible Bottom Control Dock */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-[94%] max-w-3xl">
        <div className="bg-slate-900/95 border border-slate-700/90 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Lens Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Vật kính:</span>
              {[4, 10, 40].map((mag) => (
                <button
                  key={mag}
                  onClick={() => setLensMag(mag)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    lensMag === mag
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {mag}x {mag === 4 ? '(Đỏ)' : mag === 10 ? '(Vàng)' : '(Xanh)'}
                </button>
              ))}
            </div>

            {/* Focus Knob Slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Ốc vi cấp (Lấy nét):</span>
              <input
                type="range"
                min="0"
                max="100"
                value={focusLevel}
                onChange={(e) => setFocusLevel(parseInt(e.target.value))}
                className="w-24 sm:w-32 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-xs text-emerald-400 font-mono w-7">{focusLevel}</span>
            </div>

            {/* Light Intensity */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Đèn tụ quang:</span>
              <input
                type="range"
                min="10"
                max="100"
                value={lightLevel}
                onChange={(e) => setLightLevel(parseInt(e.target.value))}
                className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-xs text-emerald-400 font-mono w-7">{lightLevel}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
