import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Clock, Briefcase } from 'lucide-react';

const STATUS_LABEL = { assigned: 'Assigned', traveling: 'On The Way', working: 'In Progress' };
const STATUS_STYLE = {
  assigned: 'bg-muted text-muted-foreground',
  traveling: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  working: 'bg-primary/10 text-primary',
};

const fmtTime = (iso) => {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
};

/**
 * Active-job card for the client home — built from a Task document
 * (populated with its `job` and `freelancer`), not the raw Job list, so it
 * can show a real assigned worker + a live-ish status instead of a bare
 * job/status pair.
 */
// eslint-disable-next-line no-unused-vars -- FallbackIcon is used as a JSX tag below; core no-unused-vars can't see JSX-only usage without eslint-plugin-react (pre-existing project gap, see SectionHeader.jsx)
const JobCard = ({ contract, categoryImageUrl, categoryIcon: FallbackIcon = Briefcase }) => {
  const navigate = useNavigate();
  const job = contract.job || {};
  const workerName = contract.freelancer?.name;
  const startedAt = fmtTime(contract.startedWorkingAt || contract.travelingAt || contract.assignedAt);

  return (
    <div className="bg-card p-6 rounded-3xl border border-border flex flex-col sm:flex-row gap-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="w-full sm:w-44 h-44 rounded-2xl overflow-hidden shrink-0 bg-muted flex items-center justify-center">
        {categoryImageUrl ? (
          <img src={categoryImageUrl} alt={job.category || job.title} className="w-full h-full object-cover" />
        ) : (
          <FallbackIcon className="w-10 h-10 text-primary" />
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex justify-between items-start gap-3 mb-2">
            <h3 className="font-bold text-lg text-foreground leading-snug">{job.title || 'Job'}</h3>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${STATUS_STYLE[contract.status] || 'bg-muted text-muted-foreground'}`}>
              {STATUS_LABEL[contract.status] || contract.status}
            </span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{job.description}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-xs text-muted-foreground">
            {workerName && (
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" /> Worker: {workerName}
              </span>
            )}
            {startedAt && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Started: {startedAt}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => job._id && navigate(`/job/${job._id}`)}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-transform cursor-pointer"
          >
            Get Tracking
          </button>
          <button
            onClick={() => navigate('/shared/messages')}
            className="px-6 py-3 border border-border text-muted-foreground rounded-xl font-bold text-sm hover:bg-muted transition-colors cursor-pointer"
          >
            Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
