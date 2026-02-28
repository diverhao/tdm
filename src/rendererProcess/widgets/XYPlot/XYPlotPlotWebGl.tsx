import * as React from "react";
import { OrthographicCamera, Scene, WebGLRenderer, BufferGeometry, BufferAttribute, ShaderMaterial, Points, Color, Vector2 } from "three";
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { type_XYPlot_yAxis as type_yAxis, type_XYPlot_ticksInfo } from "../../../common/types/type_widget_tdl";
import { XYPlotPlot } from "./XYPlotPlot";
import { calcWebGlShadeColor } from "../../../common/GlobalMethods";


export class XYPlotPlotWebGl {
    // XYPlotPlot instance, typed as any to avoid circular import
    _plot: XYPlotPlot;

    constructor(plot: XYPlotPlot) {
        this._plot = plot;
    }

    _ElementLinesWebGl = () => {
        const mountRef = React.useRef<HTMLDivElement>(null);
        const rendererRef = React.useRef<WebGLRenderer | null>(null);
        const plot = this.getPlot();
        const width = plot.getPlotWidth();
        const height = plot.getPlotHeight();

        // dispose on unmount
        React.useEffect(() => {
            return () => {
                if (rendererRef.current !== null) {
                    mountRef.current?.removeChild(rendererRef.current.domElement);
                    rendererRef.current.dispose();
                    rendererRef.current = null;
                }
            };
        }, []);

        const fun1 = () => {

            const yAxes = plot.getMainWidget().getYAxes();

            const scene = new Scene();
            const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);

            camera.position.z = 1;
            const containerWidth = width;
            const containerHeight = height;

            // reuse the existing renderer, or create one on first render
            let renderer = rendererRef.current;
            if (renderer === null) {
                renderer = new WebGLRenderer({ alpha: true });
                rendererRef.current = renderer;
                renderer.setPixelRatio(window.devicePixelRatio);
                mountRef.current!.appendChild(renderer.domElement);
            }
            renderer.setSize(containerWidth, containerHeight);

            yAxes.forEach((yAxis: type_yAxis, index: number) => {

                // for both points and lines
                const positions = plot.mapXYsToPointsWebGl(index);
                const color = yAxis.lineColor;
                const showLine = yAxis.lineStyle === "none" ? false : true;
                const showPoint = yAxis.pointType === "none" ? false : true;

                // ---------------- points --------------
                if (showPoint === true) {
                    const pointGeometry = new BufferGeometry();
                    pointGeometry.setAttribute('position', new BufferAttribute(positions, 3));
                    const pointSize = yAxis.pointSize;
                    const pointType = yAxis.pointType;

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
                            // scale by devicePixelRatio so the visual size matches CSS pixels (e.g. SVG)
                            size: { value: pointSize * window.devicePixelRatio },
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
                          gl_FragColor = vec4(${calcWebGlShadeColor(color)});
                    
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
                if (showLine === true && positions.length >= 6) {
                    const lineGeometry = new LineGeometry();
                    lineGeometry.setPositions(positions);

                    const lineWidth = plot.yAxes[index].lineWidth;

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
        };

        React.useEffect(fun1);

        return <div ref={mountRef} style={{ width: width, height: height }} />;
    };

    calcDashSizeWebGl = (index: number) => {
        const plot = this.getPlot();
        const yAxis = plot.yAxes[index];
        const pixelWorldUnitRatioX = plot.getPlotWidth() / 2;
        const pixelWorldUnitRatioY = plot.getPlotHeight() / 2;
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
        const yIndex = index;
        const plot = this.getPlot();
        const yAxis = plot.yAxes[yIndex];
        const pixelWorldUnitRatioX = plot.getPlotWidth() / 2;
        const pixelWorldUnitRatioY = plot.getPlotHeight() / 2;
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

    getPlot = () => {
        return this._plot;
    }
}
