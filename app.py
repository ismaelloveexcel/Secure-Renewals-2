#!/usr/bin/env python3
"""
HR Portal - React Application
Serves the pre-built React app through Streamlit.
"""
import streamlit as st
import streamlit.components.v1 as components
import os
import base64

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

def get_page():
    params = st.query_params
    return params.get("page", "home")

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin2026")

def svg_to_data_uri(svg_content):
    import urllib.parse
    return f"data:image/svg+xml,{urllib.parse.quote(svg_content)}"

SVG_USERS = svg_to_data_uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>')
SVG_CHECK = svg_to_data_uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>')
SVG_GLOBE = svg_to_data_uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>')
SVG_LOCK = svg_to_data_uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>')

def render_home():
    logo_b64 = get_logo_base64()
    logo_html = f'<img src="data:image/png;base64,{logo_b64}" class="portal-logo" alt="Logo">' if logo_b64 else ''

    html_content = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

            * {{ margin: 0; padding: 0; box-sizing: border-box; }}

            body {{
                font-family: 'Poppins', sans-serif;
                background: #ffffff;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 0;
                margin: 0;
                overflow: hidden;
                position: relative;
            }}

            .container {{
                position: relative;
                z-index: 1;
                text-align: center;
            }}

            /* Header styling */
            .portal-header {{
                text-align: center;
                margin-bottom: 25px;
            }}

            .portal-logo {{
                width: 110px;
                height: auto;
                margin-bottom: 15px;
                filter: drop-shadow(0 4px 12px rgba(0,0,0,0.1));
            }}

            .brand-title {{
                font-size: 2.3em;
                font-weight: 600;
                color: #2c3e50;
                letter-spacing: 0.5em;
                margin-bottom: 0;
                text-transform: uppercase;
                text-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }}

            /* Menu container */
            .menu-container {{
                display: grid;
                grid-template-columns: repeat(2, 160px);
                gap: 12px;
                margin: 0 auto;
            }}

            /* Menu items */
            .menu-item {{
                width: 160px;
                height: 160px;
                background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,245,0.95) 100%);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                text-decoration: none;
                color: #2c3e50;
                border: none;
                outline: none;
                position: relative;
                transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
                box-shadow:
                    0 8px 16px rgba(0,0,0,0.12),
                    0 4px 8px rgba(0,0,0,0.08),
                    0 2px 4px rgba(0,0,0,0.06),
                    0 0 0 1px rgba(0,0,0,0.04);
            }}

            .menu-item:hover {{
                transform: translateY(-8px) scale(1.02);
                box-shadow:
                    0 16px 32px rgba(0,0,0,0.18),
                    0 8px 16px rgba(0,0,0,0.12),
                    0 4px 8px rgba(0,0,0,0.08),
                    0 0 0 1px rgba(0,0,0,0.06);
            }}

            .menu-item:active {{
                transform: translateY(-2px) scale(0.98);
            }}

            /* Content inside each button */
            .menu-content {{
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 15px;
            }}

            .menu-icon {{
                width: 40px;
                height: 40px;
                filter: drop-shadow(0 1px 3px rgba(46, 204, 113, 0.4));
                transition: transform 0.3s ease;
            }}

            .menu-item:hover .menu-icon {{
                transform: scale(1.15);
            }}

            .menu-label {{
                font-size: 0.95em;
                font-weight: 500;
                letter-spacing: 0.15em;
                text-transform: uppercase;
                line-height: 1.4;
                text-align: center;
                color: #34495e;
                text-shadow: 0 1px 3px rgba(255,255,255,0.8);
            }}

            /* Specific corner radiuses */
            .item-tl {{
                border-radius: 200px 10px 10px 10px;
                grid-column: 1;
                grid-row: 1;
            }}

            .item-tr {{
                border-radius: 10px 200px 10px 10px;
                grid-column: 2;
                grid-row: 1;
            }}

            .item-bl {{
                border-radius: 10px 10px 10px 200px;
                grid-column: 1;
                grid-row: 2;
            }}

            .item-br {{
                border-radius: 10px 10px 200px 10px;
                grid-column: 2;
                grid-row: 2;
            }}

            /* Footer */
            .portal-footer {{
                margin-top: 40px;
                font-size: 0.65em;
                color: #95a5a6;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                font-weight: 400;
            }}

            /* Responsive design */
            @media (max-width: 768px) {{
                .portal-logo {{
                    width: 90px;
                }}

                .brand-title {{
                    font-size: 1.9em;
                }}

                .portal-header {{
                    margin-bottom: 20px;
                }}

                .menu-container {{
                    grid-template-columns: repeat(2, 145px);
                    gap: 10px;
                }}

                .menu-item {{
                    width: 145px;
                    height: 145px;
                }}

                .menu-icon {{
                    width: 35px;
                    height: 35px;
                }}

                .menu-label {{
                    font-size: 0.82em;
                }}

                .portal-footer {{
                    margin-top: 30px;
                }}
            }}

            @media (max-width: 500px) {{
                .portal-logo {{
                    width: 75px;
                    margin-bottom: 12px;
                }}

                .brand-title {{
                    font-size: 1.5em;
                    letter-spacing: 0.3em;
                }}

                .portal-header {{
                    margin-bottom: 18px;
                }}

                .menu-container {{
                    grid-template-columns: repeat(2, 135px);
                    gap: 10px;
                }}

                .menu-item {{
                    width: 135px;
                    height: 135px;
                }}

                .menu-icon {{
                    width: 32px;
                    height: 32px;
                }}

                .menu-label {{
                    font-size: 0.72em;
                    letter-spacing: 0.12em;
                }}

                .portal-footer {{
                    margin-top: 25px;
                    font-size: 0.6em;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="portal-header">
                {logo_html}
                <h1 class="brand-title">HR Portal</h1>
            </div>

            <div class="menu-container">
                <a href="?page=employees" class="menu-item item-tl">
                    <div class="menu-content">
                        <img src="{SVG_USERS}" alt="Employees" class="menu-icon">
                        <span class="menu-label">Employees</span>
                    </div>
                </a>

                <a href="?page=onboarding" class="menu-item item-tr">
                    <div class="menu-content">
                        <img src="{SVG_CHECK}" alt="Onboarding" class="menu-icon">
                        <span class="menu-label">Onboarding</span>
                    </div>
                </a>

                <a href="?page=external" class="menu-item item-bl">
                    <div class="menu-content">
                        <img src="{SVG_GLOBE}" alt="External Users" class="menu-icon">
                        <span class="menu-label">External<br>Users</span>
                    </div>
                </a>

                <a href="?page=admin" class="menu-item item-br">
                    <div class="menu-content">
                        <img src="{SVG_LOCK}" alt="Admin" class="menu-icon">
                        <span class="menu-label">Admin</span>
                    </div>
                </a>
            </div>

            <div class="portal-footer">
                Conceptualised by Baynunah|HR|IS
            </div>
        </div>
    </body>
    </html>
    '''
    components.html(html_content, height=550, scrolling=False)

def render_coming_soon(title):
    st.markdown(f'''
    <div style="min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px;">
        <h1 style="font-size: 2.5em; color: #2c3e50; margin-bottom: 20px;">{title}</h1>
        <p style="font-size: 1.2em; color: #7f8c8d; margin-bottom: 30px;">This section is coming soon.</p>
        <a href="?" style="background: linear-gradient(135deg, #39FF14 0%, #2ecc71 100%); color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: 600; letter-spacing: 0.1em;">Back to Home</a>
    </div>
    ''', unsafe_allow_html=True)

def render_admin():
    if 'admin_authenticated' not in st.session_state:
        st.session_state.admin_authenticated = False

    if st.session_state.admin_authenticated:
        st.markdown('''
        <div style="padding: 40px; text-align: center;">
            <h2 style="color: #2c3e50; margin-bottom: 30px;">HR Administration</h2>
        </div>
        ''', unsafe_allow_html=True)

        col1, col2, col3 = st.columns([1, 1, 1])
        with col2:
            if st.button("Insurance Renewal 2026", use_container_width=True):
                st.query_params["page"] = "insurance_renewal"
                st.rerun()

            if st.button("Sign Out", use_container_width=True):
                st.session_state.admin_authenticated = False
                st.rerun()
            if st.button("Back to Home", use_container_width=True):
                st.query_params.clear()
                st.rerun()
    else:
        st.markdown('''
        <div style="min-height: 70vh; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <div style="width: 100%; max-width: 400px; padding: 50px 40px; background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%); border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <h2 style="text-align: center; color: #2c3e50; margin-bottom: 10px; font-size: 1.8em;">Admin Portal</h2>
                <p style="text-align: center; color: #7f8c8d; margin-bottom: 30px; font-size: 0.9em; letter-spacing: 0.1em; text-transform: uppercase;">Baynunah HR System</p>
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
    if 'admin_authenticated' not in st.session_state or not st.session_state.admin_authenticated:
        st.query_params["page"] = "admin"
        st.rerun()
        return

    st.markdown('''
    <div style="padding: 40px; text-align: center;">
        <h2 style="color: #2c3e50; margin-bottom: 30px;">Insurance Renewal 2026</h2>
    </div>
    ''', unsafe_allow_html=True)

    col1, col2, col3 = st.columns([1, 1, 1])
    with col2:
        if st.button("Life Insurance", use_container_width=True):
            st.query_params["page"] = "life_insurance"
            st.rerun()
        if st.button("Medical Insurance", use_container_width=True):
            st.query_params["page"] = "medical_insurance"
            st.rerun()
        st.markdown('<br>', unsafe_allow_html=True)
        if st.button("Back to Admin", use_container_width=True):
            st.query_params["page"] = "admin"
            st.rerun()

def render_life_insurance():
    if 'admin_authenticated' not in st.session_state or not st.session_state.admin_authenticated:
        st.query_params["page"] = "admin"
        st.rerun()
        return

    render_coming_soon("Life Insurance")

    col1, col2, col3 = st.columns([1, 1, 1])
    with col2:
        if st.button("Back to Insurance Renewal", use_container_width=True):
            st.query_params["page"] = "insurance_renewal"
            st.rerun()

def render_medical_insurance():
    if 'admin_authenticated' not in st.session_state or not st.session_state.admin_authenticated:
        st.query_params["page"] = "admin"
        st.rerun()
        return

    render_coming_soon("Medical Insurance")

    col1, col2, col3 = st.columns([1, 1, 1])
    with col2:
        if st.button("Back to Insurance Renewal", use_container_width=True):
            st.query_params["page"] = "insurance_renewal"
            st.rerun()

def main():
    page = get_page()

    if page == "home":
        render_home()
    elif page == "employees":
        render_coming_soon("Employees")
    elif page == "onboarding":
        render_coming_soon("Onboarding")
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
    else:
        render_home()

if __name__ == "__main__":
    main()
