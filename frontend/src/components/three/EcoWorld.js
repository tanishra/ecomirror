'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, PerformanceMonitor } from '@react-three/drei';
import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Color, MathUtils, FogExp2, Object3D, Vector3, DoubleSide, SRGBColorSpace, ACESFilmicToneMapping, CatmullRomCurve3 } from 'three';
import gsap from 'gsap';

// Helper to convert hex to RGB values for GSAP to animate directly
function hexToRgb(hex) {
  const color = new Color(hex);
  return { r: color.r, g: color.g, b: color.b };
}

// 1. Evergreen Pine Tree Component with dynamic wind sway
function PineTree({ position, height, score, leafColor }) {
  const leavesRef = useRef();
  const trunkHeight = height;
  const trunkRadius = height * 0.1;
  const canopySize = height * 0.65;

  useFrame((state) => {
    if (!leavesRef.current) return;
    const t = state.clock.getElapsedTime();
    
    // Scale logic based on footprint score
    let leafScale = 1.0;
    if (score > 33 && score <= 66) {
      leafScale = 1.0 - ((score - 33) / 33) * 0.4;
    } else if (score > 66) {
      leafScale = Math.max(0.0, 0.6 - ((score - 66) / 34) * 0.6);
    }
    leavesRef.current.scale.set(leafScale, leafScale, leafScale);

    // Wind sway logic (leaves sway slightly differently depending on coordinate)
    if (score <= 66) {
      const windSpeed = score > 33 ? 2.5 : 1.2;
      const windAmount = score > 33 ? 0.05 : 0.02;
      leavesRef.current.rotation.z = Math.sin(t * windSpeed + position[0]) * windAmount;
      leavesRef.current.rotation.x = Math.cos(t * windSpeed * 0.8 + position[2]) * windAmount;
    } else {
      leavesRef.current.rotation.set(0, 0, 0);
    }
    
    if (leafColor) leavesRef.current.material.color.copy(leafColor);
  });

  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, trunkHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[trunkRadius * 0.7, trunkRadius, trunkHeight, 8]} />
        <meshStandardMaterial color="#5c4033" roughness={0.9} />
      </mesh>
      
      {/* Cone Canopy */}
      <mesh ref={leavesRef} position={[0, trunkHeight + canopySize * 0.35, 0]} castShadow>
        <coneGeometry args={[canopySize, canopySize * 1.6, 5]} />
        <meshStandardMaterial roughness={0.8} />
      </mesh>
    </group>
  );
}

// 2. Deciduous Broadleaf Tree Component with dynamic wind sway
function BroadleafTree({ position, height, score, leafColor }) {
  const leavesRef = useRef();
  const trunkHeight = height;
  const trunkRadius = height * 0.12;
  const canopySize = height * 0.55;

  useFrame((state) => {
    if (!leavesRef.current) return;
    const t = state.clock.getElapsedTime();
    
    // Scale logic
    let leafScale = 1.0;
    if (score > 33 && score <= 66) {
      leafScale = 1.0 - ((score - 33) / 33) * 0.5;
    } else if (score > 66) {
      leafScale = Math.max(0.0, 0.5 - ((score - 66) / 34) * 0.5);
    }
    leavesRef.current.scale.set(leafScale, leafScale, leafScale);

    // Wind sway logic
    if (score <= 66) {
      const windSpeed = score > 33 ? 2.2 : 1.0;
      const windAmount = score > 33 ? 0.06 : 0.025;
      leavesRef.current.rotation.z = Math.sin(t * windSpeed + position[0]) * windAmount;
      leavesRef.current.rotation.x = Math.cos(t * windSpeed * 0.9 + position[2]) * windAmount;
    } else {
      leavesRef.current.rotation.set(0, 0, 0);
    }
    
    if (leafColor && leavesRef.current) {
      leavesRef.current.children.forEach(child => {
        if (child.material) child.material.color.copy(leafColor);
      });
    }
  });

  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, trunkHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[trunkRadius * 0.8, trunkRadius, trunkHeight, 8]} />
        <meshStandardMaterial color="#5c4033" roughness={0.9} />
      </mesh>
      
      {/* Spherical Canopy (Clustered look) */}
      <group ref={leavesRef} position={[0, trunkHeight + canopySize * 0.5, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[canopySize, 8, 8]} />
          <meshStandardMaterial roughness={0.85} />
        </mesh>
        <mesh position={[canopySize * 0.4, canopySize * 0.2, 0]} castShadow>
          <sphereGeometry args={[canopySize * 0.65, 8, 8]} />
          <meshStandardMaterial roughness={0.85} />
        </mesh>
        <mesh position={[-canopySize * 0.4, canopySize * 0.15, canopySize * 0.2]} castShadow>
          <sphereGeometry args={[canopySize * 0.6, 8, 8]} />
          <meshStandardMaterial roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

// 3. Dead Stumps / Fallen Logs (Only visible under high carbon scores)
function DeadStump({ position, scale }) {
  return (
    <group position={position} rotation={[0, Math.random() * Math.PI, 0]}>
      {/* Stump */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.25 * scale, 0.3 * scale, 0.5, 8]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>
      {/* Fallen Log */}
      <mesh position={[0.4, 0.1, 0.1]} rotation={[0.2, 0.5, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.12 * scale, 0.12 * scale, 1.2, 8]} />
        <meshStandardMaterial color="#2d1b10" roughness={0.9} />
      </mesh>
    </group>
  );
}

// 4. GPU/Buffer particle smoke emissions
function Smoke({ position, score }) {
  const pointsRef = useRef();
  const particleCount = 100;
  
  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < particleCount; i++) {
      data.push({
        x: (Math.random() - 0.5) * 0.4,
        y: Math.random() * 8, // start scattered
        z: (Math.random() - 0.5) * 0.4,
        speed: 1.5 + Math.random() * 2.0,
        life: Math.random()
      });
    }
    return data;
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    let smokeIntensity = 0;
    if (score > 33 && score <= 66) {
      smokeIntensity = (score - 33) / 33;
    } else if (score > 66) {
      smokeIntensity = 1.0;
    }

    const posAttr = pointsRef.current.geometry.attributes.position;
    
    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];
      
      if (smokeIntensity === 0) {
        posAttr.setXYZ(i, 0, -999, 0);
        continue;
      }

      p.y += p.speed * delta;
      p.life += delta * 0.35;
      
      if (p.y > 8 || p.life > 1) {
        p.x = (Math.random() - 0.5) * 0.2;
        p.y = 0;
        p.z = (Math.random() - 0.5) * 0.2;
        p.life = 0;
        p.speed = 1.2 + Math.random() * 1.8;
      }
      
      const windDrift = Math.sin(state.clock.getElapsedTime() + i) * 0.15 + 0.6;
      const curX = p.x + (p.y * 0.2) * windDrift;
      const curZ = p.z + Math.cos(state.clock.getElapsedTime() + i) * 0.08;
      
      posAttr.setXYZ(i, curX + position[0], p.y + position[1], curZ + position[2]);
    }
    
    posAttr.needsUpdate = true;
  });

  const color = score > 66 ? "#1e293b" : "#94a3b8";
  const size = score > 66 ? 0.75 : 0.45;
  const opacity = score > 66 ? 0.75 : 0.4;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(particleCount * 3), 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// 5. Industrial Factory Component
