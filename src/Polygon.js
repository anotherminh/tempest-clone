import React, { Component } from 'react';
import './Polygon.css';

class Polygon extends Component {
  canvas = null; // will be set after component mounts
  pieColor = '#3dbbff';
  shipColor = 'yellow';
  numOfSlices = 15;
  canvasWidth = 800;
  canvasHeight = 800;
  components = [];
  endPoints = [];
  currentShipPos = 2;
  sliceSelected = 0; // select the first slice
  possibleShipPositions = 5; // 3 total ship positions per slice
  startPoint = {
    x: this.canvasWidth/2,
    y: this.canvasHeight/2
  };

  // draw a line from startCoord of the given length,
  // at the given angle, then return the ending coordinate
  findPointAtAngledDistance(startCoord, length, angle) {
    let r = this.degreeToRad(angle);
    let endX = startCoord.x + length * Math.cos(r);
    let endY = startCoord.y + length * Math.sin(r);
    return { x: endX, y: endY };
  }

  drawLine(ctx, A, B, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
    ctx.closePath();
  }

  drawPolygon() {
    // if the endPoints are not defined, then
    // we are running this for the first time
    if (this.endPoints.length === 0) {
      console.log("Drawing new polygon")
      this.endPoints = this.recordEndPoints();
    }

    let ctx = this.canvasCtx;
    let center = this.startPoint;
    let endPoints = this.endPoints;

    for (let i = 0; i < endPoints.length; i++) {
      let A = endPoints[i]
      var B;
      if (i + 1 < endPoints.length) {
        B = endPoints[i + 1]
      } else {
        B = endPoints[0]
      }

      let lineColor = this.pieColor;
      this.drawLine(ctx, center, A, lineColor);
      this.drawLine(ctx, center, B, lineColor);
      this.drawLine(ctx, A, B, lineColor);
    }

    this.drawShip();
  }

  highlightShipPath(A, B) {
    let ctx = this.canvasCtx;
    let lineColor = this.shipColor;
    let center = this.startPoint;
    this.drawLine(ctx, center, A, lineColor);
    this.drawLine(ctx, center, B, lineColor);
    this.drawLine(ctx, A, B, lineColor);
  }

