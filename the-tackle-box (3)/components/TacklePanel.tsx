import React from 'react';
import { ViewState } from '../types';

interface TacklePanelProps {
  currentView: ViewState;
}

export const TacklePanel: React.FC<TacklePanelProps> = ({ currentView }) => {
  // Global "Clean Deck" Policy enforcement.
  // The Sidebar reserved section is now strictly empty.
  return null;
};