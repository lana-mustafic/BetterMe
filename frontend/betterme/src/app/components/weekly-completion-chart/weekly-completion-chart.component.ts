import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

export interface WeeklyData {
  day: string;
  completed: number;
  created: number;
}

@Component({
  selector: 'app-weekly-completion-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <h4>{{ title }}</h4>
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
      margin-bottom: 16px;
    }
    .chart-header h4 {
      margin: 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 1.1rem;
    }
  `]
})
export class WeeklyCompletionChartComponent implements OnInit, OnChanges {
  @Input() data: WeeklyData[] = [];
  @Input() title: string = 'Weekly Activity';

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
        display: true,
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          usePointStyle: true,
          padding: 15
        }
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
        stacked: true,
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        stacked: true,
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

    this.chartData = {
      labels: this.data.map(d => d.day.substring(0, 3)), // Short day names
      datasets: [
        {
          label: 'Completed',
          data: this.data.map(d => d.completed),
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderColor: '#667eea',
          borderWidth: 2
        },
        {
          label: 'Created',
          data: this.data.map(d => d.created),
          backgroundColor: 'rgba(67, 233, 123, 0.8)',
          borderColor: '#43e97b',
          borderWidth: 2
        }
      ]
    };
  }
}

