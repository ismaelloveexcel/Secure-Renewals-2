import streamlit as st
import pandas as pd
import os
from datetime import datetime

st.set_page_config(
    page_title="Employee Benefits Portal",
    page_icon="🏢",
    layout="wide",
    initial_sidebar_state="collapsed"
)

CUSTOM_CSS = """
<style>
    @import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;600;700&display=swap');
    
    /* Hide Streamlit branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .stDeployButton {display: none;}
    
    /* Microsoft-style theme */
    .stApp {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .main-header {
        background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%);
        padding: 20px 30px;
        margin: -80px -80px 30px -80px;
        color: white;
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .main-header h1 {
        margin: 0;
        font-weight: 600;
        font-size: 24px;
    }
    
    .main-header .subtitle {
        font-size: 14px;
        opacity: 0.9;
    }
    
    .card {
        background: white;
        border: 1px solid #e1e1e1;
        border-radius: 4px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .card-header {
        font-size: 16px;
        font-weight: 600;
        color: #323130;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #e1e1e1;
    }
    
    .member-card {
        background: #f8f9fa;
        border-left: 4px solid #0078d4;
        padding: 15px;
        margin-bottom: 15px;
        border-radius: 0 4px 4px 0;
    }
    
    .member-principal {
        border-left-color: #0078d4;
    }
    
    .member-spouse {
        border-left-color: #d83b01;
    }
    
    .member-child {
        border-left-color: #107c10;
    }
    
    .relation-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 3px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .badge-principal {
        background: #0078d4;
        color: white;
    }
    
    .badge-spouse {
        background: #d83b01;
        color: white;
    }
    
    .badge-child {
        background: #107c10;
        color: white;
    }
    
    .field-label {
        font-size: 12px;
        color: #605e5c;
        margin-bottom: 3px;
    }
    
    .field-value {
        font-size: 14px;
        color: #323130;
        font-weight: 500;
    }
    
    .missing-field {
        color: #d83b01;
        font-style: italic;
    }
    
    .login-container {
        max-width: 400px;
        margin: 100px auto;
        background: white;
        padding: 40px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .login-logo {
        text-align: center;
        margin-bottom: 30px;
    }
    
    .login-logo img {
        height: 40px;
    }
    
    .login-title {
        text-align: center;
        font-size: 24px;
        font-weight: 600;
        color: #323130;
        margin-bottom: 8px;
    }
    
    .login-subtitle {
        text-align: center;
        font-size: 14px;
        color: #605e5c;
        margin-bottom: 30px;
    }
    
    .stButton > button {
        background-color: #0078d4;
        color: white;
        border: none;
        padding: 10px 20px;
        font-weight: 600;
        border-radius: 4px;
        width: 100%;
    }
    
    .stButton > button:hover {
        background-color: #005a9e;
    }
    
    .success-banner {
        background: #dff6dd;
        border: 1px solid #107c10;
        color: #107c10;
        padding: 15px 20px;
        border-radius: 4px;
        margin-bottom: 20px;
    }
    
    .warning-banner {
        background: #fff4ce;
        border: 1px solid #ffb900;
        color: #8a6914;
        padding: 15px 20px;
        border-radius: 4px;
        margin-bottom: 20px;
    }
    
    div[data-testid="stForm"] {
        background: white;
        padding: 20px;
        border-radius: 4px;
        border: 1px solid #e1e1e1;
    }
</style>
"""

DATA_FILE = "attached_assets/Medical_Insurance_-_Workings_1766604832610.csv"

@st.cache_data
def load_data():
    df = pd.read_csv(DATA_FILE, encoding='utf-8-sig')
    return df

def save_data(df):
    df.to_csv(DATA_FILE, index=False, encoding='utf-8-sig')

def get_employee_data(df, staff_number):
    employee_rows = df[df['Staff Number'] == staff_number]
    return employee_rows

def get_all_staff_numbers(df):
    principals = df[df['Relation'] == 'PRINCIPAL']
    return principals['Staff Number'].unique().tolist()

def verify_credentials(df, staff_number, dob_input):
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
            dob_str = dob_str.split(' ')[0]
        
        for fmt in ['%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%d']:
            try:
                parsed_date = datetime.strptime(dob_str, fmt)
                actual_dob = parsed_date.strftime('%d/%m/%Y')
                break
            except ValueError:
                continue
        else:
            return False, "Account verification issue. Please contact HR."
        
        if dob_input.strip() == actual_dob:
            return True, None
        else:
            return False, "Invalid credentials. Please check your Staff Number and Date of Birth."
    except Exception:
        return False, "Account verification issue. Please contact HR."

