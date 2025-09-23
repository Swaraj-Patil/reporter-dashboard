'use client';

import { useState } from 'react';
import { Sidebar, ReporterDashboard, AdminPanel, ImpactFeed } from './components';
import { ViewType } from './type';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <ReporterDashboard />;
      case 'admin':
        return <AdminPanel />;
      case 'impact':
        return <ImpactFeed standalone />;
      default:
        return <ReporterDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1 flex flex-col">
        {renderCurrentView()}
        <footer className="mt-auto p-4 border-t bg-muted/30">
          <p className="text-sm text-muted-foreground text-center">
            Research Prototype — Reporter Feedback Simulation
          </p>
        </footer>
      </div>
    </div>
  );
}
