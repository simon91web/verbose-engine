import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Zufall } from '@lichtung/spiel';
import { RADIUS, WASSERSPIEGEL, schluessel, zuWabe, zuWelt, type BauArt, type Welt } from './gelaende';

/** Platzhalter-Modelle und Licht. Alles hier wird später durch eigene Modelle ersetzt. */

const GROESSE = 46;
const SEGMENTE = 130;

// ---------- Licht ----------
export function Licht({ abend }: { abend: boolean }) {
  const himmel = abend ? '#121b1c' : '#dde8d2';
  const nebel = useRef<THREE.Fog>(null);
  // Nebel beginnt kurz hinter der Lichtung, egal wie weit die Kamera weg ist
  useFrame(({ camera }) => {
    if (!nebel.current) return;
    const d = camera.position.length();
    nebel.current.near = d * (abend ? 0.85 : 1.1);
    nebel.current.far = d * (abend ? 2.0 : 2.6);
  });
  return (
    <>
      <color attach="background" args={[himmel]} />
      <fog ref={nebel} attach="fog" args={[himmel, 15, 40]} />
      <hemisphereLight args={[abend ? '#2c3d5c' : '#e6efff', abend ? '#0c0e0b' : '#5a4a30', abend ? 0.7 : 0.75]} />
      <directionalLight
        castShadow
        position={abend ? [-9, 11, -6] : [9, 15, 7]}
        intensity={abend ? 0.75 : 1.9}
        color={abend ? '#93a8ff' : '#fff0d4'}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0006}
      />
    </>
  );
}

// ---------- Gelände und Wasser ----------
export function Gelaende({ welt, onZeigen, onTippen }: { welt: Welt; onZeigen: (k: string | null) => void; onTippen: (k: string) => void }) {
  const geo = useMemo(() => {
    const ebene = new THREE.PlaneGeometry(GROESSE, GROESSE, SEGMENTE, SEGMENTE);
    ebene.rotateX(-Math.PI / 2);
    const pos = ebene.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, welt.hoehe(pos.getX(i), pos.getZ(i)));
    // Jede Fläche einfarbig: kantiger, gemalter Eindruck statt glatter Verläufe
    const g = ebene.toNonIndexed();
    ebene.dispose();
    const p = g.attributes.position;
    const farben = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i += 3) {
      const x = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
      const z = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
      const [r, gr, b] = welt.farbe(x, z);
      for (let j = 0; j < 3; j++) farben.set([r, gr, b], (i + j) * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(farben, 3));
    g.computeVertexNormals();
    return g;
  }, [welt]);
  useEffect(() => () => geo.dispose(), [geo]);

  const wabeBei = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const [q, r] = zuWabe(e.point.x, e.point.z);
    return welt.waben.has(schluessel(q, r)) ? schluessel(q, r) : null;
  };
  return (
    <>
      <mesh
        geometry={geo}
        receiveShadow
        // Die Auswahl bleibt stehen, wenn der Zeiger das Gelände verlässt – so erreicht man „Hier bauen“
        onPointerMove={(e) => { if (!e.buttons) onZeigen(wabeBei(e)); }}
        onClick={(e) => {
          if (e.delta > 6) return; // gezogen, nicht getippt
          const k = wabeBei(e);
          if (k) onTippen(k);
        }}
      >
        <meshStandardMaterial vertexColors flatShading roughness={0.95} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={WASSERSPIEGEL} raycast={() => null}>
        <planeGeometry args={[GROESSE, GROESSE]} />
        <meshStandardMaterial color="#4c7b80" transparent opacity={0.82} roughness={0.25} metalness={0.1} />
      </mesh>
    </>
  );
}

// ---------- Bäume und Felsen (instanziert) ----------
interface Baum { x: number; z: number; s: number; laub: boolean; dunkel: boolean; k?: string }

