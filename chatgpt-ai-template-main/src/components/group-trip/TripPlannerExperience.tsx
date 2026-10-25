'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import CollaborativeTripPlanner from './CollaborativeTripPlanner';
import GroupTripPlanner from './GroupTripPlanner';
export default function TripPlannerExperience() { const [local, setLocal] = useState(false); return <><div className="fixed bottom-4 right-4 z-50"><Button variant="outline" className="bg-white" onClick={() => setLocal(!local)}>{local ? 'Use shared room' : 'Use local demo'}</Button></div>{local ? <GroupTripPlanner /> : <CollaborativeTripPlanner />}</>; }
