"""Team Architect project analysis and contribution scoring."""
import json
import re
from datetime import datetime
from typing import Optional, Dict, List
from dataclasses import dataclass, asdict, field


@dataclass
class TeamMember:
    id: str
    name: str
    role: str = "contributor"


@dataclass
class ProjectFile:
    id: str
    filename: str
    module_name: str
    content: str
    author_id: str
    uploaded_at: str
    file_size: int
    line_count: int


@dataclass
class ProjectContribution:
    member_id: str
    member_name: str
    files_count: int
    total_lines: int
    modules: List[str]
    core_feature_score: float
    dependency_score: float
    impact_score: float
    contribution_percentage: float


@dataclass
class TeamProject:
    id: str
    name: str
    description: str
    host_id: str
    host_name: str
    created_at: str
    files: List[ProjectFile] = field(default_factory=list)
    members: List[TeamMember] = field(default_factory=list)
    status: str = "active"  # active, completed
    contributions: List[ProjectContribution] = field(default_factory=list)
    timeline: List[Dict] = field(default_factory=list)
    dependency_graph: Dict = field(default_factory=dict)


# In-memory storage
projects_db: Dict[str, TeamProject] = {}
project_counter = 0


def extract_imports(code: str) -> List[str]:
    """Extract module imports from code."""
    imports = []
    # Python imports
    imports.extend(re.findall(r"^(?:from|import)\s+(\w+)", code, re.MULTILINE))
    # JavaScript/TypeScript imports
    imports.extend(re.findall(r"(?:from|import)\s+['\"]\.?/?([^'\"]+)['\"]", code))
    # Java imports
    imports.extend(re.findall(r"^import\s+([a-z0-9.]+)", code, re.MULTILINE))
    return list(set(imports))


def compute_core_feature_score(module_name: str, code: str) -> float:
    """Estimate if code is core/foundational."""
    core_keywords = [
        "engine", "core", "base", "framework", "api",
        "gateway", "router", "handler", "service",
        "manager", "factory", "builder", "controller"
    ]
    score = 0.0
    code_lower = code.lower()
    module_lower = module_name.lower()

    for keyword in core_keywords:
        if keyword in module_lower:
            score += 0.3
        if code_lower.count(keyword) > 5:
            score += 0.1

    # Check for class/function definitions
    class_count = len(re.findall(r"^(?:class|def|function|export)\s+", code, re.MULTILINE))
    if class_count > 10:
        score += 0.2
    elif class_count > 5:
        score += 0.1

    return min(1.0, score)


def build_dependency_graph(files: List[ProjectFile]) -> Dict:
    """Build module dependency graph."""
    graph = {}
    module_to_file = {}

    for file in files:
        module = file.module_name
        graph[module] = {
            "author": file.author_id,
            "imports": extract_imports(file.content),
            "lines": file.line_count,
        }
        module_to_file[module] = file

    # Compute dependency levels and find core modules
    for module, data in graph.items():
        data["dependents"] = [m for m, d in graph.items() if module in d["imports"]]
        data["dependency_level"] = len(data["imports"])
        data["dependent_count"] = len(data["dependents"])

    return graph


def compute_dependency_score(file: ProjectFile, graph: Dict) -> float:
    """Score based on how many other modules depend on this one."""
    module = file.module_name
    if module not in graph:
        return 0.0

    data = graph[module]
    dependent_count = data.get("dependent_count", 0)
    
    # Normalize: more dependents = higher score
    score = min(1.0, (dependent_count * 0.2))
    return score


def calculate_contributions(
    files: List[ProjectFile],
    members: List[TeamMember],
    graph: Dict
) -> List[ProjectContribution]:
    """Calculate contribution scores for each member."""
    member_data = {m.id: {"name": m.name, "files": [], "lines": 0, "modules": set()} for m in members}

    for file in files:
        if file.author_id in member_data:
            member_data[file.author_id]["files"].append(file)
            member_data[file.author_id]["lines"] += file.line_count
            member_data[file.author_id]["modules"].add(file.module_name)

    # Compute scores
    total_lines = sum(d["lines"] for d in member_data.values()) or 1
    contributions = []

    for member_id, data in member_data.items():
        files_list = data["files"]
        modules_list = list(data["modules"])
        total_member_lines = data["lines"]

        core_score = sum(compute_core_feature_score(f.module_name, f.content) for f in files_list) / (len(files_list) or 1)
        dep_score = sum(compute_dependency_score(f, graph) for f in files_list) / (len(files_list) or 1)

        impact = (core_score * 0.4 + dep_score * 0.6)
        contribution_pct = round((total_member_lines / total_lines) * 100, 1)

        contributions.append(
            ProjectContribution(
                member_id=member_id,
                member_name=data["name"],
                files_count=len(files_list),
                total_lines=total_member_lines,
                modules=modules_list,
                core_feature_score=round(core_score, 2),
                dependency_score=round(dep_score, 2),
                impact_score=round(impact * 100, 1),
                contribution_percentage=contribution_pct,
            )
        )

    # Sort by impact score
    contributions.sort(key=lambda x: x.impact_score, reverse=True)
    return contributions


def build_timeline(files: List[ProjectFile]) -> List[Dict]:
    """Build timeline of module uploads."""
    timeline = [
        {
            "id": f.id,
            "timestamp": f.uploaded_at,
            "module_name": f.module_name,
            "author": f.author_id,
            "filename": f.filename,
            "lines": f.line_count,
        }
        for f in sorted(files, key=lambda x: x.uploaded_at)
    ]
    return timeline


def build_hierarchy(contributions: List[ProjectContribution]) -> Dict:
    """Build hierarchy based on contributions."""
    return {
        "lead_architect": contributions[0].member_id if contributions else None,
        "architects": [c.member_id for c in contributions[:min(3, len(contributions))]],
        "all_contributors": [
            {
                "id": c.member_id,
                "name": c.member_name,
                "rank": i + 1,
                "impact_score": c.impact_score,
                "contribution_percentage": c.contribution_percentage,
            }
            for i, c in enumerate(contributions)
        ],
    }
