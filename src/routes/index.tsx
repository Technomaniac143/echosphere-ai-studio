import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Calculator" },
      { name: "description", content: "A simple, responsive online calculator." },
      { property: "og:title", content: "Calculator" },
      { property: "og:description", content: "A simple, responsive online calculator." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalculatorPage,
});

type Operator = "+" | "-" | "×" | "÷";

interface CalculatorState {
  current: string;
  previous: string | null;
  operator: Operator | null;
  resetNext: boolean;
}

function formatDisplay(value: string): string {
  if (value === "Error") return value;
  if (value.length > 12) {
    const num = parseFloat(value);
    if (!isNaN(num) && !isFinite(num)) return "Error";
    if (!isNaN(num)) return num.toPrecision(10).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1");
  }
  return value;
}

function CalculatorPage() {
  const [state, setState] = useState<CalculatorState>({
    current: "0",
    previous: null,
    operator: null,
    resetNext: false,
  });

  const [history, setHistory] = useState<string>("");

  const calculate = useCallback((a: number, b: number, op: Operator): number => {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  }, []);

  const handleNumber = useCallback((num: string) => {
    setState((prev) => {
      if (prev.resetNext) {
        return { ...prev, current: num, resetNext: false };
      }
      if (prev.current === "0" && num !== ".") {
        return { ...prev, current: num };
      }
      if (num === "." && prev.current.includes(".")) {
        return prev;
      }
      if (prev.current.replace(".", "").length >= 12 && num !== ".") {
        return prev;
      }
      return { ...prev, current: prev.current === "0" ? num : prev.current + num };
    });
  }, []);



  const handleOperator = useCallback((op: Operator) => {
    setState((prev) => {
      if (prev.operator && !prev.resetNext && prev.previous !== null) {
        const result = calculate(parseFloat(prev.previous), parseFloat(prev.current), prev.operator);
        const resultStr = isNaN(result) ? "Error" : result.toString();
        return {
          current: resultStr,
          previous: resultStr,
          operator: op,
          resetNext: true,
        };
      }
      return {
        ...prev,
        previous: prev.current,
        operator: op,
        resetNext: true,
      };
    });
    setHistory((prev) => {
      const current = state.current;
      return `${current} ${op}`;
    });
  }, [calculate, state.current]);

  const handleEquals = useCallback(() => {
    setState((prev) => {
      if (!prev.operator || prev.previous === null) return prev;
      const result = calculate(parseFloat(prev.previous), parseFloat(prev.current), prev.operator);
      const resultStr = isNaN(result) ? "Error" : result.toString();
      setHistory(`${prev.previous} ${prev.operator} ${prev.current} =`);
      return {
        current: resultStr,
        previous: null,
        operator: null,
        resetNext: true,
      };
    });
  }, [calculate]);

  const handleClear = useCallback(() => {
    setState({
      current: "0",
      previous: null,
      operator: null,
      resetNext: false,
    });
    setHistory("");
  }, []);

  const handleBackspace = useCallback(() => {
    setState((prev) => {
      if (prev.resetNext || prev.current === "Error") {
        return { ...prev, current: "0", resetNext: false };
      }
      if (prev.current.length === 1 || (prev.current.length === 2 && prev.current.startsWith("-"))) {
        return { ...prev, current: "0" };
      }
      return { ...prev, current: prev.current.slice(0, -1) };
    });
  }, []);

  const toggleSign = useCallback(() => {
    setState((prev) => {
      if (prev.current === "0" || prev.current === "Error") return prev;
      return { ...prev, current: prev.current.startsWith("-") ? prev.current.slice(1) : "-" + prev.current };
    });
  }, []);

  const handlePercent = useCallback(() => {
    setState((prev) => {
      const num = parseFloat(prev.current);
      if (isNaN(num)) return prev;
      return { ...prev, current: (num / 100).toString() };
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handleNumber(e.key);
      } else if (e.key === ".") {
        handleNumber(".");
      } else if (e.key === "+") {
        handleOperator("+");
      } else if (e.key === "-") {
        handleOperator("-");
      } else if (e.key === "*") {
        handleOperator("×");
      } else if (e.key === "/") {
        e.preventDefault();
        handleOperator("÷");
      } else if (e.key === "Enter" || e.key === "=") {
        handleEquals();
      } else if (e.key === "Escape" || e.key === "c" || e.key === "C") {
        handleClear();
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "%") {
        handlePercent();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNumber, handleOperator, handleEquals, handleClear, handleBackspace, handlePercent]);

  const displayValue = formatDisplay(state.current);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-6 space-y-1 text-right">
          <div className="h-6 text-sm text-muted-foreground">{history}</div>
          <div className="min-h-[3.5rem] text-5xl font-semibold tracking-tight text-card-foreground">
            {displayValue}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <CalcButton variant="secondary" onClick={handleClear}>
            AC
          </CalcButton>
          <CalcButton variant="secondary" onClick={toggleSign}>
            +/−
          </CalcButton>
          <CalcButton variant="secondary" onClick={handlePercent}>
            %
          </CalcButton>
          <CalcButton variant="primary" onClick={() => handleOperator("÷")}>
            ÷
          </CalcButton>

          <CalcButton onClick={() => handleNumber("7")}>7</CalcButton>
          <CalcButton onClick={() => handleNumber("8")}>8</CalcButton>
          <CalcButton onClick={() => handleNumber("9")}>9</CalcButton>
          <CalcButton variant="primary" onClick={() => handleOperator("×")}>
            ×
          </CalcButton>

          <CalcButton onClick={() => handleNumber("4")}>4</CalcButton>
          <CalcButton onClick={() => handleNumber("5")}>5</CalcButton>
          <CalcButton onClick={() => handleNumber("6")}>6</CalcButton>
          <CalcButton variant="primary" onClick={() => handleOperator("-")}>
            −
          </CalcButton>

          <CalcButton onClick={() => handleNumber("1")}>1</CalcButton>
          <CalcButton onClick={() => handleNumber("2")}>2</CalcButton>
          <CalcButton onClick={() => handleNumber("3")}>3</CalcButton>
          <CalcButton variant="primary" onClick={() => handleOperator("+")}>
            +
          </CalcButton>

          <CalcButton className="col-span-2" onClick={() => handleNumber("0")}>
            0
          </CalcButton>
          <CalcButton onClick={() => handleNumber(".")}>.</CalcButton>
          <CalcButton variant="accent" onClick={handleEquals}>
            =
          </CalcButton>
        </div>
      </div>
    </div>
  );
}

interface CalcButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "primary" | "secondary" | "accent";
  className?: string;
}

function CalcButton({ children, onClick, variant = "default", className = "" }: CalcButtonProps) {
  const baseStyles =
    "flex h-14 items-center justify-center rounded-2xl text-xl font-medium transition-colors";


  const variantStyles = {
    default:
      "bg-muted text-muted-foreground hover:bg-muted/80",
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    accent:
      "bg-accent text-accent-foreground hover:bg-accent/90",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
