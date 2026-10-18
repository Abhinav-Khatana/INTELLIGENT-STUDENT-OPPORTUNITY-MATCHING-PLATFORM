"""
Database models for the Placement & Internship Management System.

Table names and fields follow the ER diagram from the project proposal:
STUDENT, COMPANY, SKILL, STUDENT_SKILL, OPPORTUNITY, OPPORTUNITY_SKILL,
APPLICATION, INTERVIEW, OFFER.

One addition not on the diagram: ADMIN_USER. The diagram has a
"Placement Cell (Admin)" box on the architecture page but no table for
it, so this holds the placement cell's login accounts.
"""
from datetime import datetime
from extensions import db
class UniversityRecord(db.Model):
    """The university's authoritative student list.

    Pre-loaded by the placement cell. A student can only register if
    BOTH their roll number AND email match a row here. Once used, the
    record is flagged so the same roll number can't be reused.
    """
    __tablename__ = "university_record"
    id         = db.Column(db.Integer, primary_key=True)
    roll_no    = db.Column(db.String(20), unique=True, nullable=False, index=True)
    email      = db.Column(db.String(120), nullable=False, index=True)
    name       = db.Column(db.String(120), nullable=False)
    branch     = db.Column(db.String(20))
    batch      = db.Column(db.String(10))
    is_registered         = db.Column(db.Boolean, default=False)
    registered_student_id = db.Column(db.Integer, db.ForeignKey("student.id"))

class Student(db.Model):
    __tablename__ = "student"

    id = db.Column(db.Integer, primary_key=True)                 # Student_ID
    roll_no = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    branch = db.Column(db.String(20))
    cgpa = db.Column(db.Float, default=0)
    current_offer_package = db.Column(db.Float, default=0)       # ₹ LPA
    backlog_count = db.Column(db.Integer, default=0)
    phone = db.Column(db.String(20))
    resume_path = db.Column(db.String(255))
    date_registered = db.Column(db.DateTime, default=datetime.utcnow)

    applications = db.relationship("Application", backref="student", lazy=True)
    skills = db.relationship("StudentSkill", backref="student", lazy=True)


class AdminUser(db.Model):
    """Placement cell staff account. Not part of the original ER diagram —
    added so the placement cell has somewhere to log in from."""
    __tablename__ = "admin_user"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    date_registered = db.Column(db.DateTime, default=datetime.utcnow)


class Company(db.Model):
    __tablename__ = "company"

    id = db.Column(db.Integer, primary_key=True)                 # Company_ID
    name = db.Column(db.String(150), nullable=False)
    contact_person = db.Column(db.String(120))
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    website = db.Column(db.String(200))
    address = db.Column(db.String(255))

    opportunities = db.relationship("Opportunity", backref="company", lazy=True)


class Skill(db.Model):
    __tablename__ = "skill"

    id = db.Column(db.Integer, primary_key=True)                 # Skill_ID
    name = db.Column(db.String(80), unique=True, nullable=False)
    category = db.Column(db.String(50))


class StudentSkill(db.Model):
    """Associative table for STUDENT <-> SKILL (M:N)."""
    __tablename__ = "student_skill"

    id = db.Column(db.Integer, primary_key=True)                 # SS_ID
    student_id = db.Column(db.Integer, db.ForeignKey("student.id"), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey("skill.id"), nullable=False)
    proficiency_level = db.Column(db.String(20))

    skill = db.relationship("Skill")


class Opportunity(db.Model):
    __tablename__ = "opportunity"

    id = db.Column(db.Integer, primary_key=True)                 # Opportunity_ID
    company_id = db.Column(db.Integer, db.ForeignKey("company.id"), nullable=False)
    role = db.Column(db.String(150), nullable=False)
    job_description = db.Column(db.Text)
    eligibility_cgpa = db.Column(db.Float, default=0)
    eligible_branch = db.Column(db.String(150))                  # comma-separated, e.g. "CSE, IT"
    max_backlogs = db.Column(db.Integer, default=0)
    required_skills = db.Column(db.String(255))                  # comma-separated summary
    package_offered = db.Column(db.Float, nullable=False)        # ₹ LPA
    number_of_openings = db.Column(db.Integer, default=1)
    application_deadline = db.Column(db.String(50))
    status = db.Column(db.String(20), default="Active")          # Active / Closed
    posted_date = db.Column(db.DateTime, default=datetime.utcnow)

    applications = db.relationship("Application", backref="opportunity", lazy=True)
    skill_links = db.relationship("OpportunitySkill", backref="opportunity", lazy=True)


class OpportunitySkill(db.Model):
    """Associative table for OPPORTUNITY <-> SKILL (M:N)."""
    __tablename__ = "opportunity_skill"

    id = db.Column(db.Integer, primary_key=True)                 # OS_ID
    opportunity_id = db.Column(db.Integer, db.ForeignKey("opportunity.id"), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey("skill.id"), nullable=False)
    required_level = db.Column(db.String(20))


class Application(db.Model):
    __tablename__ = "application"

    id = db.Column(db.Integer, primary_key=True)                 # Application_ID
    student_id = db.Column(db.Integer, db.ForeignKey("student.id"), nullable=False)
    opportunity_id = db.Column(db.Integer, db.ForeignKey("opportunity.id"), nullable=False)
    application_date = db.Column(db.DateTime, default=datetime.utcnow)
    resume_version = db.Column(db.String(255))
    status = db.Column(db.String(20), default="Applied")
    # Applied / Shortlisted / Interview / Selected / Rejected

    interviews = db.relationship("Interview", backref="application", lazy=True)
    offer = db.relationship("Offer", backref="application", uselist=False)


class Interview(db.Model):
    __tablename__ = "interview"

    id = db.Column(db.Integer, primary_key=True)                 # Interview_ID
    application_id = db.Column(db.Integer, db.ForeignKey("application.id"), nullable=False)
    interview_round = db.Column(db.Integer)
    interview_date = db.Column(db.DateTime)
    mode = db.Column(db.String(20))                              # Online / Offline
    interview_result = db.Column(db.String(20))                  # Cleared / Not Cleared
    remarks = db.Column(db.Text)


class Offer(db.Model):
    __tablename__ = "offer"

    id = db.Column(db.Integer, primary_key=True)                 # Offer_ID
    application_id = db.Column(db.Integer, db.ForeignKey("application.id"), unique=True, nullable=False)
    offer_date = db.Column(db.DateTime)
    package_offered = db.Column(db.Float)
    offer_status = db.Column(db.String(20))                      # Accepted / Rejected / Withdrawn
    joining_date = db.Column(db.Date)
class OTPVerification(db.Model):
    __tablename__ = "otp_verification"
    id         = db.Column(db.Integer, primary_key=True)
    email      = db.Column(db.String(120), nullable=False, index=True)
    otp_hash   = db.Column(db.String(255), nullable=False)
    purpose    = db.Column(db.String(20), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used       = db.Column(db.Boolean, default=False)
    attempts   = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)