/* Copyright 2016 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

import {Example2D} from "./dataset";

declare var Plotly: any;

/**
 * 3D surface plot for regression visualization using Plotly.js
 */
export class Plot3D {
  private container: string;
  private xDomain: [number, number];
  private yDomain: [number, number];
  private numSamples: number;

  constructor(
      containerId: string, 
      numSamples: number, 
      xDomain: [number, number],
      yDomain: [number, number]) {
    this.container = containerId;
    this.numSamples = numSamples;
    this.xDomain = xDomain;
    this.yDomain = yDomain;
    
    this.initializePlot();
  }

  private initializePlot(): void {
    const layout = {
      title: 'Neural Network Function Approximation',
      scene: {
        xaxis: { title: 'x1', range: this.xDomain },
        yaxis: { title: 'x2', range: this.yDomain },
        zaxis: { title: 'NN output' },
        camera: {
          eye: { x: 1.5, y: 1.5, z: 1.5 }
        }
      },
      width: 300,
      height: 300,
      margin: { l: 0, r: 0, b: 0, t: 30 }
    };

    const config = {
      displayModeBar: false,
      staticPlot: false
    };

    // Initialize with surface and empty scatter plots for data points
    const data = [
      {
        type: 'surface',
        x: [],
        y: [],
        z: [],
        colorscale: [
          [0, '#f59322'],
          [0.5, '#e8eaeb'], 
          [1, '#0877bd']
        ],
        showscale: false,
        name: 'NN Surface'
      },
      {
        type: 'scatter3d',
        mode: 'markers',
        x: [],
        y: [],
        z: [],
        marker: {
          size: 5,
          color: '#ff4444',
          symbol: 'circle'
        },
        name: 'Training Data',
        showlegend: false
      },
      {
        type: 'scatter3d',
        mode: 'markers',
        x: [],
        y: [],
        z: [],
        marker: {
          size: 5,
          color: '#4444ff',
          symbol: 'circle'
        },
        name: 'Test Data',
        showlegend: false
      }
    ];

    Plotly.newPlot(this.container, data, layout, config);
  }

  updateSurface(data: number[][], discretize: boolean): void {
    const dx = data[0].length;  // DENSITY
    const dy = data.length;     // DENSITY

    // Create coordinate arrays
    const x = [];
    const y = [];
    const z = [];

    // x coordinates (i index)
    for (let i = 0; i < dx; i++) {
      x.push(this.xDomain[0] + (i / (dx - 1)) * (this.xDomain[1] - this.xDomain[0]));
    }

    // y coordinates (j index)
    for (let j = 0; j < dy; j++) {
      y.push(this.yDomain[0] + (j / (dy - 1)) * (this.yDomain[1] - this.yDomain[0]));
    }

    // Create Z matrix for Plotly surface plot
    // Plotly expects z[i][j] where i is x-index and j is y-index
    // Note: playground's yScale is inverted, so data[i][j] has j=0 at yDomain[1]
    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < dx; i++) {
      const row = [];
      for (let j = 0; j < dy; j++) {
        // Invert j index to match playground's inverted yScale
        let value = data[i][dy - 1 - j];
        if (discretize) {
          value = (value >= 0 ? 1 : -1);
        }
        minZ = Math.min(minZ, value);
        maxZ = Math.max(maxZ, value);
        row.push(value);
      }
      z.push(row);
    }

    // Debug: log the range of values
    console.log(`3D Surface update - Z range: [${minZ.toFixed(3)}, ${maxZ.toFixed(3)}]`);
    
    // Debug: log some sample surface values to see the pattern
    if (z.length > 0 && z[0].length > 0) {
      const centerX = Math.floor(z.length / 2);
      const centerY = Math.floor(z[0].length / 2);
      console.log(`Surface coordinates: x=[${x[0].toFixed(2)}, ${x[x.length-1].toFixed(2)}], y=[${y[0].toFixed(2)}, ${y[y.length-1].toFixed(2)}]`);
      console.log(`Surface sample values: center=${z[centerX][centerY].toFixed(3)}, corners=[${z[0][0].toFixed(3)}, ${z[0][z[0].length-1].toFixed(3)}, ${z[z.length-1][0].toFixed(3)}, ${z[z.length-1][z[0].length-1].toFixed(3)}]`);
      console.log(`Corner coordinates: [(${x[0].toFixed(1)},${y[0].toFixed(1)})→${z[0][0].toFixed(3)}, (${x[x.length-1].toFixed(1)},${y[0].toFixed(1)})→${z[0][z[0].length-1].toFixed(3)}, (${x[0].toFixed(1)},${y[y.length-1].toFixed(1)})→${z[z.length-1][0].toFixed(3)}, (${x[x.length-1].toFixed(1)},${y[y.length-1].toFixed(1)})→${z[z.length-1][z[0].length-1].toFixed(3)}]`);
    }

    // Update surface plot
    const surfaceUpdate = {
      x: [x],
      y: [y], 
      z: [z]
    };

    Plotly.restyle(this.container, surfaceUpdate, [0]);

    // Update scatter plots with data points
    this.updateScatterPlots();
  }

  updatePoints(trainPoints: Example2D[], testPoints: Example2D[] = []): void {
    this.trainPoints = trainPoints;
    this.testPoints = testPoints;
    this.updateScatterPlots();
  }

  private updateScatterPlots(): void {
    // Prepare training data points
    const trainX = this.trainPoints.map(p => p.x);
    const trainY = this.trainPoints.map(p => p.y);
    const trainZ = this.trainPoints.map(p => p.label);

    // Prepare test data points
    const testX = this.testPoints.map(p => p.x);
    const testY = this.testPoints.map(p => p.y);
    const testZ = this.testPoints.map(p => p.label);

    // Debug: log data point ranges
    if (this.trainPoints.length > 0) {
      const trainZMin = Math.min(...trainZ);
      const trainZMax = Math.max(...trainZ);
      const trainXMin = Math.min(...trainX);
      const trainXMax = Math.max(...trainX);
      const trainYMin = Math.min(...trainY);
      const trainYMax = Math.max(...trainY);
      console.log(`Training data ranges: x=[${trainXMin.toFixed(2)}, ${trainXMax.toFixed(2)}], y=[${trainYMin.toFixed(2)}, ${trainYMax.toFixed(2)}], z=[${trainZMin.toFixed(3)}, ${trainZMax.toFixed(3)}]`);
    }

    // Update scatter plots
    const scatterUpdate = {
      x: [trainX, testX],
      y: [trainY, testY],
      z: [trainZ, testZ]
    };

    Plotly.restyle(this.container, scatterUpdate, [1, 2]);
  }

  private trainPoints: Example2D[] = [];
  private testPoints: Example2D[] = [];

  show(): void {
    const element = document.getElementById(this.container);
    if (element) {
      element.style.display = 'block';
    }
  }

  hide(): void {
    const element = document.getElementById(this.container);
    if (element) {
      element.style.display = 'none';
    }
  }
}
