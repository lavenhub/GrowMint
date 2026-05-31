import io
import json
import os
import re
import zipfile
from datetime import datetime, timezone
from typing import Optional

import google.generativeai as genai
from bulk_analyzer import analyze_zip, parse_gemini_json
from team_architect import (
    TeamProject, TeamMember, ProjectFile, projects_db,
    build_dependency_graph, calculate_contributions, build_timeline, build_hierarchy,
)
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pypdf import PdfReader

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY is not set in backend/.env")

genai.configure(api_key=api_key)
gemini_model = genai.GenerativeModel("gemini-2.5-flash")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def read_uploaded_file(upload: UploadFile) -> str:
    content = upload.file.read()
    if upload.filename.lower().endswith(".pdf"):
        try:
            pdf = PdfReader(io.BytesIO(content))
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
        except Exception as e:
            return f"Error reading PDF: {e}"
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        return content.decode("latin-1")


TEXT_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".c", ".cpp", ".h",
    ".cs", ".go", ".rs", ".md", ".txt", ".json", ".html", ".css", ".sql",
}


def extract_project_text(zip_bytes: bytes) -> str:
    files = []
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        for info in zf.infolist():
            if info.is_dir():
                continue
            path = info.filename.replace("\\", "/")
            if any(part.startswith("__MACOSX") or part.startswith(".") for part in path.split("/")):
                continue
            ext = os.path.splitext(path)[1].lower()
            if ext and ext not in TEXT_EXTENSIONS:
                continue
            try:
                raw = zf.read(info)
            except Exception:
                continue
            try:
                text = raw.decode("utf-8")
            except UnicodeDecodeError:
                text = raw.decode("latin-1", errors="ignore")
            if text.strip():
                files.append(f"# {path}\n{text.strip()}")
    return "\n\n".join(files)[:22000]


def compute_description_match(description: str, code_text: str) -> float:
    description_words = set(re.findall(r"[a-z0-9]+", description.lower()))
    code_words = set(re.findall(r"[a-z0-9]+", code_text.lower()))
    if not description_words or not code_words:
        return 0.0
    return len(description_words & code_words) / len(description_words)


def build_company_verification_response(description: str, code_text: str) -> dict:
    line_count = code_text.count("\n") + 1
    readme_present = bool(re.search(r"readme", code_text, flags=re.IGNORECASE))
    description_match = compute_description_match(description, code_text)
    size_score = min(1.0, line_count / 80)
    confidence = int(round((description_match * 0.45 + size_score * 0.35 + (0.2 if readme_present else 0.0)) * 100))

    if confidence >= 55 and description_match >= 0.28 and line_count >= 20:
        status = "approved"
        reason = "The uploaded codebase looks consistent with your project description and contains sufficient implementation details."
    elif confidence >= 40:
        status = "needs_review"
        reason = "The codebase partially aligns with your description, but it may need a manual review for feature coverage."
    else:
        status = "rejected"
        reason = "The uploaded codebase does not provide strong evidence that it matches your project description."

    if not readme_present:
        reason += " Including a README or project documentation would improve verification confidence."

    certificate = None
    if status == "approved":
        certificate = (
            f"Verified project certificate\n"
            f"Project: {description[:60]}{'...' if len(description) > 60 else ''}\n"
            f"Status: Approved\n"
            f"Confidence: {confidence}%\n"
            f"Verified at: {datetime.now(timezone.utc).isoformat()}"
        )

    return {
        "status": status,
        "confidence": confidence,
        "reason": reason,
        "descriptionMatch": round(description_match * 100, 1),
        "lineCount": line_count,
        "readmePresent": readme_present,
        "certificate": certificate,
    }


def verify_company_project_with_gemini(description: str, code_text: str) -> Optional[dict]:
    prompt = f"""You are an expert software evaluator. Determine whether the following project description matches the uploaded codebase.

Project description:
{description}

Code excerpt:
{code_text[:12000]}

Respond with JSON only. Use keys: status, confidence, reason, certificate. Status must be one of \"approved\", \"needs_review\", or \"rejected\".
"""
    try:
        response = gemini_model.generate_content(prompt)
        parsed = parse_gemini_json(response.text or "")
        if parsed.get("status") not in {"approved", "needs_review", "rejected"}:
            return None
        if "confidence" in parsed:
            parsed["confidence"] = int(parsed["confidence"])
        if parsed.get("status") == "approved" and not parsed.get("certificate"):
            parsed["certificate"] = (
                f"Verified project certificate\n"
                f"Project: {description[:60]}{'...' if len(description) > 60 else ''}\n"
                f"Status: Approved\n"
                f"Confidence: {parsed.get('confidence', 0)}%\n"
                f"Verified at: {datetime.now(timezone.utc).isoformat()}"
            )
        return parsed
    except Exception:
        return None


