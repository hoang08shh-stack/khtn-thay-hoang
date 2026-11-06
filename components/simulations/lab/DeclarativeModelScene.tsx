import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { SimulationManifest, SimulationAnnotation } from '../../../types/simulationManifest.ts';

interface DeclarativeModelSceneProps {
  manifest: SimulationManifest;
  autoRotate: boolean;
  autoRotateSpeed: number;
  wireframe: boolean;
  explodeFactor: number;
  enableClipping: boolean;
  clippingAxis: 'x' | 'y' | 'z';
  lightingPreset: 'studio' | 'lab' | 'warm' | 'dark';
  activeAnnotationId: string | null;
  onSelectAnnotation: (annotation: SimulationAnnotation | null) => void;
}

/**
 * Procedural 3D models for fallback / instant offline rendering
 */
function ProceduralDnaModel({
  wireframe,
  explode,
}: {
  wireframe: boolean;
  explode: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Generate DNA double helix curves and rungs
  const { rungs, strand1Points, strand2Points } = useMemo(() => {
    const points1: THREE.Vector3[] = [];
    const points2: THREE.Vector3[] = [];
    const rungsList: {
      pos1: THREE.Vector3;
      pos2: THREE.Vector3;
      color: string;
      label: string;
    }[] = [];

    const turns = 2.5;
    const length = 4.0;
    const radius = 0.8;
    const steps = 60;

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * (turns * Math.PI * 2);
      const y = (i / steps) * length - length / 2;
      const x1 = Math.cos(t) * radius;
      const z1 = Math.sin(t) * radius;
      const x2 = Math.cos(t + Math.PI) * radius;
      const z2 = Math.sin(t + Math.PI) * radius;

      points1.push(new THREE.Vector3(x1, y, z1));
      points2.push(new THREE.Vector3(x2, y, z2));

      if (i % 3 === 0 && i < steps) {
        const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B'];
        const basePairs = ['A - T', 'T - A', 'G - X', 'X - G'];
        const pairIdx = (i / 3) % 4;
        rungsList.push({
          pos1: new THREE.Vector3(x1, y, z1),
          pos2: new THREE.Vector3(x2, y, z2),
          color: colors[pairIdx],
          label: basePairs[pairIdx],
        });
      }
    }
    return { rungs: rungsList, strand1Points: points1, strand2Points: points2 };
  }, []);

  const curve1 = useMemo(() => new THREE.CatmullRomCurve3(strand1Points), [strand1Points]);
  const curve2 = useMemo(() => new THREE.CatmullRomCurve3(strand2Points), [strand2Points]);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Strand 1 (Sugar-phosphate backbone) */}
      <mesh position={[-explode * 0.3, 0, 0]}>
        <tubeGeometry args={[curve1, 64, 0.08, 12, false]} />
        <meshStandardMaterial
          color="#0D9488"
          roughness={0.3}
          metalness={0.2}
          wireframe={wireframe}
        />
      </mesh>

      {/* Strand 2 (Sugar-phosphate backbone) */}
      <mesh position={[explode * 0.3, 0, 0]}>
        <tubeGeometry args={[curve2, 64, 0.08, 12, false]} />
        <meshStandardMaterial
          color="#0284C7"
          roughness={0.3}
          metalness={0.2}
          wireframe={wireframe}
        />
      </mesh>

      {/* Base-pair rungs */}
      {rungs.map((r, idx) => {
        const mid = new THREE.Vector3().addVectors(r.pos1, r.pos2).multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(r.pos2, r.pos1);
        const len = dir.length();
        const orientation = new THREE.Matrix4();
        orientation.lookAt(r.pos1, r.pos2, new THREE.Vector3(0, 1, 0));

        return (
          <group key={idx} position={mid}>
            {/* Half 1 */}
            <mesh
              position={[0, 0, -len * 0.25 - explode * 0.2]}
              rotation={[Math.PI / 2, 0, Math.atan2(dir.x, dir.z)]}
            >
              <cylinderGeometry args={[0.04, 0.04, len * 0.5, 8]} />
              <meshStandardMaterial color={r.color} roughness={0.3} wireframe={wireframe} />
            </mesh>
            {/* Half 2 */}
            <mesh
              position={[0, 0, len * 0.25 + explode * 0.2]}
              rotation={[Math.PI / 2, 0, Math.atan2(dir.x, dir.z)]}
            >
              <cylinderGeometry args={[0.04, 0.04, len * 0.5, 8]} />
              <meshStandardMaterial color="#E2E8F0" roughness={0.3} wireframe={wireframe} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function ProceduralPlantCellModel({
  wireframe,
  explode,
}: {
  wireframe: boolean;
  explode: number;
}) {
  return (
    <group position={[0, 0, 0]}>
      {/* Outer Hexagonal Cell Wall */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.6 + explode * 0.3, 1.6 + explode * 0.3, 1.4, 6, 1, true]} />
        <meshStandardMaterial
          color="#10B981"
          roughness={0.4}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          wireframe={wireframe}
        />
      </mesh>

      {/* Plasma membrane */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 1.3, 6, 1, true]} />
        <meshStandardMaterial
          color="#34D399"
          roughness={0.5}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          wireframe={wireframe}
        />
      </mesh>

      {/* Large central vacuole */}
      <mesh position={[-0.2, 0, 0.2]}>
        <sphereGeometry args={[0.7, 24, 24]} />
        <meshStandardMaterial
          color="#38BDF8"
          roughness={0.1}
          transparent
          opacity={0.55}
          wireframe={wireframe}
        />
      </mesh>

      {/* Nucleus */}
      <group position={[0.7 + explode * 0.4, 0.2, -0.4]}>
        <mesh>
          <sphereGeometry args={[0.42, 24, 24]} />
          <meshStandardMaterial color="#6366F1" roughness={0.3} wireframe={wireframe} />
        </mesh>
        <mesh position={[0.1, 0, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#4338CA" roughness={0.2} />
        </mesh>
      </group>

      {/* Chloroplasts (Green Oval Discs) */}
      {[
        [-0.9, 0.3, -0.6],
        [0.8, -0.3, 0.6],
        [-0.7, -0.3, 0.7],
        [0.4, 0.4, -0.8],
        [-0.4, -0.4, -0.7],
      ].map((pos, i) => (
        <mesh
          key={i}
          position={[
            pos[0] * (1 + explode * 0.4),
            pos[1] * (1 + explode * 0.4),
            pos[2] * (1 + explode * 0.4),
          ]}
          rotation={[0.4, i * 1.2, 0.3]}
        >
          <sphereGeometry args={[0.22, 16, 12]} />
          <meshStandardMaterial color="#047857" roughness={0.3} wireframe={wireframe} />
        </mesh>
      ))}

      {/* Mitochondria */}
      {[
        [0.9, 0.1, 0.2],
        [-0.8, 0.2, 0.1],
      ].map((pos, i) => (
        <mesh
          key={i}
          position={[pos[0] * (1 + explode * 0.3), pos[1], pos[2]]}
          rotation={[0.2, i * 2, 0.5]}
        >
          <capsuleGeometry args={[0.1, 0.25, 8, 12]} />
          <meshStandardMaterial color="#F97316" roughness={0.4} wireframe={wireframe} />
        </mesh>
      ))}
    </group>
  );
}

function ProceduralElectricMotorModel({
  wireframe,
  explode,
}: {
  wireframe: boolean;
  explode: number;
}) {
  const coilRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (coilRef.current) {
      coilRef.current.rotation.y += delta * 2.0;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* North Pole Magnet (Red) */}
      <mesh position={[-1.3 - explode * 0.5, 0, 0]}>
        <boxGeometry args={[0.5, 1.2, 1.2]} />
        <meshStandardMaterial color="#DC2626" roughness={0.3} metalness={0.4} wireframe={wireframe} />
      </mesh>

      {/* South Pole Magnet (Blue) */}
      <mesh position={[1.3 + explode * 0.5, 0, 0]}>
        <boxGeometry args={[0.5, 1.2, 1.2]} />
        <meshStandardMaterial color="#2563EB" roughness={0.3} metalness={0.4} wireframe={wireframe} />
      </mesh>

      {/* Central Rotating Armature & Coil */}
      <group ref={coilRef}>
        {/* Axle */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 2.4, 16]} />
          <meshStandardMaterial color="#94A3B8" roughness={0.2} metalness={0.8} />
        </mesh>

        {/* Copper wire rectangle */}
        <mesh>
          <boxGeometry args={[1.2, 0.7, 0.08]} />
          <meshStandardMaterial
            color="#D97706"
            roughness={0.2}
            metalness={0.8}
            wireframe={wireframe}
          />
        </mesh>

        {/* Commutator rings */}
        <mesh position={[0, 0, 0.8 + explode * 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.25, 16]} />
          <meshStandardMaterial color="#CA8A04" roughness={0.3} metalness={0.9} />
        </mesh>
      </group>

      {/* Base stand */}
      <mesh position={[0, -0.8 - explode * 0.2, 0]}>
        <boxGeometry args={[3.2, 0.15, 2.0]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
    </group>
  );
}

function ProceduralEarthLayersModel({
  wireframe,
  explode,
  enableClipping,
}: {
  wireframe: boolean;
  explode: number;
  enableClipping: boolean;
}) {
  return (
    <group position={[0, 0, 0]}>
      {/* Inner Core (Solid Iron/Nickel) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial
          color="#FACC15"
          emissive="#CA8A04"
          emissiveIntensity={0.2}
          roughness={0.2}
          wireframe={wireframe}
        />
      </mesh>

      {/* Outer Core (Liquid Iron) */}
      <mesh position={[explode * 0.2, 0, 0]}>
        <sphereGeometry args={[0.85, 32, 32, 0, Math.PI * (enableClipping ? 1.5 : 2)]} />
        <meshStandardMaterial
          color="#EA580C"
          roughness={0.3}
          metalness={0.3}
          side={THREE.DoubleSide}
          wireframe={wireframe}
        />
      </mesh>

      {/* Mantle (Silicate rock) */}
      <mesh position={[explode * 0.4, 0, 0]}>
        <sphereGeometry args={[1.4, 32, 32, 0, Math.PI * (enableClipping ? 1.5 : 2)]} />
        <meshStandardMaterial
          color="#C2410C"
          roughness={0.5}
          side={THREE.DoubleSide}
          wireframe={wireframe}
        />
      </mesh>

      {/* Earth Crust & Oceans */}
      <mesh position={[explode * 0.6, 0, 0]}>
        <sphereGeometry args={[1.48, 48, 48, 0, Math.PI * (enableClipping ? 1.5 : 2)]} />
        <meshStandardMaterial
          color="#0284C7"
          roughness={0.4}
          side={THREE.DoubleSide}
          wireframe={wireframe}
        />
      </mesh>
    </group>
  );
}

export const DeclarativeModelScene: React.FC<DeclarativeModelSceneProps> = ({
  manifest,
  autoRotate,
  autoRotateSpeed,
  wireframe,
  explodeFactor,
  enableClipping,
  clippingAxis,
  lightingPreset,
  activeAnnotationId,
  onSelectAnnotation,
}) => {
  const { gl } = useThree();

  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);

  // Choose appropriate 3D model geometry based on manifest id
  const renderModelGeometry = () => {
    switch (manifest.id) {
      case 'sim-dna-double-helix':
        return <ProceduralDnaModel wireframe={wireframe} explode={explodeFactor} />;
      case 'sim-plant-cell':
        return <ProceduralPlantCellModel wireframe={wireframe} explode={explodeFactor} />;
      case 'sim-electric-motor':
        return <ProceduralElectricMotorModel wireframe={wireframe} explode={explodeFactor} />;
      case 'sim-earth-layers':
        return (
          <ProceduralEarthLayersModel
            wireframe={wireframe}
            explode={explodeFactor}
            enableClipping={enableClipping}
          />
        );
      default:
        // Default universal procedural model if custom GLB isn't loaded
        return <ProceduralDnaModel wireframe={wireframe} explode={explodeFactor} />;
    }
  };

  // Lighting configuration based on preset
  const lighting = useMemo(() => {
    switch (lightingPreset) {
      case 'lab':
        return {
          ambient: '#F0FDFA',
          ambientInt: 1.3,
          dirColor: '#CCFBF1',
          dirInt: 1.8,
          dirPos: [5, 8, 5] as [number, number, number],
        };
      case 'warm':
        return {
          ambient: '#FEF3C7',
          ambientInt: 1.1,
          dirColor: '#FDE68A',
          dirInt: 1.6,
          dirPos: [4, 6, 4] as [number, number, number],
        };
      case 'dark':
        return {
          ambient: '#1E293B',
          ambientInt: 0.6,
          dirColor: '#38BDF8',
          dirInt: 1.2,
          dirPos: [3, 5, 3] as [number, number, number],
        };
      case 'studio':
      default:
        return {
          ambient: '#FFFFFF',
          ambientInt: 1.1,
          dirColor: '#F8FAFC',
          dirInt: 1.5,
          dirPos: [6, 10, 6] as [number, number, number],
        };
    }
  }, [lightingPreset]);

  return (
    <>
      <color attach="background" args={['#030712']} />

      {/* Orbit Controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
        minDistance={manifest.controlsConfig.minZoomDistance}
        maxDistance={manifest.controlsConfig.maxZoomDistance}
      />

      {/* Lighting */}
      <ambientLight color={lighting.ambient} intensity={lighting.ambientInt} />
      <directionalLight
        color={lighting.dirColor}
        intensity={lighting.dirInt}
        position={lighting.dirPos}
      />
      <directionalLight
        color="#94A3B8"
        intensity={0.6}
        position={[-lighting.dirPos[0], -lighting.dirPos[1], -lighting.dirPos[2]]}
      />

      {/* Subdued Lab Grid Platform */}
      <gridHelper
        args={[10, 20, '#0D9488', '#1E293B']}
        position={[0, -1.8, 0]}
      />

      {/* 3D Model Geometry */}
      <group position={[0, 0, 0]}>
        {renderModelGeometry()}

        {/* 3D Hotspot Pins (Annotations) */}
        {manifest.annotations.map((pin, idx) => {
          const isSelected = pin.id === activeAnnotationId;
          return (
            <group key={pin.id} position={pin.position}>
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAnnotation(isSelected ? null : pin);
                }}
              >
                <sphereGeometry args={[0.09, 16, 16]} />
                <meshStandardMaterial
                  color={isSelected ? '#F59E0B' : pin.color || '#0D9488'}
                  emissive={isSelected ? '#F59E0B' : pin.color || '#0D9488'}
                  emissiveIntensity={isSelected ? 0.9 : 0.4}
                />
              </mesh>

              {/* Pulsing ring around pin */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.12, 0.16, 24]} />
                <meshBasicMaterial
                  color={isSelected ? '#FBBF24' : '#14B8A6'}
                  transparent
                  opacity={isSelected ? 0.9 : 0.6}
                  side={THREE.DoubleSide}
                />
              </mesh>

              {/* Billboard HTML Pin Label */}
              <Html distanceFactor={8} position={[0, 0.18, 0]} center>
                <button
                  type="button"
                  onClick={() => onSelectAnnotation(isSelected ? null : pin)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap shadow-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-white scale-110'
                      : 'bg-slate-900/90 text-teal-300 border-teal-500/60 hover:bg-teal-900 hover:scale-105'
                  }`}
                >
                  #{idx + 1} {pin.title}
                </button>
              </Html>
            </group>
          );
        })}
      </group>
    </>
  );
};
