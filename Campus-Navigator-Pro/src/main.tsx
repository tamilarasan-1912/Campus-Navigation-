import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, PointerLockControls } from "@react-three/drei";
import {
  Building2, Search, Navigation, Layers, MapPinned, FlaskConical,
  Library, ArrowUp, ArrowUpRight, ChevronRight, Map, Settings,
  LocateFixed, Compass, Footprints, MousePointer2, Accessibility, Info,
  Route as RouteIcon
} from "lucide-react";
import "./styles.css";

type PlaceType = "building" | "room" | "facility" | "gate" | "landmark";
type Place = {
  id: string;
  name: string;
  type: PlaceType;
  building?: string;
  floor: number;
  x: number;
  z: number;
  tags: string[];
  verified: boolean;
  detail?: string;
};

type Building = {
  id: string;
  name: string;
  short: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  floors: number;
  places: string[];
};

type Node = {
  id: string;
  x: number;
  z: number;
  floor: number;
  label: string;
  placeId?: string;
  building?: string;
  kind?: "road" | "entrance" | "stairs" | "room" | "facility" | "gate";
};
type Edge = { a: string; b: string; cost?: number };

/*
 * CAMPUS DATA POLICY
 * Names below are based on publicly available HITS material. The prototype
 * deliberately does not invent room numbers. Exact room coordinates/floor
 * plans should be loaded from the university's authoritative floor-plan data
 * before claiming room-level accuracy in production.
 */
const buildings: Building[] = [
  { id: "founders", name: "Founder’s Block", short: "FOUNDERS", x: -38, z: -2, width: 42, depth: 28, floors: 3, places: ["library", "padur-hall-1", "padur-hall-2"] },
  { id: "jubilee", name: "Jubilee Block", short: "JUBILEE", x: 30, z: -8, width: 48, depth: 30, floors: 7, places: ["andromeda", "robotics-lab", "stephen-hawking"] },
  { id: "main", name: "Main Block", short: "MAIN", x: -10, z: 28, width: 38, depth: 26, floors: 3, places: ["good-shepherd"] },
  { id: "sciences", name: "School of Building Sciences", short: "BUILDING SCIENCES", x: -50, z: -38, width: 36, depth: 25, floors: 3, places: ["ks-moorthy"] },
  { id: "pg", name: "PG Block", short: "PG", x: 18, z: -43, width: 34, depth: 24, floors: 4, places: ["pg-cse"] },
  { id: "edison", name: "Edison Centre", short: "EDISON", x: 52, z: 18, width: 30, depth: 24, floors: 2, places: ["edison"] },
  { id: "aviation", name: "Aviation Block", short: "AVIATION", x: 52, z: 48, width: 32, depth: 22, floors: 3, places: ["aviation"] },
  { id: "electrical", name: "School of Electrical Sciences / School of Law", short: "ELECTRICAL + LAW", x: 6, z: 2, width: 34, depth: 22, floors: 3, places: ["electrical-law"] },
];

