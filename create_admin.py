from app import app
from extensions import db
from models import AdminUser
from werkzeug.security import generate_password_hash

with app.app_context():
    db.create_all()
    
    # 1. FORCE CREATE / UPDATE SUPER ADMIN
    sa = AdminUser.query.filter_by(email="superadmin@geu.ac.in").first()
    if not sa:
        sa = AdminUser(
            name="Super Admin", 
            email="superadmin@geu.ac.in", 
            password_hash=generate_password_hash("Super@123"), 
            is_super=True
        )
        db.session.add(sa)
        print("✅ Super Admin CREATED.")
    else:
        sa.password_hash = generate_password_hash("Super@123")
        sa.is_super = True
        print("✅ Super Admin UPDATED (password reset).")
        
    # 2. FORCE CREATE / UPDATE REGULAR ADMIN
    ra = AdminUser.query.filter_by(email="placement@geu.ac.in").first()
    if not ra:
        ra = AdminUser(
            name="Placement Cell", 
            email="placement@geu.ac.in", 
            password_hash=generate_password_hash("GEU@Placement2026"), 
            is_super=False
        )
        db.session.add(ra)
        print("✅ Regular Admin CREATED.")
    else:
        ra.password_hash = generate_password_hash("GEU@Placement2026")
        print("✅ Regular Admin UPDATED (password reset).")
        
    db.session.commit()
    
    print("\n--- CURRENT ADMINS IN DATABASE ---")
    for a in AdminUser.query.all():
        print(f"Email: {a.email} | Password: [hidden] | Super Admin: {a.is_super}")