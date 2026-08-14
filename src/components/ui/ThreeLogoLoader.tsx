"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function ThreeLogoLoader({ placement = "loading" }: { placement?: "loading" | "landing" }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    const reducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    if (
      !mount ||
      reducedMotion ||
      !("IntersectionObserver" in window) ||
      !("ResizeObserver" in window)
    ) {
      return;
    }

    let disposed = false;
    let frame = 0;
    let cleanup = () => {};

    void import("three").then((THREE) => {
      if (disposed || !mount) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.z = 8.6;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;

      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      } catch {
        return;
      }

      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.domElement.className = "three-logo-loader__canvas";
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);

      const logoGroup = new THREE.Group();
      logoGroup.rotation.x = -0.08;
      scene.add(logoGroup);

      const panelGeometry = new THREE.BoxGeometry(2.72, 2.72, 0.38, 1, 1, 1);
      const panelMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xf7fbff,
        metalness: 0.08,
        roughness: 0.24,
        clearcoat: 0.9,
        clearcoatRoughness: 0.16,
        transparent: true,
        opacity: 0.96,
      });
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      logoGroup.add(panel);

      const rimGeometry = new THREE.EdgesGeometry(panelGeometry);
      const rimMaterial = new THREE.LineBasicMaterial({
        color: 0x78c9ff,
        transparent: true,
        opacity: 0.55,
      });
      const rim = new THREE.LineSegments(rimGeometry, rimMaterial);
      logoGroup.add(rim);

      const outerRingGeometry = new THREE.TorusGeometry(2.12, 0.025, 12, 96);
      const outerRingMaterial = new THREE.MeshStandardMaterial({
        color: 0x2389ff,
        emissive: 0x0a4eb5,
        emissiveIntensity: 0.52,
        metalness: 0.45,
        roughness: 0.18,
        transparent: true,
        opacity: 0.9,
      });
      const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
      const outerOrbit = new THREE.Group();
      outerOrbit.rotation.x = 1.12;
      outerOrbit.rotation.y = 0.25;
      outerOrbit.add(outerRing);
      scene.add(outerOrbit);

      const innerRingGeometry = new THREE.TorusGeometry(1.82, 0.015, 10, 96);
      const innerRingMaterial = new THREE.MeshStandardMaterial({
        color: 0xa8ddff,
        emissive: 0x4b9fd8,
        emissiveIntensity: 0.35,
        metalness: 0.28,
        roughness: 0.2,
        transparent: true,
        opacity: 0.62,
      });
      const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
      const innerOrbit = new THREE.Group();
      innerOrbit.rotation.x = 0.82;
      innerOrbit.rotation.y = -0.52;
      innerOrbit.add(innerRing);
      scene.add(innerOrbit);

      const satelliteGeometry = new THREE.SphereGeometry(0.09, 18, 18);
      const satelliteMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x4aafff,
        emissiveIntensity: 1.4,
        metalness: 0.2,
        roughness: 0.12,
      });
      const outerSatellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
      outerSatellite.position.x = 2.12;
      outerOrbit.add(outerSatellite);

      const innerSatellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
      innerSatellite.scale.setScalar(0.72);
      innerSatellite.position.x = -1.82;
      innerOrbit.add(innerSatellite);

      const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
      const keyLight = new THREE.DirectionalLight(0x8fd3ff, 2.2);
      keyLight.position.set(3, 4, 6);
      const rimLight = new THREE.PointLight(0x256dff, 1.8, 12);
      rimLight.position.set(-3.5, -2.5, 4);
      scene.add(ambientLight, keyLight, rimLight);

      const textureLoader = new THREE.TextureLoader();
      const logoTexture = textureLoader.load(
        "/images/blubook-b-mark.png",
        () => {
          if (!disposed) setReady(true);
        },
      );
      logoTexture.encoding = THREE.sRGBEncoding;

      const logoGeometry = new THREE.PlaneGeometry(2.17, 2);
      const logoDepthMaterial = new THREE.MeshBasicMaterial({
        map: logoTexture,
        color: 0x0a57c9,
        transparent: true,
        alphaTest: 0.08,
        side: THREE.DoubleSide,
      });
      for (let index = 0; index < 12; index += 1) {
        const depthLayer = new THREE.Mesh(logoGeometry, logoDepthMaterial);
        depthLayer.position.z = 0.2 + index * 0.014;
        logoGroup.add(depthLayer);
      }

      const logoMaterial = new THREE.MeshBasicMaterial({
        map: logoTexture,
        transparent: true,
        depthWrite: false,
      });
      const logo = new THREE.Mesh(logoGeometry, logoMaterial);
      logo.position.z = 0.37;
      logoGroup.add(logo);

      const resize = () => {
        const { width, height } = mount.getBoundingClientRect();
        const safeHeight = Math.max(height, 1);
        camera.aspect = width / safeHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(width, safeHeight, false);
      };

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      resize();

      const clock = new THREE.Clock();
      let elapsed = 0;
      let inView = true;
      const render = () => {
        if (disposed) return;
        if (!inView) {
          frame = 0;
          return;
        }

        elapsed += Math.min(clock.getDelta(), 0.05);
        logoGroup.rotation.y = Math.sin(elapsed * 0.72) * 0.34;
        logoGroup.rotation.x = -0.08 + Math.cos(elapsed * 0.58) * 0.1;
        logoGroup.position.y = Math.sin(elapsed * 1.05) * 0.08;
        outerOrbit.rotation.z = elapsed * 0.34;
        innerOrbit.rotation.z = -elapsed * 0.22;
        renderer.render(scene, camera);
        frame = window.requestAnimationFrame(render);
      };

      const visibilityObserver = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        if (inView && frame === 0) {
          clock.getDelta();
          render();
        }
      });
      visibilityObserver.observe(mount);

      render();

      cleanup = () => {
        window.cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        visibilityObserver.disconnect();
        panelGeometry.dispose();
        panelMaterial.dispose();
        rimGeometry.dispose();
        rimMaterial.dispose();
        outerRingGeometry.dispose();
        outerRingMaterial.dispose();
        innerRingGeometry.dispose();
        innerRingMaterial.dispose();
        satelliteGeometry.dispose();
        satelliteMaterial.dispose();
        logoGeometry.dispose();
        logoDepthMaterial.dispose();
        logoMaterial.dispose();
        logoTexture.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    }).catch(() => {
      // The immediately visible static logo remains when WebGL cannot initialize.
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`three-logo-loader three-logo-loader--${placement}`}
      data-ready={ready ? "true" : "false"}
    >
      <div className="three-logo-loader__fallback" aria-hidden="true">
        <Image
          src="/images/blubook-b-mark.png"
          alt=""
          width={176}
          height={162}
          priority={placement === "loading"}
        />
      </div>
    </div>
  );
}
