import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, MousePointer2 } from "lucide-react";

interface CanvasElement {
  id: string;
  type: "rect" | "text" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  color?: string;
}

interface CanvasProps {
  zoom: number;
}

const sampleElements: CanvasElement[] = [
  {
    id: "1",
    type: "rect",
    x: 60,
    y: 60,
    width: 600,
    height: 100,
    color: "#0ea5e9",
  },
  {
    id: "2",
    type: "text",
    x: 80,
    y: 90,
    width: 400,
    height: 40,
    content: "Quarterly Business Report",
  },
  {
    id: "3",
    type: "rect",
    x: 60,
    y: 200,
    width: 280,
    height: 200,
    color: "#f1f5f9",
  },
  {
    id: "4",
    type: "rect",
    x: 380,
    y: 200,
    width: 280,
    height: 200,
    color: "#f1f5f9",
  },
  {
    id: "5",
    type: "rect",
    x: 60,
    y: 440,
    width: 600,
    height: 80,
    color: "#10b981",
  },
];

export function Canvas({ zoom }: CanvasProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scale = zoom / 100;

  return (
    <div className="flex-1 canvas-bg overflow-auto p-8">
      {/* Canvas Container */}
      <div
        className="mx-auto transition-transform duration-200 origin-top"
        style={{ transform: `scale(${scale})` }}
      >
        {/* Document */}
        <div
          className={cn(
            "relative bg-card shadow-lg rounded-sm overflow-hidden",
            "transition-shadow duration-200"
          )}
          style={{
            width: 720,
            height: 560,
          }}
          onClick={() => setSelectedId(null)}
        >
          {/* Grid Pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
            }}
          />

          {/* Elements */}
          {sampleElements.map((element) => (
            <div
              key={element.id}
              className={cn(
                "absolute cursor-pointer transition-all duration-150",
                selectedId === element.id &&
                  "ring-2 ring-primary ring-offset-2 ring-offset-card"
              )}
              style={{
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
                backgroundColor:
                  element.type === "rect" ? element.color : "transparent",
                borderRadius: element.type === "rect" ? 8 : 0,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(element.id);
              }}
            >
              {element.type === "text" && (
                <span className="text-2xl font-bold text-primary-foreground drop-shadow-sm">
                  {element.content}
                </span>
              )}

              {/* Resize Handles (when selected) */}
              {selectedId === element.id && (
                <>
                  {["nw", "ne", "sw", "se"].map((pos) => (
                    <div
                      key={pos}
                      className={cn(
                        "absolute w-3 h-3 bg-primary rounded-full border-2 border-primary-foreground shadow-md",
                        pos.includes("n") ? "-top-1.5" : "-bottom-1.5",
                        pos.includes("w") ? "-left-1.5" : "-right-1.5"
                      )}
                    />
                  ))}
                </>
              )}
            </div>
          ))}

          {/* Empty State Hint */}
          {sampleElements.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <Plus className="w-8 h-8" />
              </div>
              <p className="font-medium">Start designing</p>
              <p className="text-sm">Add elements from the sidebar</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Selection Info */}
      {selectedId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2 animate-fade-in">
          <MousePointer2 className="w-4 h-4" />
          Element selected — Press Delete to remove
        </div>
      )}
    </div>
  );
}
