"use client";

import React, { useState } from "react";
import { Calendar, Clock, Video, Plus, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Mono } from "../ui/mono";
import { Avatar } from "../ui/avatar";
import { useInterviews, useScheduleInterview, useUpdateInterview } from "@/hooks/use-interviews";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Stage } from "@/lib/validations/common";

const DEFAULT_STATUS_CONFIG = { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/25" };

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  SCHEDULED: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/25" },
  COMPLETED: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/25" },
  CANCELLED: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/25" },
  NO_SHOW: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/25" },
};

export function InterviewsTab({ dossier }: { dossier: any }) {
  const { data: interviews = [] } = useInterviews(dossier.id);
  const scheduleMutation = useScheduleInterview(dossier.id);
  const updateMutation = useUpdateInterview(dossier.id);

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [title, setTitle] = useState("Technical & Systems Assessment");
  const [stage, setStage] = useState<Stage>(dossier.currentStage as Stage);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("14:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [meetingLink, setMeetingLink] = useState("https://meet.google.com/vel-oce-ats");
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<string[]>([]);

  // Fetch users for interviewer selection
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/v1/users");
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const handleToggleInterviewer = (id: string) => {
    setSelectedInterviewerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInterviewerIds.length === 0) {
      toast.error("Please select at least one interviewer");
      return;
    }

    const start = new Date(`${date}T${time}:00Z`);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    await scheduleMutation.mutateAsync({
      title,
      stage,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      meetingLink,
      interviewerIds: selectedInterviewerIds,
      status: "SCHEDULED",
    });

    setShowScheduleForm(false);
  };

  const handleStatusUpdate = async (id: string, status: "COMPLETED" | "CANCELLED" | "NO_SHOW") => {
    await updateMutation.mutateAsync({ id, input: { status } });
  };

  const getUserName = (id: string) => {
    const user = users.find((u) => u.id === id);
    return user ? user.name : id;
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-fg uppercase tracking-wider">
          Scheduled & Past Interviews ({interviews.length})
        </h4>
        <Button
          variant={showScheduleForm ? "outline" : "primary"}
          size="sm"
          icon={showScheduleForm ? undefined : <Plus className="w-3.5 h-3.5" />}
          onClick={() => setShowScheduleForm(!showScheduleForm)}
        >
          {showScheduleForm ? "Cancel" : "Schedule Interview"}
        </Button>
      </div>

      {/* Schedule Form */}
      {showScheduleForm && (
        <form onSubmit={handleScheduleSubmit} className="p-4 bg-canvas border border-hairline rounded-lg flex flex-col gap-4">
          <span className="text-xs font-semibold text-fg uppercase tracking-wider">
            Schedule New Session
          </span>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Session Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Select label="Stage" value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
              <option value="SCREENING">Screening</option>
              <option value="TECHNICAL_INTERVIEW">Technical Interview</option>
              <option value="SYSTEM_DESIGN">System Design</option>
              <option value="OFFER">Offer Sync</option>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input label="Start Time (UTC)" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            <Select
              label="Duration"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </Select>
          </div>

          <Input
            label="Video Meeting Link"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            icon={<Video className="w-3.5 h-3.5 text-fg-muted" />}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-fg">Assign Interviewers</label>
            <div className="flex flex-wrap gap-2">
              {users.map((u) => {
                const isSelected = selectedInterviewerIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleToggleInterviewer(u.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border transition-colors ${
                      isSelected
                        ? "bg-primary-muted text-primary border-primary font-semibold"
                        : "bg-panel text-fg-muted border-hairline hover:bg-hairline/40"
                    }`}
                  >
                    <Avatar name={u.name} src={u.avatarUrl} size="xs" />
                    <span>{u.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowScheduleForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={scheduleMutation.isPending}
            >
              Schedule Event
            </Button>
          </div>
        </form>
      )}

      {/* Events List */}
      <div className="flex flex-col gap-3">
        {interviews.length > 0 ? (
          interviews.map((ev: any) => {
            const conf = STATUS_CONFIG[ev.status] ?? DEFAULT_STATUS_CONFIG;
            const isCompleted = ev.status === "COMPLETED";

            return (
              <div
                key={ev.id}
                className="p-4 bg-canvas border border-hairline rounded-lg flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-panel border border-hairline rounded-md text-fg-muted shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-fg">{ev.title}</span>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${conf.bg} ${conf.text} ${conf.border}`}
                      >
                        {ev.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-fg-muted">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(ev.startTime).toLocaleDateString()} •{" "}
                        {new Date(ev.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {ev.meetingLink && (
                        <a
                          href={ev.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Video className="w-3 h-3" /> Join Room
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] text-fg-muted">Interviewers:</span>
                      {ev.interviewerIds.map((id: string) => (
                        <span key={id} className="text-[11px] font-medium text-fg bg-panel px-1.5 py-0.5 rounded border border-hairline">
                          {getUserName(id)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {ev.status === "SCHEDULED" && (
                    <>
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => handleStatusUpdate(ev.id, "COMPLETED")}
                      >
                        Mark Completed
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleStatusUpdate(ev.id, "NO_SHOW")}
                      >
                        No-Show
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleStatusUpdate(ev.id, "CANCELLED")}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {isCompleted && (
                    <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Complete
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center border border-dashed border-hairline rounded-lg text-fg-muted text-xs">
            No interview sessions scheduled yet.
          </div>
        )}
      </div>
    </div>
  );
}
