import streamlit as st
import streamlit.components.v1 as components
import os
import base64
import pandas as pd
from datetime import datetime
from io import StringIO
import psycopg2

st.set_page_config(
    page_title="HR Portal | Baynunah",
    page_icon="🏢",
    layout="wide",
    initial_sidebar_state="collapsed"
)

def get_logo_base64():
    logo_path = "attached_assets/logo_1765648544636_1766742634201.png"
    if os.path.exists(logo_path):
        with open(logo_path, "rb") as f:
            return base64.b64encode(f.read()).decode()
    return None

def get_droplet_base64():
    droplet_path = "attached_assets/Screenshot_2025-12-29_164918_1767051331486.png"
    if os.path.exists(droplet_path):
        with open(droplet_path, "rb") as f:
            return base64.b64encode(f.read()).decode()
    return None

def load_employee_data():
    excel_path = "attached_assets/Renewal_Insurance_1767051010260.xlsx"
    if os.path.exists(excel_path):
        return pd.read_excel(excel_path)
    return None

def get_db_connection():
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        return psycopg2.connect(database_url)
    return None

def save_submission(submission):
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute('''
                INSERT INTO employee_submissions 
                (staff_number, employee_name, data_confirmed, passport_number, 
                 passport_changed, marital_status, marital_changed, visa_file_number, 
                 visa_changed, additional_notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                submission['Staff Number'],
                submission['Employee Name'],
                submission['Data Confirmed'] == 'Yes',
                submission['Passport Number'],
                submission['Passport Changed'] == 'Yes',
                submission['Marital Status'],
                submission['Marital Changed'] == 'Yes',
                submission['Visa File Number'],
                submission['Visa Changed'] == 'Yes',
                submission['Additional Notes']
            ))
            conn.commit()
            cur.close()
            conn.close()
            return True
        except Exception as e:
            conn.close()
            return False
    return False

def get_all_submissions():
    conn = get_db_connection()
    if conn:
        try:
            df = pd.read_sql_query('''
                SELECT staff_number, employee_name, submitted_at, data_confirmed,
                       passport_number, passport_changed, marital_status, marital_changed,
                       visa_file_number, visa_changed, additional_notes
                FROM employee_submissions
                ORDER BY submitted_at DESC
            ''', conn)
            conn.close()
            return df
        except Exception as e:
            conn.close()
            return pd.DataFrame()
    return pd.DataFrame()

def validate_employee(employee_id, dob):
    df = load_employee_data()
    if df is None:
        return None
    employee_id = employee_id.strip().upper()
    df['Staff Number'] = df['Staff Number'].astype(str).str.strip().str.upper()
    df['Date Of Birth'] = pd.to_datetime(df['Date Of Birth'], dayfirst=True, errors='coerce')
    try:
        input_dob = pd.to_datetime(dob, dayfirst=True)
    except:
        return None
    match = df[(df['Staff Number'] == employee_id) & (df['Date Of Birth'].dt.date == input_dob.date())]
    if not match.empty:
        return match.iloc[0].to_dict()
    return None

def get_page():
    params = st.query_params
    return params.get("page", "home")

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
header {visibility: hidden;}
.stDeployButton {display: none;}

.stApp {
    font-family: 'Poppins', sans-serif;
    background: #e8e8e8;
}

[data-testid="stAppViewBlockContainer"] {
    padding-top: 1rem !important;
    max-width: 100% !important;
}

.portal-container {
    min-height: 90vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.portal-header {
    text-align: center;
    margin-bottom: 30px;
}

.portal-logo {
    width: 120px;
    margin-bottom: 10px;
}

.portal-title {
    font-size: 1.8em;
    font-weight: 600;
    color: #333;
    margin: 0;
    letter-spacing: 0.05em;
}

.menu-grid {
    display: grid;
    grid-template-columns: repeat(2, 130px);
    gap: 8px;
    margin: 20px auto;
}

.menu-item {
    width: 130px;
    height: 130px;
    background: #e8e8e8;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    color: #333;
    font-weight: 500;
    font-size: 0.85em;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    transition: all 0.3s ease;
    box-shadow: 
        6px 6px 12px rgba(0,0,0,0.15),
        -6px -6px 12px rgba(255,255,255,0.8),
        inset 2px 5px 10px rgba(0,0,0,0.1);
}

.menu-item:hover {
    letter-spacing: 0.5em;
    transform: translateY(-8px);
    background: #171717;
    color: white;
}

.menu-item:hover img {
    filter: brightness(0) invert(1);
}

.menu-item img {
    width: 36px;
    height: 36px;
    margin-bottom: 10px;
}

.item-tl { border-radius: 60px 12px 12px 12px; }
.item-tr { border-radius: 12px 60px 12px 12px; }
.item-bl { border-radius: 12px 12px 12px 60px; }
.item-br { border-radius: 12px 12px 60px 12px; }

.portal-footer {
    margin-top: 30px;
    text-align: center;
    font-size: 0.75em;
    color: #666;
    letter-spacing: 0.1em;
}

.page-container {
    min-height: 80vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
}

.page-title {
    font-size: 2em;
    font-weight: 600;
    color: #333;
    margin-bottom: 20px;
}

.page-message {
    font-size: 1.1em;
    color: #666;
    margin-bottom: 30px;
}

.back-btn {
    display: inline-block;
    background: #e8e8e8;
    color: #333;
    padding: 12px 30px;
    border-radius: 30px;
    text-decoration: none;
    font-weight: 500;
    box-shadow: 
        4px 4px 8px rgba(0,0,0,0.15),
        -4px -4px 8px rgba(255,255,255,0.8);
    transition: all 0.3s ease;
}

.back-btn:hover {
    background: #171717;
    color: white;
}

.admin-card {
    background: #e8e8e8;
    padding: 40px;
    border-radius: 20px;
    max-width: 400px;
    margin: 0 auto;
    box-shadow: 
        8px 8px 16px rgba(0,0,0,0.15),
        -8px -8px 16px rgba(255,255,255,0.8);
}

.admin-title {
    font-size: 1.5em;
    font-weight: 600;
    color: #333;
    margin-bottom: 20px;
    text-align: center;
}

.contact-info {
    background: #f5f5f5;
    padding: 20px;
    border-radius: 12px;
    margin: 20px 0;
}

.contact-item {
    margin: 10px 0;
    font-size: 0.95em;
}

@media (max-width: 600px) {
    .menu-grid {
        grid-template-columns: repeat(2, 110px);
    }
    .menu-item {
        width: 110px;
        height: 110px;
        font-size: 0.7em;
    }
    .portal-title {
        font-size: 1.4em;
    }
}
</style>
"""

def svg_to_data_uri(svg_content):
    import urllib.parse
    return f"data:image/svg+xml,{urllib.parse.quote(svg_content)}"

SVG_USERS = svg_to_data_uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#39FF14" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>')
SVG_CHECK = svg_to_data_uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#39FF14" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>')
SVG_GLOBE = svg_to_data_uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#39FF14" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>')
SVG_LOCK = svg_to_data_uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#39FF14" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>')

def render_home():
    logo_b64 = get_logo_base64()
    logo_html = f'<img src="data:image/png;base64,{logo_b64}" class="portal-logo">' if logo_b64 else ''
    
    html_content = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ 
                font-family: 'Poppins', sans-serif; 
                background: #f0f0f3;
                height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 0;
                overflow: hidden;
            }}
            .portal-header {{ text-align: center; margin-bottom: 12px; }}
            .portal-logo {{ width: 70px; margin-bottom: 4px; }}
            .portal-title {{ font-size: 1.3em; font-weight: 600; color: #333; letter-spacing: 0.05em; }}
            
            .menu-container {{
                display: flex;
                flex-direction: column;
                gap: 0.4em;
            }}
            .menu-row {{
                display: flex;
                flex-direction: row;
                gap: 0.4em;
            }}
            .menu-item {{
                width: 160px;
                height: 160px;
                background: linear-gradient(145deg, #ffffff, #e6e6e6);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-decoration: none;
                color: #333;
                font-weight: 500;
                font-size: 0.85em;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                transition: all 0.25s ease-in-out;
                border: none;
                outline: none;
                cursor: pointer;
                text-align: center;
                padding: 20px;
                box-shadow:
                    8px 8px 16px rgba(180, 180, 180, 0.5),
                    -8px -8px 16px rgba(255, 255, 255, 0.9),
                    inset 1px 1px 2px rgba(255,255,255,0.8),
                    inset -1px -1px 2px rgba(0,0,0,0.05);
            }}
            .menu-item:active {{
                box-shadow:
                    inset 4px 4px 10px rgba(180, 180, 180, 0.5),
                    inset -4px -4px 10px rgba(255, 255, 255, 0.9);
            }}
            .menu-item img {{ width: 36px; height: 36px; margin-bottom: 8px; transition: all 0.25s ease; }}
            .menu-item span {{ display: block; line-height: 1.3; }}
            .menu-item .content {{ 
                display: flex; flex-direction: column; 
                align-items: center; justify-content: center;
                transition: transform 0.25s ease;
            }}
            
            .item-tl {{ 
                border-radius: 160px 5px 5px 5px; 
                transform-origin: 100% 100%;
            }}
            .item-tl .content {{ transform: translate(-8px, -8px); }}
            .item-tl:hover {{ transform: translate(-5px, -5px); background: linear-gradient(145deg, #e6e6e6, #ffffff); box-shadow: 4px 4px 8px rgba(180,180,180,0.4), -4px -4px 8px rgba(255,255,255,0.9); }}
            
            .item-tr {{ 
                border-radius: 5px 160px 5px 5px;
                transform-origin: 0% 100%;
            }}
            .item-tr .content {{ transform: translate(8px, -8px); }}
            .item-tr:hover {{ transform: translate(5px, -5px); background: linear-gradient(145deg, #e6e6e6, #ffffff); box-shadow: 4px 4px 8px rgba(180,180,180,0.4), -4px -4px 8px rgba(255,255,255,0.9); }}
            
            .item-bl {{ 
                border-radius: 5px 5px 5px 160px;
                transform-origin: 100% 0%;
            }}
            .item-bl .content {{ transform: translate(-8px, 8px); }}
            .item-bl:hover {{ transform: translate(-5px, 5px); background: linear-gradient(145deg, #e6e6e6, #ffffff); box-shadow: 4px 4px 8px rgba(180,180,180,0.4), -4px -4px 8px rgba(255,255,255,0.9); }}
            
            .item-br {{ 
                border-radius: 5px 5px 160px 5px;
                transform-origin: 0% 0%;
            }}
            .item-br .content {{ transform: translate(8px, 8px); }}
            .item-br:hover {{ transform: translate(5px, 5px); background: linear-gradient(145deg, #e6e6e6, #ffffff); box-shadow: 4px 4px 8px rgba(180,180,180,0.4), -4px -4px 8px rgba(255,255,255,0.9); }}
            
            .portal-footer {{ margin-top: 10px; text-align: center; font-size: 0.65em; color: #999; letter-spacing: 0.1em; }}
            
            @media (max-width: 500px) {{
                .menu-item {{ width: 140px; height: 140px; font-size: 0.75em; }}
                .menu-item img {{ width: 36px; height: 36px; }}
                .portal-title {{ font-size: 1.3em; }}
                .portal-logo {{ width: 80px; }}
                .login-card {{ width: 260px; padding: 2rem 1.5rem; }}
            }}
        </style>
    </head>
    <body>
        <div class="portal-header">
            {logo_html}
            <h1 class="portal-title">HR PORTAL</h1>
        </div>
        <div class="menu-container">
            <div class="menu-row">
                <a href="?page=employees" class="menu-item item-tl">
                    <div class="content">
                        <img src="{SVG_USERS}" alt="Employees">
                        <span>Employees</span>
                    </div>
                </a>
                <a href="?page=onboarding" class="menu-item item-tr">
                    <div class="content">
                        <img src="{SVG_CHECK}" alt="Onboarding">
                        <span>Onboarding</span>
                    </div>
                </a>
            </div>
            <div class="menu-row">
                <a href="?page=external" class="menu-item item-bl">
                    <div class="content">
                        <img src="{SVG_GLOBE}" alt="External">
                        <span>External</span>
                    </div>
                </a>
                <a href="?page=admin" class="menu-item item-br">
                    <div class="content">
                        <img src="{SVG_LOCK}" alt="Admin">
                        <span>Admin</span>
                    </div>
                </a>
            </div>
        </div>
        <div class="portal-footer">Conceptualised by Baynunah|HR|IS</div>
    </body>
    </html>
    '''
    components.html(html_content, height=460, scrolling=False)

def render_coming_soon(title):
    st.markdown(CSS, unsafe_allow_html=True)
    st.markdown(f'''
    <div class="page-container">
        <h1 class="page-title">{title}</h1>
        <p class="page-message">This section is coming soon.</p>
        <a href="?" class="back-btn">Back to Home</a>
    </div>
    ''', unsafe_allow_html=True)

def render_onboarding():
    st.markdown(CSS, unsafe_allow_html=True)
    st.markdown('''
    <div class="page-container">
        <h1 class="page-title">Onboarding</h1>
        <p class="page-message">This section is coming soon.</p>
        <a href="?" class="back-btn">Back to Home</a>
    </div>
    ''', unsafe_allow_html=True)

def render_employees():
    st.markdown(CSS, unsafe_allow_html=True)
    
    if 'employee_data' not in st.session_state:
        st.session_state.employee_data = None
    
    droplet_b64 = get_droplet_base64()
    logo_b64 = get_logo_base64()
    
    if st.session_state.employee_data:
        emp = st.session_state.employee_data
        name = str(emp.get('Member Full Name', 'Employee'))
        relation = str(emp.get('Relation', ''))
        dept = "HR" if "HR" in str(emp.get('Package Description', '')) else "Staff"
        location = str(emp.get('Place of visa issuance', 'Head Office'))
        phone = str(emp.get('Column1', ''))
        staff_num = str(emp.get('Staff Number', ''))
        package = str(emp.get('Package Description', ''))
        principal_num = str(emp.get('Principal Number', ''))
        member_num = str(emp.get('Member Number', ''))
        nationality = str(emp.get('Nationality', ''))
        gender = str(emp.get('Gender', ''))
        dob = str(emp.get('Date Of Birth', ''))
        if hasattr(emp.get('Date Of Birth'), 'strftime'):
            dob = emp.get('Date Of Birth').strftime('%d/%m/%Y')
        
        droplet_html = f'<img src="data:image/png;base64,{droplet_b64}" class="droplet-watermark">' if droplet_b64 else ''
        logo_html = f'<img src="data:image/png;base64,{logo_b64}" class="pass-logo">' if logo_b64 else '<div class="pass-logo-text">baynunah</div>'
        
        pass_html = f'''
        <style>
            .pass-container {{
                display: flex; justify-content: center; align-items: center;
                min-height: 80vh; padding: 20px;
            }}
            .pass-card {{
                background: white; border-radius: 16px; padding: 40px;
                max-width: 420px; width: 100%; position: relative;
                box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                overflow: hidden;
            }}
            .pass-header {{
                background: #0a2351; color: white; padding: 12px 20px;
                margin: -40px -40px 30px -40px; text-align: center;
            }}
            .pass-logo {{ height: 30px; }}
            .pass-logo-text {{ font-size: 1.5em; font-weight: 600; letter-spacing: 0.1em; }}
            .droplet-watermark {{
                position: absolute; top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 280px; opacity: 0.08; pointer-events: none;
            }}
            .pass-content {{ position: relative; z-index: 1; text-align: center; }}
            .emp-name {{ font-size: 1.4em; font-weight: 700; color: #0a2351; margin-bottom: 5px; }}
            .emp-title {{ font-size: 1.1em; font-weight: 600; color: #333; margin-bottom: 15px; }}
            .emp-dept {{ font-size: 0.95em; color: #666; margin-bottom: 5px; }}
            .emp-location {{ font-size: 0.9em; color: #888; margin-bottom: 25px; }}
            .insurance-section {{
                background: #f8f9fa; border-radius: 12px; padding: 20px;
                margin: 20px 0; text-align: left;
            }}
            .section-label {{
                font-size: 0.75em; color: #39FF14; font-weight: 600;
                letter-spacing: 0.1em; margin-bottom: 10px;
            }}
            .info-row {{ display: flex; justify-content: space-between; margin: 8px 0; font-size: 0.85em; }}
            .info-label {{ color: #666; }}
            .info-value {{ color: #333; font-weight: 500; }}
            .emp-contact {{ font-size: 0.8em; color: #666; margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee; }}
        </style>
        <div class="pass-container">
            <div class="pass-card">
                <div class="pass-header">{logo_html}</div>
                {droplet_html}
                <div class="pass-content">
                    <div class="emp-name">{name}</div>
                    <div class="emp-title">{relation}</div>
                    <div class="emp-dept">{dept}</div>
                    <div class="emp-location">{location}</div>
                    
                    <div class="insurance-section">
                        <div class="section-label">INSURANCE DETAILS</div>
                        <div class="info-row"><span class="info-label">Staff Number</span><span class="info-value">{staff_num}</span></div>
                        <div class="info-row"><span class="info-label">Principal Number</span><span class="info-value">{principal_num}</span></div>
                        <div class="info-row"><span class="info-label">Member Number</span><span class="info-value">{member_num}</span></div>
                        <div class="info-row"><span class="info-label">Nationality</span><span class="info-value">{nationality}</span></div>
                        <div class="info-row"><span class="info-label">Gender</span><span class="info-value">{gender}</span></div>
                        <div class="info-row"><span class="info-label">Date of Birth</span><span class="info-value">{dob}</span></div>
                    </div>
                    
                    <div class="insurance-section">
                        <div class="section-label">PACKAGE</div>
                        <div style="font-size: 0.85em; color: #333;">{package}</div>
                    </div>
                    
                    <div class="emp-contact">M: {phone}</div>
                </div>
            </div>
        </div>
        '''
        st.markdown(pass_html, unsafe_allow_html=True)
        
        if 'employee_submissions' not in st.session_state:
            st.session_state.employee_submissions = []
        if 'employee_submitted' not in st.session_state:
            st.session_state.employee_submitted = False
        
        current_passport = str(emp.get('Passport number', ''))
        if current_passport.lower() == 'missing' or pd.isna(emp.get('Passport number')):
            current_passport = ''
        current_marital = str(emp.get('Marital Status', ''))
        if current_marital.lower() == 'missing' or pd.isna(emp.get('Marital Status')):
            current_marital = ''
        current_visa = str(emp.get('Visa File Number', ''))
        if current_visa.lower() == 'missing' or pd.isna(emp.get('Visa File Number')):
            current_visa = ''
        
        st.markdown('''
        <style>
            .update-section {
                background: white; border-radius: 16px; padding: 30px;
                max-width: 420px; margin: 20px auto;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .update-title {
                font-size: 1.1em; font-weight: 600; color: #0a2351;
                margin-bottom: 20px; text-align: center;
            }
            .current-value { font-size: 0.8em; color: #888; margin-top: 2px; }
        </style>
        ''', unsafe_allow_html=True)
        
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            if st.session_state.employee_submitted:
                st.success("Your details have been submitted successfully!")
                if st.button("Submit Another Update", use_container_width=True):
                    st.session_state.employee_submitted = False
                    st.rerun()
            else:
                st.markdown('<div class="update-title">Confirm & Update Details</div>', unsafe_allow_html=True)
                
                with st.form("update_form"):
                    st.markdown("**Please review your details above and provide any updates:**")
                    
                    data_correct = st.checkbox("I confirm the displayed information is correct", value=False)
                    
                    st.markdown("---")
                    st.markdown("**Update Missing/Changed Information:**")
                    
                    new_passport = st.text_input("Passport Number (if renewed)", 
                        value=current_passport, 
                        placeholder="Enter passport number",
                        help=f"Current: {current_passport if current_passport else 'Not on file'}")
                    
                    marital_options = ['', 'Single', 'Married', 'Divorced', 'Widowed', 'Other']
                    marital_index = 0
                    if current_marital in marital_options:
                        marital_index = marital_options.index(current_marital)
                    new_marital = st.selectbox("Marital Status", 
                        options=marital_options,
                        index=marital_index,
                        help=f"Current: {current_marital if current_marital else 'Not on file'}")
                    
                    new_visa = st.text_input("Visa File Number",
                        value=current_visa,
                        placeholder="Enter visa file number",
                        help=f"Current: {current_visa if current_visa else 'Not on file'}")
                    
                    additional_notes = st.text_area("Additional Updates/Notes", 
                        placeholder="Any other information to update...",
                        height=80)
                    
                    submitted = st.form_submit_button("Submit Update", use_container_width=True)
                    
                    if submitted:
                        submission = {
                            'Staff Number': staff_num,
                            'Employee Name': name,
                            'Submitted At': datetime.now().strftime('%Y-%m-%d %H:%M'),
                            'Data Confirmed': 'Yes' if data_correct else 'No',
                            'Passport Number': new_passport,
                            'Passport Changed': 'Yes' if new_passport != current_passport else 'No',
                            'Marital Status': new_marital,
                            'Marital Changed': 'Yes' if new_marital != current_marital else 'No',
                            'Visa File Number': new_visa,
                            'Visa Changed': 'Yes' if new_visa != current_visa else 'No',
                            'Additional Notes': additional_notes
                        }
                        save_submission(submission)
                        st.session_state.employee_submitted = True
                        st.rerun()
            
            st.markdown("<br>", unsafe_allow_html=True)
            if st.button("Sign Out", use_container_width=True):
                st.session_state.employee_data = None
                st.session_state.employee_submitted = False
                st.rerun()
            if st.button("Back to Home", use_container_width=True):
                st.session_state.employee_data = None
                st.session_state.employee_submitted = False
                st.query_params.clear()
                st.rerun()
    else:
        st.markdown('''
        <style>
            .login-wrapper {
                display: flex; justify-content: center; align-items: center;
                min-height: 70vh; padding: 20px;
            }
            .login-card {
                width: 320px;
                padding: 2.5rem 2rem;
                text-align: center;
                background: #00065f;
                border-radius: 16px;
                border: 1px solid #9c9a9a;
            }
            .login-title {
                margin-bottom: 1.5rem;
                font-size: 1.6em;
                font-weight: 500;
                color: #9c9a9a;
                text-shadow: 1px 1px 20px #9c9a9a;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            [data-testid="stVerticalBlock"] > div:has(.login-wrapper) + div {
                position: relative;
                margin-top: -280px;
                z-index: 100;
                display: flex;
                justify-content: center;
            }
            [data-testid="stVerticalBlock"] > div:has(.login-wrapper) + div > div {
                max-width: 280px;
            }
            .stTextInput input, .stDateInput input {
                border: none !important;
                border-radius: 6px !important;
                padding: 14px 16px !important;
                background: #fbfcff !important;
                color: #333 !important;
            }
            .stTextInput input::placeholder {
                color: #999 !important;
            }
            .stButton button {
                background: #9c9a9a !important;
                color: #00065f !important;
                border-radius: 6px !important;
                padding: 14px !important;
                font-weight: 600 !important;
                text-transform: uppercase !important;
                margin-top: 0.5rem !important;
            }
            .stButton button:hover {
                background: #fbfcff !important;
                color: #9c9a9a !important;
            }
        </style>
        <div class="login-wrapper">
            <div class="login-card">
                <h4 class="login-title">Log In</h4>
            </div>
        </div>
        ''', unsafe_allow_html=True)
        
        col1, col2, col3 = st.columns([0.25, 0.5, 0.25])
        with col2:
            emp_id = st.text_input("Employee ID", placeholder="Employee ID", key="emp_id", label_visibility="collapsed")
            dob = st.date_input("Date of Birth", value=pd.to_datetime("1980-01-01"), min_value=pd.to_datetime("1940-01-01"), max_value=pd.to_datetime("2010-01-01"), key="emp_dob", format="DD/MM/YYYY", label_visibility="collapsed")
            
            if st.button("Login", use_container_width=True):
                if emp_id and dob:
                    dob_str = dob.strftime("%d/%m/%Y")
                    result = validate_employee(emp_id, dob_str)
                    if result:
                        st.session_state.employee_data = result
                        st.rerun()
                    else:
                        st.error("Invalid Employee ID or Date of Birth")
                else:
                    st.warning("Please enter Employee ID and Date of Birth")
            
            if st.button("Back to Home", use_container_width=True, key="emp_back"):
                st.query_params.clear()
                st.rerun()

def render_admin():
    st.markdown(CSS, unsafe_allow_html=True)
    
    if 'admin_authenticated' not in st.session_state:
        st.session_state.admin_authenticated = False
    
    if st.session_state.admin_authenticated:
        st.markdown('''
        <div class="page-container">
            <div class="admin-card" style="max-width: 450px;">
                <h2 class="admin-title">HR Administration</h2>
            </div>
        </div>
        ''', unsafe_allow_html=True)
        
        col1, col2, col3 = st.columns([1, 1, 1])
        with col2:
            st.markdown('<p style="color:#39FF14; font-size:0.85em; letter-spacing:0.1em; text-align:center; margin-bottom:5px;">FOLDER</p>', unsafe_allow_html=True)
            if st.button("Insurance Renewal 2026", use_container_width=True, key="btn_insurance"):
                st.query_params["page"] = "insurance_renewal"
                st.rerun()
            
            st.markdown('<br>', unsafe_allow_html=True)
            st.markdown('<p style="color:#39FF14; font-size:0.85em; letter-spacing:0.1em; text-align:center; margin-bottom:5px;">REPORTS</p>', unsafe_allow_html=True)
            if st.button("Employee Submissions", use_container_width=True, key="btn_submissions"):
                st.query_params["page"] = "employee_submissions"
                st.rerun()
            
            st.markdown('<br>', unsafe_allow_html=True)
            if st.button("Sign Out", use_container_width=True):
                st.session_state.admin_authenticated = False
                st.rerun()
            if st.button("Back to Home", use_container_width=True):
                st.query_params.clear()
                st.rerun()
    else:
        st.markdown('''
        <style>
            .login-wrapper {
                display: flex; justify-content: center; align-items: center;
                min-height: 70vh; padding: 20px;
            }
            .login-card {
                width: 320px;
                padding: 2.5rem 2rem;
                text-align: center;
                background: #00065f;
                border-radius: 16px;
                border: 1px solid #9c9a9a;
            }
            .login-title {
                margin-bottom: 1.5rem;
                font-size: 1.6em;
                font-weight: 500;
                color: #9c9a9a;
                text-shadow: 1px 1px 20px #9c9a9a;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            [data-testid="stVerticalBlock"] > div:has(.login-wrapper) + div {
                position: relative;
                margin-top: -220px;
                z-index: 100;
                display: flex;
                justify-content: center;
            }
            [data-testid="stVerticalBlock"] > div:has(.login-wrapper) + div > div {
                max-width: 280px;
            }
            .stTextInput input {
                border: none !important;
                border-radius: 6px !important;
                padding: 14px 16px !important;
                background: #fbfcff !important;
                color: #333 !important;
            }
            .stTextInput input::placeholder {
                color: #999 !important;
            }
            .stButton button {
                background: #9c9a9a !important;
                color: #00065f !important;
                border-radius: 6px !important;
                padding: 14px !important;
                font-weight: 600 !important;
                text-transform: uppercase !important;
                margin-top: 0.5rem !important;
            }
            .stButton button:hover {
                background: #fbfcff !important;
                color: #9c9a9a !important;
            }
        </style>
        <div class="login-wrapper">
            <div class="login-card">
                <h4 class="login-title">Admin</h4>
            </div>
        </div>
        ''', unsafe_allow_html=True)
        
        col1, col2, col3 = st.columns([0.25, 0.5, 0.25])
        with col2:
            password = st.text_input("Password", type="password", key="admin_pwd", label_visibility="collapsed", placeholder="Enter Password")
            if st.button("Login", use_container_width=True):
                if password == ADMIN_PASSWORD and ADMIN_PASSWORD:
                    st.session_state.admin_authenticated = True
                    st.rerun()
                else:
                    st.error("Invalid password")
            
            if st.button("Back to Home", use_container_width=True, key="back_home"):
                st.query_params.clear()
                st.rerun()

def render_insurance_renewal():
    st.markdown(CSS, unsafe_allow_html=True)
    
    if 'admin_authenticated' not in st.session_state or not st.session_state.admin_authenticated:
        st.query_params["page"] = "admin"
        st.rerun()
        return
    
    st.markdown('''
    <div class="page-container">
        <div class="admin-card" style="max-width: 450px;">
            <h2 class="admin-title">Insurance Renewal 2026</h2>
        </div>
    </div>
    ''', unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 1, 1])
    with col2:
        if st.button("Life Insurance", use_container_width=True, key="btn_life"):
            st.query_params["page"] = "life_insurance"
            st.rerun()
        if st.button("Medical Insurance", use_container_width=True, key="btn_medical"):
            st.query_params["page"] = "medical_insurance"
            st.rerun()
        st.markdown('<br>', unsafe_allow_html=True)
        if st.button("Back to Admin", use_container_width=True):
            st.query_params["page"] = "admin"
            st.rerun()

