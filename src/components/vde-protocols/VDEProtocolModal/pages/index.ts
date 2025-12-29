import React from 'react';
import Page1_Anlagenuebersicht from './Page1_Anlagenuebersicht';
import Page2_Besichtigung1 from './Page2_Besichtigung1';
import Page3_Besichtigung2 from './Page3_Besichtigung2';
import Page4_ACSeitePruefbericht from './Page4_ACSeitePruefbericht';
import Page5_PVGeneratorPruefbericht from './Page5_PVGeneratorPruefbericht';
import { PageProps } from '../types';

export {
  Page1_Anlagenuebersicht,
  Page2_Besichtigung1,
  Page3_Besichtigung2,
  Page4_ACSeitePruefbericht,
  Page5_PVGeneratorPruefbericht,
};

// Page components array for navigation
export const pageComponents: React.ComponentType<PageProps>[] = [
  Page1_Anlagenuebersicht,
  Page2_Besichtigung1,
  Page3_Besichtigung2,
  Page4_ACSeitePruefbericht,
  Page5_PVGeneratorPruefbericht,
];