const places: Place[] = [
  { id: "gate", name: "Main Gate", type: "gate", floor: 0, x: 0, z: 70, tags: ["entrance", "gate"], verified: true },
  { id: "library", name: "Dr. K. C. G. Verghese Research & Resource Centre (Central Library)", type: "room", building: "founders", floor: 1, x: -38, z: -2, tags: ["library", "books", "e-library"], verified: true, detail: "Founder’s Block · 3 floors" },
  { id: "padur-hall-1", name: "Padur Hall 1", type: "room", building: "founders", floor: 1, x: -31, z: -10, tags: ["seminar", "conference"], verified: true },
  { id: "padur-hall-2", name: "Padur Hall 2", type: "room", building: "founders", floor: 1, x: -45, z: 8, tags: ["seminar", "conference"], verified: true },
  { id: "andromeda", name: "Andromeda Lecture Theatre", type: "room", building: "jubilee", floor: 0, x: 30, z: -8, tags: ["lecture", "theatre", "jubilee"], verified: true },
  { id: "robotics-lab", name: "Robotics Laboratory", type: "room", building: "jubilee", floor: 1, x: 21, z: -2, tags: ["robotics", "lab", "mechatronics"], verified: true },
  { id: "stephen-hawking", name: "Stephen Hawking Lab", type: "room", building: "jubilee", floor: 0, x: 40, z: -2, tags: ["robotics", "lab"], verified: true },
  { id: "good-shepherd", name: "Good Shepherd Hall", type: "room", building: "main", floor: 0, x: -10, z: 28, tags: ["hall", "conference", "main block"], verified: true },
  { id: "ks-moorthy", name: "K.S. Moorthy Hall", type: "room", building: "sciences", floor: 0, x: -50, z: -38, tags: ["hall", "science"], verified: true },
  { id: "pg-cse", name: "PG Block · CSE / IT / ECE", type: "building", building: "pg", floor: 0, x: 18, z: -43, tags: ["cse", "it", "ece", "pg"], verified: true },
  { id: "edison", name: "Edison Centre", type: "facility", building: "edison", floor: 0, x: 52, z: 18, tags: ["liberal arts", "applied sciences"], verified: true },
  { id: "aviation", name: "Aviation Block", type: "building", building: "aviation", floor: 0, x: 52, z: 48, tags: ["aeronautical", "avionics", "simulator"], verified: true },
  { id: "electrical-law", name: "School of Electrical Sciences / School of Law", type: "building", building: "electrical", floor: 0, x: 6, z: 2, tags: ["electrical", "law"], verified: true },
  { id: "data-science", name: "Mark Zuckerberg Data Science Laboratory", type: "room", building: "pg", floor: 1, x: 10, z: -37, tags: ["data science", "artificial intelligence", "machine learning"], verified: true },
  { id: "coders-hub-1", name: "Coder’s Hub I Laboratory", type: "room", building: "pg", floor: 1, x: 25, z: -49, tags: ["cse", "programming", "lab"], verified: true },
  { id: "coders-hub-2", name: "Coder’s Hub II Laboratory", type: "room", building: "pg", floor: 1, x: 29, z: -41, tags: ["cse", "programming", "lab"], verified: true },
  { id: "ibm-ccv", name: "IBM CCV Laboratory", type: "room", building: "pg", floor: 1, x: 8, z: -49, tags: ["cloud", "virtualization", "lab"], verified: true },
  { id: "boss-mool", name: "BOSS MOOL Laboratory", type: "room", building: "pg", floor: 1, x: 17, z: -34, tags: ["linux", "open source", "lab"], verified: true },
  { id: "millennium", name: "Millennium Laboratory", type: "room", building: "pg", floor: 1, x: 28, z: -33, tags: ["networking", "lab"], verified: true },
  { id: "canteen", name: "Campus Canteen", type: "facility", floor: 0, x: 43, z: -28, tags: ["food", "canteen"], verified: true },
  { id: "clinic", name: "Campus Clinic", type: "facility", floor: 0, x: -3, z: -50, tags: ["medical", "clinic"], verified: true },
  { id: "ground", name: "Sports Ground", type: "landmark", floor: 0, x: 55, z: 62, tags: ["sports", "football", "cricket"], verified: true },
];

const nodeData: Node[] = [
  { id: "gate", x: 0, z: 70, floor: 0, label: "Main Gate", kind: "gate", placeId: "gate" },
  { id: "j1", x: 0, z: 50, floor: 0, label: "Main Junction", kind: "road" },
  { id: "j2", x: -25, z: 35, floor: 0, label: "West Junction", kind: "road" },
  { id: "j3", x: 27, z: 34, floor: 0, label: "East Junction", kind: "road" },
  { id: "j4", x: -27, z: 6, floor: 0, label: "Founder’s Road", kind: "road" },
  { id: "j5", x: 0, z: 8, floor: 0, label: "Central Road", kind: "road" },
  { id: "j6", x: 28, z: 8, floor: 0, label: "Jubilee Road", kind: "road" },
  { id: "j7", x: -27, z: -25, floor: 0, label: "South-West Road", kind: "road" },
  { id: "j8", x: 28, z: -25, floor: 0, label: "South-East Road", kind: "road" },
  { id: "founders-ent", x: -38, z: 13, floor: 0, label: "Founder’s Block Entrance", kind: "entrance", building: "founders" },
  { id: "jubilee-ent", x: 30, z: 8, floor: 0, label: "Jubilee Block Entrance", kind: "entrance", building: "jubilee" },
  { id: "main-ent", x: -10, z: 41, floor: 0, label: "Main Block Entrance", kind: "entrance", building: "main" },
  { id: "sciences-ent", x: -50, z: -25, floor: 0, label: "School of Building Sciences Entrance", kind: "entrance", building: "sciences" },
  { id: "pg-ent", x: 18, z: -30, floor: 0, label: "PG Block Entrance", kind: "entrance", building: "pg" },
  { id: "edison-ent", x: 52, z: 8, floor: 0, label: "Edison Centre Entrance", kind: "entrance", building: "edison" },
  { id: "aviation-ent", x: 52, z: 38, floor: 0, label: "Aviation Block Entrance", kind: "entrance", building: "aviation" },
  { id: "electrical-ent", x: 6, z: 14, floor: 0, label: "Electrical Sciences / Law Entrance", kind: "entrance", building: "electrical" },
];

