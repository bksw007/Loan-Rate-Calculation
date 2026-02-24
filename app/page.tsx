"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

type CarType = "new" | "used";

type LoanResult = {
  downAmount: number;
  financeAmount: number;
  totalInterest: number;
  totalDebt: number;
  months: number;
  monthlyBase: number;
  vatPerMonth: number;
  monthlyTotal: number;
  totalPaid: number;
};

const money0 = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const money2 = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const compareTerms = [4, 5, 6, 7];
const selectableTerms = [2, 3, 4, 5, 6, 7, 8];

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

function calculateLoan(price: number, downPercent: number, interestRate: number, years: number, carType: CarType): LoanResult {
  const downAmount = price * (downPercent / 100);
  const financeAmount = price - downAmount;
  const totalInterest = financeAmount * (interestRate / 100) * years;
  const totalDebt = financeAmount + totalInterest;
  const months = years * 12;
  const monthlyBase = totalDebt / months;
  const vatPerMonth = carType === "used" ? monthlyBase * 0.07 : 0;
  const monthlyTotal = monthlyBase + vatPerMonth;
  const totalPaid = downAmount + monthlyTotal * months;

  return {
    downAmount,
    financeAmount,
    totalInterest,
    totalDebt,
    months,
    monthlyBase,
    vatPerMonth,
    monthlyTotal,
    totalPaid
  };
}

