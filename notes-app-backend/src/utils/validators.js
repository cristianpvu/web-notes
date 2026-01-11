const validateEmail = (email) => {
  return email.endsWith('@stud.ase.ro');
};

const validateNoteData = (data) => {
  if (!data.title || data.title.trim().length === 0) {
    throw new Error('Title is required');
  }
  if (!data.content || data.content.trim().length === 0) {
    throw new Error('Content is required');
  }
  return true;
};

const validateGroupPermission = (permission) => {
  const validPermissions = ['read', 'edit'];
  if (!validPermissions.includes(permission)) {
    throw new Error('Invalid permission. Use: read or edit');
  }
  return true;
};

const validateGroupRole = (role) => {
  const validRoles = ['admin', 'editor', 'viewer'];
  if (!validRoles.includes(role)) {
    throw new Error('Invalid role. Use: admin, editor or viewer');
  }
  return true;
};

module.exports = {
  validateEmail,
  validateNoteData,
  validateGroupPermission,
  validateGroupRole,
};