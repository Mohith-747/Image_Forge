import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Triangle, IText, Image as FabricImage, Line } from "fabric";
import { 
  Circle as CircleIcon, 
  Square, 
  Triangle as TriangleIcon, 
  Type, 
  Image as ImageIcon,
  Save,
  Minus,
  Undo2,
  Redo2
} from "lucide-react";
import { toast } from "sonner";
import "../styles/canvas.css";

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<string>("select");
  const [fontSize, setFontSize] = useState<number>(20);
  const [fontFamily, setFontFamily] = useState<string>("Arial");
  const [fontColor, setFontColor] = useState<string>("#000000");
  const historyRef = useRef<{ past: string[], future: string[] }>({ past: [], future: [] });

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth * 0.6,
      height: window.innerHeight * 0.8,
      backgroundColor: "#ffffff",
    });

    setCanvas(fabricCanvas);
    toast("Canvas ready!");

    // Save initial state
    saveState(fabricCanvas);

    // Make canvas responsive
    window.addEventListener('resize', () => {
      fabricCanvas.setDimensions({
        width: window.innerWidth * 0.6,
        height: window.innerHeight * 0.8
      });
    });

    fabricCanvas.on('object:modified', () => {
      saveState(fabricCanvas);
    });

    return () => {
      fabricCanvas.dispose();
      window.removeEventListener('resize', () => {});
    };
  }, []);

  const saveState = (fabricCanvas: FabricCanvas) => {
    const state = JSON.stringify(fabricCanvas.toJSON());
    historyRef.current.past.push(state);
    historyRef.current.future = [];
  };

  const undo = () => {
    if (!canvas || historyRef.current.past.length <= 1) return;
    
    const current = historyRef.current.past.pop();
    if (current) {
      historyRef.current.future.push(current);
      const previousState = historyRef.current.past[historyRef.current.past.length - 1];
      canvas.loadFromJSON(JSON.parse(previousState), () => {
        canvas.renderAll();
        toast("Undo successful!");
      });
    }
  };

  const redo = () => {
    if (!canvas || !historyRef.current.future.length) return;
    
    const nextState = historyRef.current.future.pop();
    if (nextState) {
      historyRef.current.past.push(nextState);
      canvas.loadFromJSON(JSON.parse(nextState), () => {
        canvas.renderAll();
        toast("Redo successful!");
      });
    }
  };

  const addShape = (type: string) => {
    if (!canvas) return;

    let shape;
    switch (type) {
      case "rectangle":
        shape = new Rect({
          left: 100,
          top: 100,
          fill: "#e2e8f0",
          width: 100,
          height: 100,
        });
        break;
      case "circle":
        shape = new Circle({
          left: 100,
          top: 100,
          fill: "#e2e8f0",
          radius: 50,
        });
        break;
      case "triangle":
        shape = new Triangle({
          left: 100,
          top: 100,
          fill: "#e2e8f0",
          width: 100,
          height: 100,
        });
        break;
      case "line":
        shape = new Line([50, 100, 200, 100], {
          stroke: '#000000',
          strokeWidth: 2
        });
        break;
      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  };

  const addText = () => {
    if (!canvas) return;
    const text = new IText("Click to edit text", {
      left: 100,
      top: 100,
      fontFamily: fontFamily,
      fill: fontColor,
      fontSize: fontSize,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      if (!event.target?.result) return;

      const imgUrl = event.target.result.toString();
      
      const img = new Image();
      img.src = imgUrl;
      
      img.onload = () => {
        const fabricImage = new FabricImage(img, {
          left: 100,
          top: 100,
        });
        
        fabricImage.scaleToWidth(200);
        
        canvas.add(fabricImage);
        canvas.renderAll();
        toast("Image added!");
      };
    };

    reader.readAsDataURL(file);
  };

  const saveCanvas = () => {
    if (!canvas) return;
    const dataURL = canvas.toDataURL({
      format: 'png',
      multiplier: 1,
      quality: 1
    });
    const link = document.createElement('a');
    link.download = 'canvas-image.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Canvas saved!");
  };

  const updateSelectedObject = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'i-text') {
      activeObject.set({
        fontFamily: fontFamily,
        fontSize: fontSize,
        fill: fontColor
      });
      canvas.renderAll();
    }
  };

  useEffect(() => {
    updateSelectedObject();
  }, [fontFamily, fontSize, fontColor]);

  return (
    <div className="workspace">
      <div className="sidebar">
        <h2 className="text-lg font-semibold mb-4">Elements</h2>
        <div className="space-y-2">
          <div className="flex gap-2 mb-4">
            <button 
              className="element-button flex-1" 
              onClick={undo}
              title="Undo"
            >
              <Undo2 size={16} /> Undo
            </button>
            <button 
              className="element-button flex-1" 
              onClick={redo}
              title="Redo"
            >
              <Redo2 size={16} /> Redo
            </button>
          </div>
          <button className="element-button" onClick={() => addShape("rectangle")}>
            <Square size={16} /> Rectangle
          </button>
          <button className="element-button" onClick={() => addShape("circle")}>
            <CircleIcon size={16} /> Circle
          </button>
          <button className="element-button" onClick={() => addShape("triangle")}>
            <TriangleIcon size={16} /> Triangle
          </button>
          <button className="element-button" onClick={() => addShape("line")}>
            <Minus size={16} /> Line
          </button>
          <button className="element-button" onClick={addText}>
            <Type size={16} /> Text
          </button>
          <label className="element-button cursor-pointer">
            <ImageIcon size={16} /> Upload Image
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>
          <button className="element-button" onClick={saveCanvas}>
            <Save size={16} /> Save Canvas
          </button>

          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold">Text Options</h3>
            <select 
              className="w-full p-2 border rounded"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Tahoma">Tahoma</option>
              <option value="Trebuchet MS">Trebuchet MS</option>
              <option value="Impact">Impact</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
            </select>

            <input 
              type="number"
              className="w-full p-2 border rounded"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              min="8"
              max="72"
            />

            <input 
              type="color"
              className="w-full p-1 border rounded"
              value={fontColor}
              onChange={(e) => setFontColor(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="canvas-wrapper">
        <div className="canvas-container">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
};
