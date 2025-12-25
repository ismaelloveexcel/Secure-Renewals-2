import streamlit as st
import pandas as pd
import os
import base64
from datetime import datetime, timedelta
import json
from io import BytesIO
from models import init_db, get_db, AuditTrail, ChangeRequest

init_db()

def get_logo_base64():
    logo_path = "attached_assets/Untitled_design_(7)_1766689233925.gif"
    if os.path.exists(logo_path):
        with open(logo_path, "rb") as f:
            return base64.b64encode(f.read()).decode()
    return None

LOGO_BASE64 = get_logo_base64()

st.set_page_config(
    page_title="Medical Insurance Verification | Baynunah",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="collapsed"
)

POLICY_YEAR = "2026"
RENEWAL_DEADLINE = datetime(2026, 1, 31)
SESSION_TIMEOUT_MINUTES = 15

CUSTOM_CSS = """
<style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .stDeployButton {display: none;}
    
    .stApp {
        font-family: 'Poppins', sans-serif;
    }
    
    .login-page [data-testid="stAppViewBlockContainer"] {
        padding: 0 !important;
        max-width: 100% !important;
    }
    
    .login-shell {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 16px;
        box-sizing: border-box;
    }
    
    .login-card {
        background: #1a1a2e;
        padding: 22px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        width: 100%;
        max-width: 280px;
        text-align: center;
        border: 1px solid rgba(255,255,255,0.1);
    }
    
    .login-card-header {
        margin-bottom: 16px;
    }
    
    .login-card .login-logo-img {
        width: 45px;
        height: 45px;
        margin-bottom: 12px;
    }
    
    .login-card h1 {
        color: #e6ebff;
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 3px 0;
        line-height: 1.3;
    }
    
    .login-card .subtitle {
        color: #b5bcd9;
        font-size: 11px;
        margin: 0;
    }
    
    .login-card .policy-tag {
        display: inline-block;
        background: rgba(56, 182, 255, 0.15);
        color: #38b6ff;
        padding: 4px 12px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
        margin-top: 8px;
    }
    
    .login-help {
        margin-top: 12px;
        font-size: 11px;
        color: #888;
    }
    
    .login-help a {
        color: #25D366;
        text-decoration: none;
        font-weight: 600;
    }
    
    .main-header {
        background: #1E1B5C;
        padding: 14px 20px;
        margin-bottom: 16px;
        color: white;
        border-radius: 10px;
    }
    
    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .company-logo {
        width: 34px;
        height: 34px;
        background: white;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
    }
    
    .company-logo-img {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        object-fit: contain;
    }
    
    .header-title h1 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
    }
    
    .header-title .subtitle {
        font-size: 11px;
        opacity: 0.8;
        margin-top: 2px;
        font-weight: 400;
    }
    
    .header-right {
        display: flex;
        align-items: center;
        gap: 20px;
    }
    
    .policy-badge {
        background: rgba(255,255,255,0.15);
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 11px;
        font-weight: 500;
    }
    
    .user-block {
        text-align: right;
    }
    
    .user-name {
        font-size: 12px;
        font-weight: 500;
    }
    
    .user-id {
        font-size: 10px;
        opacity: 0.7;
        margin-bottom: 3px;
    }
    
    .header-signout-link {
        display: inline-block;
        background: rgba(255,255,255,0.15);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        text-decoration: none;
        margin-top: 3px;
    }
    
    .header-signout-link:hover {
        background: rgba(255,255,255,0.25);
    }
    
    .status-strip {
        background: #1a1a2e;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding: 10px 24px;
        margin: 0 -60px 16px -60px;
        display: flex;
        justify-content: center;
        gap: 32px;
        font-size: 12px;
        color: #b5bcd9;
    }
    
    .status-item {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    
    .glass-card {
        background: #1a1a2e;
        border-radius: 10px;
        padding: 18px;
        margin-bottom: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255,255,255,0.08);
    }
    
    .card-title {
        color: #e6ebff;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1.2px;
        margin-bottom: 14px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .snapshot-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px 32px;
    }
    
    .snapshot-item {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }
    
    .snapshot-label {
        color: #888;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .snapshot-value {
        color: #e6ebff;
        font-size: 13px;
        font-weight: 500;
    }
    
    .member-card {
        background: #16213e;
        border-radius: 8px;
        padding: 14px;
        margin-bottom: 16px;
        border: 1px solid rgba(255,255,255,0.08);
    }
    
    .member-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .member-name {
        color: #e6ebff;
        font-size: 13px;
        font-weight: 600;
    }
    
    .member-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .badge-principal {
        background: rgba(56, 182, 255, 0.15);
        color: #38b6ff;
    }
    
    .badge-spouse {
        background: rgba(236, 72, 153, 0.15);
        color: #ec4899;
    }
    
    .badge-child {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
    }
    
    .member-details {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px 20px;
    }
    
    .member-detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        padding: 2px 0;
    }
    
    .member-detail-label {
        color: #888;
    }
    
    .member-detail-value {
        color: #e6ebff;
        font-weight: 500;
    }
    
    .missing-value {
        color: #ff9800;
        font-size: 11px;
    }
    
    .member-divider {
        border: none;
        border-top: 1px solid rgba(255,255,255,0.1);
        margin: 16px 0;
    }
    
    .missing-text {
        color: #ff9800 !important;
    }
    
    .edit-section-header {
        color: #ff9800;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin: 12px 0 8px 0;
        padding-top: 10px;
        border-top: 1px solid rgba(255,255,255,0.1);
    }
    
    .member-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .grid-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
    }
    
    .grid-cell {
        min-height: 32px;
    }
    
    .field-label {
        color: #888;
        font-size: 10px;
        text-transform: uppercase;
        margin-bottom: 3px;
    }
    
    .field-value {
        color: #e6ebff;
        font-weight: 500;
        font-size: 13px;
    }
    
    .missing-field-text {
        color: #ff9800;
        font-weight: 500;
    }
    
    .missing-info-banner {
        background: rgba(255, 152, 0, 0.1);
        border-left: 2px solid #ff9800;
        border-radius: 0 3px 3px 0;
        padding: 10px 12px;
        margin-top: 14px;
        display: flex;
        align-items: flex-start;
        gap: 8px;
    }
    
    .missing-icon {
        color: #ff9800;
        font-size: 14px;
    }
    
    .missing-title {
        color: #ff9800;
        font-weight: 600;
        font-size: 11px;
    }
    
    .missing-desc {
        color: #b5bcd9;
        font-size: 10px;
    }
    
    .inline-edit-section {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        margin-top: 14px;
        padding-top: 12px;
    }
    
    .inline-edit-title {
        color: #ff9800;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin-bottom: 10px;
    }
    
    .missing-banner {
        background: rgba(255, 152, 0, 0.1);
        border-left: 3px solid #ff9800;
        border-radius: 0 6px 6px 0;
        padding: 12px 14px;
        margin: 12px 0;
        display: flex;
        align-items: center;
        gap: 10px;
        color: #ff9800;
        font-size: 12px;
    }
    
    .confirmation-card {
        background: #1a1a2e;
        border-radius: 10px;
        padding: 18px;
        margin-bottom: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255,255,255,0.08);
    }
    
    .radio-option {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 8px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .radio-option:hover {
        border-color: #38b6ff;
    }
    
    .radio-option.selected {
        border-color: #38b6ff;
        background: rgba(56, 182, 255, 0.1);
    }
    
    .success-message {
        background: rgba(22, 163, 74, 0.15);
        border-radius: 10px;
        padding: 24px;
        text-align: center;
        margin: 12px 0;
        border: 1px solid rgba(22, 163, 74, 0.3);
    }
    
    .success-icon {
        width: 48px;
        height: 48px;
        background: rgba(22, 163, 74, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 12px;
        font-size: 22px;
        color: #22c55e;
    }
    
    .success-title {
        color: #e6ebff;
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 5px;
    }
    
    .success-desc {
        color: #b5bcd9;
        font-size: 12px;
        line-height: 1.5;
    }
    
    .change-log {
        background: rgba(255, 152, 0, 0.1);
        border: 1px solid rgba(255, 152, 0, 0.3);
        border-radius: 6px;
        padding: 10px;
        margin-top: 10px;
    }
    
    .change-item {
        display: flex;
        gap: 6px;
        padding: 5px 0;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        font-size: 12px;
        color: #e6ebff;
    }
    
    .change-item:last-child {
        border-bottom: none;
    }
    
    .old-value {
        color: #f87171;
        text-decoration: line-through;
    }
    
    .new-value {
        color: #22c55e;
        font-weight: 500;
    }
    
    .login-container {
        max-width: 280px;
        margin: 0 auto;
        text-align: center;
        padding-top: 8vh;
    }
    
    @media (max-height: 700px) {
        .login-container {
            padding-top: 3vh;
        }
    }
    
    .login-form-wrapper {
        max-width: 300px;
        margin: 0 auto;
    }
    
    .content-wrapper {
        max-width: 700px;
        margin: 0 auto;
        padding: 0 16px;
    }
    
    .login-header {
        margin-bottom: 12px;
    }
    
    .login-logo {
        width: 36px;
        height: 36px;
        background: #1E1B5C;
        border-radius: 10px;
        margin: 0 auto 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
    }
    
    .login-logo-img {
        width: 52px;
        height: 52px;
        border-radius: 8px;
        margin: 0 auto 10px;
        display: block;
        object-fit: contain;
    }
    
    .login-title {
        color: #e6ebff;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 2px;
        line-height: 1.2;
    }
    
    @media (max-width: 480px) {
        .login-logo-img {
            width: 56px;
            height: 56px;
        }
        .login-title {
            font-size: 20px;
        }
    }
    
    .login-subtitle {
        color: #b5bcd9;
        font-size: 11px;
        font-weight: 400;
        margin-top: 2px;
    }
    
    .login-badge {
        display: inline-block;
        background: rgba(56, 182, 255, 0.15);
        color: #38b6ff;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
        margin-top: 6px;
    }
    
    .stButton > button {
        background: #1E1B5C;
        color: white;
        border: none;
        padding: 10px 22px;
        font-weight: 600;
        font-size: 12px;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        border-radius: 6px;
        width: 100%;
        transition: all 0.2s ease;
        font-family: 'Poppins', sans-serif;
    }
    
    .stButton > button:hover {
        background: #2d2a6e;
    }
    
    .signout-btn button {
        background: transparent !important;
        border: 1px solid rgba(255,255,255,0.2) !important;
        color: #b5bcd9 !important;
        padding: 6px 14px !important;
        font-size: 11px !important;
        letter-spacing: 0.5px !important;
    }
    
    .signout-btn button:hover {
        background: rgba(255,255,255,0.1) !important;
    }
    
    .section-label {
        color: #b5bcd9;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin-bottom: 6px;
        font-weight: 600;
    }
    
    div[data-testid="stForm"] {
        background: #1a1a2e;
        padding: 14px;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        border: 1px solid rgba(255,255,255,0.08);
    }
    
    div[data-testid="stForm"] [data-testid="stVerticalBlock"] {
        gap: 0.5rem !important;
    }
    
    .stTextInput > div > div > input {
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.15);
        padding: 10px 12px;
        font-family: 'Poppins', sans-serif;
        font-size: 13px;
        background: #16213e;
        color: #e6ebff;
    }
    
    .stTextInput label {
        font-size: 12px !important;
        margin-bottom: 4px !important;
        color: #b5bcd9 !important;
    }
    
    .stTextInput > div > div > input:focus {
        border-color: #38b6ff;
        box-shadow: 0 0 0 2px rgba(56, 182, 255, 0.15);
    }
    
    .stSelectbox > div > div {
        border-radius: 6px;
        font-size: 13px;
    }
    
    .stSelectbox label {
        font-size: 12px !important;
        color: #b5bcd9 !important;
    }
    
    .stTextArea > div > div > textarea {
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.15);
        font-family: 'Poppins', sans-serif;
        font-size: 12px;
        background: #16213e;
        color: #e6ebff;
    }
    
    .stTextArea label {
        font-size: 12px !important;
        color: #b5bcd9 !important;
    }
    
    .stTextArea > div > div > textarea:focus {
        border-color: #38b6ff;
        box-shadow: 0 0 0 2px rgba(56, 182, 255, 0.15);
    }
    
    .stRadio > div {
        gap: 6px;
    }
    
    .stRadio label {
        padding: 10px 14px !important;
        font-size: 13px !important;
        border: 1px solid rgba(255,255,255,0.15) !important;
        border-radius: 6px !important;
        margin-bottom: 6px !important;
        color: #e6ebff !important;
    }
    
    .stCheckbox label {
        font-size: 13px !important;
        color: #e6ebff !important;
    }
    
    .stCheckbox label span {
        color: #e6ebff !important;
    }
    
    .expired-notice {
        background: #1a1a2e;
        border-radius: 10px;
        padding: 32px 24px;
        text-align: center;
        max-width: 360px;
        margin: 60px auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255,255,255,0.08);
    }
    
    .inline-error {
        color: #f87171;
        font-size: 11px;
        margin-top: 3px;
    }
    
    .field-hint {
        color: #888;
        font-size: 11px;
        margin-top: 3px;
    }
    
    p {
        color: #b5bcd9 !important;
    }
</style>
"""

