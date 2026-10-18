"""Seeds the DB the first time it's empty."""
from datetime import datetime
from werkzeug.security import generate_password_hash
from extensions import db
from models import (Student, AdminUser, Company, Opportunity, Notification,
                    Skill, UniversityRecord)

ADMIN_EMAIL    = "placement@geu.ac.in"
ADMIN_PASSWORD = "GEU@Placement2026"

# University's authoritative student list.
# Registration succeeds ONLY if roll_no + email match one row here.
# Replace with real student data before the final demo.
UNIVERSITY_RECORDS = [
    ("240211097", "abhinavkhatana1100@gmail.com",   "Abhinav Khatana",  "CSE", "2026"),
    ("240221096", "shanukhatana062@gmail.com",      "Shanu Khatana",    "CSE", "2026"),
    ("240211628", "jyotsnachamoli3@gmail.com",      "Jyotsna Chamoli",  "IT",  "2026"),
    ("240211455", "ritikarawat@gmail.com",          "Ritika Rawat",     "CSE", "2026"),
    ("240210988", "manavnegi@gmail.com",            "Manav Negi",       "ECE", "2026"),
    ("240211220", "priyabisht@gmail.com",           "Priya Bisht",      "IT",  "2026"),
]

SKILL_CATALOGUE = [
    "Java", "Python", "C", "C++", "C#", "JavaScript", "TypeScript", "Go",
    "Rust", "Kotlin", "Swift", "PHP", "Ruby", "R", "MATLAB", "Scala",
    "HTML", "CSS", "React", "Vue.js", "Angular", "Node.js", "Express",
    "Django", "Flask", "Spring Boot", "REST APIs", "GraphQL", "Tailwind CSS",
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Pandas", "NumPy",
    "scikit-learn", "TensorFlow", "PyTorch", "Machine Learning",
    "Deep Learning", "NLP", "Data Visualization", "Tableau", "Power BI", "Excel",
    "Linux", "Git", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
    "CI/CD", "Jenkins", "Terraform", "Bash",
    "Data Structures", "Algorithms", "OOP", "DBMS", "Operating Systems",
    "Computer Networks", "System Design",
    "Embedded C", "RTOS", "Verilog", "VHDL", "Arduino", "Raspberry Pi",
    "Microcontrollers", "PCB Design",
    "Android", "iOS", "Flutter", "React Native",
    "Communication", "Problem Solving", "Teamwork", "Presentation",
]

DEMO_OPPORTUNITIES = [
    dict(company="Zeta Systems", role="Software Engineer — Backend",
         eligibility_cgpa=7.5, eligible_branch="CSE, IT", max_backlogs=0,
         package_offered=14, number_of_openings=12, application_deadline="28 Sep 2026",
         required_skills="Java, SQL, REST APIs",
         company_desc="Cloud-native product company building developer tooling.",
         jd="Build and scale backend services in Java and Spring Boot. "
            "Work with our data team on event-driven pipelines."),
    dict(company="Nimbus Analytics", role="Data Analyst Intern",
         eligibility_cgpa=7.0, eligible_branch="CSE, IT, ECE", max_backlogs=1,
         package_offered=6, number_of_openings=8, application_deadline="25 Sep 2026",
         required_skills="Python, SQL, Excel",
         company_desc="Analytics consultancy serving retail and BFSI clients.",
         jd="Clean, analyse and visualise client data in Python and SQL. "
            "Prepare weekly dashboards."),
    dict(company="Arclight Cloud", role="Platform Engineer",
         eligibility_cgpa=8.0, eligible_branch="CSE, IT", max_backlogs=0,
         package_offered=22, number_of_openings=4, application_deadline="2 Oct 2026",
         required_skills="Linux, Docker, Go",
         company_desc="Infrastructure-as-a-service platform for high-scale apps.",
         jd="Own the Kubernetes platform that serves 200+ enterprise customers."),
    dict(company="Volt Instruments", role="Embedded Firmware Engineer",
         eligibility_cgpa=7.2, eligible_branch="ECE, EEE", max_backlogs=2,
         package_offered=9, number_of_openings=6, application_deadline="30 Sep 2026",
         required_skills="C, RTOS",
         company_desc="Industrial IoT and instrumentation hardware manufacturer.",
         jd="Write bare-metal C firmware for industrial sensor gateways."),
    dict(company="Paperfold", role="Frontend Developer",
         eligibility_cgpa=7.0, eligible_branch="CSE, IT", max_backlogs=1,
         package_offered=8, number_of_openings=10, application_deadline="26 Sep 2026",
         required_skills="React, CSS, JavaScript",
         company_desc="Design-led product studio working with D2C brands.",
         jd="Build pixel-perfect interfaces in React."),
]


def seed_if_empty():
    if AdminUser.query.first():
        return

    db.session.add(AdminUser(
        name="Placement Cell — GEU",
        email=ADMIN_EMAIL,
        password_hash=generate_password_hash(ADMIN_PASSWORD),
    ))

    for s in SKILL_CATALOGUE:
        if not Skill.query.filter_by(name=s).first():
            db.session.add(Skill(name=s, category="General"))

    for roll, email, name, branch, batch in UNIVERSITY_RECORDS:
        if not UniversityRecord.query.filter_by(roll_no=roll).first():
            db.session.add(UniversityRecord(
                roll_no=roll, email=email, name=name,
                branch=branch, batch=batch,
            ))

    companies = {}
    for o in DEMO_OPPORTUNITIES:
        if o["company"] not in companies:
            companies[o["company"]] = Company(
                name=o["company"], description=o["company_desc"],
            )
    db.session.add_all(companies.values())
    db.session.flush()

    for o in DEMO_OPPORTUNITIES:
        db.session.add(Opportunity(
            company_id=companies[o["company"]].id,
            role=o["role"],
            job_description=o["jd"],
            company_description=o["company_desc"],
            eligibility_cgpa=o["eligibility_cgpa"],
            eligible_branch=o["eligible_branch"],
            max_backlogs=o["max_backlogs"],
            required_skills=o["required_skills"],
            package_offered=o["package_offered"],
            number_of_openings=o["number_of_openings"],
            application_deadline=o["application_deadline"],
            status="Active",
            posted_date=datetime.utcnow(),
        ))

    db.session.commit()