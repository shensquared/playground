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
        zaxis: { title: 'Output' },
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

    // Initialize with empty data
    const data = [{
      type: 'surface',
      x: [],
      y: [],
      z: [],
      colorscale: [
        [0, '#f59322'],
        [0.5, '#e8eaeb'], 
        [1, '#0877bd']
      ],
      showscale: false
    }];

    Plotly.newPlot(this.container, data, layout, config);
  }

  updateSurface(data: number[][], discretize: boolean): void {
    const dx = data[0].length;
    const dy = data.length;

    // Create coordinate arrays
    const x = [];
    const y = [];
    const z = [];

    for (let i = 0; i < dx; i++) {
      x.push(this.xDomain[0] + (i / (dx - 1)) * (this.xDomain[1] - this.xDomain[0]));
    }

    for (let j = 0; j < dy; j++) {
      y.push(this.yDomain[0] + (j / (dy - 1)) * (this.yDomain[1] - this.yDomain[0]));
    }

    // Create Z matrix (transposed to match Plotly's expected format)
    for (let j = 0; j < dy; j++) {
      const row = [];
      for (let i = 0; i < dx; i++) {
        let value = data[i][j];
        if (discretize) {
          value = (value >= 0 ? 1 : -1);
        }
        row.push(value);
      }
      z.push(row);
    }

    const update = {
      x: [x],
      y: [y], 
      z: [z]
    };

    Plotly.restyle(this.container, update, [0]);
  }

  updatePoints(trainPoints: Example2D[], testPoints: Example2D[] = []): void {
    // For now, we'll just store the points and update them when the surface updates
    // This avoids complex Plotly API issues with adding/removing traces
    this.trainPoints = trainPoints;
    this.testPoints = testPoints;
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