const roomNodes: Node[] = places.filter(p => p.type === "room" || p.type === "building").map(p => ({ id: p.id, x: p.x, z: p.z, floor: p.floor, label: p.name, kind: "room", placeId: p.id, building: p.building }));
const graphNodes = [...nodeData, ...roomNodes];

const edges: Edge[] = [
  { a: "gate", b: "j1" }, { a: "j1", b: "j2" }, { a: "j1", b: "j3" },
  { a: "j2", b: "j4" }, { a: "j3", b: "j6" }, { a: "j4", b: "j5" },
  { a: "j5", b: "j6" }, { a: "j4", b: "j7" }, { a: "j6", b: "j8" },
  { a: "j7", b: "j8" }, { a: "j2", b: "founders-ent" }, { a: "j6", b: "jubilee-ent" },
  { a: "j1", b: "main-ent" }, { a: "j7", b: "sciences-ent" }, { a: "j8", b: "pg-ent" },
  { a: "j3", b: "edison-ent" }, { a: "j3", b: "aviation-ent" }, { a: "j5", b: "electrical-ent" },
  { a: "founders-ent", b: "library" }, { a: "founders-ent", b: "padur-hall-1" }, { a: "founders-ent", b: "padur-hall-2" },
  { a: "jubilee-ent", b: "andromeda" }, { a: "jubilee-ent", b: "robotics-lab" }, { a: "jubilee-ent", b: "stephen-hawking" },
  { a: "main-ent", b: "good-shepherd" }, { a: "sciences-ent", b: "ks-moorthy" },
  { a: "pg-ent", b: "pg-cse" }, { a: "pg-ent", b: "data-science" }, { a: "pg-ent", b: "coders-hub-1" },
  { a: "pg-ent", b: "coders-hub-2" }, { a: "pg-ent", b: "ibm-ccv" }, { a: "pg-ent", b: "boss-mool" }, { a: "pg-ent", b: "millennium" },
  { a: "edison-ent", b: "edison" }, { a: "aviation-ent", b: "aviation" }, { a: "electrical-ent", b: "electrical-law" },
];

function getNode(id: string) { return graphNodes.find(n => n.id === id)!; }
function nodeDistance(a: Node, b: Node) { return Math.hypot(a.x - b.x, (a.floor - b.floor) * 8, a.z - b.z); }
function buildRoute(from: string, to: string): Node[] {
  const dist = new Map(graphNodes.map(n => [n.id, Infinity]));
  const prev = new Map<string, string>();
  const open = new Set(graphNodes.map(n => n.id));
  dist.set(from, 0);
  while (open.size) {
    let u: string | undefined;
    for (const id of open) if (u === undefined || (dist.get(id) ?? Infinity) < (dist.get(u) ?? Infinity)) u = id;
    if (!u) break;
    open.delete(u);
    if (u === to) break;
    for (const e of edges) {
      const v = e.a === u ? e.b : e.b === u ? e.a : null;
      if (!v || !open.has(v)) continue;
      const nd = (dist.get(u) ?? Infinity) + (e.cost ?? nodeDistance(getNode(u), getNode(v)));
      if (nd < (dist.get(v) ?? Infinity)) { dist.set(v, nd); prev.set(v, u); }
    }
  }
  if (from !== to && !prev.has(to)) return [];
  const ids = [to]; let cur = to;
  while (cur !== from) { cur = prev.get(cur)!; ids.push(cur); }
  return ids.reverse().map(getNode);
}

function nearestNode(x: number, z: number) {
  return graphNodes.filter(n => n.floor === 0).reduce((best, n) =>
    Math.hypot(n.x - x, n.z - z) < Math.hypot(best.x - x, best.z - z) ? n : best, graphNodes[0]);
}

