import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function Navbar() {
  return (
    <AppBar position="static" color="primary" elevation={0}>
      <Toolbar>
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          <Button color="inherit" sx={{ mr: 2 }}>Home</Button>
          <Button color="inherit" sx={{ mr: 2 }}>About</Button>
          <Button color="inherit" sx={{ mr: 2 }}>Premium</Button>
          <Button color="inherit">Services</Button>
        </Box>
        <Button color="secondary" variant="contained">Login</Button>
      </Toolbar>
    </AppBar>
  );
} 