"""Populates the database with demo data the first time it's empty, so
the API works right after `python app.py` with no manual setup."""
from datetime import datetime

from werkzeug.security import generate_password_hash

from extensions import db
from models import Student, AdminUser, Company, Opportunity

DEMO_OPPORTUNITIES = [
    dict(company="Zeta Systems", role="Software Engineer — Backend", eligibility_cgpa=7.5,
         eligible_branch="CSE, IT", max_backlogs=0, package_offered=14, number_of_openings=12,
         application_deadline="28 Sep", required_skills="Java, SQL, REST"),
    dict(company="Nimbus Analytics", role="Data Analyst Intern", eligibility_cgpa=7.0,
         eligible_branch="CSE, IT, ECE", max_backlogs=1, package_offered=6, number_of_openings=8,
         application_deadline="25 Sep", required_skills="Python, SQL, Excel"),
    dict(company="Arclight Cloud", role="Platform Engineer", eligibility_cgpa=8.0,
         eligible_branch="CSE, IT", max_backlogs=0, package_offered=22, number_of_openings=4,
         application_deadline="2 Oct", required_skills="Linux, Docker, Go"),
    dict(company="Volt Instruments", role="Embedded Firmware Engineer", eligibility_cgpa=7.2,
         eligible_branch="ECE, EEE", max_backlogs=2, package_offered=9, number_of_openings=6,
         application_deadline="30 Sep", required_skills="C, RTOS"),
    dict(company="Paperfold", role="Frontend Developer", eligibility_cgpa=7.0,
         eligible_branch="CSE, IT", max_backlogs=1, package_offered=8, number_of_openings=10,
         application_deadline="26 Sep", required_skills="React, CSS, JS"),
]


def seed_if_empty():
    if Company.query.first():
        return  # already seeded, do nothing

    companies = {name: Company(name=name) for name in
                 {o["company"] for o in DEMO_OPPORTUNITIES}}
    db.session.add_all(companies.values())
    db.session.flush()  # so companies get their ids before opportunities reference them

    db.session.add(AdminUser(
        name="Placement Cell", email="placement@college.edu",
        password_hash=generate_password_hash("demo1234"),
    ))
    db.session.add(Student(
        roll_no="240221096", name="Shanu Khatana", email="shanukhatana062@gmail.com",
        branch="CSE", cgpa=8.4, backlog_count=0, current_offer_package=0,
        password_hash=generate_password_hash("demo1234"),
    ))

    for o in DEMO_OPPORTUNITIES:
        db.session.add(Opportunity(
            company_id=companies[o["company"]].id,
            role=o["role"],
            job_description="",
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
