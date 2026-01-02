# HR GitHub Apps Quick Reference

**Quick lookup table for all recommended GitHub repositories**

---

## 🔍 Quick Search by HR Function

| HR Function | GitHub Repository | Stars | Language | Difficulty |
|------------|-------------------|-------|----------|-----------|
| **Recruitment** |
| Applicant Tracking System | `opencats/OpenCATS` | 1.5k+ | PHP | Medium |
| CRM/Pipeline Management | `twentyhq/twenty` | 15k+ | TypeScript | Low-Medium |
| Interview Scheduling | `calcom/cal.com` | 29k+ | TypeScript | Low |
| **Onboarding** |
| Document Signing | `docusealco/docuseal` | 5.5k+ | Ruby/JS | Low-Medium |
| Notifications | `novuhq/novu` | 33k+ | TypeScript | Low |
| Task Management | `makeplane/plane` | 25k+ | TypeScript | Medium |
| PDF Generation | `pdfme/pdfme` | 3k+ | TypeScript | Low |
| Email Templates | `resend/react-email` | 12k+ | TypeScript | Low |
| Forms & Surveys | `formbricks/formbricks` | 7k+ | TypeScript | Low |
| **Employee Requests** |
| Ticketing System | `Peppermint-Lab/peppermint` | 1.7k+ | TypeScript | Low-Medium |
| Service Desk | `erxes/erxes` | 3.4k+ | TypeScript | Medium |
| **Performance & Probation** |
| Survey Platform | `formbricks/formbricks` | 7k+ | TypeScript | Low-Medium |
| Meeting Scheduling | `lukevella/rallly` | 3.3k+ | TypeScript | Low |
| Analytics | `umami-software/umami` | 20k+ | TypeScript | Low |
| **Job Descriptions** |
| AI (Local) | `ollama/ollama` | 80k+ | Go | Low |
| Text Editor | `ueberdosis/tiptap` | 25k+ | TypeScript | Low |
| **Offboarding** |
| Workflow Automation | `n8n-io/n8n` | 42k+ | TypeScript | Medium |
| **Training** |
| LMS Platform | `moodle/moodle` | 5.4k+ | PHP | Medium-High |
| MOOC Platform | `openedx/edx-platform` | 7.2k+ | Python | High |
| Interactive Lessons | `oppia/oppia` | 5.5k+ | Python/TS | Medium |
| **Attendance** |
| Time Tracking | `kimai/kimai` | 3k+ | PHP | Medium |
| **Leave & Overtime** |
| Leave Management | `timeoff-management/timeoff-management-application` | 2.7k+ | Node.js | Low-Medium |
| Time Tracking (also OT) | `kimai/kimai` | 3k+ | PHP | Medium |
| **Supporting Tools** |
| Document Management | `paperless-ngx/paperless-ngx` | 17k+ | Python | Medium |
| Push Notifications | `binwiederhier/ntfy` | 16k+ | Go | Low |

---

## 📊 By Integration Complexity

### ✅ Low Complexity (1-5 days)
- Cal.com - Interview scheduling
- Novu - Notifications
- Ollama - AI job descriptions
- React Email - Email templates
- ntfy - Push notifications
- Formbricks - Surveys
- Rallly - Meeting scheduling
- Umami - Analytics

### 🟡 Medium Complexity (1-2 weeks)
- Twenty - CRM
- DocuSeal - E-signatures
- Plane - Task management
- Peppermint - Ticketing
- Erxes - Service desk
- Kimai - Time tracking
- TimeOff Management - Leave
- OpenCATS - ATS
- Paperless-ngx - Documents
- Oppia - Learning
- n8n - Automation

### 🔴 High Complexity (3-6 weeks)
- Moodle - Full LMS
- Open edX - MOOC platform

---

## 🎯 Recommended Starting Point (MVP)

**2-Week Quick Start Package:**

1. **Novu** (Notifications) - 2 days
2. **DocuSeal** (E-signatures) - 3 days
3. **Cal.com** (Scheduling) - 2 days
4. **Formbricks** (Surveys) - 2 days
5. **Twenty** (Basic CRM) - 3 days

**Total:** 12 days | **Cost:** $0 (all self-hosted)

**Value Delivered:**
- ✅ Automated email notifications
- ✅ Digital document signing
- ✅ Self-service interview booking
- ✅ Employee surveys
- ✅ Basic candidate tracking

---

## 🔗 Direct GitHub Links

### Recruitment
- OpenCATS: https://github.com/opencats/OpenCATS
- Twenty CRM: https://github.com/twentyhq/twenty
- Cal.com: https://github.com/calcom/cal.com

### Onboarding
- DocuSeal: https://github.com/docusealco/docuseal
- Novu: https://github.com/novuhq/novu
- Plane: https://github.com/makeplane/plane
- Formbricks: https://github.com/formbricks/formbricks
- React Email: https://github.com/resend/react-email
- pdfme: https://github.com/pdfme/pdfme

### Employee Requests
- Peppermint: https://github.com/Peppermint-Lab/peppermint
- Erxes: https://github.com/erxes/erxes

### Performance
- Rallly: https://github.com/lukevella/rallly
- Umami: https://github.com/umami-software/umami

### AI Tools
- Ollama: https://github.com/ollama/ollama
- TipTap: https://github.com/ueberdosis/tiptap

### Automation
- n8n: https://github.com/n8n-io/n8n

### Learning
- Moodle: https://github.com/moodle/moodle
- Open edX: https://github.com/openedx/edx-platform
- Oppia: https://github.com/oppia/oppia

### Time & Attendance
- Kimai: https://github.com/kimai/kimai
- TimeOff: https://github.com/timeoff-management/timeoff-management-application

### Documents
- Paperless-ngx: https://github.com/paperless-ngx/paperless-ngx
- ntfy: https://github.com/binwiederhier/ntfy

---

## 💡 Selection Criteria

When choosing which apps to integrate, consider:

1. **Active Maintenance** - Last commit within 3 months ✅
2. **Community Size** - Active issues & PRs ✅
3. **Documentation** - Clear setup guides ✅
4. **API Quality** - RESTful, well-documented ✅
5. **Tech Stack Compatibility** - Python/Node.js preferred ✅
6. **Self-Hosting** - Can run on your infrastructure ✅
7. **License** - Open source, commercial-friendly ✅

---

## 🚀 Next Steps

1. Review the [full integration guide](HR_APPS_INTEGRATION_GUIDE.md)
2. Choose 2-3 high-priority modules
3. Set up development environment
4. Deploy chosen apps (Docker recommended)
5. Build API integration layer
6. Test with small user group
7. Roll out to full organization

---

**Last Updated:** January 2026  
**For detailed integration instructions, see:** [HR Apps Integration Guide](HR_APPS_INTEGRATION_GUIDE.md)

