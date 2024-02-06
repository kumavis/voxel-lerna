const THREE = require('three')
var skin = require('./')
var walk = require('voxel-walk')

var cw = 250, ch = 500;
var camera = new THREE.PerspectiveCamera(55, cw / ch, 1, 1000);
var scene = new THREE.Scene();
scene.add(camera)
var renderer = new THREE.WebGLRenderer({
  antialias: true
})
renderer.setSize(cw, ch)
const skyColor = new THREE.Color(0xFFFFFF)
renderer.setClearColor(skyColor, 1.0)
renderer.clear()
var threecanvas = renderer.domElement;
document.body.appendChild(threecanvas);
var ambientLight
ambientLight = new THREE.AmbientLight(0xaaaaaa)
scene.add(ambientLight)
var light  = new THREE.DirectionalLight( 0xffffff )
light.position.set( Math.random(), Math.random(), Math.random() ).normalize()
scene.add( light )
camera.lookAt(new THREE.Vector3(0, 0, 0))
scene.add(camera)

var plane = new THREE.Mesh(
  new THREE.PlaneGeometry( 25, 25 ),
  new THREE.MeshBasicMaterial({
    color: 0xf0f0f0,
  })
)
plane.rotation.x = - Math.PI / 2
scene.add( plane )
window.plane = plane

globalThis.THREE = THREE
globalThis.scene = scene

var pngURL = window.location.hash
if (pngURL === '' || pngURL === '#') pngURL = 'debug-skin.png'
else pngURL = pngURL.substr(1, pngURL.length - 1)
window.viking = skin(THREE, pngURL)
scene.add(viking.mesh)

let isActivated = false
let time = 0;
let lastTime = Date.now();
var rad = 0;

var render = function () {
  window.requestAnimationFrame(render, renderer.domElement);
  
  // animate
  if (isActivated) {    
    const now = Date.now()
    time += (now - lastTime) /1000;
    lastTime = now

    walk.render(viking, time)
    rad += 2;
  }
  
  const angle = rad / (cw / 2) + (2 * Math.PI * 0.75)
  camera.position.x = -Math.cos(angle);
  camera.position.z = -Math.sin(angle);
  camera.position.y = (0.1/(ch/2))*1.5+0.2;
  camera.position.setLength(70);
  camera.lookAt(new THREE.Vector3(0, 1.5, 0));
  
  renderer.render(scene, camera);
};

render()

document.querySelector('canvas').addEventListener('click', () => {
  isActivated = !isActivated
  if (isActivated) {
    lastTime = Date.now()    
  }
})