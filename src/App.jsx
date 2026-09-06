import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./App.css";

const STORAGE_KEY = "cybernexa-state-v2";

const defaultAssessment = {
  assets: 50,
  vulnerabilities: 10,
  exposedAssets: 5,
  threatActivity: 50,
  securityControls: 50,
  businessImpact: 50,
};

const defaultProfile = {
  organizationName: "",
  industry: "",
  employees: "",
  organizationSize: "Small",
};

const investmentCatalog = [
  {
    id: "vulnerability",
    name: "Vulnerability Management",
    description: "Identify and fix critical security weaknesses.",
    reduction: 18,
    priority: "High priority",
    icon: "🔍",
  },
  {
    id: "endpoint",
    name: "Endpoint Security",
    description: "Protect laptops, desktops, and employee devices.",
    reduction: 14,
    priority: "High priority",
    icon: "💻",
  },
  {
    id: "training",
    name: "Employee Training",
    description: "Reduce phishing and human-error related incidents.",
    reduction: 10,
    priority: "Medium priority",
    icon: "🎓",
  },
  {
    id: "network",
    name: "Network Security",
    description: "Improve network monitoring and access protection.",
    reduction: 16,
    priority: "High priority",
    icon: "🌐",
  },
];

const threatData = [
  {
    id: 1,
    name: "Phishing Campaign",
    severity: "High",
    industry: "All Industries",
    action: "Enable phishing protection and conduct employee awareness training.",
    status: "Active",
    icon: "🎣",
  },
  {
    id: 2,
    name: "Ransomware Activity",
    severity: "Critical",
    industry: "Healthcare & Manufacturing",
    action: "Verify offline backups and strengthen endpoint protection.",
    status: "Active",
    icon: "🔐",
  },
  {
    id: 3,
    name: "Credential Theft",
    severity: "High",
    industry: "Finance & Technology",
    action: "Enable MFA and review privileged account access.",
    status: "Active",
    icon: "🔑",
  },
  {
    id: 4,
    name: "DDoS Campaign",
    severity: "Medium",
    industry: "Technology & Retail",
    action: "Review traffic monitoring and network protection controls.",
    status: "Active",
    icon: "🌐",
  },
  {
    id: 5,
    name: "Malicious USB Activity",
    severity: "Medium",
    industry: "Education & Manufacturing",
    action: "Restrict removable media and improve endpoint monitoring.",
    status: "Resolved",
    icon: "💾",
  },
  {
    id: 6,
    name: "Web Application Attack",
    severity: "Critical",
    industry: "Technology & Finance",
    action: "Patch exposed applications and strengthen application security.",
    status: "Resolved",
    icon: "⚠️",
  },
];

const chartColors = ["#5ce1e6", "#5d7bff", "#6ce6a5", "#ffb45c"];

function createDefaultState() {
  return {
    assessment: { ...defaultAssessment },
    draftAssessment: { ...defaultAssessment },
    budget: 50000,
    history: [],
    profile: { ...defaultProfile },
    welcomeSeen: false,
  };
}