function useDeviceLocation(enabled: boolean, onPosition: (p: { x: number; z: number }) => void) {
  const [status, setStatus] = useState<"idle" | "active" | "denied" | "unsupported">("idle");
  useEffect(() => {
    if (!enabled) { setStatus("idle"); return; }
    if (!navigator.geolocation) { setStatus("unsupported"); return; }
    const campusLat = 12.8028, campusLng = 80.2247;
    const id = navigator.geolocation.watchPosition(pos => {
      const latScale = 111320;
      const lngScale = 111320 * Math.cos(campusLat * Math.PI / 180);
      onPosition({ x: (pos.coords.longitude - campusLng) * lngScale, z: -(pos.coords.latitude - campusLat) * latScale });
      setStatus("active");
    }, () => setStatus("denied"), { enableHighAccuracy: true, maximumAge: 1000, timeout: 8000 });
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled, onPosition]);
  return status;
}

function RouteLine({ path }: { path: Node[] }) {
  if (path.length < 2) return null;
  const points = path.map(n => [n.x, n.floor * 4 + 0.3, n.z] as [number, number, number]);
  return <>{points.slice(0, -1).map((a, i) => {
    const b = points[i + 1];
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const len = Math.hypot(dx, dy, dz);
    return <mesh key={i} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} rotation={[0, -Math.atan2(dz, dx), 0]}>
      <boxGeometry args={[len, 0.22, 1.15]} /><meshStandardMaterial color="#45f0a6" emissive="#1edb8b" emissiveIntensity={1.8} />
    </mesh>;
  })}</>;
}

function Arrow({ p, rotation = 0 }: { p: [number, number, number]; rotation?: number }) {
  return <mesh position={[p[0], p[1] + 0.8, p[2]]} rotation={[-Math.PI / 2, 0, rotation]}>
    <coneGeometry args={[0.7, 1.8, 4]} /><meshStandardMaterial color="#5af5b0" emissive="#24df94" emissiveIntensity={2} />
  </mesh>;
}

function FirstPersonController({ path, walkEnabled, startPosition, onPlayerMove }: { path: Node[]; walkEnabled: boolean; startPosition: { x: number; z: number }; onPlayerMove: (p: { x: number; z: number; yaw: number }) => void }) {
  const { camera } = useThree();
  const velocity = useRef({ x: 0, z: 0 });
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const start = path[0] ?? getNode("gate");
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) { camera.position.set(startPosition.x, 2.2, startPosition.z); initialized.current = true; }
    const down = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [camera, start.x, start.z, startPosition.x, startPosition.z]);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (typeof event.alpha === "number") yaw.current = -event.alpha * Math.PI / 180;
    };
    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, []);

  useFrame((_, delta) => {
    if (!walkEnabled) return;
    const forward = Number(keys.current.KeyW || keys.current.ArrowUp) - Number(keys.current.KeyS || keys.current.ArrowDown);
    const strafe = Number(keys.current.KeyD || keys.current.ArrowRight) - Number(keys.current.KeyA || keys.current.ArrowLeft);
    const speed = keys.current.ShiftLeft || keys.current.ShiftRight ? 11 : 6;
    const sin = Math.sin(yaw.current), cos = Math.cos(yaw.current);
    velocity.current.x += ((sin * forward + cos * strafe) * speed - velocity.current.x) * Math.min(1, delta * 10);
    velocity.current.z += ((cos * forward - sin * strafe) * speed - velocity.current.z) * Math.min(1, delta * 10);
    camera.position.x += velocity.current.x * delta;
    camera.position.z += velocity.current.z * delta;
    camera.position.y = 2.2;
    onPlayerMove({ x: camera.position.x, z: camera.position.z, yaw: yaw.current });
  });
  return <PointerLockControls onChange={() => { yaw.current = camera.rotation.y; }} />;
}

