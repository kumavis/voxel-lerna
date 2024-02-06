var Mesh = require('.')
var voxelUtil = require('voxel')
const THREE = require('three')

var cw = 700, ch = 500;
var camera = new THREE.PerspectiveCamera(55, cw / ch, 1, 1000);
var scene = new THREE.Scene();
scene.add(camera)
globalThis.scene = scene

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

const chunk = voxelUtil.generate([0,0,0], [3,3,3], () => Math.random() > 0.5 ? 1 : 0)
// Schema patch for voxel-mesh which expects (voxel@^0.3.0)
if (chunk.data && chunk.shape) {
  chunk.voxels = chunk.data
  chunk.dims = chunk.shape
}

var scale = new THREE.Vector3(1, 1, 1)
var mesh = new Mesh(chunk, voxelUtil.meshers.culled, scale, THREE)
scene.add(mesh.createSurfaceMesh())
scene.add(mesh.createWireMesh())
mesh.setPosition(0, 0, 0)
globalThis.mesh = mesh

var render = function () {
  window.requestAnimationFrame(render, renderer.domElement);

  const rad = 8 * Date.now() / 1000
  const angle = rad / (cw / 2) + (2 * Math.PI * 0.75)
  camera.position.x = -Math.cos(angle);
  camera.position.z = -Math.sin(angle);
  camera.position.y = (0.1/(ch/2))*1.5+0.2;
  camera.position.setLength(7);
  camera.lookAt(new THREE.Vector3(0, 1.5, 0));

  renderer.render(scene, camera);
};

render()