export default function Page() {
  const [price, setPrice] = useState(800000);
  const [downPercent, setDownPercent] = useState(25);
  const [interestRate, setInterestRate] = useState(2.5);
  const [years, setYears] = useState(5);
  const [carType, setCarType] = useState<CarType>("new");
  const [darkMode, setDarkMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const infographicRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("loan-theme");
    if (storedTheme === "dark") {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem("loan-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const loan = useMemo(
    () => calculateLoan(price, downPercent, interestRate, years, carType),
    [price, downPercent, interestRate, years, carType]
  );

  const comparison = useMemo(
    () => compareTerms.map((term) => calculateLoan(price, downPercent, interestRate, term, carType)),
    [price, downPercent, interestRate, carType]
  );

  const isDark = darkMode;
  const axisColor = isDark ? "#cbd5e1" : "#475569";
  const gridColor = isDark ? "rgba(148,163,184,0.18)" : "rgba(148,163,184,0.22)";

  const structureData = useMemo<ChartData<"doughnut">>(() => {
    const vatTotal = carType === "used" ? loan.vatPerMonth * loan.months : 0;

    return {
      labels: ["เงินดาวน์", "ยอดจัด", "ดอกเบี้ย", "VAT"],
      datasets: [
        {
          data: [loan.downAmount, loan.financeAmount, loan.totalInterest, vatTotal],
          backgroundColor: ["#d97706", "#0ea5e9", "#ef4444", "#94a3b8"],
          borderWidth: 0
        }
      ]
    };
  }, [carType, loan.downAmount, loan.financeAmount, loan.months, loan.totalInterest, loan.vatPerMonth]);

  const structureOptions = useMemo<ChartOptions<"doughnut">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: axisColor, usePointStyle: true }
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.label}: ${money0.format(Number(context.raw))} บาท`;
            }
          }
        }
      }
    }),
    [axisColor]
  );

  const comparisonData = useMemo<ChartData<"bar">>(() => {
    const colors = compareTerms.map((term) => (term === years ? "#0ea5e9" : "#94a3b8"));

    return {
      labels: compareTerms.map((term) => `${term} ปี`),
      datasets: [
        {
          type: "bar",
          label: "ค่างวด/เดือน",
          data: comparison.map((item) => item.monthlyTotal),
          backgroundColor: colors
        },
        {
          type: "bar",
          label: "ดอกเบี้ยรวม",
          data: comparison.map((item) => item.totalInterest),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.45)",
          yAxisID: "y1",
          borderWidth: 1
        }
      ]
    };
  }, [comparison, years]);

  const comparisonOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: gridColor },
          ticks: { color: axisColor },
          title: {
            display: true,
            color: axisColor,
            text: "ค่างวด/เดือน"
          }
        },
        y1: {
          beginAtZero: false,
          position: "right",
          grid: { drawOnChartArea: false, color: gridColor },
          ticks: { color: axisColor },
          title: {
            display: true,
            color: axisColor,
            text: "ดอกเบี้ยรวม"
          }
        },
        x: {
          grid: { color: gridColor },
          ticks: { color: axisColor }
        }
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: axisColor, usePointStyle: true }
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${money0.format(Number(context.raw))} บาท`;
            }
          }
        }
      }
    }),
    [axisColor, gridColor]
  );

  const handleDownPercent = useCallback((value: number) => {
    if (Number.isNaN(value)) {
      return;
    }
    setDownPercent(Math.max(0, Math.min(100, value)));
  }, []);

  const exportInfographic = useCallback(async () => {
    if (!infographicRef.current) {
      return;
    }

    try {
      setIsExporting(true);
      const canvas = await html2canvas(infographicRef.current, {
        scale: 2,
        backgroundColor: darkMode ? "#020617" : "#f4f7fb"
      });

      const link = document.createElement("a");
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10);
      const timePart = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
      link.download = `loan-infographic-${datePart}_${timePart}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setIsExporting(false);
    }
  }, [darkMode]);

  return (
    <div className="app-shell">
      <header className="nav">
        <div className="container nav-row">
          <div className="title">
            <span className="heading-with-icon title-main">
              <Icon>
                <path d="M4 17h16" />
                <path d="M5 17V8l4-3h6l4 3v9" />
                <circle cx="8" cy="17" r="2" />
                <circle cx="16" cy="17" r="2" />
              </Icon>
              โปรแกรมคำนวณค่างวดรถยนต์
            </span>{" "}
            <span className="title-sub">Flat Rate Calculation</span>
          </div>
          <div className="actions">
            <button className="btn pressable heading-with-icon" type="button" onClick={() => setDarkMode((prev) => !prev)}>
              <Icon>{darkMode ? <circle cx="12" cy="12" r="5" /> : <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36 6.36-1.4-1.4M7.05 7.05l-1.4-1.4m12.71 0-1.4 1.4M7.05 16.95l-1.4 1.4" />}</Icon>
              {darkMode ? "โหมดสว่าง" : "โหมดมืด"}
            </button>
            <button className="btn btn-primary pressable heading-with-icon" type="button" onClick={exportInfographic} disabled={isExporting}>
              <Icon>
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <rect x="4" y="17" width="16" height="4" rx="1.5" />
              </Icon>
              {isExporting ? "กำลังบันทึก..." : "บันทึกอินโฟกราฟฟิก"}
            </button>
          </div>
        </div>
      </header>

      <main className="container content">
        <section className="intro">
          <h2>วางแผนการเงินก่อนออกรถแบบเห็นภาพจริง</h2>
          <p>
            ปรับราคารถ เงินดาวน์ ดอกเบี้ย และระยะเวลาผ่อน เพื่อดูผลค่างวดรายเดือน ดอกเบี้ยรวม และต้นทุนที่จ่ายจริง
            รองรับกรณีรถมือสองที่มี VAT 7% ต่อค่างวด
          </p>
        </section>

        <section className="grid" ref={infographicRef}>
          <aside className="panel left-column lift-card">
            <div className="panel-head heading-with-icon">
              <Icon>
                <path d="M4 6h16" />
                <path d="M7 12h10" />
                <path d="M10 18h4" />
              </Icon>
              กำหนดตัวแปร
            </div>
            <div className="panel-body stack">
              <div>
                <label>ประเภทรถยนต์</label>
                <div className="toggle-group" style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className={`chip pressable ${carType === "new" ? "active" : ""}`}
                    onClick={() => setCarType("new")}
                  >
                    รถใหม่ป้ายแดง
                  </button>
                  <button
                    type="button"
                    className={`chip pressable ${carType === "used" ? "active" : ""}`}
                    onClick={() => setCarType("used")}
                  >
                    รถมือสอง (+VAT 7%)
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="price">ราคารถยนต์ (บาท)</label>
                <input
                  id="price"
                  type="number"
                  min={100000}
                  max={5000000}
                  step={10000}
                  value={price}
                  onChange={(event) => setPrice(Number(event.target.value) || 0)}
                />
                <input
                  type="range"
                  min={100000}
                  max={5000000}
                  step={10000}
                  value={price}
                  onChange={(event) => setPrice(Number(event.target.value))}
                />
              </div>

              <div>
                <div className="row">
                  <label htmlFor="downPercent">เงินดาวน์ (%)</label>
                  <strong>{downPercent}%</strong>
                </div>
                <input
                  id="downPercent"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={downPercent}
                  onChange={(event) => handleDownPercent(Number(event.target.value))}
                />
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={downPercent}
                  onChange={(event) => handleDownPercent(Number(event.target.value))}
                />
                <small>จำนวนเงินดาวน์: {money0.format(loan.downAmount)} บาท</small>
              </div>

              <div>
                <div className="row">
                  <label htmlFor="interest">อัตราดอกเบี้ย (%)</label>
                  <strong>{interestRate.toFixed(2)}%</strong>
                </div>
                <input
                  id="interest"
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.1}
                  value={interestRate}
                  onChange={(event) => setInterestRate(Number(event.target.value))}
                />
              </div>

              <div>
                <label>ระยะเวลาผ่อน (ปี)</label>
                <div className="term-group" style={{ marginTop: 8 }}>
                  {selectableTerms.map((term) => (
                    <button
                      key={term}
                      type="button"
                      className={`chip pressable ${years === term ? "active" : ""}`}
                      onClick={() => setYears(term)}
                    >
                      {term}
                    </button>
                  ))}
                </div>
                <small>จำนวนงวด: {loan.months} งวด</small>
              </div>
            </div>

            <div className="breakdown lift-card">
              <h4 className="heading-with-icon">
                <Icon>
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                  <path d="M8 8h8M8 12h8M8 16h5" />
                </Icon>
                ที่มาของตัวเลข
              </h4>
              <div className="formula">
                <p>
                  <span>เงินดาวน์ = {money0.format(price)} × {downPercent}%</span>
                  <strong>{money0.format(loan.downAmount)}</strong>
                </p>
                <p>
                  <span>ยอดจัด = {money0.format(price)} - {money0.format(loan.downAmount)}</span>
                  <strong>{money0.format(loan.financeAmount)}</strong>
                </p>
                <p>
                  <span>ดอกเบี้ยรวม = {money0.format(loan.financeAmount)} × {interestRate}% × {years}</span>
                  <strong>{money0.format(loan.totalInterest)}</strong>
                </p>
                <p>
                  <span>ค่างวดก่อน VAT = {money0.format(loan.totalDebt)} ÷ {loan.months}</span>
                  <strong>{money2.format(loan.monthlyBase)}</strong>
                </p>
                {carType === "used" && (
                  <p>
                    <span>VAT 7% ต่อเดือน</span>
                    <strong>{money2.format(loan.vatPerMonth)}</strong>
                  </p>
                )}
              </div>
            </div>
          </aside>

          <section className="right-column">
            <div className="result-hero lift-card">
              <div className="result-top">
                <h3 className="heading-with-icon">
                  <Icon>
                    <path d="M3 12h18" />
                    <path d="M12 3v18" />
                  </Icon>
                  ค่างวดต่อเดือน
                </h3>
                <p>{money0.format(loan.monthlyTotal)} บาท</p>
              </div>
              <div className="result-grid">
                <div className="result-cell">
                  <small>ยอดจัดไฟแนนซ์</small>
                  <strong>{money0.format(loan.financeAmount)}</strong>
                </div>
                <div className="result-cell danger">
                  <small>ดอกเบี้ยรวม</small>
                  <strong>{money0.format(loan.totalInterest)}</strong>
                </div>
                <div className="result-cell">
                  <small>รวมที่จ่ายจริง</small>
                  <strong>{money0.format(loan.totalPaid)}</strong>
                </div>
              </div>
            </div>

            <div className="chart-grid">
              <article className="chart-card lift-card">
                <h4 className="heading-with-icon">
                  <Icon>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 12V3" />
                    <path d="M12 12h8" />
                  </Icon>
                  โครงสร้างค่าใช้จ่าย
                </h4>
                <p className="muted">สัดส่วนเงินดาวน์ เงินต้น ดอกเบี้ย และ VAT</p>
                <div className="chart-wrap">
                  <Doughnut data={structureData} options={structureOptions} />
                </div>
              </article>

              <article className="chart-card lift-card">
                <h4 className="heading-with-icon">
                  <Icon>
                    <path d="M4 20V8" />
                    <path d="M10 20V4" />
                    <path d="M16 20v-6" />
                    <path d="M22 20v-9" />
                  </Icon>
                  เปรียบเทียบระยะเวลาผ่อน
                </h4>
                <p className="muted">ผ่อนนานขึ้น งวดถูกลง แต่ดอกเบี้ยรวมสูงขึ้น</p>
                <div className="chart-wrap">
                  <Bar data={comparisonData} options={comparisonOptions} />
                </div>
              </article>
            </div>

            <div className="tips-card lift-card">
              <h4 className="heading-with-icon">
                <Icon>
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M12 2a7 7 0 0 0-4 12c.8.7 1.3 1.6 1.5 2.5h5c.2-.9.7-1.8 1.5-2.5A7 7 0 0 0 12 2Z" />
                </Icon>
                Tips
              </h4>
              <p>
                การเพิ่มเงินดาวน์จะช่วยลด &quot;ยอดจัด&quot; (เงินต้น) ซึ่งเป็นฐานในการคำนวณดอกเบี้ย
                ทำให้ประหยัดดอกเบี้ยรวมได้มาก
              </p>
            </div>

          </section>
        </section>

        <p className="footer">พัฒนาสำหรับการศึกษาแนวทางคำนวณ Flat Rate และวางแผนภาระผ่อนก่อนตัดสินใจซื้อรถ</p>
      </main>
    </div>
  );
}
