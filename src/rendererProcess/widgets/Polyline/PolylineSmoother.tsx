
/**
 * Smootherize polyline curve
 * 
 * https://codepen.io/francoisromain/pen/XabdZm?html-preprocessor=slim
 */
export class PolylineSmoother {
	constructor() {}

	static smoothing = 0.19;

	static convertPoints = (pointsX: number[], pointsY: number[]) => {
		const result: [number, number][] = [];
		for (let ii = 0; ii < pointsX.length; ii++) {
			result.push([pointsX[ii], pointsY[ii]]);
		}
		return result;
	};

	static map = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
		return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
	};

	static pointsPositionsCalc = (points: [number, number][], w: number, h: number, options: Record<string, any>): [number, number][] =>
		points.map((e: [number, number]) => {
			const x = this.map(e[0], options.xMin, options.xMax, 0, w);
			const y = this.map(e[1], options.yMin, options.yMax, 0, h);
			return [x, y];
		});

	static svgRender = (content: string, w: number, h: number) => `<svg viewBox="0 0 ${w} ${h}" version="1.1" xmlns="http://www.w3.org/2000/svg">
    ${content}
</svg>`;

	static line = (pointA: [number, number], pointB: [number, number]) => {
		const lengthX = pointB[0] - pointA[0];
		const lengthY = pointB[1] - pointA[1];
		return {
			length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
			angle: Math.atan2(lengthY, lengthX),
		};
	};

	static controlPoint =
		(
			line: (
				pointA: [number, number],
				pointB: [number, number]
			) => {
				length: number;
				angle: number;
			},
			smooth: number
		) =>
		(current: [number, number], previous: [number, number], next: [number, number], reverse: boolean) => {
			const p = previous || current;
			const n = next || current;
			const l = line(p, n);

			const angle = l.angle + (reverse ? Math.PI : 0);
			const length = l.length * smooth;
			const x = current[0] + Math.cos(angle) * length;
			const y = current[1] + Math.sin(angle) * length;
			return [x, y];
		};

	static bezierCommand =
		(controlPoint: (current: [number, number], previous: [number, number], next: [number, number], reverse: boolean) => number[]) =>
		(point: [number, number], i: number, a: [number, number][]) => {
			const cps = controlPoint(a[i - 1], a[i - 2], point, false);
			const cpe = controlPoint(point, a[i - 1], a[i + 1], true);
			// const close = i === a.length - 1 ? " z" : "";
			const close = i === a.length - 1 ? "" : "";
			return `C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${point[0]},${point[1]}${close}`;
		};

	static svgPath = (points: [number, number][], command: (point: [number, number], i: number, a: [number, number][]) => string, h: number) => {
		const d = points.reduce(
			// (acc, e, i, a) => (i === 0 ? `M ${a[a.length - 1][0]},${h} L ${e[0]},${h} L ${e[0]},${e[1]}` : `${acc} ${command(e, i, a)}`),
			(acc, e, i, a) => (i === 0 ? `M ${e[0]},${e[1]} ` : `${acc} ${command(e, i, a)}`),
			""
		);

		// return `<path d="${d}" class="svg-path" />`;
		return d;
	};

	static svgCircles = (points: [number, number][]) =>
		points.reduce(
			(acc, point, i, a) => `${acc} <circle cx="${point[0]}" cy="${point[1]}" r="2.5" class="svg-circles" v-for="p in pointsPositions"/>`,
			""
		);

	static resize = (pointsX: number[], pointsY: number[], w: number, h: number): string => {
		// const w = 200;
		// const h = 200;
		const points = this.convertPoints(pointsX, pointsY);

		// const pointsPositions = this.pointsPositionsCalc(points, w, h, this.options);
		const pointsPositions = this.pointsPositionsCalc(points, w, h, { yMin: 0, yMax: h, xMin: 0, xMax: w });
		const bezierCommandCalc = this.bezierCommand(this.controlPoint(this.line, this.smoothing));
		const path = this.svgPath(pointsPositions, bezierCommandCalc, h);
		// const circles = this.svgCircles(pointsPositions);
		// console.log(this.svgRender(path + circles, w, h));
		// this.svgRender(path, w, h);
		return path;
	};
}
