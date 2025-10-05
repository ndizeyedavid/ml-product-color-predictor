
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

ChartJS.defaults.scale.grid.display = true;
ChartJS.defaults.scale.grid.color = 'rgba(0, 0, 0, 0.1)';
ChartJS.defaults.scale.grid.lineWidth = 1;

export default function App() {
  const [allData, setAllData] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [colorData, setColorData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await fetchAllData();
      setLoading(false);
    })();

    // Set up interval for real-time updates
    const interval = setInterval(fetchAllData, 3000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedColor) {
      fetchColorData(selectedColor);
    }
  }, [selectedColor]);

  const fetchAllData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/detections');
      setAllData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setAllData([]);
    }
  };

  const fetchColorData = async (color) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/detections/${color}`);
      setColorData(response.data);
    } catch (error) {
      console.error('Error fetching color data:', error);
      setColorData([]);
    }
  };

  const uniqueColors = [...new Set(allData.map(d => d.color))];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-900 text-white py-6 mb-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center">
            Real-Time Color Classification
          </h1>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        {/* Overall Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Color Detection Overview</h2>
          <div style={{ width: '100%', height: 400 }}>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <Line
                data={{
                  labels: [...new Set(allData.map(item => item.timestamp))],
                  datasets: uniqueColors.map(color => ({
                    label: color,
                    data: allData
                      .filter(item => item.color === color)
                      .map(item => ({ x: item.timestamp, y: item.count })),
                    borderColor: getColorHex(color),
                    backgroundColor: getColorHex(color),
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: false
                  }))
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      ticks: {
                        maxRotation: 45,
                        minRotation: 45
                      }
                    },
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                        precision: 0
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top'
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          return `${context.dataset.label}: ${context.parsed.y} detections`;
                        }
                      }
                    }
                  },
                  interaction: {
                    intersect: false,
                    mode: 'index'
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Color Selection */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Select Color</h2>
          <div className="flex flex-wrap gap-2">
            {uniqueColors.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`px-4 py-2 rounded-full ${selectedColor === color
                  ? `text-white`
                  : 'hover:bg-gray-300'
                  }`}
                style={{
                  backgroundColor: selectedColor === color
                    ? getColorHex(color)
                    : '#f3f4f6'
                }}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Color Chart */}
        {selectedColor && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">
              {selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1)} Detections
            </h2>
            <div style={{ width: '100%', height: 400 }}>
              <Line
                data={{
                  labels: colorData.map(item => item.timestamp),
                  datasets: [{
                    label: selectedColor,
                    data: colorData.map(item => ({ x: item.timestamp, y: item.count })),
                    borderColor: getColorHex(selectedColor),
                    backgroundColor: getColorHex(selectedColor),
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: false
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      ticks: {
                        maxRotation: 45,
                        minRotation: 45
                      }
                    },
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                        precision: 0
                      }
                    }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          return `Count: ${context.parsed.y} detections`;
                        }
                      }
                    }
                  },
                  interaction: {
                    intersect: false,
                    mode: 'nearest'
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getColorHex(color) {
  const colorMap = {
    red: '#FF0000',
    blue: '#0000FF',
    green: '#00FF00',
    yellow: '#FFFF00',
    orange: '#FFA500',
    purple: '#800080',
    white: '#E9DCC9',
    black: '#000000',
    unknown: '#999999'
  };
  return colorMap[color] || '#999999';
}
