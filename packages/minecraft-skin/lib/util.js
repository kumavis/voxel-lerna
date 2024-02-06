// adapted from https://github.com/bs-community/skinview-utils

exports.loadImage = async function loadImage(source) {
  const image = document.createElement("img");
  return new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.crossOrigin = "anonymous";
      if (typeof source === "string") {
          image.src = source;
      } else {
          if (source.crossOrigin !== undefined) {
              image.crossOrigin = source.crossOrigin;
          }
          if (source.referrerPolicy !== undefined) {
              image.referrerPolicy = source.referrerPolicy;
          }
          image.src = source.src;
      }
  });
}

/**
 * Check if the given image data has transparency.
 * @param {CanvasImageData} context - The canvas image data context.
 * @param {number} x0 - The starting x-coordinate.
 * @param {number} y0 - The starting y-coordinate.
 * @param {number} w - The width of the image data.
 * @param {number} h - The height of the image data.
 * @returns {boolean} - True if the image data has transparency, false otherwise.
 */
function hasTransparency(context, x0, y0, w, h) {
  const imgData = context.getImageData(x0, y0, w, h);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const offset = (x + y * w) * 4;
      if (imgData.data[offset + 3] !== 0xff) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Compute the scale factor for the skin based on the width.
 * @param {number} width - The width of the skin.
 * @returns {number} - The computed scale factor.
 */
function computeSkinScale(width) {
  return width / 64.0;
}

/**
 * Fix opaque skin by clearing the background if it is not transparent.
 * @param {CanvasImageData & CanvasRect} context - The canvas image data context.
 * @param {number} width - The width of the skin.
 * @param {boolean} format1_8 - Whether the skin format is 1.8 or not.
 */
function fixOpaqueSkin(context, width, format1_8) {
  // see https://github.com/bs-community/skinview3d/issues/15
  // see https://github.com/bs-community/skinview3d/issues/93

  // check whether the skin has opaque background
  if (format1_8) {
    if (hasTransparency(context, 0, 0, width, width)) {
      return;
    }
  } else {
    if (hasTransparency(context, 0, 0, width, width / 2)) {
      return;
    }
  }

  const scale = computeSkinScale(width);
  const clearArea = (x, y, w, h) => {
    context.clearRect(x * scale, y * scale, w * scale, h * scale);
  };
  
	clearArea(40, 0, 8, 8); // Helm Top
	clearArea(48, 0, 8, 8); // Helm Bottom
	clearArea(32, 8, 8, 8); // Helm Right
	clearArea(40, 8, 8, 8); // Helm Front
	clearArea(48, 8, 8, 8); // Helm Left
	clearArea(56, 8, 8, 8); // Helm Back

	if (format1_8) {
		clearArea(4, 32, 4, 4); // Right Leg Layer 2 Top
		clearArea(8, 32, 4, 4); // Right Leg Layer 2 Bottom
		clearArea(0, 36, 4, 12); // Right Leg Layer 2 Right
		clearArea(4, 36, 4, 12); // Right Leg Layer 2 Front
		clearArea(8, 36, 4, 12); // Right Leg Layer 2 Left
		clearArea(12, 36, 4, 12); // Right Leg Layer 2 Back
		clearArea(20, 32, 8, 4); // Torso Layer 2 Top
		clearArea(28, 32, 8, 4); // Torso Layer 2 Bottom
		clearArea(16, 36, 4, 12); // Torso Layer 2 Right
		clearArea(20, 36, 8, 12); // Torso Layer 2 Front
		clearArea(28, 36, 4, 12); // Torso Layer 2 Left
		clearArea(32, 36, 8, 12); // Torso Layer 2 Back
		clearArea(44, 32, 4, 4); // Right Arm Layer 2 Top
		clearArea(48, 32, 4, 4); // Right Arm Layer 2 Bottom
		clearArea(40, 36, 4, 12); // Right Arm Layer 2 Right
		clearArea(44, 36, 4, 12); // Right Arm Layer 2 Front
		clearArea(48, 36, 4, 12); // Right Arm Layer 2 Left
		clearArea(52, 36, 12, 12); // Right Arm Layer 2 Back
		clearArea(4, 48, 4, 4); // Left Leg Layer 2 Top
		clearArea(8, 48, 4, 4); // Left Leg Layer 2 Bottom
		clearArea(0, 52, 4, 12); // Left Leg Layer 2 Right
		clearArea(4, 52, 4, 12); // Left Leg Layer 2 Front
		clearArea(8, 52, 4, 12); // Left Leg Layer 2 Left
		clearArea(12, 52, 4, 12); // Left Leg Layer 2 Back
		clearArea(52, 48, 4, 4); // Left Arm Layer 2 Top
		clearArea(56, 48, 4, 4); // Left Arm Layer 2 Bottom
		clearArea(48, 52, 4, 12); // Left Arm Layer 2 Right
		clearArea(52, 52, 4, 12); // Left Arm Layer 2 Front
		clearArea(56, 52, 4, 12); // Left Arm Layer 2 Left
		clearArea(60, 52, 4, 12); // Left Arm Layer 2 Back
	}
}

/**
 * Convert the skin to the 1.8 format.
 * @param {CanvasRenderingContext2D} context - The canvas rendering context.
 * @param {number} width - The width of the skin.
 */
function convertSkinTo1_8(context, width) {
  // Copied parts are horizontally flipped
  context.save();
  context.scale(-1, 1);

  const scale = computeSkinScale(width);
  const copySkin = (sX, sY, w, h, dX, dY) =>
    context.drawImage(context.canvas, sX * scale, sY * scale, w * scale, h * scale, -dX * scale, dY * scale, -w * scale, h * scale);

  copySkin(4, 16, 4, 4, 20, 48); // Top Leg
  copySkin(8, 16, 4, 4, 24, 48); // Bottom Leg
  copySkin(0, 20, 4, 12, 24, 52); // Outer Leg
  copySkin(4, 20, 4, 12, 20, 52); // Front Leg
  copySkin(8, 20, 4, 12, 16, 52); // Inner Leg
  copySkin(12, 20, 4, 12, 28, 52); // Back Leg
  copySkin(44, 16, 4, 4, 36, 48); // Top Arm
  copySkin(48, 16, 4, 4, 40, 48); // Bottom Arm
  copySkin(40, 20, 4, 12, 40, 52); // Outer Arm
  copySkin(44, 20, 4, 12, 36, 52); // Front Arm
  copySkin(48, 20, 4, 12, 32, 52); // Inner Arm
  copySkin(52, 20, 4, 12, 44, 52); // Back Arm

  context.restore();
}

exports.loadSkinToCanvas = function loadSkinToCanvas(canvas, image) {
	let isOldFormat = false;
	if (image.width !== image.height) {
		if (image.width === 2 * image.height) {
			isOldFormat = true;
		} else {
			throw new Error(`Bad skin size: ${image.width}x${image.height}`);
		}
	}

	const context = canvas.getContext("2d", { willReadFrequently: true });
	if (isOldFormat) {
		const sideLength = image.width;
		canvas.width = sideLength;
		canvas.height = sideLength;
		context.clearRect(0, 0, sideLength, sideLength);
		context.drawImage(image, 0, 0, sideLength, sideLength / 2.0);
		convertSkinTo1_8(context, sideLength);
		fixOpaqueSkin(context, canvas.width, false);
	} else {
		canvas.width = image.width;
		canvas.height = image.height;
		context.clearRect(0, 0, image.width, image.height);
		context.drawImage(image, 0, 0, canvas.width, canvas.height);
		fixOpaqueSkin(context, canvas.width, true);
	}
}

function computeCapeScale(image) {
	if (image.width === 2 * image.height) {
		// 64x32
		return image.width / 64;
	} else if (image.width * 17 === image.height * 22) {
		// 22x17
		return image.width / 22;
	} else if (image.width * 11 === image.height * 23) {
		// 46x22
		return image.width / 46;
	} else {
		throw new Error(`Bad cape size: ${image.width}x${image.height}`);
	}
}

exports.loadCapeToCanvas = function loadCapeToCanvas(canvas, image) {
	const scale = computeCapeScale(image);
	canvas.width = 64 * scale;
	canvas.height = 32 * scale;

	const context = canvas.getContext("2d", { willReadFrequently: true });
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.drawImage(image, 0, 0, image.width, image.height);
}

function isAreaBlack(context, x0, y0, w, h) {
	const imgData = context.getImageData(x0, y0, w, h);
	for (let x = 0; x < w; x++) {
		for (let y = 0; y < h; y++) {
			const offset = (x + y * w) * 4;
			if (!(
				imgData.data[offset + 0] === 0 &&
				imgData.data[offset + 1] === 0 &&
				imgData.data[offset + 2] === 0 &&
				imgData.data[offset + 3] === 0xff
			)) {
				return false;
			}
		}
	}
	return true;
}

function isAreaWhite(context, x0, y0, w, h) {
	const imgData = context.getImageData(x0, y0, w, h);
	for (let x = 0; x < w; x++) {
		for (let y = 0; y < h; y++) {
			const offset = (x + y * w) * 4;
			if (!(
				imgData.data[offset + 0] === 0xff &&
				imgData.data[offset + 1] === 0xff &&
				imgData.data[offset + 2] === 0xff &&
				imgData.data[offset + 3] === 0xff
			)) {
				return false;
			}
		}
	}
	return true;
}

exports.inferModelType = function inferModelType(canvas) {
	// The right arm area of *default* skins:
	// (44,16)->*-------*-------*
	// (40,20)  |top    |bottom |
	// \|/      |4x4    |4x4    |
	//  *-------*-------*-------*-------*
	//  |right  |front  |left   |back   |
	//  |4x12   |4x12   |4x12   |4x12   |
	//  *-------*-------*-------*-------*
	// The right arm area of *slim* skins:
	// (44,16)->*------*------*-*
	// (40,20)  |top   |bottom| |<----[x0=50,y0=16,w=2,h=4]
	// \|/      |3x4   |3x4   | |
	//  *-------*------*------***-----*-*
	//  |right  |front |left   |back  | |<----[x0=54,y0=20,w=2,h=12]
	//  |4x12   |3x12  |4x12   |3x12  | |
	//  *-------*------*-------*------*-*
	// Compared with default right arms, slim right arms have 2 unused areas.
	//
	// The same is true for left arm:
	// The left arm area of *default* skins:
	// (36,48)->*-------*-------*
	// (32,52)  |top    |bottom |
	// \|/      |4x4    |4x4    |
	//  *-------*-------*-------*-------*
	//  |right  |front  |left   |back   |
	//  |4x12   |4x12   |4x12   |4x12   |
	//  *-------*-------*-------*-------*
	// The left arm area of *slim* skins:
	// (36,48)->*------*------*-*
	// (32,52)  |top   |bottom| |<----[x0=42,y0=48,w=2,h=4]
	// \|/      |3x4   |3x4   | |
	//  *-------*------*------***-----*-*
	//  |right  |front |left   |back  | |<----[x0=46,y0=52,w=2,h=12]
	//  |4x12   |3x12  |4x12   |3x12  | |
	//  *-------*------*-------*------*-*
	//
	// If there is a transparent pixel in any of the 4 unused areas, the skin must be slim,
	// as transparent pixels are not allowed in the first layer.
	// If the 4 areas are all black or all white, the skin is also considered as slim.

	const scale = computeSkinScale(canvas.width);
	const context = canvas.getContext("2d", { willReadFrequently: true });
	const checkTransparency = (x, y, w, h) =>
		hasTransparency(context, x * scale, y * scale, w * scale, h * scale);
	const checkBlack = (x, y, w, h) =>
		isAreaBlack(context, x * scale, y * scale, w * scale, h * scale);
	const checkWhite = (x, y, w, h) =>
		isAreaWhite(context, x * scale, y * scale, w * scale, h * scale);
	const isSlim =
		(
			checkTransparency(50, 16, 2, 4) ||
			checkTransparency(54, 20, 2, 12) ||
			checkTransparency(42, 48, 2, 4) ||
			checkTransparency(46, 52, 2, 12)
		) ||
		(
			checkBlack(50, 16, 2, 4) &&
			checkBlack(54, 20, 2, 12) &&
			checkBlack(42, 48, 2, 4) &&
			checkBlack(46, 52, 2, 12)
		) ||
		(
			checkWhite(50, 16, 2, 4) &&
			checkWhite(54, 20, 2, 12) &&
			checkWhite(42, 48, 2, 4) &&
			checkWhite(46, 52, 2, 12)
		);
	return isSlim ? "slim" : "default";
}

/**
 * Computes the scale factor for the ears image based on its dimensions.
 * @param {TextureSource} image - The ears image.
 * @returns {number} The scale factor.
 * @throws {Error} If the ears image has invalid dimensions.
 */
function computeEarsScale(image) {
  if (image.width === image.height * 2 && image.height % 7 === 0) {
    return image.height / 7;
  } else {
    throw new Error(`Bad ears size: ${image.width}x${image.height}`);
  }
}

/**
 * Loads the ears image onto the canvas.
 * @param {TextureCanvas} canvas - The canvas to load the ears onto.
 * @param {TextureSource} image - The ears image.
 * @returns {void}
 */
exports.loadEarsToCanvas = function loadEarsToCanvas(canvas, image) {
  const scale = computeEarsScale(image);
  canvas.width = 14 * scale;
  canvas.height = 7 * scale;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, image.width, image.height);
}

