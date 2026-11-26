import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Utensils, HeartHandshake, ShieldCheck, Clock, Zap, MapPin, Sparkles } from 'lucide-react';

interface Hero3DProps {
  onDonateClick: () => void;
  onExploreClick: () => void;
}

export const Hero3D: React.FC<Hero3DProps> = ({ onDonateClick, onExploreClick }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check WebGL support
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x061912, 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 9);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x10b981, 2.5);
    mainLight.position.set(5, 8, 5);
    scene.add(mainLight);

    const secondaryLight = new THREE.PointLight(0x84cc16, 2, 20);
    secondaryLight.position.set(-5, -2, 3);
    scene.add(secondaryLight);

    const coreLight = new THREE.PointLight(0x38bdf8, 2, 15);
    coreLight.position.set(0, 0, 1);
    scene.add(coreLight);

    // 1. Central Floating Food Box
    const boxGroup = new THREE.Group();

    // Box body
    const boxGeo = new THREE.BoxGeometry(1.6, 1.2, 1.3);
    const boxMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f2f22,
      roughness: 0.25,
      metalness: 0.1,
      transmission: 0.4,
      transparent: true,
      opacity: 0.9,
      reflectivity: 0.8,
      clearcoat: 0.5,
    });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxGroup.add(boxMesh);

    // Box Edges glow
    const edgeGeo = new THREE.EdgesGeometry(boxGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edgeGeo, edgeMat);
    boxGroup.add(wireframe);

    // Food Box lid detail
    const lidGeo = new THREE.BoxGeometry(1.7, 0.18, 1.4);
    const lidMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.3 });
    const lidMesh = new THREE.Mesh(lidGeo, lidMat);
    lidMesh.position.y = 0.65;
    boxGroup.add(lidMesh);

    // Holographic Ribbon/Tape on box
    const ribbonGeo = new THREE.BoxGeometry(0.3, 1.22, 1.32);
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0x84cc16,
      emissive: 0x84cc16,
      emissiveIntensity: 0.4,
    });
    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    boxGroup.add(ribbonMesh);

    scene.add(boxGroup);

    // 2. Neural Network Nodes & Connector Lines
    const neuralGroup = new THREE.Group();
    const nodeCount = 14;
    const nodePositions: THREE.Vector3[] = [];
    const nodeGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.8,
    });

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 2.8 + Math.sin(i * 2) * 0.6;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * (radius * 0.6) + (Math.sin(i) * 0.4);
      const z = (Math.sin(i * 3) - 0.5) * 1.5;
      const pos = new THREE.Vector3(x, y, z);
      nodePositions.push(pos);

      const sphere = new THREE.Mesh(nodeGeo, nodeMat);
      sphere.position.copy(pos);
      neuralGroup.add(sphere);
    }

    // Connect nodes with glowing lines
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.25,
    });
    const lineGeo = new THREE.BufferGeometry();
    const points: number[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const p1 = nodePositions[i];
      const p2 = nodePositions[(i + 1) % nodeCount];
      points.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);

      // Also connect to center
      points.push(p1.x, p1.y, p1.z, 0, 0, 0);
    }
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    neuralGroup.add(lines);
    scene.add(neuralGroup);

    // 3. Floating particles (Energy Embers)
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particleCoords = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particleCoords[i] = (Math.random() - 0.5) * 16;
      particleCoords[i + 1] = (Math.random() - 0.5) * 10;
      particleCoords[i + 2] = (Math.random() - 0.5) * 8;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particleCoords, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xa3e635,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Parallax tracking
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      camera.position.x = mouseX * 0.8;
      camera.position.y = 1.5 + mouseY * 0.5;
      camera.lookAt(0, 0, 0);

      if (!prefersReducedMotion) {
        // Floating box physics
        boxGroup.position.y = Math.sin(elapsed * 1.5) * 0.18;
        boxGroup.rotation.y = elapsed * 0.4 + mouseX * 0.3;
        boxGroup.rotation.x = Math.cos(elapsed * 1.2) * 0.08 + mouseY * 0.2;

        // Neural rotation
        neuralGroup.rotation.y = elapsed * 0.15;
        neuralGroup.rotation.z = Math.sin(elapsed * 0.2) * 0.1;

        // Particle sway
        particleSystem.rotation.y = elapsed * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-brand-emerald/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-brand-lime/5 rounded-full blur-[120px] pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headlines & Call to Actions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-8 text-center lg:text-left"
          >
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border-brand-emerald/30 text-brand-mint text-xs font-semibold tracking-wide uppercase shadow-lg shadow-brand-emerald/5">
              <span className="flex h-2 w-2 rounded-full bg-brand-emerald animate-ping" />
              <Sparkles className="w-3.5 h-3.5 text-brand-limeSoft" />
              <span>Real-Time Food Surplus Rescue Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
              Turn Surplus Food <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint via-brand-emerald to-brand-limeSoft">
                Into Someone’s Next Meal.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              FoodRescue connects restaurants, events, NGOs, and volunteers in real time to rescue edible surplus food before it becomes waste.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-2">
              <button
                onClick={onDonateClick}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-emerald-500 hover:to-brand-emerald text-white font-semibold text-base shadow-xl shadow-brand-emerald/25 hover:shadow-brand-emerald/40 transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Utensils className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>Donate Surplus Food</span>
              </button>

              <button
                onClick={onExploreClick}
                className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel text-slate-200 hover:text-white hover:bg-emerald-950/40 border-slate-700/60 hover:border-brand-emerald/40 font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <HeartHandshake className="w-5 h-5 text-brand-limeSoft" />
                <span>Find Food Donations</span>
              </button>
            </div>

            {/* Verified Safe Logistics Pill */}
            <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start pt-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-emerald" />
                <span>HACCP-Aligned Safety Screen</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-limeSoft" />
                <span>Sub-15 Min Rapid Volunteer Dispatch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-sky-400" />
                <span>QR Chain-of-Custody Tracking</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: 3D Interactive Canvas + Floating Glass Cards */}
          <div className="lg:col-span-5 relative h-[480px] sm:h-[540px] flex items-center justify-center">
            {/* Three.js Container */}
            <div
              ref={mountRef}
              className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
              title="Interactive 3D Network: Drag or move mouse to explore"
            />

            {!webglSupported && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center glass-panel rounded-2xl">
                <Utensils className="w-16 h-16 text-brand-emerald mb-3 animate-bounce" />
                <h3 className="text-xl font-bold text-white">Interactive Food Rescue Hub</h3>
                <p className="text-sm text-slate-400 mt-2">Connecting kitchens with communities across the urban core.</p>
              </div>
            )}

            {/* Floating Glassmorphism Cards positioned around 3D core */}
            
            {/* Card 1: Meals Rescued (Top Left) */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-2 left-0 sm:-left-4 glass-panel p-3.5 rounded-xl shadow-2xl border-brand-emerald/30 pointer-events-none z-20 flex items-center gap-3 backdrop-blur-xl"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-brand-mint">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Surplus Diverted</p>
                <p className="text-sm font-bold text-white">50 Meals Rescued</p>
              </div>
            </motion.div>

            {/* Card 2: Food Saved (Top Right) */}
            <motion.div
              animate={{ y: [0, 9, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
              className="absolute top-8 -right-2 sm:-right-4 glass-panel p-3 rounded-xl shadow-2xl border-brand-lime/30 pointer-events-none z-20 flex items-center gap-2.5 backdrop-blur-xl"
            >
              <div className="w-9 h-9 rounded-lg bg-lime-500/20 border border-lime-500/30 flex items-center justify-center text-brand-limeSoft">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Environmental Savings</p>
                <p className="text-sm font-bold text-brand-limeSoft">24.5 kg Food Saved</p>
              </div>
            </motion.div>

            {/* Card 3: NGO Matched (Bottom Left) */}
            <motion.div
              animate={{ y: [0, 7, 0] }}
              transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
              className="absolute bottom-10 left-2 sm:-left-6 glass-panel p-3.5 rounded-xl shadow-2xl border-sky-500/30 pointer-events-none z-20 flex items-center gap-3 backdrop-blur-xl"
            >
              <div className="w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Compatibility</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">94%</span>
                </div>
                <p className="text-sm font-bold text-white">Hope Kitchen Matched</p>
              </div>
            </motion.div>

            {/* Card 4: Pickup ETA (Bottom Right) */}
            <motion.div
              animate={{ y: [0, -9, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
              className="absolute -bottom-2 right-0 sm:right-2 glass-panel p-3.5 rounded-xl shadow-2xl border-brand-emerald/30 pointer-events-none z-20 flex items-center gap-3 backdrop-blur-xl"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-emerald/20 border border-brand-emerald/30 flex items-center justify-center text-brand-mint">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-brand-limeSoft" />
                  <p className="text-xs text-slate-400">Express Courier</p>
                </div>
                <p className="text-sm font-bold text-brand-mint">Pickup in 18 min</p>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};
