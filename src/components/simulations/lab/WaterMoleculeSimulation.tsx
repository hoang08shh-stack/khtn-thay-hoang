import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  calculateMoleculeCoordinates,
  calculateLonePairPositions,
  generateAngleArcPoints,
  calculateVibrations,
  ATOM_DATABASE,
  H2O_CONSTANTS,
  AtomProperties,
} from '../../../utils/waterMoleculeMath.ts';

export interface WaterMoleculeSimulationProps {
  parameters: {
    displayMode: 'ball-and-stick' | 'space-filling';
    bondAngleDeg: number;
    showLabels: boolean;
    showAngleArc: boolean;
    showDipole: boolean;
    showLonePairs: boolean;
    showPartialCharges: boolean;
    vibrationSpeed: number;
    autoRotate: boolean;
    rotateSpeed: number;
  };
  isPlaying: boolean;
  selectedAtomId?: string | null;
  onSelectAtom?: (atom: AtomProperties | null) => void;
  onAngleChange?: (newAngle: number) => void;
}

export const WaterMoleculeSimulation: React.FC<WaterMoleculeSimulationProps> = ({
  parameters,
  isPlaying,
  selectedAtomId,
  onSelectAtom,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredAtom, setHoveredAtom] = useState<string | null>(null);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const moleculeGroupRef = useRef<THREE.Group | null>(null);

  // Atom mesh references
  const oxygenMeshRef = useRef<THREE.Mesh | null>(null);
  const h1MeshRef = useRef<THREE.Mesh | null>(null);
  const h2MeshRef = useRef<THREE.Mesh | null>(null);

  // Bond cylinders
  const bond1MeshRef = useRef<THREE.Mesh | null>(null);
  const bond2MeshRef = useRef<THREE.Mesh | null>(null);

  // Angle arc & dipole
  const angleArcLineRef = useRef<THREE.Line | null>(null);
  const dipoleGroupRef = useRef<THREE.Group | null>(null);
  const lonePairsGroupRef = useRef<THREE.Group | null>(null);

  // Keep track of parameters via ref to avoid recreation in animation loop
  const paramsRef = useRef(parameters);
  paramsRef.current = parameters;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera centered directly at origin
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.2);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing and sRGB encoding
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.0;
    controls.maxDistance = 14.0;
    controls.maxPolarAngle = Math.PI - 0.1;
    controls.minPolarAngle = 0.1;
    controlsRef.current = controls;

    // 5. Lighting: Modern laboratory observatory ambiance
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // Key light (soft warm white)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(4, 6, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Fill light (teal tint matching branding)
    const fillLight = new THREE.DirectionalLight(0x2dd4bf, 1.0);
    fillLight.position.set(-5, 2, -3);
    scene.add(fillLight);

    // Rim back light (highlight edges of atoms)
    const rimLight = new THREE.PointLight(0x60a5fa, 2.0, 10);
    rimLight.position.set(0, -3, -4);
    scene.add(rimLight);

    // Grid plane on floor (subtle scientific reference)
    const grid = new THREE.GridHelper(10, 20, 0x1e293b, 0x0f172a);
    grid.position.y = -2.2;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.4;
    scene.add(grid);

    // 6. Main Molecule Group
    const moleculeGroup = new THREE.Group();
    scene.add(moleculeGroup);
    moleculeGroupRef.current = moleculeGroup;

    // Create atom meshes
    // Oxygen
    const oxygenGeo = new THREE.SphereGeometry(1, 48, 48);
    const oxygenMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.15,
      metalness: 0.1,
      emissive: 0x991b1b,
      emissiveIntensity: 0.08,
    });
    const oxygenMesh = new THREE.Mesh(oxygenGeo, oxygenMat);
    oxygenMesh.name = 'O';
    oxygenMesh.castShadow = true;
    oxygenMesh.receiveShadow = true;
    moleculeGroup.add(oxygenMesh);
    oxygenMeshRef.current = oxygenMesh;

    // Hydrogen 1
    const hGeo = new THREE.SphereGeometry(1, 40, 40);
    const hMat1 = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.05,
      emissive: 0x94a3b8,
      emissiveIntensity: 0.05,
    });
    const h1Mesh = new THREE.Mesh(hGeo, hMat1);
    h1Mesh.name = 'H1';
    h1Mesh.castShadow = true;
    h1Mesh.receiveShadow = true;
    moleculeGroup.add(h1Mesh);
    h1MeshRef.current = h1Mesh;

    // Hydrogen 2
    const hMat2 = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.05,
      emissive: 0x94a3b8,
      emissiveIntensity: 0.05,
    });
    const h2Mesh = new THREE.Mesh(hGeo, hMat2);
    h2Mesh.name = 'H2';
    h2Mesh.castShadow = true;
    h2Mesh.receiveShadow = true;
    moleculeGroup.add(h2Mesh);
    h2MeshRef.current = h2Mesh;

    // Covalent bonds (cylinders)
    const bondMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      roughness: 0.3,
      metalness: 0.2,
    });
    const bond1Geo = new THREE.CylinderGeometry(
      H2O_CONSTANTS.BALL_AND_STICK.BOND_RADIUS,
      H2O_CONSTANTS.BALL_AND_STICK.BOND_RADIUS,
      1,
      24
    );
    const bond1Mesh = new THREE.Mesh(bond1Geo, bondMat);
    moleculeGroup.add(bond1Mesh);
    bond1MeshRef.current = bond1Mesh;

    const bond2Geo = new THREE.CylinderGeometry(
      H2O_CONSTANTS.BALL_AND_STICK.BOND_RADIUS,
      H2O_CONSTANTS.BALL_AND_STICK.BOND_RADIUS,
      1,
      24
    );
    const bond2Mesh = new THREE.Mesh(bond2Geo, bondMat);
    moleculeGroup.add(bond2Mesh);
    bond2MeshRef.current = bond2Mesh;

    // Angle Arc Line
    const arcMat = new THREE.LineBasicMaterial({
      color: 0x2dd4bf, // Teal
      linewidth: 2,
    });
    const arcGeo = new THREE.BufferGeometry();
    const arcLine = new THREE.Line(arcGeo, arcMat);
    moleculeGroup.add(arcLine);
    angleArcLineRef.current = arcLine;

    // Dipole Moment Group
    const dipoleGroup = new THREE.Group();
    // Arrow cylinder
    const dipoleShaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 16);
    const dipoleMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber
      emissive: 0xd97706,
      emissiveIntensity: 0.4,
    });
    const dipoleShaft = new THREE.Mesh(dipoleShaftGeo, dipoleMat);
    dipoleShaft.position.y = 0.8;
    dipoleGroup.add(dipoleShaft);

    // Arrow Cone pointing toward Oxygen (+Y)
    const dipoleConeGeo = new THREE.ConeGeometry(0.12, 0.35, 16);
    const dipoleCone = new THREE.Mesh(dipoleConeGeo, dipoleMat);
    dipoleCone.position.y = 1.6;
    dipoleGroup.add(dipoleCone);

    // Cross-bar on tail representing the positive (+) tail of dipole moment
    const crossBarGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 12);
    const crossBar = new THREE.Mesh(crossBarGeo, dipoleMat);
    crossBar.rotation.z = Math.PI / 2;
    crossBar.position.y = 0.2;
    dipoleGroup.add(crossBar);

    moleculeGroup.add(dipoleGroup);
    dipoleGroupRef.current = dipoleGroup;

    // Lone Pairs Group (VSEPR lobes)
    const lonePairsGroup = new THREE.Group();
    const lpGeo = new THREE.SphereGeometry(0.24, 24, 24);
    // sp3 lobe teardrop stretching
    lpGeo.scale(0.8, 1.4, 0.8);
    const lpMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.2,
      transmission: 0.6,
      ior: 1.2,
    });
    const lp1Mesh = new THREE.Mesh(lpGeo, lpMat);
    const lp2Mesh = new THREE.Mesh(lpGeo, lpMat);
    lonePairsGroup.add(lp1Mesh);
    lonePairsGroup.add(lp2Mesh);
    moleculeGroup.add(lonePairsGroup);
    lonePairsGroupRef.current = lonePairsGroup;

    // 7. Raycasting for atom selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([oxygenMesh, h1Mesh, h2Mesh]);

      if (intersects.length > 0) {
        const clickedName = intersects[0].object.name;
        if (clickedName === 'O') {
          onSelectAtom?.(ATOM_DATABASE.O);
        } else if (clickedName === 'H1') {
          onSelectAtom?.(ATOM_DATABASE.H1);
        } else if (clickedName === 'H2') {
          onSelectAtom?.(ATOM_DATABASE.H2);
        }
      }
    };

    const handlePointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([oxygenMesh, h1Mesh, h2Mesh]);

      if (intersects.length > 0) {
        container.style.cursor = 'pointer';
        setHoveredAtom(intersects[0].object.name);
      } else {
        container.style.cursor = 'default';
        setHoveredAtom(null);
      }
    };

    renderer.domElement.addEventListener('click', handlePointerDown);
    renderer.domElement.addEventListener('mousemove', handlePointerMove);

    // 8. Animation & Render Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      const currentParams = paramsRef.current;
      const playing = isPlayingRef.current;

      // Auto-rotation
      if (currentParams.autoRotate && playing) {
        moleculeGroup.rotation.y += delta * currentParams.rotateSpeed * 0.5;
      }

      // Thermal Vibration
      let bondOffset = 0;
      let angleOffset = 0;
      if (playing && currentParams.vibrationSpeed > 0) {
        const vibe = calculateVibrations(elapsedTime, currentParams.vibrationSpeed, 0.04);
        bondOffset = vibe.bondOffset;
        angleOffset = vibe.angleOffsetDeg;
      }

      // Calculate effective bond angle
      const effectiveAngle = Math.max(80, Math.min(130, currentParams.bondAngleDeg + angleOffset));
      const isSpaceFilling = currentParams.displayMode === 'space-filling';

      // Recompute coordinates
      const coords = calculateMoleculeCoordinates(
        effectiveAngle,
        currentParams.displayMode,
        1.0 + bondOffset
      );

      // Scale and position Oxygen
      const oRad = isSpaceFilling
        ? H2O_CONSTANTS.SPACE_FILLING.O_RADIUS
        : H2O_CONSTANTS.BALL_AND_STICK.O_RADIUS;
      oxygenMesh.scale.set(oRad, oRad, oRad);
      oxygenMesh.position.set(coords.oxygen.x, coords.oxygen.y, coords.oxygen.z);

      // Scale and position Hydrogen 1
      const hRad = isSpaceFilling
        ? H2O_CONSTANTS.SPACE_FILLING.H_RADIUS
        : H2O_CONSTANTS.BALL_AND_STICK.H_RADIUS;
      h1Mesh.scale.set(hRad, hRad, hRad);
      h1Mesh.position.set(coords.hydrogen1.x, coords.hydrogen1.y, coords.hydrogen1.z);

      // Scale and position Hydrogen 2
      h2Mesh.scale.set(hRad, hRad, hRad);
      h2Mesh.position.set(coords.hydrogen2.x, coords.hydrogen2.y, coords.hydrogen2.z);

      // Covalent bond cylinders (hidden in space-filling mode)
      if (isSpaceFilling) {
        bond1Mesh.visible = false;
        bond2Mesh.visible = false;
      } else {
        bond1Mesh.visible = true;
        bond2Mesh.visible = true;

        // Position & align bond 1 between O and H1
        const pO = new THREE.Vector3(coords.oxygen.x, coords.oxygen.y, coords.oxygen.z);
        const pH1 = new THREE.Vector3(coords.hydrogen1.x, coords.hydrogen1.y, coords.hydrogen1.z);
        const pH2 = new THREE.Vector3(coords.hydrogen2.x, coords.hydrogen2.y, coords.hydrogen2.z);

        const mid1 = new THREE.Vector3().addVectors(pO, pH1).multiplyScalar(0.5);
        bond1Mesh.position.copy(mid1);
        bond1Mesh.scale.set(1, pO.distanceTo(pH1), 1);
        bond1Mesh.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3().subVectors(pH1, pO).normalize()
        );

        // Position & align bond 2 between O and H2
        const mid2 = new THREE.Vector3().addVectors(pO, pH2).multiplyScalar(0.5);
        bond2Mesh.position.copy(mid2);
        bond2Mesh.scale.set(1, pO.distanceTo(pH2), 1);
        bond2Mesh.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3().subVectors(pH2, pO).normalize()
        );
      }

      // Angle Arc
      if (currentParams.showAngleArc && !isSpaceFilling) {
        angleArcLineRef.current!.visible = true;
        const arcPoints = generateAngleArcPoints(
          coords.oxygen,
          coords.hydrogen1,
          coords.hydrogen2,
          0.7
        );
        const threePoints = arcPoints.map((p) => new THREE.Vector3(p.x, p.y, p.z));
        angleArcLineRef.current!.geometry.setFromPoints(threePoints);
      } else {
        angleArcLineRef.current!.visible = false;
      }

      // Dipole Vector
      if (currentParams.showDipole) {
        dipoleGroupRef.current!.visible = true;
        // Position dipole arrow starting below the H-H midpoint and pointing up to O
        const hhMidY = (coords.hydrogen1.y + coords.hydrogen2.y) * 0.5;
        dipoleGroupRef.current!.position.set(0, hhMidY - 0.2, 0);
      } else {
        dipoleGroupRef.current!.visible = false;
      }

      // Lone Pairs
      if (currentParams.showLonePairs) {
        lonePairsGroupRef.current!.visible = true;
        const [lp1Pos, lp2Pos] = calculateLonePairPositions(coords.oxygen, 0.7);
        lp1Mesh.position.set(lp1Pos.x, lp1Pos.y, lp1Pos.z);
        lp1Mesh.rotation.set(0.4, 0, 0.3);

        lp2Mesh.position.set(lp2Pos.x, lp2Pos.y, lp2Pos.z);
        lp2Mesh.rotation.set(-0.4, 0, -0.3);
      } else {
        lonePairsGroupRef.current!.visible = false;
      }

      // Selected / Hover highlight effects
      const oMat = oxygenMesh.material as THREE.MeshStandardMaterial;
      if (selectedAtomId === 'O' || hoveredAtom === 'O') {
        oMat.emissive.setHex(0xdc2626);
        oMat.emissiveIntensity = 0.45;
      } else {
        oMat.emissive.setHex(0x991b1b);
        oMat.emissiveIntensity = 0.08;
      }

      const h1Mat = h1Mesh.material as THREE.MeshStandardMaterial;
      if (selectedAtomId === 'H1' || hoveredAtom === 'H1') {
        h1Mat.emissive.setHex(0x38bdf8);
        h1Mat.emissiveIntensity = 0.45;
      } else {
        h1Mat.emissive.setHex(0x94a3b8);
        h1Mat.emissiveIntensity = 0.05;
      }

      const h2Mat = h2Mesh.material as THREE.MeshStandardMaterial;
      if (selectedAtomId === 'H2' || hoveredAtom === 'H2') {
        h2Mat.emissive.setHex(0x38bdf8);
        h2Mat.emissiveIntensity = 0.45;
      } else {
        h2Mat.emissive.setHex(0x94a3b8);
        h2Mat.emissiveIntensity = 0.05;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    // Cleanup resources on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('click', handlePointerDown);
      renderer.domElement.removeEventListener('mousemove', handlePointerMove);

      // Dispose geometries & materials
      oxygenGeo.dispose();
      oxygenMat.dispose();
      hGeo.dispose();
      hMat1.dispose();
      hMat2.dispose();
      bond1Geo.dispose();
      bond2Geo.dispose();
      bondMat.dispose();
      arcGeo.dispose();
      arcMat.dispose();
      dipoleShaftGeo.dispose();
      dipoleConeGeo.dispose();
      crossBarGeo.dispose();
      dipoleMat.dispose();
      lpGeo.dispose();
      lpMat.dispose();
      controls.dispose();
      renderer.dispose();

      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Quick reset camera orientation view helper
  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current && moleculeGroupRef.current) {
      cameraRef.current.position.set(0, 0, 5.2);
      controlsRef.current.target.set(0, 0, 0);
      moleculeGroupRef.current.rotation.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  // Expose reset to parent if needed via data-attribute or imperative handle
  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-gradient-to-b from-[#060e1d] via-[#09152b] to-[#040914]">
      {/* 3D Canvas Mount Point */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating 3D Tip Badge */}
      {parameters.showLabels && (
        <div className="absolute bottom-16 left-4 z-10 pointer-events-none">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-[11px] font-semibold text-slate-300 shadow-lg flex items-center gap-1.5">
            <span className="text-teal-400">💡</span> Bấm vào nguyên tử để xem thông số chi tiết
          </span>
        </div>
      )}

      {/* Floating Camera Preset Buttons */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
        <button
          onClick={() => {
            if (cameraRef.current && controlsRef.current && moleculeGroupRef.current) {
              cameraRef.current.position.set(0, 0, 5.5);
              moleculeGroupRef.current.rotation.set(0, 0, 0);
              controlsRef.current.target.set(0, 0, 0);
              controlsRef.current.update();
            }
          }}
          className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
          title="Nhìn trực diện mặt phẳng phân tử"
        >
          Trực diện (XY)
        </button>
        <button
          onClick={() => {
            if (cameraRef.current && controlsRef.current && moleculeGroupRef.current) {
              cameraRef.current.position.set(0, 6, 0.01);
              moleculeGroupRef.current.rotation.set(0, 0, 0);
              controlsRef.current.target.set(0, 0, 0);
              controlsRef.current.update();
            }
          }}
          className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
          title="Nhìn từ trên xuống đỉnh Oxy"
        >
          Từ trên (XZ)
        </button>
        <button
          onClick={() => {
            if (cameraRef.current && controlsRef.current && moleculeGroupRef.current) {
              cameraRef.current.position.set(3.5, 3.5, 4.5);
              moleculeGroupRef.current.rotation.set(0, 0, 0);
              controlsRef.current.target.set(0, 0, 0);
              controlsRef.current.update();
            }
          }}
          className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
          title="Góc nhìn phối cảnh 3D"
        >
          Phối cảnh 3D
        </button>
      </div>

      {/* Angle Callout Badge in 3D Scene */}
      {parameters.showAngleArc && parameters.displayMode === 'ball-and-stick' && (
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <div className="px-3 py-1.5 rounded-xl bg-teal-950/80 border border-teal-500/50 text-teal-300 text-xs font-mono font-bold backdrop-blur-md shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>Góc liên kết ∠H-O-H = {parameters.bondAngleDeg.toFixed(1)}°</span>
          </div>
        </div>
      )}

      {/* Dipole Moment Badge */}
      {parameters.showDipole && (
        <div className="absolute top-14 left-4 z-10 pointer-events-none">
          <div className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold backdrop-blur-md shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Lưỡng cực μ = 1.85 Debye (Có cực)</span>
          </div>
        </div>
      )}
    </div>
  );
};
