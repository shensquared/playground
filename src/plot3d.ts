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
    const isEmbed = document.body.classList.contains('embed');
    const layout = {
      title: isEmbed ? '' : 'Neural Network Function Approximation',
      scene: {
        xaxis: { title: {text: 'x1'}, range: this.xDomain },
        yaxis: { title: {text: 'x2'}, range: this.yDomain },
        zaxis: { title: {text: 'nn output'} },
        camera: {
          eye: { x: 1.5, y: 1.5, z: 1.5 }
        }
      },
      width: isEmbed ? 300 : 450,
      height: isEmbed ? 300 : 450,
      margin: { l: 0, r: 0, b: 0, t: isEmbed ? 0 : 30 }
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
    const nx = data.length;       // outer index = playground's i (x axis)
    const ny = data[0].length;    // inner index = playground's j (y axis)

    // x coordinates: xScale(i) maps i=0..nx-1 to xDomain[0]..xDomain[1]
    const x = [];
    for (let i = 0; i < nx; i++) {
      x.push(this.xDomain[0] + (i / (nx - 1)) * (this.xDomain[1] - this.xDomain[0]));
    }

    // y coordinates: yScale(j) maps j=0..ny-1 to yDomain[1]..yDomain[0] (inverted)
    const y = [];
    for (let j = 0; j < ny; j++) {
      y.push(this.yDomain[1] - (j / (ny - 1)) * (this.yDomain[1] - this.yDomain[0]));
    }

    // Plotly convention: z[row][col] is displayed at (x[col], y[row])
    // data[i][j] should display at (x[i], y[j])
    // So we need z[j][i] = data[i][j] (transpose)
    const z = [];
    for (let j = 0; j < ny; j++) {
      const row = [];
      for (let i = 0; i < nx; i++) {
        let value = data[i][j];
        if (discretize) {
          value = (value >= 0 ? 1 : -1);
        }
        row.push(value);
      }
      z.push(row);
    }

    Plotly.restyle(this.container, {x: [x], y: [y], z: [z]}, [0]);

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
