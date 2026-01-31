import { useParams } from "wouter";

export default function ProjectOverview() {
  const params = useParams<{ id: string }>();
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-semibold">P</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground" data-testid="text-project-title">
                Project {params.id}
              </h1>
              <p className="text-sm text-muted-foreground">Overview</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid gap-6">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4" data-testid="text-section-title">
              Welcome to your project
            </h2>
            <p className="text-muted-foreground">
              This is the project overview page. You can start building your application from here.
            </p>
          </section>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-md border border-border bg-card" data-testid="card-stat-1">
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <p className="text-2xl font-semibold text-foreground">Active</p>
            </div>
            <div className="p-6 rounded-md border border-border bg-card" data-testid="card-stat-2">
              <p className="text-sm text-muted-foreground mb-1">Tasks</p>
              <p className="text-2xl font-semibold text-foreground">0</p>
            </div>
            <div className="p-6 rounded-md border border-border bg-card" data-testid="card-stat-3">
              <p className="text-sm text-muted-foreground mb-1">Progress</p>
              <p className="text-2xl font-semibold text-foreground">0%</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
