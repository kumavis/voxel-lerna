var Controls = (function() {

  function Controls(object, domElement) {
    this.object = object;
    this.target = new THREE.Vector3(0, 0, 0);
    this.domElement = domElement || document;
    this.lookSpeed = 0.20;
    this.movementX = 0;
    this.movementY = 0;
    this.lat = 0;
    this.lon = 0;
    this.anchorx = null;
    this.anchory = null;
    this.defineBindings();
  }

  Controls.prototype.defineBindings = function() {
    document.addEventListener( 'mousemove', this.onMouseMove.bind(this), false );
    document.addEventListener( 'mousedown', this.onMouseDown.bind(this), false );
    // document.addEventListener( 'keydown', onKeyDown, false );
    // document.addEventListener( 'keyup', onKeyUp, false );
  };

  Controls.prototype.onMouseDown = function(event) {
    console.log(event)
  };
  
  Controls.prototype.onMouseMove = function(event) {
    if (!this.enabled) return
    
    this.movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		this.movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    return
  };
  
  Controls.prototype.move = function(newPosition) {
    this.object.position = newPosition;
    return this.updateLook();
  };
  
  Controls.prototype.halfCircle = Math.PI / 180;
  
  Controls.prototype.viewDirection = function() {
    return this.target.clone().subSelf(this.object.position);
  };
  
  Controls.prototype.assoc = function(o, i) {
    var k, v;
    for (k in i) {
      v = i[k];
      o[k] = v;
    }
    return o;
  }

  Controls.prototype.updateLook = function() {
    var cos, p, phi, sin, theta;
    sin = Math.sin, cos = Math.cos;
    phi = (90 - this.lat) * this.halfCircle;
    theta = this.lon * this.halfCircle;
    p = this.object.position;
    this.assoc(this.target, {
      x: p.x + 100 * sin(phi) * cos(theta),
      y: p.y + 100 * cos(phi),
      z: p.z + 100 * sin(phi) * sin(theta)
    });
    this.object.lookAt(this.target);
  };

  Controls.prototype.update = function() {
    var max, min;
    if (this.mouseX === this.anchorx && this.mouseY === this.anchory) {
      return;
    }
    max = Math.max, min = Math.min;
    this.lon += (this.mouseX - this.anchorx) * this.lookSpeed;
    this.lat -= (this.mouseY - this.anchory) * this.lookSpeed;
    this.anchorx = this.mouseX;
    this.anchory = this.mouseY;
    this.lat = max(-85, min(85, this.lat));
    this.updateLook();
  };

  return Controls;

})();
