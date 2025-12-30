import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  MenuItem,
  Chip,
  Alert,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormControlLabel,
  Autocomplete
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const CandidatePoolForm = () => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    nationality: '',
    currentLocation: '',
    linkedinProfile: '',
    preferredFunctions: [],
    yearsExperience: '',
    expectedSalary: '',
    noticePeriod: '',
    visaStatus: '',
    willingToRelocate: false
  });

  const [cvFile, setCvFile] = useState(null);

  const functions = [
    'Human Resources',
    'Finance & Accounting',
    'Engineering',
    'IT & Technology',
    'Marketing & Sales',
    'Operations',
    'Legal & Compliance',
    'R&D',
    'Customer Service',
    'Administration'
  ];

  const visaStatuses = [
    'UAE Resident',
    'Visit Visa',
    'Sponsorship Required',
    'Transferable Visa',
    'Other'
  ];

  const noticePeriods = [
    'Immediate',
    '1 Month',
    '2 Months',
    '3 Months',
    'More than 3 Months'
  ];

  const steps = ['Personal Information', 'Professional Details', 'CV Upload & Submit'];

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setCvFile(file);
      setError('');
    }
  };

  const handleNext = () => {
    // Validate current step
    if (step === 0) {
      if (!formData.fullName || !formData.email || !formData.phone) {
        setError('Please fill in all required fields');
        return;
      }
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }
    }

    if (step === 1) {
      if (formData.preferredFunctions.length === 0) {
        setError('Please select at least one preferred function');
        return;
      }
    }

    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    // Validate CV upload
    if (!cvFile) {
      setError('Please upload your CV');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('data', JSON.stringify(formData));
      submitData.append('cv_file', cvFile);

      const response = await fetch('/api/recruitment/candidate-pool/submit', {
        method: 'POST',
        body: submitData
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      setSuccess(true);
    } catch (err) {
      setError('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={0} sx={{
          p: 6,
          textAlign: 'center',
          border: '1px solid #e0e0e0',
          borderRadius: 3
        }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: '#2ecc71', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#2c3e50', mb: 2 }}>
            Application Submitted Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Thank you for submitting your CV to Baynunah Group.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            We have received your application and added your profile to our talent pool.
            Our recruitment team will review your qualifications and contact you when suitable opportunities arise.
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#2c3e50' }}>
            You will receive a confirmation email at: {formData.email}
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 6
    }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: 'white', mb: 2 }}>
            Join Our Talent Pool
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 400 }}>
            Baynunah Group - HR Portal
          </Typography>
        </Box>

        {/* Form Paper */}
        <Paper elevation={8} sx={{ p: 4, borderRadius: 3 }}>
          {/* Stepper */}
          <Stepper activeStep={step} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {submitting && <LinearProgress sx={{ mb: 3 }} />}

          {/* Step 0: Personal Information */}
          {step === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', mb: 2 }}>
                  Personal Information
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Full Name"
                  value={formData.fullName}
                  onChange={handleChange('fullName')}
                  placeholder="As per Emirates ID or Passport"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  placeholder="your.email@example.com"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Phone Number"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  placeholder="+971 XX XXX XXXX"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nationality"
                  value={formData.nationality}
                  onChange={handleChange('nationality')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Current Location"
                  value={formData.currentLocation}
                  onChange={handleChange('currentLocation')}
                  placeholder="City, Country"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="LinkedIn Profile (Optional)"
                  value={formData.linkedinProfile}
                  onChange={handleChange('linkedinProfile')}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </Grid>
            </Grid>
          )}

          {/* Step 1: Professional Details */}
          {step === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', mb: 2 }}>
                  Professional Details
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={functions}
                  value={formData.preferredFunctions}
                  onChange={(event, newValue) => {
                    setFormData({ ...formData, preferredFunctions: newValue });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Preferred Functions *"
                      placeholder="Select up to 3 functions"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        sx={{ backgroundColor: '#667eea15', color: '#667eea' }}
                      />
                    ))
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Years of Experience"
                  type="number"
                  value={formData.yearsExperience}
                  onChange={handleChange('yearsExperience')}
                  InputProps={{ inputProps: { min: 0, max: 50 } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Expected Salary (AED)"
                  value={formData.expectedSalary}
                  onChange={handleChange('expectedSalary')}
                  placeholder="e.g., 15,000 - 20,000"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Notice Period"
                  value={formData.noticePeriod}
                  onChange={handleChange('noticePeriod')}
                >
                  {noticePeriods.map((period) => (
                    <MenuItem key={period} value={period}>
                      {period}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="UAE Visa Status"
                  value={formData.visaStatus}
                  onChange={handleChange('visaStatus')}
                >
                  {visaStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.willingToRelocate}
                      onChange={(e) => setFormData({ ...formData, willingToRelocate: e.target.checked })}
                    />
                  }
                  label="I am willing to relocate to UAE if required"
                />
              </Grid>
            </Grid>
          )}

          {/* Step 2: CV Upload */}
          {step === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', mb: 2 }}>
                  Upload Your CV
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{
                  border: '2px dashed #e0e0e0',
                  borderRadius: 2,
                  p: 6,
                  textAlign: 'center',
                  backgroundColor: '#fafafa',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#667eea',
                    backgroundColor: '#f5f7ff'
                  }
                }}>
                  <input
                    accept=".pdf,.doc,.docx"
                    style={{ display: 'none' }}
                    id="cv-file-upload"
                    type="file"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="cv-file-upload" style={{ cursor: 'pointer' }}>
                    <CloudUploadIcon sx={{ fontSize: 64, color: '#667eea', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1, color: '#2c3e50' }}>
                      {cvFile ? cvFile.name : 'Click to upload your CV'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Supported formats: PDF, DOC, DOCX (Max 5MB)
                    </Typography>
                  </label>
                </Box>
              </Grid>

              {cvFile && (
                <Grid item xs={12}>
                  <Alert severity="success">
                    ✓ CV uploaded: {cvFile.name} ({(cvFile.size / 1024 / 1024).toFixed(2)} MB)
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                    What happens next?
                  </Typography>
                  <Typography variant="body2">
                    • Your profile will be added to our talent pool<br />
                    • You'll receive a confirmation email<br />
                    • Our recruitment team will review your CV<br />
                    • We'll contact you when suitable opportunities arise
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          )}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
            <Button
              disabled={step === 0 || submitting}
              onClick={handleBack}
              size="large"
            >
              Back
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {step < 2 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  size="large"
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    px: 4
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={submitting || !cvFile}
                  startIcon={<SendIcon />}
                  size="large"
                  sx={{
                    background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                    px: 4,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                    }
                  }}
                >
                  Submit Application
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Footer */}
        <Typography variant="body2" sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.8)', mt: 4 }}>
          Powered by Baynunah Group HR System
        </Typography>
      </Container>
    </Box>
  );
};

export default CandidatePoolForm;
