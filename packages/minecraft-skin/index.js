const { Object3D, Group, CanvasTexture, NearestFilter } = require('three')
const { PlayerObject } = require('./lib/model.js')
const { loadImage, loadSkinToCanvas, inferModelType } = require('./lib/util.js')

var THREE

module.exports = function(three, image, sizeRatio) {
  return new Skin(three, image, sizeRatio)
}

function Skin(three, image, opts) {
  if (opts) {
    opts.image = opts.image || image
  } else {
    opts = { image: image }
  }
  if (typeof image === 'object' && !(image instanceof HTMLElement)) opts = image

  // forward compat
  this.skinCanvas = document.createElement("canvas");
  this.capeCanvas = document.createElement("canvas");
  this.earsCanvas = document.createElement("canvas");

  this.skinTexture = null;

  this.playerGroup = new Group();
  this.playerGroup.name = "playerGroup";
  // old dude was like 32 units tall
  // new dude is 38.25 units tall
  // default scale brings us to minecraft size 1.5
  this.scale = opts.scale || 1.5/38.25
  this.playerGroup.scale.set(this.scale, this.scale, this.scale)
  
  this.playerRotation = new Object3D();
  this.playerRotation.name = "playerRotation";
  this.playerRotation.position.setY(18)
  this.playerRotation.rotateY(Math.PI)
  this.playerGroup.add(this.playerRotation);
  
  this.playerModel = new PlayerObject(opts);
  this.playerModel.name = "player";
  this.playerModel.skin.visible = false;
  this.playerModel.cape.visible = false;
  this.playerRotation.add(this.playerModel);

  // named parts
  this.mesh = this.playerGroup;
  this.head = this.playerModel.skin.head;
  this.headGroup = this.playerModel.skin.headGroup;
  this.mesh.head = this.playerModel.skin.headGroup;
  this.leftArm = this.playerModel.skin.leftArm;
  this.rightArm = this.playerModel.skin.rightArm;
  this.leftLeg = this.playerModel.skin.leftLeg;
  this.rightLeg = this.playerModel.skin.rightLeg;
  // this.body = this.playerModel.skin.body;
  // this.upperbody = 

  // camera attach points
  this.playerGroup.cameraInside = new Object3D()
  this.playerGroup.cameraOutside = new Object3D()
  this.playerGroup.add(this.playerGroup.cameraInside)
  this.playerGroup.add(this.playerGroup.cameraOutside)

  this.playerGroup.cameraInside.position.set(0,3,6)
  this.playerGroup.cameraInside.rotation.set(0, Math.PI, 0)
  this.playerGroup.cameraOutside.position.set(0,30,-60)
  this.playerGroup.cameraOutside.rotation.set(Math.PI/8, Math.PI, 0)
  
  this.headGroup.add(this.playerGroup.cameraInside)
  this.headGroup.add(this.playerGroup.cameraOutside)

  if (opts.image) {
    loadImage(opts.image).then((image) => {
      this.setImage(image, opts);
    });
  }
}

// from: https://github.com/bs-community/skinview3d/blob/694085b3d2f5a4250cdc96084bb9f09daafa5656/src/viewer.ts#L508
Skin.prototype.setImage = function(image, options = {}) {
  loadSkinToCanvas(this.skinCanvas, image);
  this.recreateSkinTexture();

  if (options.model === undefined || options.model === "auto-detect") {
    this.playerModel.skin.modelType = inferModelType(this.skinCanvas);
  } else {
    this.playerModel.skin.modelType = options.model;
  }

  if (options.makeVisible !== false) {
    this.playerModel.skin.visible = true;
  }

  if (options.ears === true || options.ears == "load-only") {
    loadEarsToCanvasFromSkin(this.earsCanvas, image);
    this.recreateEarsTexture();
    if (options.ears === true) {
      this.playerModel.ears.visible = true;
    }
  }
}

Skin.prototype.recreateSkinTexture = function() {
  if (this.skinTexture !== null) {
    this.skinTexture.dispose();
  }
  this.skinTexture = new CanvasTexture(this.skinCanvas);
  this.skinTexture.magFilter = NearestFilter;
  this.skinTexture.minFilter = NearestFilter;
  this.playerModel.skin.map = this.skinTexture;
}
