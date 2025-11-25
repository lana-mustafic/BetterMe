import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { PriorityDistribution } from '../../services/analytics.service';

@Component({
  selector: 'app-priority-bar-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <h4>{{ title }}</h4>
        <div class="chart-legend">
          <span class="legend-item">
            <span class="legend-dot" style="background: #e74c3c"></span>
            High
          </span>
          <span class="legend-item">
            <span class="legend-dot" style="background: #f39c12"></span>
            Medium
          </span>
          <span class="legend-item">
            <span class="legend-dot" style="background: #95a5a6"></span>
            Low
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
      gap: 12px;
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
export class PriorityBarChartComponent implements OnInit, OnChanges {
  @Input() data: PriorityDistribution[] = [];
  @Input() title: string = 'Tasks by Priority';

  chartType: ChartType = 'bar';
  chartData: ChartData<'bar'> = {
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
          color: 'rgba(255, 255, 255, 0.7)'
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

    // Sort by priority (High, Medium, Low)
    const sortedData = [...this.data].sort((a, b) => b.priority - a.priority);

    this.chartData = {
      labels: sortedData.map(d => d.name),
      datasets: [
        {
          label: 'Total Tasks',
          data: sortedData.map(d => d.count),
          backgroundColor: sortedData.map(d => d.color),
          borderColor: sortedData.map(d => d.color),
          borderWidth: 2,
          borderRadius: 4
        },
        {
          label: 'Completed',
          data: sortedData.map(d => d.completed),
          backgroundColor: sortedData.map(d => d.color + '80'), // Add transparency
          borderColor: sortedData.map(d => d.color),
          borderWidth: 2,
          borderRadius: 4
        }
      ]
    };
  }
}

