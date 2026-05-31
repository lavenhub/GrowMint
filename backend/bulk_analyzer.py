"""Bulk class submission ZIP analysis for educators."""
import io
import json
import re
import zipfile
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from typing import Optional

TEXT_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".c", ".cpp", ".h",
    ".cs", ".go", ".rs", ".txt", ".md", ".json", ".html", ".css", ".sql",
}


@dataclass
class StudentSubmission:
    student_id: str
    display_name: str
    files: list[str] = field(default_factory=list)
    combined_text: str = ""
    line_count: int = 0
    char_count: int = 0
    has_readme: bool = False
    file_count: int = 0


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_") or "unknown"


def _display_name(student_id: str) -> str:
    return student_id.replace("_", " ").title()


def _read_zip_entry(data: bytes, name: str) -> str:
    lower = name.lower()
    if lower.endswith(".pdf"):
        try:
            from pypdf import PdfReader
            pdf = PdfReader(io.BytesIO(data))
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
        except Exception:
            return ""
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        try:
            return data.decode("latin-1")
        except Exception:
            return ""


def extract_submissions_from_zip(zip_bytes: bytes) -> list[StudentSubmission]:
    students: dict[str, StudentSubmission] = {}

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        for info in zf.infolist():
            if info.is_dir():
                continue
            path = info.filename.replace("\\", "/")
            parts = [p for p in path.split("/") if p and p != "__MACOSX"]
            if not parts:
                continue

            basename = parts[-1]
            if basename.startswith(".") or basename.startswith("__"):
                continue

            ext = "." + basename.rsplit(".", 1)[-1].lower() if "." in basename else ""
            if ext and ext not in TEXT_EXTENSIONS:
                continue

            if len(parts) >= 2:
                student_key = _slug(parts[0])
            else:
                stem = basename.rsplit(".", 1)[0]
                student_key = _slug(re.split(r"[-_]", stem)[0])

            data = zf.read(info)
            text = _read_zip_entry(data, basename)
            if not text.strip():
                continue

            if student_key not in students:
                students[student_key] = StudentSubmission(
                    student_id=student_key,
                    display_name=_display_name(student_key),
                )

            sub = students[student_key]
            sub.files.append(basename)
            sub.combined_text += f"\n\n# --- {basename} ---\n{text}"
            sub.line_count += text.count("\n") + 1
            sub.char_count += len(text)
            sub.file_count += 1
            if basename.lower().startswith("readme"):
                sub.has_readme = True

    for sub in students.values():
        sub.combined_text = sub.combined_text.strip()[:15000]

    return sorted(students.values(), key=lambda s: s.display_name)


def _normalize_code(text: str) -> str:
    text = re.sub(r"//.*?$|#.*?$", "", text, flags=re.MULTILINE)
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    text = re.sub(r"\s+", " ", text)
    return text.strip().lower()


def compute_similarity_pairs(
    submissions: list[StudentSubmission], threshold: float = 0.55
) -> list[dict]:
    pairs = []
    n = len(submissions)
    for i in range(n):
        a = _normalize_code(submissions[i].combined_text)
        if len(a) < 40:
            continue
        for j in range(i + 1, n):
            b = _normalize_code(submissions[j].combined_text)
            if len(b) < 40:
                continue
            ratio = SequenceMatcher(None, a, b).ratio()
            if ratio >= threshold:
                pairs.append({
                    "studentA": submissions[i].student_id,
                    "studentB": submissions[j].student_id,
                    "similarityPercent": round(ratio * 100, 1),
                    "risk": "high" if ratio >= 0.82 else "medium",
                })
    pairs.sort(key=lambda p: -p["similarityPercent"])
    return pairs


def _heuristic_completeness(sub: StudentSubmission) -> int:
    score = 30
    if sub.file_count >= 1:
        score += 25
    if sub.line_count >= 30:
        score += 20
    elif sub.line_count >= 10:
        score += 10
    if sub.char_count >= 500:
        score += 15
    if sub.has_readme:
        score += 10
    return min(100, score)


def _heuristic_quality(sub: StudentSubmission, assignment_hint: str) -> int:
    text = sub.combined_text.lower()
    score = 40
    if sub.line_count >= 50:
        score += 15
    if "def " in text or "function " in text or "class " in text:
        score += 15
    if "todo" in text or "fixme" in text or "not implemented" in text:
        score -= 20
    if "pass" in text and sub.line_count < 25:
        score -= 15
    hint_words = set(re.findall(r"[a-z0-9]+", assignment_hint.lower()))
    if hint_words:
        overlap = len(hint_words & set(re.findall(r"[a-z0-9]+", text)))
        score += min(20, overlap * 2)
    return max(0, min(100, score))


