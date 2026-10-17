"use client";

import React, { useState } from "react";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { Textarea } from "../ui/input";
import { Mono } from "../ui/mono";
import { AlertTriangle, CheckCircle, Plus, Send } from "lucide-react";
import { computeCalibrationMatrix } from "@/lib/calibration";
import { useSubmitScorecard } from "@/hooks/use-scorecards";

import { Recommendation } from "@/lib/validations/common";

const RECOMMENDATION_COLORS: Record<Recommendation, { bg: string; text: string; border: string }> = {
  STRONG_NO: { bg: "bg-rose-500/20", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/30" },
  NO: { bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20" },
  NEUTRAL: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
  YES: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
  STRONG_YES: { bg: "bg-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/30" },
};

export function ScorecardsTab({ dossier }: { dossier: any }) {
  const [showForm, setShowForm] = useState(false);

  const [technicalScore, setTechnicalScore] = useState(4);
  const [architectureScore, setArchitectureScore] = useState(4);
  const [problemSolvingScore, setProblemSolvingScore] = useState(4);
  const [communicationScore, setCommunicationScore] = useState(4);
  const [cultureScore, setCultureScore] = useState(4);
  const [overallRecommendation, setOverallRecommendation] = useState<Recommendation>("YES");
  const [strengths, setStrengths] = useState("");
  const [concerns, setConcerns] = useState("");

  const submitScorecardMutation = useSubmitScorecard(dossier.id);

  const scorecards = dossier.scorecards || [];
  const matrix = computeCalibrationMatrix(scorecards);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (strengths.length < 20 || concerns.length < 20) return;

    await submitScorecardMutation.mutateAsync({
      technicalScore,
      architectureScore,
      problemSolvingScore,
      communicationScore,
      cultureScore,
      overallRecommendation,
      strengths,
      concerns,
    });

    setShowForm(false);
    setStrengths("");
    setConcerns("");
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header action */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-fg uppercase tracking-wider">
          Interviewer Calibration Matrix ({scorecards.length} Submissions)
        </h4>
        <Button
          variant={showForm ? "outline" : "primary"}
          size="sm"
          icon={showForm ? undefined : <Plus className="w-3.5 h-3.5" />}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel Form" : "Submit Scorecard"}
        </Button>
      </div>

      {/* Disagreement / Calibration Banner */}
      {matrix.calibrationNeeded && (
        <div className="p-3.5 bg-warn-surface border border-warn/30 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warn shrink-0 mt-0.5" />
          <div className="text-xs text-fg flex flex-col gap-1">
            <span className="font-semibold text-warn">Calibration Review Needed</span>
            <span>
              High variance or conflicting recommendations detected among interviewers:{" "}
              <strong>{matrix.divergingInterviewers.join(", ")}</strong>. Schedule an alignment sync
              before extending an offer.
            </span>
          </div>
        </div>
      )}

      {/* Submission Form Drawer/Block */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-canvas border border-hairline rounded-lg flex flex-col gap-4">
          <span className="text-xs font-semibold text-fg uppercase tracking-wider">
            New Scorecard Submission
          </span>

          {/* Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Technical Competency", val: technicalScore, set: setTechnicalScore },
              { label: "Systems Architecture", val: architectureScore, set: setArchitectureScore },
              { label: "Problem Solving", val: problemSolvingScore, set: setProblemSolvingScore },
              { label: "Communication", val: communicationScore, set: setCommunicationScore },
              { label: "Culture & Values", val: cultureScore, set: setCultureScore },
            ].map((slider) => (
              <div key={slider.label} className="flex flex-col gap-1.5 p-2.5 bg-panel border border-hairline rounded-md">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-fg">{slider.label}</span>
                  <Mono className="font-bold text-primary text-sm">{slider.val} / 5</Mono>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={slider.val}
                  onChange={(e) => slider.set(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            ))}
          </div>

          {/* Recommendation Segmented Control */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-fg">Overall Recommendation</label>
            <div className="grid grid-cols-5 gap-1.5">
              {(["STRONG_NO", "NO", "NEUTRAL", "YES", "STRONG_YES"] as Recommendation[]).map((rec) => {
                const isSelected = overallRecommendation === rec;
                const conf = RECOMMENDATION_COLORS[rec];
                return (
                  <button
                    key={rec}
                    type="button"
                    onClick={() => setOverallRecommendation(rec)}
                    className={`py-1.5 px-2 text-xs font-semibold rounded border transition-colors ${
                      isSelected
                        ? `${conf.bg} ${conf.text} ${conf.border} ring-2 ring-primary/50`
                        : "bg-panel text-fg-muted border-hairline hover:bg-hairline/40"
                    }`}
                  >
                    {rec.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Strengths & Concerns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Textarea
              label="Key Strengths (min 20 characters)"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="Candidate showed exceptional knowledge of..."
              error={strengths.length > 0 && strengths.length < 20 ? "Min 20 characters required" : undefined}
            />
            <Textarea
              label="Key Concerns (min 20 characters)"
              value={concerns}
              onChange={(e) => setConcerns(e.target.value)}
              placeholder="Questions remain regarding..."
              error={concerns.length > 0 && concerns.length < 20 ? "Min 20 characters required" : undefined}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={strengths.length < 20 || concerns.length < 20 || submitScorecardMutation.isPending}
              isLoading={submitScorecardMutation.isPending}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Submit Evaluation
            </Button>
          </div>
        </form>
      )}

      {/* Side-by-Side Calibration Matrix Table */}
      {scorecards.length > 0 ? (
        <div className="border border-hairline rounded-lg overflow-x-auto bg-panel shadow-xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-hairline bg-canvas">
                <th className="py-2.5 px-4 font-semibold text-fg">Rubric Dimension</th>
                {matrix.interviewerColumns.map((inv) => (
                  <th key={inv.id} className="py-2.5 px-4 font-semibold text-fg text-center min-w-[120px]">
                    <div className="flex items-center justify-center gap-2">
                      <Avatar name={inv.name} src={inv.avatarUrl} size="xs" />
                      <span className="truncate max-w-[90px]">{inv.name}</span>
                    </div>
                  </th>
                ))}
                <th className="py-2.5 px-4 font-semibold text-fg text-center bg-hairline/20">Average</th>
              </tr>
            </thead>
            <tbody>
              {matrix.criteriaRows.map((row) => (
                <tr key={row.criterion} className="border-b border-hairline/60 hover:bg-hairline/20">
                  <td className="py-2.5 px-4 font-medium text-fg flex items-center justify-between">
                    <span>{row.criterion}</span>
                    {row.hasDisagreement && (
                      <span className="text-[10px] text-warn font-mono font-bold bg-warn-surface px-1.5 py-0.2 rounded border border-warn/30">
                        Spread: {row.spread}
                      </span>
                    )}
                  </td>
                  {matrix.interviewerColumns.map((inv) => {
                    const rating = row.ratings[inv.id];
                    return (
                      <td key={inv.id} className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-6 rounded font-mono font-bold text-xs ${
                            rating && rating >= 4
                              ? "bg-emerald-500/15 text-emerald-500"
                              : rating && rating === 3
                              ? "bg-amber-500/15 text-amber-500"
                              : "bg-rose-500/15 text-rose-500"
                          }`}
                        >
                          {rating || "--"}
                        </span>
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-4 text-center font-mono font-bold bg-hairline/20">
                    <Mono>{row.average}</Mono>
                  </td>
                </tr>
              ))}
              {/* Overall Recommendation Row */}
              <tr className="bg-canvas/50">
                <td className="py-3 px-4 font-bold text-fg">Overall Recommendation</td>
                {matrix.interviewerColumns.map((inv) => {
                  const rec = matrix.recommendations[inv.id] || "NEUTRAL";
                  const conf = RECOMMENDATION_COLORS[rec];
                  return (
                    <td key={inv.id} className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono border ${conf.bg} ${conf.text} ${conf.border}`}
                      >
                        {rec.replace("_", " ")}
                      </span>
                    </td>
                  );
                })}
                <td className="py-3 px-4 text-center font-bold font-mono bg-hairline/20">--</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center border border-dashed border-hairline rounded-lg text-fg-muted text-xs">
          No scorecards submitted for this candidate yet.
        </div>
      )}

      {/* Strengths & Concerns List */}
      {scorecards.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-fg uppercase tracking-wider">
            Interviewer Feedback & Notes
          </span>
          <div className="flex flex-col gap-3">
            {scorecards.map((sc: any) => (
              <div key={sc.id} className="p-4 bg-canvas border border-hairline rounded-lg flex flex-col gap-2.5">
                <div className="flex items-center justify-between border-b border-hairline/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={sc.interviewer.name} src={sc.interviewer.avatarUrl} size="sm" />
                    <div>
                      <span className="text-xs font-semibold text-fg">{sc.interviewer.name}</span>
                      <span className="text-[10px] text-fg-muted ml-2 font-mono">
                        {new Date(sc.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono border ${
                      RECOMMENDATION_COLORS[sc.overallRecommendation as Recommendation].bg
                    } ${RECOMMENDATION_COLORS[sc.overallRecommendation as Recommendation].text} ${
                      RECOMMENDATION_COLORS[sc.overallRecommendation as Recommendation].border
                    }`}
                  >
                    {sc.overallRecommendation.replace("_", " ")}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-success block mb-0.5">Key Strengths</span>
                    <p className="text-fg-muted leading-relaxed">{sc.strengths}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-danger block mb-0.5">Concerns</span>
                    <p className="text-fg-muted leading-relaxed">{sc.concerns}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
