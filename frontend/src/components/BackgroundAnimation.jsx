import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const CONFIG = {
  // ==========================================================
  // PARTICLES
  // ==========================================================

  desktopParticles: 3000,
  mobileParticles: 1500,

  // ==========================================================
  // FIELD
  // ==========================================================

  fieldWidth: 10.8,
  fieldHeight: 5.9,

  innerRadius: 0.42,
  outerRadius: 1.0,

  // ==========================================================
  // FLOW
  // ==========================================================

  flowStrength: 1.12,
  tangentialStrength: 1.5,

  radialWaveStrength: 0.34,

  noiseStrength: 0.38,
  noiseScale: 0.72,

  springStrength: 0.86,

  // ==========================================================
  // VELOCITY
  // ==========================================================

  velocityLerp: 0.075,
  velocityDamping: 0.915,

  maxVelocity: 2.5,

  // ==========================================================
  // MOUSE
  // ==========================================================

  mousePoolStrengthX: 0.72,
  mousePoolStrengthY: 0.42,

  mousePoolLerp: 0.04,

  mouseForceRadius: 3.4,
  mouseForceStrength: 1.65,

  mouseRippleStrength: 0.5,
  mouseRippleFrequency: 3.2,

  mouseColorRadius: 2.8,
  mouseColorStrength: 0.5,

  // ==========================================================
  // PARTICLE APPEARANCE
  // ==========================================================

  minSize: 0.038,
  maxSize: 0.115,

  baseStreak: 1.0,
  velocityStreak: 2.6,

  minOpacity: 0.14,
  maxOpacity: 0.78,

  // ==========================================================
  // COLORS
  // ==========================================================

  colors: [
    '#FACC15', // Yellow
    '#A855F7', // Purple
    '#F97316', // Orange
    '#EF4444', // Red
    '#92400E'  // Brown
  ],

  mouseHighlight: '#FFF4B8',

  colorLerp: 0.065,

  // ==========================================================
  // DEPTH
  // ==========================================================

  minDepth: -2.5,
  maxDepth: 2.5,

  depthMotion: 0.24,
  depthAmplitude: 0.58,

  // ==========================================================
  // GLOBAL MOVEMENT
  // ==========================================================

  globalRotationStrength: 0.015
};

// ============================================================
// HELPERS
// ============================================================

const hexToRGB = (hex) => {
  const color = new THREE.Color(hex);

  return {
    r: color.r,
    g: color.g,
    b: color.b
  };
};

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

const lerp = (a, b, t) =>
  a + (b - a) * t;

// ============================================================
// COMPONENT
// ============================================================

