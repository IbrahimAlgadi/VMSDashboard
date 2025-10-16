/**
 * Charts Component - ECharts Wrapper
 */

(function() {
  'use strict';

  const Charts = {
    instances: {},
    echarts: null,

    /**
     * Initialize charts
     */
    async init() {
      await this.loadECharts();
      console.log('✓ Charts component initialized');
    },

    /**
     * Load ECharts library
     */
    async loadECharts() {
      if (window.echarts) {
        this.echarts = window.echarts;
        return;
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';
        script.onload = () => {
          this.echarts = window.echarts;
          resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    },

    /**
     * Create gauge chart
     */
    createGaugeChart(elementId, options = {}) {
      const {
        title = 'Gauge Chart',
        value = 75,
        max = 100,
        color = ['#198754', '#ffc107', '#dc3545']
      } = options;

      const container = document.getElementById(elementId);
      if (!container) return null;

      const chart = this.echarts.init(container);
      this.instances[elementId] = chart;

      const chartOptions = {
        series: [{
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: max,
          splitNumber: 8,
          axisLine: {
            lineStyle: {
              width: 6,
              color: [
                [0.3, color[2]],
                [0.7, color[1]],
                [1, color[0]]
              ]
            }
          },
          pointer: {
            icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
            length: '12%',
            width: 20,
            offsetCenter: [0, '-60%'],
            itemStyle: {
              color: 'auto'
            }
          },
          axisTick: {
            length: 12,
            lineStyle: {
              color: 'auto',
              width: 2
            }
          },
          splitLine: {
            length: 20,
            lineStyle: {
              color: 'auto',
              width: 5
            }
          },
          axisLabel: {
            color: '#464646',
            fontSize: 14,
            distance: -60,
            formatter: function (value) {
              if (value === max) {
                return max;
              } else if (value === 0) {
                return '0';
              }
              return '';
            }
          },
          title: {
            offsetCenter: [0, '-20%'],
            fontSize: 16,
            color: '#464646'
          },
          detail: {
            fontSize: 36,
            offsetCenter: [0, '0%'],
            valueAnimation: true,
            formatter: function (value) {
              return Math.round(value) + '%';
            },
            color: 'auto'
          },
          data: [{
            value: value,
            name: title
          }]
        }]
      };

      chart.setOption(chartOptions);
      return chart;
    },

    /**
     * Create pie chart
     */
    createPieChart(elementId, options = {}) {
      const {
        title = 'Pie Chart',
        data = [],
        colors = ['#0d6efd', '#198754', '#ffc107', '#dc3545']
      } = options;

      const container = document.getElementById(elementId);
      if (!container) return null;

      const chart = this.echarts.init(container);
      this.instances[elementId] = chart;

      const chartOptions = {
        color: colors,
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          bottom: '5%',
          left: 'center',
          textStyle: {
            fontSize: 12
          }
        },
        series: [{
          name: title,
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 24,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: data
        }]
      };

      chart.setOption(chartOptions);
      return chart;
    },

    /**
     * Create line chart
     */
    createLineChart(elementId, options = {}) {
      const {
        title = 'Line Chart',
        xAxisData = [],
        series = [],
        colors = ['#0d6efd', '#198754', '#ffc107']
      } = options;

      const container = document.getElementById(elementId);
      if (!container) return null;

      const chart = this.echarts.init(container);
      this.instances[elementId] = chart;

      const chartOptions = {
        color: colors,
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985'
            }
          }
        },
        legend: {
          data: series.map(s => s.name),
          bottom: '5%',
          textStyle: {
            fontSize: 12
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '3%',
          containLabel: true
        },
        xAxis: [{
          type: 'category',
          boundaryGap: false,
          data: xAxisData,
          axisLabel: {
            fontSize: 11
          }
        }],
        yAxis: [{
          type: 'value',
          axisLabel: {
            fontSize: 11
          }
        }],
        series: series.map(s => ({
          name: s.name,
          type: 'line',
          smooth: true,
          areaStyle: {
            opacity: 0.3
          },
          emphasis: {
            focus: 'series'
          },
          data: s.data
        }))
      };

      chart.setOption(chartOptions);
      return chart;
    },

    /**
     * Create bar chart
     */
    createBarChart(elementId, options = {}) {
      const {
        xAxisData = [],
        series = [],
        colors = ['#0d6efd', '#198754']
      } = options;

      const container = document.getElementById(elementId);
      if (!container) return null;

      const chart = this.echarts.init(container);
      this.instances[elementId] = chart;

      const chartOptions = {
        color: colors,
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: series.map(s => s.name),
          bottom: '5%'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '3%',
          containLabel: true
        },
        xAxis: [{
          type: 'category',
          data: xAxisData,
          axisTick: {
            alignWithLabel: true
          }
        }],
        yAxis: [{
          type: 'value'
        }],
        series: series.map(s => ({
          name: s.name,
          type: 'bar',
          barWidth: '60%',
          data: s.data
        }))
      };

      chart.setOption(chartOptions);
      return chart;
    },

    /**
     * Update chart data
     */
    updateChart(elementId, data) {
      const chart = this.instances[elementId];
      if (!chart) return;

      chart.setOption(data);
    },

    /**
     * Resize chart
     */
    resizeChart(elementId) {
      const chart = this.instances[elementId];
      if (chart) {
        chart.resize();
      }
    },

    /**
     * Resize all charts
     */
    resizeAll() {
      Object.values(this.instances).forEach(chart => {
        if (chart) chart.resize();
      });
    },

    /**
     * Dispose chart
     */
    disposeChart(elementId) {
      const chart = this.instances[elementId];
      if (chart) {
        chart.dispose();
        delete this.instances[elementId];
      }
    },

    /**
     * Dispose all charts
     */
    disposeAll() {
      Object.keys(this.instances).forEach(id => {
        this.disposeChart(id);
      });
    },

    /**
     * Export chart as image
     */
    exportChart(elementId, filename = 'chart.png') {
      const chart = this.instances[elementId];
      if (!chart) return;

      const url = chart.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      });

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
    }
  };

  // Handle window resize
  window.addEventListener('resize', () => {
    Charts.resizeAll();
  });

  // Handle theme changes
  document.addEventListener('themeChanged', () => {
    // Reinitialize charts with new theme
    setTimeout(() => {
      Charts.resizeAll();
    }, 100);
  });

  // Expose globally
  window.Charts = Charts;

})();

