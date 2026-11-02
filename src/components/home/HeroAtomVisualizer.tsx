import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Atom, Play, Pause, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HeroAtomVisualizer: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [element, setElement] = useState<'C' | 'O' | 'H'>('C');
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 240;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4, 10);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
    } catch {
      return;
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x2dd4bf, 3, 20);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const backLight = new THREE.PointLight(0x38bdf8, 2, 20);
    backLight.position.set(-5, -3, -5);
    scene.add(backLight);

    // Groups
    const atomGroup = new THREE.Group();
    scene.add(atomGroup);

    const nucleusGroup = new THREE.Group();
    atomGroup.add(nucleusGroup);

    const electronGroup = new THREE.Group();
    atomGroup.add(electronGroup);

    // Nucleus spheres
    const protonGeo = new THREE.SphereGeometry(0.32, 16, 16);
    const protonMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x991b1b,
      emissiveIntensity: 0.3,
    });

    const neutronGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const neutronMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.4,
      metalness: 0.1,
    });

    const protonCount = element === 'C' ? 6 : element === 'O' ? 8 : 1;
    const neutronCount = element === 'C' ? 6 : element === 'O' ? 8 : 0;

    for (let i = 0; i < protonCount; i++) {
      const pMesh = new THREE.Mesh(protonGeo, protonMat);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * 0.45;
      pMesh.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      nucleusGroup.add(pMesh);
    }

    for (let i = 0; i < neutronCount; i++) {
      const nMesh = new THREE.Mesh(neutronGeo, neutronMat);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * 0.45;
      nMesh.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      nucleusGroup.add(nMesh);
    }

    // Shell configuration for Carbon (2, 4), Oxygen (2, 6), Hydrogen (1)
    const shells = element === 'C' ? [2, 4] : element === 'O' ? [2, 6] : [1];
    const shellRadii = [2.2, 3.8];

    const electronGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const electronMat = new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x14b8a6,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });

    const electronTrackers: Array<{
      mesh: THREE.Mesh;
      radius: number;
      speed: number;
      phase: number;
      tiltX: number;
      tiltY: number;
    }> = [];

    shells.forEach((count, sIdx) => {
      const radius = shellRadii[sIdx] || 2.2;

      // Orbit ring line
      const ringGeo = new THREE.RingGeometry(radius - 0.02, radius + 0.02, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x0d9488,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2 + (sIdx === 1 ? 0.35 : -0.2);
      atomGroup.add(ringMesh);

      // Add electrons
      for (let i = 0; i < count; i++) {
        const eMesh = new THREE.Mesh(electronGeo, electronMat);
        atomGroup.add(eMesh);
        electronTrackers.push({
          mesh: eMesh,
          radius,
          speed: (sIdx === 0 ? 1.6 : 1.1) * (i % 2 === 0 ? 1 : -1),
          phase: (i / count) * Math.PI * 2,
          tiltX: ringMesh.rotation.x,
          tiltY: sIdx * 0.4,
        });
      }
    });

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (!isPausedRef.current && !prefersReducedMotion) {
        atomGroup.rotation.y += delta * 0.25;
        nucleusGroup.rotation.x += delta * 0.3;
        nucleusGroup.rotation.z += delta * 0.2;

        const time = clock.getElapsedTime();
        electronTrackers.forEach((track) => {
          const angle = time * track.speed + track.phase;
          const x = Math.cos(angle) * track.radius;
          const z = Math.sin(angle) * track.radius;
          const pos = new THREE.Vector3(x, 0, z);
          pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), track.tiltX);
          pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), track.tiltY);
          track.mesh.position.copy(pos);
        });
      }

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 240;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer) {
        renderer.dispose();
      }
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [element]);

  return (
    <div className="w-full max-w-md bg-gradient-to-b from-[#071527] to-[#0B1F3A] p-5 rounded-3xl border border-teal-500/30 shadow-2xl relative group">
      {/* Top Header / Status bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span className="text-[11px] font-mono text-slate-300 ml-1 font-semibold">
            Lab3D_RutherfordBohr
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
            WebGL 3D
          </span>
        </div>
      </div>

      {/* 3D Canvas Mount */}
      <div className="relative w-full h-56 flex items-center justify-center overflow-hidden my-1">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Floating element badge */}
        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/80 text-[11px] text-slate-200 font-mono shadow-sm">
          {element === 'C' && 'Cacbon (Z=6, 6p 6e)'}
          {element === 'O' && 'Oxy (Z=8, 8p 8e)'}
          {element === 'H' && 'Hydro (Z=1, 1p 1e)'}
        </div>

        {/* Legend */}
        <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-800 text-[10px] text-slate-300 flex items-center gap-2 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> p⁺
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> n⁰
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" /> e⁻
          </span>
        </div>
      </div>

      {/* Interactive Controls & Switcher */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px]">Nguyên tố:</span>
            {(['C', 'O', 'H'] as const).map((sym) => (
              <button
                key={sym}
                onClick={() => setElement(sym)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  element === sym
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs flex items-center gap-1"
            title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-teal-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            <span className="text-[11px] font-mono">{isPaused ? 'Chạy' : 'Dừng'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full pt-1">
          <Link
            to="/mo-phong/sim-atom-bohr"
            className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition text-center shadow-md shadow-teal-600/30 flex items-center justify-center gap-1.5"
          >
            <Atom className="w-4 h-4" />
            <span>Vào Lab 3D tương tác đầy đủ</span>
          </Link>
          <Link
            to="/bai-hoc/khtn-7-bai-2"
            className="py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            Lý thuyết
          </Link>
        </div>
      </div>
    </div>
  );
};
