import * as React from "react";
import { OrthographicCamera, Scene, WebGLRenderer, BufferGeometry, BufferAttribute, ShaderMaterial, Points, Color, Vector2 } from "three";
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';

/**
 * WebGL-based line/point rendering for XYPlot.
 *
 * Extracted from XYPlotPlot to reduce file size.
 * All access to plot state goes through `this.plot` (the XYPlotPlot instance).
 */
export class XYPlotPlotWebGl {
    // XYPlotPlot instance, typed as any to avoid circular import
    plot: any;

    constructor(plot: any) {
        this.plot = plot;
    }

    calcWebGlShadeColor = (rgbaColor: string) => {
        // "rgba(255, 0, 0, 1)" --> "1.0, 0.0, 0.0, 1.0"
        const color1 = rgbaColor.replace("rgba", "").replace("rgb", "").replace("(", "").replace(")", "");
        const colorStrs = color1.split(",");

        let result: string = "";
        if (colorStrs.length !== 4) {
            return "0.0, 0.0, 0.0, 1.0";
        }

        for (let ii = 0; ii < colorStrs.length; ii++) {
            const colorStr = colorStrs[ii];
            const colorNum = parseFloat(colorStr);
            if (isNaN(colorNum)) {
                return "0.0, 0.0, 0.0, 1.0";
            }
            if (ii < 3) {
                result = result + `${colorNum / 255}` + ", ";
            } else {
                result = result + `${colorNum}`;
            }
        }
        return result;
    }

