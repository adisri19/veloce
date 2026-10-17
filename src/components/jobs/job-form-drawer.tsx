"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Drawer } from "../ui/drawer";
import { Input, Textarea } from "../ui/input";
import { Select } from "../ui/select";
import { Button } from "../ui/button";
import { SlaEditor } from "./sla-editor";
import { useCreateJob, useUpdateJob } from "@/hooks/use-jobs";
import {
  WorkMode,
  EmploymentType,
  JobStatus,
  Priority,
  DEFAULT_SLA_DAYS,
} from "@/lib/validations/common";
import { Plus, X, Sparkles } from "lucide-react";
import { toast } from "sonner";

export interface JobFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  job?: any; // If passed, edit mode; else create mode
}

export function JobFormDrawer({ isOpen, onClose, job }: JobFormDrawerProps) {
  const isEdit = Boolean(job);
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();

  // Fetch users for hiring manager dropdown
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/v1/users");
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 60000,
  });

  // Form State
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [location, setLocation] = useState("San Francisco, CA");
  const [workMode, setWorkMode] = useState<WorkMode>("HYBRID");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("FULL_TIME");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [niceToHaveSkills, setNiceToHaveSkills] = useState<string[]>([]);
  const [niceSkillInput, setNiceSkillInput] = useState("");
  const [domainKeywords, setDomainKeywords] = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const [minExperience, setMinExperience] = useState(3);
  const [maxExperience, setMaxExperience] = useState(8);
  const [salaryMin, setSalaryMin] = useState(150000);
  const [salaryMax, setSalaryMax] = useState(200000);
  const [currency, setCurrency] = useState("USD");
  const [headcountTotal, setHeadcountTotal] = useState(1);
  const [status, setStatus] = useState<JobStatus>("OPEN");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [hiringManagerId, setHiringManagerId] = useState("");
  const [slaDaysPerStage, setSlaDaysPerStage] = useState<Record<string, number>>(DEFAULT_SLA_DAYS);

  useEffect(() => {
    if (job) {
      setTitle(job.title || "");
      setDepartment(job.department || "Engineering");
      setLocation(job.location || "");
      setWorkMode(job.workMode || "HYBRID");
      setEmploymentType(job.employmentType || "FULL_TIME");
      setDescription(job.description || "");
      setRequiredSkills(job.requiredSkills || []);
      setNiceToHaveSkills(job.niceToHaveSkills || []);
      setDomainKeywords(job.domainKeywords || []);
      setMinExperience(job.minExperienceYears ?? 3);
      setMaxExperience(job.maxExperienceYears ?? 8);
      setSalaryMin(job.salaryMin ?? 150000);
      setSalaryMax(job.salaryMax ?? 200000);
      setCurrency(job.currency || "USD");
      setHeadcountTotal(job.headcountTotal ?? 1);
      setStatus(job.status || "OPEN");
      setPriority(job.priority || "MEDIUM");
      setHiringManagerId(job.hiringManagerId || "");
      setSlaDaysPerStage(job.slaDaysPerStage || DEFAULT_SLA_DAYS);
    } else {
      setTitle("");
      setDepartment("Engineering");
      setLocation("San Francisco, CA");
      setWorkMode("HYBRID");
      setEmploymentType("FULL_TIME");
      setDescription("");
      setRequiredSkills(["TypeScript", "React", "Node.js"]);
      setNiceToHaveSkills(["PostgreSQL", "Docker"]);
      setDomainKeywords(["Distributed Systems", "SaaS"]);
      setMinExperience(3);
      setMaxExperience(8);
      setSalaryMin(150000);
      setSalaryMax(200000);
      setCurrency("USD");
      setHeadcountTotal(1);
      setStatus("OPEN");
      setPriority("MEDIUM");
      setHiringManagerId(users[0]?.id || "");
      setSlaDaysPerStage(DEFAULT_SLA_DAYS);
    }
  }, [job, users]);

  const handleAddSkill = (
    type: "required" | "nice" | "domain",
    val: string
  ) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (type === "required") {
      if (!requiredSkills.includes(trimmed)) {
        setRequiredSkills([...requiredSkills, trimmed]);
      }
      setSkillInput("");
    } else if (type === "nice") {
      if (!niceToHaveSkills.includes(trimmed)) {
        setNiceToHaveSkills([...niceToHaveSkills, trimmed]);
      }
      setNiceSkillInput("");
    } else {
      if (!domainKeywords.includes(trimmed)) {
        setDomainKeywords([...domainKeywords, trimmed]);
      }
      setDomainInput("");
    }
  };

  const handleRemoveSkill = (
    type: "required" | "nice" | "domain",
    item: string
  ) => {
    if (type === "required") {
      setRequiredSkills(requiredSkills.filter((s) => s !== item));
    } else if (type === "nice") {
      setNiceToHaveSkills(niceToHaveSkills.filter((s) => s !== item));
    } else {
      setDomainKeywords(domainKeywords.filter((s) => s !== item));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requiredSkills.length === 0) {
      toast.error("Please add at least one required skill");
      return;
    }
    if (salaryMax < salaryMin) {
      toast.error("Salary Max must be greater than or equal to Salary Min");
      return;
    }
    if (maxExperience < minExperience) {
      toast.error("Max Experience must be greater than or equal to Min Experience");
      return;
    }

    const payload = {
      title,
      department,
      location,
      workMode,
      employmentType,
      description: description || `Full-time ${title} role within ${department} team.`,
      requiredSkills,
      niceToHaveSkills,
      domainKeywords,
      minExperienceYears: minExperience,
      maxExperienceYears: maxExperience,
      salaryMin,
      salaryMax,
      currency,
      headcountTotal,
      status,
      priority,
      slaDaysPerStage,
      hiringManagerId: hiringManagerId || (users[0]?.id ?? ""),
    };

    if (isEdit) {
      await updateJob.mutateAsync({
        id: job.id,
        input: payload,
      });
    } else {
      await createJob.mutateAsync(payload);
    }

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-2xl"
      title={isEdit ? `Edit Requisition: ${job?.code}` : "Create Job Requisition"}
      subtitle={
        isEdit
          ? "Updates to skills, bands, or domain keywords will trigger automated re-scoring of candidates"
          : "Configure hiring plan requirements, compensation bands, and stage SLAs"
      }
    >
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Job Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Infrastructure Engineer"
            required
          />
          <Input
            label="Department *"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Engineering, Product, Design..."
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Location *"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="San Francisco, CA or Remote"
            required
          />
          <Select
            label="Work Mode"
            value={workMode}
            onChange={(e) => setWorkMode(e.target.value as WorkMode)}
          >
            <option value="ONSITE">Onsite</option>
            <option value="HYBRID">Hybrid</option>
            <option value="REMOTE">Remote</option>
          </Select>
          <Select
            label="Employment Type"
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
          >
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERN">Intern</option>
          </Select>
        </div>

        <Textarea
          label="Job Description *"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed role description, team mission, and expectations..."
          rows={3}
          required
        />

        {/* Required Skills Chips */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-fg">
            Required Skills * (Used in 40% AI scoring component)
          </label>
          <div className="flex items-center gap-1.5 flex-wrap p-2 bg-canvas border border-hairline rounded-md">
            {requiredSkills.map((sk) => (
              <span
                key={sk}
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-primary-muted text-primary font-medium"
              >
                <span>{sk}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill("required", sk)}
                  className="hover:text-danger"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill("required", skillInput);
                }
              }}
              placeholder="+ Add skill (press Enter)..."
              className="bg-transparent text-xs text-fg focus:outline-none flex-1 min-w-[120px]"
            />
          </div>
        </div>

        {/* Nice to have skills & Domain keywords */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-fg">
              Nice-to-Have Skills
            </label>
            <div className="flex items-center gap-1.5 flex-wrap p-2 bg-canvas border border-hairline rounded-md min-h-[42px]">
              {niceToHaveSkills.map((sk) => (
                <span
                  key={sk}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-hairline text-fg-muted font-medium"
                >
                  <span>{sk}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill("nice", sk)}
                    className="hover:text-danger"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={niceSkillInput}
                onChange={(e) => setNiceSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill("nice", niceSkillInput);
                  }
                }}
                placeholder="+ Add..."
                className="bg-transparent text-xs text-fg focus:outline-none flex-1 min-w-[80px]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-fg">
              Domain Keywords (20% match weight)
            </label>
            <div className="flex items-center gap-1.5 flex-wrap p-2 bg-canvas border border-hairline rounded-md min-h-[42px]">
              {domainKeywords.map((kw) => (
                <span
                  key={kw}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium border border-amber-500/20"
                >
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill("domain", kw)}
                    className="hover:text-danger"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill("domain", domainInput);
                  }
                }}
                placeholder="+ Keyword..."
                className="bg-transparent text-xs text-fg focus:outline-none flex-1 min-w-[80px]"
              />
            </div>
          </div>
        </div>

        {/* Experience Band & Compensation Band */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-panel border border-hairline rounded-lg flex flex-col gap-2">
            <span className="text-xs font-semibold text-fg">Experience Band (Years)</span>
            <div className="flex items-center gap-2">
              <Input
                label="Min Exp"
                type="number"
                min={0}
                value={minExperience}
                onChange={(e) => setMinExperience(Number(e.target.value))}
              />
              <span className="text-fg-muted mt-5">to</span>
              <Input
                label="Max Exp"
                type="number"
                min={0}
                value={maxExperience}
                onChange={(e) => setMaxExperience(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="p-3 bg-panel border border-hairline rounded-lg flex flex-col gap-2">
            <span className="text-xs font-semibold text-fg">Salary Range ({currency})</span>
            <div className="flex items-center gap-2">
              <Input
                label="Min Salary"
                type="number"
                step={5000}
                value={salaryMin}
                onChange={(e) => setSalaryMin(Number(e.target.value))}
              />
              <span className="text-fg-muted mt-5">to</span>
              <Input
                label="Max Salary"
                type="number"
                step={5000}
                value={salaryMax}
                onChange={(e) => setSalaryMax(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Headcount, Priority, Status, Hiring Manager */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input
            label="Headcount"
            type="number"
            min={1}
            value={headcountTotal}
            onChange={(e) => setHeadcountTotal(Number(e.target.value))}
            required
          />
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </Select>
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as JobStatus)}
          >
            <option value="OPEN">Open</option>
            <option value="PAUSED">Paused</option>
            <option value="CLOSED">Closed</option>
          </Select>
          <Select
            label="Hiring Manager"
            value={hiringManagerId}
            onChange={(e) => setHiringManagerId(e.target.value)}
          >
            {users.map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </Select>
        </div>

        {/* SLA Editor */}
        <SlaEditor
          value={slaDaysPerStage}
          onChange={(newSlas) => setSlaDaysPerStage(newSlas)}
        />

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-hairline mt-2">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={createJob.isPending || updateJob.isPending}
            icon={isEdit ? <Sparkles className="w-3.5 h-3.5" /> : undefined}
          >
            {isEdit ? "Save & Re-score Candidates" : "Create Requisition"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
