import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { calculateOhmLaw } from '../../utils/scienceMath.ts';

interface CircuitSimulationProps {
  initialVoltage?: number;
  initialResistance?: number;
}

export const CircuitSimulation: React.FC<CircuitSimulationProps> = ({
  initialVoltage = 6,
  initialResistance = 10,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [voltage, setVoltage] = useState(initialVoltage);
  const [resistance, setResistance] = useState(initialResistance);
  const [isSwitchClosed, setIsSwitchClosed] = useState(true);

  // Circuit calculations using pure logic
  const { currentAmperes, powerWatts, brightnessRatio } = isSwitchClosed
    ? calculateOhmLaw(voltage, resistance)
    : { currentAmperes: 0, powerWatts: 0, brightnessRatio: 0 };

  const bulbLightRef = useRef<THREE.PointLight | null>(null);
  const filamentMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const switchArmRef = useRef<THREE.Group | null>(null);

  // Update dynamic 3D elements on state change
  useEffect(() => {
    if (bulbLightRef.current) {
      bulbLightRef.current.intensity = isSwitchClosed ? brightnessRatio * 5.0 : 0;
    }
    if (filamentMatRef.current) {
      if (isSwitchClosed && brightnessRatio > 0.05) {
        filamentMatRef.current.emissive = new THREE.Color(0xfbbf24);
        filamentMatRef.current.emissiveIntensity = Math.min(2.5, brightnessRatio * 3.0);
      } else {
        filamentMatRef.current.emissive = new THREE.Color(0x000000);
        filamentMatRef.current.emissiveIntensity = 0;
      }
    }
    if (switchArmRef.current) {
      // 0 rad = closed, -0.6 rad = open
      switchArmRef.current.rotation.z = isSwitchClosed ? 0 : -0.65;
    }
  }, [voltage, resistance, isSwitchClosed, brightnessRatio]);

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
    camera.position.set(0, 7, 9);

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
    controls.target.set(0, 0, 0);

    // Studio Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(6, 10, 6);
    scene.add(dirLight);

    // 1. Breadboard Lab Base
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.2,
    });
    const breadboard = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 5.5), boardMat);
    breadboard.position.y = -0.15;
    scene.add(breadboard);

    // Circuit wires material (Copper with glossy insulation)
    const wireMatRed = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const wireMatBlue = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 });
    const wireMatBlack = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });

    // 2. Battery Pack (Left)
    const batteryGroup = new THREE.Group();
    batteryGroup.position.set(-2.5, 0.4, 0);
    scene.add(batteryGroup);

    const battBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 1.6, 24),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.4, roughness: 0.3 })
    );
    battBody.rotation.z = Math.PI / 2;
    batteryGroup.add(battBody);

    const battCapPos = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 16), metalMat);
    battCapPos.rotation.z = Math.PI / 2;
    battCapPos.position.x = 0.9;
    batteryGroup.add(battCapPos);

    // 3. Knife Switch (Front Center)
    const switchGroup = new THREE.Group();
    switchGroup.position.set(0, 0.2, 1.8);
    scene.add(switchGroup);

    const switchBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.15, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x475569 })
    );
    switchGroup.add(switchBase);

    // Switch Arm (Pivots)
    const switchArm = new THREE.Group();
    switchArm.position.set(-0.4, 0.1, 0);
    switchGroup.add(switchArm);
    switchArmRef.current = switchArm;

    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.12), metalMat);
    lever.position.set(0.45, 0, 0);
    switchArm.add(lever);

    const handle = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xd97706 })
    );
    handle.position.set(0.9, 0, 0);
    switchArm.add(handle);

    // 4. Lightbulb Assembly (Center Right)
    const bulbGroup = new THREE.Group();
    bulbGroup.position.set(2.4, 0.5, -0.6);
    scene.add(bulbGroup);

    // Socket
    const socket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.45, 0.5, 24),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.3 })
    );
    bulbGroup.add(socket);

    // Glass bulb
    const glass = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 32, 32),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.45,
        roughness: 0.1,
        metalness: 0.1,
        clearcoat: 1.0,
      })
    );
    glass.position.y = 0.65;
    bulbGroup.add(glass);

    // Filament coil
    const filamentMat = new THREE.MeshStandardMaterial({
      color: 0x78716c,
      roughness: 0.2,
    });
    filamentMatRef.current = filamentMat;
    const filament = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 12, 24), filamentMat);
    filament.position.y = 0.6;
    filament.rotation.x = Math.PI / 2;
    bulbGroup.add(filament);

    // Dynamic bulb glow pointlight
    const bulbLight = new THREE.PointLight(0xfef08a, 4.0, 8);
    bulbLight.position.set(2.4, 1.1, -0.6);
    scene.add(bulbLight);
    bulbLightRef.current = bulbLight;

    // 5. Ceramic Resistor (Back Center)
    const resistorGroup = new THREE.Group();
    resistorGroup.position.set(0, 0.3, -1.8);
    scene.add(resistorGroup);

    const resistorBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 1.1, 24),
      new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 })
    );
    resistorBody.rotation.z = Math.PI / 2;
    resistorGroup.add(resistorBody);

    // Color bands (Brown, Black, Gold)
    const bandMat1 = new THREE.MeshBasicMaterial({ color: 0x78350f });
    const bandMat2 = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.1, 16), bandMat1);
    b1.rotation.z = Math.PI / 2;
    b1.position.x = -0.3;
    resistorGroup.add(b1);

    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.1, 16), bandMat2);
    b2.rotation.z = Math.PI / 2;
    b2.position.x = 0;
    resistorGroup.add(b2);

    // Connecting wires
    const createWire = (points: [number, number, number][], material: THREE.Material) => {
      const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.04, 8, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, material);
      scene.add(tubeMesh);
    };

    createWire([[-1.6, 0.4, 0], [-1.6, 0.1, -1.8], [-0.6, 0.1, -1.8]], wireMatRed);
    createWire([[0.6, 0.1, -1.8], [2.4, 0.1, -1.8], [2.4, 0.4, -1.0]], wireMatRed);
    createWire([[2.4, 0.3, -0.2], [2.4, 0.1, 1.8], [0.8, 0.1, 1.8]], wireMatBlue);
    createWire([[-0.5, 0.1, 1.8], [-2.5, 0.1, 1.8], [-2.5, 0.3, 0.2]], wireMatBlack);

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

  return (
    <div className="relative w-full h-full min-h-[460px] flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
      {/* Top Left Spec Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40">
          KHOA HỌC SỐ KHTN: Mạch điện & Định luật Ohm
        </span>
        <div className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-900/80 text-white border border-slate-700 backdrop-blur-md">
          Trạng thái mạch: <strong className={isSwitchClosed ? 'text-emerald-400' : 'text-red-400'}>
            {isSwitchClosed ? 'Mạch KÍN (Có dòng điện)' : 'Mạch HỞ (Ngắt điện)'}
          </strong>
        </div>
      </div>

      {/* Top Right Multimeter Real-time Readout HUD */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 bg-slate-900/90 p-3 rounded-2xl border border-slate-700/80 backdrop-blur-md shadow-2xl min-w-[210px]">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-700 pb-1">
          <span>Đồng hồ đo số VOM</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Hiệu điện thế (U):</span>
          <span className="font-mono font-bold text-amber-400 text-sm">{voltage.toFixed(1)} V</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Điện trở (R):</span>
          <span className="font-mono font-bold text-sky-400 text-sm">{resistance.toFixed(1)} Ω</span>
        </div>
        <div className="flex items-center justify-between text-xs border-t border-slate-800 pt-1">
          <span className="text-slate-300 font-semibold">Cường độ dòng (I):</span>
          <span className="font-mono font-bold text-emerald-400 text-base">{currentAmperes.toFixed(3)} A</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Công suất đèn (P):</span>
          <span className="font-mono text-purple-300">{powerWatts.toFixed(2)} W</span>
        </div>
      </div>

      {/* Main 3D Canvas */}
      <div ref={mountRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Unified Bottom Control Dock */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-[94%] max-w-3xl">
        <div className="bg-slate-900/95 border border-slate-700/90 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Switch Toggle */}
            <button
              onClick={() => setIsSwitchClosed(!isSwitchClosed)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg ${
                isSwitchClosed
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              <span>{isSwitchClosed ? '⚡ Ngắt công tắc K' : '🔌 Đóng công tắc K'}</span>
            </button>

            {/* Voltage Slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Pin nguồn U:</span>
              <input
                type="range"
                min="1.5"
                max="12"
                step="0.5"
                value={voltage}
                onChange={(e) => setVoltage(parseFloat(e.target.value))}
                className="w-24 sm:w-32 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-xs text-amber-400 font-mono w-10">{voltage.toFixed(1)}V</span>
            </div>

            {/* Resistance Slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Điện trở R:</span>
              <input
                type="range"
                min="2"
                max="50"
                step="1"
                value={resistance}
                onChange={(e) => setResistance(parseFloat(e.target.value))}
                className="w-24 sm:w-32 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <span className="text-xs text-sky-400 font-mono w-10">{resistance}Ω</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
