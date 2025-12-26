import streamlit as st
import pandas as pd
import os
import base64
from datetime import datetime, timedelta
import json
from io import BytesIO
from models import init_db, get_db, AuditTrail, ChangeRequest

@st.cache_resource
def initialize_database():
    init_db()
    return True

initialize_database()

@st.cache_resource
def get_logo_base64():
    logo_path = "attached_assets/logo_1765648544636_1766742634201.png"
    if os.path.exists(logo_path):
        with open(logo_path, "rb") as f:
            return base64.b64encode(f.read()).decode()
    return None

@st.cache_resource
def get_app_icon_base64():
    icon_path = "attached_assets/Untitled_design_(7)_1766743946677.gif"
    if os.path.exists(icon_path):
        with open(icon_path, "rb") as f:
            return base64.b64encode(f.read()).decode()
    return None

LOGO_BASE64 = get_logo_base64()
APP_ICON_BASE64 = get_app_icon_base64()

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
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;750;800;850&display=swap');
    
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .stDeployButton {display: none;}
    
    /* =========================
       2) APP BACKGROUND + NOISE
       ========================= */
    .stApp {
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
        color: #0F172A;
        background:
            radial-gradient(1200px 600px at 20% 10%, rgba(255,255,255,.35), transparent 60%),
            radial-gradient(900px 500px at 80% 0%, rgba(33,193,122,.18), transparent 55%),
            linear-gradient(180deg, rgba(180,180,180,1) 0%, rgba(210,214,222,1) 100%);
        position: relative;
    }
    

    /* =========================
       3) PAGE CONTAINER
       ========================= */
    .page, .page-shell {
        max-width: 1160px;
        margin: 0 auto;
        padding: 28px 20px 64px;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    
    .page-header {
        text-align: center;
        margin-bottom: 16px;
    }
    
    .page-title {
        color: #0B1F3B !important;
        font-size: 26px !important;
        font-weight: 750 !important;
        margin: 0 0 6px 0;
        line-height: 1.15;
    }
    
    .page-subtitle {
        color: #64748B !important;
        font-size: 14px !important;
        margin: 0;
    }
    
    .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 14px;
        border-radius: 999px;
        background: rgba(33,193,122,.14);
        color: #0E5F3D;
        border: 1px solid rgba(33,193,122,.22);
        font-size: 12px;
        font-weight: 650;
        margin-top: 10px;
    }

    .section-grid {
        display: grid;
        grid-template-columns: 1.6fr 1fr;
        gap: 16px;
        align-items: start;
    }
    
    @media (max-width: 980px) {
        .section-grid { grid-template-columns: 1fr; }
    }

    .section-divider {
        margin: 6px 0 4px;
    }
    
    /* Stats grid */
    .stat-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
    }
    
    .stat {
        background: rgba(248,250,252,.90);
        border: 1px solid rgba(15,23,42,.08);
        border-radius: 14px;
        padding: 14px 14px;
    }
    
    .stat .k {
        font-size: 11px;
        letter-spacing: .10em;
        text-transform: uppercase;
        color: #64748B;
        font-weight: 750;
    }
    
    .stat .v {
        font-size: 18px;
        font-weight: 800;
        color: #0F172A;
        margin-top: 6px;
    }
    
    /* Key-value blocks */
    .k {
        font-size: 11px;
        letter-spacing: .08em;
        text-transform: uppercase;
        color: #64748B;
        font-weight: 700;
    }
    
    .v {
        font-weight: 600;
        color: #334155;
    }
    
    .missing {
        color: #F59E0B !important;
        font-style: italic;
    }
    
    /* Badge variants */
    .badge--principal {
        background: rgba(33,193,122,.14);
        color: #0E5F3D;
        border: 1px solid rgba(33,193,122,.22);
    }
    
    .badge--spouse {
        background: rgba(18,59,110,.10);
        color: #123B6E;
        border: 1px solid rgba(18,59,110,.18);
    }
    
    /* =========================
       4) LOGIN STYLES
       ========================= */
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
        padding: 24px 18px;
        box-sizing: border-box;
    }
    
    .login-card {
        width: min(420px, 100%);
        background: rgba(255,255,255,.92) !important;
        border: 1px solid rgba(15,23,42,.10) !important;
        border-radius: 22px !important;
        box-shadow: 0 22px 60px rgba(15,23,42,.18) !important;
        padding: 26px 24px !important;
        text-align: center;
        backdrop-filter: blur(12px);
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
        color: #0B1F3B !important;
        font-size: 22px !important;
        font-weight: 750 !important;
        margin: 10px 0 6px 0;
        line-height: 1.15;
        letter-spacing: -0.02em;
    }
    
    .login-card .subtitle {
        color: #64748B !important;
        font-size: 14px !important;
        margin: 0;
    }
    
    .login-card .policy-tag {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-radius: 999px;
        background: rgba(33,193,122,.14);
        color: #0E5F3D;
        border: 1px solid rgba(33,193,122,.22);
        font-size: 12px;
        font-weight: 650;
        margin-top: 10px;
    }
    
    .login-help {
        margin-top: 18px;
        font-size: 13px;
        color: #64748B;
    }
    
    .login-help a {
        color: #21C17A;
        text-decoration: none;
        font-weight: 600;
    }
    
    /* =========================
       5) MAIN HEADER + CARDS
       ========================= */
    .main-header {
        background: rgba(255,255,255,.92);
        border: 1px solid rgba(15,23,42,.10);
        border-radius: 16px;
        box-shadow: 0 6px 18px rgba(15,23,42,.08);
        padding: 22px 22px;
        backdrop-filter: blur(10px);
        margin-bottom: 20px;
    }
    
    .main-header:hover {
        box-shadow: 0 12px 30px rgba(15,23,42,.12);
        border-color: rgba(15,23,42,.16);
        transform: translateY(-1px);
        transition: 160ms ease;
    }
    
    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .header-left {
        display: flex;
        align-items: center;
        gap: 16px;
    }
    
    .company-logo {
        width: 40px;
        height: 40px;
        background: transparent;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
    }
    
    .company-logo-img {
        width: 44px;
        height: 44px;
        border-radius: 8px;
        object-fit: contain;
    }
    
    .header-title h1 {
        margin: 0;
        font-size: 16px;
        font-weight: 650;
        color: #334155;
    }
    
    .header-title .subtitle {
        font-size: 12px;
        color: #64748B;
        margin-top: 3px;
        font-weight: 400;
    }
    
    .header-right {
        display: flex;
        align-items: center;
        gap: 24px;
    }
    
    .policy-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-radius: 999px;
        background: rgba(33,193,122,.14);
        color: #0E5F3D;
        border: 1px solid rgba(33,193,122,.22);
        font-size: 12px;
        font-weight: 650;
    }
    
    .user-block {
        text-align: right;
    }
    
    .user-name {
        font-size: 13px;
        font-weight: 650;
        color: #334155;
    }
    
    .user-id {
        font-size: 11px;
        color: #64748B;
        margin-bottom: 4px;
    }
    
    .header-signout-link {
        display: inline-block;
        background: transparent;
        border: none;
        color: #64748B;
        padding: 4px 0;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        text-decoration: none;
        margin-top: 4px;
        position: relative;
    }
    
    .header-signout-link::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background: #21C17A;
        transition: width 0.3s ease;
    }
    
    .header-signout-link:hover {
        color: #21C17A;
    }
    
    .header-signout-link:hover::after {
        width: 100%;
    }
    
    .status-strip {
        background: rgba(255,255,255,.84);
        border: 1px solid rgba(15,23,42,.10);
        padding: 12px 16px;
        margin: 0 0 6px 0;
        border-radius: 12px;
        display: flex;
        justify-content: space-between;
        gap: 18px;
        font-size: 12px;
        color: #334155;
    }
    
    .status-item {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    /* =========================
       6) CARDS + STATS
       ========================= */
    .card, .glass-card, .summary-card, .member-card, .confirmation-card, .edit-form-card {
        background: rgba(255,255,255,.92) !important;
        border: 1px solid rgba(15,23,42,.10) !important;
        border-radius: 16px !important;
        box-shadow: 0 6px 18px rgba(15,23,42,.08) !important;
        padding: 22px 22px !important;
        backdrop-filter: blur(10px) !important;
        margin-bottom: 14px !important;
    }
    
    .card:hover, .glass-card:hover, .summary-card:hover, .member-card:hover {
        box-shadow: 0 12px 30px rgba(15,23,42,.12) !important;
        border-color: rgba(15,23,42,.16) !important;
        transform: translateY(-1px);
        transition: 160ms ease;
    }
    
    .card--accent, .glass-card--accent {
        border-top: 3px solid rgba(18,59,110,.65) !important;
    }

    .summary-card .card-title {
        margin-bottom: 10px;
    }

    .key-metrics {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
    }

    .metric-tile {
        background: rgba(248,250,252,.90);
        border: 1px solid rgba(15,23,42,.08);
        border-radius: 14px;
        padding: 14px 14px;
    }

    .metric-label {
        font-size: 11px;
        letter-spacing: .10em;
        text-transform: uppercase;
        color: #64748B;
        font-weight: 750;
    }

    .metric-value {
        font-size: 18px;
        font-weight: 800;
        color: #0F172A;
        margin-top: 6px;
    }

    .list-row {
        display: flex;
        justify-content: space-between;
        gap: 6px;
        padding: 8px 0;
        border-bottom: 1px solid rgba(15,23,42,.06);
        font-size: 12px;
        color: #334155;
    }

    .list-row:last-child {
        border-bottom: none;
    }

    .list-label {
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: #64748B;
        font-weight: 750;
        font-size: 11px;
    }

    .list-value {
        font-weight: 650;
        color: #334155;
    }
    
    /* Card header row */
    .card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(15,23,42,.06);
        margin-bottom: 14px;
    }
    
    .card-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        letter-spacing: .10em;
        text-transform: uppercase;
        color: #64748B;
        font-weight: 750;
        margin-bottom: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(15,23,42,.06);
    }
    
    .badge {
        font-size: 11px;
        font-weight: 750;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid rgba(15,23,42,.10);
        background: rgba(248,250,252,.85);
        color: #334155;
    }
    
    .badge--principal, .badge-principal { 
        background: rgba(33,193,122,.14); 
        border-color: rgba(33,193,122,.25); 
        color: #0E5F3D; 
    }
    
    .badge--spouse, .badge-spouse { 
        background: rgba(139,92,246,.12); 
        border-color: rgba(139,92,246,.22); 
        color: #4C1D95; 
    }
    
    .badge--warn { 
        background: rgba(245,158,11,.14); 
        border-color: rgba(245,158,11,.22); 
        color: #7A4B00; 
    }
    
    .badge-child {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
    }
    
    /* =========================
       7) CENTERED HEADER
       ========================= */
    .centered-header {
        text-align: center;
        padding: 18px 0 26px;
    }
    
    .centered-header-logo {
        width: 50px;
        height: 50px;
        border-radius: 8px;
        object-fit: contain;
        margin-bottom: 10px;
    }
    
    .centered-header-title {
        font-size: 30px;
        line-height: 1.15;
        letter-spacing: -0.02em;
        margin: 10px 0 6px;
        color: #0B1F3B;
        font-weight: 750;
    }
    
    .centered-header-subtitle {
        font-size: 14px;
        color: #64748B;
        margin: 0 0 4px 0;
    }
    
    .centered-header-year {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-radius: 999px;
        background: rgba(33,193,122,.14);
        color: #0E5F3D;
        border: 1px solid rgba(33,193,122,.22);
        font-size: 12px;
        font-weight: 650;
        margin-top: 10px;
    }
    
    .header-logo-placeholder {
        font-size: 28px;
    }
    
    .header-right-section {
        display: flex;
        align-items: center;
        gap: 16px;
    }
    
    .header-policy-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-radius: 999px;
        background: rgba(33,193,122,.14);
        color: #0E5F3D;
        border: 1px solid rgba(33,193,122,.22);
        font-size: 12px;
        font-weight: 650;
    }
    
    .header-user-info {
        text-align: right;
    }
    
    .header-user-name {
        color: #334155;
        font-size: 13px;
        font-weight: 650;
    }
    
    .header-user-id {
        color: #64748B;
        font-size: 11px;
    }
    
    /* =========================
       8) SNAPSHOT + MEMBER DETAILS
       ========================= */
    .snapshot-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px 24px;
    }
    
    .snapshot-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    
    .snapshot-label {
        font-size: 11px;
        letter-spacing: .10em;
        text-transform: uppercase;
        color: #64748B;
        font-weight: 750;
    }
    
    .snapshot-value {
        font-size: 14px;
        color: #0F172A;
        font-weight: 650;
        margin-top: 6px;
    }
    
    .member-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(15,23,42,.06);
    }
    
    .member-name {
        color: #334155;
        font-size: 15px;
        font-weight: 650;
    }
    
    .member-badge {
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 750;
        text-transform: uppercase;
        letter-spacing: 0.4px;
    }
    
    .member-details {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6px 16px;
    }
    
    .member-detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        padding: 3px 0;
    }
    
    .member-detail-label {
        color: #64748B;
    }
    
    .member-detail-value {
        color: #0F172A;
        font-weight: 650;
    }
    
    .missing-value {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        font-weight: 750;
        color: #7A4B00;
        background: rgba(245,158,11,.14);
        border: 1px solid rgba(245,158,11,.22);
        padding: 6px 10px;
        border-radius: 999px;
    }
    
    .member-divider {
        border: none;
        border-top: 1px solid rgba(15,23,42,.06);
        margin: 12px 0;
    }
    
    .missing-text {
        color: #7A4B00 !important;
        font-weight: 750;
    }
    
    /* =========================
       9) EDIT FORM SECTIONS
       ========================= */
    .edit-section-header {
        color: #7A4B00;
        font-size: 12px;
        font-weight: 850;
        text-transform: uppercase;
        letter-spacing: 0.10em;
        margin: 0 0 12px 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    }
    
    .edit-section-header-green {
        color: #21C17A;
        font-size: 12px;
        font-weight: 850;
        text-transform: uppercase;
        letter-spacing: 0.10em;
        margin: 16px 0 12px 0;
        padding-top: 12px;
        border-top: 1px solid rgba(15,23,42,.06);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    }
    
    .member-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .grid-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px 18px;
    }
    
    @media (max-width: 980px) {
        .grid-row { grid-template-columns: 1fr 1fr; }
    }
    
    @media (max-width: 560px) {
        .grid-row { grid-template-columns: 1fr; }
    }
    
    .grid-cell {
        min-height: 28px;
    }
    
    .field-label {
        font-size: 11px;
        letter-spacing: .10em;
        text-transform: uppercase;
        color: #64748B;
        font-weight: 750;
        margin-bottom: 3px;
    }
    
    .field-value {
        font-size: 14px;
        color: #0F172A;
        font-weight: 650;
        margin-top: 6px;
    }
    
    .field-value-muted {
        color: #64748B;
        font-weight: 600;
    }
    
    .missing-field-text {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 6px;
        font-size: 12px;
        font-weight: 750;
        color: #7A4B00;
        background: rgba(245,158,11,.14);
        border: 1px solid rgba(245,158,11,.22);
        padding: 6px 10px;
        border-radius: 999px;
    }
    
    .missing-info-banner {
        background: rgba(245,158,11,.14);
        border-left: 3px solid #F59E0B;
        border-radius: 0 12px 12px 0;
        padding: 10px 14px;
        margin-top: 12px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
    }
    
    .missing-icon {
        color: #F59E0B;
        font-size: 16px;
    }
    
    .missing-title {
        color: #7A4B00;
        font-weight: 750;
        font-size: 13px;
    }
    
    .missing-desc {
        color: #64748B;
        font-size: 12px;
    }
    
    .inline-edit-section {
        border-top: 1px solid rgba(15,23,42,.06);
        margin-top: 12px;
        padding-top: 10px;
    }
    
    .inline-edit-title {
        color: #7A4B00;
        font-size: 12px;
        font-weight: 850;
        text-transform: uppercase;
        letter-spacing: 0.10em;
        margin-bottom: 8px;
    }
    
    .missing-banner {
        background: rgba(245,158,11,.14);
        border-left: 3px solid #F59E0B;
        border-radius: 0 12px 12px 0;
        padding: 10px 12px;
        margin: 10px 0;
        display: flex;
        align-items: center;
        gap: 10px;
        color: #7A4B00;
        font-size: 12px;
        font-weight: 750;
    }
    
    /* =========================
       10) RADIO + CONFIRMATION
       ========================= */
    .radio-option {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border: 1px solid rgba(15,23,42,.10);
        border-radius: 12px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 160ms ease;
        background: rgba(255,255,255,.84);
    }
    
    .radio-option:hover {
        border-color: #21C17A;
        background: rgba(33,193,122,.04);
    }
    
    .radio-option.selected {
        border-color: #21C17A;
        background: rgba(33,193,122,.08);
    }
    
    .success-message {
        background: rgba(33,193,122,.08);
        border-radius: 16px;
        padding: 24px;
        text-align: center;
        margin: 14px 0;
        border: 1px solid rgba(33,193,122,.2);
    }
    
    .success-icon {
        width: 48px;
        height: 48px;
        background: rgba(33,193,122,.12);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 12px;
        font-size: 22px;
        color: #21C17A;
    }
    
    .success-title {
        color: #0F172A;
        font-size: 16px;
        font-weight: 800;
        margin-bottom: 6px;
    }
    
    .success-desc {
        color: #334155;
        font-size: 13px;
        line-height: 1.5;
    }
    
    .change-log {
        background: rgba(245,158,11,.06);
        border: 1px solid rgba(245,158,11,.2);
        border-radius: 14px;
        padding: 14px;
        margin-top: 14px;
    }
    
    .change-item {
        display: flex;
        gap: 8px;
        padding: 6px 0;
        border-bottom: 1px solid rgba(15,23,42,.06);
        font-size: 13px;
        color: #0F172A;
    }
    
    .change-item:last-child {
        border-bottom: none;
    }
    
    .old-value {
        color: #EF4444;
        text-decoration: line-through;
    }
    
    .new-value {
        color: #21C17A;
        font-weight: 650;
    }
    
    /* =========================
       11) LOGIN FORM
       ========================= */
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
        width: 40px;
        height: 40px;
        background: #21C17A;
        border-radius: 12px;
        margin: 0 auto 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
    }
    
    .login-logo-img {
        width: 56px;
        height: 56px;
        border-radius: 10px;
        margin: 0 auto 12px;
        display: block;
        object-fit: contain;
    }
    
    .login-title {
        color: #0B1F3B;
        font-size: 22px;
        font-weight: 750;
        margin-bottom: 4px;
        line-height: 1.15;
        letter-spacing: -0.02em;
    }
    
    @media (max-width: 480px) {
        .login-logo-img {
            width: 60px;
            height: 60px;
        }
        .login-title {
            font-size: 22px;
        }
    }
    
    .login-subtitle {
        color: #64748B;
        font-size: 13px;
        font-weight: 400;
        margin-top: 4px;
    }
    
    .login-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-radius: 999px;
        background: rgba(33,193,122,.14);
        color: #0E5F3D;
        border: 1px solid rgba(33,193,122,.22);
        font-size: 12px;
        font-weight: 650;
        margin-top: 10px;
    }
    
    /* =========================
       12) BUTTONS
       ========================= */
    .stButton > button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        border-radius: 12px;
        padding: 11px 16px;
        font-size: 13px;
        font-weight: 800;
        border: 1px solid transparent;
        cursor: pointer;
        transition: 160ms ease;
        background: linear-gradient(180deg, rgba(33,193,122,1), rgba(22,163,74,1));
        color: white;
        box-shadow: 0 10px 22px rgba(22,163,74,.22);
        width: 100%;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
        text-transform: uppercase;
        letter-spacing: 0.4px;
    }
    
    .stButton > button:hover {
        transform: translateY(-1px);
        filter: brightness(1.02);
    }
    
    .stButton > button:disabled {
        opacity: .55;
        cursor: not-allowed;
        transform: none;
    }
    
    .signout-btn button {
        background: rgba(248,250,252,.90) !important;
        border: 1px solid rgba(15,23,42,.10) !important;
        color: #0F172A !important;
        padding: 8px 16px !important;
        font-size: 11px !important;
        letter-spacing: 0.5px !important;
        box-shadow: none !important;
    }
    
    .signout-btn button:hover {
        border-color: rgba(15,23,42,.16) !important;
        transform: translateY(-1px) !important;
    }
    
    .signout-container {
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        margin-top: 30px;
        margin-bottom: 20px;
        width: 100%;
    }
    
    .signout-container .stButton {
        display: flex;
        justify-content: center;
        width: 100%;
    }
    
    .signout-container .stButton > button {
        background: linear-gradient(180deg, rgba(33,193,122,1), rgba(22,163,74,1)) !important;
        color: white !important;
        border: none !important;
        padding: 11px 40px !important;
        font-weight: 800 !important;
        font-size: 13px !important;
        letter-spacing: 0.4px !important;
        text-transform: uppercase !important;
        border-radius: 12px !important;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial !important;
        box-shadow: 0 10px 22px rgba(22,163,74,.22) !important;
        transition: 160ms ease !important;
        width: auto !important;
    }
    
    .signout-container .stButton > button:hover {
        transform: translateY(-1px) !important;
        filter: brightness(1.02) !important;
    }
    
    .section-label {
        margin-top: 18px;
        font-size: 12px;
        letter-spacing: .10em;
        text-transform: uppercase;
        font-weight: 850;
        color: #123B6E;
    }

    .section-heading {
        color: #0F172A;
        font-size: 15px;
        font-weight: 800;
        margin: 6px 0 10px 0;
        letter-spacing: 0.2px;
    }
    
    /* =========================
       13) FORM CONTROLS
       ========================= */
    div[data-testid="stForm"] {
        background: rgba(255,255,255,.92);
        padding: 14px;
        border-radius: 12px;
        box-shadow: 0 6px 18px rgba(15,23,42,.08);
        border: 1px solid rgba(15,23,42,.10);
    }
    
    div[data-testid="stForm"] [data-testid="stVerticalBlock"] {
        gap: 0.5rem !important;
    }
    
    .stTextInput > div > div > input {
        width: 100%;
        background: rgba(248,250,252,.90) !important;
        border: 1px solid rgba(15,23,42,.14) !important;
        border-radius: 12px !important;
        padding: 12px 12px !important;
        font-size: 14px !important;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif !important;
        color: #0F172A !important;
        outline: none;
    }
    
    .stTextInput label {
        font-size: 12px !important;
        margin-bottom: 4px !important;
        color: #64748B !important;
        font-weight: 750 !important;
        letter-spacing: .10em !important;
        text-transform: uppercase !important;
    }
    
    .stTextInput label p {
        color: #64748B !important;
    }
    
    .stTextInput > div > div > input:focus {
        border-color: rgba(18,59,110,.55);
        box-shadow: 0 0 0 4px rgba(18,59,110,.14);
    }
    
    .stSelectbox > div > div {
        border-radius: 12px;
        font-size: 14px;
        background: rgba(248,250,252,.90) !important;
        border: 1px solid rgba(15,23,42,.14) !important;
    }
    
    .stSelectbox label {
        font-size: 12px !important;
        color: #64748B !important;
        font-weight: 750 !important;
        letter-spacing: .10em !important;
        text-transform: uppercase !important;
    }
    
    .stTextArea > div > div > textarea {
        width: 100%;
        background: rgba(248,250,252,.90);
        border: 1px solid rgba(15,23,42,.14);
        border-radius: 12px;
        padding: 12px 12px;
        font-size: 14px;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
        color: #0F172A;
        outline: none;
    }
    
    .stTextArea label {
        font-size: 12px !important;
        color: #64748B !important;
        font-weight: 750 !important;
        letter-spacing: .10em !important;
        text-transform: uppercase !important;
    }
    
    .stTextArea > div > div > textarea:focus {
        border-color: rgba(18,59,110,.55);
        box-shadow: 0 0 0 4px rgba(18,59,110,.14);
    }
    
    .stRadio > div {
        gap: 6px;
    }
    
    .stRadio label {
        padding: 10px 14px !important;
        font-size: 14px !important;
        border: 1px solid rgba(15,23,42,.14) !important;
        border-radius: 12px !important;
        margin-bottom: 6px !important;
        color: #0F172A !important;
        background: rgba(248,250,252,.90) !important;
    }
    
    .stCheckbox label {
        font-size: 14px !important;
        color: #334155 !important;
    }
    
    .stCheckbox label span {
        color: #334155 !important;
    }
    
    .expired-notice {
        background: rgba(255,255,255,.92);
        border-radius: 22px;
        padding: 36px 28px;
        text-align: center;
        max-width: 380px;
        margin: 60px auto;
        box-shadow: 0 22px 60px rgba(15,23,42,.18);
        border: 1px solid rgba(15,23,42,.10);
    }
    
    .inline-error {
        color: #EF4444;
        font-size: 12px;
        margin-top: 4px;
        font-weight: 650;
    }
    
    .field-hint {
        color: #64748B;
        font-size: 12px;
        margin-top: 4px;
    }
    
    p {
        color: #334155 !important;
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
        @keyframes gentle-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
        }
        @keyframes icon-float {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-6px) scale(1.02); }
        }
        @keyframes gentle-pulse {
            0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(35, 196, 131, 0)); }
            50% { transform: scale(1.05); filter: drop-shadow(0 0 8px rgba(35, 196, 131, 0.3)); }
        }
        .app-icon {
            animation: icon-float 3s ease-in-out infinite;
            transition: all 0.3s ease;
        }
        .app-icon:hover {
            animation: gentle-pulse 1.5s ease-in-out infinite;
            filter: drop-shadow(0 6px 12px rgba(35, 196, 131, 0.35));
        }
        @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(90deg) translate(3em) rotate(-90deg); }
            100% { transform: translate(-50%, -50%) rotate(450deg) translate(3em) rotate(-450deg); }
        }
        .loader {
            position: relative;
            width: 6em;
            height: 6em;
            margin: 0 auto;
        }
        .loader .track, .loader .inner-track {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            box-shadow: inset -0.1em -0.1em 0.2em #d1d1d1, inset 0.1em 0.1em 0.2em #ffffff;
        }
        .loader .inner-track {
            width: 80%;
            height: 80%;
            top: 10%;
            left: 10%;
            border: 1.2em solid #f0f0f0;
        }
        .loader .orb {
            position: absolute;
            width: 1em;
            height: 1em;
            top: 50%;
            left: 50%;
            background-color: #c0cfda;
            border-radius: 50%;
            animation: spin 1.5s infinite cubic-bezier(0.68, -0.55, 0.27, 1.55);
            background: radial-gradient(circle at 30% 30%, #ffffff, #23c483);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 -2px 4px rgba(255, 255, 255, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        .loading-text {
            margin-top: 20px;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            color: #64748b;
            letter-spacing: 1px;
        }
        .stApp, [data-testid="stAppViewContainer"], [data-testid="stAppViewBlockContainer"] {
            background: linear-gradient(145deg, #a8b5c4 0%, #9ca8b8 50%, #8e9bab 100%) !important;
        }
        [data-testid="stAppViewContainer"] > .main {
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            min-height: 100vh !important;
            padding: 0 !important;
        }
        [data-testid="stAppViewBlockContainer"] {
            padding: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
        }
        [data-testid="stMainBlockContainer"] {
            background: transparent !important;
            padding: 0 !important;
        }
        [data-testid="stVerticalBlock"] {
            gap: 0.3rem !important;
        }
        [data-testid="column"] {
            display: flex !important;
            justify-content: center !important;
        }
        .login-glass-card {
            background: rgba(255,255,255,0.92);
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 28px 24px;
            max-width: 360px;
            margin: 0 auto;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            position: relative;
            overflow: hidden;
        }
        .login-card-title {
            text-align: center;
            margin-bottom: 20px;
        }
        .login-card-title h1 {
            color: #64748b;
            font-size: 20px;
            font-weight: 500;
            font-family: 'Inter', sans-serif;
            margin: 0 0 6px 0;
            line-height: 1.2;
        }
        .login-card-title .subtitle {
            color: #0f172a;
            font-size: 13px;
            font-family: 'Inter', sans-serif;
            margin: 0;
        }
        .login-card-title .badge {
            display: inline-block;
            background: rgba(35, 196, 131, 0.12);
            color: #23c483;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            font-family: 'Inter', sans-serif;
            margin-top: 10px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        [data-testid="stForm"] .stTextInput label {
            color: #64748b !important;
            font-family: 'Inter', sans-serif !important;
            font-weight: 500 !important;
            font-size: 14px !important;
            margin-bottom: 6px !important;
        }
        [data-testid="stForm"] .stTextInput label p {
            color: #64748b !important;
            font-weight: 500 !important;
        }
        [data-testid="stForm"] .stTextInput > div > div > input {
            border: none !important;
            outline: none !important;
            border-radius: 8px !important;
            padding: 1.1em 1.2em !important;
            background-color: #e8edf3 !important;
            box-shadow: inset 1px 2px 4px rgba(0,0,0,0.06) !important;
            transition: all 0.3s ease !important;
            color: #64748b !important;
            font-family: 'Inter', sans-serif !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
        }
        [data-testid="stForm"] .stTextInput > div > div > input:focus {
            background-color: #ffffff !important;
            transform: scale(1.01) !important;
            box-shadow: 0 0 0 2px rgba(35, 196, 131, 0.2),
                       0 4px 12px rgba(35, 196, 131, 0.1) !important;
        }
        [data-testid="stForm"] .stTextInput > div > div > input::placeholder {
            color: #6b7280 !important;
        }
        [data-testid="stForm"] [data-testid="stNotification"] {
            background: rgba(239, 68, 68, 0.08) !important;
            border: 1px solid rgba(239, 68, 68, 0.2) !important;
            border-radius: 12px !important;
            color: #dc2626 !important;
            font-family: 'Inter', sans-serif !important;
        }
        [data-testid="stForm"] .stAlert {
            background: rgba(239, 68, 68, 0.08) !important;
            border: 1px solid rgba(239, 68, 68, 0.2) !important;
            border-radius: 12px !important;
        }
        [data-testid="stForm"] .stAlert p {
            color: #dc2626 !important;
            font-family: 'Inter', sans-serif !important;
            font-size: 13px !important;
        }
        [data-testid="stForm"] .stFormSubmitButton {
            display: block;
            margin-top: 16px !important;
            text-align: center;
        }
        [data-testid="stForm"] .stFormSubmitButton > button,
        [data-testid="stForm"] .stFormSubmitButton button,
        [data-testid="stForm"] button,
        button[data-testid="stBaseButton-secondaryFormSubmit"] {
            font-size: 14px !important;
            color: #64748b !important;
            font-family: 'Inter', sans-serif !important;
            font-weight: 700 !important;
            cursor: pointer;
            position: relative;
            border: none !important;
            background: none !important;
            background-color: transparent !important;
            text-transform: none !important;
            letter-spacing: 0 !important;
            padding: 12px 0 !important;
            transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1) !important;
            transition-duration: 400ms !important;
            transition-property: color !important;
            box-shadow: none !important;
        }
        [data-testid="stForm"] .stFormSubmitButton > button *,
        [data-testid="stForm"] .stFormSubmitButton button *,
        [data-testid="stForm"] .stFormSubmitButton button p,
        [data-testid="stForm"] .stFormSubmitButton button span,
        [data-testid="stForm"] .stFormSubmitButton button div {
            font-family: 'Inter', sans-serif !important;
            font-weight: 700 !important;
            font-size: 14px !important;
            letter-spacing: 0 !important;
            text-transform: none !important;
            color: #64748b !important;
        }
        [data-testid="stForm"] .stFormSubmitButton > button:focus,
        [data-testid="stForm"] .stFormSubmitButton > button:hover,
        button[data-testid="stBaseButton-secondaryFormSubmit"]:hover {
            color: #23c483 !important;
            background: none !important;
            background-color: transparent !important;
            box-shadow: none !important;
            transform: none !important;
        }
        [data-testid="stForm"] .stFormSubmitButton > button::after,
        button[data-testid="stBaseButton-secondaryFormSubmit"]::after {
            content: "" !important;
            pointer-events: none;
            bottom: 8px;
            left: 50%;
            position: absolute;
            width: 0%;
            height: 2px;
            background-color: #23c483 !important;
            transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
            transition-duration: 400ms;
            transition-property: width, left;
        }
        [data-testid="stForm"] .stFormSubmitButton > button:focus::after,
        [data-testid="stForm"] .stFormSubmitButton > button:hover::after,
        button[data-testid="stBaseButton-secondaryFormSubmit"]:hover::after {
            width: 60% !important;
            left: 20% !important;
        }
        .login-help {
            font-family: 'Inter', sans-serif !important;
            color: #64748b !important;
        }
        .login-help a {
            color: #25D366 !important;
        }
        .login-page-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px 16px;
            width: 100%;
        }
        [data-testid="stForm"] {
            background: white !important;
            border: none !important;
            border-radius: 20px !important;
            padding: 28px 26px !important;
            box-shadow: 
                20px 20px 40px rgba(0, 0, 0, 0.12),
                10px 10px 20px rgba(0, 0, 0, 0.08),
                inset -1px -1px 3px rgba(0, 0, 0, 0.02),
                inset 1px 1px 3px rgba(255, 255, 255, 0.9) !important;
            position: relative;
            overflow: hidden;
            max-width: 360px;
            margin: 0 auto;
        }
        [data-testid="stForm"] > * {
            position: relative;
            z-index: 1;
        }
        .login-glass-card::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
            opacity: 0.045;
            mix-blend-mode: overlay;
            pointer-events: none;
        }
        .login-glass-card .stTextInput > div > div > input {
            background: #f1f5f9 !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 8px;
            color: #64748b !important;
            font-size: 14px;
        }
        .login-glass-card .stTextInput label {
            color: #475569 !important;
            font-size: 13px !important;
        }
        .login-card-header {
            text-align: center;
            margin-bottom: 20px;
        }
        .login-card-header h2 {
            color: #0f172a;
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 4px 0;
        }
        .login-card-header p {
            color: #475569;
            font-size: 13px;
            margin: 0;
        }
        .login-page-header {
            text-align: center;
            padding: 40px 20px 30px;
        }
        .login-page-header h1 {
            color: #0f172a;
            font-size: 26px;
            font-weight: 600;
            margin: 0 0 6px 0;
            line-height: 1.2;
        }
        .login-page-header .subtitle {
            color: #475569;
            font-size: 14px;
            margin: 0;
        }
        .login-page-header .badge {
            display: inline-block;
            background: rgba(35, 196, 131, 0.1);
            color: #23c483;
            padding: 6px 16px;
            border-radius: 14px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 12px;
        }
        .login-help {
            text-align: center;
            margin-top: 16px;
            font-size: 13px;
            color: #64748b;
        }
        .login-help a {
            color: #23c483;
            text-decoration: none;
            font-weight: 600;
        }
    </style>
    """, unsafe_allow_html=True)
    
    logo_html = f'<img src="data:image/png;base64,{LOGO_BASE64}" alt="Baynunah" style="width:130px;height:auto;display:block;margin:0 auto 10px;">' if LOGO_BASE64 else ''
    app_icon_html = f'<img src="data:image/gif;base64,{APP_ICON_BASE64}" alt="Insurance" class="app-icon" style="width:70px;height:70px;display:block;margin:0 auto 12px;border-radius:10px;cursor:pointer;">' if APP_ICON_BASE64 else ''
    
    st.markdown('<div class="login-page-wrapper">', unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        with st.form("login_form"):
            st.markdown(f"""
            <div class="login-card-title">
                {logo_html}
                {app_icon_html}
                <h1>Medical Insurance<br>Verification</h1>
                <span class="pill">Policy Year {POLICY_YEAR}</span>
            </div>
            """, unsafe_allow_html=True)
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
            
            st.markdown("""
            <div style="text-align:center;margin-top:18px;font-family:'Inter',sans-serif;">
                <div style="color:#94a3b8;font-size:11px;font-weight:400;margin-bottom:6px;letter-spacing:0.5px;">Need Help?</div>
                <a href="https://wa.me/971564966546" target="_blank" style="display:inline-block;color:#23c483;text-decoration:none;transition:transform 0.2s ease;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#23c483" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="transition:transform 0.2s ease;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                </a>
            </div>
            """, unsafe_allow_html=True)
            
            if submitted:
                if not staff_number:
                    st.error("Please enter your Staff Number.")
                elif not dob_input:
                    st.error("Please enter your Date of Birth (DD/MM/YYYY).")
                else:
                    loading_placeholder = st.empty()
                    loading_placeholder.markdown("""
                    <div class="loading-overlay">
                        <div class="loader">
                            <div class="track"></div>
                            <div class="inner-track"></div>
                            <div class="orb"></div>
                        </div>
                        <div class="loading-text">Verifying...</div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    df = load_data()
                    is_valid, error_msg = verify_credentials(df, staff_number.upper(), dob_input)
                    
                    loading_placeholder.empty()
                    
                    if is_valid:
                        st.session_state['authenticated'] = True
                        st.session_state['staff_number'] = staff_number.upper()
                        st.session_state['login_time'] = datetime.now().isoformat()
                        st.rerun()
                    else:
                        st.error(error_msg)
    
    st.markdown('</div>', unsafe_allow_html=True)