function Factory({ position, score }) {
  const baseColor = score > 66 ? '#6b7280' : score > 33 ? '#9ca3af' : '#b1bdc5';
  const rustAccent = score > 33 ? '#b45309' : '#d97706';
  
  return (
    <group position={position}>
      {/* Main factory building */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.5, 1.6, 3]} />
        <meshStandardMaterial color={baseColor} roughness={0.7} metalness={0.2} />
      </mesh>
      
      {/* Sawtooth roof sections */}
      <mesh position={[-1.1, 1.85, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
        <boxGeometry args={[1.6, 0.4, 3]} />
        <meshStandardMaterial color={baseColor} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[1.1, 1.85, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
        <boxGeometry args={[1.6, 0.4, 3]} />
        <meshStandardMaterial color={baseColor} roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Cooling towers — wider at top and bottom */}
      <mesh position={[-1.3, 2.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.45, 2.0, 12]} />
        <meshStandardMaterial color={score > 33 ? rustAccent : '#94a3b8'} roughness={0.8} metalness={0.3} />
      </mesh>
      <mesh position={[1.3, 2.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.45, 2.0, 12]} />
        <meshStandardMaterial color={score > 33 ? rustAccent : '#94a3b8'} roughness={0.8} metalness={0.3} />
      </mesh>
      
      {/* Cooling tower rims */}
      <mesh position={[-1.3, 3.42, 0]} castShadow>
        <torusGeometry args={[0.38, 0.05, 6, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>
      <mesh position={[1.3, 3.42, 0]} castShadow>
        <torusGeometry args={[0.38, 0.05, 6, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>

      {/* Warning status light */}
      <mesh position={[0, 1.75, 0.01]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color={score > 66 ? '#ef4444' : score > 33 ? '#f59e0b' : '#10b981'} />
      </mesh>
      
      {/* Storage tanks */}
      <mesh position={[2.8, 0.5, 1.5]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.7, 1.0, 12]} />
        <meshStandardMaterial color={baseColor} roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[2.8, 1.05, 1.5]} castShadow>
        <coneGeometry args={[0.75, 0.3, 12]} />
        <meshStandardMaterial color={baseColor} roughness={0.7} />
      </mesh>
      
      <mesh position={[-2.8, 0.5, 1.5]} castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.6, 1.0, 12]} />
        <meshStandardMaterial color={baseColor} roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[-2.8, 1.05, 1.5]} castShadow>
        <coneGeometry args={[0.65, 0.3, 12]} />
        <meshStandardMaterial color={baseColor} roughness={0.7} />
      </mesh>
      
      {/* Connecting pipe */}
      <mesh position={[1.5, 0.8, 1.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 2.5, 8]} />
        <meshStandardMaterial color="#6b7280" roughness={0.6} metalness={0.4} />
      </mesh>
      
      {/* Smoke emissions from top of both cooling towers */}
      <Smoke position={[position[0] - 1.3, position[1] + 3.4, position[2]]} score={score} />
      <Smoke position={[position[0] + 1.3, position[1] + 3.4, position[2]]} score={score} />
    </group>
  );
}

// 6. Procedural Clouds
function Cloud({ position, speed, cloudColor }) {
  const meshRef = useRef();
  
  const cloudSpheres = useMemo(() => {
    return [
      { pos: [0, 0, 0], scale: 1.0 },
      { pos: [0.9, -0.1, 0.1], scale: 0.7 },
      { pos: [-0.9, -0.15, -0.1], scale: 0.75 },
    ];
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.position.x += speed * delta;
    if (meshRef.current.position.x > 35) {
      meshRef.current.position.x = -35;
    }
    if (cloudColor) {
      meshRef.current.children.forEach(child => {
        if (child.material) child.material.color.copy(cloudColor);
      });
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {cloudSpheres.map((sphere, index) => (
        <mesh key={index} position={sphere.pos} castShadow>
          <sphereGeometry args={[1.3 * sphere.scale, 8, 8]} />
          <meshStandardMaterial roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// 7. City Skyline (Modern detailed buildings with windows)
function City({ score }) {
  const cityRef = useRef();

  const buildings = useMemo(() => {
    const list = [];
    const count = 30;
    const palette = [
      '#7dd3fc', '#f1f5f9', '#fef3c7', '#cbd5e1', '#e7e5e4', '#bae6fd',
    ];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 0.5 - Math.PI * 0.25;
      const radius = 28 + Math.random() * 5;
      const x = Math.sin(angle) * radius;
      const z = -Math.cos(angle) * radius;
      
      const width = 1.8 + Math.random() * 2.2;
      const height = 5 + Math.random() * 12;
      const depth = 1.8 + Math.random() * 2.2;
      
      const hasAntenna = Math.random() > 0.4;
      const antennaHeight = hasAntenna ? 1.0 + Math.random() * 1.5 : 0;
      const baseColor = palette[Math.floor(Math.random() * palette.length)];
      const hasRoofDetail = Math.random() > 0.5;
      const windowRows = Math.min(5, Math.max(2, Math.floor(height / 3)));
      const windowCols = 2;
      
      list.push({ x, y: height / 2 - 2, z, width, height, depth, hasAntenna, antennaHeight, baseColor, hasRoofDetail, windowRows, windowCols });
    }
    return list;
  }, []);

  useEffect(() => {
    if (!cityRef.current) return;
    const opacity = score > 66 ? Math.max(0.15, 1.0 - ((score - 66) / 34) * 0.7) : 1.0;
    cityRef.current.children.forEach(group => {
      group.children.forEach(mesh => {
        if (mesh.material) {
          mesh.material.opacity = opacity;
          mesh.material.transparent = true;
        }
      });
    });
  }, [score]);

  const windowEmissive = score > 66 ? '#1a1a2e' : score > 33 ? '#f59e0b' : '#fbbf24';
  const windowEmissiveIntensity = score > 66 ? 0.0 : score > 33 ? 0.12 : 0.22;

  return (
    <group ref={cityRef}>
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, b.y, b.z]}>
          {/* Main building */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[b.width, b.height, b.depth]} />
            <meshStandardMaterial 
              roughness={0.6} 
              metalness={0.1}
              color={b.baseColor} 
            />
          </mesh>
          
          {/* Window grid on front face */}
          {Array.from({ length: b.windowRows }).flatMap((_, row) => 
            Array.from({ length: b.windowCols }).map((_, col) => (
              <mesh 
                key={`w-${row}-${col}`} 
                position={[
                  -b.width/2 + (col + 0.5) * (b.width / b.windowCols),
                  -b.height/2 + (row + 0.5) * (b.height / b.windowRows),
                  b.depth/2 + 0.01
                ]}
              >
                <planeGeometry args={[
                  (b.width / b.windowCols) * 0.6,
                  (b.height / b.windowRows) * 0.5
                ]} />
                <meshStandardMaterial 
                  color="#1e3a5f"
                  emissive={windowEmissive}
                  emissiveIntensity={windowEmissiveIntensity}
                  roughness={0.2}
                  metalness={0.3}
                />
              </mesh>
            ))
          )}
          
          {/* Rooftop details */}
          {b.hasRoofDetail && (
            <>
              <mesh position={[b.width * 0.2, b.height / 2 + 0.2, 0]} castShadow>
                <boxGeometry args={[0.5, 0.4, 0.5]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.7} />
              </mesh>
              <mesh position={[-b.width * 0.25, b.height / 2 + 0.35, 0]} castShadow>
                <cylinderGeometry args={[0.3, 0.3, 0.7, 8]} />
                <meshStandardMaterial color="#64748b" roughness={0.8} />
              </mesh>
            </>
          )}
          
          {b.hasAntenna && (
            <mesh position={[0, b.height / 2 + b.antennaHeight / 2, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.08, b.antennaHeight, 4]} />
              <meshStandardMaterial color="#475569" roughness={0.9} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

// 8. Flat Ground Terrain with gentle vertex micro-variation
const FlatGround = React.memo(function FlatGround({ groundColor }) {
  const geomRef = useRef();
  const meshRef = useRef();

  useEffect(() => {
    if (!geomRef.current) return;
    const pos = geomRef.current.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Very subtle micro-bumps only — keeps it essentially flat but not perfectly CG-smooth
      const z = Math.sin(x * 0.6) * Math.cos(y * 0.6) * 0.06;
      pos.setZ(i, z);
    }
    geomRef.current.computeVertexNormals();
    pos.needsUpdate = true;
  }, []);

  useFrame(() => {
    if (meshRef.current && groundColor) {
      meshRef.current.material.color.copy(groundColor);
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow userData={{ isGround: true }}>
      <planeGeometry ref={geomRef} args={[120, 120, 40, 40]} />
      <meshStandardMaterial roughness={0.9} color="#10b981" />
    </mesh>
  );
});

// 8b. Gravel path from village to lake
const GravelPath = React.memo(function GravelPath() {
  const points = useMemo(() => [
    new Vector3(8, -1.95, 4),
    new Vector3(5, -1.95, 3),
    new Vector3(3, -1.95, 1.5),
    new Vector3(0, -1.95, 0),
  ], []);

  const curve = useMemo(() => new CatmullRomCurve3(points), [points]);

  return (
    <mesh receiveShadow>
      <tubeGeometry args={[curve, 20, 0.35, 6, false]} />
      <meshStandardMaterial color="#c9b99a" roughness={0.95} />
    </mesh>
  );
});

// 9. Physically-Based Reflective Water Lake
const Lake = React.memo(function Lake({ score }) {
  const meshRef = useRef();

  const lakeFrameCount = useRef(0);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    const pos = meshRef.current.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const zDisplace =
        Math.sin(x * 0.7 + t * 1.5) * Math.cos(y * 0.7 + t * 1.2) * 0.035 +
        Math.sin(x * 1.4 + t * 2.0) * 0.015;
      pos.setZ(i, zDisplace);
    }
    lakeFrameCount.current++;
    if (lakeFrameCount.current % 3 === 0) {
      meshRef.current.geometry.computeVertexNormals();
    }
    pos.needsUpdate = true;
  });

  const waterColor = score > 66 ? '#b45309' : score > 33 ? '#92400e' : '#0284c7';
  const roughness = score > 66 ? 0.6 : 0.05;
  const metalness = score > 66 ? 0.1 : 0.0;
  const transmission = score > 66 ? 0 : 0.4;
  const clearcoat = score > 66 ? 0 : 1.0;

  return (
    <mesh ref={meshRef} position={[0, -1.82, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[4.5, 32, 0, Math.PI * 2]} />
      <meshPhysicalMaterial
        color={waterColor}
        roughness={roughness}
        metalness={metalness}
        transmission={transmission}
        clearcoat={clearcoat}
        clearcoatRoughness={0.1}
        reflectivity={0.8}
        envMapIntensity={score > 66 ? 0 : 1.2}
      />
    </mesh>
  );
});


// 10. Realistic Proportional Human with idle animation
function Human({ position, rotation, shirtColor, pantsColor, skinColor, activity }) {
  const torsoRef = useRef();
  const lArmRef = useRef();
  const rArmRef = useRef();
  const lLegRef = useRef();
  const rLegRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const breathe = Math.sin(t * 1.4) * 0.008;
    if (torsoRef.current) torsoRef.current.scale.y = 1 + breathe;
    if (activity === 'walking') {
      const swing = Math.sin(t * 2.8) * 0.28;
      if (lArmRef.current) lArmRef.current.rotation.x = swing;
      if (rArmRef.current) rArmRef.current.rotation.x = -swing;
      if (lLegRef.current) lLegRef.current.rotation.x = -swing * 0.9;
      if (rLegRef.current) rLegRef.current.rotation.x = swing * 0.9;
    } else if (activity === 'fishing') {
      if (rArmRef.current) rArmRef.current.rotation.x = -0.5 + Math.sin(t * 0.6) * 0.08;
      if (rArmRef.current) rArmRef.current.rotation.z = -0.3;
    } else {
      const idle = Math.sin(t * 0.9) * 0.05;
      if (lArmRef.current) lArmRef.current.rotation.x = idle;
      if (rArmRef.current) rArmRef.current.rotation.x = -idle;
    }
  });

  const skin = skinColor || '#f5cba7';
  const shirt = shirtColor || '#3b82f6';
  const pants = pantsColor || '#374151';

  return (
    <group position={position} rotation={[0, rotation || 0, 0]}>
      {/* Head */}
      <mesh position={[0, 1.72, 0]} castShadow>
        <sphereGeometry args={[0.145, 10, 10]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.83, 0]} castShadow>
        <sphereGeometry args={[0.148, 10, 6]} />
        <meshStandardMaterial color="#3d1f00" roughness={0.9} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.055, 0.12, 6]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      {/* Torso */}
      <mesh ref={torsoRef} position={[0, 1.22, 0]} castShadow>
        <boxGeometry args={[0.28, 0.42, 0.18]} />
        <meshStandardMaterial color={shirt} roughness={0.75} />
      </mesh>
      {/* Left Arm */}
      <group ref={lArmRef} position={[-0.2, 1.35, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.36, 6]} />
          <meshStandardMaterial color={shirt} roughness={0.75} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.38, 0]} castShadow>
          <sphereGeometry args={[0.048, 6, 6]} />
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>
      </group>
      {/* Right Arm */}
      <group ref={rArmRef} position={[0.2, 1.35, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.36, 6]} />
          <meshStandardMaterial color={shirt} roughness={0.75} />
        </mesh>
        <mesh position={[0, -0.38, 0]} castShadow>
          <sphereGeometry args={[0.048, 6, 6]} />
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>
      </group>
      {/* Left Leg */}
      <group ref={lLegRef} position={[-0.09, 0.88, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.055, 0.44, 6]} />
          <meshStandardMaterial color={pants} roughness={0.8} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.47, 0.04]} castShadow>
          <boxGeometry args={[0.1, 0.07, 0.2]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.85} />
        </mesh>
      </group>
      {/* Right Leg */}
      <group ref={rLegRef} position={[0.09, 0.88, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.055, 0.44, 6]} />
          <meshStandardMaterial color={pants} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.47, 0.04]} castShadow>
          <boxGeometry args={[0.1, 0.07, 0.2]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

// Fishing rod prop
function FishingRod({ position }) {
  return (
    <group position={position}>
      <mesh rotation={[0.3, 0, -0.5]} castShadow>
        <cylinderGeometry args={[0.015, 0.008, 1.2, 4]} />
        <meshStandardMaterial color="#5c3d11" roughness={0.9} />
      </mesh>
    </group>
  );
}

// People scene wrapper
function People({ score }) {
  const visibleCount = score > 66 ? 0 : score > 33 ? 2 : 5;

  return (
    <group>
      {visibleCount >= 1 && (
        <Human position={[-3.5, -2, 4.5]} rotation={1.2} shirtColor="#2563eb" pantsColor="#374151" skinColor="#f5cba7" activity="standing" />
      )}
      {visibleCount >= 2 && (
        <Human position={[2, -2, 5.5]} rotation={-0.5} shirtColor="#dc2626" pantsColor="#1e3a5f" skinColor="#d4956a" activity="walking" />
      )}
      {visibleCount >= 3 && (
        <group>
          <Human position={[-3.8, -2, 7]} rotation={0.2} shirtColor="#16a34a" pantsColor="#292524" skinColor="#c68642" activity="standing" />
          <Human position={[-3.2, -2, 7.2]} rotation={-0.4} shirtColor="#9333ea" pantsColor="#1c1917" skinColor="#f5cba7" activity="standing" />
        </group>
      )}
      {visibleCount >= 5 && (
        <group>
          {/* Person fishing near lake */}
          <Human position={[4.8, -2, 0.5]} rotation={Math.PI} shirtColor="#b45309" pantsColor="#374151" skinColor="#d4956a" activity="fishing" />
          <FishingRod position={[5.4, -1.0, 0.5]} />
        </group>
      )}
      {/* Crisis: danger sign */}
      {score > 66 && (
        <group position={[-2, -2, 6]} rotation={[0, 0.4, 0]}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 1.2, 6]} />
            <meshStandardMaterial color="#4e342e" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.15, 0]} castShadow>
            <boxGeometry args={[0.75, 0.38, 0.07]} />
            <meshStandardMaterial color="#ef4444" roughness={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// 10b. Realistic House
function House({ position, rotation, roofColor, wallColor, score }) {
  const wall = wallColor || '#e8d5b7';
  const roof = roofColor || '#8b4513';
  const windowEmissive = score > 66 ? '#ff6b00' : '#fffde7';
  const windowEmissiveIntensity = score > 66 ? 0.8 : 0.15;

  return (
    <group position={position} rotation={[0, rotation || 0, 0]}>
      {/* Foundation / Walls */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 1.4, 2.2]} />
        <meshStandardMaterial color={wall} roughness={0.8} />
      </mesh>
      {/* Roof — 4-sided pitched */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <coneGeometry args={[2.0, 1.0, 4]} />
        <meshStandardMaterial color={roof} roughness={0.85} />
      </mesh>
      {/* Chimney */}
      <mesh position={[0.7, 1.9, 0.4]} castShadow>
        <boxGeometry args={[0.25, 0.7, 0.25]} />
        <meshStandardMaterial color="#7c5c3a" roughness={0.9} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.4, 1.115]} castShadow>
        <boxGeometry args={[0.42, 0.82, 0.06]} />
        <meshStandardMaterial color="#5c3d11" roughness={0.85} />
      </mesh>
      {/* Door knob */}
      <mesh position={[0.17, 0.38, 1.18]}>
        <sphereGeometry args={[0.035, 6, 6]} />
        <meshStandardMaterial color="#d4af37" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Front windows x2 */}
      <mesh position={[-0.65, 0.75, 1.115]}>
        <boxGeometry args={[0.46, 0.44, 0.05]} />
        <meshStandardMaterial color="#a8d8f0" roughness={0.1} emissive={windowEmissive} emissiveIntensity={windowEmissiveIntensity} />
      </mesh>
      <mesh position={[0.65, 0.75, 1.115]}>
        <boxGeometry args={[0.46, 0.44, 0.05]} />
        <meshStandardMaterial color="#a8d8f0" roughness={0.1} emissive={windowEmissive} emissiveIntensity={windowEmissiveIntensity} />
      </mesh>
      {/* Side window */}
      <mesh position={[1.315, 0.75, 0]}>
        <boxGeometry args={[0.05, 0.44, 0.46]} />
        <meshStandardMaterial color="#a8d8f0" roughness={0.1} emissive={windowEmissive} emissiveIntensity={windowEmissiveIntensity} />
      </mesh>
    </group>
  );
}