function loadSavedState() {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);

    if (!savedState) {
      return createDefaultState();
    }

    const parsedState = JSON.parse(savedState);

    return {
      assessment: parsedState.assessment || { ...defaultAssessment },
      draftAssessment:
        parsedState.draftAssessment || { ...defaultAssessment },
      budget:
        typeof parsedState.budget === "number"
          ? parsedState.budget
          : 50000,
      history: Array.isArray(parsedState.history)
        ? parsedState.history
        : [],
      profile: {
        ...defaultProfile,
        ...(parsedState.profile || {}),
      },
      welcomeSeen: Boolean(parsedState.welcomeSeen),
    };
  } catch {
    return createDefaultState();
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function calculateRiskScore(assessment) {
  const assetRisk = assessment.assets * 0.15;
  const vulnerabilityRisk = assessment.vulnerabilities * 0.25;
  const exposureRisk = assessment.exposedAssets * 0.2;
  const threatRisk = assessment.threatActivity * 0.15;
  const controlRisk = (100 - assessment.securityControls) * 0.1;
  const impactRisk = assessment.businessImpact * 0.15;

  return Math.round(
    clamp(
      assetRisk +
        vulnerabilityRisk +
        exposureRisk +
        threatRisk +
        controlRisk +
        impactRisk,
      0,
      100
    )
  );
}

function getRiskLevel(score) {
  if (score >= 75) {
    return {
      label: "Critical",
      className: "critical",
      description:
        "Your organization has a high level of cyber risk and requires immediate action.",
    };
  }

  if (score >= 50) {
    return {
      label: "High",
      className: "high",
      description:
        "Your organization has significant cyber risks that should be addressed soon.",
    };
  }

  if (score >= 25) {
    return {
      label: "Moderate",
      className: "moderate",
      description:
        "Your organization has manageable risks, but improvements are recommended.",
    };
  }

  return {
    label: "Low",
    className: "low",
    description:
      "Your organization currently has a relatively low level of cyber risk.",
  };
}

function calculateRiskFactors(assessment) {
  return [
    {
      name: "Asset Exposure",
      value: assessment.assets,
      description: "Number and importance of digital assets",
      icon: "🖥️",
    },
    {
      name: "Critical Vulnerabilities",
      value: assessment.vulnerabilities,
      description: "Known weaknesses in systems",
      icon: "🐛",
    },
    {
      name: "External Exposure",
      value: assessment.exposedAssets,
      description: "Assets accessible from outside",
      icon: "🌍",
    },
    {
      name: "Threat Activity",
      value: assessment.threatActivity,
      description: "Current threat activity level",
      icon: "⚡",
    },
    {
      name: "Security Control Gap",
      value: 100 - assessment.securityControls,
      description: "Missing or weak security controls",
      icon: "🛡️",
    },
    {
      name: "Business Impact",
      value: assessment.businessImpact,
      description: "Potential damage to business operations",
      icon: "📊",
    },
  ];
}

function optimizeBudget(budget, riskScore) {
  const totalWeight = investmentCatalog.reduce(
    (sum, investment) => sum + investment.reduction,
    0
  );

  return investmentCatalog.map((investment) => {
    const allocation = Math.round(
      (budget * investment.reduction) / totalWeight
    );

    const reduction = Math.round(
      (investment.reduction / 100) * Math.min(riskScore, 80)
    );

    return {
      ...investment,
      allocation,
      reduction,
    };
  });
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function App() {
  const savedState = useMemo(() => loadSavedState(), []);

  const [assessment, setAssessment] = useState(savedState.assessment);
  const [draftAssessment, setDraftAssessment] = useState(
    savedState.draftAssessment
  );
  const [budget, setBudget] = useState(savedState.budget);
  const [history, setHistory] = useState(savedState.history);
  const [profile, setProfile] = useState(savedState.profile);
  const [showWelcome, setShowWelcome] = useState(
    !savedState.welcomeSeen
  );
  const [demoMode, setDemoMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const riskScore = useMemo(
    () => calculateRiskScore(assessment),
    [assessment]
  );

  const riskLevel = useMemo(
    () => getRiskLevel(riskScore),
    [riskScore]
  );

  const riskFactors = useMemo(
    () => calculateRiskFactors(assessment),
    [assessment]
  );

  const recommendations = useMemo(
    () => optimizeBudget(budget, riskScore),
    [budget, riskScore]
  );

  const totalRiskReduction = useMemo(
    () =>
      recommendations.reduce(
        (total, recommendation) =>
          total + recommendation.reduction,
        0
      ),
    [recommendations]
  );

  const projectedScore = clamp(
    riskScore - Math.round(totalRiskReduction / 2),
    0,
    100
  );

  const projectedRiskLevel = getRiskLevel(projectedScore);

  const totalRecommendedInvestment = recommendations.reduce(
    (total, recommendation) => total + recommendation.allocation,
    0
  );

  const criticalVulnerabilities = assessment.vulnerabilities;

  const topRecommendations = [...recommendations]
    .sort((a, b) => b.reduction - a.reduction)
    .slice(0, 3);

  const activeThreats = threatData.filter(
    (threat) => threat.status === "Active"
  ).length;

  const criticalThreats = threatData.filter(
    (threat) => threat.severity === "Critical"
  ).length;

  const scoreChartData = [
    {
      name: "Risk Score",
      current: riskScore,
      projected: projectedScore,
    },
  ];

  const riskFactorChartData = riskFactors.map((factor) => ({
    name: factor.name,
    value: factor.value,
  }));

  const budgetChartData = recommendations.map((recommendation) => ({
    name: recommendation.name,
    value: recommendation.allocation,
  }));

  const trendChartData = useMemo(() => {
    return [...history]
      .reverse()
      .map((item, index) => ({
        name: `Assessment ${index + 1}`,
        date: item.date,
        current: Number.isFinite(Number(item.score))
          ? Number(item.score)
          : 0,
        projected: Number.isFinite(Number(item.projectedScore))
          ? Number(item.projectedScore)
          : 0,
      }));
  }, [history]);

  useEffect(() => {
    const stateToSave = {
      assessment,
      draftAssessment,
      budget,
      history,
      profile,
      welcomeSeen: !showWelcome,
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(stateToSave)
    );
  }, [
    assessment,
    draftAssessment,
    budget,
    history,
    profile,
    showWelcome,
  ]);

  function showStatus(message) {
    setStatusMessage(message);

    window.setTimeout(() => {
      setStatusMessage("");
    }, 4000);
  }

  function updateDraftField(field, value) {
    setDraftAssessment((previousAssessment) => ({
      ...previousAssessment,
      [field]: Number(value),
    }));
  }

  function updateProfileField(field, value) {
    setProfile((previousProfile) => ({
      ...previousProfile,
      [field]: value,
    }));
  }

  function startAssessment() {
    setShowWelcome(false);

    window.setTimeout(() => {
      document
        .getElementById("profile")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function viewDashboard() {
    setShowWelcome(false);

    window.setTimeout(() => {
      document
        .getElementById("dashboard")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function handleAnalyzeRisk(event) {
    event.preventDefault();

    setAssessment({ ...draftAssessment });
    showStatus("Risk assessment completed successfully.");

    document
      .getElementById("dashboard")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  function saveCurrentAssessment() {
    const historyItem = {
      id: Date.now(),
      date: new Date().toLocaleString("en-IN"),
      score: riskScore,
      level: riskLevel.label,
      budget,
      projectedScore,
    };

    setHistory((previousHistory) =>
      [historyItem, ...previousHistory].slice(0, 10)
    );

    showStatus("Assessment saved to your history.");
  }

  function deleteHistoryItem(id) {
    setHistory((previousHistory) =>
      previousHistory.filter((item) => item.id !== id)
    );

    showStatus("Assessment deleted.");
  }

  function clearHistory() {
    const confirmed = window.confirm(
      "Are you sure you want to delete all assessment history?"
    );

    if (confirmed) {
      setHistory([]);
      showStatus("Assessment history cleared.");
    }
  }

  function loadDemoMode() {
    const demoProfile = {
      organizationName: "NexaTech Solutions",
      industry: "Information Technology",
      employees: "350",
      organizationSize: "Medium",
    };

    const demoAssessment = {
      assets: 72,
      vulnerabilities: 68,
      exposedAssets: 58,
      threatActivity: 76,
      securityControls: 42,
      businessImpact: 70,
    };

    const demoBudget = 150000;

    const demoHistory = [
      {
        id: 1001,
        date: "15/08/2026, 10:15:00 am",
        score: 76,
        level: "Critical",
        budget: 75000,
        projectedScore: 68,
      },
      {
        id: 1002,
        date: "22/08/2026, 02:30:00 pm",
        score: 70,
        level: "High",
        budget: 100000,
        projectedScore: 60,
      },
      {
        id: 1003,
        date: "30/08/2026, 11:45:00 am",
        score: 64,
        level: "High",
        budget: 125000,
        projectedScore: 52,
      },
    ];

    setProfile(demoProfile);
    setAssessment(demoAssessment);
    setDraftAssessment(demoAssessment);
    setBudget(demoBudget);
    setHistory(demoHistory);
    setDemoMode(true);
    setShowWelcome(false);

    showStatus(
      "Demo Mode loaded — CyberNexa is ready for presentation."
    );

    window.setTimeout(() => {
      document
        .getElementById("dashboard")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  }

  function resetApplication() {
    const confirmed = window.confirm(
      "Are you sure you want to reset all CyberNexa data?"
    );

    if (!confirmed) {
      return;
    }

    const freshState = createDefaultState();

    setAssessment(freshState.assessment);
    setDraftAssessment(freshState.draftAssessment);
    setBudget(freshState.budget);
    setHistory(freshState.history);
    setProfile(freshState.profile);
    setDemoMode(false);
    setShowWelcome(true);

    localStorage.removeItem(STORAGE_KEY);

    showStatus("Application has been reset.");
  }

  function scrollToSection(sectionId) {
    setShowWelcome(false);

    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: "smooth" });
  }

  function generatePDFReport() {
    const pdf = new jsPDF();

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const reportId = `CNX-${Date.now()
      .toString()
      .slice(-8)}`;

    let y = 20;

    function addText(
      text,
      x,
      size = 11,
      style = "normal",
      maxWidth = pageWidth - 40
    ) {
      pdf.setFont("helvetica", style);
      pdf.setFontSize(size);

      const lines = pdf.splitTextToSize(
        String(text),
        maxWidth
      );

      pdf.text(lines, x, y);

      y += lines.length * (size * 0.55) + 5;
    }

    function addSectionTitle(title) {
      checkPageSpace(30);

      y += 5;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(30, 100, 130);
      pdf.text(title, 20, y);

      pdf.setTextColor(0, 0, 0);

      y += 10;
    }

    function checkPageSpace(requiredSpace = 25) {
      if (y + requiredSpace > pageHeight - 25) {
        pdf.addPage();
        y = 22;
      }
    }

    function addMetricBox(
      label,
      value,
      x,
      boxY,
      width,
      height = 28
    ) {
      pdf.setFillColor(245, 248, 252);
      pdf.roundedRect(
        x,
        boxY,
        width,
        height,
        3,
        3,
        "F"
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(90, 105, 125);
      pdf.text(label, x + 5, boxY + 8);

      pdf.setFontSize(15);
      pdf.setTextColor(20, 35, 55);
      pdf.text(String(value), x + 5, boxY + 20);

      pdf.setTextColor(0, 0, 0);
    }

    // Header
    pdf.setFillColor(7, 17, 31);
    pdf.rect(0, 0, pageWidth, 48, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(25);
    pdf.text("CyberNexa", 20, 23);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(
      "CYBER RISK INTELLIGENCE & INVESTMENT OPTIMIZATION",
      20,
      34
    );

    pdf.setTextColor(0, 0, 0);

    y = 62;

    addText(
      `Security Assessment Report`,
      20,
      18,
      "bold"
    );

    addText(
      `Report ID: ${reportId}`,
      20,
      9,
      "normal"
    );

    addText(
      `Generated: ${new Date().toLocaleString("en-IN")}`,
      20,
      9,
      "normal"
    );

    // Organization Profile
    addSectionTitle("Organization Profile");

    addMetricBox(
      "ORGANIZATION",
      profile.organizationName || "Not provided",
      20,
      y,
      80
    );

    addMetricBox(
      "INDUSTRY",
      profile.industry || "Not provided",
      105,
      y,
      80
    );

    addMetricBox(
      "EMPLOYEES",
      profile.employees || "N/A",
      20,
      y + 34,
      80
    );

    addMetricBox(
      "SIZE",
      profile.organizationSize || "N/A",
      105,
      y + 34,
      80
    );

    y += 75;

    // Executive Summary
    addSectionTitle("Executive Summary");

    addMetricBox(
      "CURRENT RISK",
      `${riskScore}/100`,
      20,
      y,
      52
    );

    addMetricBox(
      "RISK LEVEL",
      riskLevel.label,
      77,
      y,
      52
    );

    addMetricBox(
      "PROJECTED RISK",
      `${projectedScore}/100`,
      134,
      y,
      52
    );

    y += 38;

    addMetricBox(
      "RECOMMENDED INVESTMENT",
      formatMoney(totalRecommendedInvestment),
      20,
      y,
      80
    );

    addMetricBox(
      "CRITICAL VULNERABILITIES",
      criticalVulnerabilities,
      105,
      y,
      80
    );

    y += 42;

    addText(
      "CyberNexa recommends prioritizing the highest-impact security investments based on the organization's current risk profile.",
      20,
      10,
      "normal"
    );

    // Risk chart
    addSectionTitle("Risk Score Comparison");

    const chartX = 30;
    const chartY = y;
    const chartWidth = 150;
    const chartHeight = 55;

    pdf.setDrawColor(220, 225, 232);
    pdf.rect(
      chartX,
      chartY,
      chartWidth,
      chartHeight
    );

    pdf.setFillColor(255, 180, 92);
    const currentHeight =
      (riskScore / 100) * 42;

    pdf.rect(
      chartX + 35,
      chartY + 48 - currentHeight,
      25,
      currentHeight,
      "F"
    );

    pdf.setFillColor(92, 225, 230);
    const projectedHeight =
      (projectedScore / 100) * 42;

    pdf.rect(
      chartX + 90,
      chartY + 48 - projectedHeight,
      25,
      projectedHeight,
      "F"
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(80, 90, 105);

    pdf.text(
      "Current",
      chartX + 34,
      chartY + 65
    );

    pdf.text(
      "Projected",
      chartX + 87,
      chartY + 65
    );

    pdf.text(
      `${riskScore}`,
      chartX + 42,
      chartY + 43 - currentHeight
    );

    pdf.text(
      `${projectedScore}`,
      chartX + 97,
      chartY + 43 - projectedHeight
    );

    y += 85;

    // Assessment
    addSectionTitle("Organization Assessment");

    const assessmentRows = [
      ["Digital Assets", assessment.assets],
      [
        "Critical Vulnerabilities",
        assessment.vulnerabilities,
      ],
      ["Exposed Assets", assessment.exposedAssets],
      ["Threat Activity", assessment.threatActivity],
      [
        "Security Controls",
        assessment.securityControls,
      ],
      ["Business Impact", assessment.businessImpact],
    ];

    assessmentRows.forEach(([label, value]) => {
      checkPageSpace();

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`${label}`, 20, y);
      pdf.text(`${value}/100`, 155, y);

      pdf.setDrawColor(225, 230, 236);
      pdf.line(20, y + 3, 180, y + 3);

      y += 9;
    });

    // Risk factors
    addSectionTitle("Risk Factor Analysis");

    riskFactors.forEach((factor) => {
      checkPageSpace(24);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(
        `${factor.name}: ${factor.value}%`,
        20,
        y
      );

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 110, 125);

      const descriptionLines = pdf.splitTextToSize(
        factor.description,
        155
      );

      pdf.text(descriptionLines, 25, y + 6);

      pdf.setTextColor(0, 0, 0);

      y += descriptionLines.length * 4 + 10;
    });

    // Investment allocation
    addSectionTitle("Recommended Security Investments");

    recommendations.forEach((recommendation) => {
      checkPageSpace(32);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(
        recommendation.name,
        20,
        y
      );

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);

      pdf.text(
        `Allocation: ${formatMoney(
          recommendation.allocation
        )}`,
        25,
        y + 7
      );

      pdf.text(
        `Estimated risk reduction: ${recommendation.reduction}%`,
        25,
        y + 14
      );

      y += 24;
    });

    // Priority recommendations
    addSectionTitle("Priority Actions");

    topRecommendations.forEach(
      (recommendation, index) => {
        checkPageSpace(25);

        addText(
          `${index + 1}. ${recommendation.name} — ${recommendation.priority}`,
          20,
          10,
          "bold"
        );

        addText(
          recommendation.description,
          25,
          9
        );
      }
    );

    // Business impact
    addSectionTitle("Business Impact");

    const impactPoints = [
      "Reduced potential financial loss from cyber incidents.",
      "Improved business continuity during security incidents.",
      "Greater customer trust and protection of sensitive information.",
      "Better prioritization of cybersecurity investments.",
    ];

    impactPoints.forEach((point) => {
      checkPageSpace();

      addText(`• ${point}`, 20, 10);
    });

    // Conclusion
    addSectionTitle("Final Conclusion");

    addText(
      `CyberNexa calculates a current risk score of ${riskScore}/100 and projects the score to ${projectedScore}/100 after applying the recommended investment strategy.`,
      20,
      10
    );

    addText(
      `The recommended security investment is ${formatMoney(
        totalRecommendedInvestment
      )}. Organizations should prioritize the highest-risk areas and continuously reassess their security posture.`,
      20,
      10
    );

    checkPageSpace(35);

    y += 10;

    pdf.setDrawColor(180, 180, 180);
    pdf.line(20, y, pageWidth - 20, y);

    y += 9;

    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);

    pdf.text(
      `CyberNexa Report ID: ${reportId}`,
      20,
      y
    );

    pdf.text(
      "Generated for cybersecurity assessment and investment planning.",
      20,
      y + 6
    );

    pdf.save(
      `CyberNexa-Security-Report-${reportId}.pdf`
    );

    showStatus(
      "Professional CyberNexa PDF report generated successfully."
    );
  }

  return (
    <div className="app">
      {showWelcome && (
        <div className="welcome-screen">
          <div className="welcome-background-grid" />

          <div className="welcome-card">
            <div className="welcome-logo">
              <span className="logo-symbol large">C</span>
              <span>CyberNexa</span>
            </div>

            <div className="welcome-badge">
              ⚡ CYBER RISK INTELLIGENCE PLATFORM
            </div>

            <h1>
              Make smarter decisions
              <br />
              about your <span>cybersecurity.</span>
            </h1>

            <p>
              Assess organizational cyber risk, optimize security
              investments, monitor sample threat intelligence, and
              understand the business impact — all from one platform.
            </p>

            <div className="welcome-actions">
              <button
                className="primary-button welcome-primary"
                onClick={startAssessment}
              >
                🚀 Start Assessment
              </button>

              <button
                className="secondary-button welcome-secondary"
                onClick={viewDashboard}
              >
                📊 View Dashboard
              </button>
            </div>

            <button
              className="demo-button"
              onClick={loadDemoMode}
            >
              🎬 Launch Demo Mode
            </button>

            <div className="welcome-features">
              <span>🛡️ Risk Assessment</span>
              <span>💰 Budget Optimization</span>
              <span>⚠️ Threat Intelligence</span>
              <span>📄 PDF Reporting</span>
            </div>
          </div>
        </div>
      )}

      <nav className="navbar">
        <button
          className="brand-button"
          onClick={() => setShowWelcome(true)}
          aria-label="Open CyberNexa welcome screen"
        >
          <div className="logo">
            <span className="logo-symbol">C</span>
            <span>CyberNexa</span>
          </div>
        </button>

        <div className="nav-links">
          <button onClick={() => scrollToSection("profile")}>
            Profile
          </button>

          <button onClick={() => scrollToSection("optimizer")}>
            Optimizer
          </button>

          <button onClick={() => scrollToSection("assessment")}>
            Assessment
          </button>

          <button onClick={() => scrollToSection("dashboard")}>
            Dashboard
          </button>

          <button
            onClick={() =>
              scrollToSection("threat-intelligence")
            }
          >
            Threats
          </button>

          <button onClick={() => scrollToSection("charts")}>
            Analytics
          </button>

          <button onClick={() => scrollToSection("history")}>
            History
          </button>

          <button
            className="nav-demo-button"
            onClick={loadDemoMode}
          >
            🎬 Demo
          </button>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="hero-topline">
              <p className="eyebrow">
                CYBER RISK INTELLIGENCE PLATFORM
              </p>

              {demoMode && (
                <span className="demo-active-badge">
                  ● DEMO MODE ACTIVE
                </span>
              )}
            </div>

            <h1>
              Make smarter decisions
              <br />
              about your <span>cybersecurity.</span>
            </h1>

            <p className="hero-description">
              CyberNexa helps organizations assess cyber risk,
              optimize security investments, understand threat
              intelligence, and measure the business impact of
              cybersecurity decisions.
            </p>

            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={() =>
                  scrollToSection("assessment")
                }
              >
                Start Risk Assessment
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  scrollToSection("threat-intelligence")
                }
              >
                View Threat Intelligence
              </button>
            </div>

            <div className="hero-mini-stats">
              <div>
                <strong>{activeThreats}</strong>
                <span>Active threats</span>
              </div>

              <div>
                <strong>{criticalThreats}</strong>
                <span>Critical threats</span>
              </div>

              <div>
                <strong>{history.length}</strong>
                <span>Saved assessments</span>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">🛡️</div>

            <span className="stat-label">
              CURRENT RISK SCORE
            </span>

            <strong>{riskScore}/100</strong>

            <small>{riskLevel.label} risk level</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>

            <span className="stat-label">
              SECURITY BUDGET
            </span>

            <strong>{formatMoney(budget)}</strong>

            <small>Available investment budget</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📉</div>

            <span className="stat-label">
              PROJECTED SCORE
            </span>

            <strong>{projectedScore}/100</strong>

            <small>
              {projectedRiskLevel.label} after investment
            </small>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚠️</div>

            <span className="stat-label">
              ACTIVE THREATS
            </span>

            <strong>{activeThreats}</strong>

            <small>Sample intelligence feed</small>
          </div>
        </section>

        <section
          className="executive-section"
          id="executive-summary"
        >
          <div className="section-heading">
            <p className="eyebrow">
              EXECUTIVE SUMMARY
            </p>

            <h2>Cybersecurity at a glance</h2>

            <p>
              A quick executive view of your organization's current
              security posture and highest-priority actions.
            </p>
          </div>

          <div className="executive-grid">
            <div className="executive-score-card">
              <div className="executive-score-header">
                <div>
                  <span className="card-subtitle">
                    OVERALL RISK
                  </span>

                  <h3>{riskScore}/100</h3>
                </div>

                <span
                  className={`risk-badge ${riskLevel.className}`}
                >
                  {riskLevel.label}
                </span>
              </div>

              <div className="executive-progress">
                <div
                  className="executive-progress-fill"
                  style={{
                    width: `${riskScore}%`,
                  }}
                />
              </div>

              <div className="executive-score-footer">
                <span>Current</span>

                <strong>
                  → {projectedScore}/100 projected
                </strong>
              </div>
            </div>

            <div className="executive-metric">
              <span>💰</span>

              <div>
                <small>Recommended Investment</small>

                <strong>
                  {formatMoney(
                    totalRecommendedInvestment
                  )}
                </strong>
              </div>
            </div>

            <div className="executive-metric">
              <span>🐛</span>

              <div>
                <small>Critical Vulnerabilities</small>

                <strong>
                  {criticalVulnerabilities}
                </strong>
              </div>
            </div>

            <div className="executive-metric">
              <span>⚠️</span>

              <div>
                <small>Active Threats</small>

                <strong>{activeThreats}</strong>
              </div>
            </div>
          </div>

          <div className="priority-actions">
            <div className="priority-heading">
              <div>
                <span className="card-subtitle">
                  TOP 3 RECOMMENDED ACTIONS
                </span>

                <h3>What should you do first?</h3>
              </div>

              <button
                className="secondary-button"
                onClick={() =>
                  scrollToSection("optimizer")
                }
              >
                View Investment Plan
              </button>
            </div>

            <div className="priority-list">
              {topRecommendations.map(
                (recommendation, index) => (
                  <div
                    className="priority-item"
                    key={recommendation.id}
                  >
                    <div className="priority-number">
                      0{index + 1}
                    </div>

                    <div className="priority-icon">
                      {recommendation.icon}
                    </div>

                    <div className="priority-content">
                      <strong>
                        {recommendation.name}
                      </strong>

                      <span>
                        {recommendation.description}
                      </span>
                    </div>

                    <div className="priority-reduction">
                      -{recommendation.reduction}%
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <section className="profile-section" id="profile">
          <div className="section-heading">
            <p className="eyebrow">
              ORGANIZATION PROFILE
            </p>

            <h2>Tell us about your organization</h2>

            <p>
              Save your organization details to personalize the
              CyberNexa dashboard and security report.
            </p>
          </div>

          <div className="profile-card">
            <div className="profile-form">
              <div className="form-group">
                <label htmlFor="organizationName">
                  Organization name
                </label>

                <input
                  id="organizationName"
                  type="text"
                  placeholder="Example: ABC Technologies"
                  value={profile.organizationName}
                  onChange={(event) =>
                    updateProfileField(
                      "organizationName",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="industry">
                  Industry
                </label>

                <select
                  id="industry"
                  value={profile.industry}
                  onChange={(event) =>
                    updateProfileField(
                      "industry",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select industry
                  </option>

                  <option value="Information Technology">
                    Information Technology
                  </option>

                  <option value="Healthcare">
                    Healthcare
                  </option>

                  <option value="Finance and Banking">
                    Finance and Banking
                  </option>

                  <option value="Education">
                    Education
                  </option>

                  <option value="Manufacturing">
                    Manufacturing
                  </option>

                  <option value="Retail">
                    Retail
                  </option>

                  <option value="Government">
                    Government
                  </option>

                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="employees">
                  Number of employees
                </label>

                <input
                  id="employees"
                  type="number"
                  min="1"
                  placeholder="Example: 250"
                  value={profile.employees}
                  onChange={(event) =>
                    updateProfileField(
                      "employees",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="organizationSize">
                  Organization size
                </label>

                <select
                  id="organizationSize"
                  value={profile.organizationSize}
                  onChange={(event) =>
                    updateProfileField(
                      "organizationSize",
                      event.target.value
                    )
                  }
                >
                  <option value="Small">
                    Small organization
                  </option>

                  <option value="Medium">
                    Medium organization
                  </option>

                  <option value="Large">
                    Large organization
                  </option>

                  <option value="Enterprise">
                    Enterprise organization
                  </option>
                </select>
              </div>
            </div>

            <div className="profile-preview">
              <p className="card-subtitle">
                PROFILE PREVIEW
              </p>

              <div className="profile-avatar">
                {profile.organizationName
                  ? profile.organizationName
                      .charAt(0)
                      .toUpperCase()
                  : "C"}
              </div>

              <h3>
                {profile.organizationName ||
                  "Your organization"}
              </h3>

              <div className="profile-summary-grid">
                <div>
                  <span>Industry</span>

                  <strong>
                    {profile.industry ||
                      "Not selected"}
                  </strong>
                </div>

                <div>
                  <span>Employees</span>

                  <strong>
                    {profile.employees ||
                      "Not added"}
                  </strong>
                </div>

                <div>
                  <span>Organization size</span>

                  <strong>
                    {profile.organizationSize}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="optimizer-section"
          id="optimizer"
        >
          <div className="section-heading">
            <p className="eyebrow">STEP 01</p>

            <h2>Optimize your security budget</h2>

            <p>
              Choose your available budget and CyberNexa will
              recommend how to distribute it across important
              security areas.
            </p>
          </div>

          <div className="optimizer-card">
            <div className="budget-header">
              <div>
                <p className="card-subtitle">
                  AVAILABLE BUDGET
                </p>

                <h3>{formatMoney(budget)}</h3>
              </div>

              <div className="projected-score">
                <span>PROJECTED RISK</span>

                <strong>{projectedScore}/100</strong>

                <small>
                  {projectedRiskLevel.label}
                </small>
              </div>
            </div>

            <input
              className="budget-slider"
              type="range"
              min="10000"
              max="500000"
              step="5000"
              value={budget}
              onChange={(event) =>
                setBudget(
                  Number(event.target.value)
                )
              }
            />

            <div className="budget-range">
              <span>₹10,000</span>
              <span>₹5,00,000</span>
            </div>

            <div className="recommendations">
              {recommendations.map(
                (recommendation) => (
                  <div
                    className="recommendation-card"
                    key={recommendation.id}
                  >
                    <div className="recommendation-icon">
                      {recommendation.icon}
                    </div>

                    <div className="recommendation-content">
                      <div>
                        <span className="recommendation-priority">
                          {recommendation.priority}
                        </span>

                        <h3>
                          {recommendation.name}
                        </h3>

                        <p>
                          {recommendation.description}
                        </p>
                      </div>

                      <strong className="recommendation-amount">
                        {formatMoney(
                          recommendation.allocation
                        )}
                      </strong>
                    </div>

                    <div className="recommendation-footer">
                      <span>
                        Estimated risk reduction
                      </span>

                      <strong>
                        -{recommendation.reduction}%
                      </strong>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <section
          className="assessment-section"
          id="assessment"
        >
          <div className="section-heading">
            <p className="eyebrow">STEP 02</p>

            <h2>Assess your organization</h2>

            <p>
              Enter approximate values to calculate your
              organization's cyber risk score.
            </p>
          </div>

          <form
            className="assessment-form"
            onSubmit={handleAnalyzeRisk}
          >
            {[
              [
                "assets",
                "Digital assets",
                "Number and importance of your digital assets.",
              ],
              [
                "vulnerabilities",
                "Critical vulnerabilities",
                "Number of serious security weaknesses.",
              ],
              [
                "exposedAssets",
                "Exposed assets",
                "Assets exposed to external networks.",
              ],
              [
                "threatActivity",
                "Threat activity",
                "Current level of suspicious activity.",
              ],
              [
                "securityControls",
                "Security controls",
                "Strength of your existing security controls.",
              ],
              [
                "businessImpact",
                "Business impact",
                "Possible effect of a security incident.",
              ],
            ].map(
              ([field, label, description]) => (
                <div
                  className="form-group assessment-group"
                  key={field}
                >
                  <label htmlFor={field}>
                    {label}

                    <span>
                      {draftAssessment[field]}
                    </span>
                  </label>

                  <input
                    id={field}
                    type="range"
                    min="0"
                    max="100"
                    value={draftAssessment[field]}
                    onChange={(event) =>
                      updateDraftField(
                        field,
                        event.target.value
                      )
                    }
                  />

                  <div className="range-scale">
                    <span>Low</span>
                    <span>High</span>
                  </div>

                  <small>{description}</small>
                </div>
              )
            )}

            <div className="form-actions">
              <button
                className="primary-button"
                type="submit"
              >
                🔎 Analyze Risk
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  setDraftAssessment({
                    ...defaultAssessment,
                  })
                }
              >
                Reset Form
              </button>
            </div>
          </form>
        </section>

        <section
          className="dashboard-section"
          id="dashboard"
        >
          <div className="section-heading">
            <p className="eyebrow">LIVE DASHBOARD</p>

            <h2>
              {profile.organizationName
                ? `${profile.organizationName}'s cyber risk dashboard`
                : "Your cyber risk dashboard"}
            </h2>

            <p>
              Review your current risk score, contributing factors,
              investment strategy and projected improvement.
            </p>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-card risk-score-card">
              <div className="card-heading">
                <span>Overall risk score</span>

                <span
                  className={`risk-badge ${riskLevel.className}`}
                >
                  {riskLevel.label}
                </span>
              </div>

              <div
                className="risk-circle"
                style={{
                  "--score": `${riskScore * 3.6}deg`,
                }}
              >
                <div className="risk-circle-inner">
                  <strong>{riskScore}</strong>

                  <span>out of 100</span>
                </div>
              </div>

              <p className="risk-description">
                {riskLevel.description}
              </p>

              <div className="dashboard-action-buttons">
                <button
                  className="primary-button"
                  onClick={saveCurrentAssessment}
                >
                  💾 Save Assessment
                </button>

                <button
                  className="secondary-button report-button"
                  onClick={generatePDFReport}
                >
                  📄 Download Report
                </button>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-heading">
                <span>Risk factors</span>

                <span className="card-heading-muted">
                  {riskFactors.length} indicators
                </span>
              </div>

              <div className="risk-factors">
                {riskFactors.map((factor) => (
                  <div
                    className="risk-factor"
                    key={factor.name}
                  >
                    <div className="risk-factor-header">
                      <div className="risk-factor-title">
                        <span className="risk-factor-icon">
                          {factor.icon}
                        </span>

                        <div>
                          <strong>
                            {factor.name}
                          </strong>

                          <small>
                            {factor.description}
                          </small>
                        </div>
                      </div>

                      <span>
                        {factor.value}%
                      </span>
                    </div>

                    <div className="factor-bar">
                      <div
                        className="factor-bar-fill"
                        style={{
                          width: `${factor.value}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-summary-row">
            <div className="dashboard-mini-card">
              <span>Current Score</span>

              <strong>{riskScore}/100</strong>

              <small>{riskLevel.label}</small>
            </div>

            <div className="dashboard-mini-card">
              <span>Projected Score</span>

              <strong>{projectedScore}/100</strong>

              <small>
                {projectedRiskLevel.label}
              </small>
            </div>

            <div className="dashboard-mini-card">
              <span>Risk Improvement</span>

              <strong>
                {Math.max(
                  riskScore - projectedScore,
                  0
                )}
                %
              </strong>

              <small>Estimated improvement</small>
            </div>

            <div className="dashboard-mini-card">
              <span>Recommended Investment</span>

              <strong>
                {formatMoney(
                  totalRecommendedInvestment
                )}
              </strong>

              <small>Optimized allocation</small>
            </div>
          </div>
        </section>

        <section
          className="threat-section"
          id="threat-intelligence"
        >
          <div className="section-heading">
            <div className="threat-heading-row">
              <div>
                <p className="eyebrow">
                  THREAT INTELLIGENCE
                </p>

                <h2>Know what you're defending against</h2>

                <p>
                  Sample threat intelligence for the CyberNexa
                  prototype. These entries are clearly labelled
                  sample data and are not a live security feed.
                </p>
              </div>

              <div className="sample-data-badge">
                SAMPLE DATA
              </div>
            </div>
          </div>

          <div className="threat-overview">
            <div>
              <span>Active Threats</span>

              <strong>{activeThreats}</strong>
            </div>

            <div>
              <span>Critical</span>

              <strong>{criticalThreats}</strong>
            </div>

            <div>
              <span>Resolved</span>

              <strong>
                {
                  threatData.filter(
                    (threat) =>
                      threat.status === "Resolved"
                  ).length
                }
              </strong>
            </div>

            <div>
              <span>Industries Monitored</span>

              <strong>8+</strong>
            </div>
          </div>

          <div className="threat-grid">
            {threatData.map((threat) => (
              <article
                className="threat-card"
                key={threat.id}
              >
                <div className="threat-card-top">
                  <div className="threat-icon">
                    {threat.icon}
                  </div>

                  <div className="threat-status-row">
                    <span
                      className={`severity-badge ${threat.severity.toLowerCase()}`}
                    >
                      {threat.severity}
                    </span>

                    <span
                      className={`threat-status ${threat.status.toLowerCase()}`}
                    >
                      ● {threat.status}
                    </span>
                  </div>
                </div>

                <h3>{threat.name}</h3>

                <div className="threat-detail">
                  <span>Affected industries</span>

                  <strong>
                    {threat.industry}
                  </strong>
                </div>

                <div className="threat-action">
                  <span>Recommended action</span>

                  <p>{threat.action}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="charts-section"
          id="charts"
        >
          <div className="section-heading">
            <p className="eyebrow">
              VISUAL ANALYTICS
            </p>

            <h2>Understand your security data</h2>

            <p>
              These charts are generated from your assessment
              values and recommended investment plan.
            </p>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <div className="card-heading">
                <span>
                  Current vs projected risk
                </span>
              </div>

              <div className="chart-wrapper">
                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <BarChart data={scoreChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />

                    <XAxis
                      dataKey="name"
                      stroke="#8da0b8"
                    />

                    <YAxis
                      domain={[0, 100]}
                      stroke="#8da0b8"
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#10233a",
                        border:
                          "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "10px",
                        color: "#ffffff",
                      }}
                    />

                    <Legend />

                    <Bar
                      dataKey="current"
                      name="Current score"
                      fill="#ffb45c"
                      radius={[8, 8, 0, 0]}
                    />

                    <Bar
                      dataKey="projected"
                      name="Projected score"
                      fill="#5ce1e6"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <p className="chart-note">
                Your projected score is based on the recommended
                security investments.
              </p>
            </div>

            <div className="chart-card">
              <div className="card-heading">
                <span>Risk-factor comparison</span>
              </div>

              <div className="chart-wrapper">
                <ResponsiveContainer
                  width="100%"
                  height={340}
                >
                  <BarChart
                    data={riskFactorChartData}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 20,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />

                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      stroke="#8da0b8"
                    />

                    <YAxis
                      type="category"
                      dataKey="name"
                      width={135}
                      stroke="#8da0b8"
                      tick={{ fontSize: 11 }}
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#10233a",
                        border:
                          "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "10px",
                        color: "#ffffff",
                      }}
                    />

                    <Bar
                      dataKey="value"
                      name="Risk value"
                      fill="#5d7bff"
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <p className="chart-note">
                Higher values indicate areas that need more
                attention.
              </p>
            </div>

            <div className="chart-card chart-card-wide">
              <div className="card-heading">
                <span>
                  Recommended budget allocation
                </span>
              </div>

              <div className="pie-chart-layout">
                <div className="chart-wrapper">
                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >
                    <PieChart>
                      <Pie
                        data={budgetChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        innerRadius={55}
                        paddingAngle={4}
                        labelLine={false}
                      >
                        {budgetChartData.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={
                                chartColors[
                                  index %
                                    chartColors.length
                                ]
                              }
                            />
                          )
                        )}
                      </Pie>

                      <Tooltip
                        formatter={(value) =>
                          formatMoney(value)
                        }
                        contentStyle={{
                          background: "#10233a",
                          border:
                            "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "10px",
                          color: "#ffffff",
                        }}
                      />

                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="allocation-summary">
                  <span className="card-subtitle">
                    TOTAL BUDGET
                  </span>

                  <strong>
                    {formatMoney(budget)}
                  </strong>

                  <div className="allocation-list">
                    {recommendations.map(
                      (recommendation, index) => (
                        <div
                          className="allocation-item"
                          key={recommendation.id}
                        >
                          <span>
                            <i
                              style={{
                                background:
                                  chartColors[
                                    index %
                                      chartColors.length
                                  ],
                              }}
                            />

                            {recommendation.name}
                          </span>

                          <strong>
                            {formatMoney(
                              recommendation.allocation
                            )}
                          </strong>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card chart-card-wide trend-chart-card">
              <div className="card-heading">
                <div>
                  <span>Risk trend history</span>

                  <small className="chart-heading-subtitle">
                    Track how your organization's risk changes
                    across saved assessments.
                  </small>
                </div>
              </div>

              {trendChartData.length < 2 ? (
                <div className="trend-empty-state">
                  <div className="trend-empty-icon">
                    📈
                  </div>

                  <h3>Build your risk trend</h3>

                  <p>
                    Save at least two assessments to see how your
                    current and projected risk scores change over
                    time.
                  </p>

                  <button
                    className="secondary-button"
                    onClick={() =>
                      scrollToSection("dashboard")
                    }
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <>
                  <div className="chart-wrapper trend-chart-wrapper">
                    <ResponsiveContainer
                      width="100%"
                      height={360}
                    >
                      <LineChart
                        data={trendChartData}
                        margin={{
                          top: 10,
                          right: 20,
                          left: 5,
                          bottom: 10,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.1)"
                        />

                        <XAxis
                          dataKey="name"
                          stroke="#8da0b8"
                        />

                        <YAxis
                          domain={[0, 100]}
                          stroke="#8da0b8"
                        />

                        <Tooltip
                          labelFormatter={(
                            label,
                            payload
                          ) =>
                            payload?.[0]?.payload?.date ||
                            label
                          }
                          formatter={(value, name) => [
                            `${value}/100`,
                            name,
                          ]}
                          contentStyle={{
                            background: "#10233a",
                            border:
                              "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "10px",
                            color: "#ffffff",
                          }}
                        />

                        <Legend />

                        <Line
                          type="monotone"
                          dataKey="current"
                          name="Current score"
                          stroke="#ffb45c"
                          strokeWidth={3}
                          dot={{
                            r: 5,
                            fill: "#ffb45c",
                          }}
                          activeDot={{
                            r: 7,
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="projected"
                          name="Projected score"
                          stroke="#5ce1e6"
                          strokeWidth={3}
                          dot={{
                            r: 5,
                            fill: "#5ce1e6",
                          }}
                          activeDot={{
                            r: 7,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="chart-note">
                    Each point represents a saved CyberNexa
                    assessment.
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        <section
          className="history-section"
          id="history"
        >
          <div className="section-heading">
            <p className="eyebrow">
              ASSESSMENT HISTORY
            </p>

            <h2>Your saved assessments</h2>

            <p>
              Your assessment records are stored locally in this
              browser.
            </p>
          </div>

          <div className="history-card">
            {history.length === 0 ? (
              <div className="empty-history">
                <div className="empty-history-icon">
                  📋
                </div>

                <h3>No saved assessments yet</h3>

                <p>
                  Complete an assessment and click “Save
                  Assessment” to see it here.
                </p>

                <button
                  className="secondary-button"
                  onClick={() =>
                    scrollToSection("assessment")
                  }
                >
                  Create Assessment
                </button>
              </div>
            ) : (
              <>
                <div className="history-header">
                  <span>
                    {history.length} saved assessment
                    {history.length === 1 ? "" : "s"}
                  </span>

                  <button
                    className="danger-button"
                    onClick={clearHistory}
                  >
                    Clear History
                  </button>
                </div>

                <div className="history-list">
                  {history.map((item) => (
                    <div
                      className="history-item"
                      key={item.id}
                    >
                      <div className="history-main">
                        <div className="history-title">
                          <strong>
                            {item.level} Risk
                          </strong>

                          <span>
                            {item.date}
                          </span>
                        </div>

                        <div className="history-score">
                          <strong>
                            {item.score}/100
                          </strong>

                          <span>
                            Projected:{" "}
                            {item.projectedScore}/100
                          </span>
                        </div>
                      </div>

                      <div className="history-meta">
                        <span>
                          Budget:{" "}
                          {formatMoney(item.budget)}
                        </span>

                        <button
                          className="delete-button"
                          onClick={() =>
                            deleteHistoryItem(
                              item.id
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        <section
          className="impact-section"
          id="impact"
        >
          <div className="section-heading">
            <p className="eyebrow">
              BUSINESS IMPACT
            </p>

            <h2>
              Understand what your investment changes
            </h2>

            <p>
              Security investment protects business continuity,
              customer trust, and financial performance.
            </p>
          </div>

          <div className="impact-grid">
            <div className="impact-card">
              <span className="impact-icon">💰</span>

              <span className="impact-number">
                01
              </span>

              <h3>Reduced financial loss</h3>

              <p>
                Stronger security controls can reduce the potential
                cost of incidents and operational disruption.
              </p>
            </div>

            <div className="impact-card">
              <span className="impact-icon">🔄</span>

              <span className="impact-number">
                02
              </span>

              <h3>
                Improved business continuity
              </h3>

              <p>
                Better preparation helps organizations continue
                operating during cyber incidents.
              </p>
            </div>

            <div className="impact-card">
              <span className="impact-icon">🤝</span>

              <span className="impact-number">
                03
              </span>

              <h3>Greater customer trust</h3>

              <p>
                Responsible security investment supports customer
                confidence and protects sensitive information.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          <div className="logo">
            <span className="logo-symbol">
              C
            </span>

            <span>CyberNexa</span>
          </div>

          <p>
            Cyber risk intelligence and security investment
            optimization.
          </p>

          <span className="footer-sample-note">
            Prototype • Frontend-only • Sample threat intelligence
          </span>
        </div>

        <div className="footer-actions">
          <button
            onClick={() =>
              scrollToSection("executive-summary")
            }
          >
            Executive Summary
          </button>

          <button
            onClick={() =>
              scrollToSection("threat-intelligence")
            }
          >
            Threat Intelligence
          </button>

          <button onClick={resetApplication}>
            Reset Application
          </button>
        </div>
      </footer>

      {statusMessage && (
        <div
          className="status-message"
          role="status"
        >
          <span className="status-dot">✓</span>

          {statusMessage}
        </div>
      )}
    </div>
  );
}

export default App;