def render_header(principal_name, staff_number):
    logo_html = f'<img src="data:image/png;base64,{LOGO_BASE64}" alt="Baynunah" class="company-logo-img">' if LOGO_BASE64 else '<div class="company-logo">🏥</div>'
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
    <div class="card card--accent">
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
        <div class="card card--accent">
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
        
        # Edit form card
        st.markdown('<div class="edit-form-card">', unsafe_allow_html=True)
        
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
        
            st.markdown('<div class="edit-section-header-green">Update Information</div>', unsafe_allow_html=True)
        else:
            st.markdown('<div class="edit-section-header" style="color: #23c483;">Update Information</div>', unsafe_allow_html=True)
        
        update_cols = st.columns(3)
        with update_cols[0]:
            marital_options = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]
            current_marital = marital_status.upper() if marital_status and marital_status != "—" else ""
            default_idx = marital_options.index(current_marital) if current_marital in marital_options else 0
            new_marital = st.selectbox("Update Marital Status", marital_options, index=default_idx, key=f"marital_{idx}_{member_number}")
            if new_marital and new_marital.upper() != current_marital:
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
        
        st.markdown('</div>', unsafe_allow_html=True)
        
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
    missing_fields_total = 0
    for _, member in employee_data.iterrows():
        if not format_field(member.get('National Identity')):
            missing_fields_total += 1
        if not format_field(member.get('Visa Unified Number')):
            missing_fields_total += 1
        if not format_field(member.get('Passport number')):
            missing_fields_total += 1

    confirmed_value = principal.get('EmployeeConfirmed') or principal.get('Confirmed')
    confirmation_text = format_field(confirmed_value) or 'Pending submission'
    last_updated = format_field(principal.get('LastEditedOn')) or '—'
    members_count = len(employee_data)
    deadline_str = RENEWAL_DEADLINE.strftime('%d %B %Y')

    st.markdown('<div class="page">', unsafe_allow_html=True)

    render_header(principal_name, staff_number)
    render_status_strip()

    st.markdown(f"""
    <div class="centered-header">
        {'<img src="data:image/png;base64,' + LOGO_BASE64 + '" alt="Baynunah" class="centered-header-logo">' if LOGO_BASE64 else '<span class="header-logo-placeholder">🏥</span>'}
        <div class="centered-header-title">Medical Insurance Renewal</div>
        <div class="centered-header-subtitle">Insured by DAMAN</div>
        <div class="centered-header-year">Year {POLICY_YEAR}</div>
    </div>
    """, unsafe_allow_html=True)

    top_cols = st.columns([1.15, 0.85])
    with top_cols[0]:
        render_employee_snapshot(principal, staff_number)
    with top_cols[1]:
        st.markdown(f"""
        <div class="card card--accent">
            <div class="card-title">🔎 Renewal Overview</div>
            <div class="key-metrics">
                <div class="metric-tile">
                    <div class="metric-label">Covered Members</div>
                    <div class="metric-value">{members_count}</div>
                </div>
                <div class="metric-tile">
                    <div class="metric-label">Items To Update</div>
                    <div class="metric-value">{missing_fields_total}</div>
                </div>
                <div class="metric-tile">
                    <div class="metric-label">Confirmation</div>
                    <div class="metric-value">{confirmation_text}</div>
                </div>
                <div class="metric-tile">
                    <div class="metric-label">Last Updated</div>
                    <div class="metric-value">{last_updated}</div>
                </div>
            </div>
            <div class="section-divider"></div>
            <div class="list-row">
                <span class="list-label">Deadline</span>
                <span class="list-value">{deadline_str}</span>
            </div>
            <div class="list-row">
                <span class="list-label">Session Timeout</span>
                <span class="list-value">{SESSION_TIMEOUT_MINUTES} minutes</span>
            </div>
            <div class="list-row">
                <span class="list-label">Support</span>
                <span class="list-value">WhatsApp HR • +971 56 496 6546</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown('<div class="section-heading">Covered Members</div>', unsafe_allow_html=True)
    render_covered_members(employee_data, staff_number)

    st.markdown('<div class="section-heading">Confirmation & Requests</div>', unsafe_allow_html=True)
    render_confirmation_section(employee_data, staff_number)

    st.markdown("""
    <div style="text-align: center; margin-top: 18px; padding: 12px; color: #94a3b8; font-size: 13px;">
        Need help? <a href="https://wa.me/971564966546" target="_blank" style="color: #23c483; text-decoration: none; font-weight: 500;">WhatsApp HR Support</a>
    </div>
    """, unsafe_allow_html=True)

    st.markdown('<div class="edit-form-card"><div class="signout-container">', unsafe_allow_html=True)
    if st.button("Sign Out", key="footer_signout", type="secondary"):
        st.session_state.clear()
        st.rerun()
    st.markdown('</div></div>', unsafe_allow_html=True)

    st.markdown('</div>', unsafe_allow_html=True)

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

def get_query_params():
    """Get query params with backward compatibility for older Streamlit versions."""
    # Check which API is available
    if hasattr(st, 'query_params'):
        # Newer Streamlit versions (1.30+)
        return st.query_params
    elif hasattr(st, 'experimental_get_query_params'):
        # Older Streamlit versions
        return st.experimental_get_query_params()
    else:
        return {}

def main():
    query_params = get_query_params()
    is_admin = query_params.get('admin') == 'true' or (isinstance(query_params.get('admin'), list) and 'true' in query_params.get('admin', []))
    
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