def _numeric_to_letter(grade: int) -> str:
    if grade >= 93:
        return "A"
    if grade >= 90:
        return "A-"
    if grade >= 87:
        return "B+"
    if grade >= 83:
        return "B"
    if grade >= 80:
        return "B-"
    if grade >= 77:
        return "C+"
    if grade >= 73:
        return "C"
    if grade >= 70:
        return "C-"
    if grade >= 67:
        return "D+"
    if grade >= 63:
        return "D"
    if grade >= 60:
        return "D-"
    return "F"


def build_local_analysis(
    submissions: list[StudentSubmission],
    similarity_pairs: list[dict],
    assignment_title: str,
    assignment_description: str,
    evaluation_criteria: str,
) -> dict:
    hint = f"{assignment_title} {assignment_description} {evaluation_criteria}"
    sim_by_student: dict[str, list[dict]] = {}
    for p in similarity_pairs:
        sim_by_student.setdefault(p["studentA"], []).append({
            "withStudent": p["studentB"],
            "similarityPercent": p["similarityPercent"],
            "risk": p["risk"],
        })
        sim_by_student.setdefault(p["studentB"], []).append({
            "withStudent": p["studentA"],
            "similarityPercent": p["similarityPercent"],
            "risk": p["risk"],
        })

    students_out = []
    counts = {"up_to_mark": 0, "incomplete": 0, "needs_review": 0, "suspicious": 0}
    grade_sum = 0

    for sub in submissions:
        completeness = _heuristic_completeness(sub)
        quality = _heuristic_quality(sub, hint)
        flags = sim_by_student.get(sub.student_id, [])
        max_sim = max((f["similarityPercent"] for f in flags), default=0)

        integrity_penalty = 25 if max_sim >= 82 else (12 if max_sim >= 65 else 0)
        probable_numeric = int(completeness * 0.35 + quality * 0.45 - integrity_penalty * 0.2)
        probable_numeric = max(0, min(100, probable_numeric))

        if max_sim >= 82:
            status = "suspicious"
            counts["suspicious"] += 1
        elif completeness < 55:
            status = "incomplete"
            counts["incomplete"] += 1
        elif probable_numeric >= 75 and not flags:
            status = "up_to_mark"
            counts["up_to_mark"] += 1
        else:
            status = "needs_review"
            counts["needs_review"] += 1

        grade_sum += probable_numeric
        students_out.append({
            "studentId": sub.student_id,
            "displayName": sub.display_name,
            "files": sub.files,
            "fileCount": sub.file_count,
            "lineCount": sub.line_count,
            "completenessScore": completeness,
            "qualityScore": quality,
            "integrityScore": max(0, 100 - max_sim),
            "probableGradeNumeric": probable_numeric,
            "probableGrade": _numeric_to_letter(probable_numeric),
            "status": status,
            "similarityFlags": flags,
            "trapCompliance": "unknown",
            "aiRiskLevel": "high" if max_sim >= 82 else ("medium" if max_sim >= 65 else "low"),
            "strengths": [
                s for s in [
                    "Adequate file submission" if sub.file_count else None,
                    "Substantive code length" if sub.line_count >= 40 else None,
                ] if s
            ],
            "weaknesses": [
                w for w in [
                    "Very short submission" if sub.line_count < 15 else None,
                    "Possible copy similarity detected" if max_sim >= 65 else None,
                    "Missing README/documentation" if not sub.has_readme and sub.file_count > 1 else None,
                ] if w
            ],
            "educatorNote": (
                "Flag for academic integrity review — high similarity with another submission."
                if max_sim >= 82
                else "Submission appears incomplete — request resubmission."
                if completeness < 55
                else "Meets baseline expectations from automated heuristics."
            ),
        })

    total = len(students_out) or 1
    return {
        "source": "local-heuristics",
        "assignmentTitle": assignment_title,
        "classSummary": {
            "totalSubmissions": len(students_out),
            "upToMark": counts["up_to_mark"],
            "incomplete": counts["incomplete"],
            "needsReview": counts["needs_review"],
            "suspicious": counts["suspicious"],
            "averageProbableGrade": round(grade_sum / total, 1),
            "integrityAlertCount": len(similarity_pairs),
            "executiveSummary": (
                f"Analyzed {len(students_out)} student submission(s) for '{assignment_title}'. "
                f"{counts['up_to_mark']} appear up to mark, {counts['incomplete']} incomplete, "
                f"{counts['suspicious']} flagged for similarity concerns, and "
                f"{counts['needs_review']} need manual review."
            ),
            "topRecommendations": [
                "Interview pairs flagged above 82% similarity before final grading.",
                "Send incomplete submissions a structured resubmission checklist.",
                "Spot-check 'up to mark' submissions for logic-trap compliance.",
            ],
        },
        "similarityPairs": similarity_pairs,
        "students": students_out,
    }


def parse_gemini_json(raw: str) -> dict:
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


