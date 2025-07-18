interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  
  startTiming(operation: string): (success?: boolean, error?: string) => void {
    const start = Date.now();
    
    return (success: boolean = true, error?: string) => {
      const duration = Date.now() - start;
      
      this.metrics.push({
        operation,
        duration,
        timestamp: Date.now(),
        success,
        error
      });
      
      // 최대 개수 초과 시 오래된 메트릭 제거
      if (this.metrics.length > this.maxMetrics) {
        this.metrics = this.metrics.slice(-this.maxMetrics);
      }
      
      // 느린 요청 로깅
      if (duration > 5000) {
        console.warn(`Slow operation: ${operation} took ${duration}ms`);
      }
    };
  }
  
  getMetrics(operation?: string): PerformanceMetric[] {
    return operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;
  }
  
  getAverageResponseTime(operation?: string): number {
    const metrics = this.getMetrics(operation);
    if (metrics.length === 0) return 0;
    
    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }
  
  getErrorRate(operation?: string): number {
    const metrics = this.getMetrics(operation);
    if (metrics.length === 0) return 0;
    
    const errors = metrics.filter(m => !m.success).length;
    return errors / metrics.length;
  }
  
  getStats(): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    slowRequests: number;
  } {
    const total = this.metrics.length;
    const avgTime = this.getAverageResponseTime();
    const errorRate = this.getErrorRate();
    const slowRequests = this.metrics.filter(m => m.duration > 5000).length;
    
    return {
      totalRequests: total,
      averageResponseTime: avgTime,
      errorRate,
      slowRequests
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();