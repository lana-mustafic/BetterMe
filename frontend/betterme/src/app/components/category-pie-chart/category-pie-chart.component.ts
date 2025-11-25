import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { CategoryDistribution } from '../../services/analytics.service';

@Component({
  selector: 'app-category-pie-chart',
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
      <div class="chart-legend">
        @for (item of data; track item.category) {
          <div class="legend-item" (click)="onLegendClick($index)">
            <span class="legend-color" [style.background]="item.color"></span>
            <span class="legend-label">{{ item.category }}</span>
            <span class="legend-value">{{ item.count }} ({{ item.percentage }}%)</span>
          </div>
        }
      </div>
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
    .chart-legend {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .legend-item:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      flex-shrink: 0;
    }
    .legend-label {
      flex: 1;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
    }
    .legend-value {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.85rem;
    }
  `]
})
export class CategoryPieChartComponent implements OnInit, OnChanges {
  @Input() data: CategoryDistribution[] = [];
  @Input() title: string = 'Tasks by Category';

  chartType: ChartType = 'doughnut';
  chartData: ChartData<'doughnut'> = {
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
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
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
      labels: this.data.map(d => d.category),
      datasets: [{
        data: this.data.map(d => d.count),
        backgroundColor: this.data.map(d => d.color),
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 2,
        hoverOffset: 4
      }]
    };
  }

  onLegendClick(index: number) {
    // Could emit event to filter by category
    console.log('Category clicked:', this.data[index].category);
  }
}

