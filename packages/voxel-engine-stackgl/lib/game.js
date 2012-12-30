var Game = (function() {

  function Game() {
    this.texturePath = './textures/'
    this.container = '#container'
    this.cubeSize = 50
    this.startingPosition = new THREE.Vector3(-98.89020230577458, 10, -79.80375383087735)
    this.textures = {}
    this.materials = {}
    this.height = window.innerHeight
    this.width = window.innerWidth
    this.scene = scene = new THREE.Scene()
    this.camera = this.createCamera(scene)
    this.renderer = this.createRenderer()
    this.controls = this.createControls()
    this.addLights(this.scene)
    this.downRay = new THREE.Raycaster()
    this.downRay.ray.direction.set( 0, -1, 0 )
    this.floor = new Floor(this, 50000, 50000)
    this.floor.addToScene(this.scene)
    this.voxelMesh = new VoxelMesh(voxel.geometry['Valley'])
    this.voxelMesh.addToScene(this.scene)
    this.moveToPosition(this.startingPosition)
    this.turnAroundCamera()
    this.addStats()
    window.addEventListener( 'resize', this.onWindowResize.bind(this), false )
    this.tick()
  }
  
  Game.prototype.moveToPosition = function(position) {
    var pos = this.controls.yawObject.position
    pos.x = position.x
    pos.y = position.y
    pos.z = position.z
  }
  
  Game.prototype.turnAroundCamera = function() {
    // ghetto way to turn around the initial control camera direction
    this.controls.pitchObject.rotation.x = 0.16599999999999998
    this.controls.yawObject.rotation.y = -2.3739999999999997
  }

  Game.prototype.onWindowResize = function() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize( window.innerWidth, window.innerHeight )
  }

  Game.prototype.loadTexture = function(name) {
    this.textures[name] = THREE.ImageUtils.loadTexture(config.texturePath + name + ".png")
    this.textures[name].magFilter = THREE.NearestFilter
    this.materials[name] = new THREE.MeshLambertMaterial({map: this.textures[name], ambient: 0xbbbbbb})
    return this.textures[name]
  }

  Game.prototype.createCamera = function() {
    var camera;
    camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 10000)
    camera.lookAt(new THREE.Vector3(0, 0, 0))
    this.scene.add(camera)
    return camera
  }
  
  Game.prototype.createControls = function() {
    var controls = new THREE.PointerLockControls(this.camera)
    this.scene.add( controls.yawObject )
    return controls
  }

  Game.prototype.createRenderer = function() {
    if( Detector.webgl ){
      renderer = new THREE.WebGLRenderer({
        antialias: true
      })
    } else {
      renderer = new THREE.CanvasRenderer()
    }
    renderer.setSize(this.width, this.height)
    renderer.setClearColorHex(0xBFD1E5, 1.0)
    renderer.clear()
    document.querySelector(this.container).appendChild(renderer.domElement)
    return renderer
  }
  
  Game.prototype.addStats = function() {
    stats = new Stats()
    stats.domElement.style.position  = 'absolute'
    stats.domElement.style.bottom  = '0px'
    document.body.appendChild( stats.domElement )
  }

  Game.prototype.addLights = function(scene) {
    var ambientLight, directionalLight
    ambientLight = new THREE.AmbientLight(0xaaaaaa)
    scene.add(ambientLight)
    var light	= new THREE.DirectionalLight( Math.random() * 0xffffff )
    light.position.set( Math.random(), Math.random(), Math.random() ).normalize()
    scene.add( light )
  };
  
  Game.prototype.tick = function() {
    requestAnimationFrame( this.tick.bind(this) )
    this.raycast()
    this.controls.update( Date.now() - this.time )
    this.renderer.render(this.scene, this.camera)
    stats.update()
    this.time = Date.now()
  }
  
  Game.prototype.raycast = function() {
    this.controls.isOnObject( false );

		this.downRay.ray.origin.copy( this.controls.yawObject.position );
		this.downRay.ray.origin.y -= 10;

		var intersections = this.downRay.intersectObject( this.voxelMesh.surfaceMesh );

		if ( intersections.length > 0 ) {
			var distance = intersections[ 0 ].distance;
			if ( distance > 0 && distance < 10 ) {
				this.controls.isOnObject( true );
			}
		}
  }

  return Game

})()
;