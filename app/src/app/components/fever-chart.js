import { LitElement, html } from 'lit-element';
import Chart from 'chart.js';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import Translator from '../util/translator';

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
    }

    firstUpdated(_changedProperties) {
        // Hacky solution to make sure the chart actually gets initialized
        this.chartInitializerInterval = setInterval(() => this.initChart(), 500);
    }

    initChart() {
        let ctx = this.querySelector(`#${this.chartId}`).getContext('2d');
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
                this.chart.update();
            }
        }
    }

    generateColorGradient(ctx) {
        let gradient = ctx.createLinearGradient(0, 0, 0, 175);
        gradient.addColorStop(0, 'rgba(244, 67, 41, 1)');
        gradient.addColorStop(1, 'rgba(217, 241, 254, 1)');
        this.colorGradient = gradient;
    }

    parseData() {
        let parsedData = this.data;
        dayjs.extend(dayOfYear);
        let dateLabels = [];
        for (let i = this.howManyDaysToShow - 1; i > 0; i--) {
            dateLabels.push(`-${i}d`);
        }

        let dataValues = [];
        let today = dayjs(new Date());
        for (let j = this.howManyDaysToShow - 1; j >= 0; j--) {
            let date = today.subtract(j, 'day').dayOfYear();
            let entryOnDate = parsedData
                .slice()
                .reverse()
                .find(entry => dayjs(entry.timestamp).dayOfYear() === date);
            if (entryOnDate) {
                dataValues.push(entryOnDate.fever_temp);
            } else {
                dataValues.push(dataValues[j - 1]);
            }
        }

        // Fill undefined values
        let lastPresentValue = null;
        for (let d = this.howManyDaysToShow - 1; d >= 0; d--) {
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

    getOptions() {
        let minVal = Math.floor(Math.min(...this.dataToShow) - 1);
        minVal = minVal > 35 ? minVal : 35;
        let maxVal = Math.ceil(Math.max(...this.dataToShow) + 1);
        maxVal = isNaN(maxVal) ? 43 : maxVal;
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
                            display: false,
                        },
                        ticks: {
                            min: minVal,
                            max: maxVal,
                            maxTicksLimit: 4,
                            stepSize: 3,
                            suggestedMin: minVal,
                            suggestedMax: maxVal,
                            fontFamily: 'Nunito',
                            fontSize: 18,
                            callback: (label, index, labels) => {
                                return label + '°C';
                            },
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