def render_life_insurance():
    st.markdown(CSS, unsafe_allow_html=True)
    
    if 'admin_authenticated' not in st.session_state or not st.session_state.admin_authenticated:
        st.query_params["page"] = "admin"
        st.rerun()
        return
    
    st.markdown('''
    <div class="page-container">
        <h1 class="page-title">Life Insurance</h1>
        <p class="page-message">Life Insurance section coming soon.</p>
    </div>
    ''', unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 1, 1])
    with col2:
        if st.button("Back to Insurance Renewal", use_container_width=True):
            st.query_params["page"] = "insurance_renewal"
            st.rerun()

def render_medical_insurance():
    st.markdown(CSS, unsafe_allow_html=True)
    
    if 'admin_authenticated' not in st.session_state or not st.session_state.admin_authenticated:
        st.query_params["page"] = "admin"
        st.rerun()
        return
    
    st.markdown('''
    <div class="page-container">
        <h1 class="page-title">Medical Insurance</h1>
        <p class="page-message">Medical Insurance section coming soon.</p>
    </div>
    ''', unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 1, 1])
    with col2:
        if st.button("Back to Insurance Renewal", use_container_width=True):
            st.query_params["page"] = "insurance_renewal"
            st.rerun()

def render_employee_submissions():
    st.markdown(CSS, unsafe_allow_html=True)
    
    if 'admin_authenticated' not in st.session_state or not st.session_state.admin_authenticated:
        st.query_params["page"] = "admin"
        st.rerun()
        return
    
    st.markdown('''
    <div class="page-container" style="min-height: auto; padding: 20px;">
        <h1 class="page-title">Employee Submissions</h1>
        <p class="page-message">View and export employee data confirmations and updates.</p>
    </div>
    ''', unsafe_allow_html=True)
    
    df = get_all_submissions()
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        if not df.empty:
            st.markdown(f"**Total Submissions:** {len(df)}")
            
            csv = df.to_csv(index=False)
            st.download_button(
                label="Download CSV Export",
                data=csv,
                file_name=f"employee_submissions_{datetime.now().strftime('%Y%m%d')}.csv",
                mime="text/csv",
                use_container_width=True
            )
            
            st.markdown("<br>", unsafe_allow_html=True)
            st.dataframe(df, use_container_width=True, height=400)
        else:
            st.info("No employee submissions yet.")
        
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("Back to Admin", use_container_width=True):
            st.query_params["page"] = "admin"
            st.rerun()

def main():
    page = get_page()
    
    if page == "home":
        render_home()
    elif page == "employees":
        render_employees()
    elif page == "onboarding":
        render_onboarding()
    elif page == "external":
        render_coming_soon("External Users")
    elif page == "admin":
        render_admin()
    elif page == "insurance_renewal":
        render_insurance_renewal()
    elif page == "life_insurance":
        render_life_insurance()
    elif page == "medical_insurance":
        render_medical_insurance()
    elif page == "employee_submissions":
        render_employee_submissions()
    else:
        render_home()

if __name__ == "__main__":
    main()
