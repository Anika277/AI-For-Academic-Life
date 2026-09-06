import { useState } from "react"
import CourseForm from "../components/CourseForm"
import ProgressTracker from "../components/ProgressTracker"
import CompletenessPanel from "../components/CompletenessPanel"
import OverlapPanel from "../components/OverlapPanel"
import CLOQualityPanel from "../components/CLOQualityPanel"
import QuestionCoveragePanel from "../components/QuestionCoveragePanel"
import AgentChat from "../components/AgentChat"
import { useToast } from "../context/ToastContext"
import { useTabTitle } from "../hooks/useTabTitle"
import {
  checkCompleteness,
  checkOverlap,
  checkCLO,
  checkQuestions,
} from "../api/client"
import { emptyCourse, sampleCourse } from "../utils/course"

const CurriculumDeskPage = () => {
  const [course, setCourse] = useState(emptyCourse())
  const toast = useToast()

  // Curriculum review state
  const [completeness, setCompleteness] = useState(null)
  const [overlap, setOverlap] = useState(null)
  const [cloQuality, setCLOQuality] = useState(null)

  const [loadingCompleteness, setLoadingCompleteness] = useState(false)
  const [loadingAI, setLoadingAI] = useState(false)
  const [overlapError, setOverlapError] = useState(null)
  const [cloError, setCLOError] = useState(null)
  const [formError, setFormError] = useState(null)

  // Exam paper review — separate workflow, its own state.
  const [showExamReview, setShowExamReview] = useState(false)
  const [questionPaper, setQuestionPaper] = useState("")
  const [questionCoverage, setQuestionCoverage] = useState(null)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [questionsError, setQuestionsError] = useState(null)

  // Feedback state — drives the inline flash chips AND the tab title.
  // 'idle' | 'analyzing' | 'success' | 'error'
  const [analyzeFlash, setAnalyzeFlash] = useState("idle")
  const [examFlash, setExamFlash] = useState("idle")

  // Tab title reflects whichever workflow is currently active.
  // Analyzing state persists (no auto-revert); success flashes for 5s then reverts.
  const tabStatus =
    analyzeFlash === "analyzing"
      ? "⏳ Analyzing… · Curriculum Desk"
      : analyzeFlash === "success"
      ? "✓ Analysis ready · Curriculum Desk"
      : examFlash === "success"
      ? "✓ Exam analyzed · Curriculum Desk"
      : null
  useTabTitle(tabStatus, analyzeFlash === "analyzing" ? null : 5000)

  const handleLoadSample = () => {
    setCourse(sampleCourse())
    setQuestionPaper("")
    setCompleteness(null)
    setOverlap(null)
    setCLOQuality(null)
    setQuestionCoverage(null)
    setFormError(null)
    toast.info("Sample draft loaded", "CSE 4197 · Embedded Systems for IoT")
  }

  const handleAnalyze = async () => {
    setFormError(null)
    setOverlapError(null)
    setCLOError(null)
    setAnalyzeFlash("analyzing")

    setLoadingCompleteness(true)
    try {
      const completenessResult = await checkCompleteness(course)
      setCompleteness(completenessResult)
    } catch (err) {
      setFormError(err.message)
      setLoadingCompleteness(false)
      setAnalyzeFlash("error")
      toast.error("Analysis failed", err.message)
      setTimeout(() => setAnalyzeFlash("idle"), 3000)
      return
    }
    setLoadingCompleteness(false)

    setLoadingAI(true)
    const [overlapSettled, cloSettled] = await Promise.allSettled([
      checkOverlap(course),
      checkCLO(course),
    ])

    if (overlapSettled.status === "fulfilled") {
      setOverlap(overlapSettled.value)
    } else {
      setOverlapError(overlapSettled.reason.message)
    }

    if (cloSettled.status === "fulfilled") {
      setCLOQuality(cloSettled.value)
    } else {
      setCLOError(cloSettled.reason.message)
    }

    setLoadingAI(false)

    // Summarize what worked and what didn't in a single toast.
    const anyAIFailed =
      overlapSettled.status === "rejected" || cloSettled.status === "rejected"
    if (anyAIFailed) {
      setAnalyzeFlash("error")
      toast.error(
        "Analysis partially failed",
        "One or more AI checks couldn't complete — see panels for detail."
      )
    } else {
      setAnalyzeFlash("success")
      toast.success("Analysis complete", "All three checks passed.")
    }
    setTimeout(() => setAnalyzeFlash("idle"), 2500)
  }

  // Exam paper is its own action so faculty can iterate on it without
  // re-running the full curriculum analysis. Requires CLOs to exist.
  const handleCheckExam = async () => {
    setQuestionsError(null)
    setQuestionCoverage(null)

    if (!course.clos || course.clos.length === 0) {
      const msg = "Fill in the course CLOs above before checking the exam paper."
      setQuestionsError(msg)
      toast.error("Missing CLOs", msg)
      return
    }
    if (questionPaper.trim().length < 5) {
      const msg = "Paste the exam paper below — one question per line."
      setQuestionsError(msg)
      toast.error("No exam paper", msg)
      return
    }

    setLoadingQuestions(true)
    setExamFlash("analyzing")
    try {
      const data = await checkQuestions(course, questionPaper)
      setQuestionCoverage(data)
      setExamFlash("success")
      toast.success("Exam paper analyzed", "Coverage and Bloom's balance ready.")
    } catch (err) {
      setQuestionsError(err.message)
      setExamFlash("error")
      toast.error("Exam check failed", err.message)
    } finally {
      setLoadingQuestions(false)
      setTimeout(() => setExamFlash("idle"), 2500)
    }
  }

  const isAnalyzing = loadingCompleteness || loadingAI

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
            <button type="button" className="ghost-button" onClick={handleLoadSample}>
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
            {analyzeFlash === "success" && (
              <span className="flash flash--success" aria-hidden="true">✓ Done</span>
            )}
            {analyzeFlash === "error" && (
              <span className="flash flash--error" aria-hidden="true">✗ Failed</span>
            )}

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

      {/* ============ Exam paper review — progressive disclosure ============ */}
      <section className="exam-review">
        <div className="exam-review__divider">
          <button
            type="button"
            className="exam-review__toggle"
            onClick={() => setShowExamReview(!showExamReview)}
            aria-expanded={showExamReview}
          >
            <span className="exam-review__toggle-icon">
              {showExamReview ? "−" : "+"}
            </span>
            <span>
              {showExamReview ? "Close exam paper review" : "Review exam paper against this syllabus"}
            </span>
            <span className="exam-review__toggle-hint">
              Optional · closes the OBE loop
            </span>
          </button>
        </div>

        {showExamReview && (
          <div className="exam-review__body">
            <div className="exam-review__intro">
              <h2>Exam paper coverage check</h2>
              <p>
                Paste a draft exam paper below. We'll check which CLOs each
                question tests and whether Bloom's cognitive levels are balanced —
                closing the loop between what you promised to teach and what you're testing.
              </p>
            </div>

            <div className="exam-review__grid">
              <div className="exam-review__input">
                <label className="exam-review__label" htmlFor="exam-paper-input">
                  Question paper
                </label>
                <textarea
                  id="exam-paper-input"
                  className="question-paper-input"
                  rows={14}
                  placeholder={`Paste one question per line, e.g.\n\n1. Define what an IoT sensor is.\n2. Explain how I2C differs from SPI.\n3. Design an air-quality monitoring system using ESP32.\n4. Compare the trade-offs of MQTT vs HTTP for IoT communication.`}
                  value={questionPaper}
                  onChange={(e) => setQuestionPaper(e.target.value)}
                />
                <div>
                  <button
                    type="button"
                    className="analyze-button exam-review__submit"
                    onClick={handleCheckExam}
                    disabled={loadingQuestions}
                  >
                    {loadingQuestions ? "Analyzing paper…" : "Check exam coverage"}
                  </button>
                  {examFlash === "success" && (
                    <span className="flash flash--success" aria-hidden="true">✓ Done</span>
                  )}
                  {examFlash === "error" && (
                    <span className="flash flash--error" aria-hidden="true">✗ Failed</span>
                  )}
                </div>
              </div>

              <div className="exam-review__output">
                <QuestionCoveragePanel
                  result={questionCoverage}
                  loading={loadingQuestions}
                  error={questionsError}
                  paperProvided={questionPaper.trim().length > 0}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      <AgentChat course={course} onChange={setCourse} />
    </div>
  )
}

export default CurriculumDeskPage