def rank_docs_by_topic(topic: str, docs: list[str], k: int = 3) -> list[int]:
    """Lightweight retrieval without ML deps — scores docs by keyword overlap."""
    topic_words = set(re.findall(r"[a-z0-9]+", topic.lower()))
    if not topic_words:
        return list(range(min(k, len(docs))))

    scored = []
    for i, doc in enumerate(docs):
        doc_words = set(re.findall(r"[a-z0-9]+", doc.lower()))
        score = len(topic_words & doc_words)
        scored.append((score, i))

    scored.sort(key=lambda x: (-x[0], x[1]))
    return [i for _, i in scored[: min(k, len(docs))]]


@app.get("/health")
def health():
    return {"status": "ok", "gemini_configured": bool(api_key)}


@app.post("/rag/generate")
async def generate_rag(
    topic: str = Form(...),
    task_type: str = Form(...),
    trap_type: str = Form(...),
    files: list[UploadFile] = File(...),
):
    if not api_key:
        return JSONResponse(
            status_code=500,
            content={"error": "GEMINI_API_KEY is not set in backend/.env"},
        )

    docs = []
    filenames = []
    for f in files:
        docs.append(read_uploaded_file(f))
        filenames.append(f.filename)

    indices = rank_docs_by_topic(topic, docs)
    relevant = [docs[i] for i in indices]
    relevant_files = [filenames[i] for i in indices]

    trap_prompt = {
        "memory": f"Implement the algorithm for {topic} ensuring the internal state buffer allocation size is strictly limited to exactly 127 bytes.",
        "no-standard-lib": f"Write a custom solution for {topic} without importing standard utility libraries or built-in helper functions. Implement your own primitive helpers.",
        "edge-case": f"In your {topic} solution, explicitly throw an exception or return a custom error state if the input packet length is exactly 13 bytes.",
        "quantum-sync": f"Integrate the specific 'Spectra-Sync Guard' routine discussed in the notes to verify timestamps in the {topic} pipeline.",
    }.get(trap_type, "")

    context = "\n\n---\n\n".join(relevant)[:12000]

    prompt = f"""You are an AI that generates a concise assignment/test/project specification in JSON.
Include a title, detailed description, evaluationCriteria, and embed the provided logic trap.
Only output a valid JSON object without any surrounding text, markdown, or code blocks.

Topic: {topic}
Task type: {task_type}
Logic trap to embed: {trap_prompt}
Relevant lecture excerpts:
{context}

Respond with ONLY a JSON object with these exact keys: title, description, evaluationCriteria, trapQuestion, trapExplanation"""

    raw = ""
    try:
        response = gemini_model.generate_content(prompt)
        raw = (response.text or "").strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        json_content = json.loads(raw)
    except json.JSONDecodeError:
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to parse AI response as JSON", "raw": raw},
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    json_content.update(
        {
            "uploadedFiles": relevant_files,
            "trapQuestion": trap_prompt,
            "trapExplanation": json_content.get("trapExplanation", ""),
        }
    )
    return JSONResponse(content=json_content)


