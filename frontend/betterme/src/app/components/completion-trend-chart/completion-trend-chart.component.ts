import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { CompletionTrend } from '../../services/analytics.service';

@Component({
  selector: 'app-completion-trend-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <h4>{{ title }}</h4>
        <div class="chart-legend">
          <span class="legend-item">
            <span class="legend-dot" style="background: #667eea"></span>
            Completed
          </span>
          <span class="legend-item">
            <span class="legend-dot" style="background: #43e97b"></span>
            Created
          </span>
        </div>
      </div>
      <canvas baseChart
        [data]="chartData"
        [options]="chartOptions"
        [type]="chartType">
      </canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      width: 100%;
      height: 100%;
      padding: 16px;
    }
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .chart-header h4 {
      margin: 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 1.1rem;
    }
    .chart-legend {
      display: flex;
      gap: 16px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.7);
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
  `]
})
export class CompletionTrendChartComponent implements OnInit, OnChanges {
  @Input() data: CompletionTrend[] = [];
  @Input() title: string = 'Completion Trends';

  chartType: ChartType = 'line';
  chartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          stepSize: 1
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };

  ngOnInit() {
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.updateChart();
    }
  }

  private updateChart() {
    if (!this.data || this.data.length === 0) {
      this.chartData = {
        labels: [],
        datasets: []
      };
      return;
    }

    // Format dates for labels (show only day/month for readability)
    const labels = this.data.map(trend => {
      const date = new Date(trend.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    this.chartData = {
      labels,
      datasets: [
        {
          label: 'Completed',
          data: this.data.map(t => t.completed),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: 'Created',
          data: this.data.map(t => t.created),
          borderColor: '#43e97b',
          backgroundColor: 'rgba(67, 233, 123, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#43e97b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    };
  }
}

