import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Landing from './Landing';
import TeamSelection from './TeamSelection';

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const teamParam = searchParams.get('team');

  // If team parameter is provided, go to landing with team pre-selected
  if (teamParam) {
    return <Landing preselectedTeam={teamParam} />;
  }

  // Otherwise show team selection
  return <TeamSelection />;
};

export default Index;
