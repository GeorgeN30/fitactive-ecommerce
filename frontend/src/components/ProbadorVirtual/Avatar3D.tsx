import { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Precarga de modelos
useGLTF.preload('/avatar/base_hombre.glb');
useGLTF.preload('/avatar/base_mujer.glb');

function Model({ scaleX, scaleY, genero }: { scaleX: number, scaleY: number, genero: 'Hombre' | 'Mujer' }) {
  const modelPath = genero === 'Hombre' ? '/avatar/base_hombre.glb' : '/avatar/base_mujer.glb';
  const { scene } = useGLTF(modelPath);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (groupRef.current) {
      // Ajustamos el volumen global (X y Z).
      // Multiplicador 1.25 para hacer la escala un poco más pronunciada en el entorno 3D.
      groupRef.current.scale.set(scaleX * 1.25, scaleY * 1.25, scaleX * 1.25);

      // Ajustamos la posición para que quede centrado
      groupRef.current.position.y = -1.2;
    }
  }, [scaleX, scaleY, genero]);

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Mejoramos el material para que luzca más realista y no como plástico brillante
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.roughness = 0.6; // Piel menos brillante
          mesh.material.metalness = 0.05; // Menos metálico
          mesh.material.envMapIntensity = 1.2; // Reflejos del entorno más bonitos
          mesh.material.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  // Usar clone para evitar problemas si se montan y desmontan múltiples veces
  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

interface Avatar3DProps {
  torsoScaleX: number;
  torsoScaleY: number;
  genero: 'Hombre' | 'Mujer';
}

export default function Avatar3D({ torsoScaleX, torsoScaleY, genero }: Avatar3DProps) {
  return (
    <div className="w-full h-full min-h-[500px] relative cursor-grab active:cursor-grabbing z-20">
      <Canvas shadows camera={{ position: [0, 0, 4.2], fov: 45 }}>

        <ambientLight intensity={0.4} />
        <directionalLight
          position={[2, 5, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        <pointLight position={[-2, 3, -3]} intensity={0.8} color="#f0f8ff" />
        <pointLight position={[0, -2, 2]} intensity={0.5} color="#ffebcd" />

        <Environment preset="studio" />

        <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={10} blur={2} far={4} />

        <Model scaleX={torsoScaleX} scaleY={torsoScaleY} genero={genero} />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={8}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
          target={[0, 0, 0]}
        />
      </Canvas>
      <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-500 pointer-events-none bg-black/5 p-1 rounded backdrop-blur mx-auto w-max">
        Puedes rotar el modelo 3D arrastrando
      </div>
    </div>
  );
}
