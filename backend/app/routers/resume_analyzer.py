from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
import pypdf
import docx2txt
import tempfile
import os
import io
import json
import re
from typing import Optional, List
from pydantic import BaseModel

from app import models, database
from app.core import security

router = APIRouter(
    prefix="/hr-portal/candidates",
    tags=["recruitment"]
)

class SkillMatch(BaseModel):
    name: str
    matched: bool

class AnalysisResponse(BaseModel):
    name: str
    role: str
    score: int
    skills: List[SkillMatch]
    recommendation: str

# Define skill keywords for each role to power the local keyword analyzer fallback
ROLE_SKILLS = {
    "Senior React Developer": ["React", "Redux", "JavaScript", "TypeScript", "HTML", "CSS", "Testing", "Git", "Webpack", "API"],
    "Product Manager": ["Product Strategy", "Agile", "Scrum", "Roadmap", "OKRs", "Product Analytics", "User Stories", "Figma", "Communication"],
    "QA Automation Engineer": ["Selenium", "Cypress", "Playwright", "Automation", "Jest", "Quality Assurance", "Test Cases", "CI/CD", "Git"],
    "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Linux", "Python", "Jenkins", "Cloud"],
    "Junior UI/UX Designer": ["Figma", "Adobe XD", "Wireframing", "Prototyping", "UI Design", "UX Research", "User Flows", "Typography"],
    "Data Scientist": ["Python", "SQL", "Machine Learning", "Statistics", "Pandas", "Scikit-Learn", "Data Visualization", "R"],
    "Data Analyst": ["SQL", "Excel", "Tableau", "Power BI", "Python", "Data Analysis", "Reporting", "Statistics"],
    "Data Engineer": ["Python", "SQL", "Spark", "Hadoop", "ETL", "AWS", "Docker", "Database Design", "Kubernetes"],
    "Backend Developer": ["Python", "Node.js", "Java", "SQL", "NoSQL", "REST API", "Docker", "Git", "System Design"],
    "Full Stack Developer": ["React", "Node.js", "JavaScript", "SQL", "HTML", "CSS", "Git", "APIs", "Docker"],
    "Software Engineer": ["Algorithms", "Data Structures", "Java", "Python", "C++", "System Design", "Git", "Testing"],
    "HR Manager": ["Recruiter", "Onboarding", "Talent Management", "Employee Relations", "HRIS", "Performance Management", "Compliance"],
    "Sales Executive": ["Sales", "CRM", "Negotiation", "Lead Generation", "Client Relations", "Communication", "Sales Strategy"]
}

def extract_candidate_name(text: str) -> str:
    """Helper to extract a plausible name from raw resume text for the local parser fallback."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    for line in lines[:3]:
        # Simple match for name: 2-3 words, capitalized, no numbers or special symbols
        if re.match(r"^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}$", line):
            return line
    return "Parsed Candidate"

def run_local_analysis(text: str, target_role: str) -> dict:
    """Smart local text analyzer fallback that parses text for role-specific keywords."""
    skills_pool = ROLE_SKILLS.get(target_role, ["Communication", "Git", "Agile", "Problem Solving"])
    
    matched_skills = []
    matched_count = 0
    text_lower = text.lower()
    
    for skill in skills_pool:
        # Match word boundaries or simple substring for multi-word phrases
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, text_lower) or skill.lower() in text_lower:
            matched_skills.append({"name": skill, "matched": True})
            matched_count += 1
        else:
            matched_skills.append({"name": skill, "matched": False})
            
    # Calculate score
    score = int((matched_count / len(skills_pool)) * 100) if skills_pool else 70
    
    # Adjust score boundaries to feel realistic
    if score < 40:
        score = 45 # baseline
    elif score > 95:
        score = 94
        
    name = extract_candidate_name(text)
    
    # Generate custom recommendation
    matched_names = [s["name"] for s in matched_skills if s["matched"]]
    missing_names = [s["name"] for s in matched_skills if not s["matched"]]
    if score >= 80:
        rec = f"Strong candidate demonstrating robust core competencies in {', '.join(matched_names[:3])}. Profile matches target role expectations very closely. Highly recommended for immediate technical screening."
    elif score >= 60:
        rec = f"Solid background. Matches several requirements such as {', '.join(matched_names[:3])}, but exhibits gaps in other areas. Recommended to schedule an initial interview to evaluate technical depth."
    else:
        rec = f"Not recommended for target role due to critical skill gaps: missing {', '.join(missing_names[:4])}. Profile does not show sufficient depth in target technical area."
        
    return {
        "name": name,
        "role": target_role,
        "score": score,
        "skills": matched_skills,
        "recommendation": rec
    }

@router.post("/analyze-resume", response_model=AnalysisResponse)
async def analyze_resume(
    file: UploadFile = File(...),
    target_role: str = Form(...),
    current_user: models.User = Depends(security.get_current_user)
):
    # Protect route (HR/CEO/Admin privileges required)
    if current_user.role not in ["hr", "ceo", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation forbidden. HR privileges required."
        )
        
    # Read file content
    content = await file.read()
    filename = file.filename.lower()
    text = ""
    
    try:
        if filename.endswith(".pdf"):
            reader = pypdf.PdfReader(io.BytesIO(content))
            for page in reader.pages:
                text += page.extract_text() or ""
        elif filename.endswith(".docx"):
            with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as temp_file:
                temp_file.write(content)
                temp_path = temp_file.name
            try:
                text = docx2txt.process(temp_path)
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        else:
            # Fallback to plain text
            text = content.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse resume document: {str(e)}"
        )
        
    if not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded resume appears to be empty or unreadable."
        )
        
    # Check for Gemini API key
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        # Key missing, use the smart local keywords parser
        return run_local_analysis(text, target_role)
        
    # If key exists, run Gemini AI model
    try:
        import google.generativeai as genai
        genai.configure(api_key=gemini_key)
        
        # Use generative model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        system_prompt = f"""
        You are an expert ATS (Applicant Tracking System) AI assistant.
        Analyze the candidate's resume text below against the target role: "{target_role}".
        
        Resume text:
        ---
        {text}
        ---
        
        Extract information and output a valid JSON matching the exact schema below.
        DO NOT wrap the JSON in ```json markdown formatting block. Output ONLY the raw JSON string.
        
        JSON Schema:
        {{
          "name": "Extract candidate's full name. If not found, use a plausible name from text",
          "role": "{target_role}",
          "score": integer (0 to 100 match score based on target role fit),
          "skills": [
            {{ "name": "React", "matched": true }},
            {{ "name": "Node.js", "matched": false }}
          ],
          "recommendation": "A professional 1-2 sentence recommendation summary of their technical fit. If the candidate is a weak fit (score < 70), clearly explain the key missing skills or gaps (e.g. 'Not recommended due to lack of experience in X, Y, and Z') so the HR manager knows exactly why they do not suit the role."
        }}
        """
        response = model.generate_content(system_prompt)
        resp_text = response.text.strip()
        
        # Clean up markdown code blocks if the model generated them
        if resp_text.startswith("```"):
            resp_text = resp_text.replace("```json", "").replace("```", "").strip()
            
        result = json.loads(resp_text)
        return result
    except Exception as e:
        # If Gemini fails for any reason (e.g. rate limit, networking, auth), fallback gracefully to local analyzer
        print(f"Gemini API error (falling back to local parser): {e}")
        return run_local_analysis(text, target_role)
