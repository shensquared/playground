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
    // Embed mode sets the axis titles at the room's 20px floor (ROOM.md A1), in
    // the page font. Tick labels go: at that size they pile up in a 340px scene,
    // and the surface meeting the points is the message, not the numbers (A3).
    // This bundled Plotly is 3.x, which reads only the nested title.font form.
    const axis = (text: string, extra: any) => {
      const a: any = { title: { text: text }, ...extra };
      if (isEmbed) {
        a.title.font = { size: 20 };
        a.showticklabels = false;
      }
      return a;
    };
    const layout = {
      title: isEmbed ? '' : 'Neural Network Function Approximation',
      font: isEmbed ? { family: '"Helvetica", "Arial", sans-serif', color: '#333' } : undefined,
      scene: {
        xaxis: axis('x1', { range: this.xDomain }),
        yaxis: axis('x2', { range: this.yDomain }),
        zaxis: axis('nn output', {}),
        camera: {
          eye: { x: 1.5, y: 1.5, z: 1.5 }
        }
      },
      width: isEmbed ? 340 : 450,
      height: isEmbed ? 340 : 450,
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

  // updateSurface runs on every training step, once a frame, so it sends Plotly
  // as little as it can. The x and y grids never change, so they go once; each
  // step sends only the new heights, and the data points go only when the data
  // changes (updatePoints). Every third sample (0, 3, ..., 99) draws the
  // network's smooth output as well as the full 100x100 grid, and stays evenly
  // spaced with both edges exact: given an uneven grid, Plotly's surface resamples
  // it to an even one on every call, which costs more than the smaller grid saves.
  private gridSent = false;

  updateSurface(data: number[][], discretize: boolean): void {
    const n = data.length;
    const idx: number[] = [];
    for (let k = 0; k < n; k += 3) {
      idx.push(k);
    }

    // Plotly convention: z[row][col] is displayed at (x[col], y[row]), and
    // data[i][j] belongs at (x[i], y[j]), so z is the transpose.
    const z = idx.map(j => idx.map(i => {
      const value = data[i][j];
      return discretize ? (value >= 0 ? 1 : -1) : value;
    }));

    const update: any = { z: [z] };
    if (!this.gridSent) {
      // x runs xDomain[0]..xDomain[1] with i; y runs yDomain[1]..yDomain[0]
      // with j (inverted), matching the playground's own scales.
      update.x = [idx.map(i =>
          this.xDomain[0] + (i / (n - 1)) * (this.xDomain[1] - this.xDomain[0]))];
      update.y = [idx.map(j =>
          this.yDomain[1] - (j / (n - 1)) * (this.yDomain[1] - this.yDomain[0]))];
      this.gridSent = true;
    }
    Plotly.restyle(this.container, update, [0]);
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
