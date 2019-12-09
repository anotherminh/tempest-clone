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
  sliceSelected = 0; // select the first slice
  startPoint = {
    x: this.canvasWidth/2,
    y: this.canvasHeight/2
  };

  // find all the endpoints of our shape, but don't draw them yet
  findNextEndpoint(startCoord, length, angle) {
    let endX = startCoord.x + length * Math.cos(angle * Math.PI /180);
    let endY = startCoord.y + length * Math.sin(angle * Math.PI / 180);
    return { x: endX, y: endY };
  }

  drawPolygon() {
    console.log("Drawing polygon");
    // if the endPoints are not defined, then
    // we are running this for the first time
    if (this.endPoints.length === 0) {
      console.log(this.endPoints);
      console.log(this.endPoints.length === 0);
      this.endPoints = this.recordEndPoints();
    }

    let ctx = this.canvasCtx;
    let center = this.startPoint;
    let endPoints = this.endPoints;

    for (let i = 0; i < endPoints.length; i++) {
      let point1 = endPoints[i]
      var point2;
      if (i + 1 < endPoints.length) {
        point2 = endPoints[i + 1]
      } else {
        point2 = endPoints[0]
      }
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(point1.x, point1.y)
      ctx.lineTo(point2.x, point2.y)
      ctx.lineTo(center.x, center.y);

      console.log("Slice selected: " + this.sliceSelected);
      if (this.sliceSelected === i) {
        ctx.stroke();
        ctx.closePath();
        ctx.fillStyle = 'white';
        ctx.fill()
      } else {
        ctx.strokeStyle = this.pieColor;
        ctx.stroke();
        ctx.closePath();
      }
    }
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
        this.findNextEndpoint(this.startPoint, length, sliceSize)
      );
    }
    return endPoints;
  }

  getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }

  handleKeyPress(key) {
    switch (key.key) {
      case "ArrowLeft":
        if (this.sliceSelected === 0) {
          this.sliceSelected = this.numOfSlices - 1;
        } else {
          this.sliceSelected = (this.sliceSelected - 1) % this.numOfSlices;
        }
        break;
      case "ArrowRight":
        this.sliceSelected = (this.sliceSelected + 1) % this.numOfSlices;
        break;
      default:
        break;
    }

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