  // For debugging -- to see where a given point is
  point(center, color) {
    let ctx = this.canvasCtx;
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(center.x, center.y, 10, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  }

  // To help find the third point of an isosceles triangle
  // given that we know the coordinates of the two equal vertices (A, B),
  // as well as the height of the triangle
  // There are two solutions,
  // so if left = 1 then the third point is left of the line AB
  findThirdPoint(A, B, height, dir = 1) {
    let dx = B.x - A.x;
    let dy = B.y - A.y;
    height /= Math.sqrt(dx * dx + dy * dy) * dir;
    return {
      x : A.x + dx / 2 - dy * height,
      y : A.y + dy / 2 + dx * height
    }
  }

  degreeToRad(degrees) {
    return degrees * Math.PI / 180;
  }

  radToDegree(rad) {
    return rad * 180 / Math.PI;
  }

  distanceBetweenPoints(A, B) {
    return Math.sqrt( (A.x - B.x)**2 + (A.y - B.y)**2);
  }

  nextSlice(slice) {
    return (slice + 1) % this.numOfSlices;
  }

  previousSlice(slice) {
    if (slice === 0) {
      return this.numOfSlices - 1;
    } else {
      return (slice - 1) % this.numOfSlices;
    }
  }

  // ship has 3 positions: left, center, right
  // left is when the ship isn't on the right line
  // center is when the ship is on both lines
  // right is when the ship isn't on the left line
  drawShip() {
    let A = this.endPoints[this.sliceSelected];
    let B = this.endPoints[(this.sliceSelected + 1) % this.numOfSlices];
    this.highlightShipPath(A, B);

    // 0 = left
    // 1 = center, left-leaning
    // 2 = center
    // 3 = center, right-leaning
    // 4 = right
    let shipAlignment = this.currentShipPos % this.possibleShipPositions;
    let ctx = this.canvasCtx;
    ctx.strokeStyle = this.shipColor;
    let shipPoints = [];

    let shipLength = this.distanceBetweenPoints(A, B);
    let shipHeight = Math.min(shipLength/2.8, 30);

    if (shipAlignment === 0) {
      let originalAngleAB = this.radToDegree(Math.atan2(A.y - B.y, A.x - B.x));
      let fromLeft = {
        x: A.x * 2/3 + B.x * 1/3,
        y: A.y * 2/3 + B.y * 1/3,
      }
      B = this.findPointAtAngledDistance(fromLeft, shipHeight, originalAngleAB + 90);
    } else if (shipAlignment === 4) {
      let fromRight = {
        x: B.x * 2/3 + A.x * 1/3,
        y: B.y * 2/3 + A.y * 1/3,
      }
      let originalAngleBA = this.radToDegree(Math.atan2(B.y - A.y, B.x - A.x));
      A = this.findPointAtAngledDistance(fromRight, shipHeight, originalAngleBA - 90);
    }

    // To draw from point B, we need to figure out the angle of AB
    let angleAB = this.radToDegree(Math.atan2(A.y - B.y, A.x - B.x));
    var leftClawLength = shipLength/2.5;
    var leftClawAngle = angleAB - 60;
    var leftClawOnPolygon = {
        x: A.x * 1/4 + B.x * 3/4,
        y: A.y * 1/4 + B.y * 3/4,
    }

    // To draw from point A, we need to figure out the angle of BA
    let angleBA = this.radToDegree(Math.atan2(B.y - A.y, B.x - A.x));
    var rightClawLength = shipLength/2.5;
    var rightClawAngle = angleBA + 70;
    var rightClawOnPolygon = {
      x: B.x * 1/4 + A.x * 3/4,
      y: B.y * 1/4 + A.y * 3/4,
    }

    // ship outer hull
    var midOuterHull;
    var lowerOuterHull;
    if (shipAlignment === 0 ) {
      midOuterHull = this.findPointAtAngledDistance(A, shipHeight, angleBA - 70);
      lowerOuterHull = this.findPointAtAngledDistance(rightClawOnPolygon, shipHeight/3, angleBA - 70);
      leftClawLength = shipLength/2
      leftClawOnPolygon = {
        x: A.x * 1/5 + B.x * 4/5,
        y: A.y * 1/5 + B.y * 4/5,
      }
    } else if (shipAlignment === 1 || shipAlignment === 2 || shipAlignment === 3) {
      leftClawAngle = angleAB - 25;
      rightClawAngle = angleBA + 25;
      leftClawOnPolygon = {
        x: A.x * 1/8 + B.x * 7/8,
        y: A.y * 1/8 + B.y * 7/8,
      }
      rightClawOnPolygon = {
        x: B.x * 1/8 + A.x * 7/8,
        y: B.y * 1/8 + A.y * 7/8,
      }
      // centered hull
      midOuterHull = this.findThirdPoint(A, B, shipHeight, -1);
      lowerOuterHull = this.findThirdPoint(A, B, shipHeight/3, -1);

      if (shipAlignment === 1) { // left tilted hull
        midOuterHull = this.findPointAtAngledDistance(A, shipHeight, angleBA - 50);
        lowerOuterHull = this.findPointAtAngledDistance(rightClawOnPolygon, shipHeight/2, angleBA - 50);
      } else if (shipAlignment === 3) { // right tilted hull
        midOuterHull = this.findPointAtAngledDistance(B, shipHeight, angleAB + 50);
        lowerOuterHull = this.findPointAtAngledDistance(leftClawOnPolygon, shipHeight/2, angleAB + 50);
      }

    } else {
      midOuterHull = this.findPointAtAngledDistance(B, shipHeight, angleAB + 70);
      lowerOuterHull = this.findPointAtAngledDistance(leftClawOnPolygon, shipHeight/3, angleAB + 70);
      rightClawLength = shipLength/2
      rightClawOnPolygon = {
        x: B.x * 1/5 + A.x * 4/5,
        y: B.y * 1/5 + A.y * 4/5,
      }
    }

    shipPoints.push(midOuterHull);
    shipPoints.push(B);

    shipPoints.push(this.findPointAtAngledDistance(B, leftClawLength, leftClawAngle)); // leftClawInsidePolygon
    shipPoints.push(leftClawOnPolygon);
    shipPoints.push(lowerOuterHull);

    shipPoints.push(rightClawOnPolygon);
    shipPoints.push(this.findPointAtAngledDistance(A, rightClawLength, rightClawAngle)); // rightClawInsidePolygon
    shipPoints.push(A);

    ctx.beginPath();
    ctx.moveTo(A.x, A.y)
    for (let i = 0; i < shipPoints.length; i++) {
      ctx.lineTo(shipPoints[i].x, shipPoints[i].y);
    }
    ctx.stroke();
    ctx.closePath();
  }

  recordEndPoints() {
    let pie = 360.0;
    let sliceSize = 0;
    let endPoints = [];

    let minLength = 130;
    let maxLength = 250;

    for (let i = this.numOfSlices; i > 0; i--) {
      // we want to evenly distribute the remainder of the pie
      let meanSliceSize = (pie - sliceSize) / i;
      let meanSliceSizeVariance = meanSliceSize / 2;
      let minSliceSize = meanSliceSize - meanSliceSizeVariance;
      let maxSliceSize = meanSliceSize + meanSliceSizeVariance;
      let sliceSizeInc = this.getRandomArbitrary(minSliceSize, maxSliceSize);
      sliceSize = Math.min(pie, sliceSize + sliceSizeInc);
      let length = this.getRandomArbitrary(minLength, maxLength);
      endPoints.push(
        this.findPointAtAngledDistance(this.startPoint, length, sliceSize)
      );
    }
    return endPoints;
  }

  getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }

  decrementShipPos(pos) {
    if (pos === 0) {
      return (this.numOfSlices * this.possibleShipPositions) - 1;
    } else {
      return (pos - 1) % (this.numOfSlices * this.possibleShipPositions);
    }
  }

  incrementShipPos(pos) {
    return (pos + 1) % (this.numOfSlices * this.possibleShipPositions);
  }

  handleKeyPress(key) {
    switch (key.key) {
      case "ArrowLeft":
        this.currentShipPos = this.decrementShipPos(this.currentShipPos)
        this.sliceSelected = Math.floor(this.currentShipPos/this.possibleShipPositions)
        break;
      case "ArrowRight":
        this.currentShipPos = this.incrementShipPos(this.currentShipPos)
        this.sliceSelected = Math.floor(this.currentShipPos/this.possibleShipPositions)
        break;
      default:
        break;
    }

    console.log(this.currentShipPos)
    console.log(this.sliceSelected)
    this.canvasCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.drawPolygon();
  }

  componentDidMount() {
    this.canvas = this.refs.canvas
    this.canvasCtx = this.canvas.getContext("2d")
    this.canvasCtx.fillStyle = 'black';
    this.canvasCtx.fillRect(0,0,this.canvasWidth, this.canvasHeight);

    this.drawPolygon();
    this.canvas.focus();
    this.canvas.addEventListener('keydown', this.handleKeyPress.bind(this), false);
  }

  render() {
    return(
      <div>
        <canvas ref="canvas" tabIndex='1' width={this.canvasWidth} height={this.canvasHeight} />
      </div>
    )
  }
}

export default Polygon
