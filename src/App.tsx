import { useEffect, useRef, useState } from "react";
import "./App.css";

const launchConfetti = () => {
  const confettiCount = 150;
  const colors = ["#ff0", "#0ff", "#f0f", "#0f0", "#f00", "#00f"];

  for (let i = 0; i < confettiCount; i++) {
    const div = document.createElement("div");
    div.className = "confetti";
    div.style.left = Math.random() * 100 + "vw";
    div.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    div.style.animationDuration = 2 + Math.random() * 2 + "s";
    document.body.appendChild(div);

    setTimeout(() => div.remove(), 4000);
  }
};

export default function App() {
  const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/197i1zCv6JqRYI_8ztVl-uRCYYnpeaWyDECxWnPbqq6s/gviz/tq?tqx=out:json";

  const [numbers, setNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [spinCount, setSpinCount] = useState(0);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const SPIN_DURATION = 25000; // 10 seconds in ms

  const wheelRef = useRef<SVGGElement>(null);

  const size = 400;
  const radius = 180;
  const center = size / 2;

  const loadNumbers = async () => {
    try {
      const res = await fetch(SHEET_URL);
      const text = await res.text();
      const json = JSON.parse(text.substring(47, text.length - 2));
      const rows = json.table.rows;

      const list: string[] = rows
        .map((r: any) => r.c[1]?.v)
        .filter((v: any) => v !== null && v !== undefined)
        .map((v: any) => String(v));

      setNumbers(list);
    } catch (err) {
      console.error("Sheet load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNumbers();
    if (wheelRef.current) {
      wheelRef.current.style.transition = "none";
      wheelRef.current.style.transform = "rotate(0deg)";
    }
    setWinner(null);
    setSpinning(false);
    setSpinCount(0);
    setShowWinnerModal(false);
  }, []);

const spinWheel = () => {
  if (!wheelRef.current || numbers.length === 0 || spinning) return;

  // reset for new spin
  setSpinning(true);
  setWinner(null);
  setShowWinnerModal(false);

  const sliceAngle = 360 / numbers.length;

  // 🎯 pick winner index FIRST
  const winningIndex = Math.floor(Math.random() * numbers.length);

  // mid-angle of that slice (0° = top)
  const midAngle = winningIndex * sliceAngle + sliceAngle / 2;

  // rotate so that slice center lands at top (pointer)
  const stopAngle = 360 - midAngle;

  // add full rotations to make it exciting
  const newSpinCount = spinCount + 1;
  const fullSpins = newSpinCount * 360 * 6; // 6 full turns per spin
  const finalRotation = fullSpins + stopAngle;

  // animate for SPIN_DURATION ms
  wheelRef.current.style.transition =
    `transform ${SPIN_DURATION}ms cubic-bezier(0.15, 0.85, 0.1, 1)`;
  wheelRef.current.style.transform = `rotate(${finalRotation}deg)`;

  // wait exactly SPIN_DURATION ms before deciding winner + showing modal
  setTimeout(() => {
    setSpinCount(newSpinCount);

    const selected = numbers[winningIndex];
    setWinner(selected);
    setSpinning(false);

    setShowWinnerModal(true);
    launchConfetti();
  }, SPIN_DURATION);
};


  const polarToCartesian = (angle: number, r: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad),
    };
  };

  const createSlice = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(endAngle, radius);
    const end = polarToCartesian(startAngle, radius);

    return `
      M ${center} ${center}
      L ${start.x} ${start.y}
      A ${radius} ${radius} 0 0 0 ${end.x} ${end.y}
      Z
    `;
  };

  const getFontSize = () => {
    if (numbers.length <= 10) return 14;
    if (numbers.length <= 30) return 11;
    if (numbers.length <= 50) return 9;
    if (numbers.length <= 80) return 7;
    return 8;
  };

  const formatNumber = (num: string | null) => {
    if (!num) return "";
    const s = String(num);
    if (numbers.length > 10 && s.length > 4) {
      return "****" + s.slice(-4);
    }
    return s;
  };

  return (
    <div className="app-container">
      <h1 className="title">🎉 Lucky Draw 🎉</h1>
      <p className="participant-count">
        Total Participants: {numbers.length}
      </p>

      {loading && <p>Loading participants…</p>}

      {!loading && numbers.length > 0 && (
        <>
          <div className="wheel-wrapper">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              style={{ overflow: "visible" }}
            >
              <g
                ref={wheelRef}
                style={{
                  transformOrigin: "50% 50%",
                  transformBox: "fill-box",
                }}
              >
                {numbers.map((num, i) => {
                  const angle = 360 / numbers.length;
                  const startAngle = i * angle;
                  const endAngle = startAngle + angle;
                  const color = `hsl(${(i / numbers.length) * 360}, 70%, 60%)`;

                  const textPos = polarToCartesian(
                    startAngle + angle / 2,
                    radius * 0.75
                  );

                  return (
                    <g key={i}>
                      <path
                        d={createSlice(startAngle, endAngle)}
                        fill={color}
                        stroke="#fff"
                        strokeWidth="1"
                      />
                      <text
                        x={textPos.x}
                        y={textPos.y}
                        fill="#000"
                        fontSize={getFontSize()}
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${startAngle + angle / 2 + 90}, ${textPos.x}, ${textPos.y})`}
                        style={{
                          textShadow: "0 0 3px white",
                          pointerEvents: "none",
                          userSelect: "none",
                        }}
                      >
                        {formatNumber(num)}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            <div className="pointer">▼</div>
          </div>

          <button
            className="spin-button"
            onClick={spinWheel}
            disabled={spinning}
          >
            {spinning ? "Spinning..." : "SPIN 🎡"}
          </button>

          {/* Winner modal */}
          {showWinnerModal && winner && (
            <div className="modal-overlay">
              <div className="winner-modal">
                <h1>🎊 Congratulations! 🎊</h1>
                <p className="modal-winner-number">
                  {winner}
                </p>
                <button
                  className="close-btn"
                  onClick={() => setShowWinnerModal(false)}
                >
                  ❌ Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
