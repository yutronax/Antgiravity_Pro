"use client";

interface Internship {
  title: string;
  company: string;
  location: string;
  link: string;
  platform: string;
}

interface InternshipListProps {
  items: Internship[];
  isLoading: boolean;
}

export default function InternshipList({ items, isLoading }: InternshipListProps) {
  if (isLoading) {
    return (
      <div className="container-custom py-20 flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-white/40 animate-pulse">En iyi fırsatlar taranıyor...</p>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="container-custom py-20">
      <div className="flex items-center gap-4 mb-12">
        <h2 className="text-3xl font-bold">Bulunan Fırsatlar</h2>
        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
          {items.length} İlan
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((job, i) => (
          <div 
            key={i} 
            className="glass-card p-6 flex flex-col justify-between hover-lift group"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] uppercase tracking-widest text-primary font-bold px-2 py-1 rounded bg-primary/5 border border-primary/10">
                  {job.platform}
                </span>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 group-hover:text-primary"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {job.title}
              </h3>
              <p className="text-white/60 mb-4 font-medium">{job.company}</p>
              <div className="flex items-center gap-2 text-xs text-white/30 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                {job.location}
              </div>
            </div>
            
            <a 
              href={job.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl glass border-white/5 text-center text-sm font-bold hover:bg-white/5 transition-all"
            >
              İlana Git
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