function baeumeErzeugen(welt: Welt): Baum[] {
  const z = new Zufall(welt.seed + 500);
  const baeume: Baum[] = [];
  for (const w of welt.waben.values()) {
    const k = schluessel(w.q, w.r);
    const anzahl = w.art === 'wald' ? 4 : w.art === 'wiese' && z.zahl() < 0.12 ? 1 : 0;
    for (let i = 0; i < anzahl; i++) {
      const a = z.zahl() * Math.PI * 2, d = Math.sqrt(z.zahl()) * 0.62;
      baeume.push({ x: w.x + Math.cos(a) * d, z: w.z + Math.sin(a) * d, s: 0.8 + z.zahl() * 0.5, laub: w.art === 'wiese' || z.zahl() < 0.15, dunkel: false, k });
    }
  }
  // Dichter Wald rings um die Lichtung als Kulisse
  for (let i = 0; i < 900; i++) {
    const a = z.zahl() * Math.PI * 2, d = RADIUS * 1.62 + z.zahl() * 9;
    const x = Math.cos(a) * d * 1.05, zz = Math.sin(a) * d;
    if (welt.artBei(x, zz) !== 'aussen' || welt.hoehe(x, zz) < WASSERSPIEGEL + 0.05) continue;
    baeume.push({ x, z: zz, s: 0.9 + z.zahl() * 0.7, laub: z.zahl() < 0.2, dunkel: true });
  }
  return baeume;
}

function useInstanzen(geo: THREE.BufferGeometry, mat: THREE.Material, eintraege: { m: THREE.Matrix4; c: THREE.Color }[]) {
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geo, mat, Math.max(1, eintraege.length));
    m.count = eintraege.length;
    eintraege.forEach((e, i) => {
      m.setMatrixAt(i, e.m);
      m.setColorAt(i, e.c);
    });
    m.castShadow = true;
    m.receiveShadow = true;
    m.raycast = () => null;
    return m;
  }, [geo, mat, eintraege]);
  useEffect(() => () => mesh.dispose(), [mesh]);
  return mesh;
}

const KRONE = new THREE.ConeGeometry(0.3, 0.85, 6).translate(0, 0.62, 0);
const LAUB = new THREE.IcosahedronGeometry(0.34, 0).translate(0, 0.62, 0);
const STAMM = new THREE.CylinderGeometry(0.05, 0.07, 0.3, 5).translate(0, 0.15, 0);
const STEIN = new THREE.DodecahedronGeometry(0.3, 0);
const MAT = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 });

export function Baeume({ welt, belegt }: { welt: Welt; belegt: Set<string> }) {
  const alle = useMemo(() => baeumeErzeugen(welt), [welt]);
  const sichtbar = useMemo(() => alle.filter((b) => !b.k || !belegt.has(b.k)), [alle, belegt]);
  const teile = useMemo(() => {
    const kronen: { m: THREE.Matrix4; c: THREE.Color }[] = [], laub: typeof kronen = [], staemme: typeof kronen = [];
    const z = new Zufall(welt.seed + 9);
    for (const b of sichtbar) {
      const y = welt.hoehe(b.x, b.z);
      const m = new THREE.Matrix4().compose(new THREE.Vector3(b.x, y, b.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, z.zahl() * 6, 0)), new THREE.Vector3(b.s, b.s, b.s));
      const ton = 0.85 + z.zahl() * 0.3;
      (b.laub ? laub : kronen).push({ m, c: new THREE.Color(b.laub ? '#6f8f3d' : b.dunkel ? '#2f4a2c' : '#3e5f34').multiplyScalar(ton) });
      staemme.push({ m, c: new THREE.Color('#5a4030') });
    }
    return { kronen, laub, staemme };
  }, [welt, sichtbar]);
  const a = useInstanzen(KRONE, MAT, teile.kronen);
  const b = useInstanzen(LAUB, MAT, teile.laub);
  const c = useInstanzen(STAMM, MAT, teile.staemme);
  return <><primitive object={a} /><primitive object={b} /><primitive object={c} /></>;
}

export function Felsen({ welt }: { welt: Welt }) {
  const eintraege = useMemo(() => {
    const z = new Zufall(welt.seed + 77);
    const liste: { m: THREE.Matrix4; c: THREE.Color }[] = [];
    for (const w of welt.waben.values()) {
      if (w.art !== 'fels') continue;
      for (let i = 0; i < 3; i++) {
        const x = w.x + (z.zahl() - 0.5) * 1.1, zz = w.z + (z.zahl() - 0.5) * 1.1, s = 0.6 + z.zahl() * 0.9;
        const m = new THREE.Matrix4().compose(new THREE.Vector3(x, welt.hoehe(x, zz) + 0.05, zz), new THREE.Quaternion().setFromEuler(new THREE.Euler(z.zahl(), z.zahl() * 6, z.zahl())), new THREE.Vector3(s, s * 0.7, s));
        liste.push({ m, c: new THREE.Color('#8b8679').multiplyScalar(0.85 + z.zahl() * 0.3) });
      }
    }
    return liste;
  }, [welt]);
  return <primitive object={useInstanzen(STEIN, MAT, eintraege)} />;
}

