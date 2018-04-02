const React = require('react');
const D3Component = require('idyll-d3-component');
const d3 = require('d3');

const { createStore } = require('curve-store');
const { linear } = require('curve-store/lib/samplers');


var gaussian = require('gaussian');
var distribution = gaussian(0, 1);

// const width = 1200;
// const height = 400;
let r = 10;

const store = createStore({
  y: linear('y')
});

const pointCount = {};
const points = [];
const circles = [];
const repeatTimeouts = [];


const rand = () => {
  return 1 - d3.randomLogNormal(-1.25, 0.65)();
}
const randomPrecision = (prec) => {
  const p = Math.pow(10, prec);
  return Math.round(rand() * p) / p;
}

class CustomD3Component extends D3Component {

    kernelDensityEstimator(kernel, X) {
      return function(V) {
        return X.map(function(x) {
          return [x, d3.mean(V, function(v) { return kernel(x - v); })];
        });
      };
    }

    kernelTriangular(k) {
      return function(v) {
        if (v / k < 0 && v / k > -1) {
          return v/k+1;
        } else if (v / k > 0.0 && v / k < 1) {
          return -v/k + 1;
        }
        if (v / k === 0) {
          return 1;
        }
        return 0;
      }
    }

    kernelUniform(k) {
      return function(v) {
        if (v / k > 1.0 || v / k < -1.0) {
          return 0;
        }
        return 0.5;
      }
    }
    kernelGaussian(k) {
      return function(v) {
        return distribution.pdf(v / k);
      }
    }

    kernelEpanechnikov(k) {
      return function(v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
      };
    }

  initialize(node, props) {
    this.fixPosition = false;

    this.showEstimate = false;
    this.repeat = 1000;

    const width = this.width = window.innerWidth;
    const height = this.height = window.innerHeight;
    const x = this.x = d3.scaleLinear().range([r, width - r]);
    const y = this.y = d3.scaleLinear().range([r, height - r]);
    this.estimateY = d3.scaleLinear().domain([0, 10]).range([height - 2 * r, 2 * r]);
    this.kernalScale = d3.scaleLinear().domain([0, 20]).range([height - 2 * r, 2 * r])
    this.distanceScale = d3.scaleLinear().domain([0, 10]).range(['#222', '#fff'])
    this.indicatorScale = d3.scaleSqrt().domain([0, 15]).range([3, 7])

    r = width / 100 / 2 - 2;

    let svg = this.svg = d3.select(node).append('svg');
    this.fullSVG = svg;
    this.fullSVG.on('click', () => {
      if(this.props.state === 'build-estimate') {
        this.fixPosition = !this.fixPosition
      }
    });
    svg.attr('viewBox', `0 0 ${width} ${height}`)
      .style('width', '100%')
      .style('height', 'auto')
      .style('background', '#000');

    const cGroup = svg.append('g');
    this.estimateGroup = svg.append('g');
    this.estimatePath = this.estimateGroup.append('path').attr('stroke', 'green').style('fill', 'rgba(0, 0, 0, 0)');
    this.estimateIndicator = this.estimateGroup.append('circle').style('fill', 'blue').attr('r', 0);
    this.estimateIndicatorLine = this.estimateGroup.append('line').style('stroke', 'blue').attr('stroke-dasharray', '5, 5').attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y1', 0);
    this.kernalPath = svg.append('g').append('path').attr('stroke', 'red')
    svg = this.svg = cGroup;
    this.pointMaker = svg.append('circle').attr('r', r + 3).attr('cx', x(0.5)).attr('cy', y(0.5)).style('opacity', 0).style('fill', '#e9e9e9');

    this.setKernal(this.props.kernal);
    this.kernal = this.kernalFunc(this.props.k);
    this.estimator = this.kernelDensityEstimator(this.kernal, x.ticks(40));
    this.density = [];

    d3.range(350).map(() => this.addPoint(true));
    // this.addPoint(false);
    // setTimeout(() => this.addPoint(false), 1000);
  }

