"""OS-adjacent: skill-based matching score.

Produces a 0-100 score per opportunity, weighted by:
  60%  skill overlap (student skills ∩ required skills)
  25%  CGPA margin above the minimum
  15%  backlog penalty (0 backlogs = full marks, more = less)

Makes the project's "Intelligent Matching" claim real — eligibility
stays a hard gate, but this score ranks candidates within the eligible pool.
"""


def _student_skills(student) -> set:
    return {ss.skill.name.lower() for ss in student.skills}


def _required_skills(opp) -> set:
    return {s.strip().lower()
            for s in (opp.required_skills or "").split(",")
            if s.strip()}


def match_score(student, opp) -> int:
    score = 0.0

    # --- skills (60 points) ---
    have = _student_skills(student)
    need = _required_skills(opp)
    if need:
        score += 60 * (len(have & need) / len(need))
    else:
        score += 36  # neutral 60% if no explicit skill list

    # --- CGPA margin (25 points) ---
    margin = (student.cgpa or 0) - (opp.eligibility_cgpa or 0)
    if   margin >= 1.5:  score += 25
    elif margin >= 0.75: score += 18
    elif margin >= 0:    score += 12

    # --- backlogs (15 points) ---
    bl = student.backlog_count or 0
    if   bl == 0: score += 15
    elif bl == 1: score += 9
    elif bl == 2: score += 4

    return max(0, min(100, round(score)))


def match_label(score: int) -> str:
    if score >= 80: return "Excellent"
    if score >= 60: return "Strong"
    if score >= 40: return "Fair"
    return "Weak"