def enrich_with_gemini(
    gemini_model,
    submissions: list[StudentSubmission],
    similarity_pairs: list[dict],
    assignment_title: str,
    assignment_description: str,
    evaluation_criteria: str,
    trap_question: str,
) -> dict:
    local = build_local_analysis(
        submissions, similarity_pairs, assignment_title,
        assignment_description, evaluation_criteria,
    )

    summaries = []
    for s in submissions[:40]:
        previews = local["students"]
        prev = next((p for p in previews if p["studentId"] == s.student_id), {})
        summaries.append({
            "studentId": s.student_id,
            "displayName": s.display_name,
            "files": s.files,
            "lineCount": s.line_count,
            "heuristicCompleteness": prev.get("completenessScore"),
            "heuristicQuality": prev.get("qualityScore"),
            "codePreview": s.combined_text[:2500],
        })

    prompt = f"""You are an expert educator grading a class batch of programming submissions.

Assignment: {assignment_title}
Description: {assignment_description[:2000]}
Evaluation criteria: {evaluation_criteria[:1500]}
Logic trap (if any): {trap_question[:800]}

Pre-computed similarity pairs (possible plagiarism):
{json.dumps(similarity_pairs[:25], indent=2)}

Per-student data:
{json.dumps(summaries, indent=2)}

Produce a rigorous class grading report as JSON ONLY (no markdown). Schema:
{{
  "classSummary": {{
    "executiveSummary": "2-4 sentences",
    "topRecommendations": ["...", "...", "..."],
    "integrityNarrative": "paragraph on copy/incomplete patterns"
  }},
  "students": [
    {{
      "studentId": "same id as input",
      "displayName": "...",
      "status": "up_to_mark|incomplete|needs_review|suspicious",
      "completenessScore": 0-100,
      "qualityScore": 0-100,
      "integrityScore": 0-100,
      "trapCompliance": "pass|partial|fail|unknown",
      "aiRiskLevel": "low|medium|high",
      "probableGradeNumeric": 0-100,
      "probableGrade": "letter",
      "strengths": ["..."],
      "weaknesses": ["..."],
      "similarityFlags": [{{"withStudent":"id","similarityPercent":0,"risk":"low|medium|high"}}],
      "educatorNote": "actionable note for teacher"
    }}
  ]
}}

Include every student from the input. Base grades on code quality, completeness, trap compliance, and similarity flags."""

    response = gemini_model.generate_content(prompt)
    ai = parse_gemini_json(response.text or "")

    merged_students = []
    local_by_id = {s["studentId"]: s for s in local["students"]}
    for ai_student in ai.get("students", []):
        sid = ai_student.get("studentId", "")
        base = local_by_id.get(sid, {})
        merged = {**base, **ai_student}
        if not merged.get("files"):
            sub = next((x for x in submissions if x.student_id == sid), None)
            if sub:
                merged["files"] = sub.files
        merged_students.append(merged)

    for sid, base in local_by_id.items():
        if sid not in {s.get("studentId") for s in merged_students}:
            merged_students.append(base)

    counts = {"up_to_mark": 0, "incomplete": 0, "needs_review": 0, "suspicious": 0}
    grade_sum = 0
    for s in merged_students:
        st = s.get("status", "needs_review")
        if st in counts:
            counts[st] += 1
        grade_sum += s.get("probableGradeNumeric", 0)

    total = len(merged_students) or 1
    cs = ai.get("classSummary", {})
    return {
        "source": "gemini",
        "assignmentTitle": assignment_title,
        "classSummary": {
            **local["classSummary"],
            "executiveSummary": cs.get("executiveSummary", local["classSummary"]["executiveSummary"]),
            "topRecommendations": cs.get("topRecommendations", local["classSummary"]["topRecommendations"]),
            "integrityNarrative": cs.get("integrityNarrative", ""),
            "upToMark": counts["up_to_mark"],
            "incomplete": counts["incomplete"],
            "needsReview": counts["needs_review"],
            "suspicious": counts["suspicious"],
            "averageProbableGrade": round(grade_sum / total, 1),
        },
        "similarityPairs": similarity_pairs,
        "students": merged_students,
    }


def analyze_zip(
    zip_bytes: bytes,
    gemini_model,
    api_key: Optional[str],
    assignment_title: str = "Class Assignment",
    assignment_description: str = "",
    evaluation_criteria: str = "",
    trap_question: str = "",
) -> dict:
    submissions = extract_submissions_from_zip(zip_bytes)
    if not submissions:
        raise ValueError(
            "No readable submissions found in ZIP. Use folders per student, e.g. aarav_sharma/main.py"
        )

    similarity_pairs = compute_similarity_pairs(submissions)

    if api_key and gemini_model:
        try:
            return enrich_with_gemini(
                gemini_model, submissions, similarity_pairs,
                assignment_title, assignment_description,
                evaluation_criteria, trap_question,
            )
        except Exception as e:
            result = build_local_analysis(
                submissions, similarity_pairs, assignment_title,
                assignment_description, evaluation_criteria,
            )
            result["source"] = "local-heuristics"
            result["geminiError"] = str(e)
            return result

    return build_local_analysis(
        submissions, similarity_pairs, assignment_title,
        assignment_description, evaluation_criteria,
    )