// ---------- Gebäude ----------
function Stoff({ farbe, geist, leuchten = 0 }: { farbe: string; geist?: boolean; leuchten?: number }) {
  return <meshStandardMaterial color={farbe} flatShading roughness={0.85} transparent={geist} opacity={geist ? 0.55 : 1} emissive={leuchten ? '#ffb347' : '#000000'} emissiveIntensity={leuchten} />;
}

function Muehlrad({ geist }: { geist?: boolean }) {
  const rad = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => { if (rad.current && !geist) rad.current.rotation.z -= dt * 0.8; });
  return (
    <mesh ref={rad} position={[0.4, 0.32, 0]} rotation-y={Math.PI / 2} castShadow>
      <torusGeometry args={[0.26, 0.06, 5, 10]} />
      <Stoff farbe="#6b4a32" geist={geist} />
    </mesh>
  );
}

export function Gebaeude({ welt, art, q, r, drehung, versatz, abend, geist }: { welt: Welt; art: BauArt; q: number; r: number; drehung: number; versatz: [number, number]; abend: boolean; geist?: boolean }) {
  const [x0, z0] = zuWelt(q, r);
  const x = x0 + versatz[0], z = z0 + versatz[1];
  const y = welt.hoehe(x, z);
  const fenster = abend && !geist ? 2.4 : 0;
  return (
    <group position={[x, y, z]} rotation-y={drehung}>
      {art === 'huette' && (
        <>
          <mesh position={[0, 0.22, 0]} castShadow receiveShadow><boxGeometry args={[0.72, 0.44, 0.56]} /><Stoff farbe="#8b6a47" geist={geist} /></mesh>
          <mesh position={[0, 0.6, 0]} rotation-y={Math.PI / 4} castShadow><coneGeometry args={[0.6, 0.4, 4]} /><Stoff farbe="#6a3e2b" geist={geist} /></mesh>
          <mesh position={[0.361, 0.24, 0]}><boxGeometry args={[0.02, 0.13, 0.13]} /><Stoff farbe="#2a2018" geist={geist} leuchten={fenster} /></mesh>
        </>
      )}
      {art === 'muehle' && (
        <>
          <mesh position={[0, 0.3, 0]} castShadow receiveShadow><boxGeometry args={[0.62, 0.6, 0.62]} /><Stoff farbe="#9a958a" geist={geist} /></mesh>
          <mesh position={[0, 0.78, 0]} rotation-y={Math.PI / 4} castShadow><coneGeometry args={[0.56, 0.42, 4]} /><Stoff farbe="#5d3b2a" geist={geist} /></mesh>
          <mesh position={[0, 0.34, 0.311]}><boxGeometry args={[0.13, 0.13, 0.02]} /><Stoff farbe="#2a2018" geist={geist} leuchten={fenster} /></mesh>
          <Muehlrad geist={geist} />
        </>
      )}
      {art === 'holzfaeller' && (
        <>
          <mesh position={[0, 0.2, 0]} castShadow receiveShadow><boxGeometry args={[0.6, 0.4, 0.5]} /><Stoff farbe="#7a5536" geist={geist} /></mesh>
          <mesh position={[0, 0.52, 0]} rotation-y={Math.PI / 4} castShadow><coneGeometry args={[0.5, 0.3, 4]} /><Stoff farbe="#3f5a33" geist={geist} /></mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[-0.05 + (i % 2) * 0.12, 0.07 + (i === 2 ? 0.11 : 0), 0.42]} rotation-z={Math.PI / 2} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 0.4, 6]} /><Stoff farbe="#a0784f" geist={geist} />
            </mesh>
          ))}
          <mesh position={[0.301, 0.22, 0.05]}><boxGeometry args={[0.02, 0.12, 0.12]} /><Stoff farbe="#2a2018" geist={geist} leuchten={fenster} /></mesh>
        </>
      )}
    </group>
  );
}

