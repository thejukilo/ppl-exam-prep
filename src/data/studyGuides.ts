import { StudyGuide } from '../types';

/**
 * Study guide stubs for each PPL topic.
 *
 * These are skeleton outlines. Replace `body` text with real content as
 * you write it. The first section of each guide is marked as a free
 * preview; the rest are premium.
 *
 * For the MVP these are bundled in the app. Once content stabilises you
 * can move them to a Supabase `study_guides` table — the screen reads
 * via studyGuidesService so swapping the source is one file.
 */

export const STUDY_GUIDES: StudyGuide[] = [
  {
    id: 'sg_air_law',
    topicId: 'air_law',
    title: 'Air Law — Study Guide',
    intro:
      'Air law governs how aircraft operate in shared airspace. As a PPL student you need to know who makes the rules (ICAO, EASA, your national authority), what privileges your licence gives you, and the rules of the air that apply to every flight.',
    isFreePreview: true,
    sections: [
      {
        heading: 'International Framework: ICAO and the Annexes',
        body:
          'The Convention on International Civil Aviation (Chicago, 1944) created ICAO and produced the Annexes (1–19) that standardise civil aviation worldwide. Annex 2 (Rules of the Air) is the one you will be tested on most directly.\n\nKey concepts: SARPs (Standards and Recommended Practices), state sovereignty over airspace, and the difference between a Standard (mandatory) and a Recommended Practice (encouraged).',
      },
      {
        heading: 'EASA Structure and Part-FCL',
        body:
          'TODO — write up: EASA Basic Regulation, the role of NAAs, Part-FCL licence categories, PPL(A) privileges and limitations, ratings (SEP, MEP, night, IR), revalidation requirements.',
      },
      {
        heading: 'Rules of the Air',
        body:
          'TODO — write up: VFR vs IFR, right-of-way rules, minimum heights, cruising levels (semicircular rule), formation flying, dropping or spraying, towing.',
      },
      {
        heading: 'Airspace Classification',
        body:
          'TODO — write up: Classes A–G, services provided in each, VFR minima per class, transponder requirements, controlled vs uncontrolled airspace.',
      },
      {
        heading: 'Documents and Markings',
        body:
          'TODO — write up: documents required on board for VFR and international flight (CofR, CofA, ARC, insurance, radio licence, journey log, crew licences), aircraft markings, runway and taxiway markings.',
      },
    ],
  },
  {
    id: 'sg_meteorology',
    topicId: 'meteorology',
    title: 'Meteorology — Study Guide',
    intro:
      'Weather is the single biggest variable in VFR flying. This guide covers what makes weather, how to read forecasts, and how to recognise conditions that are unsafe or about to become unsafe.',
    isFreePreview: true,
    sections: [
      {
        heading: 'The Atmosphere',
        body:
          'The ISA (International Standard Atmosphere) is your reference: 1013.25 hPa, 15 °C at MSL, lapse rate of 1.98 °C/1000 ft up to 36,090 ft. Real atmosphere deviates — temperature, pressure and density altitude all affect performance.',
      },
      {
        heading: 'Pressure, Wind and Coriolis',
        body: 'TODO — pressure gradient force, Coriolis, geostrophic wind, surface friction, Buys Ballot’s law, sea/land breezes, mountain/valley winds.',
      },
      {
        heading: 'Clouds, Stability and Precipitation',
        body: 'TODO — adiabatic lapse rates (DALR, SALR), stability vs instability, cloud types and the conditions that produce them, types of precipitation, freezing levels.',
      },
      {
        heading: 'Fronts and Air Masses',
        body: 'TODO — air mass classification, warm/cold/occluded fronts, weather sequences as a front passes, troughs and ridges.',
      },
      {
        heading: 'Hazards: Icing, Thunderstorms, Fog, Wind Shear',
        body: 'TODO — types of icing, conditions for thunderstorm formation and life cycle, fog types (radiation, advection, frontal), low-level wind shear and microbursts.',
      },
      {
        heading: 'METAR and TAF Decoding',
        body: 'TODO — full METAR/TAF format, common abbreviations, trend forecasts, SIGMET/AIRMET, GAFOR.',
      },
    ],
  },
  {
    id: 'sg_navigation',
    topicId: 'navigation',
    title: 'Navigation — Study Guide',
    intro:
      'VFR navigation combines map reading, dead reckoning, and basic radio aids. The exam expects you to be fluent in time/distance/speed problems and to understand the difference between true, magnetic and compass headings.',
    isFreePreview: true,
    sections: [
      {
        heading: 'Earth, Charts and Projections',
        body:
          'Latitude, longitude, great circles vs rhumb lines. The two charts you will use most as a PPL: Lambert conformal (used for ICAO 1:500,000) and Mercator. Know the chart symbols cold.',
      },
      {
        heading: 'Magnetism and the Compass',
        body: 'TODO — variation, deviation, the conversion order (TVMDC), turning errors, acceleration errors, dip.',
      },
      {
        heading: 'Dead Reckoning',
        body: 'TODO — triangle of velocities, wind correction angle, heading vs track, ground speed, ETA calculation, the 1-in-60 rule.',
      },
      {
        heading: 'Time, Speed and Distance Problems',
        body: 'TODO — UTC, mental maths shortcuts, fuel consumption, point of no return, critical point.',
      },
      {
        heading: 'Radio Navigation Aids',
        body: 'TODO — VOR (how it works, intercepting and tracking), NDB and ADF (basic use, errors), DME, GNSS overview.',
      },
    ],
  },
  {
    id: 'sg_aircraft_general_knowledge',
    topicId: 'aircraft_general_knowledge',
    title: 'Aircraft General Knowledge — Study Guide',
    intro:
      'AGK covers everything mechanical and electrical about your aircraft. The depth required at PPL level is conceptual — you need to know how systems work and what happens when they fail.',
    isFreePreview: true,
    sections: [
      {
        heading: 'Airframe and Flight Controls',
        body:
          'Primary controls (ailerons, elevator, rudder), secondary controls (flaps, trim, slats), construction materials, loads (tension, compression, shear, torsion, bending), V-n diagram basics.',
      },
      {
        heading: 'Powerplant',
        body: 'TODO — four-stroke cycle, mixture, carburettor icing, fuel injection, ignition system (magnetos), cooling, oil system, propeller types and pitch.',
      },
      {
        heading: 'Electrical and Instruments',
        body: 'TODO — pitot-static system, gyroscopic instruments, magnetic compass, electrical system (alternator, battery, bus, circuit breakers).',
      },
      {
        heading: 'Airworthiness',
        body: 'TODO — CofA, ARC, maintenance documents, MEL/CDL, owner-pilot maintenance.',
      },
    ],
  },
  {
    id: 'sg_principles_of_flight',
    topicId: 'principles_of_flight',
    title: 'Principles of Flight — Study Guide',
    intro:
      'How and why an aeroplane flies. POF is more conceptual than calculation-heavy at PPL level, but you need a clear mental model of the four forces and how they interact.',
    isFreePreview: true,
    sections: [
      {
        heading: 'The Four Forces',
        body:
          'Lift, weight, thrust, drag. Lift formula L = ½ρV²SCL — you do not need to compute it but you must understand each variable. In steady straight-and-level flight, lift = weight and thrust = drag.',
      },
      {
        heading: 'Lift, Drag and the Polar Curve',
        body: 'TODO — angle of attack, CL/CD curves, induced vs parasitic drag, total drag curve, L/Dmax.',
      },
      {
        heading: 'Stability and Control',
        body: 'TODO — static and dynamic stability, the three axes, longitudinal/lateral/directional stability, dihedral, sweepback.',
      },
      {
        heading: 'Stalls and Spins',
        body: 'TODO — critical angle of attack, factors affecting stall speed, recovery, incipient vs developed spins, recovery actions.',
      },
      {
        heading: 'High-Lift Devices',
        body: 'TODO — flaps (plain, split, slotted, Fowler), slats, effect on CL/CD, when to use them.',
      },
    ],
  },
  {
    id: 'sg_flight_performance_planning',
    topicId: 'flight_performance_planning',
    title: 'Flight Performance and Planning — Study Guide',
    intro:
      'Mass and balance, performance charts, and the paperwork you must complete before every flight. This subject is heavy on practical calculation.',
    isFreePreview: true,
    sections: [
      {
        heading: 'Mass and Balance',
        body:
          'Datum, arm, moment, CG calculation. You must be able to compute whether the aircraft is within mass limits and CG envelope, and what to do if it is not (move/remove load).',
      },
      {
        heading: 'Take-off and Landing Performance',
        body: 'TODO — factors affecting TODR/LDR (mass, altitude, temperature, wind, slope, surface), correction factors, performance charts.',
      },
      {
        heading: 'Cruise Performance and Fuel Planning',
        body: 'TODO — power settings, specific range, endurance, fuel reserves (final reserve, contingency, alternate).',
      },
      {
        heading: 'Flight Plan Preparation',
        body: 'TODO — nav log, ICAO flight plan form, VFR vs IFR, alternate selection.',
      },
    ],
  },
  {
    id: 'sg_communication',
    topicId: 'communication',
    title: 'Communication — Study Guide',
    intro:
      'R/T procedures and phraseology. The PPL exam expects standard ICAO phraseology — not casual English.',
    isFreePreview: true,
    sections: [
      {
        heading: 'The Phonetic Alphabet and Numbers',
        body:
          'Alpha, Bravo, Charlie… Numbers transmitted digit by digit (one-zero-zero, not "one hundred"), except for whole hundreds and thousands. Decimal is "decimal".',
      },
      {
        heading: 'Standard Phraseology',
        body: 'TODO — call signs, readback requirements, frequency change, position reports, request/instruction/acknowledgement structure.',
      },
      {
        heading: 'Distress and Urgency',
        body: 'TODO — MAYDAY vs PAN PAN, transponder codes (7500/7600/7700), procedures for radio failure.',
      },
      {
        heading: 'VHF Propagation',
        body: 'TODO — line of sight, range vs altitude, frequency bands.',
      },
    ],
  },
  {
    id: 'sg_operational_procedures',
    topicId: 'operational_procedures',
    title: 'Operational Procedures — Study Guide',
    intro:
      'Procedures and hazards that aren’t covered by Air Law or POF — the practical edge cases of flying.',
    isFreePreview: true,
    sections: [
      {
        heading: 'Wake Turbulence',
        body:
          'Generated by wingtip vortices behind any aircraft producing lift. Strongest behind heavy, clean, slow aircraft. Avoid by staying above and upwind of the generating aircraft’s flight path; on landing touch down beyond their touchdown point.',
      },
      {
        heading: 'Wind Shear and Microbursts',
        body: 'TODO — recognition, recovery technique (full power, pitch for climb).',
      },
      {
        heading: 'Contaminated Runways',
        body: 'TODO — water, slush, snow, ice; effects on take-off and landing performance; aquaplaning.',
      },
      {
        heading: 'Emergency Procedures',
        body: 'TODO — engine failure (after take-off, in cruise), forced landing, fire, ELT operation, search and rescue signals.',
      },
    ],
  },
  {
    id: 'sg_human_performance',
    topicId: 'human_performance',
    title: 'Human Performance — Study Guide',
    intro:
      'How the human body and mind cope (or fail to cope) with the flight environment. Memorise the symptoms of hypoxia and the IMSAFE checklist.',
    isFreePreview: true,
    sections: [
      {
        heading: 'The Atmosphere and Hypoxia',
        body:
          'Atmospheric pressure halves roughly every 18,000 ft. Hypoxia onset accelerates above 10,000 ft cabin altitude. Symptoms: euphoria, impaired judgement, cyanosis, tunnel vision, unconsciousness. Time of useful consciousness shrinks rapidly with altitude.',
      },
      {
        heading: 'Vision and Hearing',
        body: 'TODO — rods/cones, night vision, scanning techniques, noise damage and its prevention.',
      },
      {
        heading: 'Spatial Disorientation and Vestibular Illusions',
        body: 'TODO — the leans, somatogravic illusion, graveyard spiral, "I am lost" responses.',
      },
      {
        heading: 'Health and Fitness for Flight',
        body: 'TODO — IMSAFE, alcohol and drugs (8-hour rule, but really 24), fatigue, stress, scuba diving and flight.',
      },
      {
        heading: 'Decision Making and CRM',
        body: 'TODO — DECIDE/PAVE models, threat and error management, the dirty dozen, single-pilot resource management.',
      },
    ],
  },
];

export function getStudyGuideForTopic(topicId: string): StudyGuide | undefined {
  return STUDY_GUIDES.find((g) => g.topicId === topicId);
}
