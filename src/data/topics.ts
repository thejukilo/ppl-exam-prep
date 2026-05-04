import { Topic, TopicId } from '../types';

/**
 * The 9 EASA PPL(A) theoretical knowledge subjects.
 * Names match the source data.json topic strings exactly so we can map them.
 */

export const TOPIC_NAME_TO_ID: Record<string, TopicId> = {
  'Air Law': 'air_law',
  'Meteorology': 'meteorology',
  'Navigation': 'navigation',
  'Aircraft General Knowledge': 'aircraft_general_knowledge',
  'Principles of Flight (Aeroplane)': 'principles_of_flight',
  'Flight Performance and Planning': 'flight_performance_planning',
  'Communication': 'communication',
  'Operational Procedures': 'operational_procedures',
  'Human Performance and Limitations': 'human_performance',
};

export const TOPICS: Topic[] = [
  {
    id: 'air_law',
    name: 'Air Law',
    description:
      'Rules of the air, ICAO Annexes, EASA regulations, airspace classifications and pilot privileges.',
    icon: 'gavel',
    color: '#1E40AF',
    questionCount: 0,
    isFree: true,
  },
  {
    id: 'meteorology',
    name: 'Meteorology',
    description:
      'Atmosphere, pressure systems, clouds, fronts, hazardous weather, METAR/TAF interpretation.',
    icon: 'cloud',
    color: '#0891B2',
    questionCount: 0,
    isFree: false,
  },
  {
    id: 'navigation',
    name: 'Navigation',
    description:
      'Charts, magnetism, dead reckoning, time/distance/speed problems, VOR/NDB, GNSS basics.',
    icon: 'compass',
    color: '#059669',
    questionCount: 0,
    isFree: false,
  },
  {
    id: 'aircraft_general_knowledge',
    name: 'Aircraft General Knowledge',
    description:
      'Airframe, systems, powerplant, electrics, instruments and airworthiness requirements.',
    icon: 'cog',
    color: '#7C3AED',
    questionCount: 0,
    isFree: false,
  },
  {
    id: 'principles_of_flight',
    name: 'Principles of Flight',
    description:
      'Aerodynamics, lift, drag, stability, control surfaces, stalls and propeller fundamentals.',
    icon: 'plane',
    color: '#DC2626',
    questionCount: 0,
    isFree: false,
  },
  {
    id: 'flight_performance_planning',
    name: 'Flight Performance and Planning',
    description:
      'Mass and balance, performance charts, fuel planning, flight log preparation.',
    icon: 'calculator',
    color: '#EA580C',
    questionCount: 0,
    isFree: false,
  },
  {
    id: 'communication',
    name: 'Communication',
    description:
      'R/T phraseology, ATC procedures, frequencies, distress and urgency signals.',
    icon: 'radio',
    color: '#0284C7',
    questionCount: 0,
    isFree: false,
  },
  {
    id: 'operational_procedures',
    name: 'Operational Procedures',
    description:
      'Wake turbulence, wind shear, runway incursions, contaminated runways, emergency procedures.',
    icon: 'alert-triangle',
    color: '#CA8A04',
    questionCount: 0,
    isFree: false,
  },
  {
    id: 'human_performance',
    name: 'Human Performance',
    description:
      'Aviation physiology, hypoxia, spatial disorientation, fatigue, decision making and CRM.',
    icon: 'user',
    color: '#9333EA',
    questionCount: 0,
    isFree: false,
  },
];

export function getTopicById(id: TopicId): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}