  addPoint(skip) {
    const { svg, x, y, pointMaker, estimatePath,estimateY, height } = this;
    const nx = randomPrecision(2);
    const ny = 0.5;
    points.push(nx);

    pointCount[nx.toFixed(2)] = (pointCount[nx.toFixed(2)] || 0) + 1;
    if (skip) {
      const circle =
        svg
        .append('circle')
        .attr('cx', x(nx))
        .attr('nx', nx)
        .style('fill', 'white')
        .style('stroke', 'black')
        .attr('cy', y(1) - (2 * (r + 1.5) * pointCount[nx.toFixed(2)]))
        .attr('r', 0)
        .style('fill', 'black');

      circles.push(circle);
      circle
        .transition()
        .duration(750)
        .delay(pointCount[nx.toFixed(2)] * 75)
        .style('fill', 'white')
        .attr('r', r);
      return;
    }
    pointMaker
      .transition()
      .duration(100)
      .attr('cx', x(nx))
      .attr('cy', y(ny))
      .attr('r', r + 5)
      .on("end", () => {
        pointMaker.transition()
          .duration(250)
          .attr('r', r + 3);

        const circle = svg
          .append('circle')
          .attr('r', 0)
          .attr('nx', nx)
          .attr('cx', x(nx))
          .attr('cy', y(0.5))
          .style('fill', 'black')
          .style('stroke', 'black');

        circles.push(circle);

        circle
          .transition()
          .duration(250)
          .attr('r', r)
          .on('end', () => {
            circle.transition()
              .duration(250)
              .style('fill', this.circleFill ? this.circleFill(circle) : 'white')
              .attr('cy', y(1) - (2 * (r + 1.5) * pointCount[nx.toFixed(2)]))
            if (this.repeat) {
              this.repeatTimeout = setTimeout(() => this.addPoint(skip), this.repeat);
            }
          });

          circles.push(circle);
      });


    if (this.showEstimate) {
      // if (!this.density.length) {
        this.density = this.estimator(points);
      // }
      store.clear();
      estimatePath
          .datum(this.density)
          .style("stroke", "#2800d7")
          .attr("stroke-width", 3)
          .attr("stroke-linejoin", "round")
          .attr("d",  d3.line()
              .curve(d3.curveBasis)
              .x(function(d) {
                // console.log(d);
                return x(d[0]);
              })
              .y(function(d) {
                store.set(d[0], { y: d[1] });
                return estimateY(d[1]);
              }));
    }
  }

  showCircleDistance(x) {
    const { kernal, distanceScale } = this;
    const { k } = this.props;

    requestAnimationFrame(() => {
      circles.forEach((c) => {
        c.style('fill',
          distanceScale(kernal((x - +c.attr('nx'))))
        );
      })
      this.circleFill = (c) => () => distanceScale(kernal((x - +c.attr('nx'))));
    })
  }

  drawKernal(nx) {
    const { x, kernalScale, kernal, kernalPath, kernalGroup, k } = this;
    const points = [];
    d3.range(-0.15, .15, 0.001).map((d) => {
      points.push(d);
      // kernalGroup.append('circle')
      //   .attr('cx', x(nx + d))
      //   .attr('cy', kernalScale(kernal(d)))
      //   .attr('fill', 'red')
      //   .attr('r', 2);
    })

    kernalPath
      .datum(points)
      .attr("stroke-linejoin", "round")
      .attr('fill', 'none')
      .attr("d",  d3.line()
          // .curve(d3.curveBasis)
          .x(function(d) {
            // console.log(d);
            return x(nx + d);
          })
          .y(function(d) {
            return kernalScale(kernal(d));
          })
        )
  }

  updateEstimateLine(nx) {
    const sy = store.sample(nx).y;
    this.estimateIndicator.attr('r', indicatorScale(sy)).attr('cx', x(nx)).attr('cy', estimateY(sy));
    this.estimateIndicatorLine
      // .attr('r', indicatorScale(sy))
      .attr('x1', x(nx))
      .attr('x2', x(nx))
      .attr('y1', estimateY(0))
      .attr('y2', estimateY(sy));
  }

