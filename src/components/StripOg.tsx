import type { MazeData, PrintJob, StripSection, SudokuData } from "@/lib/types";

const INK = "#11110e";
const PAPER = "#f6f0dd";
const STAMP = "#c45c26";

function Rule() {
  return (
    <div
      style={{
        width: "100%",
        height: 1,
        borderTop: "1px dashed #11110e",
        marginTop: 10,
        marginBottom: 10,
      }}
    />
  );
}

function Label({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        letterSpacing: 2,
        textTransform: "uppercase" as const,
        fontWeight: 700,
        marginBottom: 6,
        color: STAMP,
      }}
    >
      {children}
    </div>
  );
}

function MazeBoxes({ maze }: { maze: MazeData }) {
  const cell = Math.floor(352 / maze.cols);
  const [sr, sc] = maze.start;
  const [er, ec] = maze.end;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {maze.cells.map((row, r) => (
        <div key={r} style={{ display: "flex", flexDirection: "row" }}>
          {row.map((w, c) => {
            const start = r === sr && c === sc;
            const end = r === er && c === ec;
            return (
              <div
                key={c}
                style={{
                  width: cell,
                  height: cell,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderTopWidth: w.n ? 2 : 0,
                  borderRightWidth: w.e ? 2 : 0,
                  borderBottomWidth: w.s ? 2 : 0,
                  borderLeftWidth: w.w ? 2 : 0,
                  borderTopStyle: "solid",
                  borderRightStyle: "solid",
                  borderBottomStyle: "solid",
                  borderLeftStyle: "solid",
                  borderTopColor: INK,
                  borderRightColor: INK,
                  borderBottomColor: INK,
                  borderLeftColor: INK,
                }}
              >
                {start ? (
                  <div style={{ width: 6, height: 6, background: INK, borderRadius: 6 }} />
                ) : end ? (
                  <div style={{ width: 7, height: 7, background: INK }} />
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function SudokuBoxes({ sudoku }: { sudoku: SudokuData }) {
  const cell = sudoku.size >= 9 ? 32 : sudoku.size >= 6 ? 36 : 44;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        border: "2px solid #11110e",
        width: cell * sudoku.size + 4,
      }}
    >
      {sudoku.puzzle.map((row, r) => (
        <div key={r} style={{ display: "flex", flexDirection: "row" }}>
          {row.map((val, c) => {
            const boxRight = (c + 1) % sudoku.boxCols === 0 && c !== sudoku.size - 1;
            const boxBottom = (r + 1) % sudoku.boxRows === 0 && r !== sudoku.size - 1;
            return (
              <div
                key={c}
                style={{
                  width: cell,
                  height: cell,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: sudoku.size >= 9 ? 14 : 18,
                  fontWeight: 700,
                  color: INK,
                  borderRightWidth: c === sudoku.size - 1 ? 0 : boxRight ? 2 : 1,
                  borderBottomWidth: r === sudoku.size - 1 ? 0 : boxBottom ? 2 : 1,
                  borderRightStyle: "solid",
                  borderBottomStyle: "solid",
                  borderRightColor: INK,
                  borderBottomColor: INK,
                }}
              >
                {val === 0 ? "" : String(val)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function SectionView({ section }: { section: StripSection }) {
  if (section.kind === "header") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", fontSize: 10, letterSpacing: 6, fontWeight: 700 }}>
          · TEARAWAY ·
        </div>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 700, marginTop: 8 }}>
          {section.lines[0]}
        </div>
        <div style={{ display: "flex", fontSize: 12, fontWeight: 700, marginTop: 6, letterSpacing: 2 }}>
          {section.lines[1]}
        </div>
        <div style={{ display: "flex", fontSize: 11, marginTop: 4 }}>{section.lines[2]}</div>
        <div style={{ display: "flex", fontSize: 10, marginTop: 2, opacity: 0.75 }}>
          {section.lines[3]}
        </div>
        <Rule />
      </div>
    );
  }

  if (section.kind === "footer") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Rule />
        <div style={{ display: "flex", fontSize: 11, letterSpacing: 4, fontWeight: 700, color: STAMP }}>
          TEAR HERE
        </div>
        <div style={{ display: "flex", fontSize: 11, marginTop: 8, opacity: 0.85, textAlign: "center" }}>
          {section.lines[1]}
        </div>
        <div style={{ display: "flex", fontSize: 9, marginTop: 6, letterSpacing: 2, opacity: 0.55 }}>
          {section.lines[2]}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Label>{section.title}</Label>
      {section.lines.map((line, i) => (
        <div key={i} style={{ display: "flex", fontSize: 13, lineHeight: 1.35, marginBottom: 4 }}>
          {line}
        </div>
      ))}
      {section.kind === "maze" && section.maze ? (
        <div style={{ display: "flex", marginTop: 6, justifyContent: "center" }}>
          <MazeBoxes maze={section.maze} />
        </div>
      ) : null}
      {section.kind === "sudoku" && section.sudoku ? (
        <div style={{ display: "flex", marginTop: 8, justifyContent: "center" }}>
          <SudokuBoxes sudoku={section.sudoku} />
        </div>
      ) : null}
      <Rule />
    </div>
  );
}

/** Satori/ImageResponse-friendly strip (div borders, no SVG). */
export function StripOg({ job }: { job: PrintJob }) {
  return (
    <div
      style={{
        width: 384,
        height: "100%",
        background: PAPER,
        color: INK,
        display: "flex",
        flexDirection: "column",
        padding: "12px 16px 20px",
        fontFamily: "IBM Plex Mono",
      }}
    >
      {job.sections.map((section, i) => (
        <SectionView key={`${section.id}-${i}`} section={section} />
      ))}
    </div>
  );
}
