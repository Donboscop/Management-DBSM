export interface StudentForBalancing {
  id: string;
  name: string;
  gender: string;
  language?: string | null;
  dayScholar?: boolean;
  [key: string]: any;
}

export interface GroupForBalancing {
  id: string;
  name: string;
  capacity: number;
  genderRule?: string; // "Male" | "Female" | "ANY"
  assigned?: StudentForBalancing[];
}

export interface BalancingOptions {
  genderFilter?: 'Male' | 'Female' | 'ANY';
  hostellersOnly?: boolean;
}

/**
 * Reusable Language Balancing Algorithm
 * SOFT constraint: Distributes minority languages across available groups first,
 * then fills remainder with majority languages up to capacity.
 * Never fails allocation if exact balance is mathematically impossible.
 */
export function balanceByLanguage<
  S extends StudentForBalancing,
  G extends GroupForBalancing
>(students: S[], groups: G[], options: BalancingOptions = {}): Map<string, S[]> {
  const allocation = new Map<string, S[]>();
  groups.forEach((g) => allocation.set(g.id, []));

  if (students.length === 0 || groups.length === 0) {
    return allocation;
  }

  // 1. Filter eligible candidates (Hard constraints: gender, residency)
  let eligible = students.filter((s) => {
    if (options.hostellersOnly && s.dayScholar) return false;
    return true;
  });

  // Filter groups compatible with candidate pool if gender specified
  const activeGroups = groups.filter((g) => {
    if (!options.genderFilter || options.genderFilter === 'ANY') return true;
    if (g.genderRule && g.genderRule !== 'ANY' && g.genderRule !== options.genderFilter) {
      return false;
    }
    return true;
  });

  if (activeGroups.length === 0) return allocation;

  // 2. Group candidates by normalized language
  const languageBuckets = new Map<string, S[]>();
  for (const s of eligible) {
    const lang = (s.language || 'Not Specified').trim();
    if (!languageBuckets.has(lang)) {
      languageBuckets.set(lang, []);
    }
    languageBuckets.get(lang)!.push(s);
  }

  // Sort languages ascending by count (rarest/minority first)
  const sortedLanguages = Array.from(languageBuckets.entries()).sort(
    (a, b) => a[1].length - b[1].length
  );

  // 3. Distribute minority languages across different groups in round-robin fashion
  let currentGroupIdx = 0;
  for (const [, studentsInLang] of sortedLanguages) {
    for (const student of studentsInLang) {
      // Find the next available group that has capacity
      let placed = false;
      for (let attempt = 0; attempt < activeGroups.length; attempt++) {
        const group = activeGroups[(currentGroupIdx + attempt) % activeGroups.length];
        const currentMembers = allocation.get(group.id) || [];
        if (currentMembers.length < group.capacity) {
          currentMembers.push(student);
          allocation.set(group.id, currentMembers);
          currentGroupIdx = (currentGroupIdx + attempt + 1) % activeGroups.length;
          placed = true;
          break;
        }
      }

      // If all active groups are full, place in any group with space or stop
      if (!placed) {
        for (const group of activeGroups) {
          const currentMembers = allocation.get(group.id) || [];
          if (currentMembers.length < group.capacity) {
            currentMembers.push(student);
            allocation.set(group.id, currentMembers);
            break;
          }
        }
      }
    }
  }

  return allocation;
}
