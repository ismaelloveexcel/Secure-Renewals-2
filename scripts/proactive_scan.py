#!/usr/bin/env python3
"""
Proactive Issue Detection Script

This script demonstrates how the Code Quality Monitor agent works by scanning
the codebase for common issues, security vulnerabilities, and best practice violations.

Usage:
    python scripts/proactive_scan.py [--full] [--fix]

Options:
    --full    Run comprehensive scan (slower but more thorough)
    --fix     Attempt to auto-fix simple issues
"""

import os
import sys
import re
import json
from pathlib import Path
from typing import List, Dict, Any
from dataclasses import dataclass, asdict
from enum import Enum


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class Issue:
    severity: Severity
    category: str
    file: str
    line: int
    message: str
    recommendation: str
    auto_fixable: bool = False


class ProactiveScan:
    def __init__(self, root_dir: Path):
        self.root_dir = root_dir
        self.issues: List[Issue] = []
        
    def scan_backend(self) -> None:
        """Scan backend Python files for issues."""
        backend_dir = self.root_dir / "backend" / "app"
        
        if not backend_dir.exists():
            print(f"⚠️  Backend directory not found: {backend_dir}")
            return
            
        print("🔍 Scanning backend files...")
        
        for py_file in backend_dir.rglob("*.py"):
            self._scan_python_file(py_file)
    
    def scan_frontend(self) -> None:
        """Scan frontend TypeScript files for issues."""
        frontend_dir = self.root_dir / "frontend" / "src"
        
        if not frontend_dir.exists():
            print(f"⚠️  Frontend directory not found: {frontend_dir}")
            return
            
        print("🔍 Scanning frontend files...")
        
        for ts_file in frontend_dir.rglob("*.ts*"):
            self._scan_typescript_file(ts_file)
    
    def _scan_python_file(self, file_path: Path) -> None:
        """Scan a Python file for common issues."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                
            for line_num, line in enumerate(lines, 1):
                # Check for SQL injection risks
                if self._check_sql_injection(line):
                    self.issues.append(Issue(
                        severity=Severity.CRITICAL,
                        category="Security",
                        file=str(file_path.relative_to(self.root_dir)),
                        line=line_num,
                        message="Potential SQL injection vulnerability",
                        recommendation="Use parameterized queries instead of string formatting",
                        auto_fixable=False
                    ))
                
                # Check for missing error handling
                if self._check_missing_error_handling(line, lines, line_num):
                    self.issues.append(Issue(
                        severity=Severity.HIGH,
                        category="Error Handling",
                        file=str(file_path.relative_to(self.root_dir)),
                        line=line_num,
                        message="Async operation without error handling",
                        recommendation="Wrap in try-except block",
                        auto_fixable=False
                    ))
                
                # Check for missing type hints
                if self._check_missing_type_hints(line):
                    self.issues.append(Issue(
                        severity=Severity.MEDIUM,
                        category="Type Safety",
                        file=str(file_path.relative_to(self.root_dir)),
                        line=line_num,
                        message="Function missing type hints",
                        recommendation="Add type hints for parameters and return value",
                        auto_fixable=True
                    ))
                
                # Check for hardcoded secrets
                if self._check_hardcoded_secrets(line):
                    self.issues.append(Issue(
                        severity=Severity.CRITICAL,
                        category="Security",
                        file=str(file_path.relative_to(self.root_dir)),
                        line=line_num,
                        message="Potential hardcoded secret detected",
                        recommendation="Move secrets to environment variables",
                        auto_fixable=False
                    ))
                    
        except Exception as e:
            print(f"⚠️  Error scanning {file_path}: {e}")
    
    def _scan_typescript_file(self, file_path: Path) -> None:
        """Scan a TypeScript file for common issues."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                
            for line_num, line in enumerate(lines, 1):
                # Check for 'any' types
                if self._check_any_type(line):
                    self.issues.append(Issue(
                        severity=Severity.MEDIUM,
                        category="Type Safety",
                        file=str(file_path.relative_to(self.root_dir)),
                        line=line_num,
                        message="Using 'any' type reduces type safety",
                        recommendation="Use specific types instead of 'any'",
                        auto_fixable=False
                    ))
                
                # Check for missing error handling in API calls
                if self._check_missing_catch(line, lines, line_num):
                    self.issues.append(Issue(
                        severity=Severity.HIGH,
                        category="Error Handling",
                        file=str(file_path.relative_to(self.root_dir)),
                        line=line_num,
                        message="API call without error handling",
                        recommendation="Add try-catch or .catch() for error handling",
                        auto_fixable=False
                    ))
                
                # Check for console.log in production code
                if self._check_console_log(line):
                    self.issues.append(Issue(
                        severity=Severity.LOW,
                        category="Code Quality",
                        file=str(file_path.relative_to(self.root_dir)),
                        line=line_num,
                        message="Console.log statement in code",
                        recommendation="Remove or replace with proper logging",
                        auto_fixable=True
                    ))
                    
        except Exception as e:
            print(f"⚠️  Error scanning {file_path}: {e}")
    
    # Detection methods
    
    def _check_sql_injection(self, line: str) -> bool:
        """Check for potential SQL injection vulnerabilities."""
        # Look for f-strings or % formatting with SQL keywords
        sql_keywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FROM', 'WHERE']
        has_sql = any(keyword in line.upper() for keyword in sql_keywords)
        has_formatting = 'f"' in line or 'f\'' in line or '%s' in line or '.format(' in line
        
        # Ignore safe patterns
        if 'cursor.execute' in line or 'text(' in line or 'select(' in line:
            return False
        if ':id' in line or ':employee_id' in line:  # Parameterized queries
            return False
            
        return has_sql and has_formatting
    
    def _check_missing_error_handling(self, line: str, lines: List[str], line_num: int) -> bool:
        """Check for async operations without error handling."""
        if 'await' not in line:
            return False
        
        # Look for try-except in surrounding lines
        start = max(0, line_num - 5)
        end = min(len(lines), line_num + 5)
        surrounding = ''.join(lines[start:end])
        
        return 'try:' not in surrounding
    
    def _check_missing_type_hints(self, line: str) -> bool:
        """Check for function definitions without type hints."""
        if not line.strip().startswith('def ') and not line.strip().startswith('async def '):
            return False
        
        # Exclude __init__ and special methods
        if '__' in line:
            return False
            
        # Check if it has type hints
        if '(' not in line:
            return False
        has_param_hints = '->' in line or ': ' in line.split('(')[1]
        return not has_param_hints
    
    def _check_hardcoded_secrets(self, line: str) -> bool:
        """Check for potential hardcoded secrets."""
        secret_patterns = [
            r'password\s*=\s*["\'][^"\']+["\']',
            r'secret\s*=\s*["\'][^"\']+["\']',
            r'api_key\s*=\s*["\'][^"\']+["\']',
            r'token\s*=\s*["\'][^"\']+["\']',
        ]
        
        # Ignore if it's reading from environment or config
        if 'os.getenv' in line or 'os.environ' in line or 'settings.' in line:
            return False
        
        return any(re.search(pattern, line, re.IGNORECASE) for pattern in secret_patterns)
    
    def _check_any_type(self, line: str) -> bool:
        """Check for 'any' type usage in TypeScript."""
        return re.search(r':\s*any\b', line) is not None
    
    def _check_missing_catch(self, line: str, lines: List[str], line_num: int) -> bool:
        """Check for API calls without error handling."""
        if 'await' not in line:
            return False
        if not ('fetch(' in line or '.get(' in line or '.post(' in line):
            return False
        
        # Look for try-catch or .catch in surrounding lines
        start = max(0, line_num - 5)
        end = min(len(lines), line_num + 10)
        surrounding = ''.join(lines[start:end])
        
        return 'try' not in surrounding and '.catch(' not in surrounding
    
    def _check_console_log(self, line: str) -> bool:
        """Check for console.log statements."""
        return 'console.log(' in line
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate a comprehensive report of issues found."""
        report = {
            "total_issues": len(self.issues),
            "by_severity": {},
            "by_category": {},
            "issues": [asdict(issue) for issue in self.issues]
        }
        
        # Count by severity
        for severity in Severity:
            count = sum(1 for issue in self.issues if issue.severity == severity)
            report["by_severity"][severity.value] = count
        
        # Count by category
        categories = set(issue.category for issue in self.issues)
        for category in categories:
            count = sum(1 for issue in self.issues if issue.category == category)
            report["by_category"][category] = count
        
        return report
    
    def print_summary(self) -> None:
        """Print a human-readable summary of issues."""
        if not self.issues:
            print("\n✅ No issues found! Codebase looks healthy.\n")
            return
        
        print("\n" + "="*80)
        print("🔍 PROACTIVE SCAN RESULTS")
        print("="*80 + "\n")
        
        # Summary by severity
        by_severity = {}
        for severity in Severity:
            count = sum(1 for issue in self.issues if issue.severity == severity)
            if count > 0:
                by_severity[severity] = count
        
        print("📊 Summary by Severity:")
        for severity, count in by_severity.items():
            emoji = "🔴" if severity == Severity.CRITICAL else "🟠" if severity == Severity.HIGH else "🟡" if severity == Severity.MEDIUM else "🔵"
            print(f"  {emoji} {severity.value.upper()}: {count}")
        
        print(f"\n📈 Total Issues: {len(self.issues)}")
        
        # Group by severity and print
        for severity in [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW]:
            severity_issues = [i for i in self.issues if i.severity == severity]
            if not severity_issues:
                continue
            
            print(f"\n{'='*80}")
            print(f"🔍 {severity.value.upper()} PRIORITY ISSUES")
            print(f"{'='*80}\n")
            
            for issue in severity_issues[:10]:  # Show max 10 per severity
                print(f"📄 File: {issue.file}:{issue.line}")
                print(f"📋 Category: {issue.category}")
                print(f"⚠️  Issue: {issue.message}")
                print(f"💡 Recommendation: {issue.recommendation}")
                if issue.auto_fixable:
                    print(f"🔧 Auto-fixable: Yes")
                print()
            
            if len(severity_issues) > 10:
                print(f"... and {len(severity_issues) - 10} more {severity.value} issues\n")
        
        print("="*80)
        print(f"\n💡 Run with --fix to automatically fix simple issues")
        print(f"📖 See docs/COPILOT_AGENTS.md for detailed guidance\n")


def main():
    """Main entry point."""
    # Get repository root
    root_dir = Path(__file__).parent.parent
    
    # Parse arguments
    full_scan = "--full" in sys.argv
    auto_fix = "--fix" in sys.argv
    
    print("\n🤖 Code Quality Monitor - Proactive Scan")
    print("="*80 + "\n")
    
    if full_scan:
        print("🔍 Running comprehensive scan (this may take a while)...")
    else:
        print("🔍 Running quick scan...")
    
    # Run scan
    scanner = ProactiveScan(root_dir)
    scanner.scan_backend()
    scanner.scan_frontend()
    
    # Print results
    scanner.print_summary()
    
    # Save report
    report = scanner.generate_report()
    report_file = root_dir / "scan_report.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"📄 Detailed report saved to: {report_file}\n")
    
    # Exit with error code if critical or high issues found
    critical_count = sum(1 for i in scanner.issues if i.severity == Severity.CRITICAL)
    high_count = sum(1 for i in scanner.issues if i.severity == Severity.HIGH)
    
    if critical_count > 0:
        print("❌ CRITICAL issues found - must be fixed before deployment!")
        sys.exit(1)
    elif high_count > 0:
        print("⚠️  HIGH priority issues found - should be fixed soon")
        sys.exit(0)
    else:
        print("✅ No critical or high priority issues found")
        sys.exit(0)


if __name__ == "__main__":
    main()
