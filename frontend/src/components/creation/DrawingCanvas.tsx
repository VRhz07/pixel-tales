import { useEffect, useRef, useState } from 'react';
import { 
  PaintBrushIcon, 
  Square3Stack3DIcon, 
  XMarkIcon,
  ArrowUturnLeftIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

// Import fabric types
import * as Fabric from '../../types/fabric';

type FabricObject = Fabric.IObject;
type FabricCanvas = Fabric.ICanvas;

interface DrawingCanvasProps {
  onClose: () => void;
}

const DrawingCanvas = ({ onClose }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [selectedTool, setSelectedTool] = useState<'brush' | 'eraser' | 'shapes'>('brush');
  const [brushSize, setBrushSize] = useState(5);
  const [selectedColor, setSelectedColor] = useState('#000000');
  
  // Use the global fabric object
  const [isFabricReady, setIsFabricReady] = useState(false);
  
  useEffect(() => {
    // Wait for fabric to be loaded from CDN
    if (window.fabric) {
      setIsFabricReady(true);
    } else {
      const checkFabric = setInterval(() => {
        if (window.fabric) {
          setIsFabricReady(true);
          clearInterval(checkFabric);
        }
      }, 100);
      
      return () => clearInterval(checkFabric);
    }
  }, []);

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'
  ];

  const brushSizes = [2, 5, 10, 15, 20];

  useEffect(() => {
    if (canvasRef.current && isFabricReady) {
      const canvas = new window.fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 400,
        backgroundColor: 'white',
        isDrawingMode: true
      } as Fabric.ICanvasOptions);

      fabricCanvasRef.current = canvas;

      // Set initial drawing mode
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color = selectedColor;

      return () => {
        canvas.dispose();
      };
    }
  }, []);

  useEffect(() => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      
      if (selectedTool === 'brush') {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.width = brushSize;
        canvas.freeDrawingBrush.color = selectedColor;
      } else if (selectedTool === 'eraser') {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.width = brushSize;
        canvas.freeDrawingBrush.color = 'white';
      } else {
        canvas.isDrawingMode = false;
      }
    }
  }, [selectedTool, brushSize, selectedColor]);

  const addShape = (shapeType: 'rectangle' | 'circle' | 'triangle') => {
    if (!fabricCanvasRef.current || !isFabricReady) return;

    const canvas = fabricCanvasRef.current;
    const Fabric = window.fabric;
    let shape: FabricObject;

    switch (shapeType) {
      case 'rectangle':
        shape = new Fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 80,
          fill: selectedColor,
          stroke: '#000',
          strokeWidth: 2
        });
        break;
      case 'circle':
        shape = new Fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: selectedColor,
          stroke: '#000',
          strokeWidth: 2
        });
        break;
      case 'triangle':
        shape = new Fabric.Triangle({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: selectedColor,
          stroke: '#000',
          strokeWidth: 2
        });
        break;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
  };

  const undo = () => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      const objects = canvas.getObjects();
      if (objects.length > 0) {
        canvas.remove(objects[objects.length - 1]);
      }
    }
  };

  const clearCanvas = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.backgroundColor = 'white';
      fabricCanvasRef.current.renderAll();
    }
  };

  const saveDrawing = () => {
    if (fabricCanvasRef.current) {
      const dataURL = fabricCanvasRef.current.toDataURL('image/png');
      console.log('Saved drawing:', dataURL);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Drawing Canvas</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[600px]">
          {/* Tool Palette */}
          <div className="w-20 bg-gray-50 border-r p-2 space-y-2">
            {/* Tools */}
            <div className="space-y-1">
              <button
                onClick={() => setSelectedTool('brush')}
                className={`w-full p-2 rounded ${
                  selectedTool === 'brush' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                }`}
                title="Brush"
              >
                <PaintBrushIcon className="h-5 w-5 mx-auto" />
              </button>
              
              <button
                onClick={() => setSelectedTool('eraser')}
                className={`w-full p-2 rounded ${
                  selectedTool === 'eraser' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                }`}
                title="Eraser"
              >
                <div className="w-5 h-5 mx-auto bg-gray-400 rounded"></div>
              </button>
              
              <button
                onClick={() => setSelectedTool('shapes')}
                className={`w-full p-2 rounded ${
                  selectedTool === 'shapes' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                }`}
                title="Shapes"
              >
                <Square3Stack3DIcon className="h-5 w-5 mx-auto" />
              </button>
            </div>

            {/* Brush Sizes */}
            <div className="pt-4 border-t space-y-1">
              {brushSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`w-full p-1 rounded flex justify-center ${
                    brushSize === size ? 'bg-blue-100' : 'hover:bg-gray-200'
                  }`}
                  title={`Size ${size}`}
                >
                  <div 
                    className="bg-gray-600 rounded-full"
                    style={{ width: size, height: size }}
                  />
                </button>
              ))}
            </div>

            {/* Colors */}
            <div className="pt-4 border-t space-y-1">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-full h-8 rounded border-2 ${
                    selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t space-y-1">
              <button
                onClick={undo}
                className="w-full p-2 rounded hover:bg-gray-200"
                title="Undo"
              >
                <ArrowUturnLeftIcon className="h-5 w-5 mx-auto" />
              </button>
              
              <button
                onClick={clearCanvas}
                className="w-full p-2 rounded hover:bg-gray-200"
                title="Clear All"
              >
                <TrashIcon className="h-5 w-5 mx-auto" />
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 p-4 overflow-auto">
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <canvas ref={canvasRef} />
            </div>
            
            {/* Shape Tools */}
            {selectedTool === 'shapes' && (
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => addShape('rectangle')}
                  className="px-3 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Rectangle
                </button>
                <button
                  onClick={() => addShape('circle')}
                  className="px-3 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Circle
                </button>
                <button
                  onClick={() => addShape('triangle')}
                  className="px-3 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Triangle
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={saveDrawing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;