/**
 * Loads the ears image from the skin onto the canvas.
 * @param {TextureCanvas} canvas - The canvas to load the ears onto.
 * @param {TextureSource} image - The skin image.
 * @returns {void}
 * @throws {Error} If the skin image has invalid dimensions.
 */
exports.loadEarsToCanvasFromSkin = function loadEarsToCanvasFromSkin(canvas, image) {
  if (image.width !== image.height && image.width !== 2 * image.height) {
    throw new Error(`Bad skin size: ${image.width}x${image.height}`);
  }

  const scale = computeSkinScale(image.width);
  const w = 14 * scale;
  const h = 7 * scale;
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.clearRect(0, 0, w, h);
  context.drawImage(image, 24 * scale, 0, w, h, 0, 0, w, h);
}

/**
 * Loads the ears image onto the canvas.
 * @param {TextureCanvas} canvas - The canvas to load the ears onto.
 * @param {TextureSource} image - The ears image.
 * @returns {void}
 */
exports.loadEarsToCanvas = function loadEarsToCanvas(canvas, image) {
  const scale = computeEarsScale(image);
  canvas.width = 14 * scale;
  canvas.height = 7 * scale;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, image.width, image.height);
}

/**
 * Loads the ears image from the skin onto the canvas.
 * @param {TextureCanvas} canvas - The canvas to load the ears onto.
 * @param {TextureSource} image - The skin image.
 * @returns {void}
 * @throws {Error} If the skin image has invalid dimensions.
 */
exports.loadEarsToCanvasFromSkin = function loadEarsToCanvasFromSkin(canvas, image) {
  if (image.width !== image.height && image.width !== 2 * image.height) {
    throw new Error(`Bad skin size: ${image.width}x${image.height}`);
  }

  const scale = computeSkinScale(image.width);
  const w = 14 * scale;
  const h = 7 * scale;
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.clearRect(0, 0, w, h);
  context.drawImage(image, 24 * scale, 0, w, h, 0, 0, w, h);
}
/**
 * Loads the ears image from the skin onto the canvas.
 * @param {TextureCanvas} canvas - The canvas to load the ears onto.
 * @param {TextureSource} image - The skin image.
 * @returns {void}
 * @throws {Error} If the skin image has invalid dimensions.
 */
exports.loadEarsToCanvasFromSkin = function loadEarsToCanvasFromSkin(canvas, image) {
  if (image.width !== image.height && image.width !== 2 * image.height) {
    throw new Error(`Bad skin size: ${image.width}x${image.height}`);
  }

  const scale = computeSkinScale(image.width);
  const w = 14 * scale;
  const h = 7 * scale;
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.clearRect(0, 0, w, h);
  context.drawImage(image, 24 * scale, 0, w, h, 0, 0, w, h);
}