SESSION_TIMEOUT_JS = f"""
<script>
    var sessionTimeout = {SESSION_TIMEOUT_MINUTES * 60 * 1000};
    var warningTime = {(SESSION_TIMEOUT_MINUTES - 2) * 60 * 1000};
    var redirectDelay = 2000; // Delay before redirecting to login after session expires
    var sessionTimer;
    var warningTimer;
    
    // Safely insert element at the top of document body
    function insertAtBodyTop(element) {{
        if (document.body.firstChild) {{
            document.body.insertBefore(element, document.body.firstChild);
        }} else {{
            document.body.appendChild(element);
        }}
    }}
    
    // Create warning banner element
    function createWarningBanner() {{
        var banner = document.createElement('div');
        banner.id = 'session-warning-banner';
        banner.innerHTML = '⚠️ Your session will expire in 2 minutes due to inactivity. Please save your work.';
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ff9800;color:#000;padding:12px 20px;text-align:center;font-weight:600;font-size:14px;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
        return banner;
    }}
    
    function removeWarningBanner() {{
        var banner = document.getElementById('session-warning-banner');
        if (banner) banner.remove();
    }}
    
    function resetTimers() {{
        clearTimeout(sessionTimer);
        clearTimeout(warningTimer);
        removeWarningBanner();
        
        warningTimer = setTimeout(function() {{
            insertAtBodyTop(createWarningBanner());
        }}, warningTime);
        
        sessionTimer = setTimeout(function() {{
            removeWarningBanner();
            var expiredBanner = document.createElement('div');
            expiredBanner.innerHTML = '🔒 Session expired due to inactivity. Redirecting to login...';
            expiredBanner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#f44336;color:#fff;padding:14px 20px;text-align:center;font-weight:600;font-size:14px;z-index:9999;';
            insertAtBodyTop(expiredBanner);
            setTimeout(function() {{ window.location.reload(); }}, redirectDelay);
        }}, sessionTimeout);
    }}
    
    document.addEventListener('click', resetTimers);
    document.addEventListener('keypress', resetTimers);
    document.addEventListener('scroll', resetTimers);
    document.addEventListener('mousemove', resetTimers);
    
    resetTimers();
</script>
"""

