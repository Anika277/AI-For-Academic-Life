import { useState } from "react";
import "./styles/app.css";
import CourseForm from "./components/CourseForm";
import ProgressTracker from "./components/ProgressTracker";
import CompletenessPanel from "./components/CompletenessPanel";
import OverlapPanel from "./components/OverlapPanel";
import CLOQualityPanel from "./components/CLOQualityPanel";
import { checkCompleteness, checkOverlap, checkCLO } from "./api/client";
import { emptyCourse, sampleCourse } from "./utils/course";

export default function App() {
  const [course, setCourse] = useState(emptyCourse());

  const [completeness, setCompleteness] = useState(null);
  const [overlap, setOverlap] = useState(null);
  const [cloQuality, setCLOQuality] = useState(null);

  const [loadingCompleteness, setLoadingCompleteness] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [overlapError, setOverlapError] = useState(null);
  const [cloError, setCLOError] = useState(null);
  const [formError, setFormError] = useState(null);

  function loadSample() {
    setCourse(sampleCourse());
    setCompleteness(null);
    setOverlap(null);
    setCLOQuality(null);
    setFormError(null);
  }

  async function handleAnalyze() {
    setFormError(null);
    setOverlapError(null);
    setCLOError(null);

    // Step 1: instant, rule-based — no need to wait on AI for this.
    setLoadingCompleteness(true);
    try {
      const completenessResult = await checkCompleteness(course);
      setCompleteness(completenessResult);
    } catch (err) {
      setFormError(err.message);
      setLoadingCompleteness(false);
      return;
    }
    setLoadingCompleteness(false);

    // Step 2: the two Grok-backed checks run in parallel; each panel
    // reports its own error independently so one failing doesn't
    // block the other from showing results.
    setLoadingAI(true);
    const [overlapSettled, cloSettled] = await Promise.allSettled([
      checkOverlap(course),
      checkCLO(course),
    ]);

    if (overlapSettled.status === "fulfilled") {
      setOverlap(overlapSettled.value);
    } else {
      setOverlapError(overlapSettled.reason.message);
    }

    if (cloSettled.status === "fulfilled") {
      setCLOQuality(cloSettled.value);
    } else {
      setCLOError(cloSettled.reason.message);
    }

    setLoadingAI(false);
  }

  const isAnalyzing = loadingCompleteness || loadingAI;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-header__eyebrow">AUST CSE · Curriculum Desk</p>
          <h1>New course syllabus review</h1>
        </div>
        <p className="app-header__tagline">
          A second pair of eyes on structure, overlap, and CLO wording — the coordinator still decides.
        </p>
      </header>

      <div className="app-body">
        <section className="app-body__form">
          <div className="form-toolbar">
            <button type="button" className="ghost-button" onClick={loadSample}>
              Load sample draft
            </button>
          </div>
          <CourseForm course={course} onChange={setCourse} />
        </section>

        <aside className="app-body__review">
          <div className="review-sticky">
            <ProgressTracker result={completeness} />

            <button
              type="button"
              className="analyze-button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "Analyzing draft…" : "Analyze draft"}
            </button>

            {formError && <p className="panel__status panel__status--error">{formError}</p>}

            <CompletenessPanel result={completeness} loading={loadingCompleteness} />
            <OverlapPanel result={overlap} loading={loadingAI && !overlap} error={overlapError} />
            <CLOQualityPanel
              result={cloQuality}
              loading={loadingAI && !cloQuality}
              error={cloError}
              clos={course.clos}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