function CampusWorld({ selected, path, fps, startPosition, onSelect, onPlayerMove }: { selected: string | null; path: Node[]; fps: boolean; startPosition: { x: number; z: number }; onSelect: (id: string) => void; onPlayerMove: (p: { x: number; z: number; yaw: number }) => void }) {
  const target = path[path.length - 1];
  return <Canvas camera={{ position: [0, 100, 140], fov: fps ? 75 : 42 }}>
    <color attach="background" args={["#06101b"]} />
    <ambientLight intensity={0.7} /><directionalLight position={[60, 100, 40]} intensity={1.5} />
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[220, 190]} /><meshStandardMaterial color="#0b1726" /></mesh>
    <gridHelper args={[220, 22, "#1b3553", "#10253c"]} position={[0, 0.03, 0]} />
    {buildings.map(b => <group key={b.id} position={[b.x, 0, b.z]} onClick={(e) => { e.stopPropagation(); onSelect(b.id); }}>
      <mesh position={[0, b.floors * 2, 0]}>
        <boxGeometry args={[b.width, b.floors * 4, b.depth]} />
        <meshStandardMaterial color={selected === b.id ? "#168db2" : "#203450"} emissive={selected === b.id ? "#18d4f0" : "#07111f"} emissiveIntensity={selected === b.id ? 0.9 : 0.15} metalness={0.2} />
      </mesh>
      {!fps && <Html position={[0, b.floors * 4 + 5, 0]} center><span className={selected === b.id ? "map-label active" : "map-label"}>{b.name}</span></Html>}
    </group>)}
    {!fps && places.filter(p => p.type !== "room").map(p => <Html key={p.id} position={[p.x, 2, p.z]} center><span className="map-label small">{p.name}</span></Html>)}
    <RouteLine path={path} />
    {path.slice(1).map((n, i) => <Arrow key={n.id} p={[n.x, n.floor * 4 + 0.5, n.z]} rotation={i % 2 ? 0.3 : 0} />)}
    {target && <mesh position={[target.x, target.floor * 4 + 1.2, target.z]}><sphereGeometry args={[1.1, 20, 20]} /><meshStandardMaterial color="#ffb84d" emissive="#ff7a00" emissiveIntensity={2.5} /></mesh>}
    {fps && <FirstPersonController path={path} walkEnabled={fps} startPosition={startPosition} onPlayerMove={onPlayerMove} />}
  </Canvas>;
}