    _ElementLinesWebGl = () => {
        const mountRef = React.useRef<HTMLDivElement>(null);

        const fun1 = () => {
            const scene = new Scene();
            const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);

            camera.position.z = 1;
            const containerWidth = this.plot.plotWidth;
            const containerHeight = this.plot.plotHeight;

            const pixelWorldUnitRatioX = containerWidth / 2;
            const pixelWorldUnitRatioY = containerHeight / 2;

            const renderer = new WebGLRenderer({ alpha: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(containerWidth, containerHeight);
            mountRef.current!.appendChild(renderer.domElement);

            this.plot.xy.forEach((XorYData: number[], index: number) => {
                if (index % 2 === 1 || this.plot.getTraceHidden(this.plot.getYIndex(index)) === true) {
                    return;
                }

                // for both points and lines
                const positions = this.plot.mapXYsToPointsWebGl(index);
                const color = this.plot.yAxes[this.plot.getYIndex(index)].lineColor;

                const showLine = this.plot.yAxes[this.plot.getYIndex(index)].lineStyle === "none" ? false : true;
                const showPoint = this.plot.yAxes[this.plot.getYIndex(index)].pointType === "none" ? false : true;

                // ---------------- points --------------
                if (showPoint === true) {
                    const pointGeometry = new BufferGeometry();
                    pointGeometry.setAttribute('position', new BufferAttribute(positions, 3));
                    const pointSize = this.plot.yAxes[this.plot.getYIndex(index)].pointSize;
                    const pointType = this.plot.yAxes[this.plot.getYIndex(index)].pointType;

                    const shadeTypeValue = pointType === "circle" ?
                        1
                        :
                        pointType === "square" ?
                            0
                            :
                            pointType === "diamond" ?
                                2
                                :
                                pointType === "x" ?
                                    4
                                    :
                                    pointType === "triangle" ?
                                        3
                                        :
                                        pointType === "asterisk" ?
                                            5
                                            :
                                            1;

                    const pointMaterial = new ShaderMaterial({
                        uniforms: {
                            // for some shapes, the actual point size is different from pointSize value
                            size: { value: pointSize },
                            shapeType: { value: shadeTypeValue }
                        },
                        vertexShader: `
                         uniform float size;
                         void main() {
                           gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                           gl_PointSize = size;
                         }
                        `,
                        fragmentShader: `
                        uniform int shapeType;
                        void main() {
                          // Get coordinate within the point
                          vec2 coord = gl_PointCoord - vec2(0.5);
                          gl_FragColor = vec4(${this.calcWebGlShadeColor(color)});
                    
                          if (shapeType == 0) {
                            // Default square (built-in behavior)
                            // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
                          }
                          else if (shapeType == 1) {
                            // Circle - discard fragments outside radius
                            float radius = length(coord);
                            if (radius > 0.5) discard;
                          }
                          else if (shapeType == 2) {
                            // Diamond
                            float diamond = abs(coord.x) + abs(coord.y);
                            if (diamond > 0.5) discard;
                          }
                          else if (shapeType == 3) {
                            // Triangle
                            if (coord.y < -0.25) discard; // Bottom cutoff
                            if (abs(coord.x) > 0.5 * (0.5 - coord.y)) discard; // Sides
                          }
                          else if (shapeType == 4) {
                            // X
                            float lineWidth = 0.1;
                            float diagonal1 = abs(coord.x + coord.y);
                            float diagonal2 = abs(coord.x - coord.y);
                            if (diagonal1 > lineWidth && diagonal2 > lineWidth) discard;
                          }
                          else if (shapeType == 5) {
                            // Asterisk
                            float lineWidth = 0.08;
                            float angle = atan(coord.y, coord.x);
                            float radius = length(coord);
                            
                            // Main cross
                            float cross1 = abs(coord.x);
                            float cross2 = abs(coord.y);
                            
                            // Diagonal crosses (rotated by 45 degrees)
                            float diag1 = abs(coord.x + coord.y) * 0.707; // 1/sqrt(2)
                            float diag2 = abs(coord.x - coord.y) * 0.707;
                            
                            if (radius > 0.5) discard;
                            if (cross1 > lineWidth && cross2 > lineWidth && 
                                diag1 > lineWidth && diag2 > lineWidth) discard;
                          }
                        }
                        `,
                        transparent: true
                    });


                    const points = new Points(pointGeometry, pointMaterial);
                    scene.add(points);
                }

                // ---------------- line ----------------
                if (showLine === true) {
                    const lineGeometry = new LineGeometry();
                    lineGeometry.setPositions(positions);

                    const lineWidth = this.plot.yAxes[this.plot.getYIndex(index)].lineWidth;

                    const lineMaterial = new LineMaterial({
                        worldUnits: false,
                        color: new Color(color),
                        linewidth: lineWidth,
                        resolution: new Vector2(containerWidth, containerHeight),
                        dashed: true,
                        dashSize: this.calcDashSizeWebGl(index),
                        gapSize: this.calcGapSizeWebGl(index),
                    });

                    const line = new Line2(lineGeometry, lineMaterial);
                    line.computeLineDistances();
                    scene.add(line);
                }
            });

            renderer.render(scene, camera);

            return () => {
                mountRef.current?.removeChild(renderer.domElement);
                renderer.dispose();
            };
        };

        React.useEffect(fun1);

        return <div ref={mountRef} style={{ width: this.plot.plotWidth, height: this.plot.plotHeight }} />;
    };

    calcDashSizeWebGl = (index: number) => {
        const yIndex = this.plot.getYIndex(index);
        const yAxis = this.plot.yAxes[yIndex];
        const pixelWorldUnitRatioX = this.plot.plotWidth / 2;
        const pixelWorldUnitRatioY = this.plot.plotHeight / 2;
        const lineWidth = yAxis["lineWidth"] / pixelWorldUnitRatioX;
        switch (yAxis["lineStyle"]) {
            case "solid":
                return 1;
            case "dotted":
                return lineWidth * 1;
            case "dashed":
                return lineWidth * 4;
            case "dash-dot":
                return 1;
            case "dash-dot-dot":
                return 1;
            default:
                return 0;
        }
    };

    calcGapSizeWebGl = (index: number) => {
        const yIndex = this.plot.getYIndex(index);
        const yAxis = this.plot.yAxes[yIndex];
        const pixelWorldUnitRatioX = this.plot.plotWidth / 2;
        const pixelWorldUnitRatioY = this.plot.plotHeight / 2;
        const lineWidth = yAxis["lineWidth"] / pixelWorldUnitRatioX;
        switch (yAxis["lineStyle"]) {
            case "solid":
                return 0;
            case "dotted":
                return lineWidth * 2;
            case "dashed":
                return lineWidth * 2;
            case "dash-dot":
                return 0;
            case "dash-dot-dot":
                return 0;
            default:
                return 1;
        }
    };
}
