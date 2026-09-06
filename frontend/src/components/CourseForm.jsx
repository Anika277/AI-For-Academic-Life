import CLOTable from "./CLOTable";
import WeeklyPlanTable from "./WeeklyPlanTable";
import AssessmentBreakdown from "./AssessmentBreakdown";
import { parsePrerequisites } from "../utils/course";

export default function CourseForm({ course, onChange }) {
  function setField(key, value) {
    onChange({ ...course, [key]: value });
  }

  const cloIds = course.clos.map((c) => c.id);

  return (
    <form className="course-form" onSubmit={(e) => e.preventDefault()}>
      <div className="ledger-block">
        <div className="ledger-block__head">
          <h3>Course metadata</h3>
        </div>

        <div className="metadata-grid">
          <label className="field">
            <span>Course code</span>
            <input
              type="text"
              value={course.code}
              placeholder="e.g. CSE 4197"
              onChange={(e) => setField("code", e.target.value)}
            />
          </label>

          <label className="field field--wide">
            <span>Title</span>
            <input
              type="text"
              value={course.title}
              placeholder="e.g. Embedded Systems for IoT"
              onChange={(e) => setField("title", e.target.value)}
            />
          </label>

          <label className="field">
            <span>Credit hours</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={course.credit_hours}
              onChange={(e) => setField("credit_hours", Number(e.target.value))}
            />
          </label>

          <label className="field field--wide">
            <span>Prerequisites</span>
            <input
              type="text"
              value={course.prerequisites.join(", ")}
              placeholder="Comma-separated, e.g. CSE 3117, CSE 2213"
              onChange={(e) => setField("prerequisites", parsePrerequisites(e.target.value))}
            />
          </label>

          <label className="field field--full">
            <span>Course objectives</span>
            <textarea
              rows={3}
              value={course.objectives}
              placeholder="What the course sets out to achieve"
              onChange={(e) => setField("objectives", e.target.value)}
            />
          </label>
        </div>
      </div>

      <CLOTable clos={course.clos} onChange={(clos) => setField("clos", clos)} />

      <WeeklyPlanTable
        weeklyPlan={course.weekly_plan}
        cloIds={cloIds}
        onChange={(weekly_plan) => setField("weekly_plan", weekly_plan)}
      />

      <AssessmentBreakdown
        breakdown={course.assessment_breakdown}
        onChange={(assessment_breakdown) => setField("assessment_breakdown", assessment_breakdown)}
      />
    </form>
  );
}
