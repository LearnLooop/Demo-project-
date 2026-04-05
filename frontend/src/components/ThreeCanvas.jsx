import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, ContactShadows, Environment, MeshWobbleMaterial } from '@react-three/drei';
import { useLocation } from 'react-router-dom';
import * as THREE from 'three';

function RandomFloatingShape({ shapeType, color, index, total }) {
  // Spread them beautifully across the entire screen, juggling in an orbit
  const randomPosition = useMemo(() => {
    // Distribute them in a large wide cylinder space
    const angle = (index / total) * Math.PI * 2;
    const radius = Math.random() * 8 + 4; // 4 to 12 units out
    const x = Math.cos(angle) * radius;
    const y = Math.random() * 12 - 6; // -6 to 6
    const z = Math.sin(angle) * 4 - 8; // -12 to -4 (push deep so not blocking UI)
    
    return [x, y, z];
  }, [index, total]);

  const randomRotation = useMemo(() => {
    return [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI];
  }, []);

  const speed = useMemo(() => Math.random() * 1.5 + 0.5, []);
  
  // Base scale on how far back they are
  const scaleMultiplier = useMemo(() => Math.random() * 0.8 + 0.6, []);

  // Use a ref to add continuous smooth rotation representing "data flowing"
  const meshRef = useRef();
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.001 * speed;
      meshRef.current.rotation.y += 0.002 * speed;
      
      // Gentle sine wave bobbing across huge distances
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime * speed + index) * 0.005;
      meshRef.current.position.x += Math.cos(state.clock.elapsedTime * (speed * 0.5) + index) * 0.003;
    }
  });

  return (
    <Float speed={speed * 1.5} rotationIntensity={1.5} floatIntensity={4}>
      <mesh ref={meshRef} position={randomPosition} rotation={randomRotation} scale={scaleMultiplier}>
        {shapeType === 'cylinder'    && <cylinderGeometry args={[0.8, 0.8, 2, 32]} />} {/* Database / Server */}
        {shapeType === 'octahedron'  && <octahedronGeometry args={[1.2, 0]} />}       {/* Network Node */}
        {shapeType === 'dodecahedron'&& <dodecahedronGeometry args={[1.1, 0]} />}     {/* Graph Concept */}
        {shapeType === 'torus'       && <torusKnotGeometry args={[0.9, 0.25, 128, 32]} />} {/* Looped Network */}
        {shapeType === 'box'         && <boxGeometry args={[1.5, 1.5, 1.5]} />}       {/* Logic Block */}
        {shapeType === 'sphere'      && <sphereGeometry args={[1.1, 64, 64]} />}      {/* Data Packet */}
        
        {(shapeType === 'sphere' || shapeType === 'cylinder') ? (
          <MeshDistortMaterial 
            distort={0.4} 
            speed={speed * 2} 
            color={color} 
            roughness={0.1}
            metalness={0.5}
            clearcoat={1}
          />
        ) : shapeType === 'torus' ? (
          <MeshWobbleMaterial 
            factor={0.4} 
            speed={speed} 
            color={color} 
            roughness={0.2}
            metalness={0.8}
          />
        ) : (
          <meshPhysicalMaterial 
            color={color} 
            roughness={0.1} 
            metalness={0.8}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        )}
      </mesh>
    </Float>
  );
}

function BackgroundElements() {
  const location = useLocation();

  // Generate a vast array of shapes
  const shapes = useMemo(() => {
    // Computer Science abstract primitives
    const types = ['cylinder', 'octahedron', 'dodecahedron', 'torus', 'box', 'sphere'];
    // Vibrant editorial palette
    const colors = ['#FF4B2B', '#1E90FF', '#E5FE40', '#8B5CF6', '#F59E0B', '#10B981', '#ffffff', '#1C1917'];
    
    // Spawn fewer shapes globally so it isn't overwhelming (between 5 and 8 shapes)
    const amount = Math.floor(Math.random() * 4) + 5; 
    
    return Array.from({ length: amount }).map((_, i) => ({
      id: `${location.pathname}-${i}`,
      type: types[Math.floor(Math.random() * types.length)],
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
  }, [location.pathname]); 

  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[10, 20, 10]} intensity={2.5} castShadow />
      <directionalLight position={[-10, -10, -10]} intensity={1} color="#E5FE40" />
      <Environment preset="city" />

      {shapes.map((shape, i) => (
        <RandomFloatingShape 
          key={shape.id} 
          index={i} 
          total={shapes.length} 
          shapeType={shape.type} 
          color={shape.color} 
        />
      ))}

      <ContactShadows position={[0, -6, 0]} opacity={0.6} scale={60} blur={3} far={12} />
    </>
  );
}

export default function ThreeCanvas() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <Suspense fallback={null}>
          <BackgroundElements />
        </Suspense>
      </Canvas>
    </div>
  );
}
