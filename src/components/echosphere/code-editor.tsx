import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { java } from "@codemirror/lang-java";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const languages = ["JavaScript", "Python", "SQL", "Java"] as const;
type Language = (typeof languages)[number];

const starters: Record<Language, string> = {
  JavaScript: "// Write your solution\nfunction solve(input) {\n  return input;\n}\n",
  Python: "# Write your solution\ndef solve(data):\n    return data\n",
  SQL: "-- Write your query\nselect *\nfrom events\nlimit 10;\n",
  Java: "class Solution {\n  int solve(int n) {\n    return n;\n  }\n}\n",
};

export default function CodeEditorPanel() {
  const [language, setLanguage] = useState<Language>("JavaScript");
  const [values, setValues] = useState<Record<Language, string>>(starters);

  const extensions = useMemo(() => {
    if (language === "Python") return [python()];
    if (language === "SQL") return [sql()];
    if (language === "Java") return [java()];
    return [javascript({ typescript: true })];
  }, [language]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-foreground/10 px-3 py-2">
        {languages.map(l => (
          <button key={l} onClick={() => setLanguage(l)} className={cn("rounded-full px-3 py-1 text-[11px] font-medium", language === l ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-muted/70")}>{l}</button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <CodeMirror
          value={values[language]}
          height="340px"
          extensions={extensions}
          onChange={v => setValues(s => ({ ...s, [language]: v }))}
          basicSetup={{ lineNumbers: true, highlightActiveLine: true, foldGutter: false }}
        />
      </div>
      <p className="border-t border-foreground/10 px-3 py-2 text-[11px] text-muted-foreground">Scratch editor for technical rounds — nothing is submitted yet.</p>
    </div>
  );
}
