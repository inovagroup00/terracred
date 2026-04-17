import { cn } from "@credshow/ui";

interface StepperProps {
  total: number;
  current: number; // 1-based
}

export function Stepper({ total, current }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-4">
      {Array.from({ length: total }).map((_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <span
            key={step}
            className={cn(
              "h-2.5 rounded-full transition-all duration-300 ease-out",
              isActive
                ? "w-8 scale-110 bg-orange-600 shadow-sm shadow-orange-300"
                : isDone
                ? "w-2.5 bg-orange-400"
                : "w-2.5 bg-slate-200"
            )}
          />
        );
      })}
    </div>
  );
}