  setStatus(newStatus, lastStatus) {
    const { svg, x, y, pointMaker, estimateY, estimatePath, indicatorScale } = this;
    console.log('setting status: ', newStatus, lastStatus);
    switch(newStatus) {
      case 'title':
        break;
      case 'start-drop':
        this.repeat = 500;
        this.showEstimate = false;
        break;
      case 'show-generator':
        pointMaker.style('opacity', 1)
        this.repeat = 100;
        this.showEstimate = false;
        break;
      case 'show-estimate':
        pointMaker.style('opacity', 1)
        this.repeat = 100;
        this.showEstimate = true;
        break;
      case 'build-estimate':
        pointMaker.style('opacity', 1)
        this.repeat = 100;
        this.showEstimate = true;
        this.fullSVG.style('cursor', 'crosshair');
        // pointMaker.style('opacity', 0);
        // this.showCircleDistance(0.8);
        const nx = this.nx = 0.8;
        this.showCircleDistance(nx);
        this.drawKernal(nx);
        this.updateEstimateLine(nx)
        this.fullSVG.on('mousemove', () => {
          if (this.fixPosition) {
            return;
          }
          const nx = this.nx = x.invert(d3.event.pageX);
          this.showCircleDistance(nx);
          this.drawKernal(nx);
          this.updateEstimateLine(nx);
        })
        // this.estimatePath.on('mousemove', () => {
        //   const nx = this.nx = x.invert(d3.event.pageX);
        //   this.showCircleDistance(nx);
        // })
        // this.estimatePath.on('mouseout', () => {
        //   circles.forEach((c) => {
        //     c.style('fill', '#fff');
        //   })
        // })
        break;
      default:
        break;
    }
    if (!this.repeatTimeout) {
      this.addPoint();
    }
  }

  setKernal(kernal) {
    switch(kernal) {
      case "epanechnikov":
        this.kernalFunc = this.kernelEpanechnikov
        this.estimateY.domain([0, 2 * 10 / this.props.amplitude]);
        this.kernalScale.domain([0, 10 * 10 / this.props.amplitude]);
        this.distanceScale.domain([0, 15]);
        break;
      case "uniform":

        this.kernalFunc = this.kernelUniform
        this.estimateY.domain([0, 1 / this.props.amplitude]);
        this.kernalScale.domain([0, 10 / this.props.amplitude]);
        this.distanceScale.domain([0, 0.33]);
        break;
      case "triangular":
        this.kernalFunc = this.kernelTriangular
        this.estimateY.domain([0, 1 / this.props.amplitude]);
        this.kernalScale.domain([0, 10 / this.props.amplitude]);
        this.distanceScale.domain([0, 0.33]);
        break;
      case "normal":
        this.kernalFunc = this.kernelGaussian
        this.estimateY.domain([0, 1 / this.props.amplitude]);
        this.kernalScale.domain([0, 10 / this.props.amplitude]);
        this.distanceScale.domain([0, 0.33]);
        break;
      default:
        break;
    }
  }

  update(props) {
    const { svg, x, y, estimateY, estimatePath } = this;
    console.log(props.kernal)
    if (this.props.kernal !== props.kernal || this.props.amplitude !== props.amplitude) {
      console.log('updating kernal');
      this.setKernal(props.kernal);
    }
    if (this.props.k !== props.k || this.props.kernal !== props.kernal || this.props.amplitude !== props.amplitude) {
      this.kernal = this.kernalFunc(props.k);
      this.estimator = this.kernelDensityEstimator(this.kernal, x.ticks(100));
      console.log(points);
      this.density = this.estimator(points);
      this.drawKernal(this.nx);
      if (props.state === 'build-estimate') {
        this.showCircleDistance(this.nx);
      }
      store.clear();
      estimatePath
          .datum(this.density)
          .style("stroke", "#2800d7")
          .attr("stroke-width", 3)
          .attr("stroke-linejoin", "round")
          .attr("d",  d3.line()
              .curve(d3.curveBasis)
              .x(function(d) {
                // console.log(d);
                return x(d[0]);
              })
              .y(function(d) {
                store.set(d[0], { y: d[1] });
                return estimateY(d[1]);
              }));
    } else if (props.state !== this.props.state) {
      this.setStatus(props.state, this.props.state);
    }
  }
}

module.exports = CustomD3Component;
