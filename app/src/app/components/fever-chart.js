import { LitElement, html } from 'lit-element';
import Chart from 'chart.js';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import Translator from '../util/translator.js';
import FeverDataUtil from '../util/fever-data-util.js';

class FeverChart extends LitElement {
  static get properties() {
    return {
      chart: { type: Object },
      data: { type: Object },
      chartId: { type: String },
      howManyDaysToShow: { type: Number },
      dataToShow: { type: Object },
      colorGradient: { type: Object },
      initialized: { type: Boolean },
      chartInitializerInterval: { type: Object },
      geoCodingInfo: { type: Object },
    };
  }

  constructor() {
    super();
    this.data = null;
    this.chart = null;
    this.chartId = 'fever-chart';
    this.howManyDaysToShow = 5;
    this.dataToShow = null;
    this.colorGradient = '';
    this.initialized = false;
    this.geoCodingInfo = null;
  }

  firstUpdated() {
    // Hacky solution to make sure the chart actually gets initialized
    this.chartInitializerInterval = setInterval(() => this.initChart(), 500);
  }

  initChart() {
    const ctx = this.querySelector(`#${this.chartId}`).getContext('2d');
    this.generateColorGradient(ctx);
    this.chart = new Chart(ctx, {
      type: 'line',
      data: this.parseData(),
      options: this.getOptions(),
    });
    if (this.chart != null) {
      clearInterval(this.chartInitializerInterval);
    }
  }

  updated(_changedProperties) {
    if (_changedProperties.has('data')) {
      if (this.chart && this.data) {
        this.chart.data = this.parseData();
        this.chart.options = this.getOptions();
        this.chart.update();
      }
    }
  }

  generateColorGradient(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 175);
    gradient.addColorStop(0, 'rgba(244, 67, 41, 1)');
    gradient.addColorStop(1, 'rgba(217, 241, 254, 1)');
    this.colorGradient = gradient;
  }

  parseData() {
    const parsedData = this.data;
    dayjs.extend(dayOfYear);
    const dateLabels = [];
    for (let i = this.howManyDaysToShow - 1; i > 0; i -= 1) {
      dateLabels.push(`-${i}d`);
    }

    const dataValues = [];
    const today = dayjs(new Date());
    for (let j = this.howManyDaysToShow - 1; j >= 0; j -= 1) {
      const date = today.subtract(j, 'day').dayOfYear();
      const entriesOnDate = parsedData.filter(entry => dayjs(entry.timestamp).dayOfYear() === date);
      if (entriesOnDate.length > 0) {
        const dailyHigh = Math.max(...entriesOnDate.map(entry => entry.fever_temp));
        if (dailyHigh !== 0) {
          dataValues.push(
            FeverDataUtil.useFahrenheit(this.geoCodingInfo)
              ? FeverDataUtil.celsiusToFahrenheit(dailyHigh)
              : dailyHigh,
          );
        } else {
          dataValues.push(dataValues[j + 1]);
        }
      } else {
        dataValues.push(dataValues[j + 1]);
      }
    }

    // Fill undefined values
    let lastPresentValue = null;
    for (let d = this.howManyDaysToShow - 1; d >= 0; d -= 1) {
      if (typeof dataValues[d] === 'undefined' || dataValues[d] == null) {
        if (d === this.howManyDaysToShow - 1) {
          dataValues[d] = dataValues
            .slice()
            .reverse()
            .find(val => typeof val !== 'undefined');
        } else {
          dataValues[d] = lastPresentValue;
        }
      } else {
        lastPresentValue = dataValues[d];
      }
    }
    dateLabels.push(Translator.get('today'));
    this.dataToShow = dataValues;

    return {
      labels: dateLabels,
      datasets: [
        {
          backgroundColor: this.colorGradient,
          fill: 'start',
          data: dataValues,
        },
      ],
    };
  }

  getMinVal() {
    const minVal = Math.floor(Math.min(...this.dataToShow) - 1);
    if (minVal < 35) {
      return FeverDataUtil.useFahrenheit(this.geoCodingInfo) ? 95 : 35;
    }
    return minVal;
  }

  getMaxVal() {
    const maxVal = Math.ceil(Math.max(...this.dataToShow) + 1);
    if (Number.isNaN(maxVal)) {
      return FeverDataUtil.useFahrenheit(this.geoCodingInfo) ? 107.6 : 43;
    }
    return maxVal;
  }

  getOptions() {
    const minVal = this.getMinVal();
    const maxVal = this.getMaxVal();
    return {
      legend: {
        display: false,
      },
      responsive: true,
      maintainAspectRatio: false,
      spanGaps: false,
      elements: {
        line: {
          tension: 0.000001,
        },
        point: {
          radius: 0,
        },
      },
      plugins: {
        filler: {
          propagate: false,
        },
      },
      scales: {
        xAxes: [
          {
            gridLines: {
              display: false,
            },
            ticks: {
              autoSkip: false,
              maxRotation: 0,
            },
          },
        ],
        yAxes: [
          {
            gridLines: {
              display: true,
            },
            ticks: {
              min: minVal,
              max: maxVal,
              maxTicksLimit: 15,
              stepSize: 1,
              suggestedMin: minVal,
              suggestedMax: maxVal,
              fontFamily: 'Nunito',
              fontSize: window.innerWidth < 720 ? 12 : 18,
              callback: label => `${label}°C`,
            },
          },
        ],
      },
    };
  }

  render() {
    return html`
      <div class="fever-chart">
        <canvas id="${this.chartId}"></canvas>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('fever-chart')) {
  customElements.define('fever-chart', FeverChart);
}