DATA_FILE = "attached_assets/Medical_Insurance_Data.csv"
JOB_DATA_FILE = "attached_assets/job_data.csv"

@st.cache_data
def load_job_data():
    if os.path.exists(JOB_DATA_FILE):
        return pd.read_csv(JOB_DATA_FILE, encoding='utf-8-sig')
    return pd.DataFrame()

@st.cache_data
def load_data():
    df = pd.read_csv(DATA_FILE, encoding='utf-8-sig')
    job_df = load_job_data()
    if not job_df.empty:
        df = df.merge(job_df[['Staff Number', 'JOB TITLE', 'DEPARTMENT']], on='Staff Number', how='left')
    return df

def save_data(df):
    df.to_csv(DATA_FILE, index=False, encoding='utf-8-sig')

def check_session_timeout():
    if 'last_activity' in st.session_state:
        last_activity = st.session_state['last_activity']
        if isinstance(last_activity, str):
            last_activity = datetime.fromisoformat(last_activity)
        elapsed = (datetime.now() - last_activity).total_seconds() / 60
        if elapsed > SESSION_TIMEOUT_MINUTES:
            st.session_state.clear()
            return True
    st.session_state['last_activity'] = datetime.now().isoformat()
    return False

def get_employee_data(df, staff_number):
    return df[df['Staff Number'] == staff_number]

def verify_credentials(df, staff_number, dob_input):
    """
    Verify user credentials using Staff Number and Date of Birth.
    
    Security Note: For production environments, consider implementing:
    - Rate limiting on failed login attempts (e.g., max 5 attempts per 15 minutes)
    - Account lockout after repeated failures
    - Logging of failed authentication attempts for security monitoring
    """
    principals = df[(df['Relation'] == 'PRINCIPAL') & (df['Staff Number'] == staff_number)]
    if principals.empty:
        return False, "Invalid Staff Number."
    
    principal = principals.iloc[0]
    dob_raw = principal.get('Date Of Birth', '')
    
    if pd.isna(dob_raw) or str(dob_raw).strip() == '' or str(dob_raw).strip() == 'nan':
        return False, "Account not properly configured. Please contact HR."
    
    dob_str = str(dob_raw).strip()
    
    try:
        if ' ' in dob_str:
            parts = dob_str.split(' ')
            dob_str = parts[0]
        
        formats_to_try = [
            ('%d/%m/%Y', '%d/%m/%Y'),
            ('%m/%d/%Y', '%d/%m/%Y'),
            ('%Y-%m-%d', '%d/%m/%Y'),
        ]
        
        actual_dob = None
        for parse_fmt, output_fmt in formats_to_try:
            try:
                parsed_date = datetime.strptime(dob_str, parse_fmt)
                if parsed_date.year < 1920 or parsed_date.year > 2025:
                    continue
                actual_dob = parsed_date.strftime(output_fmt)
                break
            except ValueError:
                continue
        
        if actual_dob is None:
            actual_dob = dob_str
        
        if dob_input.strip() == actual_dob:
            return True, None
        else:
            return False, "Invalid credentials. Please check your Staff Number and Date of Birth."
    except Exception:
        return False, "Account verification issue. Please contact HR."

