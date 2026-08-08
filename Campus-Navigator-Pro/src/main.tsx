import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import {
  Building2, Search, Navigation, Layers, MapPinned, FlaskConical,
  Library, Utensils, Trees, ArrowUp, ArrowUpRight, ArrowUpLeft,
  CornerUpLeft, CornerUpRight, ChevronRight, Map, Settings
} from "lucide-react";
import "./styles.css";

type Room = {
  id: string; name: string; code: string; type: string;
  floor: number; x: number; z: number; tags: string[];
};
type Building = {
  id: string; name: string; code: string; x: number; z: number;
  width: number; depth: number; floors: number; rooms: Room[];
};
type Facility = { id: string; name: string; kind: string; x: number; z: number; };

type Node = { id: string; x: number; z: number; floor: number; building?: string; room?: string; label: string };
type Edge = { a: string; b: string; cost?: number };

const buildings: Building[] = [
  {
    id:"a", name:"Block A", code:"A", x:-42,z:8,width:44,depth:30,floors:3,
    rooms:[
      {id:"a204",name:"AI Lab",code:"204",type:"Lab",floor:2,x:5,z:-7,tags:["AI","machine learning","GPU"]},
      {id:"a205",name:"DS Lab",code:"205",type:"Lab",floor:2,x:14,z:7,tags:["Data Science","Python"]},
      {id:"a201",name:"Classroom 201",code:"201",type:"Classroom",floor:2,x:-12,z:-7,tags:[]},
      {id:"a202",name:"Project Room",code:"202",type:"Room",floor:2,x:-12,z:7,tags:[]},
      {id:"a101",name:"Classroom 101",code:"101",type:"Classroom",floor:1,x:8,z:-7,tags:[]},
    ]
  },
  {
    id:"b", name:"Block B", code:"B", x:40,z:-5,width:40,depth:28,floors:3,
    rooms:[
      {id:"b201",name:"Robotics Lab",code:"201",type:"Lab",floor:2,x:-8,z:-7,tags:["Robotics"]},
      {id:"b202",name:"IoT Lab",code:"202",type:"Lab",floor:2,x:8,z:7,tags:["IoT","Embedded"]},
    ]
  },
  {
    id:"lib", name:"Library", code:"LIB", x:-6,z:-50,width:36,depth:26,floors:2,
    rooms:[
      {id:"l101",name:"Digital Library",code:"101",type:"Library",floor:1,x:0,z:-6,tags:["e-resources"]},
      {id:"l001",name:"Reading Hall",code:"001",type:"Library",floor:0,x:0,z:6,tags:[]},
    ]
  },
  {
    id:"can", name:"Canteen", code:"CAN", x:46,z:-48,width:28,depth:20,floors:1,
    rooms:[
      {id:"c001",name:"Food Court",code:"001",type:"Canteen",floor:0,x:0,z:0,tags:["food","lunch"]},
    ]
  }
];

const facilities: Facility[] = [
  {id:"gate",name:"Main Gate",kind:"Gate",x:0,z:72},
  {id:"play",name:"Play Ground",kind:"Sports",x:54,z:38},
  {id:"lawn",name:"Central Lawn",kind:"Garden",x:0,z:18},
];