export const BackgroundAnimation = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    // ========================================================
    // REDUCED MOTION
    // ========================================================

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // ========================================================
    // DEVICE
    // ========================================================

    const isMobile = window.innerWidth < 768;

    const particleCount = reducedMotion
      ? 700
      : isMobile
        ? CONFIG.mobileParticles
        : CONFIG.desktopParticles;

    // ========================================================
    // SCENE
    // ========================================================

    const scene = new THREE.Scene();

    // ========================================================
    // CAMERA
    // ========================================================

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );

    camera.position.set(0, 0, 13);

    // ========================================================
    // RENDERER
    // ========================================================

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });

    let pixelRatio = Math.min(
      window.devicePixelRatio,
      1.75
    );

    renderer.setPixelRatio(pixelRatio);

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    renderer.setClearColor(0x000000, 0);

    container.appendChild(renderer.domElement);

    // ========================================================
    // MOUSE
    // ========================================================

    const mouse = new THREE.Vector2(0, 0);

    const mouseWorld = new THREE.Vector3();

    const raycaster = new THREE.Raycaster();

    const mousePlane = new THREE.Plane(
      new THREE.Vector3(0, 0, 1),
      0
    );

    let mouseActive = false;

    // ========================================================
    // GLOBAL POOL MOVEMENT
    // ========================================================

    let poolOffsetX = 0;
    let poolOffsetY = 0;

    let targetPoolOffsetX = 0;
    let targetPoolOffsetY = 0;

    // ========================================================
    // COLORS
    // ========================================================

    const palette = CONFIG.colors.map(hexToRGB);

    const mouseHighlight = hexToRGB(
      CONFIG.mouseHighlight
    );

    // ========================================================
    // ARRAYS
    // ========================================================

    const positions = new Float32Array(
      particleCount * 3
    );

    const homePositions = new Float32Array(
      particleCount * 3
    );

    const velocities = new Float32Array(
      particleCount * 3
    );

    const colors = new Float32Array(
      particleCount * 3
    );

    const sizes = new Float32Array(
      particleCount
    );

    const opacities = new Float32Array(
      particleCount
    );

    const angles = new Float32Array(
      particleCount
    );

    const stretches = new Float32Array(
      particleCount
    );

    const particleData = [];

    // ========================================================
    // PARTICLE CREATION
    // ========================================================

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // ------------------------------------------------------
      // ANGLE
      // ------------------------------------------------------

      const angle =
        Math.random() *
        Math.PI *
        2;

      // ------------------------------------------------------
      // SHELL DISTRIBUTION
      // ------------------------------------------------------

      /*
       * Particles live mainly around the outside
       * of the field rather than filling the center.
       */

      const radius =
        CONFIG.innerRadius +
        Math.pow(
          Math.random(),
          0.48
        ) *
          (
            CONFIG.outerRadius -
            CONFIG.innerRadius
          );

      const jitter =
        THREE.MathUtils.randFloat(
          0.94,
          1.06
        );

      const nx =
        Math.cos(angle) *
        radius *
        jitter;

      const ny =
        Math.sin(angle) *
        radius *
        jitter;

      const x =
        nx *
        CONFIG.fieldWidth;

      const y =
        ny *
        CONFIG.fieldHeight;

      const z =
        THREE.MathUtils.randFloat(
          CONFIG.minDepth,
          CONFIG.maxDepth
        );

      // ------------------------------------------------------
      // POSITION
      // ------------------------------------------------------

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      homePositions[i3] = x;
      homePositions[i3 + 1] = y;
      homePositions[i3 + 2] = z;

      // ------------------------------------------------------
      // VELOCITY
      // ------------------------------------------------------

      velocities[i3] =
        THREE.MathUtils.randFloat(
          -0.015,
          0.015
        );

      velocities[i3 + 1] =
        THREE.MathUtils.randFloat(
          -0.015,
          0.015
        );

      velocities[i3 + 2] = 0;

      // ------------------------------------------------------
      // PARAMETERS
      // ------------------------------------------------------

      particleData.push({
        phase:
          Math.random() *
          Math.PI *
          2,

        noisePhase:
          Math.random() *
          Math.PI *
          2,

        colorPhase:
          Math.random() *
          Math.PI *
          2,

        depthPhase:
          Math.random() *
          Math.PI *
          2,

        flowSpeed:
          THREE.MathUtils.randFloat(
            0.86,
            1.14
          ),

        noiseOffsetX:
          THREE.MathUtils.randFloat(
            -10,
            10
          ),

        noiseOffsetY:
          THREE.MathUtils.randFloat(
            -10,
            10
          ),

        depthAmplitude:
          THREE.MathUtils.randFloat(
            0.45,
            1
          )
      });

      // ------------------------------------------------------
      // INITIAL COLOR
      // ------------------------------------------------------

      const colorPosition =
        (
          angle +
          Math.PI
        ) /
        (
          Math.PI * 2
        );

      const scaled =
        colorPosition *
        (palette.length - 1);

      const index = Math.min(
        Math.floor(scaled),
        palette.length - 2
      );

      const amount =
        scaled - index;

      const colorA =
        palette[index];

      const colorB =
        palette[index + 1];

      colors[i3] =
        lerp(
          colorA.r,
          colorB.r,
          amount
        );

      colors[i3 + 1] =
        lerp(
          colorA.g,
          colorB.g,
          amount
        );

      colors[i3 + 2] =
        lerp(
          colorA.b,
          colorB.b,
          amount
        );

      // ------------------------------------------------------
      // INITIAL SIZE
      // ------------------------------------------------------

      const depth =
        clamp(
          (
            z -
            CONFIG.minDepth
          ) /
          (
            CONFIG.maxDepth -
            CONFIG.minDepth
          ),
          0,
          1
        );

      const depthSmooth =
        depth *
        depth *
        (
          3 -
          2 * depth
        );

      sizes[i] =
        lerp(
          CONFIG.minSize,
          CONFIG.maxSize,
          depthSmooth
        );

      opacities[i] =
        lerp(
          CONFIG.minOpacity,
          CONFIG.maxOpacity,
          depthSmooth
        );

      angles[i] =
        angle +
        Math.PI / 2;

      stretches[i] =
        CONFIG.baseStreak;
    }

    // ========================================================
    // GEOMETRY
    // ========================================================

    const geometry =
      new THREE.BufferGeometry();

    const positionAttribute =
      new THREE.BufferAttribute(
        positions,
        3
      );

    const colorAttribute =
      new THREE.BufferAttribute(
        colors,
        3
      );

    const sizeAttribute =
      new THREE.BufferAttribute(
        sizes,
        1
      );

    const opacityAttribute =
      new THREE.BufferAttribute(
        opacities,
        1
      );

    const angleAttribute =
      new THREE.BufferAttribute(
        angles,
        1
      );

    const stretchAttribute =
      new THREE.BufferAttribute(
        stretches,
        1
      );

    geometry.setAttribute(
      'position',
      positionAttribute
    );

    geometry.setAttribute(
      'color',
      colorAttribute
    );

    geometry.setAttribute(
      'aSize',
      sizeAttribute
    );

    geometry.setAttribute(
      'aOpacity',
      opacityAttribute
    );

    geometry.setAttribute(
      'aAngle',
      angleAttribute
    );

    geometry.setAttribute(
      'aStretch',
      stretchAttribute
    );

    // ========================================================
    // MATERIAL
    // ========================================================

    const material =
      new THREE.ShaderMaterial({
        transparent: true,

        vertexColors: true,

        depthWrite: false,

        blending:
          THREE.NormalBlending,

        uniforms: {
          uPixelRatio: {
            value: pixelRatio
          }
        },

        // ====================================================
        // VERTEX
        // ====================================================

        vertexShader: `
          attribute float aSize;
          attribute float aOpacity;
          attribute float aAngle;
          attribute float aStretch;

          varying vec3 vColor;
          varying float vOpacity;
          varying float vAngle;
          varying float vStretch;

          uniform float uPixelRatio;

          void main() {

            vColor = color;

            vOpacity = aOpacity;

            vAngle = aAngle;

            vStretch = aStretch;

            vec4 mvPosition =
              modelViewMatrix *
              vec4(position, 1.0);

            float depth =
              max(
                -mvPosition.z,
                1.0
              );

            float perspective =
              360.0 /
              depth;

            float size =
              aSize *
              perspective *
              uPixelRatio;

            size *=
              mix(
                1.0,
                aStretch,
                0.42
              );

            gl_PointSize =
              size;

            gl_Position =
              projectionMatrix *
              mvPosition;
          }
        `,

        // ====================================================
        // FRAGMENT
        // ====================================================

        fragmentShader: `
          varying vec3 vColor;
          varying float vOpacity;
          varying float vAngle;
          varying float vStretch;

          void main() {

            vec2 uv =
              gl_PointCoord -
              vec2(0.5);

            float c =
              cos(vAngle);

            float s =
              sin(vAngle);

            vec2 rotated =
              vec2(
                uv.x * c -
                  uv.y * s,

                uv.x * s +
                  uv.y * c
              );

            float stretch =
              max(
                vStretch,
                1.0
              );

            /*
             * Horizontal elongation becomes the
             * particle's motion streak.
             */

            rotated.x /=
              stretch;

            float distanceFromCenter =
              length(rotated);

            float body =
              1.0 -
              smoothstep(
                0.18,
                0.5,
                distanceFromCenter
              );

            /*
             * Slightly softer center.
             */

            float glow =
              1.0 -
              smoothstep(
                0.0,
                0.48,
                distanceFromCenter
              );

            float alpha =
              body *
              vOpacity *
              (
                0.84 +
                glow * 0.16
              );

            if (alpha < 0.01) {
              discard;
            }

            gl_FragColor =
              vec4(
                vColor,
                alpha
              );
          }
        `
      });

    // ========================================================
    // PARTICLES
    // ========================================================

    const particles =
      new THREE.Points(
        geometry,
        material
      );

    scene.add(particles);

    // ========================================================
    // POINTER
    // ========================================================

    const handlePointerMove =
      (event) => {
        mouse.x =
          (
            event.clientX /
            window.innerWidth
          ) *
            2 -
          1;

        mouse.y =
          -(
            (
              event.clientY /
              window.innerHeight
            ) *
              2 -
            1
          );

        mouseActive = true;
      };

    const handlePointerLeave =
      () => {
        mouseActive = false;
      };

    window.addEventListener(
      'pointermove',
      handlePointerMove,
      { passive: true }
    );

    window.addEventListener(
      'pointerleave',
      handlePointerLeave
    );

    // ========================================================
    // CLOCK
    // ========================================================

    const clock =
      new THREE.Clock();

    let animationFrame;

    // ========================================================
    // ANIMATION
    // ========================================================

    const animate = () => {
      animationFrame =
        requestAnimationFrame(
          animate
        );

      const delta =
        Math.min(
          clock.getDelta(),
          0.033
        );

      const time =
        clock.elapsedTime;

      // ======================================================
      // MOUSE WORLD
      // ======================================================

      raycaster.setFromCamera(
        mouse,
        camera
      );

      raycaster.ray.intersectPlane(
        mousePlane,
        mouseWorld
      );

      // ======================================================
      // WHOLE FIELD MOVEMENT
      // ======================================================

      if (mouseActive) {
        targetPoolOffsetX =
          mouse.x *
          CONFIG.mousePoolStrengthX;

        targetPoolOffsetY =
          mouse.y *
          CONFIG.mousePoolStrengthY;
      } else {
        targetPoolOffsetX = 0;
        targetPoolOffsetY = 0;
      }

      poolOffsetX =
        THREE.MathUtils.lerp(
          poolOffsetX,
          targetPoolOffsetX,
          CONFIG.mousePoolLerp
        );

      poolOffsetY =
        THREE.MathUtils.lerp(
          poolOffsetY,
          targetPoolOffsetY,
          CONFIG.mousePoolLerp
        );

      // ======================================================
      // PARTICLES
      // ======================================================

      for (
        let i = 0;
        i < particleCount;
        i++
      ) {
        const i3 = i * 3;

        const data =
          particleData[i];

        let x =
          positions[i3];

        let y =
          positions[i3 + 1];

        // ====================================================
        // NORMALIZED POSITION
        // ====================================================

        const nx =
          x /
          CONFIG.fieldWidth;

        const ny =
          y /
          CONFIG.fieldHeight;

        const radialDistance =
          Math.sqrt(
            nx * nx +
            ny * ny
          );

        // ====================================================
        // MAIN TANGENTIAL FLOW
        // ====================================================

        let flowX =
          -ny;

        let flowY =
          nx;

        const tangentLength =
          Math.sqrt(
            flowX * flowX +
            flowY * flowY
          ) || 1;

        flowX /=
          tangentLength;

        flowY /=
          tangentLength;

        flowX *=
          CONFIG.tangentialStrength;

        flowY *=
          CONFIG.tangentialStrength;

        // ====================================================
        // RADIAL WAVES
        // ====================================================

        const radialWave =
          Math.sin(
            radialDistance *
              12.0 -
            time *
              1.8 *
              data.flowSpeed +
            data.phase
          );

        const radialForce =
          radialWave *
          CONFIG.radialWaveStrength;

        flowX +=
          nx *
          radialForce;

        flowY +=
          ny *
          radialForce;

        // ====================================================
        // FLUID NOISE
        // ====================================================

        const noiseX =
          Math.sin(
            y *
              CONFIG.noiseScale *
              0.62 +
            time *
              0.38 +
            data.noiseOffsetX
          );

        const noiseY =
          Math.cos(
            x *
              CONFIG.noiseScale *
              0.58 -
            time *
              0.32 +
            data.noiseOffsetY
          );

        const crossNoise =
          Math.sin(
            (
              x +
              y
            ) *
              0.32 +
            time *
              0.24 +
            data.noisePhase
          );

        flowX +=
          (
            noiseX +
            crossNoise *
              0.45
          ) *
          CONFIG.noiseStrength;

        flowY +=
          (
            noiseY +
            crossNoise *
              0.45
          ) *
          CONFIG.noiseStrength;

        // ====================================================
        // OUTER SHELL SPRING
        // ====================================================

        const desiredRadius =
          0.76;

        const radiusError =
          radialDistance -
          desiredRadius;

        flowX -=
          nx *
          radiusError *
          CONFIG.springStrength;

        flowY -=
          ny *
          radiusError *
          CONFIG.springStrength;

        // ====================================================
        // STRONGER CENTER EXCLUSION
        // ====================================================

        /*
         * This prevents particles from drifting through
         * the GridPulse title.
         */

        if (
          radialDistance <
          CONFIG.innerRadius
        ) {
          const centerPush =
            (
              CONFIG.innerRadius -
              radialDistance
            ) *
            2.4;

          const safeRadius =
            Math.max(
              radialDistance,
              0.001
            );

          flowX +=
            (
              nx /
              safeRadius
            ) *
            centerPush;

          flowY +=
            (
              ny /
              safeRadius
            ) *
            centerPush;
        }

        // ====================================================
        // MOUSE DISTORTION
        // ====================================================

        if (mouseActive) {
          const dx =
            x -
            mouseWorld.x;

          const dy =
            y -
            mouseWorld.y;

          const distance =
            Math.sqrt(
              dx * dx +
              dy * dy
            );

          if (
            distance <
            CONFIG.mouseForceRadius
          ) {
            const influence =
              1 -
              distance /
                CONFIG.mouseForceRadius;

            const smooth =
              influence *
              influence *
              (
                3 -
                2 * influence
              );

            const safeDistance =
              Math.max(
                distance,
                0.001
              );

            const dirX =
              dx /
              safeDistance;

            const dirY =
              dy /
              safeDistance;

            // ----------------------------------------------
            // REPULSION
            // ----------------------------------------------

            flowX +=
              dirX *
              smooth *
              CONFIG.mouseForceStrength;

            flowY +=
              dirY *
              smooth *
              CONFIG.mouseForceStrength;

            // ----------------------------------------------
            // ROTATION AROUND CURSOR
            // ----------------------------------------------

            flowX +=
              -dirY *
              smooth *
              0.48;

            flowY +=
              dirX *
              smooth *
              0.48;

            // ----------------------------------------------
            // RIPPLE
            // ----------------------------------------------

            const ripple =
              Math.sin(
                distance *
                  CONFIG.mouseRippleFrequency -
                time *
                  4.0
              ) *
              smooth *
              CONFIG.mouseRippleStrength;

            flowX +=
              dirX *
              ripple;

            flowY +=
              dirY *
              ripple;
          }
        }

        // ====================================================
        // FLOW STRENGTH
        // ====================================================

        const finalFlow =
          reducedMotion
            ? 0.32
            : CONFIG.flowStrength;

        flowX *=
          finalFlow *
          data.flowSpeed;

        flowY *=
          finalFlow *
          data.flowSpeed;

        // ====================================================
        // VELOCITY
        // ====================================================

        velocities[i3] =
          THREE.MathUtils.lerp(
            velocities[i3],
            flowX,
            CONFIG.velocityLerp
          );

        velocities[i3 + 1] =
          THREE.MathUtils.lerp(
            velocities[i3 + 1],
            flowY,
            CONFIG.velocityLerp
          );

        velocities[i3] *=
          CONFIG.velocityDamping;

        velocities[i3 + 1] *=
          CONFIG.velocityDamping;

        // ====================================================
        // VELOCITY LIMIT
        // ====================================================

        const speed =
          Math.sqrt(
            velocities[i3] *
              velocities[i3] +
            velocities[i3 + 1] *
              velocities[i3 + 1]
          );

        if (
          speed >
          CONFIG.maxVelocity
        ) {
          const scale =
            CONFIG.maxVelocity /
            speed;

          velocities[i3] *=
            scale;

          velocities[i3 + 1] *=
            scale;
        }

        // ====================================================
        // MOVE
        // ====================================================

        positions[i3] +=
          velocities[i3] *
          delta;

        positions[i3 + 1] +=
          velocities[i3 + 1] *
          delta;

        // ====================================================
        // GLOBAL MOUSE MOVEMENT
        // ====================================================

        const targetX =
          homePositions[i3] +
          poolOffsetX;

        const targetY =
          homePositions[i3 + 1] +
          poolOffsetY;

        positions[i3] +=
          (
            targetX -
            positions[i3]
          ) *
          0.0018;

        positions[i3 + 1] +=
          (
            targetY -
            positions[i3 + 1]
          ) *
          0.0018;

        // ====================================================
        // DEPTH
        // ====================================================

        const targetZ =
          homePositions[i3 + 2] +
          Math.sin(
            time *
              CONFIG.depthMotion +
            data.depthPhase
          ) *
          data.depthAmplitude *
          CONFIG.depthAmplitude;

        positions[i3 + 2] =
          THREE.MathUtils.lerp(
            positions[i3 + 2],
            targetZ,
            0.022
          );

        // ====================================================
        // SPEED
        // ====================================================

        const currentSpeed =
          Math.sqrt(
            velocities[i3] *
              velocities[i3] +
            velocities[i3 + 1] *
              velocities[i3 + 1]
          );

        const normalizedSpeed =
          clamp(
            currentSpeed /
              CONFIG.maxVelocity,
            0,
            1
          );

        // ====================================================
        // ANGLE
        // ====================================================

        if (
          currentSpeed >
          0.001
        ) {
          angles[i] =
            Math.atan2(
              velocities[i3 + 1],
              velocities[i3]
            );
        }

        // ====================================================
        // STREAK
        // ====================================================

        stretches[i] =
          CONFIG.baseStreak +
          normalizedSpeed *
            CONFIG.velocityStreak;

        // ====================================================
        // DEPTH VISUAL
        // ====================================================

        const currentDepth =
          positions[i3 + 2];

        const depthNormalized =
          clamp(
            (
              currentDepth -
              CONFIG.minDepth
            ) /
              (
                CONFIG.maxDepth -
                CONFIG.minDepth
              ),
            0,
            1
          );

        const depthSmooth =
          depthNormalized *
          depthNormalized *
          (
            3 -
            2 *
              depthNormalized
          );

        // ====================================================
        // SIZE
        // ====================================================

        sizes[i] =
          lerp(
            CONFIG.minSize,
            CONFIG.maxSize,
            depthSmooth
          ) +
          normalizedSpeed *
            0.026;

        // ====================================================
        // OPACITY
        // ====================================================

        opacities[i] =
          lerp(
            CONFIG.minOpacity,
            CONFIG.maxOpacity,
            depthSmooth
          );

        // ====================================================
        // COLOR FIELD
        // ====================================================

        const fieldAngle =
          Math.atan2(
            ny,
            nx
          );

        let colorPosition =
          (
            fieldAngle +
            Math.PI
          ) /
          (
            Math.PI * 2
          );

        /*
         * Extremely slow color movement.
         * The colors remain coherent instead of
         * rapidly flashing.
         */

        colorPosition +=
          time *
          0.016;

        colorPosition +=
          Math.sin(
            radialDistance *
              5.0 +
            time *
              0.08 +
            data.colorPhase
          ) *
          0.04;

        colorPosition -=
          Math.floor(
            colorPosition
          );

        const scaledColor =
          colorPosition *
          (
            palette.length - 1
          );

        const colorIndex =
          Math.min(
            Math.floor(
              scaledColor
            ),
            palette.length - 2
          );

        const colorAmount =
          scaledColor -
          colorIndex;

        const colorA =
          palette[
            colorIndex
          ];

        const colorB =
          palette[
            colorIndex + 1
          ];

        let targetR =
          lerp(
            colorA.r,
            colorB.r,
            colorAmount
          );

        let targetG =
          lerp(
            colorA.g,
            colorB.g,
            colorAmount
          );

        let targetB =
          lerp(
            colorA.b,
            colorB.b,
            colorAmount
          );

        // ====================================================
        // VELOCITY COLOR BOOST
        // ====================================================

        const velocityColor =
          palette[
            Math.min(
              palette.length - 1,
              Math.floor(
                normalizedSpeed *
                  palette.length
              )
            )
          ];

        const velocityInfluence =
          normalizedSpeed *
          0.14;

        targetR =
          lerp(
            targetR,
            velocityColor.r,
            velocityInfluence
          );

        targetG =
          lerp(
            targetG,
            velocityColor.g,
            velocityInfluence
          );

        targetB =
          lerp(
            targetB,
            velocityColor.b,
            velocityInfluence
          );

        // ====================================================
        // MOUSE COLOR
        // ====================================================

        if (mouseActive) {
          const colorDX =
            positions[i3] -
            mouseWorld.x;

          const colorDY =
            positions[i3 + 1] -
            mouseWorld.y;

          const colorDistance =
            Math.sqrt(
              colorDX *
                colorDX +
              colorDY *
                colorDY
            );

          if (
            colorDistance <
            CONFIG.mouseColorRadius
          ) {
            const proximity =
              1 -
              colorDistance /
                CONFIG.mouseColorRadius;

            const smooth =
              proximity *
              proximity *
              (
                3 -
                2 * proximity
              );

            const influence =
              smooth *
              CONFIG.mouseColorStrength;

            targetR =
              lerp(
                targetR,
                mouseHighlight.r,
                influence
              );

            targetG =
              lerp(
                targetG,
                mouseHighlight.g,
                influence
              );

            targetB =
              lerp(
                targetB,
                mouseHighlight.b,
                influence
              );
          }
        }

        // ====================================================
        // COLOR LERP
        // ====================================================

        colors[i3] =
          THREE.MathUtils.lerp(
            colors[i3],
            targetR,
            CONFIG.colorLerp
          );

        colors[i3 + 1] =
          THREE.MathUtils.lerp(
            colors[i3 + 1],
            targetG,
            CONFIG.colorLerp
          );

        colors[i3 + 2] =
          THREE.MathUtils.lerp(
            colors[i3 + 2],
            targetB,
            CONFIG.colorLerp
          );
      }

      // ======================================================
      // GPU UPDATE
      // ======================================================

      positionAttribute.needsUpdate = true;
      colorAttribute.needsUpdate = true;
      sizeAttribute.needsUpdate = true;
      opacityAttribute.needsUpdate = true;
      angleAttribute.needsUpdate = true;
      stretchAttribute.needsUpdate = true;

      // ======================================================
      // VERY SUBTLE GLOBAL MOVEMENT
      // ======================================================

      particles.rotation.y =
        Math.sin(
          time * 0.055
        ) *
        CONFIG.globalRotationStrength;

      particles.rotation.x =
        Math.cos(
          time * 0.045
        ) *
        CONFIG.globalRotationStrength *
        0.4;

      // ======================================================
      // RENDER
      // ======================================================

      renderer.render(
        scene,
        camera
      );
    };

    animate();

    // ========================================================
    // RESIZE
    // ========================================================

    const handleResize = () => {
      const width =
        window.innerWidth;

      const height =
        window.innerHeight;

      camera.aspect =
        width / height;

      camera.updateProjectionMatrix();

      renderer.setSize(
        width,
        height
      );

      pixelRatio =
        Math.min(
          window.devicePixelRatio,
          1.75
        );

      renderer.setPixelRatio(
        pixelRatio
      );

      material.uniforms.uPixelRatio.value =
        pixelRatio;
    };

    window.addEventListener(
      'resize',
      handleResize
    );

    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      window.removeEventListener(
        'pointermove',
        handlePointerMove
      );

      window.removeEventListener(
        'pointerleave',
        handlePointerLeave
      );

      window.removeEventListener(
        'resize',
        handleResize
      );

      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (
        renderer.domElement &&
        container.contains(
          renderer.domElement
        )
      ) {
        container.removeChild(
          renderer.domElement
        );
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="gridpulse-background-animation"
      aria-hidden="true"
    />
  );
};

export default BackgroundAnimation;