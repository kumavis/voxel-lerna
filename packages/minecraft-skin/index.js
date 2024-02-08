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

  this.playerObject = new PlayerObject(opts);
  this.playerObject.name = "player";
  this.playerObject.skin.visible = false;
  this.playerObject.cape.visible = false;
  const scale = 1.5/38.25
  this.playerObject.scale.set(scale, scale, scale)
  this.playerObject.translateY(16.25 * scale)
  this.playerWrapper = new Group();
  this.playerWrapper.add(this.playerObject);
  this.playerWrapper.name = "playerWrapper";

  // backwards compat
  this.mesh = this.playerWrapper;
  this.head = this.playerObject.skin.head;
  this.leftArm = this.playerObject.skin.leftArm;
  this.rightArm = this.playerObject.skin.rightArm;
  this.leftLeg = this.playerObject.skin.leftLeg;
  this.rightLeg = this.playerObject.skin.rightLeg;

  // camera attach points
  this.playerWrapper.cameraInside = new Object3D()
  this.playerWrapper.cameraOutside = new Object3D()

  this.playerWrapper.cameraInside.position.x = 0;
  this.playerWrapper.cameraInside.position.y = 2;
  this.playerWrapper.cameraInside.position.z = 0; 

  this.head.add(this.playerWrapper.cameraInside)
  this.playerWrapper.cameraInside.add(this.playerWrapper.cameraOutside)

  this.playerWrapper.cameraOutside.position.z = 100

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
    this.playerObject.skin.modelType = inferModelType(this.skinCanvas);
  } else {
    this.playerObject.skin.modelType = options.model;
  }

  if (options.makeVisible !== false) {
    this.playerObject.skin.visible = true;
  }

  if (options.ears === true || options.ears == "load-only") {
    loadEarsToCanvasFromSkin(this.earsCanvas, image);
    this.recreateEarsTexture();
    if (options.ears === true) {
      this.playerObject.ears.visible = true;
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
  this.playerObject.skin.map = this.skinTexture;
}