def format_field(value):
    if pd.isna(value) or str(value).strip() == "" or str(value).strip() == "nan":
        return None
    return str(value).strip()

def check_link_expired():
    return datetime.now() > RENEWAL_DEADLINE

def render_expired_page():
    st.markdown(CUSTOM_CSS, unsafe_allow_html=True)
    st.markdown("""
    <div class="expired-notice">
        <div style="font-size: 48px; margin-bottom: 20px;">⏰</div>
        <h2 style="color: #e6ebff; font-size: 1.4em; margin-bottom: 12px;">Verification Period Ended</h2>
        <p style="color: #b5bcd9; font-size: 1em; line-height: 1.6;">The medical insurance renewal verification period has closed.</p>
        <p style="color: #b5bcd9; font-size: 0.95em; margin-top: 20px;">For any changes, please contact HR directly.</p>
        <a href="https://wa.me/971564966546" target="_blank" style="display: inline-block; margin-top: 25px; background: #25D366; color: white; padding: 14px 30px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 0.95em;">
            📱 Contact HR via WhatsApp
        </a>
    </div>
    """, unsafe_allow_html=True)

def render_login():
    st.markdown(CUSTOM_CSS, unsafe_allow_html=True)
    st.markdown("""
    <style>
        [data-testid="stAppViewBlockContainer"] {
            padding-top: 1rem !important;
            padding-bottom: 1rem !important;
        }
        [data-testid="stVerticalBlock"] {
            gap: 0.5rem !important;
        }
    </style>
    """, unsafe_allow_html=True)
    
    logo_html = f'<img src="data:image/gif;base64,{LOGO_BASE64}" alt="Logo" style="width:56px;height:56px;display:block;margin:0 auto 10px;">' if LOGO_BASE64 else ''
    
    st.markdown(f"""
    <div style="text-align:center; padding-top:3vh;">
        {logo_html}
        <h1 style="color:#1E1B5C; font-size:24px; font-weight:600; margin:0 0 4px 0; line-height:1.2;">Medical Insurance<br>Verification</h1>
        <p style="color:#888; font-size:13px; margin:0;">Employee Self-Service Portal</p>
        <span style="display:inline-block; background:rgba(30,27,92,0.08); color:#1E1B5C; padding:5px 14px; border-radius:12px; font-size:12px; font-weight:600; margin-top:10px;">Policy Year {POLICY_YEAR}</span>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 1.5, 1])
    with col2:
        with st.form("login_form"):
            staff_number = st.text_input(
                "Staff Number",
                placeholder="e.g., BAYN00001",
                key="staff_input"
            )
            
            dob_input = st.text_input(
                "Date of Birth",
                placeholder="DD/MM/YYYY",
                key="dob_input"
            )
            
            submitted = st.form_submit_button("Sign In", use_container_width=True)
            
            if submitted:
                if not staff_number:
                    st.error("Please enter your Staff Number.")
                elif not dob_input:
                    st.error("Please enter your Date of Birth (DD/MM/YYYY).")
                else:
                    df = load_data()
                    is_valid, error_msg = verify_credentials(df, staff_number.upper(), dob_input)
                    
                    if is_valid:
                        st.session_state['authenticated'] = True
                        st.session_state['staff_number'] = staff_number.upper()
                        st.session_state['login_time'] = datetime.now().isoformat()
                        st.rerun()
                    else:
                        st.error(error_msg)
        
        st.markdown("""
        <div style="text-align:center; margin-top:12px; font-size:13px; color:#aaa;">
            Need help? <a href="https://wa.me/971564966546" target="_blank" style="color:#25D366; text-decoration:none; font-weight:600;">WhatsApp HR</a>
        </div>
        """, unsafe_allow_html=True)

def render_header(principal_name, staff_number):
    logo_html = f'<img src="data:image/gif;base64,{LOGO_BASE64}" alt="Logo" class="company-logo-img">' if LOGO_BASE64 else '<div class="company-logo">🏥</div>'
    st.markdown(f"""
    <div class="main-header">
        <div class="header-content">
            <div class="header-left">
                {logo_html}
                <div class="header-title">
                    <h1>Medical Insurance Verification</h1>
                    <div class="subtitle">Employee Self-Service Portal</div>
                </div>
            </div>
            <div class="header-right">
                <div class="policy-badge">Policy Year {POLICY_YEAR}</div>
                <div class="user-block">
                    <div class="user-name">{principal_name}</div>
                    <div class="user-id">{staff_number}</div>
                </div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    header_cols = st.columns([5, 1])
    with header_cols[1]:
        if st.button("Sign Out", key="header_signout", type="secondary"):
            st.session_state.clear()
            st.rerun()

def render_status_strip():
    days_left = (RENEWAL_DEADLINE - datetime.now()).days
    deadline_str = RENEWAL_DEADLINE.strftime('%d %B %Y')
    st.markdown(f"""
    <div class="status-strip">
        <div class="status-item">
            <span>⏱</span>
            <span>Session timeout: {SESSION_TIMEOUT_MINUTES} min</span>
        </div>
        <div class="status-item">
            <span>📅</span>
            <span>Deadline: {deadline_str} ({days_left} days left)</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

def render_employee_snapshot(principal, staff_number):
    job_title = format_field(principal.get('JOB TITLE')) or format_field(principal.get('Job Title')) or "—"
    department = format_field(principal.get('DEPARTMENT')) or format_field(principal.get('Department')) or "—"
    emp_name = format_field(principal['Principal Name']) or '—'
    
    st.markdown(f"""
    <div class="glass-card">
        <div class="card-title">👤 Employee Snapshot</div>
        <div class="snapshot-grid">
            <div class="snapshot-item">
                <span class="snapshot-label">Employee Number</span>
                <span class="snapshot-value">{staff_number}</span>
            </div>
            <div class="snapshot-item">
                <span class="snapshot-label">Job Title</span>
                <span class="snapshot-value">{job_title}</span>
            </div>
            <div class="snapshot-item">
                <span class="snapshot-label">Employee Name</span>
                <span class="snapshot-value">{emp_name}</span>
            </div>
            <div class="snapshot-item">
                <span class="snapshot-label">Department</span>
                <span class="snapshot-value">{department}</span>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

def format_emirates_id(eid):
    if not eid:
        return None
    eid_str = str(eid).replace(' ', '').replace('-', '')
    if len(eid_str) == 15:
        return f"{eid_str[:3]}-{eid_str[3:7]}-{eid_str[7:14]}-{eid_str[14]}"
    return eid_str

def validate_emirates_id(eid):
    if not eid:
        return True, ""
    eid_str = str(eid).replace(' ', '').replace('-', '')
    if len(eid_str) != 15:
        return False, "Emirates ID must be 15 digits"
    if not eid_str.isdigit():
        return False, "Emirates ID must contain only numbers"
    if not eid_str.startswith('784'):
        return False, "Emirates ID must start with 784"
    return True, ""

def validate_date_of_birth(dob_str):
    if not dob_str:
        return True, ""
    try:
        if '/' in dob_str:
            parts = dob_str.split('/')
            if len(parts) == 3:
                day, month, year = int(parts[0]), int(parts[1]), int(parts[2])
                if year < 100:
                    year += 1900 if year > 25 else 2000
                dob = datetime(year, month, day)
            else:
                return False, "Invalid date format. Use DD/MM/YYYY"
        else:
            return False, "Invalid date format. Use DD/MM/YYYY"
        
        today = datetime.now()
        if dob > today:
            return False, "Date of birth cannot be in the future"
        
        age = (today - dob).days / 365.25
        if age > 120:
            return False, "Date of birth seems too old (over 120 years)"
        if age < 0:
            return False, "Invalid date of birth"
        
        return True, ""
    except (ValueError, IndexError):
        return False, "Invalid date format. Use DD/MM/YYYY"

def log_audit_trail(action, staff_number, member_number, field, old_value, new_value, user_type="employee"):
    try:
        db = get_db()
        if db:
            audit_entry = AuditTrail(
                action=action,
                staff_number=staff_number,
                member_number=str(member_number) if member_number else "",
                field=field,
                old_value=str(old_value) if old_value else "",
                new_value=str(new_value) if new_value else "",
                user_type=user_type
            )
            db.add(audit_entry)
            db.commit()
            db.close()
    except Exception as e:
        print(f"Audit logging error: {e}")

def save_change_request_db(staff_number, member_number, member_name, changes, remarks):
    try:
        db = get_db()
        if db:
            for change in changes:
                request = ChangeRequest(
                    staff_number=staff_number,
                    member_number=str(member_number) if member_number else "",
                    member_name=member_name,
                    field=change.get("field", ""),
                    old_value=change.get("old", ""),
                    new_value=change.get("new", ""),
                    remarks=remarks,
                    status="pending_approval"
                )
                db.add(request)
            db.commit()
            db.close()
            return True
    except Exception as e:
        print(f"Change request save error: {e}")
    return False

def get_pending_requests():
    try:
        db = get_db()
        if db:
            requests = db.query(ChangeRequest).filter(ChangeRequest.status == "pending_approval").all()
            db.close()
            return requests
    except Exception as e:
        print(f"Error fetching pending requests: {e}")
    return []

def approve_change_request(request_id, admin_name, notes=""):
    try:
        db = get_db()
        if db:
            request = db.query(ChangeRequest).filter(ChangeRequest.id == request_id).first()
            if request:
                request.status = "approved"
                request.reviewed_by = admin_name
                request.reviewed_at = datetime.now()
                request.review_notes = notes
                db.commit()
                
                log_audit_trail(
                    "change_approved",
                    request.staff_number,
                    request.member_number,
                    request.field,
                    request.old_value,
                    request.new_value,
                    "admin"
                )
                db.close()
                return True
    except Exception as e:
        print(f"Approve error: {e}")
    return False

def reject_change_request(request_id, admin_name, notes=""):
    try:
        db = get_db()
        if db:
            request = db.query(ChangeRequest).filter(ChangeRequest.id == request_id).first()
            if request:
                request.status = "rejected"
                request.reviewed_by = admin_name
                request.reviewed_at = datetime.now()
                request.review_notes = notes
                db.commit()
                
                log_audit_trail(
                    "change_rejected",
                    request.staff_number,
                    request.member_number,
                    request.field,
                    request.old_value,
                    "",
                    "admin"
                )
                db.close()
                return True
    except Exception as e:
        print(f"Reject error: {e}")
    return False

def get_audit_trail(limit=100):
    try:
        db = get_db()
        if db:
            audits = db.query(AuditTrail).order_by(AuditTrail.timestamp.desc()).limit(limit).all()
            db.close()
            return audits
    except Exception as e:
        print(f"Error fetching audit trail: {e}")
    return []

def calculate_age(dob_str):
    if not dob_str or dob_str == "—":
        return "—"
    try:
        for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%d-%m-%Y"]:
            try:
                dob_date = datetime.strptime(dob_str.split(' ')[0], fmt)
                today = datetime.now()
                age = today.year - dob_date.year - ((today.month, today.day) < (dob_date.month, dob_date.day))
                return str(age)
            except:
                continue
        return "—"
    except:
        return "—"

def render_covered_members(employee_data, staff_number):
    for idx, (_, member) in enumerate(employee_data.iterrows()):
        relation = member['Relation']
        badge_class = "badge-principal" if relation == "PRINCIPAL" else ("badge-spouse" if relation == "SPOUSE" else "badge-child")
        member_number = member['Member Number']
        
        first_name = format_field(member.get('Member First Name')) or ''
        middle_name = format_field(member.get('Member Middle Name')) or ''
        last_name = format_field(member.get('Member Last Name')) or ''
        full_name = format_field(member.get('Member Full Name')) or f"{first_name} {middle_name} {last_name}".strip()
        full_name = ' '.join(full_name.split())
        
        dob = format_field(member.get('Date Of Birth'))
        if dob and ' ' in dob:
            dob = dob.split(' ')[0]
        dob_display = dob or "—"
        age = calculate_age(dob)
        
        gender = format_field(member.get('Gender')) or "—"
        nationality = format_field(member.get('Nationality')) or "—"
        marital_status = format_field(member.get('Marital Status')) or "—"
        current_eid = format_field(member.get('National Identity')) or ""
        current_visa = format_field(member.get('Visa Unified Number')) or ""
        current_passport = format_field(member.get('Passport number')) or ""
        
        eid_formatted = format_emirates_id(current_eid) if current_eid else ""
        eid_display = eid_formatted if eid_formatted else '<span class="missing-text">⚠ Missing</span>'
        visa_display = current_visa if current_visa else '<span class="missing-text">⚠ Missing</span>'
        passport_display = current_passport if current_passport else '<span class="missing-text">⚠ Missing</span>'
        
        missing_fields = []
        if not current_eid:
            missing_fields.append("Emirates ID")
        if not current_visa:
            missing_fields.append("Visa Unified No.")
        if not current_passport:
            missing_fields.append("Passport")
        
        saved_key = f"saved_{member_number}"
        if st.session_state.get(saved_key):
            st.success("✓ Information saved successfully!")
            del st.session_state[saved_key]
        
        st.markdown(f"""
        <div class="glass-card member-card">
            <div class="member-header">
                <span class="member-name">{full_name}</span>
                <span class="member-badge {badge_class}">{relation}</span>
            </div>
            <div class="member-grid">
                <div class="grid-row">
                    <div class="grid-cell">
                        <div class="field-label">GENDER</div>
                        <div class="field-value">{gender}</div>
                    </div>
                    <div class="grid-cell">
                        <div class="field-label">DATE OF BIRTH</div>
                        <div class="field-value">{dob_display}</div>
                    </div>
                    <div class="grid-cell">
                        <div class="field-label">AGE</div>
                        <div class="field-value">{age}</div>
                    </div>
                </div>
                <div class="grid-row">
                    <div class="grid-cell">
                        <div class="field-label">NATIONALITY</div>
                        <div class="field-value">{nationality}</div>
                    </div>
                    <div class="grid-cell">
                        <div class="field-label">MARITAL STATUS</div>
                        <div class="field-value">{marital_status}</div>
                    </div>
                    <div class="grid-cell">
                        <div class="field-label">EMIRATES ID</div>
                        <div class="field-value">{eid_display}</div>
                    </div>
                </div>
                <div class="grid-row">
                    <div class="grid-cell">
                        <div class="field-label">PASSPORT NUMBER</div>
                        <div class="field-value">{passport_display}</div>
                    </div>
                    <div class="grid-cell">
                        <div class="field-label">VISA UNIFIED NO.</div>
                        <div class="field-value">{visa_display}</div>
                    </div>
                    <div class="grid-cell"></div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        direct_inputs = {}
        validation_errors = []
        field_labels = {
            "National Identity": "Emirates ID",
            "Visa Unified Number": "Visa Unified No.",
            "Passport number": "Passport",
            "Marital Status": "Marital Status"
        }
        
        if missing_fields:
            st.markdown('<div class="edit-section-header">Complete Missing Information</div>', unsafe_allow_html=True)
            
            missing_cols = st.columns(3)
            col_idx = 0
            
            if not current_eid:
                with missing_cols[col_idx % 3]:
                    new_eid = st.text_input("Emirates ID", value="", placeholder="784-XXXX-XXXXXXX-X", key=f"eid_{idx}_{member_number}")
                    if new_eid and new_eid.strip():
                        valid, msg = validate_emirates_id(new_eid.strip())
                        if not valid:
                            validation_errors.append(msg)
                        else:
                            direct_inputs["National Identity"] = new_eid.strip()
                col_idx += 1
            
            if not current_visa:
                with missing_cols[col_idx % 3]:
                    new_visa = st.text_input("Visa Unified No.", value="", placeholder="Enter visa number", key=f"visa_{idx}_{member_number}")
                    if new_visa and new_visa.strip():
                        direct_inputs["Visa Unified Number"] = new_visa.strip()
                col_idx += 1
            
            if not current_passport:
                with missing_cols[col_idx % 3]:
                    new_passport = st.text_input("Passport Number", value="", placeholder="Enter passport", key=f"passport_{idx}_{member_number}")
                    if new_passport and new_passport.strip():
                        direct_inputs["Passport number"] = new_passport.strip()
        
        st.markdown('<div class="edit-section-header" style="color: #38b6ff;">Update Information</div>', unsafe_allow_html=True)
        
        update_cols = st.columns(3)
        with update_cols[0]:
            marital_options = ["", "SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]
            new_marital = st.selectbox("Update Marital Status", marital_options, index=0, key=f"marital_{idx}_{member_number}")
            if new_marital and new_marital != marital_status:
                direct_inputs["Marital Status"] = new_marital
        
        if validation_errors:
            for err in validation_errors:
                st.error(err)
        
        if len(direct_inputs) > 0 and len(validation_errors) == 0:
            if st.button("Save", key=f"save_member_{idx}_{member_number}", type="primary"):
                with st.spinner("Saving information..."):
                    df = load_data()
                    for field, value in direct_inputs.items():
                        old_val = ""
                        if field in df.columns:
                            old_val_series = df.loc[df['Member Number'] == member_number, field]
                            if not old_val_series.empty:
                                old_val = old_val_series.iloc[0] if pd.notna(old_val_series.iloc[0]) else ""
                        df.loc[df['Member Number'] == member_number, field] = value
                        log_audit_trail("data_added", staff_number, member_number, field_labels.get(field, field), str(old_val), value, "employee")
                    df.loc[df['Staff Number'] == staff_number, 'LastEditedByStaffNo'] = staff_number
                    df.loc[df['Staff Number'] == staff_number, 'LastEditedOn'] = datetime.now().strftime("%d/%m/%Y %I:%M %p")
                    save_data(df)
                    st.cache_data.clear()
                    st.session_state[saved_key] = True
                st.rerun()
        
        st.markdown("<hr class='member-divider'>", unsafe_allow_html=True)

def render_confirmation_section(employee_data, staff_number):
    confirmed = employee_data['EmployeeConfirmed'].iloc[0] if 'EmployeeConfirmed' in employee_data.columns else ""
    if not confirmed or str(confirmed).strip() == "":
        confirmed = employee_data['Confirmed'].iloc[0] if 'Confirmed' in employee_data.columns else ""
    already_confirmed = pd.notna(confirmed) and str(confirmed).strip() != ""
    
    if already_confirmed:
        st.markdown(f"""
        <div class="success-message">
            <div class="success-icon">✓</div>
            <div class="success-title">Information Confirmed</div>
            <div class="success-desc">You confirmed your information on {confirmed}.<br>HR will proceed with the insurance renewal.</div>
        </div>
        """, unsafe_allow_html=True)
        return
    
    if 'submission_success' in st.session_state and st.session_state['submission_success']:
        if st.session_state.get('submission_type') == 'confirmation':
            st.markdown("""
            <div class="success-message">
                <div class="success-icon">✓</div>
                <div class="success-title">Thank You!</div>
                <div class="success-desc">Your information has been confirmed.<br>HR will proceed with the renewal.</div>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown("""
            <div class="success-message">
                <div class="success-icon">📤</div>
                <div class="success-title">Change Request Submitted</div>
                <div class="success-desc">Your request requires HR approval.<br>You will be notified once reviewed.</div>
            </div>
            """, unsafe_allow_html=True)
        return
    
    st.markdown("""
    <div class="glass-card">
        <div class="card-title">✔️ Confirmation</div>
        <p style="color: #b5bcd9; font-size: 1em; margin-bottom: 20px; line-height: 1.5;">
            Please review the information above. Once you've completed any missing fields, confirm below.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    confirm_checkbox = st.checkbox(
        "I hereby confirm that all the information displayed for myself and my dependents is accurate and complete.",
        key="confirm_checkbox"
    )
    
    if st.button("Submit Confirmation", type="primary", disabled=not confirm_checkbox):
        with st.spinner("Submitting confirmation..."):
            df = load_data()
            confirmation_time = datetime.now().strftime("%d/%m/%Y %I:%M %p")
            df.loc[df['Staff Number'] == staff_number, 'EmployeeConfirmed'] = confirmation_time
            save_data(df)
            st.cache_data.clear()
            st.session_state['submission_success'] = True
            st.session_state['submission_type'] = 'confirmation'
        st.balloons()
        st.rerun()
    
    st.markdown("---")
    
    st.markdown("""
    <div style="margin-top: 20px;">
        <p style="color: #b5bcd9; font-size: 0.95em; line-height: 1.5;">
            <strong>Need other changes?</strong> Describe any additional corrections below. HR will review your request.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    change_description = st.text_area(
        "Additional changes (optional)",
        placeholder="Describe any other corrections needed. Include member name, what needs to be changed, and the correct value.\n\nExample: 'My spouse's name is spelled incorrectly. Current: John Smith, Correct: Jon Smith'",
        key="change_description",
        height=100,
        label_visibility="collapsed"
    )
    
    if change_description.strip():
        if st.button("📤 Submit Change Request", type="secondary"):
            with st.spinner("Submitting change request..."):
                principal = employee_data[employee_data['Relation'] == 'PRINCIPAL'].iloc[0]
                member_number = principal['Member Number']
                
                changes_list = [{"field": "General Change Request", "old": "", "new": change_description.strip()}]
                save_change_request_db(staff_number, member_number, "General Request", changes_list, change_description.strip())
                
                log_audit_trail("change_requested", staff_number, member_number, "General Change Request", "", change_description.strip(), "employee")
                
                df = load_data()
                df.loc[df['Staff Number'] == staff_number, 'LastEditedByStaffNo'] = staff_number
                df.loc[df['Staff Number'] == staff_number, 'LastEditedOn'] = datetime.now().strftime("%d/%m/%Y %I:%M %p")
                save_data(df)
                st.cache_data.clear()
                
                st.session_state['submission_success'] = True
                st.session_state['submission_type'] = 'change_request'
            st.rerun()

def render_dashboard():
    st.markdown(CUSTOM_CSS, unsafe_allow_html=True)
    st.markdown(SESSION_TIMEOUT_JS, unsafe_allow_html=True)
    
    staff_number = st.session_state.get('staff_number', '')
    df = load_data()
    employee_data = get_employee_data(df, staff_number)
    
    if employee_data.empty:
        st.error("No data found for your account.")
        return
    
    principal = employee_data[employee_data['Relation'] == 'PRINCIPAL'].iloc[0]
    principal_name = principal['Principal Name']
    
    render_header(principal_name, staff_number)
    
    col1, col2, col3 = st.columns([1, 2.5, 1])
    with col2:
        render_employee_snapshot(principal, staff_number)
        render_covered_members(employee_data, staff_number)
        render_confirmation_section(employee_data, staff_number)
        
        st.markdown("""
        <div style="text-align: center; margin-top: 30px; padding: 16px; color: #999; font-size: 13px;">
            Need help? <a href="https://wa.me/971564966546" target="_blank" style="color: #25D366; text-decoration: none; font-weight: 600;">WhatsApp HR Support</a>
        </div>
        """, unsafe_allow_html=True)

def generate_excel_report():
    df = load_data()
    output = BytesIO()
    
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        principals = df[df['Relation'] == 'PRINCIPAL'].copy()
        principals['Confirmed'] = principals['EmployeeConfirmed'].apply(lambda x: 'Yes' if pd.notna(x) and str(x).strip() else 'No')
        
        completion_summary = principals.groupby('Confirmed').size().reset_index(name='Count')
        completion_summary.to_excel(writer, sheet_name='Completion Overview', index=False)
        
        not_confirmed = principals[principals['Confirmed'] == 'No'][['Staff Number', 'Principal Name']].copy()
        not_confirmed.columns = ['Staff Number', 'Employee Name']
        not_confirmed.to_excel(writer, sheet_name='Pending Verification', index=False)
        
        missing_data = []
        for _, row in df.iterrows():
            missing_fields = []
            if not format_field(row.get('National Identity')):
                missing_fields.append('Emirates ID')
            if not format_field(row.get('Passport number')):
                missing_fields.append('Passport')
            if not format_field(row.get('Visa Unified Number')):
                missing_fields.append('Visa Unified Number')
            if missing_fields:
                name = format_field(row.get('Member Full Name')) or f"{format_field(row.get('Member First Name')) or ''} {format_field(row.get('Member Last Name')) or ''}".strip()
                missing_data.append({
                    'Staff Number': row['Staff Number'],
                    'Member Name': name,
                    'Relation': row['Relation'],
                    'Missing Fields': ', '.join(missing_fields)
                })
        
        if missing_data:
            pd.DataFrame(missing_data).to_excel(writer, sheet_name='Missing Data', index=False)
        
        pending_requests = get_pending_requests()
        if pending_requests:
            requests_data = [{
                'ID': r.id,
                'Staff Number': r.staff_number,
                'Member': r.member_name,
                'Field': r.field,
                'Old Value': r.old_value,
                'New Value': r.new_value,
                'Submitted': r.submitted_at.strftime('%d/%m/%Y %H:%M') if r.submitted_at else '',
                'Remarks': r.remarks
            } for r in pending_requests]
            pd.DataFrame(requests_data).to_excel(writer, sheet_name='Pending Change Requests', index=False)
    
    output.seek(0)
    return output

def render_admin_portal():
    st.markdown(CUSTOM_CSS, unsafe_allow_html=True)
    
    st.markdown("""
    <div class="main-header">
        <div class="header-content">
            <div class="header-left">
                <span class="header-title">🔐 Admin Portal</span>
            </div>
            <div class="header-right">
                <span class="policy-badge">Medical Insurance {}</span>
            </div>
        </div>
    </div>
    """.format(POLICY_YEAR), unsafe_allow_html=True)
    
    col1, col2 = st.columns([8, 1])
    with col2:
        if st.button("Sign Out", key="admin_signout"):
            st.session_state.clear()
            st.rerun()
    
    tab1, tab2, tab3, tab4 = st.tabs(["📋 Pending Approvals", "📊 Statistics", "📜 Audit Trail", "📥 Export Reports"])
    
    with tab1:
        st.subheader("Pending Change Requests")
        pending = get_pending_requests()
        
        if not pending:
            st.info("No pending change requests.")
        else:
            for request in pending:
                with st.expander(f"#{request.id} - {request.member_name} - {request.field}"):
                    st.write(f"**Staff Number:** {request.staff_number}")
                    st.write(f"**Field:** {request.field}")
                    st.write(f"**Current Value:** {request.old_value}")
                    st.write(f"**Requested Value:** {request.new_value}")
                    st.write(f"**Remarks:** {request.remarks}")
                    st.write(f"**Submitted:** {request.submitted_at.strftime('%d/%m/%Y %H:%M') if request.submitted_at else 'N/A'}")
                    
                    col1, col2 = st.columns(2)
                    with col1:
                        if st.button("✅ Approve", key=f"approve_{request.id}"):
                            if approve_change_request(request.id, st.session_state.get('admin_name', 'Admin')):
                                st.success("Approved!")
                                st.rerun()
                    with col2:
                        if st.button("❌ Reject", key=f"reject_{request.id}"):
                            if reject_change_request(request.id, st.session_state.get('admin_name', 'Admin')):
                                st.warning("Rejected")
                                st.rerun()
    
    with tab2:
        st.subheader("Verification Statistics")
        df = load_data()
        principals = df[df['Relation'] == 'PRINCIPAL']
        
        total = len(principals)
        confirmed = len(principals[principals['EmployeeConfirmed'].notna() & (principals['EmployeeConfirmed'] != '')])
        pending_count = total - confirmed
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Total Employees", total)
        with col2:
            st.metric("Confirmed", confirmed, delta=f"{confirmed/total*100:.1f}%" if total > 0 else "0%")
        with col3:
            st.metric("Pending", pending_count)
        
        if total > 0:
            st.progress(confirmed / total)
        
        st.subheader("Missing Data Summary")
        missing_eid = len(df[df['National Identity'].isna() | (df['National Identity'] == '')])
        missing_passport = len(df[df['Passport number'].isna() | (df['Passport number'] == '')])
        missing_visa = len(df[df['Visa Unified Number'].isna() | (df['Visa Unified Number'] == '')])
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Missing Emirates ID", missing_eid)
        with col2:
            st.metric("Missing Passport", missing_passport)
        with col3:
            st.metric("Missing Visa Number", missing_visa)
    
    with tab3:
        st.subheader("Audit Trail")
        audits = get_audit_trail(50)
        
        if not audits:
            st.info("No audit entries found.")
        else:
            audit_data = [{
                'Timestamp': a.timestamp.strftime('%d/%m/%Y %H:%M') if a.timestamp else '',
                'Action': a.action,
                'Staff': a.staff_number,
                'Field': a.field,
                'Old Value': a.old_value[:30] + '...' if len(a.old_value) > 30 else a.old_value,
                'New Value': a.new_value[:30] + '...' if len(a.new_value) > 30 else a.new_value,
                'User': a.user_type
            } for a in audits]
            st.dataframe(pd.DataFrame(audit_data), use_container_width=True)
    
    with tab4:
        st.subheader("Export Reports")
        st.write("Generate comprehensive Excel reports for HR review.")
        
        if st.button("📊 Generate Excel Report", type="primary"):
            excel_file = generate_excel_report()
            st.download_button(
                label="📥 Download Report",
                data=excel_file,
                file_name=f"insurance_verification_report_{datetime.now().strftime('%Y%m%d')}.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )

def render_admin_login():
    st.markdown(CUSTOM_CSS, unsafe_allow_html=True)
    
    st.markdown("""
    <div class="login-container">
        <div class="login-header">
            <div class="logo-placeholder">🔐</div>
            <h1>Admin Portal</h1>
            <p>Medical Insurance Verification System</p>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 1, 1])
    with col2:
        admin_password = st.text_input("Admin Password", type="password", key="admin_password")
        admin_name = st.text_input("Your Name", placeholder="Enter your name", key="admin_name_input")
        
        if st.button("Login", type="primary", use_container_width=True):
            expected_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
            if admin_password == expected_password and admin_name:
                st.session_state['admin_authenticated'] = True
                st.session_state['admin_name'] = admin_name
                st.rerun()
            else:
                st.error("Invalid credentials")

def main():
    query_params = st.query_params
    is_admin = query_params.get('admin') == 'true'
    
    if 'authenticated' not in st.session_state:
        st.session_state['authenticated'] = False
    if 'admin_authenticated' not in st.session_state:
        st.session_state['admin_authenticated'] = False
    
    if st.session_state['authenticated'] or st.session_state['admin_authenticated']:
        if check_session_timeout():
            st.warning("Your session has expired due to inactivity. Please log in again.")
            st.stop()
    
    if is_admin:
        if st.session_state['admin_authenticated']:
            render_admin_portal()
        else:
            render_admin_login()
    else:
        if check_link_expired():
            render_expired_page()
            return
        
        if st.session_state['authenticated']:
            render_dashboard()
        else:
            render_login()

if __name__ == "__main__":
    main()
