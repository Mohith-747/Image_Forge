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
  Redo2,
  Trash2,
  LayersIcon,
  ArrowUpIcon,
  ArrowDownIcon
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
  const [elementColor, setElementColor] = useState<string>("#e2e8f0");
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

    // Add object added event listener
    fabricCanvas.on('object:added', (e) => {
      if (e.target) {
        toast(`Layer added: ${e.target.type}`);
      }
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

  const deleteSelected = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.renderAll();
      toast("Element deleted!");
      saveState(canvas);
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
          fill: elementColor,
          width: 100,
          height: 100,
        });
        break;
      case "circle":
        shape = new Circle({
          left: 100,
          top: 100,
          fill: elementColor,
          radius: 50,
        });
        break;
      case "triangle":
        shape = new Triangle({
          left: 100,
          top: 100,
          fill: elementColor,
          width: 100,
          height: 100,
        });
        break;
      case "line":
        shape = new Line([50, 100, 200, 100], {
          stroke: elementColor,
          strokeWidth: 2
        });
        break;
      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
    saveState(canvas);
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
    if (!canvas || !e.target.files) return;

    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const reader = new FileReader();

      reader.onload = (event) => {
        if (!event.target?.result) return;

        const imgUrl = event.target.result.toString();
        
        const img = new Image();
        img.src = imgUrl;
        
        img.onload = () => {
          const fabricImage = new FabricImage(img, {
            left: Math.random() * 100 + 50,
            top: Math.random() * 100 + 50,
          });
          
          fabricImage.scaleToWidth(200);
          
          canvas.add(fabricImage);
          canvas.renderAll();
          saveState(canvas);
          toast("Image added!");

          if (e.target) {
            e.target.value = '';
          }
        };
      };

      reader.readAsDataURL(file);
    }
  };

  const saveCanvas = (format: 'png' | 'jpeg' | 'html') => {
    if (!canvas) return;
    
    if (format === 'html') {
      const svgData = canvas.toSVG();
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head><title>Canvas Export</title></head>
        <body style="display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0;">
          ${svgData}
        </body>
        </html>
      `;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'canvas-export.html';
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const dataURL = canvas.toDataURL({
        format: format,
        multiplier: 1,
        quality: 1
      });
      const link = document.createElement('a');
      link.download = `canvas-image.${format}`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    toast(`Canvas saved as ${format.toUpperCase()}!`);
  };

  const updateSelectedObject = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      if (activeObject.type === 'i-text') {
        activeObject.set({
          fontFamily: fontFamily,
          fontSize: fontSize,
          fill: fontColor
        });
      } else {
        // Update color for shapes
        if (activeObject.type === 'line') {
          activeObject.set({ stroke: elementColor });
        } else {
          activeObject.set({ fill: elementColor });
        }
      }
      canvas.renderAll();
    }
  };

  useEffect(() => {
    updateSelectedObject();
  }, [fontFamily, fontSize, fontColor, elementColor]);

  const moveLayer = (direction: 'up' | 'down') => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      toast("Please select an element first!");
      return;
    }

    if (direction === 'up') {
      canvas.bringForward(activeObject);
      toast("Moved layer forward");
    } else {
      canvas.sendBackwards(activeObject);
      toast("Moved layer backward");
    }

    canvas.renderAll();
    saveState(canvas);
  };

  const bringToFront = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      toast("Please select an element first!");
      return;
    }

    canvas.bringToFront(activeObject);
    canvas.renderAll();
    saveState(canvas);
    toast("Brought to front");
  };

  const sendToBack = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      toast("Please select an element first!");
      return;
    }

    canvas.sendToBack(activeObject);
    canvas.renderAll();
    saveState(canvas);
    toast("Sent to back");
  };

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
              multiple
              onChange={handleImageUpload}
            />
          </label>
          <button className="element-button" onClick={deleteSelected}>
            <Trash2 size={16} /> Delete Selected
          </button>

          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold">Save Options</h3>
            <div className="flex gap-2">
              <button className="element-button flex-1" onClick={() => saveCanvas('png')}>
                Save as PNG
              </button>
              <button className="element-button flex-1" onClick={() => saveCanvas('jpeg')}>
                Save as JPG
              </button>
              <button className="element-button flex-1" onClick={() => saveCanvas('html')}>
                Save as HTML
              </button>
            </div>
          </div>

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

          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold">Element Color</h3>
            <input 
              type="color"
              className="w-full p-1 border rounded"
              value={elementColor}
              onChange={(e) => setElementColor(e.target.value)}
            />
          </div>

          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold">Layer Controls</h3>
            <div className="flex gap-2">
              <button 
                className="element-button flex-1" 
                onClick={() => moveLayer('up')}
                title="Move Up"
              >
                <ArrowUpIcon size={16} /> Move Up
              </button>
              <button 
                className="element-button flex-1" 
                onClick={() => moveLayer('down')}
                title="Move Down"
              >
                <ArrowDownIcon size={16} /> Move Down
              </button>
            </div>
            <div className="flex gap-2">
              <button 
                className="element-button flex-1" 
                onClick={bringToFront}
                title="Bring to Front"
              >
                <LayersIcon size={16} /> Bring to Front
              </button>
              <button 
                className="element-button flex-1" 
                onClick={sendToBack}
                title="Send to Back"
              >
                <LayersIcon size={16} /> Send to Back
              </button>
            </div>
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
