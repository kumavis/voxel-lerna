const THREE = require('three');
const control = require('voxel-control');
const physical = require('voxel-physical');
var kb = require('kb-controls')
const interact = require('interact')

var walk = require('voxel-walk');
const voxelView = require('voxel-view');

var scene = new THREE.Scene();


const view = voxelView(THREE, {
    width: this.width,
    height: this.height,
    skyColor: this.skyColor,
    antialias: this.antialias
  })
view.appendTo('#container')
// adds camera to scene
view.bindToScene(scene)
const { camera } = view

var cw = 250, ch = 500;
// var camera = new THREE.PerspectiveCamera(55, cw / ch, 1, 1000);
// var scene = new THREE.Scene();
// scene.add(camera)
// var renderer = new THREE.WebGLRenderer({
//   antialias: true
// })
// renderer.setSize(cw, ch)
// const skyColor = new THREE.Color(0xFFFFFF)
// renderer.setClearColor(skyColor, 1.0)
// renderer.clear()
// var threecanvas = renderer.domElement;
// document.body.appendChild(threecanvas);

var ambientLight
ambientLight = new THREE.AmbientLight(0xaaaaaa)
scene.add(ambientLight)
var light  = new THREE.DirectionalLight( 0xffffff )
light.position.set( Math.random(), Math.random(), Math.random() ).normalize()
scene.add( light )

// camera.lookAt(new THREE.Vector3(0, 0, 0))
// scene.add(camera)


// var plane = new THREE.Mesh(
//   new THREE.PlaneGeometry( 25, 25 ),
//   new THREE.MeshBasicMaterial({
//     color: 0xf0f0f0,
//   })
// )
// plane.rotation.x = - Math.PI / 2
// scene.add( plane )
// window.plane = plane

globalThis.THREE = THREE
globalThis.scene = scene

var pngURL = window.location.hash
if (pngURL === '' || pngURL === '#') pngURL = 'debug-skin.png'
else pngURL = pngURL.substr(1, pngURL.length - 1)


// from voxel-engine
const makePhysical = function(target, envelope, blocksCreation) {
    var vel = [0.9, 0.1, 0.9]
    envelope = envelope || [2/3, 1.5, 2/3]
    var obj = physical(target, [], envelope, {x: vel[0], y: vel[1], z: vel[2]})
    obj.blocksCreation = !!blocksCreation
    return obj
}

const buttons = kb(document.body, {
    'W': 'forward'
  , 'A': 'left'
  , 'S': 'backward'
  , 'D': 'right'
  , '<up>': 'forward'
  , '<left>': 'left'
  , '<down>': 'backward'
  , '<right>': 'right'
  , '<mouse 1>': 'fire'
  , '<mouse 3>': 'firealt'
  , '<space>': 'jump'
  , '<shift>': 'crouch'
  , '<control>': 'alt'
  })
const controls = control(buttons, {})

let paused = false

// from voxel-engine
const onControlChange = (gained, controlStream) => {
    console.log('onControlChange <-----')

    paused = false

    if (!gained) {
      buttons.disable()
      return
    }
  
    buttons.enable()
    console.log('buttons enable')
    controlStream.pipe(controls.createWriteRotationStream())
}

// from voxel-engine
interact(view.element)
    .on('attain', controlStream => onControlChange(true, controlStream))
    .on('release', controlStream => onControlChange(false, controlStream))
    // .on('opt-out', onControlOptOut())

var game = {
    THREE,
    scene,
    camera,
    // gravity: [0, -0.0000036, 0],
    gravity: [0, 0, 0],
    makePhysical,
    addItem: (item) => {
        console.log('addItem', item)
        // TODO: missing item.mesh for physical player?
        // seems true for all physical?
        // inteional. actually added to scene by voxel-player (this module)
        if (item.mesh) this.scene.add(item.mesh)
    },
    control: (target) => {
        console.log('control', target)
        controls.target(target)
    },
}
window.game = game;

var createPlayer = require('../')(game);
var substack = createPlayer('./textures/substack.png');
// substack.possess();
// show with initial camera
substack.toggle()

window.addEventListener('keydown', function (ev) {
    if (ev.keyCode === 'R'.charCodeAt(0)) {
        substack.toggle();
    }
});

// TODO: character falling
// nothing applying velocity?
// camera attached to dude
////////////////////////////////////////////////////////////////////////////////////////
// control driven rotation happening on wrong axis

// set rotation with
// scene.children[2].setRotationFromEuler(new THREE.Euler(0,0,0,'XYZ')) 
// then rotating many times with
// scene.children[2].rotateOnWorldAxis(new THREE.Vector3(0,1,0), 0.1) 
// yields weird results

let isActivated = true
let time = 0;
let lastTime = Date.now();
var rad = 0;
var target = new THREE.Vector3(); 

var render = function () {
  window.requestAnimationFrame(render, view.element);
  
  // animate
  if (isActivated) {    
    const now = Date.now()
    const deltaTime = (now - lastTime)
    time += (now - lastTime) /1000;
    lastTime = now

    // walk.render(viking, time)
    substack.tick(deltaTime)
    controls.tick(deltaTime)
    rad += 2;
  }
  
//   const angle = rad / (cw / 2) + (2 * Math.PI * 0.75)
//   camera.position.x = -Math.cos(angle);
//   camera.position.z = -Math.sin(angle);
//   camera.position.y = (0.1/(ch/2))*1.5+0.2;
//   camera.position.setLength(70);
    substack.yaw.getWorldPosition(target)
    
    // assumes uniform scale ancestry
    // uses an internal "up"
    camera.lookAt(target);

//   camera.lookAt(new THREE.Vector3(0, 1.5, 0));
  
//   renderer.render(scene, camera);

    view.render(scene)

};

render()
