interface SimpleChartProps {
  data: { label: string; value: number; color?: string }[];
  type: 'bar' | 'line' | 'pie';
  height?: number;
}

export const SimpleChart = ({ data, type, height }: SimpleChartProps) => {
  if (type === 'bar') return <BarChart data={data} height={height} />;
  if (type === 'line') return <LineChart data={data} height={height} />;
  if (type === 'pie') return <PieChart data={data as any} />;
  return null;
};

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
}

export const BarChart = ({ data, height = 200 }: BarChartProps) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700 font-medium">{item.label}</span>
            <span className="text-gray-900 font-bold">{item.value}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${item.color || 'bg-blue-600'}`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

export const LineChart = ({ data, height = 200 }: LineChartProps) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((item.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-4">
      <div className="relative" style={{ height }}>
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polyline
            points={points}
            fill="none"
            stroke="rgb(37, 99, 235)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <polygon
            points={`0,100 ${points} 100,100`}
            fill="rgba(37, 99, 235, 0.1)"
          />
        </svg>
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        {data.map((item, index) => (
          <span key={index}>{item.label}</span>
        ))}
      </div>
    </div>
  );
};

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export const PieChart = ({ data, size = 200 }: PieChartProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90;

  const slices = data.map(item => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle: currentAngle,
    };
  });

  const polarToCartesian = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: 50 + radius * Math.cos(rad),
      y: 50 + radius * Math.sin(rad),
    };
  };

  return (
    <div className="flex items-center space-x-6">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {slices.map((slice, index) => {
          const start = polarToCartesian(slice.startAngle, 40);
          const end = polarToCartesian(slice.endAngle, 40);
          const largeArcFlag = slice.percentage > 50 ? 1 : 0;

          return (
            <path
              key={index}
              d={`M 50 50 L ${start.x} ${start.y} A 40 40 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`}
              fill={slice.color}
            />
          );
        })}
        <circle cx="50" cy="50" r="25" fill="white" />
      </svg>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-700">{item.label}</span>
            <span className="text-sm font-bold text-gray-900">
              {item.value} ({((item.value / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  color?: string;
}

export const StatCard = ({ title, value, change, icon, color = 'blue' }: StatCardProps) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    red: 'text-red-600 bg-red-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    purple: 'text-purple-600 bg-purple-100',
  };

  const changeColor = change && change > 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change !== undefined && (
            <p className={`text-sm font-medium mt-2 ${changeColor}`}>
              {change > 0 ? '+' : ''}{change}% from last period
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
