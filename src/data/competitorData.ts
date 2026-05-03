import { Competitor } from '../types';

export const competitors: Competitor[] = [
  {
    name: 'Cardiva',
    focus: 'Cardiovascular, obesity, diabetes',
    initiatives: [
      'Private hospital partnerships',
      'AI-driven clinical design',
      'Remote cardiac monitoring platforms',
    ],
    threatType: 'Most direct strategic threat',
    overlapWithPharmora: 'Cardiovascular, obesity, diabetes + AI-driven clinical design',
  },
  {
    name: 'Firenza',
    focus: 'Cardiovascular, obesity, diabetes',
    initiatives: [
      'Affordable oral obesity formulations',
      'Digital engagement platforms',
      'Primary care and retail health outreach',
    ],
    threatType: 'Strong commercial threat',
    overlapWithPharmora: 'Cardiovascular, obesity, diabetes + oral formulations competing with PH-EN-202',
  },
  {
    name: 'BioNova',
    focus: 'Cardiovascular, obesity, diabetes',
    initiatives: [
      'Licensing overseas biotech candidates',
      'Partnering with smaller biotech firms',
      'Shared R&D costs and faster market access',
    ],
    threatType: 'Pipeline acceleration threat',
    overlapWithPharmora: 'Cardiovascular, obesity, diabetes + faster pipeline through partnerships',
  },
  {
    name: 'Ash & Co',
    focus: 'Oncology, metabolic disorders',
    initiatives: [
      'U.S.-based biologics and metabolic manufacturing hub',
      'Generative AI in drug discovery',
      'Lab-to-launch automation systems',
    ],
    threatType: 'Technology and R&D benchmark threat',
    overlapWithPharmora: 'Metabolic disorders + AI/automation capabilities',
  },
];
