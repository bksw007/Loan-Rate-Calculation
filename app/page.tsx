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

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

type CarType = "new" | "used";
type ActiveTab = "car" | "home";

type CarLoanResult = {
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

type HomeLoanResult = {
  downAmount: number;
  principal: number;
  months: number;
  monthlyRate: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  firstMonthInterest: number;
};

const money0 = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const money2 = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const compareTerms = [4, 5, 6, 7];
const carTerms = [2, 3, 4, 5, 6, 7, 8];
const homeCompareTerms = [20, 25, 30, 35];

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

function calculateCarLoan(price: number, downPercent: number, interestRate: number, years: number, carType: CarType): CarLoanResult {
  const downAmount = price * (downPercent / 100);
  const financeAmount = Math.max(0, price - downAmount);
  const totalInterest = financeAmount * (interestRate / 100) * years;
  const totalDebt = financeAmount + totalInterest;
  const months = Math.max(1, years * 12);
  const monthlyBase = totalDebt / months;
  const vatPerMonth = carType === "used" ? monthlyBase * 0.07 : 0;
  const monthlyTotal = monthlyBase + vatPerMonth;
  const totalPaid = downAmount + monthlyTotal * months;

  return { downAmount, financeAmount, totalInterest, totalDebt, months, monthlyBase, vatPerMonth, monthlyTotal, totalPaid };
}

function calculateHomeLoan(price: number, downPercent: number, interestRate: number, years: number, daysInMonth: number): HomeLoanResult {
  const downAmount = price * (downPercent / 100);
  const principal = Math.max(0, price - downAmount);
  const months = Math.max(1, years * 12);
  const monthlyRate = (interestRate / 100) / 12;

  let monthlyPayment = 0;
  if (principal > 0) {
    if (monthlyRate === 0) {
      monthlyPayment = principal / months;
    } else {
      const pow = (1 + monthlyRate) ** months;
      monthlyPayment = principal * ((monthlyRate * pow) / (pow - 1));
    }
  }

  const totalPayment = monthlyPayment * months;
  const totalInterest = Math.max(0, totalPayment - principal);
  const firstMonthInterest = (principal * (interestRate / 100) * daysInMonth) / 365;

  return { downAmount, principal, months, monthlyRate, monthlyPayment, totalPayment, totalInterest, firstMonthInterest };
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("car");

  const [carPrice, setCarPrice] = useState(800000);
  const [carDownPercent, setCarDownPercent] = useState(25);
  const [carInterestRate, setCarInterestRate] = useState(2.5);
  const [carYears, setCarYears] = useState(5);
  const [carType, setCarType] = useState<CarType>("new");

  const [homePrice, setHomePrice] = useState(3000000);
  const [homeDownPercent, setHomeDownPercent] = useState(10);
  const [homeInterestRate, setHomeInterestRate] = useState(3);
  const [homeYears, setHomeYears] = useState(30);
  const [homeDaysInMonth, setHomeDaysInMonth] = useState(31);

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

  const carLoan = useMemo(
    () => calculateCarLoan(carPrice, carDownPercent, carInterestRate, carYears, carType),
    [carPrice, carDownPercent, carInterestRate, carYears, carType]
  );

  const homeLoan = useMemo(
    () => calculateHomeLoan(homePrice, homeDownPercent, homeInterestRate, homeYears, homeDaysInMonth),
    [homePrice, homeDownPercent, homeInterestRate, homeYears, homeDaysInMonth]
  );

  const comparison = useMemo(
    () => compareTerms.map((term) => calculateCarLoan(carPrice, carDownPercent, carInterestRate, term, carType)),
    [carPrice, carDownPercent, carInterestRate, carType]
  );
  const homeComparison = useMemo(
    () => homeCompareTerms.map((term) => calculateHomeLoan(homePrice, homeDownPercent, homeInterestRate, term, homeDaysInMonth)),
    [homePrice, homeDownPercent, homeInterestRate, homeDaysInMonth]
  );

  const isDark = darkMode;
  const axisColor = isDark ? "#cbd5e1" : "#475569";
  const gridColor = isDark ? "rgba(148,163,184,0.18)" : "rgba(148,163,184,0.22)";

  const structureData = useMemo<ChartData<"doughnut">>(() => {
    const vatTotal = carType === "used" ? carLoan.vatPerMonth * carLoan.months : 0;
    return {
      labels: ["เงินดาวน์", "ยอดจัด", "ดอกเบี้ย", "VAT"],
      datasets: [
        {
          data: [carLoan.downAmount, carLoan.financeAmount, carLoan.totalInterest, vatTotal],
          backgroundColor: ["#d97706", "#0ea5e9", "#ef4444", "#94a3b8"],
          borderWidth: 0
        }
      ]
    };
  }, [carLoan.downAmount, carLoan.financeAmount, carLoan.months, carLoan.totalInterest, carLoan.vatPerMonth, carType]);

  const structureOptions = useMemo<ChartOptions<"doughnut">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { color: axisColor, usePointStyle: true } },
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
    const colors = compareTerms.map((term) => (term === carYears ? "#0ea5e9" : "#94a3b8"));
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
  }, [carYears, comparison]);

  const homeStructureData = useMemo<ChartData<"doughnut">>(
    () => ({
      labels: ["เงินดาวน์", "เงินต้นที่กู้", "ดอกเบี้ยรวม"],
      datasets: [
        {
          data: [homeLoan.downAmount, homeLoan.principal, homeLoan.totalInterest],
          backgroundColor: ["#d97706", "#0ea5e9", "#ef4444"],
          borderWidth: 0
        }
      ]
    }),
    [homeLoan.downAmount, homeLoan.principal, homeLoan.totalInterest]
  );

  const homeComparisonData = useMemo<ChartData<"bar">>(() => {
    const colors = homeCompareTerms.map((term) => (term === homeYears ? "#0ea5e9" : "#94a3b8"));
    return {
      labels: homeCompareTerms.map((term) => `${term} ปี`),
      datasets: [
        {
          type: "bar",
          label: "ค่างวด/เดือน",
          data: homeComparison.map((item) => item.monthlyPayment),
          backgroundColor: colors
        },
        {
          type: "bar",
          label: "ดอกเบี้ยรวม",
          data: homeComparison.map((item) => item.totalInterest),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.45)",
          yAxisID: "y1",
          borderWidth: 1
        }
      ]
    };
  }, [homeComparison, homeYears]);

  const comparisonOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: gridColor },
          ticks: { color: axisColor },
          title: { display: true, color: axisColor, text: "ค่างวด/เดือน" }
        },
        y1: {
          beginAtZero: false,
          position: "right",
          grid: { drawOnChartArea: false, color: gridColor },
          ticks: { color: axisColor },
          title: { display: true, color: axisColor, text: "ดอกเบี้ยรวม" }
        },
        x: {
          grid: { color: gridColor },
          ticks: { color: axisColor }
        }
      },
      plugins: {
        legend: { position: "bottom", labels: { color: axisColor, usePointStyle: true } },
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

  const handlePercent = useCallback((value: number, setter: (v: number) => void) => {
    if (Number.isNaN(value)) {
      return;
    }
    setter(Math.max(0, Math.min(100, value)));
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
      link.download = `${activeTab}-loan-infographic-${datePart}_${timePart}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setIsExporting(false);
    }
  }, [activeTab, darkMode]);

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
              โปรแกรมคำนวนค่างวด Loan Rate Calculation
            </span>
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
          <h2>{activeTab === "car" ? "คำนวณค่างวดรถแบบ Flat Rate" : "คำนวณค่างวดบ้านแบบลดต้นลดดอก (Effective Rate)"}</h2>
          <p>
            {activeTab === "car"
              ? "คำนวณค่างวดรถยนต์ด้วยสูตร Flat Rate พร้อมเทียบผลกระทบจากดอกเบี้ย ระยะเวลาผ่อน และ VAT สำหรับรถมือสอง"
              : "คำนวณสินเชื่อบ้านจากเงินดาวน์ ยอดจัดกู้ จำนวนงวด และค่างวดคงที่ (Annuity/PMT) พร้อมดอกเบี้ยเดือนแรกตามจำนวนวัน"}
          </p>
        </section>

        <section className="tab-switch" aria-label="เลือกประเภทการคำนวณ">
          <button type="button" className={`chip pressable ${activeTab === "car" ? "active" : ""}`} onClick={() => setActiveTab("car")}>คำนวนค่างวดรถ</button>
          <button type="button" className={`chip pressable ${activeTab === "home" ? "active" : ""}`} onClick={() => setActiveTab("home")}>คำนวนค่างวดบ้าน</button>
        </section>

        {activeTab === "car" ? (
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
                    <button type="button" className={`chip pressable ${carType === "new" ? "active" : ""}`} onClick={() => setCarType("new")}>รถใหม่ป้ายแดง</button>
                    <button type="button" className={`chip pressable ${carType === "used" ? "active" : ""}`} onClick={() => setCarType("used")}>รถมือสอง (+VAT 7%)</button>
                  </div>
                </div>

                <div>
                  <label htmlFor="carPrice">ราคารถยนต์ (บาท)</label>
                  <input id="carPrice" type="number" min={100000} max={5000000} step={10000} value={carPrice} onChange={(event) => setCarPrice(Number(event.target.value) || 0)} />
                  <input type="range" min={100000} max={5000000} step={10000} value={carPrice} onChange={(event) => setCarPrice(Number(event.target.value))} />
                </div>

                <div>
                  <div className="row"><label htmlFor="carDown">เงินดาวน์ (%)</label><strong>{carDownPercent}%</strong></div>
                  <input id="carDown" type="number" min={0} max={100} step={1} value={carDownPercent} onChange={(event) => handlePercent(Number(event.target.value), setCarDownPercent)} />
                  <input type="range" min={0} max={50} step={5} value={carDownPercent} onChange={(event) => handlePercent(Number(event.target.value), setCarDownPercent)} />
                  <small>จำนวนเงินดาวน์: {money0.format(carLoan.downAmount)} บาท</small>
                </div>

                <div>
                  <div className="row"><label htmlFor="carRate">อัตราดอกเบี้ย (%)</label><strong>{carInterestRate.toFixed(2)}%</strong></div>
                  <input id="carRate" type="range" min={0.5} max={10} step={0.1} value={carInterestRate} onChange={(event) => setCarInterestRate(Number(event.target.value))} />
                </div>

                <div>
                  <label>ระยะเวลาผ่อน (ปี)</label>
                  <div className="term-group" style={{ marginTop: 8 }}>
                    {carTerms.map((term) => (
                      <button key={term} type="button" className={`chip pressable ${carYears === term ? "active" : ""}`} onClick={() => setCarYears(term)}>
                        {term}
                      </button>
                    ))}
                  </div>
                  <small>จำนวนงวด: {carLoan.months} งวด</small>
                </div>
              </div>

              <article className="chart-card lift-card">
                <h4 className="heading-with-icon"><Icon><path d="M5 20V8" /><path d="M12 20V4" /><path d="M19 20v-9" /></Icon>หลักการคำนวณบ้านที่ใช้</h4>
                <div className="formula">
                  <p><span>วิธีคิดดอกเบี้ย</span><strong>ลดต้นลดดอก (Effective Rate)</strong></p>
                  <p><span>วิธีจ่ายค่างวด</span><strong>ค่างวดคงที่ (Annuity/PMT)</strong></p>
                  <p><span>สูตรค่างวด</span><strong>A = P * [r(1+r)^n / ((1+r)^n - 1)]</strong></p>
                </div>
              </article>

              <div className="breakdown lift-card">
                <h4 className="heading-with-icon"><Icon><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></Icon>ที่มาของตัวเลข</h4>
                <div className="formula">
                  <p><span>เงินดาวน์ = {money0.format(carPrice)} x {carDownPercent}%</span><strong>{money0.format(carLoan.downAmount)}</strong></p>
                  <p><span>ยอดจัด = {money0.format(carPrice)} - {money0.format(carLoan.downAmount)}</span><strong>{money0.format(carLoan.financeAmount)}</strong></p>
                  <p><span>ดอกเบี้ยรวม = {money0.format(carLoan.financeAmount)} x {carInterestRate}% x {carYears}</span><strong>{money0.format(carLoan.totalInterest)}</strong></p>
                  <p><span>ค่างวดก่อน VAT = {money0.format(carLoan.totalDebt)} ÷ {carLoan.months}</span><strong>{money2.format(carLoan.monthlyBase)}</strong></p>
                  {carType === "used" && <p><span>VAT 7% ต่อเดือน</span><strong>{money2.format(carLoan.vatPerMonth)}</strong></p>}
                </div>
              </div>
            </aside>

            <section className="right-column">
              <div className="result-hero lift-card">
                <div className="result-top">
                  <h3 className="heading-with-icon"><Icon><path d="M3 12h18" /><path d="M12 3v18" /></Icon>ค่างวดต่อเดือน</h3>
                  <p>{money0.format(carLoan.monthlyTotal)} บาท</p>
                </div>
                <div className="result-grid">
                  <div className="result-cell"><small>ยอดจัดไฟแนนซ์</small><strong>{money0.format(carLoan.financeAmount)}</strong></div>
                  <div className="result-cell danger"><small>ดอกเบี้ยรวม</small><strong>{money0.format(carLoan.totalInterest)}</strong></div>
                  <div className="result-cell"><small>รวมที่จ่ายจริง</small><strong>{money0.format(carLoan.totalPaid)}</strong></div>
                </div>
              </div>

              <div className="chart-grid">
                <article className="chart-card lift-card">
                  <h4 className="heading-with-icon"><Icon><circle cx="12" cy="12" r="9" /><path d="M12 12V3" /><path d="M12 12h8" /></Icon>โครงสร้างค่าใช้จ่าย</h4>
                  <p className="muted">สัดส่วนเงินดาวน์ เงินต้น ดอกเบี้ย และ VAT</p>
                  <div className="chart-wrap"><Doughnut data={structureData} options={structureOptions} /></div>
                </article>

                <article className="chart-card lift-card">
                  <h4 className="heading-with-icon"><Icon><path d="M4 20V8" /><path d="M10 20V4" /><path d="M16 20v-6" /><path d="M22 20v-9" /></Icon>เปรียบเทียบระยะเวลาผ่อน</h4>
                  <p className="muted">ผ่อนนานขึ้น งวดถูกลง แต่ดอกเบี้ยรวมสูงขึ้น</p>
                  <div className="chart-wrap"><Bar data={comparisonData} options={comparisonOptions} /></div>
                </article>
              </div>

              <div className="tips-card lift-card">
                <h4 className="heading-with-icon"><Icon><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12c.8.7 1.3 1.6 1.5 2.5h5c.2-.9.7-1.8 1.5-2.5A7 7 0 0 0 12 2Z" /></Icon>Tips</h4>
                <p>การเพิ่มเงินดาวน์จะช่วยลด &quot;ยอดจัด&quot; (เงินต้น) ซึ่งเป็นฐานในการคำนวณดอกเบี้ย ทำให้ประหยัดดอกเบี้ยรวมได้มาก</p>
              </div>
            </section>
          </section>
        ) : (
          <section className="grid" ref={infographicRef}>
            <aside className="panel left-column lift-card">
              <div className="panel-head heading-with-icon">
                <Icon><path d="M4 6h16" /><path d="M7 12h10" /><path d="M10 18h4" /></Icon>
                กำหนดตัวแปรสินเชื่อบ้าน
              </div>
              <div className="panel-body stack">
                <div>
                  <label htmlFor="homePrice">ราคาบ้าน (บาท)</label>
                  <input id="homePrice" type="number" min={500000} max={20000000} step={50000} value={homePrice} onChange={(event) => setHomePrice(Number(event.target.value) || 0)} />
                  <input type="range" min={500000} max={20000000} step={50000} value={homePrice} onChange={(event) => setHomePrice(Number(event.target.value))} />
                </div>

                <div>
                  <div className="row"><label htmlFor="homeDown">เงินดาวน์ (%)</label><strong>{homeDownPercent}%</strong></div>
                  <input id="homeDown" type="number" min={0} max={100} step={1} value={homeDownPercent} onChange={(event) => handlePercent(Number(event.target.value), setHomeDownPercent)} />
                  <input type="range" min={0} max={60} step={1} value={homeDownPercent} onChange={(event) => handlePercent(Number(event.target.value), setHomeDownPercent)} />
                  <small>เงินดาวน์: {money0.format(homeLoan.downAmount)} บาท | ยอดจัดกู้: {money0.format(homeLoan.principal)} บาท</small>
                </div>

                <div>
                  <div className="row"><label htmlFor="homeRate">ดอกเบี้ยต่อปี (%)</label><strong>{homeInterestRate.toFixed(2)}%</strong></div>
                  <input id="homeRate" type="range" min={0.1} max={10} step={0.05} value={homeInterestRate} onChange={(event) => setHomeInterestRate(Number(event.target.value))} />
                </div>

                <div>
                  <div className="row"><label htmlFor="homeYears">ระยะเวลากู้ (ปี)</label><strong>{homeYears} ปี</strong></div>
                  <input id="homeYears" type="range" min={5} max={40} step={1} value={homeYears} onChange={(event) => setHomeYears(Number(event.target.value))} />
                  <small>จำนวนงวดทั้งหมด: {homeLoan.months} งวด</small>
                </div>

                <div>
                  <label htmlFor="daysInMonth">จำนวนวันในเดือนสำหรับคำนวณดอกเบี้ยเดือนแรก</label>
                  <select id="daysInMonth" value={homeDaysInMonth} onChange={(event) => setHomeDaysInMonth(Number(event.target.value))} className="select-input">
                    <option value={28}>28 วัน</option>
                    <option value={29}>29 วัน</option>
                    <option value={30}>30 วัน</option>
                    <option value={31}>31 วัน</option>
                  </select>
                </div>
              </div>

              <div className="breakdown lift-card">
                <h4 className="heading-with-icon"><Icon><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></Icon>ที่มาของตัวเลข</h4>
                <div className="formula">
                  <p><span>เงินดาวน์ = {money0.format(homePrice)} x {homeDownPercent}%</span><strong>{money0.format(homeLoan.downAmount)}</strong></p>
                  <p><span>ยอดจัดกู้ = {money0.format(homePrice)} - {money0.format(homeLoan.downAmount)}</span><strong>{money0.format(homeLoan.principal)}</strong></p>
                  <p><span>จำนวนงวด = {homeYears} x 12</span><strong>{homeLoan.months} งวด</strong></p>
                  <p><span>r = ดอกเบี้ยต่อเดือน = ({homeInterestRate}% / 12)</span><strong>{(homeLoan.monthlyRate * 100).toFixed(4)}%</strong></p>
                  <p><span>ค่างวดคงที่ (PMT/Annuity)</span><strong>{money2.format(homeLoan.monthlyPayment)}</strong></p>
                  <p><span>ดอกเบี้ยเดือนแรก = (เงินต้น x ดอกเบี้ยต่อปี x {homeDaysInMonth}) / 365</span><strong>{money2.format(homeLoan.firstMonthInterest)}</strong></p>
                </div>
              </div>

              <div className="tips-card lift-card">
                <h4 className="heading-with-icon"><Icon><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12c.8.7 1.3 1.6 1.5 2.5h5c.2-.9.7-1.8 1.5-2.5A7 7 0 0 0 12 2Z" /></Icon>Tips</h4>
                <p>ยิ่งดาวน์สูง ยอดจัดกู้ต่ำลง ทำให้ดอกเบี้ยรวมทั้งสัญญาลดลงอย่างมีนัยสำคัญ และช่วยให้ภาระงวดต่อเดือนเบาลง</p>
              </div>
            </aside>

            <section className="right-column">
              <div className="result-hero lift-card">
                <div className="result-top">
                  <h3 className="heading-with-icon"><Icon><path d="M3 12h18" /><path d="M12 3v18" /></Icon>ค่างวดบ้านต่อเดือน (คงที่)</h3>
                  <p>{money0.format(homeLoan.monthlyPayment)} บาท</p>
                </div>
                <div className="result-grid result-grid-4">
                  <div className="result-cell"><small>ยอดจัดกู้</small><strong>{money0.format(homeLoan.principal)}</strong></div>
                  <div className="result-cell danger"><small>ดอกเบี้ยรวมทั้งสัญญา</small><strong>{money0.format(homeLoan.totalInterest)}</strong></div>
                  <div className="result-cell"><small>ยอดชำระรวม</small><strong>{money0.format(homeLoan.totalPayment)}</strong></div>
                  <div className="result-cell"><small>ดอกเบี้ยเดือนแรก</small><strong>{money0.format(homeLoan.firstMonthInterest)}</strong></div>
                </div>
              </div>

              <div className="chart-grid">
                <article className="chart-card lift-card">
                  <h4 className="heading-with-icon"><Icon><circle cx="12" cy="12" r="9" /><path d="M12 12V3" /><path d="M12 12h8" /></Icon>โครงสร้างต้นทุนสินเชื่อบ้าน</h4>
                  <p className="muted">สัดส่วนเงินดาวน์ เงินต้นที่กู้ และดอกเบี้ยรวมตลอดสัญญา</p>
                  <div className="chart-wrap"><Doughnut data={homeStructureData} options={structureOptions} /></div>
                </article>

                <article className="chart-card lift-card">
                  <h4 className="heading-with-icon"><Icon><path d="M4 20V8" /><path d="M10 20V4" /><path d="M16 20v-6" /><path d="M22 20v-9" /></Icon>เปรียบเทียบระยะเวลากู้บ้าน</h4>
                  <p className="muted">กู้ยาวขึ้น งวดต่อเดือนลดลง แต่ดอกเบี้ยรวมสูงขึ้น</p>
                  <div className="chart-wrap"><Bar data={homeComparisonData} options={comparisonOptions} /></div>
                </article>
              </div>

              <div className="note-card lift-card">
                <h4 className="heading-with-icon"><Icon><path d="M12 9v4" /><path d="M12 17h.01" /><circle cx="12" cy="12" r="9" /></Icon>หมายเหตุสำคัญ</h4>
                <ul>
                  <li>ธนาคารจริงอาจมีเงื่อนไข LTV, ค่าธรรมเนียม และประกัน ทำให้ยอดกู้จริงต่างจากสูตรพื้นฐาน</li>
                  <li>การคำนวณดอกเบี้ยรายเดือนอาจต่างกันตามนโยบายธนาคาร (ฐานวัน 365/366 หรือวิธีภายใน)</li>
                  <li>สูตร PMT สมมติอัตราดอกเบี้ยคงที่ตลอดสัญญา แต่สินเชื่อจริงมักมีช่วงโปรโมชันและอัตราลอยตัว</li>
                  <li>Step-up Payment มีในบางโปรแกรมธนาคาร ไม่ได้มีในทุกสัญญา</li>
                </ul>
              </div>
            </section>
          </section>
        )}

        <p className="footer">พัฒนาสำหรับการศึกษาแนวทางคำนวณ Loan Rate Calculation ทั้งรถยนต์และสินเชื่อบ้าน</p>
      </main>
    </div>
  );
}
