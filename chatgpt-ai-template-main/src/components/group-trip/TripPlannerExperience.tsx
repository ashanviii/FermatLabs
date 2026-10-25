'use client';
import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CollaborativeTripPlanner from './CollaborativeTripPlanner';
import GroupTripPlanner from './GroupTripPlanner';

// The shared planner is the product. The offline demo (everything in this browser, no sign-in) is a quiet secondary switch.
export default function TripPlannerExperience() {
  const [local, setLocal] = useState(false);
  const exit = () => {
    setLocal(false);
    window.scrollTo({ top: 0 });
  };
  const enter = () => {
    setLocal(true);
    window.scrollTo({ top: 0 });
  };
  return (
    <div className="min-h-screen bg-canvas">
      {local ? <GroupTripPlanner onExit={exit} /> : <CollaborativeTripPlanner />}
      {!local && (
        <div className="flex flex-col items-center gap-1 bg-canvas px-4 pb-8 font-sans">
          <Button variant="ghost" size="sm" icon={FlaskConical} onClick={enter}>
            Try the offline demo
          </Button>
          <p className="type-caption m-0 text-ink-muted">Runs only in this browser. Nothing is shared.</p>
        </div>
      )}
    </div>
  );
}
