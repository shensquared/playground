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
        xaxis: { 
          title: { text: 'x1', font: { size: 14 } }, 
          range: this.xDomain 
        },
        yaxis: { 
          title: { text: 'x2', font: { size: 14 } }, 
          range: this.yDomain 
        },
        zaxis: { 
          title: { text: 'NN output', font: { size: 14 } }
        },
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
          size: 3,
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
          size: 3,
          color: '#4444ff',
          symbol: 'circle'
        },
        name: 'Test Data',
        showlegend: false
      }
    ];

    Plotly.newPlot(this.container, data, layout, config);
    console.log("3D Plot: Initialized with axis labels x1, x2, NN output");
  }

  private updateLayout(): void {
    const layout = {
      scene: {
        xaxis: { 
          title: { text: 'x1', font: { size: 14 } }, 
          range: this.xDomain 
        },
        yaxis: { 
          title: { text: 'x2', font: { size: 14 } }, 
          range: this.yDomain 
        },
        zaxis: { 
          title: { text: 'NN output', font: { size: 14 } }
        }
      }
    };
    Plotly.relayout(this.container, layout);
    console.log("3D Plot: Layout updated with axis labels");
  }

  updateSurface(data: number[][], discretize: boolean): void {
    if (!data || data.length === 0 || data[0].length === 0) {
      console.log("3D Plot: No data to update surface");
      return;
    }

    // Check if plot exists
    const plotElement = document.getElementById(this.container);
    if (!plotElement || !(plotElement as any).data) {
      console.log("3D Plot: Plot not initialized, reinitializing...");
      this.initializePlot();
      // Try again after initialization
      setTimeout(() => this.updateSurface(data, discretize), 100);
      return;
    }
    
    const dx = data[0].length;
    const dy = data.length;
    console.log("3D Plot: Updating surface with data", dx, "x", dy);

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

    try {
      Plotly.restyle(this.container, update, [0]);
      console.log("3D Plot: Surface updated successfully");
    } catch (error) {
      console.error("3D Plot: Error updating surface", error);
      // Try to reinitialize the plot if there's an error
      this.initializePlot();
    }
  }

  updatePoints(trainPoints: Example2D[], testPoints: Example2D[] = []): void {
    // Update training data (trace index 1)
    const trainUpdate = {
      x: [trainPoints.map(p => p.x)],
      y: [trainPoints.map(p => p.y)],
      z: [trainPoints.map(p => p.label)]
    };
    
    // Update test data (trace index 2)
    const testUpdate = {
      x: [testPoints.map(p => p.x)],
      y: [testPoints.map(p => p.y)],
      z: [testPoints.map(p => p.label)]
    };

    // Update both scatter traces
    Plotly.restyle(this.container, trainUpdate, [1]);
    Plotly.restyle(this.container, testUpdate, [2]);
  }

  show(): void {
    console.log("3D Plot: show() called");
    const element = document.getElementById(this.container);
    if (element) {
      element.style.display = 'block';
      console.log("3D Plot: Element found and set to display block");
      // Ensure layout is correct when showing
      setTimeout(() => {
        this.updateLayout();
      }, 100);
    } else {
      console.error("3D Plot: Element not found with ID:", this.container);
    }
  }

  hide(): void {
    const element = document.getElementById(this.container);
    if (element) {
      element.style.display = 'none';
    }
  }
}