def format_field(value, field_name=""):
    if pd.isna(value) or str(value).strip() == "":
        return None
    return str(value)

def render_login():
    st.markdown(CUSTOM_CSS, unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 1, 1])
    with col2:
        st.markdown("""
        <div style="text-align: center; margin-top: 80px;">
            <div style="font-size: 48px; margin-bottom: 20px;">🏢</div>
            <h1 style="color: #0078d4; font-weight: 600; margin-bottom: 8px;">Employee Benefits Portal</h1>
            <p style="color: #605e5c; margin-bottom: 40px;">Medical Insurance Renewal - Data Verification</p>
        </div>
        """, unsafe_allow_html=True)
        
        with st.form("login_form"):
            staff_number = st.text_input(
                "Staff Number",
                placeholder="Enter your Staff Number (e.g., BAYN00001)",
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
                        st.rerun()
                    else:
                        st.error(error_msg)
        
        st.markdown("""
        <div style="text-align: center; margin-top: 40px;">
            <p style="color: #a19f9d; font-size: 12px; margin-bottom: 15px;">Need assistance? Contact HR</p>
            <a href="https://wa.me/971564966546" target="_blank" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px; background: #25D366; color: white; padding: 10px 20px; border-radius: 25px; font-weight: 600; font-size: 14px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp HR
            </a>
        </div>
        """, unsafe_allow_html=True)

def render_member_details(member, index, df):
    relation = member['Relation']
    
    badge_class = "badge-principal" if relation == "PRINCIPAL" else ("badge-spouse" if relation == "SPOUSE" else "badge-child")
    card_class = "member-principal" if relation == "PRINCIPAL" else ("member-spouse" if relation == "SPOUSE" else "member-child")
    
    member_name = f"{format_field(member['Member First Name']) or ''} {format_field(member['Member Middle Name']) or ''} {format_field(member['Member Last Name']) or ''}".strip()
    
    st.markdown(f"""
    <div class="member-card {card_class}">
        <span class="relation-badge {badge_class}">{relation}</span>
        <h3 style="margin: 10px 0 5px 0; color: #323130;">{member_name}</h3>
    </div>
    """, unsafe_allow_html=True)
    
    editable_fields = [
        ('Member First Name', 'First Name'),
        ('Member Middle Name', 'Middle Name'),
        ('Member Last Name', 'Last Name'),
        ('Gender', 'Gender'),
        ('Date Of Birth', 'Date of Birth'),
        ('Nationality', 'Nationality'),
        ('Marital Status', 'Marital Status'),
        ('National Id Type', 'ID Type'),
        ('National Identity', 'ID Number'),
        ('Place of visa issuance', 'Visa Issuance Place'),
        ('Visa Unified Number', 'Visa Unified Number'),
        ('Passport number', 'Passport Number'),
        ('Visa File Number', 'Visa File Number'),
        ('Birth Certificate Number', 'Birth Certificate Number'),
    ]
    
    with st.expander(f"View/Edit Details - {member_name}", expanded=(relation == "PRINCIPAL")):
        cols = st.columns(3)
        
        for i, (field_key, field_label) in enumerate(editable_fields):
            col = cols[i % 3]
            current_value = format_field(member[field_key])
            
            is_readonly = (field_key == 'Date Of Birth' and relation == 'PRINCIPAL')
            
            with col:
                if is_readonly:
                    st.text_input(
                        f"{field_label} (locked)",
                        value=current_value or "",
                        key=f"{index}_{field_key}",
                        disabled=True
                    )
                    new_value = current_value
                elif current_value:
                    new_value = st.text_input(
                        field_label,
                        value=current_value,
                        key=f"{index}_{field_key}"
                    )
                else:
                    new_value = st.text_input(
                        f"{field_label} ⚠️",
                        value="",
                        placeholder="Missing - please provide",
                        key=f"{index}_{field_key}"
                    )
                
                if not is_readonly and new_value != (current_value or ""):
                    member_number = member['Member Number']
                    df.loc[df['Member Number'] == member_number, field_key] = new_value
                    df.loc[df['Member Number'] == member_number, 'Modified'] = datetime.now().strftime("%m/%d/%Y %I:%M %p")
                    df.loc[df['Member Number'] == member_number, 'Modified By'] = st.session_state.get('staff_number', '')

def render_dashboard():
    st.markdown(CUSTOM_CSS, unsafe_allow_html=True)
    
    staff_number = st.session_state.get('staff_number', '')
    df = load_data()
    employee_data = get_employee_data(df, staff_number)
    
    if employee_data.empty:
        st.error("No data found for your account.")
        return
    
    principal = employee_data[employee_data['Relation'] == 'PRINCIPAL'].iloc[0]
    principal_name = principal['Principal Name']
    
    st.markdown(f"""
    <div style="background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%); padding: 25px 30px; margin: -80px -80px 30px -80px; color: white;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="margin: 0; font-weight: 600; font-size: 24px;">🏢 Employee Benefits Portal</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Medical Insurance Renewal - Data Verification</p>
            </div>
            <div style="text-align: right;">
                <p style="margin: 0; font-size: 14px; opacity: 0.8;">Logged in as</p>
                <p style="margin: 0; font-weight: 600;">{principal_name}</p>
                <p style="margin: 0; font-size: 12px; opacity: 0.8;">{staff_number}</p>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns([4, 1])
    with col2:
        if st.button("🚪 Sign Out", use_container_width=True):
            st.session_state.clear()
            st.rerun()
    
    confirmed = employee_data['EmployeeConfirmed'].iloc[0]
    if pd.notna(confirmed) and str(confirmed).strip() != "":
        st.markdown("""
        <div class="success-banner">
            ✅ <strong>Thank you!</strong> You have already confirmed your information. If you need to make changes, please contact HR.
        </div>
        """, unsafe_allow_html=True)
    
    missing_fields = []
    for _, member in employee_data.iterrows():
        member_name = f"{format_field(member['Member First Name']) or ''} {format_field(member['Member Last Name']) or ''}".strip()
        for field in ['National Identity', 'Passport number', 'Visa File Number']:
            if not format_field(member[field]):
                missing_fields.append(f"{member_name}: {field}")
    
    if missing_fields:
        st.markdown(f"""
        <div class="warning-banner">
            ⚠️ <strong>Action Required:</strong> Some information is missing. Please review and complete the highlighted fields below.
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("""
    <div class="card">
        <div class="card-header">📋 Instructions</div>
        <ol style="margin: 0; padding-left: 20px; color: #605e5c;">
            <li>Review your personal information and that of your dependents below</li>
            <li>Fields marked with ⚠️ are missing and require your attention</li>
            <li>Update any incorrect or missing information</li>
            <li>Click <strong>"Save Changes"</strong> to save your updates</li>
            <li>Once all information is correct, click <strong>"Confirm All Information"</strong></li>
        </ol>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown(f"""
    <div class="card">
        <div class="card-header">👥 Your Insurance Members ({len(employee_data)} total)</div>
    </div>
    """, unsafe_allow_html=True)
    
    df_working = df.copy()
    
    for idx, (_, member) in enumerate(employee_data.iterrows()):
        render_member_details(member, idx, df_working)
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 1, 1])
    
    with col1:
        if st.button("💾 Save Changes", use_container_width=True, type="secondary"):
            save_data(df_working)
            st.cache_data.clear()
            st.success("Changes saved successfully!")
            st.rerun()
    
    with col3:
        confirmed_status = employee_data['EmployeeConfirmed'].iloc[0]
        already_confirmed = pd.notna(confirmed_status) and str(confirmed_status).strip() != ""
        
        if st.button(
            "✅ Confirm All Information" if not already_confirmed else "✅ Already Confirmed",
            use_container_width=True,
            type="primary",
            disabled=already_confirmed
        ):
            confirmation_time = datetime.now().strftime("%m/%d/%Y %I:%M %p")
            df_working.loc[df_working['Staff Number'] == staff_number, 'EmployeeConfirmed'] = confirmation_time
            df_working.loc[df_working['Staff Number'] == staff_number, 'LastEditedByStaffNo'] = staff_number
            df_working.loc[df_working['Staff Number'] == staff_number, 'LastEditedOn'] = confirmation_time
            save_data(df_working)
            st.cache_data.clear()
            st.success("Thank you! Your information has been confirmed.")
            st.balloons()
            st.rerun()

def main():
    if 'authenticated' not in st.session_state:
        st.session_state['authenticated'] = False
    
    if st.session_state['authenticated']:
        render_dashboard()
    else:
        render_login()

if __name__ == "__main__":
    main()
