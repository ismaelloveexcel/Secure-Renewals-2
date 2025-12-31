import React, { useState, useEffect } from 'react';
import {
  Container,
  Tabs,
  Tab,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Badge,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Work as WorkIcon,
  People as PeopleIcon,
  CloudUpload as CloudUploadIcon,
  Badge as BadgeIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  HelpOutline as HelpOutlineIcon
} from '@mui/icons-material';

// Import sub-components
import ActiveRRFsTab from '../../components/recruitment/ActiveRRFsTab';
import CandidatePoolTab from '../../components/recruitment/CandidatePoolTab';
import ExternalSubmissionsTab from '../../components/recruitment/ExternalSubmissionsTab';
import CreateRRFDialog from '../../components/recruitment/CreateRRFDialog';
import GeneratePassDialog from '../../components/recruitment/GeneratePassDialog';

// Helper tooltip component for inline documentation
// Accepts additional props for flexibility
const HelpTooltip = ({ title, placement = "top", size = "small", ...rest }) => (
  <Tooltip title={title} placement={placement} arrow {...rest}>
    <IconButton size={size} sx={{ ml: 0.5, opacity: 0.6, '&:hover': { opacity: 1 } }}>
      <HelpOutlineIcon fontSize={size} />
    </IconButton>
  </Tooltip>
);

const AdminRecruitmentDashboard = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [stats, setStats] = useState({
    activeRRFs: 0,
    candidatePool: 0,
    pendingSubmissions: 0,
    interviewsScheduled: 0
  });

  const [createRRFOpen, setCreateRRFOpen] = useState(false);
  const [generatePassOpen, setGeneratePassOpen] = useState(false);

  // Fetch dashboard stats
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/recruitment/dashboard-stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header with Help */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#2c3e50' }}>
              Recruitment Dashboard
            </Typography>
            <HelpTooltip title="This dashboard shows all active recruitment requests, candidates in the talent pool, and pending submissions. Use the quick action buttons to create new RRFs or generate passes." />
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Manage recruitment requests, candidate pool, and hiring pipeline
          </Typography>
        </Box>
        
        {/* Quick Stats Summary */}
        <Box sx={{ 
          display: { xs: 'none', md: 'flex' }, 
          alignItems: 'center', 
          gap: 2,
          p: 2,
          backgroundColor: '#f8f9fa',
          borderRadius: 2
        }}>
          <Typography variant="body2" color="text.secondary">
            Last updated: {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{
            border: '1px solid #e0e0e0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            cursor: 'pointer',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.activeRRFs}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Active Positions
                  </Typography>
                </Box>
                <WorkIcon sx={{ fontSize: 48, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{
            border: '1px solid #e0e0e0',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.candidatePool}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Talent Pool
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 48, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{
            border: '1px solid #e0e0e0',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.pendingSubmissions}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Pending Review
                  </Typography>
                </Box>
                <CloudUploadIcon sx={{ fontSize: 48, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{
            border: '1px solid #e0e0e0',
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.interviewsScheduled}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Interviews Scheduled
                  </Typography>
                </Box>
                <BadgeIcon sx={{ fontSize: 48, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateRRFOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #653c8d 100%)',
              boxShadow: '0 6px 16px rgba(102, 126, 234, 0.5)',
            }
          }}
        >
          Create New RRF
        </Button>

        <Button
          variant="contained"
          startIcon={<BadgeIcon />}
          onClick={() => setGeneratePassOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            boxShadow: '0 4px 12px rgba(240, 147, 251, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #df7ce9 0%, #e0465c 100%)',
              boxShadow: '0 6px 16px rgba(240, 147, 251, 0.5)',
            }
          }}
        >
          Generate Pass
        </Button>

        <Button
          variant="outlined"
          startIcon={<SearchIcon />}
          onClick={() => setCurrentTab(1)}
        >
          Search Talent Pool
        </Button>
      </Box>

      {/* Main Tabs */}
      <Paper elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: '1px solid #e0e0e0',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.95rem'
            }
          }}
        >
          <Tab label="Active Positions" />
          <Tab label="Talent Pool" />
          <Tab label="External Submissions" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Tab 0: Active RRFs */}
          {currentTab === 0 && <ActiveRRFsTab onRefresh={fetchDashboardStats} />}

          {/* Tab 1: Candidate Pool */}
          {currentTab === 1 && <CandidatePoolTab />}

          {/* Tab 2: External Submissions */}
          {currentTab === 2 && <ExternalSubmissionsTab onRefresh={fetchDashboardStats} />}
        </Box>
      </Paper>

      {/* Dialogs */}
      <CreateRRFDialog
        open={createRRFOpen}
        onClose={() => setCreateRRFOpen(false)}
        onSuccess={() => {
          setCreateRRFOpen(false);
          fetchDashboardStats();
        }}
      />

      <GeneratePassDialog
        open={generatePassOpen}
        onClose={() => setGeneratePassOpen(false)}
        onSuccess={() => {
          setGeneratePassOpen(false);
        }}
      />
    </Container>
  );
};

export default AdminRecruitmentDashboard;
