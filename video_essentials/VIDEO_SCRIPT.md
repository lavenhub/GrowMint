# GrowMint — Full Demo Video Script
# Total estimated time: 12–15 minutes

---

## FILES IN THIS FOLDER

| File | Used In |
|---|---|
| lecture_notes_dsa.txt | Feature 1 — RAG Engine (upload as knowledge base) |
| lecture_notes_os.txt | Feature 1 — RAG Engine (upload as second file) |
| class_submissions.zip | Feature 3 — Bulk Class Analysis |
| my_project.zip | Feature 6 — Company Project Verification |
| team_project/auth_module.py | Feature 7 — Team Architect (Aarav's file) |
| team_project/database.py | Feature 7 — Team Architect (Priya's file) |
| team_project/api_routes.py | Feature 7 — Team Architect (Rohan's file) |

---

## SEGMENT 1 — INTRO (0:00 – 0:45)

**Page:** Landing page (localhost:5173)
**Action:** Show the 3D bot animation, then scroll down slowly

**Script:**
"This is GrowMint — an AI-resistant EdTech platform. The problem we're solving
is simple: ChatGPT can solve any standard coding assignment in under 10 seconds.
Honest students look identical to students who copy-paste from AI.
GrowMint fixes both problems — for teachers and students.
Let me walk you through every feature."

---

## SEGMENT 2 — FEATURE 1: RAG Curriculum Engine (0:45 – 3:00)

**Page:** Click "I am an Educator" → Login page
**Mock data to enter:**
- Email: kabir.faculty@dtu.edu
- Password: demo123

**Page:** Teacher Dashboard — Curriculum Engine

**Action:** Upload files
- Click the upload zone
- Select: lecture_notes_dsa.txt AND lecture_notes_os.txt
- Check BOTH checkboxes — watch the AI-Resistance meter jump to 95% Bulletproof

**Script:**
"Prof. Kabir uploads his actual lecture notes — his DSA notes and OS notes.
These become the knowledge base. Watch the AI-Resistance meter — with two files
selected it hits 95% Bulletproof."

**Mock data to enter in the form:**
- What to Forge: "Classroom Assignment"
- Topics: "Binary Search Trees, Memory Management"
- Logic Trap: "Local Sync Constraint (Spectra-Sync Guard)"

**Action:** Click "Forge with RAG"
**Wait:** ~5–10 seconds for Gemini to respond

**Script:**
"GrowMint sends the lecture content to Google Gemini 2.5 Flash along with the
logic trap. Gemini reads the actual course material and generates an assignment
that contains the Spectra-Sync Guard — a fictional protocol that only exists
in Prof. Kabir's notes. ChatGPT has never seen it. Claude doesn't know it exists.
Only students who attended the lecture can implement it correctly."

**Action:** Scroll down to show the generated assignment card
- Click "Explain" on the logic trap banner to expand it

---

## SEGMENT 3 — FEATURE 2: ZK Proof of Human Thought (3:00 – 5:30)

**Action:** Click "Switch to Student" in sidebar
**Page:** Student Dashboard

**Script:**
"Now we switch to the student's perspective. Aarav Sharma sees the assignment
on his dashboard. Notice the 'Not started' badge — no submission yet."

**Action:** Click "View brief" on the assignment
**Page:** Assignment Detail / Brief

**Script:**
"He reads the brief. The logic trap is clearly stated — implement the
Spectra-Sync Guard with a 127-byte buffer limit. He understands it because
he attended the lecture."

**Action:** Click "Open editor" or "Start coding"
**Page:** Assignment Work — secure code editor

**Script:**
"He opens the secure editor. What Aarav doesn't see — but we can tell you —
is that every single keystroke is being recorded. Every backspace, every pause,
every timestamp. The telemetry panel on the right shows it updating in real time."

**Action:** Type the following code SLOWLY and naturally (include some backspaces):
```
class SyncOverflowException(Exception):
    pass

class BSTNode:
    def __init__(self, key):
        self.key = key
        self.left = None
        self.right = None

def spectra_sync_hash(key, depth):
    return (key * 31 + depth) % 127
```

**Script:**
"Notice the keystroke count going up. The backspaces show natural self-correction.
This is what human typing looks like."

**Action:** Click "Generate ZK Proof"
**Wait:** Watch the progress bar fill to 100%

**Script:**
"GrowMint now analyses the entire typing session. Typing rhythm variance,
backspace ratio, paste count. It computes a Human Score. Aarav typed naturally
so his score is above 70 — he gets a cryptographic proof hash. This hash is
unique to this submission. It cannot be replicated."

**Action:** Show the proof hash and verified badge

---

## SEGMENT 4 — FEATURE 3: Voice Explanation (5:30 – 6:30)

**Page:** Still on Assignment Work

**Script:**
"But code alone isn't enough. Aarav also records a voice explanation."

**Action:** Click the microphone / Record Voice button
**Speak into mic:** "I implemented the Spectra-Sync Guard by computing the sync hash
as key times 31 plus depth modulo 127. If the hash equals zero the insertion is
deferred and stored in the 127-byte state buffer."

**Action:** Stop recording — show the transcript appearing

**Script:**
"The transcript is analysed for keyword overlap with the assignment.
Spectra-Sync Guard, 127-byte buffer, sync hash — all the right terms are there.
A student who copy-pasted from AI cannot explain this. They don't know what
the Spectra-Sync Guard is."

**Action:** Click Submit

---

## SEGMENT 5 — FEATURE 4: Bulk Class Analysis (6:30 – 8:30)

**Action:** Switch back to Teacher role
**Page:** Sidebar → "Class ZIP Analysis"

**Script:**
"Back to Prof. Kabir. It's submission day. He has 5 students.
Normally this takes hours. Watch this."

**Action:** Upload class_submissions.zip
**Mock data:**
- Assignment Title: "BST with Spectra-Sync Guard"
- Assignment Description: "Implement a Binary Search Tree with the Spectra-Sync Guard protocol, 127-byte buffer limit, no standard library sort, and PacketSizeException for 13-byte inputs."
- Evaluation Criteria: "Correct BST operations, Spectra-Sync Guard implementation, buffer constraint, custom sort, edge case handling"
- Trap Question: "Implement the Spectra-Sync Guard: before inserting any node, compute sync-hash = (key * 31 + depth) % 127. If sync-hash equals 0, defer the insertion."

**Action:** Click Analyze

**Script:**
"GrowMint extracts every student's submission and sends them all to Gemini.
In about 30 seconds we get a full class report."

**Action:** Show the results — expand Aarav's card (A grade), expand Sneha's card
(show plagiarism alert between Sneha and Rohan)

**Script:**
"Aarav gets an A — full Spectra-Sync Guard implementation, all constraints met.
Priya used standard library bisect — trap compliance failed, grade C.
And look here — Sneha and Rohan's submissions are 94% identical.
GrowMint flagged it automatically. That's plagiarism detection in 30 seconds."

---

## SEGMENT 6 — FEATURE 5: ZK SkillGraph (8:30 – 9:30)

**Action:** Switch to Student role
**Page:** Sidebar → "ZK SkillGraph"

**Script:**
"Every verified submission Aarav makes adds to his SkillGraph.
This is his living, cryptographic portfolio."

**Action:** Click on a skill node — show the proof hash and project details

**Script:**
"Each node is a skill. Each skill has a proof hash from the actual submission
that earned it. This isn't a resume where anyone can write 'proficient in Python.'
Every skill here has mathematical evidence behind it."

**Action:** Click "Verify Ledger" button — show the Merkle root animation

**Script:**
"He can share his public profile link with any recruiter.
They see exactly what he built, verified, and proven."

---

## SEGMENT 7 — FEATURE 6: Company Project Verification (9:30 – 10:45)

**Page:** Sidebar → "Project Verification"

**Script:**
"Aarav built a price tracker web scraper over the summer.
He wants to put it on his resume. But how does a recruiter know he actually built it?"

**Mock data to enter:**
- Project Description: "A Python web scraper that monitors product prices across Amazon and Flipkart, stores historical price data in SQLite, and sends email alerts when prices drop below a user-defined threshold. Built with BeautifulSoup4, SQLite, smtplib, and a Flask REST API for querying price history."

**Action:** Upload my_project.zip

**Action:** Click Verify

**Script:**
"GrowMint extracts all the source files and sends them to Gemini alongside
the description. Gemini checks — does this code actually do what he claims?"

**Action:** Show the Approved result with confidence percentage and certificate

**Script:**
"Approved. 88% confidence. The code matches the description.
He gets a verification certificate with a timestamp.
That certificate goes on his resume. Recruiters verify it in one click."

---

## SEGMENT 8 — FEATURE 7: Team Architect (10:45 – 12:30)

**Page:** Sidebar → "Team Architect"

**Script:**
"Last feature. Group projects. The oldest problem in education —
one person does everything, everyone gets the same grade."

**Action:** Click "Create New Project"
**Mock data:**
- Project Name: "Student Record Management System"
- Description: "A full-stack app with authentication, database layer, and REST API"

**Action:** Add members:
- Member 1: Aarav Sharma (role: Lead)
- Member 2: Priya Mehta (role: Contributor)
- Member 3: Rohan Verma (role: Contributor)

**Action:** Navigate to Upload Files for this project
- Upload auth_module.py → Module: "Authentication" → Author: Aarav Sharma
- Upload database.py → Module: "Database" → Author: Priya Mehta
- Upload api_routes.py → Module: "API Routes" → Author: Rohan Verma

**Action:** Click Analyze Project

**Script:**
"GrowMint builds a dependency graph. api_routes imports from database,
database imports from auth_module. Aarav's auth module is the foundation —
everything depends on it. That's reflected in his contribution score."

**Action:** Show the hierarchy tree and leaderboard

**Script:**
"Aarav is Lead Architect — 52% contribution. Priya is Core Team — 31%.
Rohan is Contributor — 17%. Objective. Evidence-based.
Not based on who talks the most in meetings."

---

## SEGMENT 9 — OUTRO (12:30 – 13:00)

**Page:** Back to Landing page

**Script:**
"That's GrowMint. Seven features. One mission.
In a world where AI can write any assignment, the only thing that matters
is proof of human thought. GrowMint creates that proof —
cryptographically, transparently, and automatically.

Teachers get integrity. Students get credit for genuine work.
The gap between 'I built this' and 'I can prove I built this' disappears.

Thank you."

---

## RECORDING TIPS

- Run the backend first: cd backend → uvicorn main:app --reload
- Run the frontend: cd frontend → npm run dev
- Use 1920x1080 resolution, zoom browser to 100%
- Record at 30fps minimum
- Keep the sidebar visible at all times so viewers can follow navigation
- Pause 2 seconds after each major result appears before speaking
- If Gemini is slow, keep talking — don't cut the silence, it shows it's real AI