export function Lagerfeuer({ welt, abend }: { welt: Welt; abend: boolean }) {
  const licht = useRef<THREE.PointLight>(null);
  const flamme = useRef<THREE.Mesh>(null);
  const y = welt.hoehe(0, 0);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const flackern = 1 + Math.sin(t * 9) * 0.08 + Math.sin(t * 23) * 0.05;
    if (licht.current) licht.current.intensity = (abend ? 5 : 0.6) * flackern;
    if (flamme.current) flamme.current.scale.setScalar(flackern);
  });
  return (
    <group position={[0, y, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.06, 0]} rotation={[0, (i * Math.PI) / 3, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.5, 5]} /><meshStandardMaterial color="#5a3f2c" flatShading />
        </mesh>
      ))}
      <mesh ref={flamme} position={[0, 0.25, 0]}><coneGeometry args={[0.14, 0.4, 5]} /><meshStandardMaterial color="#ffb04a" emissive="#ff8a2a" emissiveIntensity={abend ? 2.5 : 1.2} flatShading /></mesh>
      <pointLight ref={licht} position={[0, 0.7, 0]} color="#ffae4f" distance={abend ? 6.5 : 3} decay={1.8} />
    </group>
  );
}

// ---------- Wege ----------
export function Weg({ welt, punkte }: { welt: Welt; punkte: [number, number][] }) {
  const geo = useMemo(() => {
    if (punkte.length < 2) return null;
    const pos: number[] = [], idx: number[] = [];
    punkte.forEach(([x, z], i) => {
      const [ax, az] = punkte[Math.max(0, i - 1)], [bx, bz] = punkte[Math.min(punkte.length - 1, i + 1)];
      const tx = bx - ax, tz = bz - az, l = Math.hypot(tx, tz) || 1;
      const nx = (-tz / l) * 0.09, nz = (tx / l) * 0.09;
      pos.push(x + nx, welt.hoehe(x + nx, z + nz) + 0.035, z + nz, x - nx, welt.hoehe(x - nx, z - nz) + 0.035, z - nz);
      if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, [welt, punkte]);
  useEffect(() => () => geo?.dispose(), [geo]);
  if (!geo) return null;
  return (
    <mesh geometry={geo} receiveShadow raycast={() => null}>
      <meshStandardMaterial color="#b39a6c" roughness={1} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  );
}

// ---------- Baumodus: Eignung als Overlay ----------
const WABE_FLAECHE = new THREE.CircleGeometry(0.86, 6).rotateX(-Math.PI / 2);
const WABE_UMRISS = new THREE.RingGeometry(0.84, 0.9, 6).rotateX(-Math.PI / 2);
const WABE_RAND = new THREE.RingGeometry(0.8, 0.95, 6).rotateX(-Math.PI / 2);
const BLASS = new THREE.Color('#f6e7b0');
const GOLD = new THREE.Color('#ffbe2e');

function overlayInstanzen(welt: Welt, eintraege: [string, number][], geo: THREE.BufferGeometry, opazitaet: number, farbe: (t: number) => THREE.Color) {
  const m = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ transparent: true, opacity: opazitaet, depthTest: false, depthWrite: false }), Math.max(1, eintraege.length));
  m.count = eintraege.length;
  m.renderOrder = 10;
  m.raycast = () => null;
  eintraege.forEach(([k, t], i) => {
    const w = welt.waben.get(k)!;
    m.setMatrixAt(i, new THREE.Matrix4().makeTranslation(w.x, welt.hoehe(w.x, w.z) + 0.08, w.z));
    m.setColorAt(i, farbe(t));
  });
  return m;
}

/** Im Baumodus: jede bebaubare Wabe als feiner Umriss, gute Stellen gefüllt – je besser, desto goldener. */
export function Overlay({ welt, werte }: { welt: Welt; werte: Map<string, number> }) {
  const [umrisse, flaechen] = useMemo(() => {
    const alle = [...werte];
    return [
      overlayInstanzen(welt, alle, WABE_UMRISS, 0.4, () => new THREE.Color('#fff6e2')),
      overlayInstanzen(welt, alle.filter(([, t]) => t > 0), WABE_FLAECHE, 0.5, (t) => BLASS.clone().lerp(GOLD, t)),
    ];
  }, [welt, werte]);
  useEffect(() => () => { umrisse.dispose(); flaechen.dispose(); }, [umrisse, flaechen]);
  return <><primitive object={umrisse} /><primitive object={flaechen} /></>;
}

export function Auswahlrand({ welt, k }: { welt: Welt; k: string }) {
  const w = welt.waben.get(k)!;
  const ref = useRef<THREE.Mesh>(null);
  useLayoutEffect(() => { if (ref.current) ref.current.renderOrder = 11; }, []);
  return (
    <mesh ref={ref} geometry={WABE_RAND} position={[w.x, welt.hoehe(w.x, w.z) + 0.1, w.z]} raycast={() => null}>
      <meshBasicMaterial color="#fff6e2" transparent depthTest={false} depthWrite={false} />
    </mesh>
  );
}