function makeGraph() {
  const nodes: Node[] = [
    {id:"gate",x:0,z:66,floor:0,label:"Main Gate"},
    {id:"j1",x:0,z:44,floor:0,label:"Central Junction"},
    {id:"west",x:-22,z:26,floor:0,label:"West Walkway"},
    {id:"east",x:22,z:26,floor:0,label:"East Walkway"},
    {id:"aent",x:-42,z:23,floor:0,building:"a",label:"Block A Entrance"},
    {id:"bent",x:40,z:10,floor:0,building:"b",label:"Block B Entrance"},
    {id:"lent",x:-6,z:-37,floor:0,building:"lib",label:"Library Entrance"},
    {id:"cent",x:46,z:-35,floor:0,building:"can",label:"Canteen Entrance"},
  ];
  for (const b of buildings) {
    for (let f=0; f<b.floors; f++) {
      nodes.push({id:`${b.id}-${f}-stair`,x:10,z:0,floor:f,building:b.id,label:`${b.name} staircase F${f}`});
      for (const r of b.rooms.filter(r=>r.floor===f)) {
        nodes.push({id:r.id,x:r.x,z:r.z,floor:f,building:b.id,room:r.id,label:r.name});
      }
    }
  }
  const edges: Edge[] = [
    {a:"gate",b:"j1"},{a:"j1",b:"west"},{a:"j1",b:"east"},
    {a:"west",b:"aent"},{a:"east",b:"bent"},{a:"west",b:"lent"},
    {a:"east",b:"cent"},{a:"aent",b:"a-0-stair"},{a:"bent",b:"b-0-stair"},
    {a:"lent",b:"lib-0-stair"},{a:"cent",b:"can-0-stair"}
  ];
  for (const b of buildings) {
    for (let f=0; f<b.floors; f++) {
      const stair = `${b.id}-${f}-stair`;
      for (const r of b.rooms.filter(r=>r.floor===f)) edges.push({a:stair,b:r.id});
      if (f < b.floors-1) edges.push({a:stair,b:`${b.id}-${f+1}-stair`,cost:14});
    }
  }
  return {nodes,edges};
}
const graph = makeGraph();

function dist(a:Node,b:Node) { return Math.hypot(a.x-b.x,(a.floor-b.floor)*8,a.z-b.z); }

function route(from:string,to:string): Node[] {
  const d = new Map<string,number>(graph.nodes.map(n=>[n.id,Infinity]));
  const prev = new Map<string,string>();
  const open = new Set(graph.nodes.map(n=>n.id));
  d.set(from,0);
  while(open.size) {
    let u:string|undefined;
    for(const id of open) if(u===undefined || (d.get(id)??Infinity)<(d.get(u)??Infinity)) u=id;
    if(!u) break;
    open.delete(u);
    if(u===to) break;
    for(const e of graph.edges) {
      const v=e.a===u?e.b:e.b===u?e.a:null;
      if(!v || !open.has(v)) continue;
      const a=graph.nodes.find(n=>n.id===u)!, b=graph.nodes.find(n=>n.id===v)!;
      const nd=(d.get(u)??Infinity)+(e.cost??dist(a,b));
      if(nd<(d.get(v)??Infinity)){d.set(v,nd);prev.set(v,u);}
    }
  }
  if(!prev.has(to) && from!==to) return [];
  const ids=[to]; let cur=to;
  while(cur!==from){cur=prev.get(cur)!;ids.push(cur);}
  return ids.reverse().map(id=>graph.nodes.find(n=>n.id===id)!);
}

function Arrow({p}:{p:[number,number,number]}) {
  const ref=React.useRef<any>(null);
  useFrame(({clock})=>{ if(ref.current) ref.current.position.y=p[1]+1.2+Math.sin(clock.elapsedTime*3+p[0])*0.25; });
  return <mesh ref={ref} position={[p[0],p[1]+1.2,p[2]]} rotation={[-Math.PI/2,0,0]}>
    <coneGeometry args={[0.8,2.2,4]}/><meshStandardMaterial color="#55f0b0" emissive="#20d990" emissiveIntensity={2}/>
  </mesh>
}

function Campus3D({selected,onSelect,path}:{selected:string|null,onSelect:(id:string)=>void,path:Node[]}) {
  return <Canvas camera={{position:[0,120,150],fov:42}}>
    <color attach="background" args={["#07101d"]}/>
    <ambientLight intensity={0.65}/><directionalLight position={[60,120,50]} intensity={1.3}/>
    <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[230,200]}/><meshStandardMaterial color="#0c1828"/></mesh>
    <gridHelper args={[220,22,"#1d3553","#12253d"]} position={[0,.03,0]}/>
    {facilities.map(f=><group key={f.id} position={[f.x,0,f.z]}>
      <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[f.id==="play"?58:30,f.id==="play"?38:20]}/><meshStandardMaterial color="#1d7f65" transparent opacity={.25}/></mesh>
      <Html position={[0,2,0]} center><span className="map-label">{f.name}</span></Html>
    </group>)}
    {buildings.map(b=><group key={b.id} position={[b.x,0,b.z]} onClick={()=>onSelect(b.id)}>
      <mesh position={[0,b.floors*2,0]}>
        <boxGeometry args={[b.width,b.floors*4,b.depth]}/>
        <meshStandardMaterial color={selected===b.id?"#168db2":"#1d2e49"} emissive={selected===b.id?"#18d4f0":"#07111f"} emissiveIntensity={selected===b.id?.8:.15} metalness={.25}/>
      </mesh>
      <Html position={[0,b.floors*4+5,0]} center><span className={"map-label "+(selected===b.id?"active":"")}>{b.name}</span></Html>
    </group>)}
    {path.map((n,i)=><Arrow key={n.id} p={[n.x,n.floor*4+0.8,n.z]}/>)}
    <OrbitControls minDistance={45} maxDistance={330} maxPolarAngle={Math.PI/2.08}/>
  </Canvas>
}

