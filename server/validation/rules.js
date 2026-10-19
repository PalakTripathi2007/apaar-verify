// Rule 1: ID missing hai ya format galat hai
function checkApaarFormat(student) {
  const id = student.apaarId;

  if (!id) {
    return {
      flagType: "MISSING_APAAR_ID",
      reason: "APAAR ID is missing",
      severity: "high",
    };
  }

  if (!/^\d{12}$/.test(id)) {
    return {
      flagType: "INVALID_APAAR_ID",
      reason: `APAAR ID "${id}" must be exactly 12 digits`,
      severity: "high",
    };
  }

  return null;
}

// Rule 2: duplicate aur cross-institution enrolment
function findDuplicates(students) {
  const groups = {};

  students.forEach((s) => {
    if (!s.apaarId) return;
    if (!groups[s.apaarId]) groups[s.apaarId] = [];
    groups[s.apaarId].push(s);
  });

  const results = [];

  for (const id in groups) {
    const group = groups[id];
    if (group.length < 2) continue;

    // is group mein kaun-kaun se colleges hain (repeat hataake)
    const colleges = [...new Set(group.map((s) => s.institutionCode))];

    group.forEach((s) => {
      if (colleges.length > 1) {
        results.push({
          student: s,
          flagType: "CROSS_INSTITUTION_ENROLMENT",
          reason: `APAAR ID ${id} is enrolled in ${colleges.length} institutions: ${colleges.join(", ")}`,
          severity: "high",
        });
      } else {
        results.push({
          student: s,
          flagType: "DUPLICATE_APAAR_ID",
          reason: `APAAR ID ${id} appears ${group.length} times in ${colleges[0]}`,
          severity: "medium",
        });
      }
    });
  }

  return results;
}

// Rule 3: admissions approved intake se zyada hain
function checkIntake(students, programs) {
  const counts = {};

  students.forEach((s) => {
    if (s.isSupernumerary) return; // extra seats ginti mein nahi
    const key = `${s.institutionCode}|${s.program}|${s.academicYear}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  const results = [];

  for (const key in counts) {
    const [institutionCode, program, academicYear] = key.split("|");

    const approved = programs.find(
      (p) =>
        p.institutionCode === institutionCode &&
        p.program === program &&
        p.academicYear === academicYear
    );

    if (!approved) {
      results.push({
        institutionCode,
        flagType: "MISSING_APPROVED_INTAKE",
        reason: `No approved intake found for ${institutionCode} ${program} ${academicYear}`,
        severity: "low",
      });
      continue;
    }

    if (counts[key] > approved.approvedIntake) {
      results.push({
        institutionCode,
        flagType: "EXCEEDS_APPROVED_INTAKE",
        reason: `${institutionCode} ${program} ${academicYear}: ${counts[key]} admitted, approved intake is ${approved.approvedIntake} (excess ${counts[key] - approved.approvedIntake})`,
        severity: "high",
      });
    }
  }

  return results;
}

module.exports = { checkApaarFormat, findDuplicates, checkIntake };