function App() {
  const [query, setQuery] = useState("");
  const [destination, setDestination] = useState<string | null>(null);
  const [originNode, setOriginNode] = useState("gate");
  const [selected, setSelected] = useState<string | null>("founders");
  const [fps, setFps] = useState(false);
  const [navigation, setNavigation] = useState(false);
  const [locationMode, setLocationMode] = useState<"manual" | "gps">("manual");
  const [player, setPlayer] = useState({ x: 0, z: 70, yaw: 0 });
  const [gpsStatus, setGpsStatus] = useState<"idle" | "active" | "denied" | "unsupported">("idle");

  const results = useMemo(() => places.filter(p => p.verified && (`${p.name} ${p.tags.join(" ")}`).toLowerCase().includes(query.toLowerCase())), [query]);
  const path = destination ? buildRoute(originNode, destination) : [];
  const destinationPlace = places.find(p => p.id === destination);

  const setGpsPosition = useCallback((p: { x: number; z: number }) => {
    setPlayer(v => ({ ...v, x: p.x, z: p.z }));
    const near = nearestNode(p.x, p.z);
    setOriginNode(near.id);
  }, []);
  const status = useDeviceLocation(locationMode === "gps", setGpsPosition);
  useEffect(() => setGpsStatus(status), [status]);

  const distance = path.reduce((s, n, i) => i ? s + nodeDistance(path[i - 1], n) : 0, 0);
  const currentNearest = nearestNode(player.x, player.z);

  const startNavigation = () => {
    if (!destination) return;
    setNavigation(true);
    setFps(true);
  };

  return <div className="app">
    <header className="topbar">
      <div className="brand"><div className="brand-icon"><Navigation /></div><div><b>Campus Live Map</b><small>HITS Digital Twin · FPS Navigation</small></div></div>
      <div className="steps"><span className="current">1. CAMPUS</span><span>2. SEARCH</span><span>3. ROUTE</span><span>4. WALK MODE</span><span>5. ARRIVAL</span></div>
      <button className="admin"><Settings size={16} /> Admin</button>
    </header>
    <main>
      <section className="hero-grid">
        <div className={fps ? "viewport fps-viewport" : "viewport"}>
          <CampusWorld selected={selected} path={navigation ? path : []} fps={fps} startPosition={{ x: player.x, z: player.z }} onSelect={id => { setSelected(id); setFps(false); }} onPlayerMove={p => setPlayer(p)} />
          {!fps && <div className="map-mode-badge"><Map size={14} /> CAMPUS MAP · REAL HITS LOCATIONS</div>}
          {fps && <div className="fps-overlay"><div className="crosshair">+</div><div className="fps-hint"><MousePointer2 size={14} /> Click to capture mouse · WASD / Arrow keys to walk · Shift to sprint</div></div>}
          <div className="stage-controls">
            <button className={!fps ? "on" : ""} onClick={() => setFps(false)}><Map size={14} /> Map</button>
            <button className={fps ? "on" : ""} onClick={() => setFps(true)}><Footprints size={14} /> Walk Mode</button>
            <button onClick={() => setLocationMode(locationMode === "gps" ? "manual" : "gps")}><LocateFixed size={14} /> {locationMode === "gps" ? "GPS On" : "Use GPS"}</button>
          </div>
          {fps && navigation && <div className="fps-direction-card"><span>NEXT</span><b>{path.length > 1 ? path[1].label : destinationPlace?.name}</b><small>Follow the glowing route · {Math.round(distance)} m total</small></div>}
        </div>

        <aside className="panel">
          <div className="search"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search real HITS buildings, halls, labs..." /></div>
          <div className="panel-title"><span>VERIFIED HITS LOCATIONS</span><b>{results.length}</b></div>
          <div className="data-note"><Info size={14} /> Names are sourced from public HITS material. Room numbers are intentionally not invented.</div>
          <div className="results">
            {results.map(p => <button className={destination === p.id ? "result picked" : "result"} key={p.id} onClick={() => { setDestination(p.id); setSelected(p.building ?? selected); }}>
              <span className="result-icon">{p.type === "room" ? <FlaskConical /> : p.type === "facility" ? <Library /> : p.type === "gate" ? <MapPinned /> : <Building2 />}</span>
              <span><b>{p.name}</b><small>{p.detail ?? `${p.type.toUpperCase()} · ${p.floor === 0 ? "Ground floor" : `Floor ${p.floor}`}`}</small></span><ChevronRight size={16} />
            </button>)}
          </div>
          <div className="route-card">
            <div className="route-head"><RouteIcon size={16} /> LIVE ROUTING</div>
            <div className="select-row"><label>START</label><select value={originNode} onChange={e => { const id = e.target.value; const n = getNode(id); setOriginNode(id); setLocationMode("manual"); setPlayer(v => ({ ...v, x: n.x, z: n.z })); }}><option value="gate">Main Gate</option>{graphNodes.filter(n => n.kind === "road" || n.kind === "entrance").map(n => <option value={n.id} key={n.id}>{n.label}</option>)}</select></div>
            <button className={locationMode === "gps" ? "location-live active" : "location-live"} onClick={() => setLocationMode("gps")}><LocateFixed size={15} /> {gpsStatus === "active" ? "GPS location active" : "Use my current location"}</button>
            {locationMode === "gps" && gpsStatus === "denied" && <small className="warning">Location permission was denied. Use manual start or enable browser location permission.</small>}
            {destinationPlace && <div className="destination"><span>DESTINATION</span><b>{destinationPlace.name}</b><small>{destinationPlace.detail ?? "Verified campus location"}</small></div>}
            <button className="primary" disabled={!destination || !path.length} onClick={startNavigation}><Navigation size={16} /> {navigation ? "NAVIGATION ACTIVE" : "START WALKING"}</button>
            {path.length > 0 && <div className="route-stats"><span>{Math.round(distance)} m</span><span>≈ {Math.max(1, Math.round(distance / 75))} min</span><span>{new Set(path.map(n => n.floor)).size} level{new Set(path.map(n => n.floor)).size > 1 ? "s" : ""}</span></div>}
          </div>
          <div className="position-card"><Compass size={15} /><span>Nearest route point</span><b>{currentNearest.label}</b></div>
        </aside>
      </section>

      {navigation && destinationPlace && <section className="guidance">
        <div><b>FIRST-PERSON GUIDANCE</b><small>Move through the campus as the route updates around your current position.</small></div>
        <div className="guide-step"><ArrowUp /><span>Walk forward</span><small>Keep the green route in front of you</small></div>
        <div className="guide-step"><ArrowUpRight /><span>Follow route</span><small>{Math.round(distance)} m remaining</small></div>
        <div className="guide-step"><MapPinned /><span>Destination</span><small>{destinationPlace.name}</small></div>
        <button onClick={() => setNavigation(false)}>Stop</button>
      </section>}
      <section className="feature-strip">
        {[[Map, "Real HITS campus directory"], [LocateFixed, "Current location"], [RouteIcon, "Graph shortest path"], [Footprints, "FPS-style walk mode"], [Compass, "Camera heading"], [Accessibility, "Accessible routing ready"], [Layers, "Campus layers"], [Settings, "Admin data model"]].map(([I, t]) => <div key={t as string}><I size={19} /><span>{t as string}</span></div>)}
      </section>
    </main>
  </div>;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