function FloorMap({b,floor,path,onRoom}:{b:Building,floor:number,path:Node[],onRoom:(r:Room)=>void}) {
  const size=100, scale=1.7;
  return <div className="floor-map">
    <svg viewBox={`0 0 ${size} ${size}`} preserveAspectRatio="xMidYMid meet">
      <rect x="4" y="8" width="92" height="84" rx="2" className="shell"/>
      <rect x="8" y="45" width="84" height="10" className="corridor"/>
      {b.rooms.filter(r=>r.floor===floor).map(r=>{
        const x=50+r.x*scale, y=50+r.z*scale;
        return <g key={r.id} onClick={()=>onRoom(r)} className="room-node">
          <rect x={x-r.width/2} y={y-6} width={Math.max(12,r.code.length*5+7)} height="12" rx="1"
            className={path.some(n=>n.id===r.id)?"destination-room":"room-box"}/>
          <text x={x} y={y+1} textAnchor="middle">{r.code}</text>
        </g>
      })}
      {path.filter(n=>n.floor===floor&&n.building===b.id).map((n,i,arr)=>
        i>0?<line key={n.id} x1={50+arr[i-1].x*scale} y1={50+arr[i-1].z*scale} x2={50+n.x*scale} y2={50+n.z*scale} className="route-line"/>:null)}
    </svg>
  </div>
}

