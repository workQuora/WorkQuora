import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Float } from '@react-three/drei';
import Particles from './Particles';
import * as THREE from 'three';

const InteractiveShapes = () => {
  const globeRef = useRef();
  const ringRef = useRef();
  const crystalRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Slow movements
    if (globeRef.current) {
      globeRef.current.rotation.y = time * 0.04;
      globeRef.current.rotation.x = Math.sin(time * 0.1) * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.y = -time * 0.06;
      ringRef.current.rotation.z = Math.cos(time * 0.08) * 0.2;
    }
    if (crystalRef.current) {
      crystalRef.current.rotation.x = time * 0.12;
      crystalRef.current.rotation.y = time * 0.08;
      crystalRef.current.position.y = Math.sin(time * 0.5) * 0.2;
    }
  });

  return (
    <group>
      {/* Huge Wireframe Globe */}
      <mesh ref={globeRef} position={[0, 0, -8]}>
        <sphereGeometry args={[7, 36, 36]} />
        <meshBasicMaterial 
          color="#312e81" 
          wireframe 
          transparent 
          opacity={0.12} 
        />
      </mesh>

      {/* Reflective Chrome / Metal Sphere */}
      <Float speed={1.5} rotationIntensity={1} floatIntensity={1.5}>
        <mesh position={[-6, 4, -5]}>
          <octahedronGeometry args={[1.5, 2]} />
          <meshStandardMaterial 
            color="#818cf8" 
            metalness={0.9} 
            roughness={0.1} 
            envMapIntensity={2}
          />
        </mesh>
      </Float>

      {/* Floating Torus Ring */}
      <Float speed={2} rotationIntensity={1.2} floatIntensity={1}>
        <mesh ref={ringRef} position={[6, -4, -6]}>
          <torusGeometry args={[2.5, 0.12, 16, 100]} />
          <meshStandardMaterial 
            color="#22d3ee" 
            emissive="#0891b2"
            emissiveIntensity={0.6}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </Float>

      {/* Floating Crystal Core */}
      <Float speed={3} rotationIntensity={2} floatIntensity={2}>
        <mesh ref={crystalRef} position={[0, 1.2, -4]}>
          <octahedronGeometry args={[1.2, 0]} />
          <meshPhysicalMaterial 
            color="#a78bfa"
            emissive="#6d28d9"
            emissiveIntensity={0.4}
            roughness={0.05}
            metalness={0.1}
            transmission={0.9}
            thickness={1.5}
            transparent
            opacity={0.85}
          />
        </mesh>
      </Float>

      {/* Abstract floating nodes/hexa */}
      {[...Array(6)].map((_, i) => (
        <Float key={i} speed={1 + Math.random()} floatIntensity={1.5}>
          <mesh position={[(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 16, -10 - Math.random() * 5]}>
            <boxGeometry args={[0.6, 0.6, 0.6]} />
            <meshStandardMaterial 
              color={i % 2 === 0 ? "#6366f1" : "#06b6d4"} 
              wireframe
              transparent
              opacity={0.3}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
};

const ThreeScene = () => {
  return (
    <div className="absolute inset-0 z-0 bg-[#040408]">
      {/* Premium dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#020205] via-transparent to-[#070512] z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#030307_90%)] z-10 pointer-events-none" />
      
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#030206']} />
        
        {/* Lights */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#8b5cf6" />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#06b6d4" />
        <directionalLight position={[0, 5, 5]} intensity={0.8} color="#ffffff" />

        {/* Dynamic Grid Floor */}
        <group position={[0, -8, 0]}>
          <Grid
            renderOrder={-1}
            position={[0, 0, 0]}
            args={[50, 50]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#1e1b4b"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#312e81"
            fadeDistance={30}
          />
        </group>

        {/* Interactive Scene Elements */}
        <InteractiveShapes />
        <Particles count={600} />

        {/* Subtle camera control parallax */}
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          maxPolarAngle={Math.PI / 2} 
          minPolarAngle={Math.PI / 2.5}
          autoRotate={false}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
};

export default ThreeScene;
