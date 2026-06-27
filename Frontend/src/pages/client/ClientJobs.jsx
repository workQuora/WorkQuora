import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Briefcase, PlusCircle, ArrowRight, Loader2, Calendar, 
  Tag, IndianRupee, AlertCircle, CheckCircle, Clock 
} from 'lucide-react';
import api from '../../services/api';

const ClientJobs = () => {
  const navigate = useNavigate();

  const { data: jobsResponse, isLoading, error } = useQuery({
    queryKey: ['client-posted-jobs'],
    queryFn: () => api.get('/jobs/my-jobs').then((r) => r.data ?? r.data?.data),
  });

  const jobs = jobsResponse?.data ?? jobsResponse ?? [];

  return (
    <div className="w-full min-h-screen bg-background p-6 md:p-10 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Jobs Posted</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and track all of your posted project requirements.</p>
          </div>
          <button
            onClick={() => navigate('/client/post-job')}
            className="flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shadow-primary/20 active:scale-95 shrink-0 cursor-pointer"
          >
            <PlusCircle size={16} /> Post a New Job
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading your job postings...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl p-6 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Failed to load jobs</h4>
              <p className="text-xs mt-1">{error.response?.data?.message || error.message || 'An error occurred.'}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && jobs.length === 0 && (
          <div className="bg-card border border-border rounded-3xl p-16 text-center shadow-lg">
            <Briefcase className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">No jobs posted yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
              Create your first project posting to start receiving proposals and hiring top verified freelancers.
            </p>
            <button
              onClick={() => navigate('/client/post-job')}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all cursor-pointer shadow-md shadow-primary/10"
            >
              Post Your First Job
            </button>
          </div>
        )}

        {/* Jobs List */}
        {!isLoading && !error && jobs.length > 0 && (
          <div className="space-y-4">
            {jobs.map((job) => {
              const dateStr = job.createdAt 
                ? new Date(job.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—';

              return (
                <div 
                  key={job._id || job.id} 
                  className="bg-card border border-border hover:border-border-hover rounded-2xl p-6 transition-all duration-200 shadow-sm relative overflow-hidden group"
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                    job.status === 'open' ? 'bg-emerald-500' :
                    job.status === 'in-progress' ? 'bg-amber-500' :
                    'bg-slate-500'
                  }`} />

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2.5">
                      {/* Job Title & Status */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-lg font-extrabold text-foreground group-hover:text-primary transition-colors">
                          {job.title}
                        </h3>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                          job.status === 'open' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : job.status === 'in-progress' 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                              : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {job.status}
                        </span>
                      </div>

                      {/* Job Meta Details */}
                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <IndianRupee className="w-3.5 h-3.5 text-primary" />
                          <span>
                            Budget: ₹{job.budgetRange?.min?.toLocaleString('en-IN') || '0'}
                            {job.budgetRange?.max ? ` – ₹${job.budgetRange.max.toLocaleString('en-IN')}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          <span>{job.category || 'General'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Posted on {dateStr}</span>
                        </div>
                      </div>

                      {/* Description Snippet */}
                      <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-3xl truncate">
                        {job.description}
                      </p>

                      {/* Skills Required Tags */}
                      {job.skillsRequired && job.skillsRequired.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {job.skillsRequired.map((skill, index) => (
                            <span 
                              key={index}
                              className="text-[10px] font-semibold bg-accent/40 text-foreground/80 px-2 py-0.5 rounded border border-border"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* View Details Action */}
                    <button
                      onClick={() => navigate(`/job/${job._id || job.id}`)}
                      className="self-end md:self-center bg-accent hover:bg-accent/80 hover:text-foreground text-muted-foreground border border-border/80 px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer shadow-sm"
                    >
                      <span>View Details</span>
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default ClientJobs;