// 10c. Village (cluster of houses with paths/fencing)
function Village({ score }) {
  return (
    <group>
      <House position={[8, -2, 5]} rotation={-0.3} roofColor="#8b4513" wallColor="#e8d5b7" score={score} />
      <House position={[11, -2, 3.5]} rotation={0.2} roofColor="#6b2f1a" wallColor="#ddd0b8" score={score} />
      <House position={[9, -2, 8]} rotation={-0.7} roofColor="#7a3520" wallColor="#f0e0c8" score={score} />
      {/* Low fence between houses */}
      {[0, 1, 2, 3, 4].map(i => (
        <mesh key={i} position={[7.2 + i * 0.7, -1.75, 6.8]} castShadow>
          <boxGeometry args={[0.65, 0.5, 0.08]} />
          <meshStandardMaterial color="#c4a07a" roughness={0.9} />
        </mesh>
      ))}
      {/* Fence posts */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <mesh key={i} position={[7.2 + i * 0.7, -1.6, 6.8]} castShadow>
          <boxGeometry args={[0.07, 0.82, 0.07]} />
          <meshStandardMaterial color="#a0785a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// 10d. Park bench near lake
function ParkBench({ position, rotation }) {
  return (
    <group position={position} rotation={[0, rotation || 0, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[1.0, 0.07, 0.4]} />
        <meshStandardMaterial color="#8b6914" roughness={0.85} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.7, -0.18]} castShadow>
        <boxGeometry args={[1.0, 0.32, 0.06]} />
        <meshStandardMaterial color="#8b6914" roughness={0.85} />
      </mesh>
      {/* Legs x4 */}
      {[[-0.42, -0.16], [0.42, -0.16], [-0.42, 0.16], [0.42, 0.16]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.2, z]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.45, 5]} />
          <meshStandardMaterial color="#5a4010" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// 10e. Animals — Dog, Rabbit, Deer, Butterflies
function Dog({ position, rotation }) {
  const tailRef = useRef();
  useFrame((state) => {
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 6) * 0.45;
    }
  });
  return (
    <group position={position} rotation={[0, rotation || 0, 0]}>
      {/* Body */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.52, 0.28, 0.25]} />
        <meshStandardMaterial color="#c8a87a" roughness={0.9} />
      </mesh>
      {/* Head */}
      <mesh position={[0.3, 0.38, 0]} castShadow>
        <boxGeometry args={[0.22, 0.2, 0.18]} />
        <meshStandardMaterial color="#c8a87a" roughness={0.9} />
      </mesh>
      {/* Snout */}
      <mesh position={[0.42, 0.33, 0]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.12]} />
        <meshStandardMaterial color="#b8926a" roughness={0.9} />
      </mesh>
      {/* Ears x2 */}
      <mesh position={[0.24, 0.5, 0.06]} castShadow>
        <boxGeometry args={[0.08, 0.12, 0.06]} />
        <meshStandardMaterial color="#b8804a" roughness={0.9} />
      </mesh>
      <mesh position={[0.24, 0.5, -0.06]} castShadow>
        <boxGeometry args={[0.08, 0.12, 0.06]} />
        <meshStandardMaterial color="#b8804a" roughness={0.9} />
      </mesh>
      {/* Tail */}
      <group ref={tailRef} position={[-0.26, 0.35, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.025, 0.04, 0.28, 5]} />
          <meshStandardMaterial color="#c8a87a" roughness={0.9} />
        </mesh>
      </group>
      {/* Legs x4 */}
      {[[-0.15, -0.12], [-0.15, 0.12], [0.15, -0.12], [0.15, 0.12]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.05, z]} castShadow>
          <cylinderGeometry args={[0.04, 0.035, 0.2, 5]} />
          <meshStandardMaterial color="#c8a87a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Rabbit({ position }) {
  const bodyRef = useRef();
  useFrame((state) => {
    if (bodyRef.current) {
      const t = state.clock.getElapsedTime();
      bodyRef.current.position.y = position[1] + 0.18 + Math.abs(Math.sin(t * 2.2)) * 0.12;
    }
  });
  return (
    <group>
      <group ref={bodyRef} position={[position[0], position[1] + 0.18, position[2]]}>
        {/* Body */}
        <mesh castShadow>
          <sphereGeometry args={[0.14, 8, 8]} />
          <meshStandardMaterial color="#f0ece4" roughness={0.9} />
        </mesh>
        {/* Head */}
        <mesh position={[0.12, 0.14, 0]} castShadow>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#f0ece4" roughness={0.9} />
        </mesh>
        {/* Ears */}
        <mesh position={[0.1, 0.28, 0.04]} castShadow>
          <coneGeometry args={[0.025, 0.18, 5]} />
          <meshStandardMaterial color="#e8c4c4" roughness={0.9} />
        </mesh>
        <mesh position={[0.1, 0.28, -0.04]} castShadow>
          <coneGeometry args={[0.025, 0.18, 5]} />
          <meshStandardMaterial color="#e8c4c4" roughness={0.9} />
        </mesh>
        {/* Tail */}
        <mesh position={[-0.15, 0.06, 0]} castShadow>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function Deer({ position, rotation }) {
  const headRef = useRef();
  useFrame((state) => {
    if (headRef.current) {
      headRef.current.rotation.x = -0.2 + Math.sin(state.clock.getElapsedTime() * 0.8) * 0.15;
    }
  });
  return (
    <group position={position} rotation={[0, rotation || 0, 0]}>
      {/* Body */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.75, 0.38, 0.34]} />
        <meshStandardMaterial color="#c8844a" roughness={0.85} />
      </mesh>
      {/* Neck */}
      <mesh position={[0.28, 0.88, 0]} rotation={[0, 0, 0.5]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 0.38, 6]} />
        <meshStandardMaterial color="#c8844a" roughness={0.85} />
      </mesh>
      {/* Head */}
      <group ref={headRef} position={[0.5, 1.05, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 0.2, 0.18]} />
          <meshStandardMaterial color="#c8844a" roughness={0.85} />
        </mesh>
        {/* Antlers */}
        {[-0.06, 0.06].map((z, i) => (
          <group key={i} position={[0.02, 0.15, z]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.018, 0.025, 0.3, 5]} />
              <meshStandardMaterial color="#7a5c2e" roughness={0.9} />
            </mesh>
            <mesh position={[0.08, 0.18, 0]} rotation={[0, 0, 0.6]} castShadow>
              <cylinderGeometry args={[0.012, 0.018, 0.2, 4]} />
              <meshStandardMaterial color="#7a5c2e" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>
      {/* Legs x4 */}
      {[[-0.22, -0.14], [-0.22, 0.14], [0.22, -0.14], [0.22, 0.14]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.2, z]} castShadow>
          <cylinderGeometry args={[0.045, 0.038, 0.42, 5]} />
          <meshStandardMaterial color="#b87040" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function Butterfly({ offset }) {
  const groupRef = useRef();
  const lWingRef = useRef();
  const rWingRef = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime() + offset;
    if (groupRef.current) {
      groupRef.current.position.x = Math.sin(t * 0.7) * 2 - 3;
      groupRef.current.position.y = -1.4 + Math.sin(t * 1.3) * 0.5;
      groupRef.current.position.z = Math.cos(t * 0.5) * 2 + 5;
      groupRef.current.rotation.y = t * 0.7;
    }
    if (lWingRef.current) lWingRef.current.rotation.y = Math.sin(t * 10) * 0.7;
    if (rWingRef.current) rWingRef.current.rotation.y = -Math.sin(t * 10) * 0.7;
  });
  const colors = ['#f43f5e', '#8b5cf6', '#f59e0b', '#3b82f6'];
  const color = colors[Math.floor(offset * 2) % colors.length];
  return (
    <group ref={groupRef}>
      <mesh ref={lWingRef} position={[-0.08, 0, 0]} castShadow>
        <coneGeometry args={[0.12, 0.08, 3]} />
        <meshStandardMaterial color={color} roughness={0.4} transparent opacity={0.85} side={DoubleSide} />
      </mesh>
      <mesh ref={rWingRef} position={[0.08, 0, 0]} castShadow>
        <coneGeometry args={[0.12, 0.08, 3]} />
        <meshStandardMaterial color={color} roughness={0.4} transparent opacity={0.85} side={DoubleSide} />
      </mesh>
    </group>
  );
}

function Animals({ score }) {
  if (score > 66) return null;
  return (
    <group>
      {/* Dog near person */}
      <Dog position={[-2.8, -2, 4.8]} rotation={1.5} />
      {/* Rabbits near garden */}
      {score <= 33 && <Rabbit position={[7.5, -2, 4.2]} />}
      {score <= 33 && <Rabbit position={[7.8, -2, 6.5]} />}
      {/* Deer near trees */}
      {score <= 33 && <Deer position={[-7, -2, -3]} rotation={0.8} />}
      {/* Butterflies near flowers */}
      {score <= 33 && (
        <>
          <Butterfly offset={0} />
          <Butterfly offset={1.5} />
          <Butterfly offset={3} />
        </>
      )}
    </group>
  );
}

// 10f. Garden with fence, flowers, veggie patches
function Garden({ score }) {
  const flowerColors = ['#f43f5e', '#f97316', '#facc15', '#a855f7', '#ec4899'];
  const flowerPositions = useMemo(() => {
    const rows = [0, 1, 2];
    const cols = [0, 1, 2, 3];
    return rows.flatMap(r => cols.map(c => [7.2 + c * 0.5, r * 0.5]));
  }, []);
  if (score > 66) return null;

  return (
    <group>
      {/* Garden fence perimeter */}
      {[
        [[7.0, -2, 4.0], [2.2, 0.4, 0.07], 0],
        [[7.0, -2, 7.6], [2.2, 0.4, 0.07], 0],
        [[5.9, -2, 5.8], [0.07, 0.4, 3.7], 0],
        [[8.25, -2, 5.8], [0.07, 0.4, 3.7], 0],
      ].map(([pos, size, r], i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial color="#c4a07a" roughness={0.9} />
        </mesh>
      ))}
      {/* Flower beds */}
      {score <= 33 && flowerPositions.map(([x, z], i) => (
        <group key={i} position={[x, -2, 4.8 + z]}>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.22, 4]} />
            <meshStandardMaterial color="#16a34a" />
          </mesh>
          <mesh position={[0, 0.24, 0]} castShadow>
            <sphereGeometry args={[0.07, 5, 5]} />
            <meshStandardMaterial color={flowerColors[i % flowerColors.length]} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* Vegetable patches (low green rows) */}
      {[4.5, 5.2, 5.9].map((z, i) => (
        <mesh key={i} position={[7.0, -1.93, z]} receiveShadow castShadow>
          <boxGeometry args={[1.8, 0.12, 0.32]} />
          <meshStandardMaterial color={score > 33 ? '#6b7c3a' : '#2d6a4f'} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// 11. Low-poly Birds circling and flapping wings
function Birds({ score }) {
  const birdsGroupRef = useRef();
  
  const birdsList = useMemo(() => {
    return [
      { radius: 13, speed: 0.8, height: 11, phase: 0 },
      { radius: 16, speed: 0.6, height: 13, phase: 2.2 },
      { radius: 12, speed: 0.9, height: 10.5, phase: 4.4 }
    ];
  }, []);

  useFrame((state) => {
    if (!birdsGroupRef.current) return;
    const t = state.clock.getElapsedTime();
    
    birdsGroupRef.current.children.forEach((bird, i) => {
      const data = birdsList[i];
      if (!data) return;

      const angle = t * data.speed + data.phase;
      const x = Math.sin(angle) * data.radius;
      const z = Math.cos(angle) * data.radius;
      
      bird.position.set(x, data.height + Math.sin(t * 1.8 + i) * 0.4, z);
      bird.rotation.y = angle + Math.PI / 2;
      
      const leftWing = bird.getObjectByName('left-wing');
      const rightWing = bird.getObjectByName('right-wing');
      if (leftWing && rightWing) {
        const flap = Math.sin(t * 9.0) * 0.5;
        leftWing.rotation.z = flap;
        rightWing.rotation.z = -flap;
      }
    });
  });

  const visibleCount = score > 66 ? 0 : score > 33 ? 1 : 3;

  return (
    <group ref={birdsGroupRef}>
      {birdsList.slice(0, visibleCount).map((b, i) => (
        <group key={i} name={`bird-${i}`}>
          <mesh castShadow>
            <boxGeometry args={[0.22, 0.08, 0.4]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.9} />
          </mesh>
          <mesh name="left-wing" position={[-0.15, 0, 0]} castShadow>
            <boxGeometry args={[0.3, 0.015, 0.22]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
          </mesh>
          <mesh name="right-wing" position={[0.15, 0, 0]} castShadow>
            <boxGeometry args={[0.3, 0.015, 0.22]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// 12. Colorful Flowers & Shrubs
function Foliage({ score }) {
  const foliageData = useMemo(() => {
    const list = [];
    const positions = [
      [-5, 4.5], [2.5, 5.5], [-2.5, 5], [4.5, 3.5], [-6.5, 1.5], [0.5, 7.5], [-4.5, 7.5], [5.5, 6.5]
    ];
    positions.forEach((pos, i) => {
      const tx = pos[0];
      const tz = pos[1];
      const ty = Math.sin(tx * 0.08) * Math.cos(tz * 0.08) * 3.2 + Math.sin(tx * 0.03) * 2.0 - 2;
      list.push({
        pos: [tx, ty, tz],
        color: ["#f43f5e", "#3b82f6", "#eab308", "#a855f7"][i % 4],
        scale: 0.13 + Math.random() * 0.13
      });
    });
    return list;
  }, []);

  return (
    <group>
      {/* Flowers: only visible when score is low */}
      {score <= 33 && foliageData.map((f, i) => (
        <group key={i} position={f.pos}>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.16, 4]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
          <mesh position={[0, 0.18, 0]} castShadow>
            <sphereGeometry args={[f.scale, 5, 5]} />
            <meshBasicMaterial color={f.color} />
          </mesh>
        </group>
      ))}

      {/* Shrubs: green under low score, brown under medium score, gone under high score */}
      {score <= 66 && foliageData.map((f, i) => {
        const shrubColor = score > 33 ? "#78350f" : "#059669";
        return (
          <mesh key={`shrub-${i}`} position={[f.pos[0] + 0.6, f.pos[1], f.pos[2] - 0.6]} castShadow>
            <sphereGeometry args={[f.scale * 1.6, 6, 6]} />
            <meshStandardMaterial color={shrubColor} roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

// 9b. Instanced grass tufts on flat ground
function GrassField({ score }) {
  const meshRef = useRef();
  const count = 800;
    const dummy = useMemo(() => new Object3D(), []);

  const grassPositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 40;
      // avoid lake, path, and house zones
      if (x * x + z * z < 30) continue;
      if (x > 4 && x < 14 && z > 0 && z < 12) continue;
      const scaleY = 0.10 + Math.random() * 0.10;
      const rotY = Math.random() * Math.PI * 2;
      positions.push({ x, y: -2.0, z, scaleY, rotY });
    }
    return positions;
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    grassPositions.forEach((p, i) => {
      dummy.position.set(p.x, p.y + p.scaleY / 2, p.z);
      dummy.rotation.set(0, p.rotY, 0);
      dummy.scale.set(0.055, p.scaleY, 0.055);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [grassPositions, dummy]);

  if (score > 66) return null;
  const grassColor = score > 33 ? '#a16207' : '#2d6a4f';

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} castShadow>
      <coneGeometry args={[0.5, 1, 4]} />
      <meshStandardMaterial color={grassColor} roughness={0.9} />
    </instancedMesh>
  );
}

// Helper: terrain Y from XZ — flat ground
function terrainY(_tx, _tz) {
  return -2.0;
}

// 12b. Wind Turbine — clean energy contrast to factory
function WindTurbine({ position, score }) {
  const bladeRef = useRef();
  
  useFrame((state, delta) => {
    if (bladeRef.current) {
      bladeRef.current.rotation.z += delta * 0.8;
    }
  });

  if (score > 66) return null;

  return (
    <group position={position}>
      {/* Tower */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.15, 5, 8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Nacelle */}
      <mesh position={[0, 5.1, 0]} castShadow>
        <boxGeometry args={[0.35, 0.22, 0.25]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.4} />
      </mesh>
      {/* Blades — rotate around Z axis */}
      <group ref={bladeRef} position={[0, 5.1, 0.15]}>
        {[0, 1, 2].map(i => (
          <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
            <mesh position={[0, 1.0, 0]} castShadow>
              <boxGeometry args={[0.1, 2.0, 0.03]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// 12c. Ground-mounted Solar Panels
function SolarPanels({ position, score }) {
  if (score > 33) return null;

  return (
    <group position={position}>
      {/* Support poles */}
      {[[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.15, z]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.3, 5]} />
          <meshStandardMaterial color="#64748b" roughness={0.8} />
        </mesh>
      ))}
      {/* Panel surface — tilted toward sun */}
      <mesh position={[0, 0.35, 0]} rotation={[-Math.PI / 8, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.04, 0.8]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.12} metalness={0.8} />
      </mesh>
      {/* Panel grid lines */}
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[-0.45 + i * 0.45, 0.37, 0]} rotation={[-Math.PI / 8, 0, 0]}>
          <boxGeometry args={[0.02, 0.05, 0.75]} />
          <meshStandardMaterial color="#3b82f6" emissive="#1e40af" emissiveIntensity={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// 12d. Road connecting village to city
const Road = React.memo(function Road() {
  return (
    <group>
      {/* Road surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, -1.97, -5]} receiveShadow>
        <planeGeometry args={[2.5, 20]} />
        <meshStandardMaterial color="#a8a29e" roughness={0.95} />
      </mesh>
      {/* Center line markings */}
      {[-12, -8, -4, 0, 4].map(z => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[3, -1.96, z]} receiveShadow>
          <planeGeometry args={[0.15, 1.5]} />
          <meshStandardMaterial color="#fde047" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
});

// 13. Environment Controller — upgraded with Sky shader, hemisphere light, factory glow, GrassField
function SceneController({ score, degraded }) {
  const ambientLightRef = useRef();
  const dirLightRef = useRef();
  const hemiLightRef = useRef();
  const factoryLightRef = useRef();

  const currentColors = useRef({
    hill: new Color('#10b981'),
    leaves: new Color('#059669'),
    clouds: new Color('#ffffff'),
    fogColor: new Color('#b9d8f5'),
    ambientIntensity: 0.55,
    hemiSkyIntensity: 0.6,
    fogDensity: 0.010,
    dirIntensity: 1.2,
  });

  // Sky parameters animated with GSAP
  const skyParams = useRef({ turbidity: 2, rayleigh: 0.8, mieCoeff: 0.005, mieDir: 0.85, elevation: 28, azimuth: 180 });
  const skyRef = useRef();
  const sunPosVec = useRef(new Vector3());
  const skyFrameCount = useRef(0);

  useEffect(() => {
    const c = currentColors.current;
    const sp = skyParams.current;

    let tHill, tLeaves, tClouds, tFogColor, tAmbient, tHemi, tFogDensity, tDir;
    let tTurb, tRayleigh, tMie, tElevation;

    if (score <= 33) {
      tHill = '#10b981'; tLeaves = '#059669'; tClouds = '#ffffff';
      tFogColor = '#b9d8f5'; tAmbient = 0.55; tHemi = 0.65; tFogDensity = 0.008; tDir = 1.3;
      tTurb = 2; tRayleigh = 0.8; tMie = 0.004; tElevation = 30;
    } else if (score <= 66) {
      tHill = '#84cc16'; tLeaves = '#ca8a04'; tClouds = '#d4b896';
      tFogColor = '#d4a96a'; tAmbient = 0.40; tHemi = 0.35; tFogDensity = 0.022; tDir = 0.9;
      tTurb = 8; tRayleigh = 1.5; tMie = 0.06; tElevation = 14;
    } else {
      tHill = '#475569'; tLeaves = '#334155'; tClouds = '#475569';
      tFogColor = '#1e2530'; tAmbient = 0.12; tHemi = 0.10; tFogDensity = 0.048; tDir = 0.0;
      tTurb = 20; tRayleigh = 4; tMie = 0.1; tElevation = 2;
    }

    gsap.killTweensOf([c, c.hill, c.leaves, c.clouds, c.fogColor, sp]);
    gsap.to(c.hill, { ...hexToRgb(tHill), duration: 2.5, ease: 'power2.out' });
    gsap.to(c.leaves, { ...hexToRgb(tLeaves), duration: 2.5, ease: 'power2.out' });
    gsap.to(c.clouds, { ...hexToRgb(tClouds), duration: 2.5, ease: 'power2.out' });
    gsap.to(c.fogColor, { ...hexToRgb(tFogColor), duration: 2.5, ease: 'power2.out' });
    gsap.to(c, { ambientIntensity: tAmbient, hemiSkyIntensity: tHemi, fogDensity: tFogDensity, dirIntensity: tDir, duration: 2.5, ease: 'power2.out' });
    gsap.to(sp, { turbidity: tTurb, rayleigh: tRayleigh, mieCoeff: tMie, elevation: tElevation, duration: 2.5, ease: 'power2.out' });
  }, [score]);

  useFrame((state) => {
    const { hill, leaves, clouds, fogColor, ambientIntensity, hemiSkyIntensity, fogDensity, dirIntensity } = currentColors.current;
    const sp = skyParams.current;

    if (ambientLightRef.current) ambientLightRef.current.intensity = ambientIntensity;
    if (hemiLightRef.current) {
      hemiLightRef.current.intensity = hemiSkyIntensity;
      hemiLightRef.current.color.copy(fogColor);
    }
    if (dirLightRef.current) dirLightRef.current.intensity = dirIntensity;

    // Factory warning point light glows red when score is high
    if (factoryLightRef.current) {
      factoryLightRef.current.intensity = score > 66 ? 2.5 + Math.sin(state.clock.getElapsedTime() * 3) * 0.8 : score > 33 ? 0.5 : 0;
    }

    if (state.scene.fog) {
      state.scene.fog.color.copy(fogColor);
      state.scene.fog.density = fogDensity;
    }

    // Update sky shader uniforms every 3rd frame (GSAP animates skyParams values)
    skyFrameCount.current++;
    if (skyRef.current?.material?.uniforms && skyFrameCount.current % 3 === 0) {
      const u = skyRef.current.material.uniforms;
      u.turbidity.value = sp.turbidity;
      u.rayleigh.value = sp.rayleigh;
      u.mieCoefficient.value = sp.mieCoeff;
      u.mieDirectionalG.value = sp.mieDir;
      const phi = MathUtils.degToRad(90 - sp.elevation);
      const theta = MathUtils.degToRad(sp.azimuth);
      sunPosVec.current.setFromSphericalCoords(1, phi, theta);
      u.sunPosition.value.copy(sunPosVec.current);
    }
  });

  // Color refs for passing to child components (GSAP animates these)
  const { hill, leaves, clouds } = currentColors.current;

  const treesData = useMemo(() => {
    return [
      { pos: [-5, 0, 5], h: 2.1, type: 'broadleaf' },
      { pos: [-8, 0, -2], h: 2.4, type: 'pine' },
      { pos: [4.5, 0, 7.5], h: 2.2, type: 'broadleaf' },
      { pos: [7.5, 0, 2.5], h: 1.8, type: 'pine' },
      { pos: [-1.5, 0, -6], h: 2.3, type: 'broadleaf' },
      { pos: [3.8, 0, -4.8], h: 2.0, type: 'pine' },
      { pos: [-11, 0, 7.5], h: 2.2, type: 'broadleaf' },
      { pos: [10, 0, -7.5], h: 1.9, type: 'pine' },
    ].map(t => ({ pos: [t.pos[0], terrainY(t.pos[0], t.pos[2]), t.pos[2]], h: t.h, type: t.type }));
  }, []);

  const stumpsData = useMemo(() => {
    return [
      { pos: [-3.5, 0, 1.8], scale: 1.15 },
      { pos: [2.8, 0, 4.8], scale: 1.0 },
      { pos: [-6.8, 0, 6.8], scale: 0.85 },
      { pos: [5.8, 0, -2.2], scale: 1.1 },
    ].map(s => ({ pos: [s.pos[0], terrainY(s.pos[0], s.pos[2]), s.pos[2]], scale: s.scale }));
  }, []);

  const factoryPosition = useMemo(() => {
    const tx = 9, tz = -9;
    return [tx, terrainY(tx, tz), tz];
  }, []);

  const cloudsData = useMemo(() => ([
    { pos: [-15, 11, -5], s: 0.35 },
    { pos: [0, 13, -11], s: 0.3 },
    { pos: [12, 10, -2], s: 0.45 },
    { pos: [-5, 12, 8], s: 0.28 },
  ]), []);

  return (
    <>
      {/* Lighting rig */}
      <ambientLight ref={ambientLightRef} intensity={0.55} />
      <hemisphereLight ref={hemiLightRef} color="#b9d8f5" groundColor="#6b7280" intensity={0.65} />
      <directionalLight
        ref={dirLightRef}
        position={[15, 28, 12]}
        castShadow
        shadow-mapSize-width={degraded ? 1024 : 2048}
        shadow-mapSize-height={degraded ? 1024 : 2048}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.001}
        intensity={1.3}
      />
      {/* Factory orange/red glow light */}
      <pointLight
        ref={factoryLightRef}
        position={[factoryPosition[0], factoryPosition[1] + 6, factoryPosition[2]]}
        color="#ef4444"
        intensity={0}
        distance={20}
        decay={2}
      />

      {/* Shader-based sky — no external asset downloads */}
      {score <= 66 && <Sky ref={skyRef} distance={450000} />}

      <FlatGround groundColor={hill} />
      <Road />
      <GravelPath />
      <GrassField score={score} />
      <Lake score={score} />
      <City score={score} />
      <Factory position={factoryPosition} score={score} />
      <WindTurbine position={[-9, -2, -9]} score={score} />
      <SolarPanels position={[6, -2, 9]} score={score} />
      <Village score={score} />
      <Garden score={score} />
      <ParkBench position={[3.5, -2, 3.5]} rotation={0.8} />
      <Animals score={score} />

      {treesData.map((tree, i) => (
        tree.type === 'pine'
          ? <PineTree key={`pine-${i}`} position={tree.pos} height={tree.h} score={score} leafColor={leaves} />
          : <BroadleafTree key={`broad-${i}`} position={tree.pos} height={tree.h} score={score} leafColor={leaves} />
      ))}

      {score > 66 && stumpsData.map((stump, i) => (
        <DeadStump key={`stump-${i}`} position={stump.pos} scale={stump.scale} />
      ))}

      <People score={score} />
      <Foliage score={score} />

      {cloudsData.map((cloud, i) => (
        <Cloud key={`cloud-${i}`} position={cloud.pos} speed={cloud.s} cloudColor={clouds} />
      ))}

      <Birds score={score} />
    </>
  );
}

export default function EcoWorld({ score }) {
  const [degraded, setDegraded] = useState(false);

  const handleCreated = ({ scene, gl }) => {
    scene.fog = new FogExp2('#b9d8f5', 0.010);
    // ACES Filmic tone mapping for richer colours
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.1;
    gl.outputColorSpace = SRGBColorSpace;
  };

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ position: [0, 10, 18], fov: 42 }}
        onCreated={handleCreated}
        gl={{ preserveDrawingBuffer: true, antialias: !degraded, powerPreference: 'high-performance' }}
        dpr={degraded ? [0.8, 1.2] : [1, 2]}
      >
        {/* Auto-degrade quality on slow devices */}
        <PerformanceMonitor
          onDecline={() => setDegraded(true)}
          onIncline={() => setDegraded(false)}
          flipflops={3}
          threshold={0.6}
        />

        <SceneController score={score} degraded={degraded} />

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={8}
          maxDistance={36}
          maxPolarAngle={Math.PI / 2 - 0.06}
          autoRotate={true}
          autoRotateSpeed={0.25}
        />

      </Canvas>
    </div>
  );
}
