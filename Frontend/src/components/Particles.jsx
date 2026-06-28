import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const Particles = ({ count = 1200 }) => {
  const mesh = useRef();
  const { mouse, viewport } = useThree();

  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Create randomized position/speed/scale properties for particles
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 45;
      const y = (Math.random() - 0.5) * 45;
      const z = (Math.random() - 0.5) * 30;
      
      const speed = 0.01 + Math.random() * 0.04;
      const size = 0.05 + Math.random() * 0.15;
      
      temp.push({ x, y, z, speed, size, angle: Math.random() * Math.PI });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    
    // Convert current mouse coordinates back to world units
    const mouseX = (mouse.x * viewport.width) / 2;
    const mouseY = (mouse.y * viewport.height) / 2;

    particles.forEach((p, idx) => {
      let { x, y, z, speed, size, angle } = p;
      
      // Animate floating waves
      angle += speed * 0.1;
      p.angle = angle;
      y += Math.sin(angle) * 0.005;
      x += Math.cos(angle) * 0.005;
      
      // Simple mouse repulsion logic
      const dx = x - mouseX;
      const dy = y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 4) {
        const force = (4 - dist) * 0.05;
        x += (dx / dist) * force;
        y += (dy / dist) * force;
      }

      // Keep particles inside bounding box
      if (y > 22) y = -22;
      if (y < -22) y = 22;
      if (x > 22) x = -22;
      if (x < -22) x = 22;
      
      p.x = x;
      p.y = y;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      
      mesh.current.setMatrixAt(idx, dummy.matrix);
    });
    
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshBasicMaterial 
        color="#818cf8" 
        transparent 
        opacity={0.65} 
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
};

export default Particles;
