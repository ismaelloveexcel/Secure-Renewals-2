import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  IconButton,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Badge as BadgeIcon,
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  Send as SendIcon,
  QrCode2 as QrCode2Icon
} from '@mui/icons-material';

const GeneratePassDialog = ({ open, onClose, onSuccess, prefilledRRF }) => {
  const [step, setStep] = useState(0);
  const [passType, setPassType] = useState('hiring_manager');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedPass, setGeneratedPass] = useState(null);

  // Form data based on pass type
  const [formData, setFormData] = useState({
    // Hiring Manager
    rrfId: '',
    managerName: '',
    managerEmail: '',
    managerPhone: '',
    department: '',

    // Candidate
    candidateId: '',
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    position: '',

    // Employee
    employeeId: '',
    fullName: '',
    email: '',
    phone: '',
    jobTitle: '',
    lineManager: '',

    // Manager (3-in-1)
    teamSize: ''
  });

  const [rrfs, setRRFs] = useState([]);

  useEffect(() => {
    if (open) {
      fetchActiveRRFs();
      if (prefilledRRF) {
        setFormData(prev => ({
          ...prev,
          rrfId: prefilledRRF.id,
          department: prefilledRRF.department,
          position: prefilledRRF.job_title
        }));
      }
    }
  }, [open, prefilledRRF]);

  const fetchActiveRRFs = async () => {
    try {
      const response = await fetch('/api/recruitment/rrf/active');
      const data = await response.json();
      setRRFs(data);
    } catch (error) {
      console.error('Error fetching RRFs:', error);
    }
  };

  const passTypes = [
    { value: 'hiring_manager', label: 'Hiring Manager Pass', description: 'For managers to review candidates and conduct interviews' },
    { value: 'candidate', label: 'Candidate Pass', description: 'For candidates to track application and upload documents' },
    { value: 'employee', label: 'Employee Pass', description: 'For new hires to access attendance, leave, payroll' },
    { value: 'manager', label: 'Manager Pass (3-in-1)', description: 'Personal + Team Management + Recruitment' }
  ];

  const steps = ['Select Pass Type', 'Enter Details', 'Generated Pass'];

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      handleGenerate();
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      let endpoint = '';
      let payload = {};

      switch (passType) {
        case 'hiring_manager':
          endpoint = '/api/passes/generate/hiring-manager';
          payload = {
            rrfId: formData.rrfId,
            managerName: formData.managerName,
            managerEmail: formData.managerEmail,
            managerPhone: formData.managerPhone,
            department: formData.department
          };
          break;

        case 'candidate':
          endpoint = '/api/passes/generate/candidate';
          payload = {
            candidateId: formData.candidateId,
            candidateName: formData.candidateName,
            candidateEmail: formData.candidateEmail,
            candidatePhone: formData.candidatePhone,
            rrfId: formData.rrfId,
            position: formData.position
          };
          break;

        case 'employee':
          endpoint = '/api/passes/generate/employee';
          payload = {
            employeeId: formData.employeeId,
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            department: formData.department,
            jobTitle: formData.jobTitle,
            lineManager: formData.lineManager
          };
          break;

        case 'manager':
          endpoint = '/api/passes/generate/manager';
          payload = {
            employeeId: formData.employeeId,
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            department: formData.department,
            jobTitle: formData.jobTitle,
            teamSize: formData.teamSize
          };
          break;

        default:
          throw new Error('Invalid pass type');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to generate pass');
      }

      const data = await response.json();
      setGeneratedPass(data.pass);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to generate pass');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (generatedPass) {
      navigator.clipboard.writeText(generatedPass.accessUrl);
    }
  };

  const handleReset = () => {
    setStep(0);
    setFormData({});
    setGeneratedPass(null);
    setError('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BadgeIcon />
            <Typography variant="h6">Generate Access Pass</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
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

        {/* Step 0: Select Pass Type */}
        {step === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Passes are unique access tokens generated by HR. Recipients receive a secure link and QR code to access their personalized portal.
              </Alert>
            </Grid>

            {passTypes.map((type) => (
              <Grid item xs={12} sm={6} key={type.value}>
                <Card
                  onClick={() => setPassType(type.value)}
                  sx={{
                    cursor: 'pointer',
                    border: passType === type.value ? '2px solid #667eea' : '1px solid #e0e0e0',
                    backgroundColor: passType === type.value ? '#f5f7ff' : 'white',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                      {type.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {type.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Step 1: Enter Details */}
        {step === 1 && (
          <Grid container spacing={3}>
            {passType === 'hiring_manager' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Select RRF / Position"
                    value={formData.rrfId}
                    onChange={handleChange('rrfId')}
                  >
                    {rrfs.map((rrf) => (
                      <MenuItem key={rrf.id} value={rrf.id}>
                        {rrf.rrf_number} - {rrf.job_title} ({rrf.department})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Manager Name"
                    value={formData.managerName}
                    onChange={handleChange('managerName')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Manager Email"
                    type="email"
                    value={formData.managerEmail}
                    onChange={handleChange('managerEmail')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Manager Phone"
                    value={formData.managerPhone}
                    onChange={handleChange('managerPhone')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    value={formData.department}
                    onChange={handleChange('department')}
                  />
                </Grid>
              </>
            )}

            {passType === 'candidate' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Candidate ID"
                    value={formData.candidateId}
                    onChange={handleChange('candidateId')}
                    placeholder="e.g., CAND-2025-0001"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Candidate Name"
                    value={formData.candidateName}
                    onChange={handleChange('candidateName')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Candidate Email"
                    type="email"
                    value={formData.candidateEmail}
                    onChange={handleChange('candidateEmail')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Candidate Phone"
                    value={formData.candidatePhone}
                    onChange={handleChange('candidatePhone')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Position Applied For"
                    value={formData.rrfId}
                    onChange={(e) => {
                      const selectedRRF = rrfs.find(r => r.id === e.target.value);
                      setFormData({
                        ...formData,
                        rrfId: e.target.value,
                        position: selectedRRF?.job_title || ''
                      });
                    }}
                  >
                    {rrfs.map((rrf) => (
                      <MenuItem key={rrf.id} value={rrf.id}>
                        {rrf.job_title}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </>
            )}

            {(passType === 'employee' || passType === 'manager') && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Employee ID"
                    value={formData.employeeId}
                    onChange={handleChange('employeeId')}
                    placeholder="e.g., EMP-2025-001"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Full Name"
                    value={formData.fullName}
                    onChange={handleChange('fullName')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    value={formData.department}
                    onChange={handleChange('department')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Job Title"
                    value={formData.jobTitle}
                    onChange={handleChange('jobTitle')}
                  />
                </Grid>
                {passType === 'employee' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Line Manager"
                      value={formData.lineManager}
                      onChange={handleChange('lineManager')}
                    />
                  </Grid>
                )}
                {passType === 'manager' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Team Size"
                      type="number"
                      value={formData.teamSize}
                      onChange={handleChange('teamSize')}
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                )}
              </>
            )}
          </Grid>
        )}

        {/* Step 2: Generated Pass */}
        {step === 2 && generatedPass && (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              ✓ Pass generated successfully! Send the access link to the recipient.
            </Alert>

            <Grid container spacing={3}>
              {/* Pass Details */}
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Pass Details
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Pass ID
                      </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {generatedPass.passId}
                      </Typography>
                    </Box>

                    {generatedPass.expiresAt && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Expires On
                        </Typography>
                        <Typography variant="body1">
                          {new Date(generatedPass.expiresAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Access URL
                      </Typography>
                      <Box sx={{
                        p: 1.5,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1
                      }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {generatedPass.accessUrl}
                        </Typography>
                        <IconButton size="small" onClick={handleCopyUrl}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* QR Code */}
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ border: '1px solid #e0e0e0', textAlign: 'center' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      QR Code
                    </Typography>
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      mb: 2
                    }}>
                      <img
                        src={generatedPass.qrCode}
                        alt="Pass QR Code"
                        style={{ width: 200, height: 200 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Scan to access pass
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        {step === 2 ? (
          <>
            <Button onClick={handleReset}>
              Generate Another
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => {
                // TODO: Send email
                onSuccess();
                handleReset();
                onClose();
              }}
              sx={{ background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' }}
            >
              Send via Email
            </Button>
          </>
        ) : (
          <>
            <Button onClick={step === 0 ? onClose : () => setStep(step - 1)} disabled={loading}>
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
            >
              {step === 0 ? 'Next' : 'Generate Pass'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GeneratePassDialog;
