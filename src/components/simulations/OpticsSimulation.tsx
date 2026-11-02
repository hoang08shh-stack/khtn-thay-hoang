import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { calculateSnellRefraction } from '../../utils/scienceMath.ts';

export const OpticsSimulation: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [incidentAngle, setIncidentAngle] = useState(45); // degrees
  const [refractiveIndex, setRefractiveIndex] = useState(1.5); // glass n=1.5
  const [isWhiteLight, setIsWhiteLight] = useState(false);

  const { angleRefractedDeg, isTotalInternalReflection } = calculateSnellRefraction(
    incidentAngle,
    1.0,
    refractiveIndex
  );

  const rayGroupRef = useRef<THREE.Group | null>(null);

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
    camera.position.set(0, 8, 8);

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
    controls.target.set(0, 0, 0);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    // Optical Bench Board
    const bench = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 4.5, 0.2, 48),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
    );
    bench.position.y = -0.1;
    scene.add(bench);

    // Protractor Angle Scale Ring
    const dial = new THREE.Mesh(
      new THREE.RingGeometry(3.6, 4.0, 48),
      new THREE.MeshBasicMaterial({ color: 0x0ea5e9, side: THREE.DoubleSide, transparent: true, opacity: 0.4 })
    );
    dial.rotation.x = -Math.PI / 2;
    dial.position.y = 0.02;
    scene.add(dial);

    // Semi-circular Glass Block
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      roughness: 0.05,
      metalness: 0.1,
      clearcoat: 1.0,
      ior: 1.5,
    });
    // Semi-cylinder geometry
    const glassBlock = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 2.0, 0.6, 32, 1, false, 0, Math.PI),
      glassMat
    );
    glassBlock.rotation.x = Math.PI / 2;
    glassBlock.position.set(0, 0.3, 0);
    scene.add(glassBlock);

    // Laser Box Light Source
    const laserBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.3, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.6 })
    );
    laserBox.position.set(-3.2, 0.3, 0);
    scene.add(laserBox);

    // Light rays dynamic group
    const rayGroup = new THREE.Group();
    scene.add(rayGroup);
    rayGroupRef.current = rayGroup;

    // Helper to draw incident, reflected and refracted rays
    const drawRays = (angle: number, n: number, white: boolean) => {
      while (rayGroup.children.length > 0) rayGroup.remove(rayGroup.children[0]);
      const angleRad = (angle * Math.PI) / 180;
      const rayY = 0.3;

      const startX = -3.2 * Math.cos(angleRad);
      const startZ = 3.2 * Math.sin(angleRad);

      const incPoints = [new THREE.Vector3(startX, rayY, startZ), new THREE.Vector3(0, rayY, 0)];
      const incGeo = new THREE.BufferGeometry().setFromPoints(incPoints);
      const incMat = new THREE.LineBasicMaterial({
        color: white ? 0xffffff : 0xef4444,
        linewidth: 3,
      });
      rayGroup.add(new THREE.Line(incGeo, incMat));

      const refPoints = [new THREE.Vector3(0, rayY, 0), new THREE.Vector3(startX, rayY, -startZ)];
      const refGeo = new THREE.BufferGeometry().setFromPoints(refPoints);
      const refMat = new THREE.LineBasicMaterial({
        color: white ? 0xffffff : 0xef4444,
        transparent: true,
        opacity: 0.4,
      });
      rayGroup.add(new THREE.Line(refGeo, refMat));

      const { angleRefractedDeg: rDeg, isTotalInternalReflection: tir } = calculateSnellRefraction(angle, 1.0, n);
      if (!tir) {
        if (!white) {
          const rRad = (rDeg * Math.PI) / 180;
          const endX = 2.0 * Math.cos(rRad);
          const endZ = -2.0 * Math.sin(rRad);
          const refrPoints = [new THREE.Vector3(0, rayY, 0), new THREE.Vector3(endX, rayY, endZ)];
          const refrGeo = new THREE.BufferGeometry().setFromPoints(refrPoints);
          rayGroup.add(new THREE.Line(refrGeo, new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 3 })));
        } else {
          const rainbowColors = [0xef4444, 0xf97316, 0xeab308, 0x22c55e, 0x06b6d4, 0x3b82f6, 0x8b5cf6];
          rainbowColors.forEach((color, idx) => {
            const nSpread = n + (idx - 3) * 0.02;
            const { angleRefractedDeg: dispAngle } = calculateSnellRefraction(angle, 1.0, nSpread);
            const rRad = (dispAngle * Math.PI) / 180;
            const endX = 2.0 * Math.cos(rRad);
            const endZ = -2.0 * Math.sin(rRad);
            const rPoints = [new THREE.Vector3(0, rayY, 0), new THREE.Vector3(endX, rayY, endZ)];
            const rGeo = new THREE.BufferGeometry().setFromPoints(rPoints);
            rayGroup.add(new THREE.Line(rGeo, new THREE.LineBasicMaterial({ color, linewidth: 2 })));
          });
        }
      }
    };

    drawRays(incidentAngle, refractiveIndex, isWhiteLight);

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

  // Re-draw light rays when incident angle, index or mode changes
  useEffect(() => {
    const rayGroup = rayGroupRef.current;
    if (!rayGroup) return;

    while (rayGroup.children.length > 0) {
      rayGroup.remove(rayGroup.children[0]);
    }

    const angleRad = (incidentAngle * Math.PI) / 180;
    const rayY = 0.3;

    // 1. Incident Ray (From laser to center (0, 0))
    const startX = -3.2 * Math.cos(angleRad);
    const startZ = 3.2 * Math.sin(angleRad);

    const incPoints = [new THREE.Vector3(startX, rayY, startZ), new THREE.Vector3(0, rayY, 0)];
    const incGeo = new THREE.BufferGeometry().setFromPoints(incPoints);
    const incMat = new THREE.LineBasicMaterial({
      color: isWhiteLight ? 0xffffff : 0xef4444,
      linewidth: 3,
    });
    const incLine = new THREE.Line(incGeo, incMat);
    rayGroup.add(incLine);

    // 2. Reflected Ray (Angle of reflection = angle of incidence)
    const refPoints = [
      new THREE.Vector3(0, rayY, 0),
      new THREE.Vector3(startX, rayY, -startZ),
    ];
    const refGeo = new THREE.BufferGeometry().setFromPoints(refPoints);
    const refMat = new THREE.LineBasicMaterial({
      color: isWhiteLight ? 0xffffff : 0xef4444,
      transparent: true,
      opacity: 0.4,
    });
    rayGroup.add(new THREE.Line(refGeo, refMat));

    // 3. Refracted Ray (Through glass block)
    if (!isTotalInternalReflection) {
      if (!isWhiteLight) {
        const refrRad = (angleRefractedDeg * Math.PI) / 180;
        const endX = 2.0 * Math.cos(refrRad);
        const endZ = -2.0 * Math.sin(refrRad);

        const refrPoints = [new THREE.Vector3(0, rayY, 0), new THREE.Vector3(endX, rayY, endZ)];
        const refrGeo = new THREE.BufferGeometry().setFromPoints(refrPoints);
        const refrMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 3 });
        rayGroup.add(new THREE.Line(refrGeo, refrMat));
      } else {
        // Rainbow dispersion! 7 rainbow lines for white light
        const rainbowColors = [0xef4444, 0xf97316, 0xeab308, 0x22c55e, 0x06b6d4, 0x3b82f6, 0x8b5cf6];
        rainbowColors.forEach((color, idx) => {
          // slight refractive index spread (dispersion Cauchy)
          const nSpread = refractiveIndex + (idx - 3) * 0.02;
          const { angleRefractedDeg: dispAngle } = calculateSnellRefraction(incidentAngle, 1.0, nSpread);
          const rRad = (dispAngle * Math.PI) / 180;
          const endX = 2.0 * Math.cos(rRad);
          const endZ = -2.0 * Math.sin(rRad);

          const rPoints = [new THREE.Vector3(0, rayY, 0), new THREE.Vector3(endX, rayY, endZ)];
          const rGeo = new THREE.BufferGeometry().setFromPoints(rPoints);
          const rMat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
          rayGroup.add(new THREE.Line(rGeo, rMat));
        });
      }
    }
  }, [incidentAngle, refractiveIndex, isWhiteLight, angleRefractedDeg, isTotalInternalReflection]);

  return (
    <div className="relative w-full h-full min-h-[460px] flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
      {/* Top Header Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40">
          Khúc xạ & Tán sắc Ánh sáng
        </span>
        <div className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-900/80 text-white border border-slate-700 backdrop-blur-md">
          Định luật Snell: n₁·sin(i) = n₂·sin(r)
        </div>
      </div>

      {/* Top Right Angle & Index Readout HUD */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 bg-slate-900/90 p-3 rounded-2xl border border-slate-700/80 backdrop-blur-md shadow-2xl min-w-[200px]">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-1">
          Số đo góc quang học
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Góc tới (i):</span>
          <span className="font-mono font-bold text-amber-400 text-sm">{incidentAngle}°</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Góc khúc xạ (r):</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {isTotalInternalReflection ? 'Phản xạ toàn phần' : `${angleRefractedDeg}°`}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-1">
          <span>Chiết suất n₂:</span>
          <span className="font-mono text-sky-400 font-bold">{refractiveIndex.toFixed(2)}</span>
        </div>
      </div>

      {/* Main 3D Canvas */}
      <div ref={mountRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Unified Bottom Control Dock */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-[94%] max-w-3xl">
        <div className="bg-slate-900/95 border border-slate-700/90 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* White light toggle */}
            <button
              onClick={() => setIsWhiteLight(!isWhiteLight)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                isWhiteLight
                  ? 'bg-gradient-to-r from-red-500 via-green-500 to-purple-500 text-white shadow-lg'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              {isWhiteLight ? '🌈 Tán sắc Ánh sáng trắng' : '🔴 Tia Laser Đỏ (Đơn sắc)'}
            </button>

            {/* Angle Slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Góc tới i:</span>
              <input
                type="range"
                min="0"
                max="80"
                value={incidentAngle}
                onChange={(e) => setIncidentAngle(parseInt(e.target.value))}
                className="w-24 sm:w-32 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-xs text-amber-400 font-mono w-8">{incidentAngle}°</span>
            </div>

            {/* Refraction Index Slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Chiết suất n₂:</span>
              <input
                type="range"
                min="1.2"
                max="2.4"
                step="0.05"
                value={refractiveIndex}
                onChange={(e) => setRefractiveIndex(parseFloat(e.target.value))}
                className="w-20 sm:w-28 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <span className="text-xs text-sky-400 font-mono w-8">{refractiveIndex.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