function App(){
  const [selected,setSelected]=useState<string|null>("a");
  const [floor,setFloor]=useState(2);
  const [query,setQuery]=useState("");
  const [destination,setDestination]=useState<Room|null>(null);
  const [origin,setOrigin]=useState("gate");
  const [stage,setStage]=useState<"campus"|"entry"|"floor">("campus");
  const [guided,setGuided]=useState(false);

  const b=buildings.find(x=>x.id===selected) ?? buildings[0];
  const results=useMemo(()=>[...buildings.flatMap(b=>b.rooms),...facilities.map(f=>({id:f.id,name:f.name,code:"",type:f.kind,floor:0,x:f.x,z:f.z,tags:[]} as Room))]
    .filter(x=>(x.name+" "+x.code+" "+x.tags.join(" ")).toLowerCase().includes(query.toLowerCase())),[query]);
  const target=destination?destination.id:"";
  const path=target?route(origin,target):[];

  return <div className="app">
    <header className="topbar">
      <div className="brand"><div className="brand-icon"><Navigation/></div><div><b>Campus Live Map</b><small>3D Digital Twin · ₹0 MVP</small></div></div>
      <div className="steps">{["3D CAMPUS","BUILDING ENTRY","FLOOR MAP","SEARCH","ROUTING","GUIDANCE"].map((s,i)=><span className={(i===0&&stage==="campus")||(i===1&&stage==="entry")||(i>=2&&stage==="floor")?"current":""} key={s}>{i+1}. {s}</span>)}</div>
      <button className="admin"><Settings size={16}/> Admin</button>
    </header>

    <main>
      <section className="hero-grid">
        <div className="viewport">
          {stage==="campus" && <Campus3D selected={selected} onSelect={id=>{setSelected(id);setStage("entry")}} path={guided?path:[]}/>}
          {stage==="entry" && <div className="entry-scene" onClick={()=>setStage("floor")}>
            <div className="entry-building"><div className="windows"></div><div className="entrance-door">ENTER {b.name} →</div></div>
            <div className="entry-arrow">⬆</div>
            <span className="entry-title">{b.name} · MAIN ENTRANCE</span>
          </div>}
          {stage==="floor" && <FloorMap b={b} floor={floor} path={path} onRoom={r=>setDestination(r)}/>}
          <div className="stage-controls">
            <button onClick={()=>setStage("campus")}><Map size={14}/> 3D</button>
            <button disabled={!selected} onClick={()=>setStage("entry")}><Building2 size={14}/> Entry</button>
            <button disabled={!selected} onClick={()=>setStage("floor")}><Layers size={14}/> Floor</button>
          </div>
          {stage==="floor" && <div className="floors">{Array.from({length:b.floors},(_,i)=><button className={floor===i?"on":""} onClick={()=>setFloor(i)} key={i}>{i===0?"GF":`${i}F`}</button>)}</div>}
        </div>

        <aside className="panel">
          <div className="search">
            <Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search labs, rooms, facilities..."/>
          </div>
          <div className="panel-title"><span>ROOM / LAB DATABASE</span><b>{results.length}</b></div>
          <div className="results">
            {results.map(r=><button className={"result "+(destination?.id===r.id?"picked":"")} key={r.id} onClick={()=>{setDestination(r); if("floor" in r && r.floor!==0){setSelected(buildings.find(x=>x.rooms.some(y=>y.id===r.id))?.id??selected);setFloor(r.floor);setStage("floor")}}}>
              <span className="result-icon">{r.type==="Lab"?<FlaskConical/>:r.type==="Library"?<Library/>:r.type==="Canteen"?<Utensils/>:<MapPinned/>}</span>
              <span><b>{r.name}{r.code&&` (${r.code})`}</b><small>{r.type} · Floor {r.floor}</small></span><ChevronRight size={16}/>
            </button>)}
          </div>
          <div className="route-card">
            <div className="route-head"><Navigation size={16}/> ROUTE & GUIDANCE</div>
            <div className="select-row"><label>START</label><select value={origin} onChange={e=>setOrigin(e.target.value)}><option value="gate">Main Gate</option>{graph.nodes.filter(n=>n.building).slice(0,12).map(n=><option value={n.id} key={n.id}>{n.label}</option>)}</select></div>
            <div className="destination"><span>DESTINATION</span><b>{destination?.name??"Select a room or facility"}</b></div>
            <button className="primary" disabled={!destination||!path.length} onClick={()=>setGuided(true)}><Navigation size={16}/> {guided?"NAVIGATION ACTIVE":"START NAVIGATION"}</button>
            {path.length>0 && <div className="route-stats"><span>{Math.round(path.reduce((s,n,i)=>i?s+dist(path[i-1],n):0,0))} m</span><span>≈ {Math.max(1,Math.round(path.length*0.35))} min</span><span>{new Set(path.map(n=>n.floor)).size} floors</span></div>}
          </div>
        </aside>
      </section>

      {guided && path.length>0 && <section className="guidance">
        <div><b>GUIDED NAVIGATION</b><small>Follow the animated arrows to {destination?.name}</small></div>
        <div className="guide-step"><ArrowUp/><span>Go straight</span><small>Continue along the highlighted path</small></div>
        <div className="guide-step"><ArrowUpRight/><span>Follow route</span><small>Floor {path[path.length-1].floor}</small></div>
        <div className="guide-step"><MapPinned/><span>Destination</span><small>{destination?.name}</small></div>
      </section>}

      <section className="feature-strip">
        {[
          [Map,"3D Interactive Campus"],[Building2,"Indoor Navigation"],[Search,"Search Labs & Rooms"],
          [Navigation,"Shortest Path Routing"],[Layers,"Multi-floor Support"],[ArrowUp,"Guided Arrows"],
          [MapPinned,"QR / Manual Positioning"],[Settings,"Admin Data Management"]
        ].map(([I,t])=><div key={t as string}><I size={19}/><span>{t as string}</span></div>)}
      </section>
    </main>
  </div>
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);