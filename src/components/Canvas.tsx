
import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Triangle, IText, Image as FabricImage } from "fabric";
import { Circle as CircleIcon, Square, Triangle as TriangleIcon, Type, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import "../styles/canvas.css";

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<string>("select");

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    setCanvas(fabricCanvas);
    toast("Canvas ready!");

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

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
      fontFamily: "sans-serif",
      fill: "#1a1a1a",
      fontSize: 20,
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
      
      // Create a new HTML Image element
      const img = new Image();
      img.src = imgUrl;
      
      img.onload = () => {
        // Create a new Fabric Image instance from the loaded HTML Image
        const fabricImage = new FabricImage(img, {
          left: 100,
          top: 100,
        });
        
        // Scale the image to a reasonable size
        fabricImage.scaleToWidth(200);
        
        canvas.add(fabricImage);
        canvas.renderAll();
        toast("Image added!");
      };
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="workspace">
      <div className="sidebar">
        <h2 className="text-lg font-semibold mb-4">Elements</h2>
        <div className="space-y-2">
          <button className="element-button" onClick={() => addShape("rectangle")}>
            <Square size={16} /> Rectangle
          </button>
          <button className="element-button" onClick={() => addShape("circle")}>
            <CircleIcon size={16} /> Circle
          </button>
          <button className="element-button" onClick={() => addShape("triangle")}>
            <TriangleIcon size={16} /> Triangle
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
