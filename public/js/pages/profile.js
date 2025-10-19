// Profile Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
  initAvatarUpload();
  initProfileForm();
  initPasswordForm();
  initDeleteAccount();
});

// Initialize avatar upload
function initAvatarUpload() {
  const uploadBtn = document.getElementById('uploadAvatarBtn');
  const input = document.getElementById('avatarInput');
  const avatar = document.getElementById('avatarImage');
  
  uploadBtn.addEventListener('click', () => {
    input.click();
  });
  
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        avatar.src = e.target.result;
        showToast('Avatar uploaded successfully!', 'success');
      };
      reader.readAsDataURL(file);
    }
  });
}

// Initialize profile form
function initProfileForm() {
  const form = document.getElementById('profileForm');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = {
      firstName: document.getElementById('firstName').value,
      lastName: document.getElementById('lastName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      jobTitle: document.getElementById('jobTitle').value,
      department: document.getElementById('department').value,
      bio: document.getElementById('bio').value
    };
    
    // Save to localStorage
    localStorage.setItem('userProfile', JSON.stringify(formData));
    
    // Show success message
    showToast('Profile updated successfully!', 'success');
    
    console.log('Profile updated:', formData);
  });
}

// Initialize password form
function initPasswordForm() {
  const form = document.getElementById('passwordForm');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters long', 'danger');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'danger');
      return;
    }
    
    // In a real app, this would make an API call
    showToast('Password changed successfully!', 'success');
    
    // Reset form
    form.reset();
    
    console.log('Password changed');
  });
}

// Initialize delete account
function initDeleteAccount() {
  document.getElementById('deleteAccountBtn').addEventListener('click', () => {
    const confirmed = confirm(
      'Are you sure you want to delete your account?\n\n' +
      'This action cannot be undone and all your data will be permanently removed.'
    );
    
    if (confirmed) {
      const doubleConfirmed = confirm('Please confirm one more time. Delete account?');
      
      if (doubleConfirmed) {
        alert('Account deletion request submitted.\n\nIn a real application, this would initiate the account deletion process.');
        console.log('Account deletion requested');
      }
    }
  });
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
  toast.style.zIndex = '9999';
  toast.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

