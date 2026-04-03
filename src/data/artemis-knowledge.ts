export interface QuickAnswer {
  question: string;
  answer: string;
}

export const QUICK_ANSWERS: QuickAnswer[] = [
  {
    question: 'Who are the crew?',
    answer: 'The Artemis II crew consists of four astronauts: Reid Wiseman (Commander, NASA), Victor Glover (Pilot, NASA), Christina Koch (Mission Specialist, NASA), and Jeremy Hansen (Mission Specialist, CSA). This is the first crewed deep space mission since Apollo 17 in 1972.',
  },
  {
    question: 'How long is the mission?',
    answer: 'The Artemis II mission lasts approximately 10 days. It launched on April 1, 2026, and is expected to splashdown in the Pacific Ocean around April 10-11, 2026.',
  },
  {
    question: 'What is Orion?',
    answer: 'Orion is NASA\'s next-generation crew vehicle, built by Lockheed Martin. It can support 4 astronauts for up to 21 days and features the largest heat shield ever built at 5 meters in diameter. It\'s designed for deep space missions beyond low Earth orbit.',
  },
  {
    question: "What's the trajectory?",
    answer: 'Artemis II follows a free-return trajectory: launch from Kennedy Space Center, enter Earth orbit, perform Translunar Injection (TLI), coast to the Moon over ~4 days, fly approximately 8,900 km above the lunar far side, then return to Earth on a free-return path for Pacific Ocean splashdown.',
  },
  {
    question: 'When did it launch?',
    answer: 'Artemis II launched on April 1, 2026, at 6:35 PM EDT (22:35 UTC) from Launch Complex 39B at Kennedy Space Center, Florida, atop the Space Launch System (SLS) rocket.',
  },
  {
    question: 'What records will it break?',
    answer: 'Artemis II is expected to surpass Apollo 13\'s record of 400,171 km (248,655 miles) for the farthest distance humans have traveled from Earth. It will also be the first crewed mission beyond low Earth orbit in over 50 years.',
  },
  {
    question: 'What is SLS?',
    answer: 'The Space Launch System (SLS) is NASA\'s most powerful rocket ever flown. It stands 98 meters (322 feet) tall and produces 39.1 meganewtons (8.8 million pounds) of thrust at liftoff. It\'s designed specifically for deep space missions.',
  },
  {
    question: 'What is TLI?',
    answer: 'Translunar Injection (TLI) is the critical engine burn that sends the spacecraft from Earth orbit onto a trajectory toward the Moon. For Artemis II, TLI occurs approximately 2 hours after launch using the Interim Cryogenic Propulsion Stage (ICPS).',
  },
  {
    question: 'When does it return?',
    answer: 'Artemis II is expected to return approximately 10 days after launch, around April 10-11, 2026. The Orion capsule will re-enter Earth\'s atmosphere at approximately 40,000 km/h and splashdown in the Pacific Ocean.',
  },
  {
    question: 'What is the Artemis program?',
    answer: 'The Artemis program is NASA\'s plan to return humans to the Moon and establish a sustainable lunar presence. Artemis I (2022) was an uncrewed test. Artemis II (2026) is the first crewed flyby. Artemis III (planned ~2027-2028) will land astronauts on the lunar south pole for the first time since Apollo 17 in 1972.',
  },
  {
    question: 'What is the DSN?',
    answer: 'The Deep Space Network (DSN) is NASA\'s international array of giant radio antennas supporting interplanetary spacecraft missions. It has three facilities spaced roughly 120 degrees apart: Goldstone (California), Canberra (Australia), and Madrid (Spain), ensuring continuous communication with Orion.',
  },
  {
    question: 'What does ESA contribute?',
    answer: 'The European Space Agency (ESA) built the European Service Module (ESM) for Orion, manufactured by Airbus. The ESM provides propulsion, power (4 solar arrays), thermal control, water, and air for the crew. Over 200 ESA specialists monitor the ESM from the "Eagle Room" at ESTEC in the Netherlands.',
  },
];

export function findQuickAnswer(question: string): string | null {
  const normalized = question.toLowerCase().trim().replace(/[?!.,]/g, '');
  for (const qa of QUICK_ANSWERS) {
    const qNorm = qa.question.toLowerCase().replace(/[?!.,]/g, '');
    if (normalized.includes(qNorm) || qNorm.includes(normalized)) {
      return qa.answer;
    }
  }
  return null;
}
