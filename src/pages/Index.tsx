
import { Canvas } from "@/components/Canvas";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-8 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">GraphicForge</h1>
      </header>
      <Canvas />
    </div>
  );
};

export default Index;
