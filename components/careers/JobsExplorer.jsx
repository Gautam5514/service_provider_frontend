"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Briefcase, Clock, IndianRupee, MapPin } from "lucide-react";

export const TYPE_LABEL = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

// One accent per team so cards are recognisable at a glance.
export const DEPT_STYLES = {
  Engineering: { chip: "bg-sky-50 text-sky-700 border-sky-200",          dot: "bg-sky-500" },
  Design:      { chip: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  Operations:  { chip: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-500" },
  Marketing:   { chip: "bg-rose-50 text-rose-700 border-rose-200",       dot: "bg-rose-500" },
  Support:     { chip: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  Finance:     { chip: "bg-cyan-50 text-cyan-700 border-cyan-200",       dot: "bg-cyan-500" },
  Other:       { chip: "bg-zinc-50 text-zinc-600 border-zinc-200",       dot: "bg-zinc-400" },
};

const deptStyle = (d) => DEPT_STYLES[d] || DEPT_STYLES.Other;

const daysAgo = (d) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff <= 0) return "Posted today";
  if (diff === 1) return "Posted yesterday";
  if (diff < 30) return `Posted ${diff} days ago`;
  return `Posted ${new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
};

export default function JobsExplorer({ jobs }) {
  const departments = useMemo(
    () => ["All", ...new Set(jobs.map((j) => j.department))],
    [jobs]
  );
  const [active, setActive] = useState("All");

  const visible = active === "All" ? jobs : jobs.filter((j) => j.department === active);

  if (!jobs.length) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-[#fafafa] px-8 py-16 text-center">
        <Briefcase size={28} className="mx-auto mb-4 text-zinc-300" />
        <p className="text-[16px] font-bold text-zinc-900">No open roles right now</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
          We're always happy to hear from great people. Send your resume to{" "}
          <a href="mailto:careers@elitecrew.in" className="font-semibold text-zinc-900 underline underline-offset-2">
            careers@elitecrew.in
          </a>{" "}
          and we'll reach out when something opens up.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Department filter */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {departments.map((d) => {
          const count = d === "All" ? jobs.length : jobs.filter((j) => j.department === d).length;
          const isActive = active === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setActive(d)}
              className={`inline-flex h-9 items-center gap-2 rounded-full border px-4 text-xs font-bold transition-all ${
                isActive
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {d !== "All" && <span className={`h-1.5 w-1.5 rounded-full ${deptStyle(d).dot}`} />}
              {d}
              <span className={isActive ? "text-zinc-400" : "text-zinc-400"}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Job cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((job) => {
          const st = deptStyle(job.department);
          return (
            <Link
              key={job._id}
              href={`/careers/${job._id}`}
              className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-900 md:p-7"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${st.chip}`}>
                  {job.department}
                </span>
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition-all group-hover:border-zinc-900 group-hover:bg-zinc-950 group-hover:text-white">
                  <ArrowUpRight size={15} />
                </span>
              </div>

              <h3 className="text-[19px] font-extrabold tracking-tight text-zinc-900">
                {job.title}
              </h3>

              <p className="mt-2 line-clamp-2 text-[13.5px] leading-6 text-zinc-500">
                {job.summary}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] font-medium text-zinc-600">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={12.5} className="text-zinc-400" /> {job.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={12.5} className="text-zinc-400" /> {TYPE_LABEL[job.type] || job.type}
                </span>
                {job.experience && (
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase size={12.5} className="text-zinc-400" /> {job.experience}
                  </span>
                )}
                {job.salaryRange && (
                  <span className="inline-flex items-center gap-1.5">
                    <IndianRupee size={12.5} className="text-zinc-400" /> {job.salaryRange}
                  </span>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
                <span className="text-[11.5px] font-medium text-zinc-400">{daysAgo(job.createdAt)}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900 transition-colors group-hover:text-[#8a6d33]">
                  Apply Now
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