@app.post("/submissions/analyze-zip")
async def analyze_submissions_zip(
    zip_file: UploadFile = File(...),
    assignment_title: str = Form("Class Assignment"),
    assignment_description: str = Form(""),
    evaluation_criteria: str = Form(""),
    trap_question: str = Form(""),
):
    if not zip_file.filename.lower().endswith(".zip"):
        return JSONResponse(
            status_code=400,
            content={"error": "Please upload a .zip file containing student submissions."},
        )

    try:
        zip_bytes = await zip_file.read()
        report = analyze_zip(
            zip_bytes=zip_bytes,
            gemini_model=gemini_model if api_key else None,
            api_key=api_key,
            assignment_title=assignment_title,
            assignment_description=assignment_description,
            evaluation_criteria=evaluation_criteria,
            trap_question=trap_question,
        )
        report["generatedAt"] = datetime.now(timezone.utc).isoformat()
        report["zipFileName"] = zip_file.filename
        return JSONResponse(content=report)
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/company/verify")
async def verify_company_project(
    project_description: str = Form(...),
    project_zip: UploadFile = File(...),
):
    if not project_zip.filename.lower().endswith(".zip"):
        return JSONResponse(
            status_code=400,
            content={"error": "Please upload a .zip file containing your project source."},
        )

    try:
        zip_bytes = await project_zip.read()
        code_text = extract_project_text(zip_bytes)
        if not code_text.strip():
            raise ValueError("No readable source files were found in the ZIP archive.")

        result = build_company_verification_response(project_description, code_text)
        if api_key and gemini_model:
            ai_result = verify_company_project_with_gemini(project_description, code_text)
            if ai_result:
                result.update({
                    "source": "gemini",
                    "reason": ai_result.get("reason", result["reason"]),
                    "certificate": ai_result.get("certificate", result.get("certificate")),
                    "confidence": ai_result.get("confidence", result["confidence"]),
                    "status": ai_result.get("status", result["status"]),
                })
                return JSONResponse(content=result)

        result["source"] = "local-heuristics"
        return JSONResponse(content=result)
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# Team Architect Endpoints
@app.post("/team/project/create")
async def create_team_project(
    name: str = Form(...),
    description: str = Form(...),
    host_id: str = Form(...),
    host_name: str = Form(...),
):
    """Create a new team project."""
    try:
        from team_architect import project_counter
        import team_architect
        
        project_id = f"proj-{datetime.now(timezone.utc).timestamp()}"
        project = TeamProject(
            id=project_id,
            name=name,
            description=description,
            host_id=host_id,
            host_name=host_name,
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        projects_db[project_id] = project
        return JSONResponse(content={"id": project_id, "name": name, "status": "created"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/team/project/{project_id}/member/add")
async def add_team_member(
    project_id: str,
    member_id: str = Form(...),
    member_name: str = Form(...),
    role: str = Form(default="contributor"),
):
    """Add a member to a team project."""
    try:
        if project_id not in projects_db:
            return JSONResponse(status_code=404, content={"error": "Project not found"})

        project = projects_db[project_id]
        member = TeamMember(id=member_id, name=member_name, role=role)
        project.members.append(member)
        return JSONResponse(content={"status": "member_added", "member": {"id": member_id, "name": member_name}})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/team/project/{project_id}/upload")
async def upload_project_file(
    project_id: str,
    module_name: str = Form(...),
    author_id: str = Form(...),
    file: UploadFile = File(...),
):
    """Upload a code file for the project."""
    try:
        if project_id not in projects_db:
            return JSONResponse(status_code=404, content={"error": "Project not found"})

        project = projects_db[project_id]
        content = await file.read()
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1", errors="ignore")

        line_count = text.count("\n") + 1
        file_size = len(content)
        file_id = f"file-{datetime.now(timezone.utc).timestamp()}"

        proj_file = ProjectFile(
            id=file_id,
            filename=file.filename,
            module_name=module_name,
            content=text,
            author_id=author_id,
            uploaded_at=datetime.now(timezone.utc).isoformat(),
            file_size=file_size,
            line_count=line_count,
        )
        project.files.append(proj_file)
        return JSONResponse(content={"status": "uploaded", "file_id": file_id, "module": module_name, "lines": line_count})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/team/project/{project_id}/analyze")
async def analyze_team_project(project_id: str):
    """Analyze project: compute dependencies, contributions, timeline, and hierarchy."""
    try:
        if project_id not in projects_db:
            return JSONResponse(status_code=404, content={"error": "Project not found"})

        project = projects_db[project_id]
        
        # Build dependency graph
        dependency_graph = build_dependency_graph(project.files)
        project.dependency_graph = dependency_graph

        # Calculate contributions
        contributions = calculate_contributions(project.files, project.members, dependency_graph)
        project.contributions = contributions

        # Build timeline
        timeline = build_timeline(project.files)
        project.timeline = timeline

        # Build hierarchy
        hierarchy = build_hierarchy(contributions)

        return JSONResponse(content={
            "status": "analyzed",
            "contributions": [
                {
                    "member_id": c.member_id,
                    "member_name": c.member_name,
                    "files_count": c.files_count,
                    "total_lines": c.total_lines,
                    "modules": c.modules,
                    "core_feature_score": c.core_feature_score,
                    "dependency_score": c.dependency_score,
                    "impact_score": c.impact_score,
                    "contribution_percentage": c.contribution_percentage,
                }
                for c in contributions
            ],
            "timeline": timeline,
            "hierarchy": hierarchy,
            "dependency_graph": dependency_graph,
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/team/project/{project_id}")
async def get_team_project(project_id: str):
    """Get complete project details."""
    try:
        if project_id not in projects_db:
            return JSONResponse(status_code=404, content={"error": "Project not found"})

        project = projects_db[project_id]
        return JSONResponse(content={
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "host_id": project.host_id,
            "host_name": project.host_name,
            "created_at": project.created_at,
            "status": project.status,
            "members_count": len(project.members),
            "files_count": len(project.files),
            "contributions": [
                {
                    "member_id": c.member_id,
                    "member_name": c.member_name,
                    "files_count": c.files_count,
                    "total_lines": c.total_lines,
                    "impact_score": c.impact_score,
                    "contribution_percentage": c.contribution_percentage,
                }
                for c in project.contributions
            ],
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/team/projects")
async def list_team_projects(host_id: Optional[str] = None):
    """List all projects or projects by host."""
    try:
        if host_id:
            projects_list = [p for p in projects_db.values() if p.host_id == host_id]
        else:
            projects_list = list(projects_db.values())

        return JSONResponse(content={
            "projects": [
                {
                    "id": p.id,
                    "name": p.name,
                    "host_name": p.host_name,
                    "created_at": p.created_at,
                    "status": p.status,
                    "members_count": len(p.members),
                    "files_count": len(p.files),
                }
                for p in projects_list
            ]
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
